# Graph Report - furniture  (2026-11-10)

## Corpus Check
- 250 files · ~199,781 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 43 file(s) not represented in the graph (top: .xml 10, .log 9, .css 8)

## Summary
- 1598 nodes · 5364 edges · 70 communities (45 shown, 25 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 689 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5a819b7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminPromotionRepository
- AdminSupplierRepository
- AdminLayout.jsx
- AuthRepository
- App
- AdminIdentity
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
- org.junit.jupiter.api.Test
- OrderRepository
- AdminPermissionsTest.java
- AdminCustomerRepository
- VoucherRepository
- AdminCategoryRepository
- AdminInvoiceService
- adminApiHeaders
- org.junit.jupiter.api.DisplayName
- FileStorageService.java
- spring
- org.springframework.http.ResponseEntity
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
- VoucherDto
- api-tests.mjs
- org.springframework.web.bind.annotation.PostMapping
- ProductRepository
- datasource
- AdminCategoryManagement
- AdminInvoiceService.java
- AdminSessionService
- VouchersModal.jsx
- product-audit-check.mjs
- CreateReceiptRequest.java
- AdminUserController
- guest-checkout-check.mjs
- Application.java
- .oxlintrc.json
- browser-tests.mjs
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- mrp:demo

## God Nodes (most connected - your core abstractions)
1. `getApiBaseUrl()` - 51 edges
2. `App()` - 49 edges
3. `PageResponse` - 41 edges
4. `AdminPromotionRepository` - 39 edges
5. `OrderReviewPage()` - 38 edges
6. `AdminInvoiceService` - 37 edges
7. `OrderDetailDto` - 34 edges
8. `AdminCategoryRepository` - 34 edges
9. `AdminProductRepository` - 34 edges
10. `lucide-react` - 34 edges

## Surprising Connections (you probably didn't know these)
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/product-audit-check.mjs → qa/harness/admin-auth.mjs
- `AdminAccessInterceptor` --references--> `AdminSessionService`  [EXTRACTED]
  backend/src/main/java/furniture/config/AdminAccessInterceptor.java → backend/src/main/java/furniture/service/AdminSessionService.java
- `WebMvcConfig` --references--> `AdminAccessInterceptor`  [EXTRACTED]
  backend/src/main/java/furniture/config/WebMvcConfig.java → backend/src/main/java/furniture/config/AdminAccessInterceptor.java
- `AdminCategoryController` --references--> `AdminCategoryService`  [EXTRACTED]
  backend/src/main/java/furniture/controller/AdminCategoryController.java → backend/src/main/java/furniture/service/AdminCategoryService.java
- `AdminCustomerController` --references--> `AdminCustomerService`  [EXTRACTED]
  backend/src/main/java/furniture/controller/AdminCustomerController.java → backend/src/main/java/furniture/service/AdminCustomerService.java

## Import Cycles
- None detected.

## Communities (70 total, 25 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.11
Nodes (8): ProductAuditDto, ProductDetailDto, ProductImageDto, SaveProductRequest, AdminProductRepository, ProductAuditRepository, AdminProductService, ProductAuditTest

### Community 1 - "AdminPromotionRepository"
Cohesion: 0.10
Nodes (6): CreateProgramRequest, CreateVoucherRequest, ProgramResponse, AdminPromotionRepository, AdminPromotionService, AdminPromotionServiceTest

### Community 2 - "AdminSupplierRepository"
Cohesion: 0.07
Nodes (9): CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository, AdminSupplierService (+1 more)

### Community 3 - "AdminLayout.jsx"
Cohesion: 0.10
Nodes (39): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+31 more)

### Community 4 - "AuthRepository"
Cohesion: 0.12
Nodes (4): AuthResponse, RegisterRequest, AuthRepository, AuthService

### Community 5 - "App"
Cohesion: 0.06
Nodes (38): AdminLayout(), refresh(), AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer() (+30 more)

### Community 6 - "AdminIdentity"
Cohesion: 0.11
Nodes (4): AdminOrderController, AdminProductController, AdminStaffController, AdminIdentity

### Community 8 - "OrderReviewPage"
Cohesion: 0.07
Nodes (37): updateProfile(), createOrder(), fetchOrderById(), getOrderUrl(), saveOrderToLocalHistory(), validateVoucherApi(), AccountModal(), handleChange() (+29 more)

### Community 9 - "AdminStatisticsServiceTest.java"
Cohesion: 0.09
Nodes (9): CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, AdminStatisticsRepository, AdminStatisticsService (+1 more)

### Community 11 - "bigdecimal"
Cohesion: 0.11
Nodes (4): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto, InvoiceResponse

### Community 12 - "AdminOrderRepository"
Cohesion: 0.10
Nodes (8): CancelOrderRequest, ConfirmOrderRequest, OrderItemDto, OrderStatusCountDto, OrderSummaryDto, AdminOrderRepository, AdminOrderService, AdminOrderServiceTest

### Community 13 - "frontend/package.json"
Cohesion: 0.07
Nodes (35): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, react-dom@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies (+27 more)

### Community 14 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.14
Nodes (3): AdminCustomerController, AdminInvoiceController, AdminStatisticsController

### Community 15 - "AdminStaffRepository"
Cohesion: 0.08
Nodes (8): CreateUserRequest, CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, AdminStaffRepository, AdminUserRepository, AdminStaffService, AdminStaffServiceTest

### Community 16 - "orders.js"
Cohesion: 0.17
Nodes (19): cacheCancelledOrder(), cancelOrderApi(), fetchOrders(), getLocalOrders(), HISTORY_KEYS, LAST_ORDER_KEYS, orderKey(), readStoredOrders() (+11 more)

### Community 17 - "start.mjs"
Cohesion: 0.08
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 18 - "org.junit.jupiter.api.Test"
Cohesion: 0.11
Nodes (5): AdminUserService, AdminProductServiceTest, AdminSupplierServiceTest, AdminUserServiceTest, ApplicationTests

### Community 20 - "OrderRepository"
Cohesion: 0.08
Nodes (6): CreateOrderRequest, OrderItemDto, OrderResponse, ValidateVoucherRequest, OrderRepository, OrderStockTest

### Community 21 - "AdminPermissionsTest.java"
Cohesion: 0.12
Nodes (5): LoginRequest, FileStorageService, OrderService, PasswordUtil, GuestCheckoutAccessTest

### Community 22 - "AdminCustomerRepository"
Cohesion: 0.18
Nodes (5): CustomerTableItemDto, UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 25 - "AdminCategoryRepository"
Cohesion: 0.12
Nodes (5): CategoryRequest, CategoryResponse, AdminCategoryRepository, AdminCategoryService, AdminCategoryServiceTest

### Community 26 - "AdminInvoiceService"
Cohesion: 0.12
Nodes (6): EligibleOrderDto, InvoiceDetailDto, InvoiceItemDto, InvoiceStatusCountDto, AdminInvoiceRepository, AdminInvoiceService

### Community 27 - "adminApiHeaders"
Cohesion: 0.12
Nodes (13): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+5 more)

### Community 28 - "org.junit.jupiter.api.DisplayName"
Cohesion: 0.26
Nodes (5): CreateInvoiceRequest, PreviewInvoiceRequest, OrderDetailDto, AcceptanceAndCornerCasesTest, AdminInvoiceServiceTest

### Community 30 - "spring"
Cohesion: 0.11
Nodes (18): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+10 more)

### Community 31 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (4): AdminCategoryController, AdminPromotionController, AdminSupplierController, VoucherController

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
Cohesion: 0.25
Nodes (8): AdminNavbar(), adminRoleLabel(), getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), markRead()

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.13
Nodes (10): artifacts, categories, dialog, errors, names, results, rows, search (+2 more)

### Community 37 - "serve-apk.js"
Cohesion: 0.13
Nodes (8): APK_PATH, { exec }, fs, http, localIp, os, path, server

### Community 38 - "PageResponse"
Cohesion: 0.20
Nodes (4): InvoiceSummaryDto, PageResponse, ProductSummaryDto, UserSummaryResponse

### Community 41 - "extra-api-tests.mjs"
Cohesion: 0.16
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 43 - "VoucherDto"
Cohesion: 0.19
Nodes (6): CreateOrderDiscountRequest, CreateProductDiscountRequest, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, VoucherDto

### Community 44 - "api-tests.mjs"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 46 - "org.springframework.web.bind.annotation.PostMapping"
Cohesion: 0.15
Nodes (3): AuthController, OrderController, UpdateProfileRequest

### Community 47 - "ProductRepository"
Cohesion: 0.33
Nodes (3): ProductController, ProductResponse, ProductService

### Community 48 - "datasource"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 51 - "AdminSessionService"
Cohesion: 0.13
Nodes (4): AdminSessionController, AdminSessionService, AdminPermissionsTest, Probe

### Community 52 - "VouchersModal.jsx"
Cohesion: 0.44
Nodes (8): approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), rejectVoucherApi(), loadVouchers(), formatPrice(), VouchersModal()

### Community 53 - "product-audit-check.mjs"
Cohesion: 0.22
Nodes (5): api(), artifacts, errors, results, suffix

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
  These have ≤1 connection - possible missing edges. (Counts symbols only; 281 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminCategoryRepository` connect `AdminCategoryRepository` to `.verify`, `AcceptanceAndCornerCasesTest.java`, `org.springframework.jdbc.core.JdbcTemplate`, `org.junit.jupiter.api.Test`, `AdminPermissionsTest.java`, `OrderStockTest.java`, `org.junit.jupiter.api.DisplayName`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.10753945061367622 - nodes in this community are weakly interconnected._
- **Why does `AdminInvoiceService` connect `AdminInvoiceService` to `PageResponse`, `AcceptanceAndCornerCasesTest.java`, `AdminOrderRepository`, `org.springframework.web.bind.annotation.GetMapping`, `AdminStaffRepository`, `AdminInvoiceService.java`, `AdminInvoiceController.java`, `AdminPermissionsTest.java`, `OrderStockTest.java`, `org.junit.jupiter.api.DisplayName`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `AdminPromotionRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.09863945578231292 - nodes in this community are weakly interconnected._
- **Why does `VoucherRepository` connect `VoucherRepository` to `org.springframework.jdbc.core.JdbcTemplate`, `AdminInvoiceService.java`, `AdminOrderRepository`, `OrderStockTest.java`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `AdminSupplierRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.0711849957374254 - nodes in this community are weakly interconnected._