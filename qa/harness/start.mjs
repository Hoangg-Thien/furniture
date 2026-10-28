import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { spawn } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '../..')
const artifacts = path.join(root, 'qa/artifacts')
const runtime = path.join(root, 'qa/runtime')
fs.mkdirSync(runtime, { recursive: true })
fs.mkdirSync(path.join(root, 'qa/database'), { recursive: true })
const sql = fs.readFileSync(path.join(root, 'database/sales.sql'), 'utf8')
fs.writeFileSync(path.join(root, 'qa/database/sales.sql'), sql)
let db = await PGlite.create()
const seed = { strictImport: null, skipped: [], adjustments: [] }
try {
  await db.exec(sql)
  seed.strictImport = 'PASS'
} catch (e) {
  seed.strictImport = { message: e.message, code: e.code, detail: e.detail }
  await db.close()
  db = await PGlite.create()
  const clean = sql.split(/\r?\n/).filter(l => !l.trim().startsWith('--')).join('\n')
  for (const statement of clean.split(';')) {
    const s = statement.trim()
    if (!s || /^(BEGIN|COMMIT)$/i.test(s)) continue
    try { await db.exec(s) } catch (e) {
      seed.skipped.push({ sql: s.slice(0, 230), message: e.message, detail: e.detail })
    }
  }
}
await db.exec(fs.readFileSync(path.join(root, 'database/admin_schema_extension.sql'), 'utf8'))
for (const { table_name } of (await db.query("SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='id' AND column_default LIKE 'nextval%'")).rows) {
  await db.exec(`SELECT setval(pg_get_serial_sequence('public.${table_name}', 'id'), COALESCE((SELECT MAX(id) FROM public.${table_name}),0)+1, false)`)
  seed.adjustments.push(`Reset sequence: ${table_name}`)
}
fs.writeFileSync(path.join(artifacts, 'seed-results.json'), JSON.stringify(seed, null, 2))
const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 15432, maxConnections: 2 })
await socket.start()
const control = http.createServer(async (req, res) => {
  let body = ''
  for await (const part of req) body += part
  try {
    const { sql, params = [] } = JSON.parse(body)
    const result = await db.query(sql, params)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result.rows))
  } catch (e) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: e.message }))
  }
})
control.listen(15433, '127.0.0.1')
const cp = fs.readFileSync(path.join(artifacts, 'classpath.txt'), 'utf8').trim()
const backendLog = fs.openSync(path.join(artifacts, 'backend-runtime.log'), 'w')
const javaExecutable = process.env.QA_JAVA || 'C:/Program Files/Java/jdk-26.0.2.1/bin/java.exe'
const backend = spawn(javaExecutable, ['-cp', `${root}/backend/target/classes;${cp}`, 'furniture.Application',
  `--spring.config.location=file:${root.replaceAll('\\', '/')}/backend/src/main/resources/application.yaml`,
  '--server.address=127.0.0.1', '--server.port=18080',
  '--spring.datasource.url=jdbc:postgresql://127.0.0.1:15432/postgres?sslmode=disable&prepareThreshold=0',
  '--spring.datasource.username=postgres', '--spring.datasource.password=qa-local-only',
  '--spring.datasource.hikari.maximum-pool-size=1', '--spring.datasource.hikari.minimum-idle=1',
  '--spring.jpa.hibernate.ddl-auto=none', '--logging.level.root=WARN'],
  { cwd: runtime, stdio: ['ignore', backendLog, backendLog], windowsHide: true })
const frontendLog = fs.openSync(path.join(artifacts, 'frontend-runtime.log'), 'w')
const frontend = spawn('node', [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5175'],
  { cwd: path.join(root, 'frontend'), env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:18080' }, stdio: ['ignore', frontendLog, frontendLog], windowsHide: true })
console.log(JSON.stringify({ backendPid: backend.pid, frontendPid: frontend.pid, strictImport: seed.strictImport, skipped: seed.skipped.length }))
backend.on('exit', code => console.log(`Backend exited: ${code}`))
async function stop() {
  backend.kill()
  frontend.kill()
  control.close()
  await socket.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
