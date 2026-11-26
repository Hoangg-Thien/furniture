import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mockAdminSession } from './admin-auth.mjs'

// Isolated API fixtures: this check never writes to the application database.
const origin = process.env.QA_ADMIN_ORIGIN || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
page.setDefaultTimeout(10000)
await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
const errors = []
let failVoucherHistory = false
let failCampaignDetail = false
page.on('pageerror', error => errors.push(error.message))
const program = { id: 1, name: 'Tri ân mùa đông', description: 'Ưu đãi nội thất', startDate: '2026-12-08T00:00:00', endDate: '2026-12-10T23:59:00', status: 'ACTIVE', vouchersCount: 2, productDiscountsCount: 1, orderDiscountsCount: 1 }
const otherProgram = { ...program, id: 2, name: 'Tân gia', vouchersCount: 1, productDiscountsCount: 0, orderDiscountsCount: 0 }
const productDiscounts = [{ id: 1, productName: 'Sofa gỗ sồi', sellingPrice: 10000000, discountedPrice: 8500000, discountPercent: 15, startDate: program.startDate, endDate: program.endDate }]
const orderDiscounts = [{ id: 2, minimumAmount: 5000000, discountPercent: 8, startDate: program.startDate, endDate: program.endDate }]
const vouchers = ['ORDER', 'VIP'].map((voucherType, index) => ({ id: index + 1, promotionProgramId: 1, code: index ? 'VIPWINTER' : 'TRI92', voucherType, discountPercent: 50, minimumAmount: 0, quantity: 100, usedQuantity: 1, ordersCount: 1, status: index ? 'INACTIVE' : 'ACTIVE', archived: false }))
vouchers[1].customerTier = 'GOLD'
vouchers.push({ ...vouchers[0], id: 3, promotionProgramId: 2, code: 'TANGIA' })
await page.addInitScript(() => sessionStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, username: 'admin01', role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' })))
await page.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname
  let data = []
  if (path === '/api/admin/promotions') data = [program, otherProgram]
  if (path === '/api/admin/promotions/vouchers') data = vouchers
  if (path === '/api/admin/promotions/1/detail') {
    if (failCampaignDetail) return route.fulfill({ status: 503, json: { error: 'Chưa tải được chiến dịch' } })
    data = { program, vouchers: vouchers.filter(voucher => voucher.promotionProgramId === 1), productDiscounts, orderDiscounts }
  }
  if (path === '/api/admin/promotions/2/detail') data = { program: otherProgram, vouchers: vouchers.filter(voucher => voucher.promotionProgramId === 2), productDiscounts: [], orderDiscounts: [] }
  if (path === '/api/admin/promotions/vouchers/1/orders') data = [{ id: 42, order_date: '2026-12-08T10:30:00', status: 'COMPLETED', discount_amount: 500000, total_amount: 500000 }]
  if (path === '/api/admin/promotions/vouchers/2/orders' && failVoucherHistory) return route.fulfill({ status: 503, json: { error: 'Không tải được lịch sử voucher' } })
  if (path === '/api/admin/products') data = { content: [{ id: 1, name: 'Sofa gỗ sồi', sellingPrice: 10000000 }], totalPages: 1 }
  return route.fulfill({ json: data })
})
await mockAdminSession(page)
await fs.mkdir('qa/artifacts/promotion-layout', { recursive: true })
const checkDetailLayout = async (detail, name) => {
  const layout = await detail.evaluate(el => {
    const panel = el.getBoundingClientRect()
    const list = el.previousElementSibling.getBoundingClientRect()
    return { besideList: panel.left >= list.right, belowList: panel.top >= list.bottom }
  })
  assert(name === 'desktop' ? layout.besideList : layout.belowList)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'list and detail fit the viewport')
}
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto(origin + '/admin/promotions', { waitUntil: 'domcontentloaded' })
    const campaignList = page.getByRole('region', { name: 'Danh sách chiến dịch' })
    const campaign = campaignList.getByRole('row', { name: 'Xem chi tiết chiến dịch Tri ân mùa đông' })
    const campaignDetail = page.getByRole('region', { name: 'Chi tiết chiến dịch' })
    await campaign.waitFor()
    assert.equal(await campaignDetail.count(), 0)
    failCampaignDetail = true
    const campaignDate = campaign.getByRole('cell').nth(1)
    if (name === 'desktop') {
      await campaign.getByRole('button', { name: 'Thiết lập ưu đãi: Tri ân mùa đông', exact: true }).hover()
      await page.waitForTimeout(300)
      assert.equal(await campaignDetail.count(), 0, 'hovering a row action keeps the list in place')
      await campaignDate.hover()
    } else {
      await campaignDate.click()
    }
    await campaignDetail.getByRole('heading', { name: 'Tri ân mùa đông', exact: true }).waitFor()
    assert.equal(await campaign.getAttribute('aria-current'), 'true')
    assert.equal(await campaignDetail.getByRole('tablist').count(), 0)
    const orderSection = campaignDetail.getByRole('region', { name: 'Voucher theo hóa đơn', exact: true })
    const productSection = campaignDetail.getByRole('region', { name: 'Giảm giá theo sản phẩm', exact: true })
    const memberSection = campaignDetail.getByRole('region', { name: 'Voucher theo hạng thành viên', exact: true })
    await orderSection.getByRole('cell', { name: 'TRI92', exact: true }).waitFor()
    await memberSection.getByRole('cell', { name: 'VIPWINTER', exact: true }).waitFor()
    assert.equal(await campaignDetail.getByRole('cell', { name: 'TANGIA', exact: true }).count(), 0)
    assert.equal(await page.getByRole('dialog').count(), 0)
    await campaignDetail.getByRole('alert').waitFor()
    failCampaignDetail = false
    await campaignDetail.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await productSection.getByRole('cell', { name: 'Sofa gỗ sồi', exact: true }).waitFor()
    assert.match(await productSection.innerText(), /8\.500\.000/)
    assert.equal(await memberSection.getByRole('cell', { name: 'TRI92', exact: true }).count(), 0)
    assert.deepEqual(await campaignDetail.getByRole('heading', { level: 3 }).allTextContents(), ['Tri ân mùa đông', 'Voucher theo hóa đơn', 'Giảm giá theo sản phẩm', 'Voucher theo hạng thành viên'])
    await checkDetailLayout(campaignDetail, name)
    await campaignDetail.getByRole('heading', { name: 'Chi tiết chiến dịch', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `qa/artifacts/promotion-layout/campaign-${name}.png`, fullPage: true, animations: 'disabled' })
    const otherCampaign = campaignList.getByRole('row', { name: 'Xem chi tiết chiến dịch Tân gia' })
    if (name === 'desktop') {
      await otherCampaign.getByRole('cell').nth(1).hover()
    } else {
      await otherCampaign.press('Enter')
    }
    await campaignDetail.getByRole('cell', { name: 'TANGIA', exact: true }).waitFor()
    if (name === 'desktop') {
      await campaignDetail.getByRole('heading', { name: 'Chi tiết chiến dịch', exact: true }).hover()
      assert.equal(await otherCampaign.getAttribute('aria-current'), 'true', 'the detail stays open when the pointer enters it')
    }
    await productSection.getByText('Chiến dịch này chưa có sản phẩm giảm giá.', { exact: true }).waitFor()
    assert.equal(await orderSection.getByRole('cell', { name: 'TRI92', exact: true }).count(), 0)
    await campaignDetail.getByRole('button', { name: 'Đóng chi tiết chiến dịch' }).click()
    assert.equal(await campaignDetail.count(), 0)
    await page.getByRole('button', { name: 'Voucher', exact: true }).click()
    const workspace = page.getByRole('region', { name: 'Quản lý voucher' })
    const scroll = workspace.getByRole('region', { name: 'Danh sách voucher' })
    const otherVoucher = scroll.getByRole('row', { name: 'Xem chi tiết voucher TANGIA' })
    await otherVoucher.waitFor()
    await workspace.getByLabel('Chiến dịch', { exact: true }).selectOption('1')
    assert.equal(await otherVoucher.count(), 0)
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert(await workspace.locator('.promotion-voucher-check').isHidden())
    for (const selector of ['.promotion-voucher-discount', '.promotion-voucher-status']) {
      assert.equal(await workspace.locator(selector).first().evaluate(el => getComputedStyle(el).whiteSpace), 'nowrap')
    }
    assert.deepEqual((await scroll.getByRole('columnheader').allTextContents()).slice(0, 4), ['Mã voucher', 'Loại voucher', 'Ưu đãi', 'Trạng thái'])
    const firstVoucher = scroll.getByRole('row', { name: 'Xem chi tiết voucher TRI92' })
    const secondVoucher = scroll.getByRole('row', { name: 'Xem chi tiết voucher VIPWINTER' })
    const detail = workspace.getByRole('region', { name: 'Chi tiết voucher' })
    assert.equal(await detail.count(), 0)
    if (name === 'desktop') {
      await firstVoucher.getByRole('cell', { name: 'Giảm 50%', exact: true }).hover()
      await page.waitForTimeout(300)
      assert.equal(await detail.count(), 0, 'the voucher list opens detail on click')
    }
    await firstVoucher.getByRole('cell', { name: 'Đã kích hoạt', exact: true }).click()
    await detail.getByRole('heading', { name: 'Voucher TRI92', exact: true }).waitFor()
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await firstVoucher.getAttribute('aria-current'), 'true')
    assert.deepEqual(await detail.locator('h3').allTextContents(), ['Điều kiện áp dụng', 'Voucher TRI92', 'Lịch sử sử dụng'])
    await detail.getByRole('region', { name: 'Lịch sử sử dụng voucher' }).getByRole('cell', { name: '#42', exact: true }).waitFor()
    await detail.getByRole('cell', { name: 'Hoàn tất', exact: true }).waitFor()
    await checkDetailLayout(detail, name)
    await detail.getByRole('button', { name: 'Đóng chi tiết voucher' }).click()
    assert.equal(await detail.count(), 0)
    failVoucherHistory = true
    await secondVoucher.press('Enter')
    await detail.getByText('Vàng (từ 50 triệu)', { exact: true }).waitFor()
    await detail.getByRole('alert').getByText('Không tải được lịch sử voucher', { exact: true }).waitFor()
    failVoucherHistory = false
    await detail.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await detail.getByText('Chưa có đơn sử dụng mã này.', { exact: true }).waitFor()
    await scroll.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `qa/artifacts/promotion-layout/${name}.png` })
    await page.getByLabel('Lọc trạng thái voucher').selectOption('INACTIVE')
    assert.equal(await scroll.locator('.promotion-voucher-table tbody tr').count(), 1)
    assert.equal(await detail.count(), 0, 'changing filters clears the previous selection')
    await workspace.locator('.promotion-check-panel summary').click()
    assert(await workspace.locator('.promotion-voucher-check').isVisible())
    await page.getByLabel('Voucher cần kiểm tra').selectOption('1')
    await page.getByLabel('Sản phẩm 1', { exact: true }).selectOption('1')
    await page.getByRole('button', { name: 'Chiến dịch', exact: true }).click()
    await campaign.getByRole('button', { name: '2 voucher', exact: true }).click()
    await orderSection.getByRole('button', { name: 'Quản lý mã theo hóa đơn' }).click()
    await firstVoucher.waitFor()
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await workspace.getByLabel('Chiến dịch', { exact: true }).inputValue(), '1')
    assert.equal(await workspace.locator('#voucher-type-filter').inputValue(), 'ORDER')
    assert.equal(await secondVoucher.count(), 0)
    assert.equal(await otherVoucher.count(), 0)
    console.log(`PASS ${name}: combined campaign details, voucher click, keyboard, filters and retry`)
  }
  assert.deepEqual(errors, [])
} catch (error) {
  console.log(await page.locator("body").innerText(), errors)
  await page.screenshot({ path: "qa/artifacts/promotion-layout/error.png" })
  throw error
} finally {
  await browser.close()
}

