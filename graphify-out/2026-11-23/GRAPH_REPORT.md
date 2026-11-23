# Graph Report - furniture  (2026-11-23)

## Corpus Check
- 285 files · ~230,125 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 44 file(s) not represented in the graph (top: .xml 10, .css 9, .log 9)

## Summary
- 1803 nodes · 6125 edges · 76 communities (47 shown, 29 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 790 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `785ba4b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminStaffRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminSessionController
- VoucherRepository
- AuthRepository
- product-file-api-check.mjs
- AdminIdentity
- OrderReviewPage
- org.springframework.http.ResponseEntity
- org.junit.jupiter.api.DisplayName
- bigdecimal
- org.springframework.web.bind.annotation.PutMapping
- AdminUserRepository
- product-audit-check.mjs
- AdminInvoiceRepository
- AdminInvoiceService.java
- MyOrdersPage.jsx
- FileStorageService.java
- AdminProductManagement
- AdminPermissionsTest.java
- AdminPermissionsTest.java
- NotificationsMenu
- CreateVoucherRequest
- AdminPermissionsTest
- org.springframework.transaction.annotation.Transactional
- cart.js
- org.springframework.web.bind.annotation.GetMapping
- OrderStatusCountDto
- OrderDetailDto
- AdminIdentity
- PageResponse
- GuestCheckoutAccessTest.java
- org.springframework.http.ResponseEntity
- org.springframework.http.ResponseEntity
- AdminPermissionsTest.java
- category-ui-check.mjs
- OrderQuantityTest
- PageResponse
- OrderRepository
- OrderRepository
- AdminPermissionsTest
- VoucherDto
- NotificationsMenu
- AdminActivityDto
- browser-tests.mjs
- AdminUserRepository
- org.springframework.web.bind.annotation.PutMapping
- OrderService.java
- AdminInvoiceService.java
- .cancelOrder
- OrderDetailDto
- CreateReceiptRequest.java
- notblank
- CreateReceiptRequest.java
- vouchers.js
- AccountModal
- PageResponse
- promotion-layout-check.mjs
- jakarta.annotation.PostConstruct
- setCustomApiBaseUrl
- AdminInvoiceService.java
- ApplicationTests.java
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- mrp:demo
- guest-checkout-check.mjs

## God Nodes (most connected - your core abstractions)
1. `getApiBaseUrl()` - 60 edges
2. `App()` - 55 edges
3. `AdminIdentity` - 42 edges
4. `PageResponse` - 41 edges
5. `OrderReviewPage()` - 41 edges
6. `AdminPromotionRepository` - 40 edges
7. `OrderStockTest` - 36 edges
8. `AdminInvoiceService` - 36 edges
9. `AdminPromotionService` - 35 edges
10. `AdminCategoryRepository` - 34 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `fetchOrders()`  [EXTRACTED]
  frontend/src/user/components/NotificationsMenu.jsx → frontend/src/lib/orders.js
- `load()` --calls--> `getApiBaseUrl()`  [EXTRACTED]
  frontend/src/admin/ProductAuditDialog.jsx → frontend/src/lib/apiConfig.js
- `loadVouchers()` --calls--> `fetchActiveVouchers()`  [EXTRACTED]
  frontend/src/user/components/OrderReviewPage.jsx → frontend/src/lib/vouchers.js
- `AdminPromotionController` --references--> `AdminPromotionService`  [EXTRACTED]
  backend/src/main/java/furniture/controller/AdminPromotionController.java → backend/src/main/java/furniture/service/AdminPromotionService.java
- `AdminPromotionService` --references--> `VoucherService`  [EXTRACTED]
  backend/src/main/java/furniture/service/AdminPromotionService.java → backend/src/main/java/furniture/service/VoucherService.java

## Import Cycles
- None detected.

## Communities (76 total, 29 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.05
Nodes (10): CreateProductDiscountRequest, CreateProgramRequest, CreateVoucherRequest, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, ProgramResponse, AdminPromotionRepository (+2 more)

### Community 1 - "AdminStaffRepository"
Cohesion: 0.07
Nodes (10): CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository, AdminSupplierService (+2 more)

### Community 2 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.10
Nodes (45): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+37 more)

### Community 4 - "VoucherRepository"
Cohesion: 0.07
Nodes (36): AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer(), loginUser, logoutAdminUser() (+28 more)

### Community 5 - "AuthRepository"
Cohesion: 0.10
Nodes (6): AuthController, AuthResponse, RegisterRequest, AuthRepository, AdminSessionService, AuthService

### Community 6 - "product-file-api-check.mjs"
Cohesion: 0.20
Nodes (9): after, catalog, categories, detail, fake, form, local, png (+1 more)

### Community 7 - "AdminIdentity"
Cohesion: 0.10
Nodes (10): CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, AdminStatisticsRepository, AdminStatisticsService (+2 more)

### Community 8 - "OrderReviewPage"
Cohesion: 0.18
Nodes (3): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto

### Community 9 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (35): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrderById(), getOrderUrl(), HISTORY_KEYS, LAST_ORDER_KEYS, orderKey() (+27 more)

### Community 10 - "org.junit.jupiter.api.DisplayName"
Cohesion: 0.05
Nodes (17): CategoryRequest, CategoryResponse, ProductAuditDto, ProductDetailDto, ProductImageDto, ProductSummaryDto, SaveProductRequest, AdminCategoryRepository (+9 more)

### Community 11 - "bigdecimal"
Cohesion: 0.08
Nodes (3): EligibleOrderDto, CreateOrderDiscountRequest, InvoiceResponse

### Community 12 - "org.springframework.web.bind.annotation.PutMapping"
Cohesion: 0.12
Nodes (4): AdminOrderController, AdminStaffController, AdminUserController, ResetPasswordRequest

### Community 13 - "AdminUserRepository"
Cohesion: 0.07
Nodes (10): CreateUserRequest, CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, AdminStaffRepository, AdminUserRepository, AdminStaffService, AdminUserService (+2 more)

### Community 15 - "AdminInvoiceRepository"
Cohesion: 0.07
Nodes (36): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, react-dom@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies (+28 more)

### Community 16 - "AdminInvoiceService.java"
Cohesion: 0.15
Nodes (6): AdminCustomerController, CustomerTableItemDto, UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 17 - "MyOrdersPage.jsx"
Cohesion: 0.19
Nodes (15): fetchOrders(), getLocalOrders(), EMPTY_PRODUCTS, formatPrice(), MyOrdersPage(), loadOrders(), normalizeOrders(), PRODUCT_IMAGES (+7 more)

### Community 18 - "FileStorageService.java"
Cohesion: 0.07
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 20 - "AdminPermissionsTest.java"
Cohesion: 0.09
Nodes (6): CreateOrderRequest, OrderItemDiscount, OrderItemDto, OrderQuote, OrderRepository, OrderService

### Community 22 - "NotificationsMenu"
Cohesion: 0.25
Nodes (7): getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), load(), markRead()

### Community 24 - "AdminPermissionsTest"
Cohesion: 0.26
Nodes (5): mockAdminSession(), sessions, screenshots, errors, pending

### Community 26 - "cart.js"
Cohesion: 0.62
Nodes (5): CART_TIMEOUT_MS, loadCart(), loadCartExpiresAt(), readCart(), saveCart()

### Community 29 - "OrderDetailDto"
Cohesion: 0.08
Nodes (18): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+10 more)

### Community 30 - "AdminIdentity"
Cohesion: 0.10
Nodes (4): AdminProductController, OrderController, VoucherController, AdminIdentity

### Community 32 - "GuestCheckoutAccessTest.java"
Cohesion: 0.12
Nodes (4): AdminProductRepositoryTest, GuestCheckoutAccessTest, ProductStockTest, VoucherLifecyclePermissionsTest

### Community 33 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (22): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+14 more)

### Community 34 - "org.springframework.http.ResponseEntity"
Cohesion: 0.10
Nodes (3): AdminCategoryController, AdminPromotionController, AdminSupplierController

### Community 35 - "AdminPermissionsTest.java"
Cohesion: 0.20
Nodes (4): LoginRequest, UpdateProfileRequest, PasswordUtil, AuthServiceTest

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.14
Nodes (14): AdminProductManagement(), fetchProducts(), handleAddImageUrl(), handleDeleteImage(), handleFileUpload(), handleFilterSubmit(), handleProductSubmit(), handleResetFilters() (+6 more)

### Community 38 - "PageResponse"
Cohesion: 0.16
Nodes (3): AdminAccessInterceptor, AdminActivityInterceptor, AdminActivityRepository

### Community 39 - "OrderRepository"
Cohesion: 0.18
Nodes (5): InvoiceCalculationDto, PreviewInvoiceRequest, VoucherDto, AdminInvoiceService, AcceptanceAndCornerCasesTest

### Community 40 - "OrderRepository"
Cohesion: 0.13
Nodes (4): ValidateVoucherRequest, VoucherRepository, VoucherService, VoucherServiceTest

### Community 43 - "VoucherDto"
Cohesion: 0.12
Nodes (10): artifacts, discounts, errors, future, orderDiscounts, past, product, programs (+2 more)

### Community 44 - "NotificationsMenu"
Cohesion: 0.12
Nodes (11): artifacts, categories, dialog, errors, initialList, names, results, rows (+3 more)

### Community 45 - "AdminActivityDto"
Cohesion: 0.13
Nodes (8): APK_PATH, { exec }, fs, http, localIp, os, path, server

### Community 46 - "browser-tests.mjs"
Cohesion: 0.40
Nodes (5): errors, f, record(), results, scenario()

### Community 47 - "AdminUserRepository"
Cohesion: 0.16
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 49 - "OrderService.java"
Cohesion: 0.23
Nodes (5): ProductController, ProductResponse, ProductRepository, ProductService, ProductOfferDisplayTest

### Community 51 - ".cancelOrder"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 53 - "OrderDetailDto"
Cohesion: 0.10
Nodes (10): CreateInvoiceRequest, CancelOrderRequest, ConfirmOrderRequest, OrderDetailDto, OrderItemDto, AdminInvoiceRepository, AdminOrderRepository, AdminOrderService (+2 more)

### Community 55 - "notblank"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 57 - "vouchers.js"
Cohesion: 0.18
Nodes (14): AdminConfirmModal(), AdminPromotionManagement(), handleCheckVoucher(), viewVoucherOrders(), approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin() (+6 more)

### Community 58 - "AccountModal"
Cohesion: 0.23
Nodes (10): updateProfile(), AccountModal(), handleChange(), handleSave(), startEdit(), handleToggleDefaultInfo(), getAllProvinces(), getDistricts() (+2 more)

### Community 60 - "PageResponse"
Cohesion: 0.18
Nodes (4): InvoiceSummaryDto, OrderSummaryDto, PageResponse, UserSummaryResponse

### Community 62 - "promotion-layout-check.mjs"
Cohesion: 0.50
Nodes (3): errors, program, vouchers

### Community 64 - "setCustomApiBaseUrl"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 65 - "AdminInvoiceService.java"
Cohesion: 0.10
Nodes (4): InvoiceDetailDto, InvoiceItemDto, InvoiceStatusCountDto, OrderResponse

### Community 78 - "guest-checkout-check.mjs"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminIdentity` connect `AdminIdentity` to `GuestCheckoutAccessTest.java`, `org.springframework.http.ResponseEntity`, `AdminSessionController`, `AdminPermissionsTest.java`, `AuthRepository`, `PageResponse`, `OrderRepository`, `org.springframework.web.bind.annotation.PutMapping`, `org.springframework.transaction.annotation.Transactional`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Why does `AdminProductService` connect `org.junit.jupiter.api.DisplayName` to `AdminInvoiceService.java`, `AdminPermissionsTest.java`, `product-audit-check.mjs`, `AdminProductManagement`, `org.springframework.transaction.annotation.Transactional`, `AdminIdentity`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `AdminStaffRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.07071455016660497 - nodes in this community are weakly interconnected._
- **Why does `AdminPromotionRepository` connect `.verify` to `OrderReviewPage`, `AdminProductManagement`, `jakarta.annotation.PostConstruct`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `org.springframework.web.bind.annotation.GetMapping` be split into smaller, more focused modules?**
  _Cohesion score 0.09698189134808853 - nodes in this community are weakly interconnected._