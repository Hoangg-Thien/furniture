import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const products = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1, name: `${index < 19 ? 'Oslo' : 'Other'} ${index + 1}`,
    category: 'Sofa', price: 9800000, quantity: index === 14 ? 3 : 10, imageUrl: '/images/sofa_bang3.jpg',
  }))
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: 'reduce' })
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
    await page.route('**/api/products', route => route.fulfill({ json: products }))
    await page.route('**/api/products/15', route => route.fulfill({ json: { name: 'Oslo 15', sku: 'OSLO-15' } }))
    await page.route('**/api/products/16', route => route.fulfill({ json: { name: 'Oslo 16', sku: 'OSLO-16' } }))

    await page.goto(server.resolvedUrls.local[0])
    const search = page.getByRole('textbox', { name: 'Tìm sản phẩm' })
    const product = page.getByRole('button', { name: 'Xem chi tiết Oslo 15', exact: true })
    await search.fill('Oslo')
    await product.scrollIntoViewIfNeeded()
    const scrollY = await page.evaluate(() => window.scrollY)
    assert.ok(scrollY > 0)

    for (const returnToList of [() => page.getByRole('button', { name: 'Quay lại sản phẩm' }).click(), () => page.goBack()]) {
      await product.click()
      await page.getByRole('heading', { name: 'Oslo 15' }).waitFor()
      assert.match(page.url(), /\/products\/15$/)
      await returnToList()
      await product.waitFor()
      assert.equal(await search.inputValue(), 'Oslo')
      assert.equal(await page.evaluate(() => window.scrollY), scrollY)
      assert.equal(await product.evaluate(element => document.activeElement === element), true)
    }

    await page.goto(new URL('/products/15', server.resolvedUrls.local[0]).href)
    const increase = page.getByRole('button', { name: 'Tăng số lượng' })
    const decrease = page.getByRole('button', { name: 'Giảm số lượng' })
    const add = page.getByRole('button', { name: 'Thêm vào giỏ' })
    const cartBadge = page.locator('.bag-icon .bag-count')
    const toast = page.locator('.cart-toast-compact')
    await increase.click()
    await increase.click()
    assert.equal(await increase.isDisabled(), true)
    await page.locator('.product-detail-limit').getByRole('link', { name: 'liên hệ ngay' }).waitFor()
    assert.equal(await page.locator('.product-detail-quantity-heading small').textContent(), 'Còn 3 sản phẩm')
    assert.equal(await cartBadge.textContent(), '0')
    await decrease.click()
    assert.equal(await page.locator('.product-detail-limit').count(), 0)
    assert.equal(await page.locator('output').textContent(), '2')
    await add.click()
    assert.equal(await page.locator('.product-detail-added').textContent(), ' Đã thêm 2 vào giỏ')
    assert.equal(await cartBadge.textContent(), '2')
    assert.equal(await toast.locator('.cart-toast-qty').textContent(), '+2')
    await increase.click()
    assert.equal(await increase.isDisabled(), true)
    assert.equal(await cartBadge.textContent(), '3')
    assert.equal(await toast.locator('.cart-toast-qty').textContent(), '+1')
    const alertBox = await toast.boundingBox()
    assert.ok(alertBox.width <= 310 && alertBox.x + alertBox.width === width - 14)

    await page.getByRole('button', { name: 'Quay lại sản phẩm' }).click()
    await product.waitFor()
    assert.equal(new URL(page.url()).pathname, '/')
    assert.equal(await page.locator('.product-card').filter({ has: product }).locator('.product-cart-tag strong').textContent(), '3')

    const nextProduct = page.getByRole('button', { name: 'Xem chi tiết Oslo 16', exact: true })
    const nextCard = page.locator('.product-card').filter({ has: nextProduct })
    for (let i = 0; i < 10; i++) await nextCard.locator('.quick-add').click()
    await nextProduct.click()
    await page.getByText('Đã thêm 10 vào giỏ', { exact: true }).waitFor()
    assert.equal(await page.locator('.product-detail-quantity-heading small').count(), 0)
    assert.equal(await page.locator('output').textContent(), '10')
    await decrease.click()
    assert.equal(await page.locator('output').textContent(), '9')
    assert.equal(await cartBadge.textContent(), '12')
    await increase.click()
    assert.equal(await cartBadge.textContent(), '13')
    await page.getByText('Đã thêm 10 vào giỏ', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Quay lại sản phẩm' }).click()
    assert.equal(await nextCard.locator('.product-cart-tag strong').textContent(), '10')

    const toolbar = page.locator('.main-nav:visible, .mobile-sub-nav:visible')
    for (const [label, sectionId] of [['Trang chủ', 'top'], ['Sản phẩm', 'products'], ['Câu chuyện FuniStore', 'story']]) {
      await nextProduct.click()
      await page.getByRole('heading', { name: 'Oslo 16' }).waitFor()
      await page.evaluate(() => window.scrollTo(0, 400))
      assert.equal((await page.locator('.site-header').boundingBox()).y, 0)
      assert.ok((await page.getByRole('button', { name: 'Quay lại sản phẩm' }).boundingBox()).y >= 0)
      await toolbar.getByText(label, { exact: true }).click()
      assert.equal(new URL(page.url()).pathname, '/')
      await page.locator(`#${sectionId}`).waitFor()
      assert.ok(await page.locator(`#${sectionId}`).evaluate(element => element.getBoundingClientRect().top < window.innerHeight))
    }

    await nextProduct.click()
    await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
    await page.getByRole('dialog', { name: /Món đã chọn/ }).getByText('Oslo 16', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Đóng giỏ hàng' }).click()
    assert.match(page.url(), /\/products\/16$/)
    const contactHeading = page.getByRole('heading', { name: 'Liên hệ FuniStore' })
    const warningContact = page.locator('.product-detail-limit').getByRole('link', { name: 'liên hệ ngay' })
    const backToDetail = page.getByRole('button', { name: 'Quay lại chi tiết sản phẩm' })
    await warningContact.scrollIntoViewIfNeeded()
    const detailScrollY = await page.evaluate(() => window.scrollY)
    await warningContact.click()
    await contactHeading.waitFor()
    assert.equal(new URL(page.url()).pathname, '/contact')
    assert.equal(await page.getByRole('link', { name: '1900 6868' }).getAttribute('href'), 'tel:19006868')
    await backToDetail.click()
    await warningContact.waitFor()
    assert.match(page.url(), /\/products\/16$/)
    assert.equal(await page.evaluate(() => window.scrollY), detailScrollY)
    await toolbar.getByRole('link', { name: 'Liên hệ' }).click()
    await contactHeading.waitFor()
    assert.equal(await backToDetail.count(), 0)
    await page.reload()
    await contactHeading.waitFor()
    assert.equal(await backToDetail.count(), 0)
    const contactName = page.getByLabel('Họ và tên', { exact: true })
    assert.equal(await contactName.inputValue(), '')
    await contactName.fill('Khách chưa đăng nhập')
    assert.equal(await contactName.inputValue(), 'Khách chưa đăng nhập')
    await page.route('**/api/orders?customerId=123', route => route.fulfill({ json: [] }))
    let customerTier = 'GOLD'
    await page.route('**/api/auth/me?userId=321', route => {
      assert.equal(route.request().headers().authorization, 'Bearer qa-customer-token')
      const tierProgress = customerTier === 'NEW'
        ? { tier: customerTier, totalSpent: 4000000, completedOrders: 1, nextTier: 'SILVER', nextThreshold: 10000000 }
        : customerTier === 'PLATINUM'
        ? { tier: customerTier, totalSpent: 273050000, completedOrders: 2, nextTier: 'VIP_DIAMOND', nextThreshold: 300000000 }
        : { tier: customerTier, totalSpent: 300000000, completedOrders: 2 }
      return route.fulfill({ json: { customerTier, tierProgress } })
    })
    await page.evaluate(() => localStorage.setItem('furniture_customer_user', JSON.stringify({
      role: 'CUSTOMER', userId: 321, customerId: 123, fullName: 'Nguyễn An', email: 'an@example.test', phone: '0901234567',
      accessToken: 'qa-customer-token', apiBaseUrl: 'http://localhost:8080',
    })))
    await page.reload()
    assert.equal(await contactName.inputValue(), 'Nguyễn An')
    assert.equal(await page.getByLabel('Email', { exact: true }).inputValue(), 'an@example.test')
    assert.equal(await page.getByLabel('Số điện thoại', { exact: true }).inputValue(), '0901234567')
    await contactName.fill('Nguyễn An Mới')
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('furniture_customer_user')).fullName), 'Nguyễn An')
    await toolbar.getByText('Sản phẩm', { exact: true }).click()
    await product.waitFor()
    assert.equal(await cartBadge.textContent(), '0')
    const accountButton = page.locator('button.user-logged-box')
    const accountCard = page.locator('.account-modal-card')
    for (const [tier, label] of [['GOLD', 'Hạng Vàng'], ['VIP_DIAMOND', 'Hạng Kim cương']]) {
      customerTier = tier
      assert.equal(await page.locator('.account-tier').count(), 0)
      await accountButton.click()
      await page.locator('.user-dropdown-header').getByText(label, { exact: true }).waitFor()
      await page.getByRole('menuitem', { name: 'Tài khoản', exact: true }).click()
      await accountCard.locator('.account-avatar-name-row').getByText(label, { exact: true }).waitFor()
      await accountCard.getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    const membership = page.getByRole('dialog', { name: 'Hạng thành viên' })
    customerTier = 'NEW'
    await accountButton.click()
    await page.getByRole('menuitem', { name: 'Xem hạng thành viên' }).click()
    await membership.getByText('Hạng Khách mới', { exact: true }).waitFor()
    await membership.getByText('Nguyễn An', { exact: true }).waitFor()
    const progressBar = membership.getByRole('progressbar', { name: 'Tiến độ lên hạng Bạc' })
    assert.equal(await progressBar.getAttribute('value'), '4000000')
    assert.equal(await progressBar.getAttribute('max'), '10000000')
    await membership.getByRole('button', { name: 'Đóng' }).click()
    customerTier = 'PLATINUM'
    await accountButton.click()
    await page.getByRole('menuitem', { name: 'Xem hạng thành viên' }).click()
    await membership.getByText('Hạng Bạch kim', { exact: true }).waitFor()
    const diamondProgress = membership.getByRole('progressbar', { name: 'Tiến độ lên hạng Kim cương' })
    assert.equal(await diamondProgress.getAttribute('value'), '273050000')
    assert.equal(await diamondProgress.getAttribute('max'), '300000000')
    await membership.getByText(/Còn 26\.950\.000\s*₫ để lên hạng Kim cương/).waitFor()
    await membership.getByRole('button', { name: 'Đóng' }).click()
    customerTier = 'VIP_DIAMOND'
    await accountButton.click()
    await page.getByRole('menuitem', { name: 'Xem hạng thành viên' }).click()
    await membership.getByText('Bạn đã đạt hạng thành viên cao nhất.').waitFor()
    const tierGuide = membership.getByRole('region', { name: 'Chi tiết các hạng mức' })
    for (const amount of [10, 50, 100, 300]) await tierGuide.getByText(`Từ ${amount} triệu ₫`, { exact: true }).waitFor()
    assert.match(await tierGuide.locator('[aria-current="step"]').textContent(), /Kim cương/)
    await tierGuide.getByText(/voucher dành riêng cho thành viên Bạc/).waitFor()
    await page.route('**/api/vouchers/active', route => {
      assert.equal(route.request().headers().authorization, 'Bearer qa-customer-token')
      return route.fulfill({ json: [{ id: 80, code: 'QA-DIAMOND', program_name: 'Voucher thử hạng Kim cương',
        voucher_type: 'VIP', customer_tier: 'VIP_DIAMOND', remaining_quantity: 5, discount_percent: 10 }] })
    })
    await tierGuide.getByRole('button', { name: 'Xem voucher của tôi' }).click()
    await membership.waitFor({ state: 'hidden' })
    const vouchers = page.locator('.vouchers-overlay')
    await vouchers.getByRole('heading', { name: 'Voucher thử hạng Kim cương' }).waitFor()
    await vouchers.getByRole('button', { name: 'Đóng cửa sổ' }).click()
    if (width === 1440) {
      await page.route('**/api/auth/logout', route => route.fulfill({ json: {} }))
      await page.route('**/api/orders?customerId=124', route => route.fulfill({ json: [] }))
      await page.route('**/api/auth/login', route => {
        const { username } = route.request().postDataJSON()
        return route.fulfill({ json: { role: 'CUSTOMER', customerId: username === 'qa-a' ? 123 : 124, fullName: username } })
      })
      await page.route('**/api/auth/register', route => {
        assert.equal(route.request().postDataJSON().address, '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh')
        return route.fulfill({ status: 201, json: {
          role: 'CUSTOMER', customerId: 124, username: 'qa-b', accessToken: 'registration-response-token',
        } })
      })
      const logout = async () => {
        await page.locator('button.user-logged-box').click()
        await page.getByRole('menuitem', { name: 'Đăng xuất' }).click()
      }
      const login = async username => {
        const usernameInput = page.getByPlaceholder('Tên đăng nhập hoặc Email')
        if (!(await usernameInput.isVisible())) await page.locator('.header-actions').getByRole('button', { name: 'Đăng nhập' }).click()
        await usernameInput.fill(username)
        await page.getByPlaceholder('Nhập mật khẩu của bạn').fill('mock-password')
        await page.locator('.auth-form').getByRole('button', { name: 'Đăng nhập' }).click()
        await page.locator('button.user-logged-box').waitFor()
      }
      for (let i = 0; i < 10; i++) await nextCard.locator('.quick-add').click()
      assert.equal(await cartBadge.textContent(), '10')
      await logout()
      assert.equal(await cartBadge.textContent(), '13')
      await page.locator('.header-actions').getByRole('button', { name: 'Đăng nhập' }).click()
      await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
      await page.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Khách B')
      await page.getByPlaceholder('Ví dụ: annguyen99').fill('qa-b')
      await page.getByPlaceholder('Tối thiểu 6 ký tự').fill('mock-password')
      assert.equal(await page.locator('.auth-form').evaluate(form => form.checkValidity()), false)
      await page.locator('#register-email').fill('qa-b@example.test')
      await page.locator('#register-phone').fill('0901234567')
      await page.locator('#register-city').selectOption('TP. Hồ Chí Minh')
      await page.locator('#register-district').selectOption('Quận 1')
      await page.locator('#register-ward').selectOption('Phường Bến Thành')
      await page.locator('#register-street').fill('123 Nguyễn Thị Minh Khai')
      await page.getByRole('button', { name: 'Đăng ký tài khoản' }).click()
      await page.getByText('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.').waitFor()
      assert.equal(await page.getByPlaceholder('Tên đăng nhập hoặc Email').inputValue(), 'qa-b')
      assert.equal(await page.getByPlaceholder('Nhập mật khẩu của bạn').inputValue(), '')
      assert.equal(await page.evaluate(() => localStorage.getItem('furniture_customer_user')), null)
      assert.equal(await cartBadge.textContent(), '13')
      await login('qa-b')
      assert.equal(await cartBadge.textContent(), '0')
      await logout()
      await login('qa-a')
      assert.equal(await cartBadge.textContent(), '10')
    }
    await page.close()
    console.log(`PASS product details, cart and shared toolbar at ${width}px`)
  }
} finally {
  await browser.close()
  await server.close()
}
