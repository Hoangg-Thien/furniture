import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '../..')
const runtime = path.join(root, 'qa/runtime/clean/backend')
fs.mkdirSync(runtime, { recursive: true })
fs.mkdirSync(path.resolve(runtime, '../database'), { recursive: true })
fs.copyFileSync(path.join(root, 'database/sales.sql'), path.resolve(runtime, '../database/sales.sql'))
const db = await PGlite.create()
const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 15434 })
await socket.start()
const cp = fs.readFileSync(path.join(root, 'qa/artifacts/classpath.txt'), 'utf8').trim()
const fd = fs.openSync(path.join(root, 'qa/artifacts/clean-start.log'), 'w')
const javaExecutable = process.env.QA_JAVA || 'C:/Program Files/Java/jdk-26.0.2.1/bin/java.exe'
const java = spawn(javaExecutable, ['-cp', `${root}/backend/target/classes;${cp}`, 'furniture.Application',
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
    const r = await fetch(`http://127.0.0.1:18081${route}`, route.endsWith('login') ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin01', password: '123456' }) } : {})
    result.endpoints.push({ route, status: r.status, response: (await r.text()).slice(0, 1200) })
  }
  await db.exec('ROLLBACK')
  result.schema = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows
  result.counts = (await db.query('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM products) AS products')).rows
} catch (e) { result.error = e.message }
finally {
  fs.writeFileSync(path.join(root, 'qa/artifacts/clean-start-results.json'), JSON.stringify(result, null, 2))
  java.kill()
  await socket.stop()
  await db.close()
}
console.log(JSON.stringify(result))
