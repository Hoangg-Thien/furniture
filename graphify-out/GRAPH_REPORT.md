# Graph Report - furniture  (2026-11-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1593 nodes · 5343 edges · 75 communities (43 shown, 32 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 689 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f6c3094`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminPromotionRepository
- AdminSupplierRepository
- AdminLayout.jsx
- AdminSessionService
- App
- org.springframework.http.ResponseEntity
- AcceptanceAndCornerCasesTest.java
- OrderReviewPage
- AdminStatisticsServiceTest.java
- org.springframework.jdbc.core.JdbcTemplate
- bigdecimal
- AdminOrderRepository
- frontend/package.json
- org.springframework.web.bind.annotation.GetMapping
- AdminStaffRepository
- orders.js
- start.mjs
- org.springframework.stereotype.Service
- AdminInvoiceController.java
- OrderRepository
- AdminPermissionsTest.java
- AdminCustomerRepository
- VoucherRepository
- org.junit.jupiter.api.Test
- AdminInvoiceService.java
- adminApiHeaders
- org.junit.jupiter.api.DisplayName
- FileStorageService.java
- spring
- org.springframework.web.bind.annotation.PostMapping
- admin-redesign-check.mjs
- ref_node_assert
- AdminProductManagement
- NotificationsMenu
- category-ui-check.mjs
- serve-apk.js
- PageResponse
- AdminAccessInterceptor
- SalesDatabaseInitializer.java
- extra-api-tests.mjs
- ExampleInstrumentedTest.java
- AdminInvoiceServiceTest
- api-tests.mjs
- AdminInvoiceService
- ProductRepository
- datasource
- AdminCategoryManagement
- AdminPermissionsTest
- VouchersModal.jsx
- product-audit-check.mjs
- CreateReceiptRequest.java
- OrderShippingInfo.jsx
- guest-checkout-check.mjs
- Application.java
- .oxlintrc.json
- browser-tests.mjs
- InvoiceStatusCountDto
- OrderStatusCountDto
- EligibleOrderDto
- ApplicationTests.java
- main.jsx
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- mrp:demo

## God Nodes (most connected - your core abstractions)
1. `App()` - 49 edges
2. `getApiBaseUrl()` - 48 edges
3. `PageResponse` - 41 edges
4. `AdminPromotionRepository` - 39 edges
5. `OrderReviewPage()` - 38 edges
6. `AdminInvoiceService` - 37 edges
7. `AdminProductRepository` - 34 edges
8. `OrderDetailDto` - 34 edges
9. `AdminCategoryRepository` - 34 edges
10. `lucide-react` - 34 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `fetchOrders()`  [EXTRACTED]
  frontend/src/user/components/NotificationsMenu.jsx → frontend/src/lib/orders.js
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/product-audit-check.mjs → qa/harness/admin-auth.mjs
- `loadVouchers()` --calls--> `fetchActiveVouchers()`  [EXTRACTED]
  frontend/src/user/components/OrderReviewPage.jsx → frontend/src/lib/vouchers.js
- `AdminPromotionService` --references--> `AdminProductRepository`  [EXTRACTED]
  backend/src/main/java/furniture/service/AdminPromotionService.java → backend/src/main/java/furniture/repository/AdminProductRepository.java
- `AcceptanceAndCornerCasesTest` --references--> `AdminProductRepository`  [EXTRACTED]
  backend/src/test/java/furniture/AcceptanceAndCornerCasesTest.java → backend/src/main/java/furniture/repository/AdminProductRepository.java

## Import Cycles
- None detected.

## Communities (75 total, 32 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.05
Nodes (13): CategoryRequest, CategoryResponse, ProductAuditDto, ProductDetailDto, ProductImageDto, ProductSummaryDto, SaveProductRequest, AdminProductRepository (+5 more)

### Community 1 - "AdminPromotionRepository"
Cohesion: 0.07
Nodes (11): CreateOrderDiscountRequest, CreateProductDiscountRequest, CreateProgramRequest, CreateVoucherRequest, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, ProgramResponse (+3 more)

### Community 2 - "AdminSupplierRepository"
Cohesion: 0.07
Nodes (10): CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository, AdminSupplierService (+2 more)

### Community 3 - "AdminLayout.jsx"
Cohesion: 0.10
Nodes (36): AdminCustomerManagement(), AdminDashboard(), AdminGlobalSearchModal(), AdminInvoiceManagement(), AccessDeniedView(), AdminWorkspace(), AdminModulePlaceholder(), MODULE_CONFIGS (+28 more)

### Community 4 - "AdminSessionService"
Cohesion: 0.07
Nodes (8): AdminSessionController, AuthController, LoginRequest, RegisterRequest, UpdateProfileRequest, AuthRepository, AdminSessionService, AuthService

### Community 5 - "App"
Cohesion: 0.07
Nodes (35): AdminLayout(), refresh(), AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer() (+27 more)

### Community 6 - "org.springframework.http.ResponseEntity"
Cohesion: 0.08
Nodes (8): AdminCategoryController, AdminOrderController, AdminProductController, AdminStaffController, AdminUserController, VoucherController, AdminIdentity, ResetPasswordRequest

### Community 7 - "AcceptanceAndCornerCasesTest.java"
Cohesion: 0.16
Nodes (6): InvoiceCalculationDto, AdminCategoryRepository, AdminCategoryService, AcceptanceAndCornerCasesTest, AdminCategoryServiceTest, CustomerOrderServiceTest

### Community 8 - "OrderReviewPage"
Cohesion: 0.09
Nodes (28): updateProfile(), validateVoucherApi(), AccountModal(), handleChange(), handleSave(), startEdit(), formatPrice(), OrderReviewPage() (+20 more)

### Community 9 - "AdminStatisticsServiceTest.java"
Cohesion: 0.11
Nodes (9): CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, AdminStatisticsRepository, AdminStatisticsService (+1 more)

### Community 10 - "org.springframework.jdbc.core.JdbcTemplate"
Cohesion: 0.17
Nodes (3): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto

### Community 11 - "bigdecimal"
Cohesion: 0.09
Nodes (3): CreateVoucherRequest, InvoiceResponse, ValidateVoucherRequest

### Community 12 - "AdminOrderRepository"
Cohesion: 0.12
Nodes (6): CancelOrderRequest, ConfirmOrderRequest, OrderItemDto, AdminOrderRepository, AdminOrderService, AdminOrderServiceTest

### Community 13 - "frontend/package.json"
Cohesion: 0.07
Nodes (34): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies, @capacitor/cli@^8.5.3 (+26 more)

### Community 14 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.09
Nodes (5): AdminCustomerController, AdminInvoiceController, AdminStatisticsController, AdminSupplierController, OrderController

### Community 15 - "AdminStaffRepository"
Cohesion: 0.14
Nodes (6): CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, AdminStaffRepository, AdminStaffService, AdminStaffServiceTest

### Community 16 - "orders.js"
Cohesion: 0.14
Nodes (25): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrderById(), fetchOrders(), getLocalOrders(), getOrderUrl(), HISTORY_KEYS (+17 more)

### Community 17 - "start.mjs"
Cohesion: 0.08
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 18 - "org.springframework.stereotype.Service"
Cohesion: 0.13
Nodes (5): CreateUserRequest, UserSummaryResponse, AdminUserRepository, AdminUserService, AdminUserServiceTest

### Community 21 - "AdminPermissionsTest.java"
Cohesion: 0.12
Nodes (3): AuthResponse, PasswordUtil, GuestCheckoutAccessTest

### Community 22 - "AdminCustomerRepository"
Cohesion: 0.18
Nodes (5): CustomerTableItemDto, UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 25 - "org.junit.jupiter.api.Test"
Cohesion: 0.29
Nodes (4): CreateOrderRequest, OrderItemDto, OrderResponse, OrderStockTest

### Community 26 - "AdminInvoiceService.java"
Cohesion: 0.16
Nodes (3): InvoiceDetailDto, InvoiceItemDto, AdminInvoiceRepository

### Community 27 - "adminApiHeaders"
Cohesion: 0.12
Nodes (13): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+5 more)

### Community 28 - "org.junit.jupiter.api.DisplayName"
Cohesion: 0.34
Nodes (3): PreviewInvoiceRequest, OrderDetailDto, VoucherDto

### Community 30 - "spring"
Cohesion: 0.11
Nodes (18): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+10 more)

### Community 32 - "admin-redesign-check.mjs"
Cohesion: 0.12
Nodes (10): artifacts, discounts, errors, future, orderDiscounts, past, product, programs (+2 more)

### Community 33 - "ref_node_assert"
Cohesion: 0.38
Nodes (3): mockAdminSession(), sessions, pending

### Community 34 - "AdminProductManagement"
Cohesion: 0.21
Nodes (10): AdminProductManagement(), fetchProducts(), handleAddImageUrl(), handleDeleteImage(), handleFileUpload(), handleFilterSubmit(), handleProductSubmit(), handleResetFilters() (+2 more)

### Community 35 - "NotificationsMenu"
Cohesion: 0.23
Nodes (7): getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), load(), markRead()

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.13
Nodes (10): artifacts, categories, dialog, errors, names, results, rows, search (+2 more)

### Community 37 - "serve-apk.js"
Cohesion: 0.13
Nodes (8): APK_PATH, { exec }, fs, http, localIp, os, path, server

### Community 38 - "PageResponse"
Cohesion: 0.29
Nodes (3): InvoiceSummaryDto, OrderSummaryDto, PageResponse

### Community 41 - "extra-api-tests.mjs"
Cohesion: 0.18
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 44 - "api-tests.mjs"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 47 - "ProductRepository"
Cohesion: 0.31
Nodes (3): ProductResponse, ProductRepository, ProductService

### Community 48 - "datasource"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 52 - "VouchersModal.jsx"
Cohesion: 0.53
Nodes (7): approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), rejectVoucherApi(), formatPrice(), VouchersModal()

### Community 53 - "product-audit-check.mjs"
Cohesion: 0.22
Nodes (5): api(), artifacts, errors, results, suffix

### Community 55 - "OrderShippingInfo.jsx"
Cohesion: 0.39
Nodes (5): formatDate(), OrderShippingInfo(), getDeliveryEstimate(), REGIONS, VIETNAM_LOCATIONS

### Community 56 - "guest-checkout-check.mjs"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

### Community 58 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 59 - "browser-tests.mjs"
Cohesion: 0.40
Nodes (5): errors, f, record(), results, scenario()

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 280 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthRepository` connect `AdminSessionService` to `org.springframework.jdbc.core.JdbcTemplate`, `AdminPermissionsTest.java`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.050997425997425995 - nodes in this community are weakly interconnected._
- **Why does `AdminOrderRepository` connect `AdminOrderRepository` to `PageResponse`, `AcceptanceAndCornerCasesTest.java`, `org.springframework.jdbc.core.JdbcTemplate`, `AdminInvoiceServiceTest`, `AdminInvoiceService`, `OrderStockTest.java`, `AdminInvoiceService.java`, `org.junit.jupiter.api.DisplayName`, `OrderStatusCountDto`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `AdminPromotionRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.06978253813696851 - nodes in this community are weakly interconnected._
- **Why does `AdminSessionController` connect `AdminSessionService` to `AdminPermissionsTest.java`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `AdminSupplierRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.06918918918918919 - nodes in this community are weakly interconnected._