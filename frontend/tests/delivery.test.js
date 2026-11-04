import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getDeliveryEstimate } from '../src/user/lib/delivery.js'
import { VIETNAM_LOCATIONS } from '../src/user/lib/vietnamLocations.js'

test('delivery estimates start from approval and cross month/year boundaries', () => {
  assert.deepEqual(getDeliveryEstimate('2026-12-30T10:00:00+07:00', '123 Lê Lợi, Đà Nẵng'), {
    region: 'Miền Trung và Tây Nguyên', days: [2, 3], from: '2027-01-01', to: '2027-01-02',
  })
  const north = getDeliveryEstimate('2026-11-04T10:00:00+07:00', '123 Lê Lợi, Hà Nội')
  assert.equal(north.from, '2026-11-08')
  assert.equal(north.to, '2026-11-09')
})

test('approval dates use Vietnam time even for UTC timestamps near midnight', () => {
  const estimate = getDeliveryEstimate('2026-11-04T18:00:00Z', 'TP. Hồ Chí Minh')
  assert.equal(estimate.from, '2026-11-06')
  assert.equal(estimate.to, '2026-11-07')
})

test('every checkout province has a region and southern destinations use 2–3 days', () => {
  for (const { name } of VIETNAM_LOCATIONS) {
    assert.ok(getDeliveryEstimate('2026-11-04T10:00:00+07:00', `123 Lê Lợi, ${name}`), name)
  }
  assert.deepEqual(getDeliveryEstimate('2026-11-04T10:00:00+07:00', 'Tỉnh Đồng Nai').days, [2, 3])
})

test('missing approval dates or unknown destinations never fabricate an estimate', () => {
  for (const approvedAt of [null, '', 'invalid']) assert.equal(getDeliveryEstimate(approvedAt, 'Hà Nội'), null)
  for (const address of [null, '', 'Số 12 đường Hà Nội']) assert.equal(getDeliveryEstimate('2026-11-04T10:00:00+07:00', address), null)
})
