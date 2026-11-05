import { mockAdminSession } from './admin-auth.mjs'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const pending = new Map()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  const requests = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080', username: 'search-test' })))
  await page.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/products' || url.pathname === '/api/admin/categories') return route.fulfill({ json: [] })
    if (!url.searchParams.has('search')) return route.fulfill({ json: { content: [], totalPages: 1, total: 0, pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0 } })
    const query = url.searchParams.get('search')
    const module = url.pathname.split('/').at(-1)
    const key = `${query}/${module}`
    requests.push(key)
    await new Promise(resolve => pending.set(key, async (rows, status = 200) => {
      await route.fulfill({ status, json: { content: rows } }).catch(() => {})
      pending.delete(key)
      resolve()
    }))
  })
  const waitForRequests = async query => {
    for (let attempt = 0; attempt < 100 && requests.filter(key => key.startsWith(`${query}/`)).length < 3; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    assert.equal(requests.filter(key => key.startsWith(`${query}/`)).length, 3, 'all three APIs must start before any response is released')
  }
  const reply = (query, module, rows, status) => pending.get(`${query}/${module}`)(rows, status)
  const empty = query => Promise.all(['orders', 'customers'].map(module => reply(query, module, [])))
  const product = name => ({ id: 9, name, sellingPrice: 100000, quantity: 2 })
  await mockAdminSession(page)
  await page.goto(new URL('/admin/orders', server.resolvedUrls.local[0]).href)
  const opener = page.locator('.admin-search-box')
  await opener.click()
  const input = page.getByRole('textbox', { name: 'Tìm kiếm toàn hệ thống', exact: true })
  await input.waitFor()
  assert.equal(await input.evaluate(element => element === document.activeElement), true)
  assert.equal(await page.locator('.admin-search-backdrop').evaluate(element => getComputedStyle(element).backdropFilter), 'none')
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Thống kê báo cáo', exact: true }).evaluate(element => element === document.activeElement), true)
  await page.keyboard.press('Tab')
  assert.equal(await input.evaluate(element => element === document.activeElement), true)
  await input.fill('s')
  await input.fill('so')
  await input.fill('sofa')
  await waitForRequests('sofa')
  assert.equal(requests.some(key => key.startsWith('s/') || key.startsWith('so/')), false, 'rapid typing is debounced')
  await reply('sofa', 'products', [product('Sofa nhanh')])
  const firstResult = page.getByRole('button').filter({ hasText: 'Sofa nhanh' })
  await firstResult.waitFor()
  assert.match(await firstResult.innerText(), /100\.000/)
  assert.match(await firstResult.innerText(), /Tồn thấp/i)
  assert.equal(await page.locator('.admin-global-search-body').getAttribute('aria-busy'), 'true', 'fast results must be visible while slower APIs are pending')
  await empty('sofa')
  await page.waitForFunction(() => document.querySelector('.admin-global-search-body')?.getAttribute('aria-busy') === 'false')

  await input.fill('old')
  await waitForRequests('old')
  await input.fill('new')
  await waitForRequests('new')
  await reply('new', 'products', [product('Kết quả mới nhất')])
  await empty('new')
  await page.getByRole('button').filter({ hasText: 'Kết quả mới nhất' }).waitFor()
  await reply('old', 'products', [product('Kết quả đã cũ')])
  await empty('old')
  assert.equal(await page.getByText('Kết quả đã cũ', { exact: true }).count(), 0, 'stale responses must not overwrite a new query')

  await input.fill('partial')
  await waitForRequests('partial')
  await reply('partial', 'products', [], 500)
  await reply('partial', 'orders', [{ id: 42, customerName: 'Khách kiểm thử', orderDate: '2026-11-05T10:00:00', status: 'PENDING' }])
  await reply('partial', 'customers', [])
  await page.getByRole('status').filter({ hasText: 'Một số dữ liệu chưa tải được' }).waitFor()
  await page.locator('.admin-search-result-row').filter({ hasText: 'Đơn hàng #42' }).waitFor()
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/search-popup.png', import.meta.url)), animations: 'disabled' })

  await input.fill('closing')
  await waitForRequests('closing')
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog', { name: 'Tìm kiếm toàn hệ thống' }).count(), 0)
  assert.equal(await opener.evaluate(element => element === document.activeElement), true)
  await reply('closing', 'products', [product('Không được hiện sau khi đóng')])
  await empty('closing')
  await page.keyboard.press('Control+k')
  await input.waitFor()
  assert.equal(await input.inputValue(), '')
  const before = requests.length
  await input.fill('cancelbeforedebounce')
  await page.keyboard.press('Escape')
  await new Promise(resolve => setTimeout(resolve, 350))
  assert.equal(requests.length, before, 'closing before debounce must not start requests')
  await page.keyboard.press('Control+k')
  await input.waitFor()
  await page.getByRole('button', { name: 'Sản phẩm & Kho', exact: true }).click()
  await page.waitForURL('**/admin/products')
  assert.equal(await page.getByRole('dialog', { name: 'Tìm kiếm toàn hệ thống' }).count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS search: parallel APIs, incremental results, debounce, stale/closed cancellation, partial failures, focus, keyboard, navigation')
} finally {
  await Promise.all([...pending.values()].map(resolve => resolve([])))
  await browser.close()
  await server.close()
}
