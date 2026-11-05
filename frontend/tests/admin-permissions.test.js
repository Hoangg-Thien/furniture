import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedAdminModules, canAccessModule, defaultAdminModule, canManageProducts, canEditProductContent, canProcessOrders } from '../src/lib/adminPermissions.js'

test('staff positions have only their assigned modules and landing pages', () => {
  for (const [staffType, expected] of Object.entries({ SALES: ['orders', 'invoices', 'customers', 'products'], WAREHOUSE: ['suppliers', 'products', 'orders'], CONTENT: ['products'] })) {
    const user = { role: 'STAFF', staffType }
    assert.deepEqual(allowedAdminModules(user), expected)
    assert.equal(defaultAdminModule(user), expected[0])
    for (const module of ['users', 'staff', 'categories', 'promotions', 'reports', 'dashboard']) assert.equal(canAccessModule(user, module), false)
  }
  for (const user of [null, {}, { role: 'STAFF' }, { role: 'STAFF', staffType: 'ADMIN' }, { role: 'CUSTOMER', staffType: 'SALES' }]) {
    assert.deepEqual(allowedAdminModules(user), [])
  }
})

test('content and stock permissions never grant full product writes or order processing', () => {
  for (const staffType of ['SALES', 'WAREHOUSE', 'CONTENT']) {
    const user = { role: 'STAFF', staffType }
    assert.equal(canManageProducts(user), false)
    assert.equal(canEditProductContent(user), staffType === 'CONTENT')
    assert.equal(canProcessOrders(user), staffType === 'SALES')
  }
  assert.equal(canManageProducts({ role: 'ADMIN' }), true)
  assert.equal(defaultAdminModule({ role: 'ADMIN' }), 'dashboard')
})

test('admin token is attached only to its backend and expired API sessions emit a sign-out event', async () => {
  const storage = new Map()
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  storage.set('furniture_admin_user', JSON.stringify({ accessToken: 'test-token', apiBaseUrl: 'http://localhost:8080' }))
  const calls = []
  const events = []
  globalThis.window = { location: { href: 'http://localhost/' }, dispatchEvent: event => events.push(event.type), fetch: async (resource, init) => {
    calls.push({ resource, headers: new Headers(init.headers) })
    return { status: resource.includes('expired') ? 401 : 200 }
  } }
  try {
    await import('../src/lib/apiConfig.js?admin-permissions-test')
    await window.fetch('http://localhost:8080/api/admin/products')
    assert.equal(calls.at(-1).headers.get('Authorization'), 'Bearer test-token')
    for (const url of ['https://other.example/api/admin/products', 'http://localhost:8080/api/products', 'http://localhost:8080/api/administer/products']) {
      await window.fetch(url)
      assert.equal(calls.at(-1).headers.get('Authorization'), null)
    }
    await window.fetch('http://localhost:8080/api/admin/expired')
    assert.deepEqual(events, ['admin-session-expired'])
    storage.set('furniture_custom_api_url', 'https://new-backend.example')
    await window.fetch('https://new-backend.example/api/admin/products')
    assert.equal(calls.at(-1).headers.get('Authorization'), null)
  } finally {
    delete globalThis.window
    delete globalThis.localStorage
  }
})
