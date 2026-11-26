import { adminApiHeaders } from './admin-auth.mjs'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '../..')
const runtime = path.join(root, 'qa/runtime/clean/backend')
fs.mkdirSync(runtime, { recursive: true })
fs.mkdirSync(path.resolve(runtime, '../database'), { recursive: true })
fs.copyFileSync(path.join(root, 'database/sales.sql'), path.resolve(runtime, '../database/sales.sql'))
fs.copyFileSync(path.join(root, 'database/admin_schema_extension.sql'), path.resolve(runtime, '../database/admin_schema_extension.sql'))
const db = await PGlite.create()
const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 15434 })
await socket.start()
const cp = fs.readFileSync(path.join(root, 'qa/artifacts/classpath.txt'), 'utf8').trim()
const fd = fs.openSync(path.join(root, 'qa/artifacts/clean-start.log'), 'w')
const javaExecutable = process.env.QA_JAVA || 'C:/Program Files/Java/jdk-26.0.2.1/bin/java.exe'
let java = spawn(javaExecutable, ['-cp', `${root}/backend/target/classes;${cp}`, 'furniture.Application',
  `--spring.config.location=file:${root.replaceAll('\\', '/')}/backend/src/main/resources/application.yaml`,
  '--server.address=127.0.0.1', '--server.port=18081', '--spring.datasource.url=jdbc:postgresql://127.0.0.1:15434/postgres?sslmode=disable&prepareThreshold=0',
  '--spring.datasource.username=postgres', '--spring.datasource.password=qa-local-only',
  '--spring.datasource.hikari.maximum-pool-size=1', '--spring.datasource.hikari.minimum-idle=1', '--logging.level.root=WARN'],
  { cwd: runtime, stdio: ['ignore', fd, fd], windowsHide: true })
const result = { endpoints: [], schema: null }
try {
  let ready = false
  for (let i = 0; i < 50; i++) {
    try { await fetch('http://127.0.0.1:18081/api/products'); ready = true; break } catch { await new Promise(r => setTimeout(r, 500)) }
  }
  if (!ready) throw Error('Clean backend not ready after 25 seconds')
  await new Promise(r => setTimeout(r, 1500))
  for (const route of ['/api/products', '/api/admin/categories', '/api/admin/products', '/api/admin/invoices', '/api/auth/login']) {
    const r = await fetch(`http://127.0.0.1:18081${route}`, route.endsWith('login') ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin01', password: '123456' }) } : { headers: await adminApiHeaders('http://127.0.0.1:18081') })
    result.endpoints.push({ route, status: r.status, response: (await r.text()).replace(/("accessToken"\s*:\s*")[^"]+(")/g, '$1[redacted]$2').slice(0, 1200) })
    assert.equal(r.status, 200, `Clean startup: ${route}`)
  }
  await db.exec('ROLLBACK')
  result.schema = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows
  result.counts = (await db.query('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM products) AS products')).rows
  assert(result.schema.some(table => table.table_name === 'admin_sessions'))
  assert(result.schema.some(table => table.table_name === 'product_audit_logs'))
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.product_audit_logs'::regclass")).rows[0].relrowsecurity, true)
  assert.equal(Number((await db.query('SELECT COUNT(*) AS count FROM product_audit_logs')).rows[0].count), 0, 'Startup must not invent historical product changes')
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.admin_activity_notifications'::regclass")).rows[0].relrowsecurity, true)
  assert.equal(Number((await db.query('SELECT COUNT(*) AS count FROM admin_activity_notifications')).rows[0].count), 0, 'Startup must not invent staff activities')
  const base = 'http://127.0.0.1:18081'
  const adminHeaders = { ...await adminApiHeaders(base), 'Content-Type': 'application/json' }
  const voucherResponse = await fetch(`${base}/api/admin/promotions/vouchers`, { headers: adminHeaders })
  assert.equal(voucherResponse.status, 200)
  const memberVouchers = (await voucherResponse.json()).filter(voucher => voucher.code.startsWith('UUDAI'))
    .sort((a, b) => a.discountPercent - b.discountPercent)
  assert.deepEqual(memberVouchers.map(voucher => [voucher.code, voucher.customerTier, voucher.discountPercent]), [
    ['UUDAIBAC', 'SILVER', 5], ['UUDAIVANG', 'GOLD', 7], ['UUDAIBACHKIM', 'PLATINUM', 8], ['UUDAIKIMCUONG', 'VIP_DIAMOND', 10],
  ])
  assert(memberVouchers.every(voucher => voucher.status === 'INACTIVE' && voucher.voucherType === 'VIP'
    && voucher.minimumAmount === 5000000 && voucher.maximumDiscount === 1000000 && voucher.quantity === 100))
  const memberGoldId = memberVouchers[1].id
  const username = `notification_${Date.now()}`
  const staffResponse = await fetch(`${base}/api/admin/staff`, { method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ username, password: 'QaPass123!', fullName: 'Notification QA', staffType: 'WAREHOUSE' }) })
  assert.equal(staffResponse.status, 201)
  const login = await fetch(`${base}/api/auth/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: 'QaPass123!' }) })
  const staffHeaders = { Authorization: `Bearer ${(await login.json()).accessToken}`, 'Content-Type': 'application/json' }
  const created = await fetch(`${base}/api/admin/suppliers`, { method: 'POST', headers: staffHeaders, body: JSON.stringify({ name: 'Notification supplier' }) })
  assert.equal(created.status, 201)
  const supplier = await created.json()
  // The response can arrive before afterCompletion finishes writing the activity.
  let feed = []
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`${base}/api/admin/notifications/activities`, { headers: adminHeaders })
    assert.equal(response.status, 200)
    feed = await response.json()
    if (feed.length) break
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  assert.equal(feed.length, 1)
  assert.equal(feed[0].actorUsername, username)
  assert.equal(feed[0].title, 'Thêm nhà cung cấp')
  assert.equal((await fetch(`${base}/api/admin/notifications/activities`, { headers: staffHeaders })).status, 403)
  assert.equal((await fetch(`${base}/api/admin/products?lowStock=true`, { headers: staffHeaders })).status, 200)
  const migration = fs.readFileSync(path.join(root, 'backend/src/main/resources/admin_activity.sql'), 'utf8')
  await db.exec(migration)
  assert.equal(Number((await db.query('SELECT COUNT(*) AS count FROM admin_activity_notifications')).rows[0].count), 1)
  await db.exec('CREATE ROLE notification_client NOLOGIN; GRANT USAGE ON SCHEMA public TO notification_client; GRANT SELECT ON admin_activity_notifications TO notification_client; SET ROLE notification_client')
  try { assert.equal(Number((await db.query('SELECT COUNT(*) AS count FROM admin_activity_notifications')).rows[0].count), 0) }
  finally { await db.exec('RESET ROLE') }
  result.notifications = { activity: feed[0].title, supplierId: supplier.id, staffFeedStatus: 403, rls: 'PASS', repeatMigration: 'PASS' }
  assert.equal((await db.query("SELECT COUNT(*)::int AS count FROM staff WHERE staff_type NOT IN ('SALES', 'WAREHOUSE', 'CONTENT')")).rows[0].count, 0)
  assert.equal((await db.query("SELECT COUNT(*)::int AS count FROM admin_sessions WHERE expires_at NOT BETWEEN CURRENT_TIMESTAMP + INTERVAL '479' MINUTE AND CURRENT_TIMESTAMP + INTERVAL '481' MINUTE")).rows[0].count, 0, 'Session expiry must use database time')
  const seedPath = path.resolve(runtime, '../database/sales.sql')
  const seedBefore = fs.readFileSync(seedPath, 'utf8')
  const registration = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `seed_check_${Date.now()}`, password: 'QaPass123!', fullName: 'Seed check', email: `seed-${Date.now()}@example.test`, phone: '0901234567', address: '123 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP. Ho Chi Minh' }) })
  assert.equal(registration.status, 201)
  assert.equal(fs.readFileSync(seedPath, 'utf8'), seedBefore, 'Registration must not write personal data into seed SQL')
  await db.exec("UPDATE orders SET order_date='2020-01-02 03:04:05', total_amount=1, discount_amount=10, voucher_id=(SELECT id FROM vouchers ORDER BY id LIMIT 1) WHERE id=23")
  const removal = await fetch(`${base}/api/admin/promotions/vouchers/${memberVouchers[0].id}`, {
    method: 'DELETE', headers: adminHeaders,
  })
  assert.equal(removal.status, 200)
  assert.equal((await removal.json()).archived, false)
  await db.exec("UPDATE vouchers SET status='ACTIVE', used_quantity=2, discount_percent=9, minimum_amount=6000000 WHERE code='UUDAIVANG'")
  const args = java.spawnargs.slice(1)
  const stopped = once(java, 'exit')
  java.kill()
  await stopped
  java = spawn(javaExecutable, args, { cwd: runtime, stdio: ['ignore', fd, fd], windowsHide: true })
  let restarted = false
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${base}/api/products`)
      if (response.ok) { restarted = true; break }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  assert(restarted, 'Restart must finish')
  // Wait for the startup runner as well as the web listener.
  await new Promise(resolve => setTimeout(resolve, 1500))
  const preserved = (await db.query("SELECT to_char(order_date, 'YYYY-MM-DD HH24:MI:SS') AS date, total_amount FROM orders WHERE id=23")).rows[0]
  assert.equal(preserved.date, '2020-01-02 03:04:05')
  assert.equal(Number(preserved.total_amount), 1, 'Startup must not rewrite historical order totals')
  const restartedVouchers = (await db.query("SELECT id::int, code, status, used_quantity, discount_percent::int, minimum_amount::int FROM vouchers WHERE code LIKE 'UUDAI%' ORDER BY code")).rows
  assert.equal(restartedVouchers.length, 4)
  assert.equal(restartedVouchers.find(voucher => voucher.code === 'UUDAIBAC').status, 'INACTIVE')
  assert.deepEqual(restartedVouchers.find(voucher => voucher.code === 'UUDAIVANG'),
    { id: memberGoldId, code: 'UUDAIVANG', status: 'ACTIVE', used_quantity: 2, discount_percent: 9, minimum_amount: 6000000 })
  const campaignUrl = id => `${base}/api/admin/promotions/${id}`
  const deleteCampaign = id => fetch(campaignUrl(id), { method: 'DELETE', headers: adminHeaders })
  assert.equal((await deleteCampaign(memberVouchers[1].promotionProgramId)).status, 409)
  const draft = (await db.query(`
    INSERT INTO promotion_programs (name, start_date, end_date, status)
    VALUES ('QA paused campaign', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1' DAY, 'INACTIVE')
    RETURNING id`)).rows[0]
  await db.query("UPDATE vouchers SET promotion_program_id = $1 WHERE code IN ('UUDAIBACHKIM', 'UUDAIKIMCUONG')", [draft.id])
  assert.equal((await deleteCampaign(draft.id)).status, 200)
  assert.equal((await fetch(campaignUrl(draft.id), { headers: adminHeaders })).status, 404)
  assert.equal((await db.query('SELECT id FROM vouchers WHERE promotion_program_id = $1', [draft.id])).rows.length, 0)
  result.memberVouchers = { freshStartup: 4, missingPresetRestored: true, existingVoucherPreserved: true }
  result.dataPreservation = { registrationDoesNotEditSeed: true, restartPreservesOrderDateAndTotal: true }
} catch (e) { result.error = e.message; process.exitCode = 1 }
finally {
  fs.writeFileSync(path.join(root, 'qa/artifacts/clean-start-results.json'), JSON.stringify(result, null, 2))
  java.kill()
  await socket.stop()
  await db.close()
}
console.log(JSON.stringify(result))
