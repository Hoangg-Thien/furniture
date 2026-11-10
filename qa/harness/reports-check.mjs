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
  let mode = 'ok'
  const overview = { totalRevenue: 1250000, revenueGrowthPercent: 25, grossProfit: 1000000,
    totalPurchaseCost: 250000, completedOrdersCount: 4, orderCompletionRate: 80, totalItemsSold: 12, lowStockProductsCount: 2 }
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    Date.now = () => Date.parse('2026-11-10T18:30:00Z')
    localStorage.setItem('furniture_custom_api_url', 'http://127.0.0.1:18080')
    localStorage.setItem('furniture_admin_user', JSON.stringify({ role: 'ADMIN', accessToken: 'reports-test', apiBaseUrl: 'http://127.0.0.1:18080' }))
  })
  const path = '/__reports_check'
  await page.route(`**${path}`, async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml(path, `
    <style>body { margin: 0; }</style>
    <div class="admin-shell"><div class="admin-main"><main class="admin-content-body"><div id="root"></div></main></div></div>
    <script type="module">
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import Reports from '/src/admin/AdminReportsManagement.jsx';
      import '/src/admin/admin.css'; import '/src/admin/admin-modern.css';
      createRoot(document.getElementById('root')).render(React.createElement(Reports));
    </script>`),
  }))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    requests.push(url)
    assert.equal(url.origin, 'http://127.0.0.1:18080')
    assert.equal(route.request().headers().authorization, 'Bearer reports-test')
    if (mode === 'failed') return route.fulfill({ status: 500, json: { message: 'unavailable' } })
    if (url.pathname.endsWith('/export-excel')) return route.fulfill({
      contentType: 'application/vnd.ms-excel', body: '<?xml version="1.0"?><Workbook/>',
    })
    const responses = {
      overview: mode === 'invalid' ? {} : mode === 'empty' ? Object.fromEntries(Object.keys(overview).map(key => [key, 0])) : overview,
      'revenue-trend': [{ dateLabel: '11/11', salesRevenue: 1250000, importCost: 250000, ordersCount: 4 }],
      'category-share': [{ categoryId: 1, categoryName: 'Sofa', totalRevenue: 1250000, percentage: 100 }],
      'top-products': [{ productId: 1, productName: 'Sofa bán chạy', soldQuantity: 12, totalRevenue: 1250000, currentStock: 2 }],
      'dead-stock': [{ productId: 2, productName: 'Bàn chưa bán', currentStock: 3, sellingPrice: 500000, daysSinceLastSold: null },
        { productId: 3, productName: 'Ghế bán hôm nay', currentStock: 1, sellingPrice: 250000, daysSinceLastSold: 0 }],
      'voucher-efficiency': [{ voucherId: 1, voucherCode: 'SALE10', programName: 'Tháng 11', discountPercent: 10, usedQuantity: 2, totalQuantity: 10, totalDiscountGiven: 100000 }],
    }
    const key = url.pathname.split('/').at(-1)
    assert(key in responses)
    await route.fulfill({ json: mode === 'empty' && key !== 'overview' ? [] : responses[key] })
  })
  await page.goto(new URL(path, server.resolvedUrls.local[0]).href)
  await page.locator('.admin-kpi-card').first().waitFor()
  assert.equal(requests.length, 6)
  assert.equal(await page.getByLabel('Từ ngày:').inputValue(), '2026-10-13')
  assert.equal(await page.getByLabel('Đến ngày:').inputValue(), '2026-11-11')
  assert.match(await page.locator('.admin-kpi-card').first().innerText(), /1\.250\.000/)
  assert(await page.locator('.admin-kpi-card').evaluateAll(cards => cards.every(card => {
    const top = card.querySelector('.admin-kpi-top').getBoundingClientRect()
    const value = card.querySelector('.admin-kpi-value').getBoundingClientRect()
    const sub = card.querySelector('.admin-kpi-sub').getBoundingClientRect()
    return top.bottom <= value.top && value.bottom <= sub.top
  })), 'KPI title, value and description must not overlap')
  for (const preset of ['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tháng này']) {
    await page.getByRole('button', { name: preset, exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.admin-reports-view').getAttribute('aria-busy') === 'false')
    const from = { 'Hôm nay': '2026-11-11', '7 ngày qua': '2026-11-05', '30 ngày qua': '2026-10-13', 'Tháng này': '2026-11-01' }[preset]
    assert.equal(await page.getByLabel('Từ ngày:').inputValue(), from)
    assert.equal(requests.filter(url => url.pathname.endsWith('/overview')).at(-1).searchParams.get('fromDate'), from)
  }
  await page.getByRole('button', { name: /Hàng Tồn/ }).click()
  await page.getByText('Chưa từng bán', { exact: true }).waitFor()
  await page.getByText('0 ngày', { exact: true }).waitFor()
  await page.getByRole('button', { name: /Hiệu Quả Khuyến Mãi/ }).click()
  await page.getByText('SALE10', { exact: true }).waitFor()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Xuất Báo Cáo Excel' }).click()
  assert.equal((await download).suggestedFilename(), 'Bao_Cao_Doanh_Thu_2026-11-01_2026-11-11.xls')
  const count = requests.length
  await page.getByLabel('Từ ngày:').fill('2026-11-12')
  await page.getByRole('alert').waitFor()
  assert.equal(await page.getByRole('button', { name: 'Xuất Báo Cáo Excel' }).isDisabled(), true)
  assert.equal(requests.length, count, 'Invalid ranges must not reach the API')
  await page.getByRole('button', { name: '30 ngày qua', exact: true }).click()
  await page.locator('.admin-kpi-card').first().waitFor()
  mode = 'failed'
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('.admin-kpi-card').count(), 0)
  mode = 'invalid'
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.getByText('Dữ liệu báo cáo không hợp lệ. Vui lòng thử lại.').waitFor()
  mode = 'empty'
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.locator('.admin-kpi-card').first().waitFor()
  assert.match(await page.locator('.admin-kpi-card').first().innerText(), /0\s*₫/)
  assert(!(await page.locator('.admin-reports-view').textContent()).includes('undefined'))
  fs.mkdirSync(new URL('../runtime/reports', import.meta.url), { recursive: true })
  await page.screenshot({ path: 'qa/runtime/reports/empty.png', fullPage: true })
  mode = 'ok'
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click()
  await page.locator('.admin-kpi-card').first().waitFor()
  await page.screenshot({ path: 'qa/runtime/reports/desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile overflow')
  await page.screenshot({ path: 'qa/runtime/reports/mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS Reports: configured backend/auth, presets GMT+7, KPIs/charts/tabs, export, invalid range, API failure/retry, invalid/empty data, mobile')
} finally {
  await browser.close()
  await server.close()
}
