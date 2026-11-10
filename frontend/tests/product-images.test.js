import test from 'node:test'
import assert from 'node:assert/strict'
import { productImageUrl, validateProductImage } from '../src/lib/productImages.js'

test('uploaded images load from backend while existing web and bundled URLs stay intact', () => {
  assert.equal(productImageUrl('/uploads/products/test.png'), 'http://localhost:8080/uploads/products/test.png')
  for (const url of ['https://example.com/image.jpg', '/images/sofa.jpg', '']) assert.equal(productImageUrl(url), url)
  assert.equal(productImageUrl(null), '')
})

test('file picker accepts supported images up to 5 MB and rejects empty or unsafe files', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
    assert.equal(validateProductImage({ type, size: 5 * 1024 * 1024 }), '')
  }
  for (const file of [{ type: 'text/html', size: 100 }, { type: 'image/svg+xml', size: 100 },
    { type: 'image/png', size: 0 }, { type: 'image/png', size: 5 * 1024 * 1024 + 1 }]) {
    assert.notEqual(validateProductImage(file), '')
  }
})
