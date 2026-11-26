import { mockAdminSession } from './admin-auth.mjs'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  const previews = []
  const submissions = []
  let failEligible = true
  let failPreview = false
  let failCreate = true
  let failDetail = false
  let delayLegacy = false
  let releaseLegacy
  let legacyStarted
  let legacyReady
  let releaseFirstOrder
  let firstOrderStarted
  const firstOrderReady = new Promise(resolve => { firstOrderStarted = resolve })
  let created = null
  const imageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"/>'
  const order = id => ({ id, customerName: `Khách hàng ${id}`, phone: '0901234567', address: '123 Nguyễn Huệ, TP. Hồ Chí Minh', status: 'COMPLETED', voucherCode: 'EXPIRED', orderDate: '2026-11-05T10:00:00', items: [{ productName: 'Ghế nội thất', quantity: 1, unit: 'cai', unitPrice: id * 100000, amount: id * 100000, imageUrl }] })
  const legacy = { ...order(3), id: 78, invoiceCode: 'OLD-78', orderId: 3, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'PAID', subtotalAmount: 300000, paymentDate: '2026-11-05T10:00:00', staffName: 'Nguyễn Văn An', finalAmount: 300000, qrCodeUrl: 'https://example.test/legacy-qr.png' }
  legacy.items = [{ ...order(3).items[0], productName: 'Sofa góc chữ L vải bọc Milan', unitPrice: 14500000, amount: 14500000 }]
  legacy.subtotalAmount = legacy.finalAmount = 14500000
  page.on('pageerror', error => errors.push(error.message))
  page.on('dialog', dialog => dialog.accept())
  await page.addInitScript(() => {
    sessionStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080', username: 'invoice-test' }))
    window.printCalls = 0
    window.print = () => window.printCalls++
  })
  await page.route('https://**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()
    if (path === '/api/products' || path === '/api/admin/categories') return route.fulfill({ json: [] })
    if (path === '/api/admin/invoices/eligible-orders') return route.fulfill(failEligible
      ? { status: 500, json: { error: 'Unavailable' } }
      : { json: [1, 2].map(id => ({ orderId: id, customerName: `Khách hàng ${id}`, totalAmount: id * 100000, status: 'COMPLETED' })) })
    if (path === '/api/admin/orders/1') {
      await new Promise(resolve => { releaseFirstOrder = resolve; firstOrderStarted() })
      return route.fulfill({ json: order(1) }).catch(() => {})
    }
    if (path === '/api/admin/orders/2') return route.fulfill({ json: order(2) })
    if (path === '/api/admin/invoices/preview-calculation') {
      const body = route.request().postDataJSON()
      previews.push(body)
      if (failPreview) return route.fulfill({ status: 400, json: { error: 'Không thể tính tiền hóa đơn thử nghiệm.' } }).catch(() => {})
      const subtotal = body.orderId * 100000
      return route.fulfill({ json: { orderId: body.orderId, originalSubtotal: subtotal + 10000, orderDiscount: 10000, voucherDiscount: 0, voucherCode: 'EXPIRED', voucherValid: true, vatPercent: 0, vatAmount: 0, finalAmount: subtotal } }).catch(() => {})
    }
    if (path === '/api/admin/invoices' && method === 'POST') {
      const body = route.request().postDataJSON()
      submissions.push(body)
      if (failCreate) return route.fulfill({ status: 400, json: { error: 'Chưa thể lưu hóa đơn. Vui lòng thử lại.' } })
      created = { ...order(body.orderId), id: 77, invoiceCode: 'INV-TEST-77', orderId: body.orderId, paymentMethod: body.paymentMethod, paymentStatus: 'PAID', subtotalAmount: 210000, discountAmount: 10000, voucherDiscount: 0, voucherCode: body.voucherCode, taxAmount: 0, finalAmount: 200000, notes: body.notes }
      return route.fulfill({ status: 201, json: created })
    }
    if (path === '/api/admin/invoices/77/pdf') return route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' })
    if (path === '/api/admin/invoices/77') return route.fulfill({ json: created })
    if (path === '/api/admin/invoices/78') {
      if (failDetail) return route.fulfill({ status: 500, json: {} })
      if (delayLegacy) await new Promise(resolve => { releaseLegacy = resolve; legacyStarted() })
      return route.fulfill({ json: legacy }).catch(() => {})
    }
    if (path === '/api/admin/invoices/counts') return route.fulfill({ json: { total: created ? 2 : 1, cashCount: created ? 1 : 0, paidCount: created ? 2 : 1, totalRevenue: 80402000 } })
    if (path === '/api/admin/invoices') return route.fulfill({ json: { content: created ? [created, legacy] : [legacy], totalPages: 1, totalElements: created ? 2 : 1 } })
    return route.fulfill({ json: { content: [], total: 0, totalPages: 1 } })
  })
  await mockAdminSession(page)
  await page.goto(new URL('/admin/invoices', server.resolvedUrls.local[0]).href)
  await page.getByText('Chứng từ cũ: BANK_TRANSFER', { exact: true }).waitFor()
  await page.locator('.card-revenue .inv-stat-value').filter({ hasText: '80.402.000' }).waitFor()
  for (const width of [1920, 1440, 1366, 1320, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    const revenue = await page.locator('.card-revenue .inv-stat-value').evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return { lines: range.getClientRects().length, clipped: element.scrollWidth > element.clientWidth }
    })
    assert.equal(revenue.lines, 1, `revenue and currency must share a line at ${width}px`)
    assert.equal(revenue.clipped, false, `revenue must fit the card at ${width}px`)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no page overflow at ${width}px`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  assert.equal(await page.locator('.inv-method-tabs-card').count(), 0, 'only COD is supported; no payment method tabs')
  assert.equal(await page.getByText(/VietQR|Quẹt.*POS|Tiền Mặt Tại Quầy/).count(), 0)
  const quickPanel = page.getByRole('region', { name: 'Xem nhanh hóa đơn' })
  const legacyRow = page.getByRole('row', { name: 'Xem chi tiết hóa đơn OLD-78' })
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  assert.equal(await quickPanel.getByRole('button', { name: 'Bỏ giữ chi tiết', exact: true }).count(), 0, 'initial hover opens detail without clicking or pinning')
  await quickPanel.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click()
  failDetail = true
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await quickPanel.getByRole('alert').waitFor()
  failDetail = false
  await legacyRow.focus()
  await legacyRow.press('Enter')
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  await quickPanel.getByText('Sofa góc chữ L vải bọc Milan', { exact: true }).waitFor()
  await quickPanel.getByRole('cell', { name: '1 cái', exact: true }).waitFor()
  assert.deepEqual(await quickPanel.locator('h3').allTextContents(), ['Hóa đơn OLD-78', 'Sản phẩm trong đơn #3', 'Thông tin khách hàng'])
  assert.equal(await page.locator('.inv-detail-page').count(), 0, 'quick view keeps list visible')
  await page.getByRole('button', { name: 'Bỏ giữ chi tiết', exact: true }).waitFor()
  await quickPanel.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click()
  assert.equal(await quickPanel.count(), 0, 'close hides the detail panel')
  assert.equal(await page.locator('.inv-review-layout').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1, 'closed detail gives the list full width')
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  assert.equal(await quickPanel.getByRole('button', { name: 'Bỏ giữ chi tiết', exact: true }).count(), 0, 'hover reopens detail after closing')
  await legacyRow.focus()
  await legacyRow.press('Enter')
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  await quickPanel.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click()
  await legacyRow.getByText('Khách hàng 3', { exact: true }).click()
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  const columns = await page.locator('.inv-review-layout').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat))
  assert(Math.abs(columns[0] / columns[1] - 1) < 0.05, 'desktop gives detail half the available width')
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `quick view fits ${width}px`)
    assert.equal(await page.locator('.inv-quick-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1)
    const priceCells = quickPanel.locator('.inv-quick-items tbody td:nth-child(n+3)')
    assert.deepEqual(await priceCells.allTextContents(), ['14.500.000 đ', '14.500.000 đ'])
    for (const cell of await priceCells.all()) {
      assert.equal(await cell.evaluate(element => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return range.getClientRects().length
      }), 1, `price and currency stay on one line at ${width}px`)
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1193, height: 755 }]) {
    await page.setViewportSize(viewport)
    await quickPanel.scrollIntoViewIfNeeded()
    const layout = await quickPanel.evaluate(el => ({
      position: getComputedStyle(el).position,
      overflow: getComputedStyle(el).overflowY,
      clipped: el.scrollHeight > el.clientHeight + 1,
      top: el.getBoundingClientRect().top,
      left: el.getBoundingClientRect().left,
      list: (() => { const r = el.previousElementSibling.getBoundingClientRect(); return { top: r.top, right: r.right, bottom: r.bottom } })(),
    }))
    assert.equal(layout.position, 'static', 'detail must scroll with the page')
    assert.equal(layout.overflow, 'visible', 'detail must not trap wheel scrolling')
    assert.equal(layout.clipped, false, 'all detail content must remain in normal flow')
    if (viewport.width >= 1200) {
      assert(layout.left >= layout.list.right, 'detail sits to the right without covering the list')
      assert(Math.abs(layout.top - layout.list.top) < 1, 'list and detail start on the same row')
    } else {
      assert(layout.top >= layout.list.bottom, 'narrow screens stack detail below the list')
    }
    await quickPanel.getByRole('heading').first().scrollIntoViewIfNeeded()
    await quickPanel.getByRole('heading').first().hover()
    const before = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 300)
    await page.waitForFunction(y => scrollY > y, before)
    assert.equal(await quickPanel.evaluate(el => el.scrollTop), 0, 'wheel must scroll the page, not the detail')
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.inv-review-layout').screenshot({ path: fileURLToPath(new URL('../artifacts/invoice-quick-desktop.png', import.meta.url)), animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.inv-code-badge').filter({ hasText: 'OLD-78' }).click()
  await page.waitForFunction(() => { const y = document.querySelector('.inv-quick-panel').getBoundingClientRect().y; return y >= 0 && y < 150 })
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/invoice-quick-mobile.png', import.meta.url)), fullPage: false, animations: 'disabled' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const createButton = page.getByRole('button', { name: '+ Lập Hóa Đơn Mới', exact: true })
  await createButton.click()
  await page.getByRole('heading', { name: 'Lập Hóa Đơn Bán Hàng Mới' }).waitFor()
  assert.equal(await page.locator('.admin-modal-backdrop, .inv-stats-grid').count(), 0)
  await page.getByRole('alert').filter({ hasText: 'Không thể tải đơn hàng' }).waitFor()
  failEligible = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  const select = page.getByRole('combobox', { name: 'Đơn hàng cần xuất hóa đơn' })
  await select.selectOption('1')
  await firstOrderReady
  await select.selectOption('2')
  const submit = page.getByRole('button', { name: 'Xuất Hóa Đơn & Ghi Nhận Thanh Toán', exact: true })
  await page.waitForFunction(() => document.querySelector('.inv-total-price')?.textContent.includes('200.000'))
  releaseFirstOrder()
  assert.equal(previews.some(body => body.orderId === 1), false)
  assert.equal(await page.getByRole('checkbox').count(), 0, 'checkout totals cannot be changed after purchase')
  failPreview = true
  await page.getByRole('button', { name: 'Tải lại số tiền', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Không thể tính tiền' }).waitFor()
  assert.equal(await submit.isDisabled(), true)
  failPreview = false
  await page.getByRole('button', { name: 'Tải lại số tiền', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.inv-total-price')?.textContent.includes('200.000'))
  assert.deepEqual(previews.at(-1), { orderId: 2, voucherCode: 'EXPIRED', includeVat: false })
  assert.equal(await page.getByRole('radio').count(), 0, 'COD needs no method selector')
  await page.getByText(/COD — thu tiền mặt khi giao hàng/).waitFor()
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/invoice-create-desktop.png', import.meta.url)), fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile form must not overflow')
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/invoice-create-mobile.png', import.meta.url)), fullPage: true, animations: 'disabled' })
  await submit.click()
  await page.getByText('Chưa thể lưu hóa đơn. Vui lòng thử lại.', { exact: true }).waitFor()
  await select.waitFor()
  assert.equal(await select.inputValue(), '2')
  failCreate = false
  await submit.click()
  await page.locator('#printable-invoice-paper').waitFor()
  await page.locator('#printable-invoice-paper').getByRole('cell', { name: 'cái', exact: true }).waitFor()
  assert.equal(await page.locator('#printable-invoice-paper').innerText().then(text => text.includes('COD — thu tiền khi giao hàng')), true)
  assert.equal(await page.locator('.inv-paper-qr-img').count(), 0)
  assert.equal(await page.locator('.admin-modal-backdrop, .inv-create-page, .inv-stats-grid').count(), 0)
  assert.equal(submissions.length, 2)
  assert.equal(submissions.at(-1).paymentMethod, 'CASH')
  assert.equal(await page.locator('.inv-sum-discount').innerText().then(text => text.includes('10.000')), true)
  await page.getByRole('button', { name: 'In Hóa Đơn', exact: true }).click()
  assert.equal(await page.evaluate(() => window.printCalls), 1)
  await page.emulateMedia({ media: 'print' })
  assert.equal(await page.locator('#printable-invoice-paper').isVisible(), true, 'print output must stay visible without a modal ancestor')
  assert.equal(await page.locator('.admin-navbar').isVisible(), false)
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('button', { name: 'Khổ K80 Giấy Cuộn', exact: true }).click()
  await page.locator('.inv-paper-k80').waitFor()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải PDF', exact: true }).click()
  const download = await downloadPromise
  assert.equal(download.suggestedFilename(), 'INV-TEST-77.pdf')
  await page.getByRole('button', { name: 'Về danh sách hóa đơn', exact: true }).click()
  await createButton.waitFor()
  delayLegacy = true
  legacyReady = new Promise(resolve => { legacyStarted = resolve })
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await legacyReady
  await page.locator('.inv-code-badge').filter({ hasText: 'INV-TEST-77' }).click()
  await quickPanel.getByRole('heading', { name: 'Hóa đơn INV-TEST-77' }).waitFor()
  releaseLegacy()
  delayLegacy = false
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await page.waitForTimeout(350)
  assert.equal(await quickPanel.getByRole('heading', { name: 'Hóa đơn INV-TEST-77' }).count(), 1, 'pinned view ignores hover and stale responses')
  await quickPanel.getByRole('button', { name: 'Bỏ giữ chi tiết', exact: true }).click()
  await legacyRow.getByText('Khách hàng 3', { exact: true }).hover()
  await quickPanel.getByRole('heading', { name: 'Hóa đơn OLD-78' }).waitFor()
  await quickPanel.getByRole('button', { name: 'Xem & In', exact: true }).click()
  await page.locator('#printable-invoice-paper').waitFor()
  assert.equal(await page.locator('#printable-invoice-paper').innerText().then(text => text.includes('Chứng từ cũ: BANK_TRANSFER')), true)
  assert.equal(await page.locator('.inv-paper-qr-img').count(), 0, 'legacy invoices must not prompt another payment')
  assert.deepEqual(errors, [])
  console.log('PASS invoice UI: close/reopen detail, row hover, keyboard/touch pinning, side-by-side list/detail, responsive, error recovery, stale detail cancellation, COD only, legacy records preserved, no QR payment, inline views, eligible retry, stale orders, locked checkout total, create errors/success, mobile, A4/K80 print, PDF')
} finally {
  await browser.close()
  await server.close()
}
