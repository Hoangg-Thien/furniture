import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const quantities = [0, 1, 5, 6, 30, null]
  await page.route('**/api/products', route => route.fulfill({ json: quantities.map((quantity, id) => ({
    id: id + 1, name: `Stock fixture ${id}`, category: 'Test', price: 100000, quantity, imageUrl: '/images/sofa_goc_chu_L.jpg',
  })) }))
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  await page.goto(server.resolvedUrls.local[0])
  await page.locator('.product-card').last().waitFor()
  assert.equal(await page.locator('.product-card').count(), quantities.length)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [index, quantity] of quantities.entries()) {
      const card = page.locator('.product-card').filter({ hasText: `Stock fixture ${index}` })
      const label = card.locator('.product-stock')
      if (quantity !== null && quantity > 5) {
        assert.equal(await label.count(), 0)
      } else {
        assert.equal(await label.textContent(), quantity === null ? 'Chưa xác nhận tồn kho' : quantity === 0 ? 'Hết hàng' : `Còn ${quantity} sản phẩm`)
      }
      assert.equal(await card.locator('.quick-add').isDisabled(), quantity === null || quantity === 0)
    }
    console.log(`PASS stock visibility at ${width}px: 0, 1, 5, 6, 30 and unknown stock`)
  }
  const available = page.locator('.product-card').filter({ hasText: 'Stock fixture 3' })
  const add = available.locator('.quick-add')
  await add.click()
  await available.locator('.quick-add.is-added').waitFor({ state: 'detached' })
  assert.equal(await add.textContent(), 'Đã thêm')
  assert.equal(await add.locator('.lucide-check').count(), 1)
  await add.click()
  assert.equal(await available.locator('.product-cart-tag strong').textContent(), '2')

  const lastInStock = page.locator('.product-card').filter({ hasText: 'Stock fixture 1' }).locator('.quick-add')
  await lastInStock.click()
  assert.equal(await lastInStock.textContent(), 'Đã thêm')
  assert.equal(await lastInStock.locator('.lucide-check').count(), 1)
  assert.equal(await lastInStock.isDisabled(), true)
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
  await server.close()
}
