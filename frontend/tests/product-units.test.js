import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatProductUnit } from '../src/lib/productUnits.js'

test('product units display Vietnamese accents and preserve custom units', () => {
  for (const [unit, expected] of [['cai', 'cái'], [' BO ', 'bộ'], ['tam', 'tấm'], ['chiec', 'chiếc'], ['doi', 'đôi'], ['met', 'mét'], ['bộ', 'bộ'], ['m²', 'm²'], ['thùng', 'thùng'], ['', 'cái'], [null, 'cái'], [undefined, 'cái']]) {
    assert.equal(formatProductUnit(unit), expected)
  }
})
