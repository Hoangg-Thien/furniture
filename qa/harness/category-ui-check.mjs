import { mockAdminSession } from './admin-auth.mjs'
// Isolated API fixtures: these checks never write to the application database.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const origin = process.env.QA_ADMIN_ORIGIN || 'http://127.0.0.1:5173'
const artifacts = new URL('../artifacts/categories/', import.meta.url)
await fs.mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } })
page.setDefaultTimeout(10000)
const errors = []
const results = []
page.on('pageerror', error => errors.push(error.message))
const names = ['Sofa & ghế thư giãn', 'Bàn ăn', 'Giường ngủ', 'Tủ quần áo', 'Bàn làm việc', 'Ghế văn phòng', 'Kệ sách', 'Tủ bếp', 'Đèn trang trí', 'Đồ trang trí']
let categories = names.map((name, i) => ({ id: i + 1, name, description: i === 0 ? 'Thiết kế thoải mái cho không gian phòng khách.' : i === 9 ? null : 'Nội thất tinh giản, phù hợp với không gian sống hiện đại.', productCount: i === 0 ? 4 : i === 9 ? 0 : 2, isActive: i < 8 }))
let failList = false
let failSave = false
let failDelete = false
let listDelay = 250
const writes = []
await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
await page.addInitScript(() => {
  localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, username: 'admin01', role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' }))
})
await page.route('**/api/**', async route => {
  const url = new URL(route.request().url())
  const method = route.request().method()
  const send = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (method === 'OPTIONS') return send({})
  if (url.pathname === '/api/admin/categories') {
    if (method === 'GET') {
      if (listDelay) await new Promise(resolve => setTimeout(resolve, listDelay))
      return send(failList ? { error: 'Unavailable' } : categories, failList ? 503 : 200)
    }
    if (failSave) return send({ error: 'Tên danh mục đã tồn tại.' }, 409)
    const created = { ...route.request().postDataJSON(), id: 99, productCount: 0 }
    writes.push({ method, data: created })
    categories.push(created)
    return send(created, 201)
  }
  const toggle = url.pathname.match(/^\/api\/admin\/categories\/(\d+)\/toggle-status$/)
  if (toggle) {
    const cat = categories.find(c => c.id === Number(toggle[1]))
    cat.isActive = !cat.isActive
    writes.push({ method, syncProducts: url.searchParams.get('syncProducts') })
    return send({ message: 'Đã cập nhật trạng thái hiển thị!' })
  }
  const item = url.pathname.match(/^\/api\/admin\/categories\/(\d+)$/)
  if (item) {
    if (method === 'DELETE' && failDelete) return send({ error: 'Danh mục vừa có sản phẩm mới, không thể xóa.' }, 409)
    if (method === 'PUT') {
      if (failSave) return send({ error: 'Tên danh mục đã tồn tại.' }, 409)
      Object.assign(categories.find(c => c.id === Number(item[1])), route.request().postDataJSON())
    }
    if (method === 'DELETE') categories = categories.filter(c => c.id !== Number(item[1]))
    writes.push({ method, id: Number(item[1]) })
    return send(categories.find(c => c.id === Number(item[1])) || { message: 'OK' })
  }
  if (url.pathname.startsWith('/api/admin/')) return send({ content: [], totalElements: 0, totalPages: 1 })
  return send([])
})
const rows = page.locator('.category-row')
const search = page.getByRole('searchbox', { name: 'Tìm kiếm danh mục' })
const status = page.getByLabel('Trạng thái', { exact: true })
const dialog = page.getByRole('dialog')
async function check(name, run) { await run(); results.push(name); console.log('PASS:', name) }
async function rowCount(count) { await page.waitForFunction(n => document.querySelectorAll('.category-row').length === n, count) }
async function noOverflow() {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Page must not overflow horizontally')
}
async function shot(name) { await page.screenshot({ path: new URL(`${name}.png`, artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true, animations: 'disabled' }) }

try {
  await mockAdminSession(page)
  await page.goto(`${origin}/admin/categories`, { waitUntil: 'domcontentloaded' })
  await check('Loading state, populated list and global statistics', async () => {
    await page.getByText('Đang tải danh mục loại nội thất...').waitFor()
    await rowCount(10)
    assert.deepEqual(await page.locator('.kpi-value').allTextContents(), ['10', '8', '2', '20'])
    await noOverflow()
    await shot('desktop')
    listDelay = 0
  })
  await check('Live name/description search, combined filters and stable totals', async () => {
    await search.fill('SOFA')
    await rowCount(1)
    await search.fill('phòng khách')
    await rowCount(1)
    await status.selectOption('INACTIVE')
    await page.getByRole('heading', { name: 'Không tìm thấy danh mục' }).waitFor()
    assert.deepEqual(await page.locator('.kpi-value').allTextContents(), ['10', '8', '2', '20'])
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click()
    await rowCount(10)
    await status.selectOption('INACTIVE')
    await rowCount(2)
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click()
  })
  await check('Create validation, recoverable save error and successful creation', async () => {
    await page.getByRole('button', { name: 'Thêm loại nội thất', exact: true }).click()
    await page.getByLabel('Tên loại nội thất', { exact: false }).fill('   ')
    await dialog.getByRole('button', { name: 'Tạo danh mục' }).click()
    await dialog.getByRole('alert').waitFor()
    assert.equal(writes.length, 0)
    await page.getByLabel('Tên loại nội thất', { exact: false }).fill('  Danh mục mới  ')
    failSave = true
    await dialog.getByRole('button', { name: 'Tạo danh mục' }).click()
    await dialog.getByText('Tên danh mục đã tồn tại.').waitFor()
    failSave = false
    await dialog.getByRole('button', { name: 'Tạo danh mục' }).click()
    await dialog.waitFor({ state: 'detached' })
    await rowCount(11)
    assert.equal(categories.at(-1).name, 'Danh mục mới')
    assert.equal(categories.at(-1).isActive, true)
  })
  await check('Edit, keyboard focus trap and focus restoration', async () => {
    const edit = page.getByRole('button', { name: `Sửa: ${names[0]}`, exact: true })
    await edit.click()
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).focus()
    await page.keyboard.press('Shift+Tab')
    assert(await dialog.getByRole('button', { name: 'Lưu thay đổi' }).evaluate(el => el === document.activeElement))
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    assert(await edit.evaluate(el => el === document.activeElement))
    await edit.click()
    await page.getByLabel('Mô tả không gian', { exact: false }).fill('Mô tả đã cập nhật')
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await dialog.waitFor({ state: 'detached' })
    await page.getByText('Mô tả đã cập nhật', { exact: true }).waitFor()
  })
  await check('Visibility confirmation retains product-sync choice', async () => {
    await page.getByRole('button', { name: `Ẩn: ${names[0]}`, exact: true }).click()
    assert.equal(categories[0].isActive, true)
    await dialog.getByRole('checkbox').uncheck()
    await dialog.getByRole('button', { name: 'Xác nhận ẩn' }).click()
    await dialog.waitFor({ state: 'detached' })
    await page.getByRole('button', { name: `Hiện: ${names[0]}`, exact: true }).waitFor()
    assert.equal(categories[0].isActive, false)
    assert.equal(writes.at(-1).syncProducts, 'false')
  })
  await check('Linked categories cannot be deleted; errors preserve confirmation', async () => {
    assert(await page.getByRole('button', { name: `Xóa: ${names[0]}`, exact: true }).isDisabled())
    await page.getByRole('button', { name: 'Xóa: Danh mục mới', exact: true }).click()
    assert.equal(categories.length, 11)
    failDelete = true
    await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click()
    await dialog.getByText('Danh mục vừa có sản phẩm mới, không thể xóa.').waitFor()
    assert.equal(categories.length, 11)
    failDelete = false
    await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click()
    await dialog.waitFor({ state: 'detached' })
    await rowCount(10)
  })
  await check('Responsive list and dialogs at desktop, tablet, mobile and 320px', async () => {
    await page.locator('.admin-toast').waitFor({ state: 'detached' })
    for (const width of [1920, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      await noOverflow()
      await page.getByRole('button', { name: 'Thêm loại nội thất', exact: true }).click()
      await dialog.waitFor()
      await noOverflow()
      if (width === 390) await shot('mobile-create')
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      if (width === 390) await shot('mobile')
    }
    await search.fill('zzzz')
    await page.getByRole('heading', { name: 'Không tìm thấy danh mục' }).waitFor()
    await noOverflow()
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click()
  })
  await check('Empty/mobile state fits viewport, error is distinct and retry works', async () => {
    categories = []
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click()
    await page.getByRole('heading', { name: 'Bắt đầu với danh mục đầu tiên' }).waitFor()
    await noOverflow()
    assert(await page.getByRole('heading', { name: 'Bắt đầu với danh mục đầu tiên' }).evaluate(el => el.getBoundingClientRect().right <= window.innerWidth))
    await shot('mobile-empty')
    failList = true
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Bắt đầu với danh mục đầu tiên' }).count(), 0)
    await noOverflow()
    failList = false
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await page.getByRole('heading', { name: 'Bắt đầu với danh mục đầu tiên' }).waitFor()
  })
  assert.deepEqual(errors, [])
  await fs.writeFile(new URL('results.json', artifacts), JSON.stringify({ passed: results.length, results, errors, api: 'isolated route mocks' }, null, 2))
  console.log(`ALL ${results.length} CHECKS PASSED`)
} catch (error) {
  await shot('failure')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
