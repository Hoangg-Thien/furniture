import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  for (const width of [1440, 390]) {
    for (const tier of ['guest', 'GOLD', 'VIP_DIAMOND']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      const errors = []
      const activeHeaders = []
      const quoteHeaders = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(tier => {
        localStorage.setItem('furniture_custom_api_url', 'http://localhost:8080')
        localStorage.setItem('furniture_cart', JSON.stringify({ items: { 7: 1 }, expiresAt: Date.now() + 300000 }))
        if (tier !== 'guest') localStorage.setItem('furniture_customer_user', JSON.stringify({ id: 31, customerId: 21, username: 'vip-test', fullName: 'QA Customer', role: 'CUSTOMER', accessToken: tier, apiBaseUrl: 'http://localhost:8080' }))
      }, tier)
      await page.route('https://**', route => route.abort())
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        const auth = route.request().headers().authorization
        const send = (json, status = 200) => route.fulfill({ json, status })
        if (route.request().method() === 'OPTIONS') return send({})
        if (path === '/api/products') return send([{ id: 7, name: 'Sofa QA', price: 25000000, quantity: 10, category: 'Sofa', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }])
        if (path === '/api/vouchers/active') {
          activeHeaders.push(auth)
          return send(auth === 'Bearer VIP_DIAMOND' ? [{ id: 78, code: 'DIAMOND20', voucher_type: 'VIP', customer_tier: 'VIP_DIAMOND', discount_percent: 10, minimum_amount: 20000000, maximum_discount: 2000000 }] : [])
        }
        if (path === '/api/orders/preview') {
          const body = route.request().postDataJSON()
          if (body.voucherId === 78) {
            quoteHeaders.push(auth)
            if (auth !== 'Bearer VIP_DIAMOND') return send({ error: 'Wrong tier' }, 400)
          }
          const discount = body.voucherId === 78 ? 2000000 : 0
          return send({ items: [{ productId: 7, quantity: 1, unitPrice: 25000000 }], subtotal: 25000000,
            automaticDiscountAmount: 0, voucherDiscountAmount: discount, discountAmount: discount,
            shippingFee: 0, totalAmount: 25000000 - discount, itemDiscounts: [], productOffers: [],
            voucherId: discount ? 78 : null, voucherCode: discount ? 'DIAMOND20' : null, discountLabel: discount ? 'Voucher DIAMOND20' : null })
        }
        return send([])
      })
      await page.goto(new URL('/checkout', server.resolvedUrls.local[0]).href)
      const trigger = page.locator('.checkout-voucher-trigger')
      await trigger.waitFor()
      await page.waitForFunction(() => !document.querySelector('.checkout-voucher-trigger')?.disabled)
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Chọn voucher', exact: true })
      await dialog.waitFor()
      assert(activeHeaders.length > 0)
      assert.equal(activeHeaders[0], tier === 'guest' ? undefined : `Bearer ${tier}`)
      if (tier === 'VIP_DIAMOND') {
        await dialog.locator('.checkout-voucher-option').filter({ hasText: 'DIAMOND20' }).waitFor()
        await page.waitForFunction(() => document.querySelector('.order-voucher-discount')?.textContent.includes('2.000.000'))
        assert(quoteHeaders.includes('Bearer VIP_DIAMOND'))
        assert.match(await page.locator('.order-grand-total').innerText(), /23\.000\.000/)
      } else {
        assert.equal(await dialog.getByText('DIAMOND20', { exact: true }).count(), 0)
      }
      assert.deepEqual(errors, [])
      await page.close()
    }
  }
  console.log('PASS VIP checkout desktop/mobile: customer token, exact tier visibility, guest excluded, 25m basket -> 2m capped discount -> 23m total')
} finally {
  await browser.close()
  await server.close()
}
