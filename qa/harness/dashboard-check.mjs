import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  const requests = []
  const pending = []
  let mode = 'delayed'
  const overview = { totalRevenue: 1250000, completedOrdersCount: 4, totalItemsSold: 12, lowStockProductsCount: 2 }
  const orders = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((status, i) => ({
    id: 42 + i, customerName: i === 0 ? 'Khách vãng lai' : `Khách ${i}`, phone: '0901234567',
    orderDate: '2026-11-10T10:30:00', totalItemsCount: 2, totalAmount: 250000, status,
  }))
  const products = [
    { id: 1, name: 'Bộ bàn ăn gỗ sồi', categoryName: 'Bàn ăn', quantity: 3, unit: 'bộ', sellingPrice: 2500000 },
    { id: 2, name: 'Sofa hết hàng', categoryName: 'Sofa', quantity: 0, unit: 'bộ', sellingPrice: 12000000 },
  ]
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    Date.now = () => Date.parse('2026-11-10T18:30:00Z')
    localStorage.setItem('furniture_custom_api_url', 'http://127.0.0.1:18080')
    localStorage.setItem('furniture_admin_user', JSON.stringify({ role: 'ADMIN', accessToken: 'dashboard-test', apiBaseUrl: 'http://127.0.0.1:18080' }))
  })
  const path = '/__dashboard_check'
  await page.route(`**${path}`, async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml(path, `
    <style>body { margin: 0; }</style>
    <div class="admin-shell"><div class="admin-main"><main class="admin-content-body"><div id="root"></div><output id="navigation"></output></main></div></div>
    <script type="module">
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import Dashboard from '/src/admin/AdminDashboard.jsx';
      import '/src/admin/admin.css'; import '/src/admin/admin-modern.css';
      window.root = createRoot(document.getElementById('root'));
      window.root.render(React.createElement(Dashboard, {onNavigateModule(module) { document.getElementById('navigation').textContent = module }}));
    </script>`),
  }))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    requests.push(url)
    assert.equal(url.origin, 'http://127.0.0.1:18080')
    assert.equal(route.request().headers().authorization, 'Bearer dashboard-test')
    const currentMode = mode
    if (currentMode === 'delayed') await new Promise(resolve => pending.push(resolve))
    if (currentMode === 'failed') return route.fulfill({ status: 500, json: { error: 'unavailable' } })
    let json
    if (url.pathname.endsWith('/overview')) {
      assert.equal(url.searchParams.get('fromDate'), '2026-10-13')
      assert.equal(url.searchParams.get('toDate'), '2026-11-11')
      json = currentMode === 'invalid' ? { totalRevenue: 'not money' } : currentMode === 'empty'
        ? Object.fromEntries(Object.keys(overview).map(key => [key, 0])) : overview
    } else if (url.pathname.endsWith('/orders')) {
      assert.equal(url.searchParams.get('size'), '5')
      json = { content: currentMode === 'empty' ? [] : orders }
    } else {
      assert.equal(url.pathname, '/api/admin/products')
      assert.equal(url.searchParams.get('lowStock'), 'true')
      assert.equal(url.searchParams.get('status'), 'ACTIVE')
      json = { content: currentMode === 'empty' ? [] : products }
    }
    await route.fulfill({ json })
  })
  await page.goto(new URL(path, server.resolvedUrls.local[0]).href, { waitUntil: 'domcontentloaded' })
  await page.getByText('Đang tải Dashboard...').waitFor()
  assert.equal(await page.getByRole('button', { name: 'Làm mới', exact: true }).isDisabled(), true)
  await page.waitForFunction(() => document.querySelector('.admin-dashboard-view')?.getAttribute('aria-busy') === 'true')
  const deadline = Date.now() + 10000
  while (pending.length < 3 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(pending.length, 3, 'Dashboard must request all three API endpoints')
  pending.forEach(resolve => resolve())
  await page.locator('.dashboard-metric').first().waitFor()
  assert.equal(requests.length, 3)
  assert.match(await page.locator('.dashboard-metric').first().innerText(), /1\.250\.000/)
  assert.equal(await page.locator('.admin-table tbody tr').count(), 5)
  for (const label of ['Khách vãng lai', 'Chờ duyệt', 'Đã duyệt', 'Đang giao', 'Hoàn tất', 'Đã hủy', 'Còn 3 bộ', 'Hết hàng']) {
    assert((await page.locator('.admin-dashboard-view').textContent()).includes(label), label)
  }
  fs.mkdirSync(new URL('../runtime/dashboard', import.meta.url), { recursive: true })
  await page.screenshot({ path: 'qa/runtime/dashboard/desktop.png', fullPage: true, animations: 'disabled' })
  for (const [name, target] of [['Doanh thu đã thu', 'reports'], ['Đơn hàng hoàn tất', 'orders'], ['Sản phẩm sắp hết', 'products'], ['Xem tất cả đơn', 'orders'], ['Nhập hàng', 'suppliers']]) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
    assert.equal(await page.locator('#navigation').innerText(), target)
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px`)
  }
  await page.screenshot({ path: 'qa/runtime/dashboard/mobile.png', fullPage: true, animations: 'disabled' })
  mode = 'failed'
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('.dashboard-metric').count(), 0)
  mode = 'invalid'
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.getByText('Dữ liệu Dashboard không hợp lệ. Vui lòng thử lại.').waitFor()
  mode = 'empty'
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.getByText('Chưa có đơn hàng nào.', { exact: true }).waitFor()
  await page.getByText('Không có sản phẩm đang bán nào tồn dưới 5.', { exact: true }).waitFor()
  assert.equal(await page.locator('.dashboard-metric').count(), 4)
  assert.match(await page.locator('.dashboard-metric').first().innerText(), /0\s*₫/)
  assert.deepEqual(errors, [])
  console.log('PASS Dashboard: real API contract, auth headers, 30-day GMT+7 range, loading, KPIs, guest orders, statuses, stock units, navigation, mobile, failure/retry, invalid payload, empty data')
} finally {
  await browser.close()
  await server.close()
}
