import test from 'node:test'
import assert from 'node:assert/strict'
import { parseVoucherCustomerId } from '../src/lib/vouchers.js'

test('voucher simulation accepts displayed customer codes and numeric IDs', () => {
  for (const code of ['C021', 'c021', '21', '  C021  ']) {
    assert.equal(parseVoucherCustomerId(code), 21)
  }
  assert.equal(parseVoucherCustomerId('C1234'), 1234)
  assert.equal(parseVoucherCustomerId('  '), null)
  for (const code of ['C', 'C000', '0', '-21', '21.5', 'C21abc', 'KH021', '1e2', '9007199254740992']) {
    assert.throws(() => parseVoucherCustomerId(code), /Mã khách hàng không hợp lệ/)
  }
})
