import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const orderVoucher = { id: 79, code: 'DON10TR', voucher_type: 'ORDER', program_name: 'Ưu đãi đơn từ 10 triệu', discount_percent: 10, minimum_amount: 10000000, maximum_discount: 1500000, remaining_quantity: 12 }
  const diamondVoucher = { id: 78, code: 'DIAMOND20', voucher_type: 'VIP', customer_tier: 'VIP_DIAMOND', program_name: 'Ưu đãi Kim cương', discount_percent: 10, minimum_amount: 20000000, maximum_discount: 2000000, remaining_quantity: 5 }
  const goldVoucher = { id: 80, code: 'GOLD5', voucher_type: 'VIP', customer_tier: 'GOLD', program_name: 'Ưu đãi Vàng', discount_percent: 5, minimum_amount: 0, maximum_discount: 500000, remaining_quantity: 5 }
  const newCustomer = await browser.newPage({ viewport: { width: 320, height: 740 } })
  await newCustomer.addInitScript(() => {
    sessionStorage.setItem('furniture_customer_user', JSON.stringify({
      userId: 31, customerId: 21, username: 'new-customer', fullName: 'Nguyễn Văn Minh', role: 'CUSTOMER', customerTier: 'NEW',
    }))
    localStorage.setItem('furniture_cart:21', JSON.stringify({ items: { 7: 1 }, expiresAt: Date.now() + 300000 }))
  })
  await newCustomer.route('https://**', route => route.abort())
  await newCustomer.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ json: { customerTier: 'NEW' } })
    if (path === '/api/products') return route.fulfill({ json: [{ id: 7, name: 'Ghế QA', category: 'Ghế', price: 1500000, quantity: 2, imageUrl: '/images/ghe_an_go_soi.jpg' }] })
    if (path === '/api/orders/preview') {
      const items = route.request().postDataJSON().items.map(item => ({ ...item, unitPrice: 1500000 }))
      const subtotal = items[0].quantity * items[0].unitPrice
      const shippingFee = subtotal < 3000000 ? 35000 : 0
      return route.fulfill({ json: { items, subtotal, shippingFee, totalAmount: subtotal + shippingFee, discountAmount: 0 } })
    }
    return route.fulfill({ json: [] })
  })
  await newCustomer.goto(server.resolvedUrls.local[0])
  await newCustomer.locator('button.user-logged-box').click()
  const menu = newCustomer.locator('.user-dropdown-menu')
  await menu.locator('.account-tier[data-tier="NEW"]').filter({ hasText: 'Hạng Khách mới' }).waitFor()
  assert.equal(await menu.getByText(/Miễn phí giao hàng/).count(), 0)
  assert((await menu.boundingBox()).x >= 0)
  await newCustomer.locator('button.user-logged-box').click()
  await newCustomer.getByRole('button', { name: /Mở giỏ hàng/ }).click()
  await newCustomer.locator('.cart-shipping-fee').filter({ hasText: '35.000₫' }).waitFor()
  await newCustomer.locator('.cart-payable').filter({ hasText: '1.535.000₫' }).waitFor()
  await newCustomer.getByRole('button', { name: 'Tăng số lượng Ghế QA' }).click()
  await newCustomer.locator('.cart-shipping-fee').filter({ hasText: 'Miễn phí' }).waitFor()
  await newCustomer.locator('.cart-payable').filter({ hasText: '3.000.000₫' }).waitFor()
  await newCustomer.close()
  console.log('PASS new customer: compact account tier and paid/free cart shipping')
  for (const width of [1440, 390, 320]) {
    for (const tier of ['guest', 'GOLD', 'VIP_DIAMOND']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      const errors = []
      const activeHeaders = []
      const quoteHeaders = []
      let failCartQuote = false
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(tier => {
        sessionStorage.setItem('furniture_custom_api_url', 'http://localhost:8080')
        ;(tier === 'guest' ? sessionStorage : localStorage).setItem(tier === 'guest' ? 'furniture_cart' : 'furniture_cart:21', JSON.stringify({ items: { 7: location.pathname === '/checkout' ? 5 : 1 }, expiresAt: Date.now() + 300000 }))
        if (tier !== 'guest') sessionStorage.setItem('furniture_customer_user', JSON.stringify({ id: 31, customerId: 21, username: 'vip-test', fullName: 'QA Customer', role: 'CUSTOMER', accessToken: tier, apiBaseUrl: 'http://localhost:8080' }))
      }, tier)
      await page.route('https://**', route => route.abort())
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        const auth = route.request().headers().authorization
        const send = (json, status = 200) => route.fulfill({ json, status })
        if (route.request().method() === 'OPTIONS') return send({})
        if (path === '/api/products') return send([{ id: 7, name: 'Sofa QA', price: 12000000, quantity: 10, category: 'Sofa', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }])
        if (path === '/api/vouchers/active') {
          activeHeaders.push(auth)
          const available = [orderVoucher, diamondVoucher, goldVoucher].filter(voucher => !voucher.customer_tier || auth === `Bearer ${voucher.customer_tier}`)
          return send(available)
        }
        if (path === '/api/vouchers/validate') {
          const body = route.request().postDataJSON()
          assert.equal(body.code, orderVoucher.code)
          assert.equal(body.subtotal, orderVoucher.minimum_amount)
          return send({ voucherId: orderVoucher.id, code: orderVoucher.code, discountAmount: 1000000, discountPercent: 10, finalTotal: 9000000 })
        }
        if (path === '/api/orders/preview') {
          const body = route.request().postDataJSON()
          const items = body.items.map(item => ({ ...item, unitPrice: 5000000 }))
          const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
          const voucher = [orderVoucher, diamondVoucher, goldVoucher].find(v => v.id === body.voucherId)
          if (!voucher && failCartQuote) return send({ error: 'Tạm thời không báo giá được' }, 503)
          if (voucher?.customer_tier) {
            quoteHeaders.push(auth)
            if (auth !== `Bearer ${voucher.customer_tier}`) return send({ error: 'Sai hạng' }, 400)
          }
          if (voucher && subtotal < voucher.minimum_amount) return send({ error: 'Đơn chưa đạt mức tối thiểu' }, 400)
          const discount = voucher ? Math.min(subtotal * voucher.discount_percent / 100, voucher.maximum_discount) : 0
          const automaticDiscountAmount = !voucher && body.preferProductDiscounts ? 500000 : 0
          return send({ items, subtotal, automaticDiscountAmount, voucherDiscountAmount: discount, discountAmount: discount + automaticDiscountAmount,
            shippingFee: 0, totalAmount: subtotal - discount - automaticDiscountAmount, itemDiscounts: [], productOffers: [],
            voucherId: voucher?.id ?? null, voucherCode: voucher?.code ?? null, discountLabel: voucher ? `Voucher ${voucher.code}` : null })
        }
        return send([])
      })
      if (tier !== 'guest') {
        await page.goto(server.resolvedUrls.local[0])
        const openWallet = async () => {
          await page.locator('button.user-logged-box').click()
          await page.getByRole('menuitem', { name: 'Voucher của tôi' }).click()
        }
        failCartQuote = true
        await openWallet()
        const wallet = page.getByRole('dialog', { name: 'Kho Voucher & Ưu Đãi' })
        const orderCard = wallet.getByRole('article').filter({ has: page.getByRole('heading', { name: orderVoucher.code, exact: true }) })
        const useOrderVoucher = orderCard.getByRole('button', { name: 'Dùng ngay' })
        const shortfall = orderCard.getByText(/Chưa đủ điều kiện.*5\.000\.000₫/)
        await wallet.getByText('Chưa kiểm tra được giá trị giỏ hàng.').waitFor()
        assert(await useOrderVoucher.isDisabled())
        failCartQuote = false
        await wallet.getByRole('button', { name: 'Thử lại' }).click()
        await shortfall.waitFor()
        assert(await useOrderVoucher.isDisabled())
        assert.equal(await orderCard.getByText(orderVoucher.code, { exact: true }).count(), 1)
        assert.equal(await orderCard.getByText(orderVoucher.program_name, { exact: true }).count(), 0)
        assert.deepEqual(await orderCard.getByRole('button').allTextContents(), ['Dùng ngay'])
        assert.equal(await orderCard.locator('.voucher-discount-val strong').innerText(), '10%')
        await wallet.getByText(tier === 'GOLD' ? 'Dành cho thành viên Vàng' : 'Dành cho thành viên Kim cương', { exact: true }).waitFor()
        assert.equal(await wallet.getByText(tier === 'GOLD' ? diamondVoucher.code : goldVoucher.code, { exact: true }).count(), 0)
        assert(await orderCard.locator('.voucher-footer-row').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
        assert(await wallet.locator('.vouchers-content').evaluate(el => el.scrollWidth <= el.clientWidth + 1))

        await page.keyboard.press('Escape')
        await wallet.waitFor({ state: 'hidden' })
        await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
        await page.getByRole('button', { name: 'Tăng số lượng Sofa QA' }).click()
        await page.getByRole('button', { name: 'Đóng giỏ hàng' }).click()
        await openWallet()
        await page.waitForFunction(() => [...document.querySelectorAll('.voucher-card')].some(card => card.textContent.includes('DON10TR') && !card.querySelector('.voucher-use-btn').disabled))
        assert.equal(await shortfall.count(), 0)
        await useOrderVoucher.click()
        const cart = page.getByRole('dialog', { name: /Món đã chọn/ })
        await cart.waitFor()
        if (tier === 'GOLD' && width === 1440) {
          await cart.getByRole('button', { name: 'Tiếp tục đặt hàng' }).click()
          await page.getByRole('button', { name: 'Bỏ chọn', exact: true }).click()
          await page.locator('.order-product-discount').waitFor()
          await page.getByRole('textbox', { name: 'Mã giảm giá', exact: true }).fill(orderVoucher.code)
          await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
          await page.getByText('Đã áp dụng mã:', { exact: false }).waitFor()
        }
      }
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
  console.log('PASS tier and order vouchers at 320–1440px: authenticated visibility, wallet quote retry, below/exact minimum, and VIP checkout total')
} finally {
  await browser.close()
  await server.close()
}
