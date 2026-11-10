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
  const writes = []
  let product = null
  let failUpload = true
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7S8AAAAASUVORK5CYII=', 'base64')
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.setItem('furniture_custom_api_url', 'http://127.0.0.1:18080')
    localStorage.setItem('furniture_admin_user', JSON.stringify({ role: 'ADMIN', accessToken: 'file-test', apiBaseUrl: 'http://127.0.0.1:18080' }))
  })
  const path = '/__product_file_check'
  await page.route(`**${path}`, async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml(path, `
    <div class="admin-shell"><div class="admin-main"><main class="admin-content-body"><div id="root"></div></main></div></div>
    <script type="module">
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import Products from '/src/admin/AdminProductManagement.jsx';
      import '/src/admin/admin.css'; import '/src/admin/admin-modern.css';
      createRoot(document.getElementById('root')).render(React.createElement(Products, {currentUser: {role: 'ADMIN'}}));
    </script>`),
  }))
  await page.route('https://example.test/**', route => route.abort())
  await page.route('**/uploads/products/**', route => route.fulfill({ contentType: 'image/png', body: png }))
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    assert.equal(url.origin, 'http://127.0.0.1:18080')
    assert.equal(request.headers().authorization, 'Bearer file-test')
    if (request.method() !== 'GET') writes.push({ method: request.method(), url })
    if (url.pathname.endsWith('/categories')) return route.fulfill({ json: [{ id: 1, name: 'Sofa' }] })
    if (url.pathname.endsWith('/images')) {
      assert.equal(url.searchParams.get('makePrimary'), 'true')
      assert(request.headers()['content-type'].includes('multipart/form-data'))
      assert(request.postDataBuffer().includes(png))
      if (failUpload) return route.fulfill({ status: 500, json: { error: 'Không thể lưu ảnh thử nghiệm' } })
      product.imageUrl = '/uploads/products/sofa.png'
      product.images = [{ id: 1, imageUrl: 'https://example.test/broken.jpg', isPrimary: false }, { id: 2, imageUrl: product.imageUrl, isPrimary: true }]
      return route.fulfill({ json: product.images })
    }
    if (request.method() === 'POST' || request.method() === 'PUT') {
      product = { ...request.postDataJSON(), id: 1, images: product?.images || [] }
      return route.fulfill({ status: request.method() === 'POST' ? 201 : 200, json: product })
    }
    await route.fulfill({ json: url.pathname.endsWith('/1') ? product : { content: product ? [product] : [], page: 0, totalPages: 1, totalElements: product ? 1 : 0 } })
  })
  await page.goto(new URL(path, server.resolvedUrls.local[0]).href)
  await page.getByRole('button', { name: '+ Thêm Sản Phẩm Mới', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Thông tin chỉnh sửa sản phẩm' })
  await dialog.getByPlaceholder('VD: Sofa Da Bò Ý Nhập Khẩu Góc Chữ L, Bàn Ăn Gỗ Sồi Bắc Âu 6 Ghế...').fill('Sofa có ảnh từ máy')
  await dialog.getByPlaceholder('VD: 15500000').fill('5000000')
  await dialog.getByLabel('Đường dẫn ảnh đại diện chính (URL)').fill('https://example.test/broken.jpg')
  const picker = dialog.getByLabel('Ảnh sản phẩm từ máy tính')
  await picker.setInputFiles({ name: 'bad.html', mimeType: 'text/html', buffer: Buffer.from('<html/>') })
  await dialog.getByText('Chỉ chọn ảnh JPG, PNG, WEBP hoặc GIF.', { exact: true }).waitFor()
  await picker.setInputFiles({ name: 'sofa.png', mimeType: 'image/png', buffer: png })
  await dialog.getByRole('button', { name: 'Tạo sản phẩm', exact: true }).click()
  await dialog.getByText(/Đã lưu sản phẩm #1, nhưng tải ảnh thất bại/).waitFor()
  failUpload = false
  await dialog.getByRole('button', { name: 'Lưu cập nhật', exact: true }).click()
  await dialog.waitFor({ state: 'detached' })
  assert.equal(writes.filter(write => write.method === 'POST' && write.url.pathname === '/api/admin/products').length, 1, 'Retry must not create another product')
  const thumb = page.locator('img.product-thumb-img')
  await thumb.waitFor()
  assert.equal(await thumb.getAttribute('src'), 'http://127.0.0.1:18080/uploads/products/sofa.png')
  await page.waitForFunction(() => document.querySelector('img.product-thumb-img')?.naturalWidth > 0)
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  assert.equal(await dialog.getByLabel('Đường dẫn ảnh đại diện chính (URL)').inputValue(), '/uploads/products/sofa.png')
  await dialog.getByRole('button', { name: 'Lưu cập nhật', exact: true }).click()
  await dialog.waitFor({ state: 'detached' })
  fs.mkdirSync(new URL('../runtime/product-file', import.meta.url), { recursive: true })
  await page.screenshot({ path: 'qa/runtime/product-file/desktop.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await picker.waitFor()
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: 'qa/runtime/product-file/mobile.png', animations: 'disabled' })
  assert.deepEqual(errors, [])
  console.log('PASS product file form: URL + file, content validation, failed upload/retry without duplicate product, file primary, backend image URL, editing uploaded paths, mobile')
} finally {
  await browser.close()
  await server.close()
}
