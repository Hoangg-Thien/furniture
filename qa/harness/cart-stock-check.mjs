import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { CART_TIMEOUT_MS } from '../../frontend/src/user/lib/cart.js'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  let stock = 2
  let offline = false
  const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/orders/preview') {
      if (offline) return route.abort('failed')
      const items = route.request().postDataJSON().items.map(item => ({ ...item, unitPrice: 100000 }))
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      return route.fulfill({ json: { items, subtotal, discountAmount: 0, shippingFee: 35000, totalAmount: subtotal + 35000 } })
    }
    if (path === '/api/products') {
      if (offline) return route.abort('failed')
      return route.fulfill({ json: [
        { id: 1, name: 'Ghế giới hạn', price: 100000, category: 'Ghế', quantity: stock, imageUrl },
        { id: 2, name: 'Ghế hết hàng', price: 100000, category: 'Ghế', quantity: 0, imageUrl },
        { id: 3, name: 'Ghế chưa xác nhận', price: 100000, category: 'Ghế', imageUrl },
      ] })
    }
    if (path === '/api/orders') return route.fulfill({ json: [{
      id: 42, orderCode: 'FUNI-2026-000042', customer_id: 4, status: 'COMPLETED', order_date: '2026-11-10T10:00:00', total_amount: 9900000,
      items: [{ product_id: 1, product_name: 'Ghế giới hạn', quantity: 99, unit_price: 100000, amount: 9900000, image_url: imageUrl }],
    }] })
    return route.fulfill({ json: [] })
  })
  const url = server.resolvedUrls.local[0]
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const add = page.getByRole('button', { name: 'Thêm Ghế giới hạn vào giỏ hàng', exact: true })
  await add.waitFor()
  assert.equal(await page.getByRole('button', { name: 'Thêm Ghế hết hàng vào giỏ hàng', exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: 'Thêm Ghế chưa xác nhận vào giỏ hàng', exact: true }).isDisabled(), true)
  await add.evaluate(button => { for (let i = 0; i < 20; i++) button.click() })
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('furniture_cart'))?.items?.['1'] === 2)
  assert.equal(await add.isDisabled(), true)
  await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
  const plus = page.getByRole('button', { name: 'Tăng số lượng Ghế giới hạn', exact: true })
  assert.equal(await plus.isDisabled(), true)
  await page.getByRole('button', { name: 'Giảm số lượng Ghế giới hạn', exact: true }).click()
  assert.equal(await plus.isEnabled(), true)
  await plus.click()
  assert.equal(await plus.isDisabled(), true)
  assert.equal((await page.locator('.quantity-control span').innerText()).trim(), '2')
  await page.evaluate(timeout => localStorage.setItem('furniture_cart', JSON.stringify({ items: { 1: 99, 2: 3, 999: 1 }, expiresAt: Date.now() + timeout })), CART_TIMEOUT_MS)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => JSON.stringify(JSON.parse(localStorage.getItem('furniture_cart')).items) === '{"1":2}')
  stock = 1
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('furniture_cart'))?.items?.['1'] === 1)
  stock = 0
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => JSON.stringify(JSON.parse(localStorage.getItem('furniture_cart')).items) === '{}')
  assert.equal(await add.isDisabled(), true)
  stock = 2
  await page.evaluate(() => {
    localStorage.setItem('furniture_customer_user', JSON.stringify({ userId: 5, customerId: 4, role: 'CUSTOMER', fullName: 'Test customer' }))
  })
  await page.goto(new URL('/orders', url).href, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mua Lại', exact: true }).click()
  await page.locator('.cart-item').waitFor()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('furniture_cart'))?.items?.['1'] === 2)
  assert.equal(await plus.isDisabled(), true)
  offline = true
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText('Chưa tải được tồn kho mới nhất. Vui lòng tải lại trang để xác nhận số lượng trước khi mua.').waitFor()
  assert.equal(await plus.isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: /Tiếp tục đặt hàng/ }).isDisabled(), true)
  assert.deepEqual(errors, [])
  console.log('PASS stock limits: rapid clicks stop at 2, cart +/- buttons, unavailable stock, saved cart correction, focus refresh, sold out, reorder 99 capped to 2, offline checkout blocked')
} finally {
  await browser.close()
  await server.close()
}
