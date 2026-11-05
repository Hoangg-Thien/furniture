import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { adminApiHeaders } from './admin-auth.mjs'

const base = 'http://127.0.0.1:18080'
const origin = 'http://127.0.0.1:5175'
const artifacts = new URL('../artifacts/product-audit/', import.meta.url)
await fs.mkdir(artifacts, { recursive: true })
const results = []
const errors = []
const suffix = Date.now()
let browser
let page
async function sql(query, params = []) {
  const response = await fetch('http://127.0.0.1:15433', { method: 'POST', body: JSON.stringify({ sql: query, params }) })
  const data = await response.json()
  assert.equal(response.status, 200, JSON.stringify(data))
  return data
}
async function api(path, { method = 'GET', body, token, admin = true, status = 200, headers = {} } = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : admin ? await adminApiHeaders() : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json()
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`)
  return data
}
async function check(name, run) { await run(); results.push(name); console.log('PASS:', name) }
async function shot(name) { await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, artifacts)), animations: 'disabled' }) }
try {
  const admin = await api('/api/auth/admin/session')
  const categories = await api('/api/admin/categories')
  const staff = {}
  const tokens = {}
  for (const staffType of ['SALES', 'WAREHOUSE', 'CONTENT']) {
    staff[staffType] = await api('/api/admin/staff', { method: 'POST', status: 201, body: { username: `audit_${staffType.toLowerCase()}_${suffix}`, password: 'QaPass123!', fullName: `Audit ${staffType}`, staffType } })
    tokens[staffType] = (await api('/api/auth/admin/login', { method: 'POST', body: { username: staff[staffType].username, password: 'QaPass123!' } })).accessToken
  }
  const product = await api('/api/admin/products', { method: 'POST', status: 201, body: { name: `Audit chair ${suffix}`, categoryId: categories[0].id, unit: 'cai', sellingPrice: 100000, quantity: 5, description: 'Original', isActive: true } })
  const historyPath = `/api/admin/products/${product.id}/audit-log`
  const contentPath = `/api/admin/products/${product.id}/content`
  const history = () => api(historyPath)
  const count = async () => Number((await sql('SELECT COUNT(*) AS count FROM product_audit_logs WHERE product_id=$1', [product.id]))[0].count)
  await check('Creation and content changes record real old/new values and the authenticated actor', async () => {
    let entries = await history()
    assert(entries.some(row => row.fieldName === 'name' && row.oldValue === null && JSON.parse(row.newValue) === product.name))
    assert(entries.every(row => row.actorUserId === admin.userId && row.changedAt))
    const before = await count()
    await api(contentPath, { token: tokens.CONTENT, method: 'PUT', body: { name: product.name } })
    assert.equal(await count(), before, 'No-op must not create history')
    await api(contentPath, { token: tokens.CONTENT, method: 'PUT', headers: { 'X-Current-User-Id': String(admin.userId), 'X-Role': 'ADMIN' }, body: { name: `Updated audit ${suffix}`, description: '<script>window.auditInjected = true</script>' } })
    entries = (await history()).slice(0, 2)
    assert.deepEqual(new Set(entries.map(row => row.fieldName)), new Set(['name', 'description']))
    assert(entries.every(row => row.actorUserId === staff.CONTENT.userId && row.actorUsername === staff.CONTENT.username))
    assert.equal(JSON.parse(entries.find(row => row.fieldName === 'description').oldValue), 'Original')
    assert.equal(JSON.parse(entries.find(row => row.fieldName === 'description').newValue), '<script>window.auditInjected = true</script>')
    const logged = await count()
    await api(contentPath, { token: tokens.CONTENT, method: 'PUT', status: 400, body: { name: product.name, sellingPrice: 1, actorUserId: admin.userId } })
    assert.equal(await count(), logged)
  })
  await check('Only Admin can read history; audit APIs have no employee write/delete operation', async () => {
    await api(historyPath, { admin: false, status: 401 })
    for (const token of Object.values(tokens)) await api(historyPath, { token, status: 403 })
    for (const method of ['PUT', 'DELETE', 'POST']) {
      const response = await fetch(base + historyPath, { method, headers: { ...await adminApiHeaders(), 'Content-Type': 'application/json' }, body: '{}' })
      assert([403, 404, 405].includes(response.status))
    }
    await api(historyPath + '?beforeId=0', { status: 400 })
  })
  await check('Admin price/stock/status and all album operations are audited', async () => {
    const current = await api(`/api/admin/products/${product.id}`)
    await api(`/api/admin/products/${product.id}`, { method: 'PUT', body: { ...current, sellingPrice: 200000, quantity: 8 } })
    const money = (await history()).slice(0, 2)
    assert.deepEqual(new Set(money.map(row => row.fieldName)), new Set(['selling_price', 'quantity']))
    assert(money.every(row => row.actorUserId === admin.userId))
    await api(`/api/admin/products/${product.id}/toggle-status`, { method: 'PUT' })
    assert.equal((await history())[0].fieldName, 'is_active')
    await api(`/api/admin/products/${product.id}/images/url`, { token: tokens.CONTENT, method: 'POST', body: { imageUrl: 'https://example.test/first.jpg' } })
    const images = await api(`/api/admin/products/${product.id}/images/url`, { token: tokens.CONTENT, method: 'POST', body: { imageUrl: 'https://example.test/second.jpg' } })
    const second = images.find(image => image.imageUrl.endsWith('second.jpg'))
    await api(`/api/admin/products/${product.id}/images/${second.id}/set-primary`, { token: tokens.CONTENT, method: 'PUT' })
    await api(`/api/admin/products/${product.id}/images/${second.id}`, { token: tokens.CONTENT, method: 'DELETE' })
    const form = new FormData()
    form.append('files', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7S8AAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'audit.png')
    const uploaded = await fetch(`${base}/api/admin/products/${product.id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.CONTENT}` }, body: form })
    assert.equal(uploaded.status, 200)
    const imageLog = (await history()).find(row => row.fieldName === 'images')
    assert.equal(imageLog.actorUserId, staff.CONTENT.userId)
    assert(JSON.parse(imageLog.newValue).some(image => image.image_url.startsWith('/uploads/products/')))
  })
  await check('PostgreSQL rollback preserves the product and discards partial audit writes', async () => {
    const original = await api(`/api/admin/products/${product.id}`)
    const originalCount = await count()
    await sql(`ALTER TABLE product_audit_logs ADD CONSTRAINT audit_failure_probe CHECK (product_id <> ${product.id} OR field_name <> 'description') NOT VALID`)
    try {
      await api(contentPath, { token: tokens.CONTENT, method: 'PUT', status: 500, body: { name: 'Must roll back', description: 'Must fail audit insert' } })
      assert.deepEqual(await api(`/api/admin/products/${product.id}`), original)
      assert.equal(await count(), originalCount)
    } finally { await sql('ALTER TABLE product_audit_logs DROP CONSTRAINT audit_failure_probe') }
  })
  await check('Full migration is repeatable and RLS prevents direct client-role reads', async () => {
    const before = await count()
    const migration = await fs.readFile(new URL('../../backend/src/main/resources/product_audit.sql', import.meta.url), 'utf8')
    for (const statement of migration.split(';').map(part => part.trim()).filter(Boolean)) await sql(statement)
    assert.equal(await count(), before)
    assert.equal((await sql("SELECT relrowsecurity FROM pg_class WHERE oid='public.product_audit_logs'::regclass"))[0].relrowsecurity, true)
    const role = `audit_probe_${suffix}`
    await sql(`CREATE ROLE ${role} NOLOGIN`)
    await sql(`GRANT USAGE ON SCHEMA public TO ${role}`)
    await sql(`GRANT SELECT ON product_audit_logs TO ${role}`)
    await sql(`SET ROLE ${role}`)
    try { assert.equal(Number((await sql('SELECT COUNT(*) AS count FROM product_audit_logs'))[0].count), 0) }
    finally { await sql('RESET ROLE') }
    assert((await count()) > 0)
  })
  await check('Cursor paging returns all changes without duplicates or cross-product records', async () => {
    for (let index = 0; index < 54; index++) await api(contentPath, { token: tokens.CONTENT, method: 'PUT', body: { name: `Audit ${suffix} version ${index}` } })
    const first = await history()
    const second = await api(historyPath + `?beforeId=${first.at(-1).id}`)
    assert.equal(first.length, 50)
    assert(second.length > 0 && second.length < 50)
    assert.equal(new Set([...first, ...second].map(row => row.id)).size, await count())
    assert(first.every(row => row.id > second[0].id))
    const [other] = await sql('SELECT id FROM products WHERE id <> $1 ORDER BY id LIMIT 1', [product.id])
    assert.equal((await api(`/api/admin/products/${other.id}/audit-log`)).length, 0)
  })
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await check('Admin UI shows real history, handles retry/paging safely, and traps/restores keyboard focus', async () => {
    await page.goto(`${origin}/admin`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Tên đăng nhập hoặc email', { exact: true }).fill('admin01')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.locator('.admin-navbar').waitFor()
    await page.getByRole('button', { name: 'Sản phẩm & tồn kho', exact: true }).click()
    const search = page.getByPlaceholder('Tìm theo tên sản phẩm nội thất, kích thước, vật liệu...')
    await search.fill(String(suffix)); await search.press('Enter')
    const opener = page.getByRole('button', { name: `Lịch sử: Audit ${suffix} version 53`, exact: true })
    let fail = false
    await page.route(`**/api/admin/products/${product.id}/audit-log*`, async route => {
      if (fail) return route.fulfill({ status: 503, json: { error: 'QA failure' } })
      await new Promise(resolve => setTimeout(resolve, 250))
      return route.continue()
    })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'Lịch sử thay đổi sản phẩm' })
    await dialog.getByText('Đang tải nhật ký...', { exact: true }).waitFor()
    await page.waitForFunction(() => document.querySelectorAll('.product-audit-scroll tbody tr').length === 50)
    await dialog.getByRole('button', { name: 'Tải thêm', exact: true }).click()
    await page.waitForFunction(() => document.querySelectorAll('.product-audit-scroll tbody tr').length > 50)
    assert.equal(await dialog.locator('script').count(), 0)
    assert.equal(await page.evaluate(() => window.auditInjected), undefined)
    await dialog.getByText('<script>window.auditInjected = true</script>', { exact: true }).first().waitFor()
    await shot('desktop')
    fail = true
    await dialog.getByRole('button', { name: 'Làm mới', exact: true }).click()
    await dialog.getByRole('alert').waitFor()
    fail = false
    await dialog.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await page.waitForFunction(() => document.querySelectorAll('.product-audit-scroll tbody tr').length === 50)
    await dialog.getByRole('button', { name: 'Đóng lịch sử', exact: true }).focus()
    await page.keyboard.press('Shift+Tab')
    assert(await dialog.getByRole('button', { name: 'Đóng', exact: true }).evaluate(element => element === document.activeElement))
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    assert(await opener.evaluate(element => element === document.activeElement))
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      await opener.click()
      await dialog.waitFor()
      await page.waitForFunction(() => document.querySelectorAll('.product-audit-scroll tbody tr').length === 50)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      if (width === 390) await shot('mobile')
      await page.keyboard.press('Escape')
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    const existing = await api('/api/admin/products/1')
    await search.fill(existing.name); await search.press('Enter')
    await page.getByRole('button', { name: `Lịch sử: ${existing.name}`, exact: true }).click()
    await dialog.getByText('Chưa có thay đổi được ghi nhận từ khi bật nhật ký.', { exact: true }).waitFor()
    assert.equal(await dialog.locator('tbody tr').count(), 0)
    await page.keyboard.press('Escape')
  })
  await check('Staff UI has no history button', async () => {
    const content = await browser.newPage()
    await content.addInitScript(({ user, token, base }) => localStorage.setItem('furniture_admin_user', JSON.stringify({ ...user, accessToken: token, staffType: 'CONTENT', apiBaseUrl: base })), { user: { userId: staff.CONTENT.userId, username: staff.CONTENT.username, role: 'STAFF' }, token: tokens.CONTENT, base })
    await content.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await content.goto(`${origin}/admin/products`, { waitUntil: 'domcontentloaded' })
    await content.locator('.admin-table tbody tr').first().waitFor()
    assert.equal(await content.getByRole('button', { name: /^Lịch sử:/ }).count(), 0)
    await content.close()
  })
  assert.deepEqual(errors, [])
  await fs.writeFile(new URL('results.json', artifacts), JSON.stringify({ passed: results.length, results, errors, api: 'real Spring Boot with isolated PGlite' }, null, 2))
  console.log(`ALL ${results.length} PRODUCT AUDIT CHECKS PASSED`)
} catch (error) {
  if (page && !page.isClosed()) await shot('failure')
  console.error(error)
  process.exitCode = 1
} finally { await browser?.close() }
