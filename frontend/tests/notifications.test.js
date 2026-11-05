import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { getOrderNotifications, loadReadNotificationIds, saveReadNotificationIds } from '../src/lib/notifications.js'

beforeEach(() => {
  const values = new Map()
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
})
afterEach(() => { delete globalThis.localStorage })

test('order notifications cover the actual lifecycle and ignore unsupported records', () => {
  const statuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED']
  const items = getOrderNotifications([...statuses.map((status, index) => ({ id: index + 1, status })), null, { id: 6, status: 'UNKNOWN' }])
  assert.equal(items.length, 5)
  assert.match(items[2].title, /vận chuyển/)
  assert.match(items[2].description, /điện thoại/)
  assert.deepEqual(items.map(item => item.orderId), [1, 2, 3, 4, 5])
})

test('reading one stage does not hide a later stage of the same order', () => {
  const [approved] = getOrderNotifications([{ id: 42, status: 'CONFIRMED' }])
  const [shipping] = getOrderNotifications([{ id: 42, status: 'SHIPPING' }])
  saveReadNotificationIds('customer_4', new Set([approved.id]))
  const read = loadReadNotificationIds('customer_4')
  assert.equal(read.has(approved.id), true)
  assert.equal(read.has(shipping.id), false)
  assert.equal(loadReadNotificationIds('customer_5').size, 0)
  assert.equal(loadReadNotificationIds('admin_4').size, 0)
})

test('corrupt and blocked storage never prevents reading notifications', () => {
  localStorage.setItem('broken', '{')
  localStorage.setItem('object', '{}')
  localStorage.setItem('mixed', '["order-42-SHIPPING", null, 5]')
  assert.equal(loadReadNotificationIds('broken').size, 0)
  assert.equal(loadReadNotificationIds('object').size, 0)
  assert.deepEqual([...loadReadNotificationIds('mixed')], ['order-42-SHIPPING'])
  globalThis.localStorage = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('blocked') },
  }
  assert.equal(loadReadNotificationIds('any').size, 0)
  assert.doesNotThrow(() => saveReadNotificationIds('any', new Set(['order-42-SHIPPING'])))
})
