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
  page.on('pageerror', error => errors.push(error.message))
  let status = 'PENDING'
  let rejectUpdate = true
  let updates = 0
  let receiptId = 1
  let currentRole = 'STAFF'
  let submittedAt = null
  let reviewedAt = null
  let reason = null
  let storedCounts = {}
  let failInspection = true
  const supplier = { id: 1, name: 'Nhà cung cấp kiểm đếm', totalReceiptsCount: 1, totalReceiptValue: 700000 }
  let failQuick = false
  const items = [
    { receiptId: 1, productId: 20, productName: 'Nệm Dreamy', unit: 'cai', quantity: 5, unitPrice: 100000, amount: 500000 },
    { receiptId: 1, productId: 2, productName: 'Sofa Oslo', unit: 'bo', quantity: 2, unitPrice: 100000, amount: 200000 },
  ]
  await page.route('https://**', route => route.fulfill({ body: '' }))
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/receipt-approvals')) return route.fulfill({ json: submittedAt && !reviewedAt && status === 'PENDING' ? [{ id: receiptId, supplierId: 1, supplierName: supplier.name, checkedBy: 'warehouseA', submittedAt, totalAmount: 700000 }] : [] })
    if (path.endsWith('/inspection')) {
      if (route.request().method() === 'GET' && failInspection) {
        failInspection = false
        return route.abort('failed')
      }
      if (route.request().method() === 'POST') {
        updates++
        if (rejectUpdate) return route.fulfill({ status: 500, json: { error: 'Không thể lưu thử nghiệm' } })
        storedCounts = route.request().postDataJSON().counts
        submittedAt = '2026-11-23T10:00:00'
        reviewedAt = null
        reason = null
      }
      return route.fulfill({ json: route.request().method() === 'GET' ? { submittedAt, reviewedAt, reason, checkedBy: submittedAt ? 'warehouseA' : null, reviewedBy: reviewedAt ? 'adminA' : null, items: items.map(item => ({ productId: item.productId, quantity: storedCounts[item.productId] ?? null })) } : { message: 'Đã gửi admin duyệt' } })
    }
    if (path.endsWith('/review')) {
      assert.equal(currentRole, 'ADMIN')
      const review = route.request().postDataJSON()
      reviewedAt = '2026-11-23T11:00:00'
      reason = review.approve ? null : review.reason
      if (review.approve) status = 'COMPLETED'
      return route.fulfill({ json: { message: 'Đã xử lý phiếu nhập' } })
    }
    if (path.endsWith('/products')) return route.fulfill({ json: { content: [{ id: 20, name: 'Nệm Dreamy', sellingPrice: 200000, unit: 'cai' }] } })
    if (path.endsWith('/receipts') && route.request().method() === 'POST') {
      assert.equal(route.request().postDataJSON().status, 'PENDING')
      receiptId = 2
      status = 'PENDING'
      submittedAt = reviewedAt = reason = null
      storedCounts = {}
      return route.fulfill({ status: 201, json: { receiptId } })
    }
    if (path.endsWith('/status')) {
      updates++
      assert.equal(route.request().postDataJSON().status, 'COMPLETED')
      if (rejectUpdate) return route.fulfill({ status: 500, json: { error: 'Không thể lưu thử nghiệm' } })
      status = 'COMPLETED'
      return route.fulfill({ json: { message: 'OK' } })
    }
    if (path.endsWith('/items')) return route.fulfill({ json: items })
    if (path.endsWith('/receipts')) {
      if (path.includes('/suppliers/2/') && failQuick) { failQuick = false; return route.fulfill({ status: 500, json: {} }) }
      return route.fulfill({ json: [{ id: receiptId, receiptDate: '2026-11-23T10:00:00', staffName: 'Nhân viên A', status, totalAmount: 700000 }] })
    }
    return route.fulfill({ json: path.endsWith('/suppliers') ? [supplier, { ...supplier, id: 2, name: 'Nhà cung cấp thứ hai' }] : [] })
  })
  await page.route('**/__receipt_count', async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml('/__receipt_count', `
    <div class="admin-shell"><main class="admin-content-body"><div id="root"></div></main></div>
    <script type="module">
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import Suppliers from '/src/admin/AdminSupplierManagement.jsx';
      import '/src/admin/admin.css'; import '/src/admin/admin-modern.css';
      createRoot(document.getElementById('root')).render(React.createElement(Suppliers, {currentUser: {id: 1, username: 'warehouseA', role: localStorage.getItem('qaRole') || 'STAFF'}}));
    </script>`),
  }))
  await page.goto(new URL('/__receipt_count', server.resolvedUrls.local[0]).href)
  const quick = page.getByRole('complementary', { name: 'Xem nhanh nhà cung cấp' })
  const firstSupplier = page.getByRole('row', { name: `Xem nhà cung cấp ${supplier.name}`, exact: true })
  const secondSupplier = page.getByRole('row', { name: 'Xem nhà cung cấp Nhà cung cấp thứ hai', exact: true })
  await firstSupplier.hover()
  await quick.getByRole('heading', { name: supplier.name, exact: true }).waitFor()
  await quick.getByRole('button', { name: /#PR-1/ }).waitFor()
  await firstSupplier.focus()
  await firstSupplier.press('Enter')
  await secondSupplier.hover()
  await page.waitForTimeout(300)
  assert.equal(await quick.getByRole('heading', { name: supplier.name, exact: true }).count(), 1, 'pinned supplier ignores hover')
  failQuick = true
  await secondSupplier.click()
  await quick.getByRole('alert').waitFor()
  await quick.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await quick.getByRole('button', { name: /#PR-1/ }).waitFor()
  await page.locator('.supplier-review-layout').screenshot({ path: fileURLToPath(new URL('../artifacts/supplier-quick-desktop.png', import.meta.url)) })
  await page.setViewportSize({ width: 390, height: 844 })
  await firstSupplier.click()
  await quick.getByRole('heading', { name: supplier.name, exact: true }).waitFor()
  await page.waitForFunction(() => { const top = document.querySelector('.supplier-quick-panel').getBoundingClientRect().top; return top >= 0 && top < 150 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'supplier detail fits mobile viewport')
  await quick.screenshot({ path: fileURLToPath(new URL('../artifacts/supplier-quick-mobile.png', import.meta.url)) })
  await quick.getByRole('button', { name: 'Đóng chi tiết nhà cung cấp', exact: true }).click()
  assert.equal(await quick.count(), 0)
  assert(await firstSupplier.evaluate(element => element === document.activeElement), 'closing detail restores row focus')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await firstSupplier.hover()
  await quick.getByRole('button', { name: /#PR-1/ }).click()
  const receipt = page.getByRole('button', { name: 'Mở phiếu nhập #1 để kiểm đếm', exact: true })
  assert.equal(await receipt.getAttribute('aria-expanded'), 'true', 'quick view opens the exact receipt')
  await page.getByRole('alert').filter({ hasText: 'Không kết nối được API kiểm đếm' }).waitFor()
  assert.equal(await page.getByText('Không có chi tiết sản phẩm nào.', { exact: true }).count(), 0, 'failed API is not an empty receipt')
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  const complete = page.getByRole('button', { name: 'Gửi quản trị viên duyệt', exact: true })
  await page.getByLabel('Thực nhận Nệm Dreamy').waitFor()
  assert(await complete.isDisabled(), 'uninspected receipt cannot complete')
  await page.getByLabel('Thực nhận Nệm Dreamy').fill('4')
  await page.getByLabel('Thực nhận Sofa Oslo').fill('2')
  assert(await complete.isDisabled(), 'short count cannot complete')
  await page.getByLabel('Thực nhận Nệm Dreamy').fill('6')
  assert(await complete.isDisabled(), 'over count cannot complete')
  await page.getByLabel('Thực nhận Nệm Dreamy').fill('5')
  assert(await complete.isEnabled(), 'matching all lines enables completion')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.screenshot({ path: fileURLToPath(new URL(`../artifacts/receipt-count-${width}.png`, import.meta.url)), fullPage: true })
  }
  await complete.click()
  await page.getByText('Không thể lưu thử nghiệm', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Thực nhận Nệm Dreamy').inputValue(), '5', 'failed save retains counts')
  rejectUpdate = false
  await complete.click()
  await page.getByRole('button', { name: 'Đã gửi quản trị viên duyệt', exact: true }).waitFor()
  assert.equal(status, 'PENDING', 'submission must not complete stock receipt')
  assert.equal(await page.getByRole('button', { name: 'Duyệt nhập kho', exact: true }).count(), 0, 'staff cannot approve')
  currentRole = 'ADMIN'
  await page.evaluate(() => localStorage.setItem('qaRole', 'ADMIN'))
  await page.reload()
  await page.getByRole('button', { name: 'Phiếu nhập chờ duyệt', exact: true }).click()
  await page.getByRole('button', { name: 'Mở phiếu #1', exact: true }).click()
  await page.getByRole('button', { name: 'Duyệt nhập kho', exact: true }).waitFor()
  assert.equal(await page.getByLabel('Thực nhận Nệm Dreamy').inputValue(), '5', 'admin sees saved count')
  await page.getByRole('textbox', { name: 'Lý do yêu cầu kiểm tra lại' }).fill('Kiểm tra chất lượng')
  await page.getByRole('button', { name: 'Yêu cầu kiểm tra lại', exact: true }).click()
  await complete.waitFor()
  assert.equal(status, 'PENDING')
  await complete.click()
  await page.getByRole('button', { name: 'Duyệt nhập kho', exact: true }).click()
  await page.getByText('Hoàn tất (Đã nhập kho)', { exact: true }).waitFor()
  assert.equal(updates, 3)
  await page.getByRole('button', { name: 'Mở phiếu nhập #1', exact: true }).click()
  await page.getByRole('button', { name: 'Mở phiếu nhập #1', exact: true }).click()
  assert.equal(await complete.count(), 0, 'completed receipt has no approval action')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Lập Phiếu Mới', exact: true }).click()
  const createModal = page.locator('.admin-modal-card').last()
  await createModal.locator('select').first().selectOption('PENDING')
  await createModal.getByPlaceholder('Giá vốn (VNĐ)').fill('100000')
  await createModal.getByRole('button', { name: 'Xác Nhận & Lưu Phiếu Nhập', exact: true }).click()
  await page.getByRole('button', { name: 'Mở phiếu nhập #2 để kiểm đếm', exact: true }).waitFor()
  await page.getByLabel('Thực nhận Nệm Dreamy').waitFor()
  assert(await complete.isDisabled(), 'new pending receipt opens inspection automatically with empty counts')
  assert.deepEqual(errors, [])
  console.log('PASS receipt counting: keyboard access, shortage/excess blocking, all-line match, failed save retry, locked completed receipt, desktop/mobile')
} finally {
  await browser.close()
  await server.close()
}
