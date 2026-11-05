import assert from 'node:assert/strict'

const sessions = new Map()
export async function adminApiHeaders(origin = 'http://127.0.0.1:18080') {
  assert.match(origin, /^http:\/\/127\.0\.0\.1:1808[01]$/, 'QA credentials may only be sent to the isolated QA backend')
  if (!sessions.has(origin)) {
    const response = await fetch(`${origin}/api/auth/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin01', password: '123456' }) })
    assert.equal(response.status, 200, 'QA admin login must succeed')
    const data = await response.json()
    assert(data.accessToken)
    sessions.set(origin, data.accessToken)
  }
  return { Authorization: `Bearer ${sessions.get(origin)}` }
}

export async function mockAdminSession(target) {
  await target.route('**/api/auth/admin/session', async route => {
    const user = await route.request().frame().evaluate(() => JSON.parse(localStorage.getItem('furniture_admin_user') || 'null'))
    if (!user?.accessToken || route.request().headers().authorization !== `Bearer ${user.accessToken}`) {
      return route.fulfill({ status: 401, json: { error: 'QA session is missing' } })
    }
    return route.fulfill({ json: { userId: user.userId || user.id || 1, role: user.role, staffType: user.staffType || '', staffId: user.staffId || (user.role === 'STAFF' ? 1 : null), customerId: null } })
  })
}
