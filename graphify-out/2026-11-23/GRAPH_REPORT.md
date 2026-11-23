# Graph Report - furniture  (2026-11-23)

## Corpus Check
- 285 files · ~230,035 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 44 file(s) not represented in the graph (top: .xml 10, .css 9, .log 9)

## Summary
- 1786 nodes · 6181 edges · 82 communities (49 shown, 33 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 786 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `785ba4b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminStaffRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminProductService
- VoucherRepository
- AuthRepository
- AdminStatisticsServiceTest.java
- AdminIdentity
- OrderReviewPage
- org.springframework.http.ResponseEntity
- AdminCategoryRepository
- AdminOrderService
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
- PageResponse
- AdminPermissionsTest
- org.springframework.transaction.annotation.Transactional
- AdminPromotionRepository
- AdminInvoiceService
- AdminPromotionService.java
- OrderDetailDto
- org.junit.jupiter.api.DisplayName
- PageResponse
- admin-redesign-check.mjs
- org.springframework.http.ResponseEntity
- org.springframework.http.ResponseEntity
- .hash
- category-ui-check.mjs
- AdminProductRepository
- PageResponse
- OrderRepository
- OrderRepository
- AdminSessionService
- AdminInvoiceServiceTest
- VoucherDto
- NotificationsMenu
- AdminActivityDto
- browser-tests.mjs
- AdminUserRepository
- org.springframework.web.bind.annotation.PutMapping
- OrderService.java
- AdminInvoiceService.java
- .cancelOrder
- AdminOrderRepository
- CreateReceiptRequest.java
- notblank
- CreateReceiptRequest.java
- vouchers.js
- AccountModal
- AdminActivityDto
- PageResponse
- app/build.gradle
- jakarta.annotation.PostConstruct
- setCustomApiBaseUrl
- AdminInvoiceService.java
- ApplicationTests.java
- ProductAuditRepository.java
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- mrp:demo
- guest-checkout-check.mjs
- InvoiceStatusCountDto
- TopProductDto
- FileStorageService

## God Nodes (most connected - your core abstractions)
1. `getApiBaseUrl()` - 61 edges
2. `App()` - 55 edges
3. `AdminPromotionRepository` - 43 edges
4. `AdminIdentity` - 42 edges
5. `PageResponse` - 41 edges
6. `OrderReviewPage()` - 41 edges
7. `AdminInvoiceService` - 37 edges
8. `AdminProductRepository` - 36 edges
9. `AdminPromotionService` - 35 edges
10. `OrderStockTest` - 35 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `fetchOrders()`  [EXTRACTED]
  frontend/src/user/components/NotificationsMenu.jsx → frontend/src/lib/orders.js
- `loadVouchers()` --calls--> `fetchActiveVouchers()`  [EXTRACTED]
  frontend/src/user/components/OrderReviewPage.jsx → frontend/src/lib/vouchers.js
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/product-audit-check.mjs → qa/harness/admin-auth.mjs
- `AdminAccessInterceptor` --references--> `AdminSessionService`  [EXTRACTED]
  backend/src/main/java/furniture/config/AdminAccessInterceptor.java → backend/src/main/java/furniture/service/AdminSessionService.java
- `WebMvcConfig` --references--> `AdminAccessInterceptor`  [EXTRACTED]
  backend/src/main/java/furniture/config/WebMvcConfig.java → backend/src/main/java/furniture/config/AdminAccessInterceptor.java

## Import Cycles
- None detected.

## Communities (82 total, 33 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.08
Nodes (6): CreateProgramRequest, CreateVoucherRequest, ProgramResponse, AdminPromotionRepository, AdminPromotionService, AdminPromotionServiceTest

### Community 1 - "AdminStaffRepository"
Cohesion: 0.06
Nodes (11): AdminSupplierController, CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository (+3 more)

### Community 2 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.09
Nodes (49): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+41 more)

### Community 3 - "AdminProductService"
Cohesion: 0.20
Nodes (3): ProductAuditRepository, AdminProductService, ProductAuditTest

### Community 4 - "VoucherRepository"
Cohesion: 0.07
Nodes (44): react-dom@^19.2.8, AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer(), loginUser (+36 more)

### Community 5 - "AuthRepository"
Cohesion: 0.09
Nodes (7): AuthController, AuthResponse, RegisterRequest, UpdateProfileRequest, AuthRepository, AuthService, AuthServiceTest

### Community 7 - "AdminIdentity"
Cohesion: 0.11
Nodes (8): AdminStatisticsController, CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, AdminStatisticsRepository, AdminStatisticsService, AdminStatisticsRepositoryTest, AdminStatisticsServiceTest

### Community 8 - "OrderReviewPage"
Cohesion: 0.14
Nodes (4): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto, InvoiceResponse

### Community 9 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (35): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrderById(), getOrderUrl(), HISTORY_KEYS, LAST_ORDER_KEYS, orderKey() (+27 more)

### Community 10 - "AdminCategoryRepository"
Cohesion: 0.11
Nodes (6): AdminCategoryController, CategoryRequest, CategoryResponse, AdminCategoryRepository, AdminCategoryService, AdminCategoryServiceTest

### Community 12 - "AdminOrderService"
Cohesion: 0.13
Nodes (5): AdminOrderController, ConfirmOrderRequest, OrderStatusCountDto, AdminOrderService, AdminOrderServiceTest

### Community 13 - "AdminUserRepository"
Cohesion: 0.08
Nodes (8): CreateUserRequest, CreateStaffRequest, UpdateStaffRequest, AdminStaffRepository, AdminUserRepository, AdminStaffService, AdminUserService, AdminUserServiceTest

### Community 15 - "AdminInvoiceRepository"
Cohesion: 0.07
Nodes (34): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies, @capacitor/cli@^8.5.3 (+26 more)

### Community 16 - "AdminInvoiceService.java"
Cohesion: 0.20
Nodes (4): UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 17 - "MyOrdersPage.jsx"
Cohesion: 0.21
Nodes (14): fetchOrders(), getLocalOrders(), EMPTY_PRODUCTS, formatPrice(), MyOrdersPage(), loadOrders(), normalizeOrders(), PRODUCT_IMAGES (+6 more)

### Community 18 - "FileStorageService.java"
Cohesion: 0.07
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 20 - "AdminPermissionsTest.java"
Cohesion: 0.09
Nodes (4): OrderController, OrderRepository, OrderService, OrderQuantityTest

### Community 22 - "NotificationsMenu"
Cohesion: 0.25
Nodes (7): getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), load(), markRead()

### Community 23 - "PageResponse"
Cohesion: 0.12
Nodes (3): CreateVoucherRequest, VoucherRepository, VoucherService

### Community 24 - "AdminPermissionsTest"
Cohesion: 0.26
Nodes (5): mockAdminSession(), sessions, screenshots, errors, pending

### Community 25 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.27
Nodes (4): AdminNotificationController, AdminStaffController, AdminUserController, VoucherController

### Community 26 - "AdminPromotionRepository"
Cohesion: 0.24
Nodes (3): InvoiceDetailDto, InvoiceItemDto, AdminInvoiceRepository

### Community 27 - "AdminInvoiceService"
Cohesion: 0.22
Nodes (3): AdminInvoiceController, EligibleOrderDto, AdminInvoiceService

### Community 28 - "AdminPromotionService.java"
Cohesion: 0.19
Nodes (5): CreateOrderDiscountRequest, CreateProductDiscountRequest, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse

### Community 29 - "OrderDetailDto"
Cohesion: 0.08
Nodes (21): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+13 more)

### Community 32 - "admin-redesign-check.mjs"
Cohesion: 0.14
Nodes (4): LoginRequest, PasswordUtil, GuestCheckoutAccessTest, PasswordUtilTest

### Community 33 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (22): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+14 more)

### Community 34 - "org.springframework.http.ResponseEntity"
Cohesion: 0.08
Nodes (4): AdminCustomerController, AdminProductController, AdminPromotionController, ResetPasswordRequest

### Community 35 - ".hash"
Cohesion: 0.13
Nodes (6): VoucherCheckRequest, CreateOrderRequest, OrderItemDiscount, OrderItemDto, OrderQuote, OrderResponse

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.20
Nodes (11): AdminProductManagement(), fetchProducts(), handleAddImageUrl(), handleDeleteImage(), handleFileUpload(), handleFilterSubmit(), handleProductSubmit(), handleResetFilters() (+3 more)

### Community 37 - "AdminProductRepository"
Cohesion: 0.17
Nodes (4): ProductDetailDto, ProductImageDto, AdminProductRepository, AdminProductServiceTest

### Community 38 - "PageResponse"
Cohesion: 0.14
Nodes (5): AdminAccessInterceptor, AdminActivityInterceptor, AdminIdentity, AdminActivityRepository, VoucherLifecyclePermissionsTest

### Community 39 - "OrderRepository"
Cohesion: 0.28
Nodes (4): PreviewInvoiceRequest, OrderDetailDto, VoucherDto, AcceptanceAndCornerCasesTest

### Community 41 - "AdminSessionService"
Cohesion: 0.13
Nodes (4): AdminSessionController, AdminSessionService, AdminPermissionsTest, Probe

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
Cohesion: 0.20
Nodes (6): ProductController, ProductResponse, ProductRepository, ProductService, ProductOfferDisplayTest, ProductStockTest

### Community 51 - ".cancelOrder"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 53 - "AdminOrderRepository"
Cohesion: 0.17
Nodes (3): CancelOrderRequest, OrderItemDto, AdminOrderRepository

### Community 55 - "notblank"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 57 - "vouchers.js"
Cohesion: 0.18
Nodes (13): AdminConfirmModal(), AdminPromotionManagement(), handleCheckVoucher(), approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), parseVoucherCustomerId() (+5 more)

### Community 58 - "AccountModal"
Cohesion: 0.20
Nodes (11): updateProfile(), AccountModal(), handleChange(), handleSave(), startEdit(), handleToggleDefaultInfo(), getAllProvinces(), getDistricts() (+3 more)

### Community 60 - "PageResponse"
Cohesion: 0.10
Nodes (7): CustomerTableItemDto, InvoiceSummaryDto, OrderSummaryDto, PageResponse, ProductSummaryDto, StaffSummaryDto, UserSummaryResponse

### Community 62 - "app/build.gradle"
Cohesion: 0.12
Nodes (9): api(), artifacts, errors, results, suffix, migration, errors, program (+1 more)

### Community 64 - "setCustomApiBaseUrl"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 78 - "guest-checkout-check.mjs"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 306 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminPromotionRepository` connect `.verify` to `AdminProductRepository`, `OrderReviewPage`, `AdminProductManagement`, `AdminPromotionService.java`, `jakarta.annotation.PostConstruct`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.0770735524256651 - nodes in this community are weakly interconnected._
- **Why does `getApiBaseUrl()` connect `org.springframework.web.bind.annotation.GetMapping` to `category-ui-check.mjs`, `VoucherRepository`, `org.springframework.http.ResponseEntity`, `MyOrdersPage.jsx`, `CreateReceiptRequest.java`, `vouchers.js`, `AccountModal`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `AdminStaffRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.06259183073758448 - nodes in this community are weakly interconnected._
- **Why does `App()` connect `VoucherRepository` to `org.springframework.web.bind.annotation.GetMapping`, `org.springframework.http.ResponseEntity`, `MyOrdersPage.jsx`, `NotificationsMenu`, `vouchers.js`, `AccountModal`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `org.springframework.web.bind.annotation.GetMapping` be split into smaller, more focused modules?**
  _Cohesion score 0.09159261790840738 - nodes in this community are weakly interconnected._