import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { adminApiHeaders } from './admin-auth.mjs'

const base = 'http://127.0.0.1:18080'
const origin = 'http://127.0.0.1:5175'
const artifacts = new URL('../artifacts/permissions/', import.meta.url)
await fs.mkdir(artifacts, { recursive: true })
const suffix = String(Date.now())
const results = []
const errors = []
async function api(path, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...await adminApiHeaders() }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json()
  assert(response.ok, JSON.stringify(data))
  return data
}
const categories = await api('/api/admin/categories')
const product = await api('/api/admin/products', 'POST', { name: `UI chair ${suffix}`, categoryId: categories[0].id, sellingPrice: 300000, quantity: 9, unit: 'cai', isActive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
let activePage
try {
  for (const [staffType, count, landing] of [['SALES', 4, 'orders'], ['WAREHOUSE', 3, 'suppliers'], ['CONTENT', 1, 'products'], ['ADMIN', 11, 'dashboard']]) {
    const username = staffType === 'ADMIN' ? 'admin01' : `ui_${staffType.toLowerCase()}_${suffix}`
    if (staffType !== 'ADMIN') await api('/api/admin/staff', 'POST', { username, password: 'QaPass123!', fullName: `UI ${staffType}`, staffType })
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    activePage = page
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => errors.push(error.message))
    const searchedModules = []
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/admin/') && url.searchParams.has('search')) searchedModules.push(url.pathname.split('/')[3])
    })
    await page.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto(`${origin}/admin`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Tên đăng nhập hoặc email', { exact: true }).fill(username)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(staffType === 'ADMIN' ? '123456' : 'QaPass123!')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.locator('.admin-navbar').waitFor()
    await page.waitForURL(`**/admin/${landing}`)
    assert.equal(await page.locator('.admin-nav-item').count(), count, `${staffType}: menu count`)
    if (staffType !== 'CONTENT') await page.getByRole('button', { name: 'Sản phẩm & tồn kho', exact: true }).click()
    const search = page.getByPlaceholder('Tìm theo tên sản phẩm nội thất, kích thước, vật liệu...')
    await search.fill(suffix)
    await search.press('Enter')
    let row = page.locator('.admin-table tbody tr').filter({ hasText: suffix }).first()
    await row.waitFor()
    assert.equal(await page.getByRole('button', { name: '+ Thêm Sản Phẩm Mới', exact: true }).count(), staffType === 'ADMIN' ? 1 : 0)
    await row.getByRole('button', { name: staffType === 'CONTENT' || staffType === 'ADMIN' ? 'Sửa' : 'Xem', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    const editable = staffType === 'ADMIN' || staffType === 'CONTENT'
    assert.equal(await dialog.locator('input[type="text"]').first().isDisabled(), !editable)
    for (const input of await dialog.locator('input[type="number"]').all()) assert.equal(await input.isDisabled(), staffType !== 'ADMIN')
    assert.equal(await dialog.getByRole('button', { name: 'Lưu cập nhật', exact: true }).count(), editable ? 1 : 0)
    if (staffType === 'CONTENT') {
      await dialog.locator('input[type="text"]').first().fill(`UI content ${suffix}`)
      await dialog.getByRole('button', { name: 'Lưu cập nhật', exact: true }).click()
      await dialog.waitFor({ state: 'detached' })
      const current = await api(`/api/admin/products/${product.id}`)
      assert.equal(current.name, `UI content ${suffix}`)
      assert.equal(current.sellingPrice, 300000)
      assert.equal(current.quantity, 9)
    } else await dialog.getByRole('button', { name: 'Đóng', exact: true }).first().click()
    row = page.locator('.admin-table tbody tr').filter({ hasText: suffix }).first()
    if (!editable) {
      await row.getByRole('button', { name: 'Ảnh', exact: true }).click()
      await page.getByRole('dialog', { name: 'Album ảnh sản phẩm' }).waitFor()
      assert.equal(await page.locator('.gallery-upload-zone').count(), 0)
      await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).first().click()
    }
    if (staffType === 'CONTENT') {
      searchedModules.length = 0
      await page.keyboard.press('Control+k')
      await page.locator('.admin-global-search-input').fill(suffix)
      await page.locator('.admin-search-result-row').first().waitFor()
      assert(searchedModules.length > 0)
      assert(searchedModules.every(module => module === 'products'))
      await page.keyboard.press('Escape')
      await page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('furniture_admin_user'))
        localStorage.setItem('furniture_admin_user', JSON.stringify({ ...user, role: 'ADMIN', staffType: 'WAREHOUSE' }))
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('.admin-navbar').waitFor()
      assert.equal(await page.locator('.admin-nav-item').count(), 1, 'Changing localStorage must not grant admin access')
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('furniture_admin_user')).staffType), 'CONTENT')
    }
    await page.screenshot({ path: fileURLToPath(new URL(`${staffType.toLowerCase()}.png`, artifacts)), fullPage: true, animations: 'disabled' })
    if (staffType === 'WAREHOUSE') {
      await page.getByRole('button', { name: 'Đơn hàng', exact: true }).click()
      await page.locator('.admin-table tbody tr').first().waitFor()
      assert.equal(await page.locator('.btn-action-confirm, .btn-action-complete, .btn-action-cancel').count(), 0)
      assert.equal(await page.getByTitle('Duyệt đơn & Gán nhân viên phụ trách').count(), 0)
    }
    if (staffType !== 'ADMIN') {
      await page.goto(`${origin}/admin/users`, { waitUntil: 'domcontentloaded' })
      await page.locator('.admin-navbar').waitFor()
      await page.waitForURL(`**/admin/${landing}`)
      assert.equal(await page.getByRole('button', { name: 'Tài khoản & phân quyền', exact: true }).count(), 0)
    } else {
      await page.getByRole('button', { name: 'Nhân viên', exact: true }).click()
      await page.getByRole('button', { name: 'Thêm Nhân Viên Mới', exact: true }).click()
      await page.getByPlaceholder('VD: staff_duc, staff_ha...').fill(`ui_assigned_${suffix}`)
      await page.getByPlaceholder('Tối thiểu 6 ký tự...').fill('QaPass123!')
      await page.getByPlaceholder('VD: Hoàng Minh Đức, Lê Thị Thu Hà...').fill(`Assigned ${suffix}`)
      await page.getByLabel('Vị trí công việc', { exact: true }).selectOption('CONTENT')
      await page.getByRole('button', { name: 'Xác Nhận Tạo Nhân Viên', exact: true }).click()
      await page.locator('.admin-modal-card').waitFor({ state: 'detached' })
      await page.getByPlaceholder('Tìm nhân viên theo Họ tên, SĐT, Email, Username...').fill(`ui_assigned_${suffix}`)
      const staffRow = page.locator('tbody tr').filter({ hasText: `Assigned ${suffix}` })
      await staffRow.waitFor()
      await staffRow.getByRole('button', { name: /Sửa/ }).click()
      await page.getByLabel('Vị trí công việc', { exact: true }).selectOption('WAREHOUSE')
      await page.getByRole('button', { name: 'Lưu Thay Đổi', exact: true }).click()
      await page.locator('.admin-modal-card').waitFor({ state: 'detached' })
      const saved = await api(`/api/admin/staff?search=ui_assigned_${suffix}`)
      assert.equal(saved.content[0].staffType, 'WAREHOUSE')
    }
    await page.setViewportSize({ width: 390, height: 844 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${staffType}: mobile overflow`)
    results.push(staffType)
    console.log('PASS real UI role:', staffType)
    await page.close()
  }
  assert.deepEqual(errors, [])
  await fs.writeFile(new URL('results.json', artifacts), JSON.stringify({ passed: results.length, roles: results, errors, api: 'real Spring Boot on isolated PGlite' }, null, 2))
} catch (error) {
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: fileURLToPath(new URL('failure.png', artifacts)), fullPage: true, animations: 'disabled' })
  console.error(error)
  process.exitCode = 1
} finally { await browser.close() }
