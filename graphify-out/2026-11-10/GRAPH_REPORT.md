# Graph Report - furniture  (2026-11-10)

## Corpus Check
- 252 files · ~201,113 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 43 file(s) not represented in the graph (top: .xml 10, .log 9, .css 8)

## Summary
- 1607 nodes · 5402 edges · 76 communities (42 shown, 34 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 689 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b93bed6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AdminInvoiceService
- AdminPromotionRepository
- AdminSupplierRepository
- AdminLayout.jsx
- AuthRepository
- org.springframework.stereotype.Service
- AdminIdentity
- AdminIdentity
- OrderReviewPage
- AdminStatisticsServiceTest.java
- org.springframework.jdbc.core.JdbcTemplate
- bigdecimal
- AdminOrderRepository
- AdminUserRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminStaffRepository
- start.mjs
- org.junit.jupiter.api.Test
- AdminInvoiceController.java
- AdminPermissionsTest.java
- AdminPermissionsTest.java
- AdminCustomerRepository
- OrderStockTest.java
- VoucherRepository
- org.springframework.transaction.annotation.Transactional
- AdminInvoiceService
- adminApiHeaders
- org.junit.jupiter.api.DisplayName
- OrderDetailDto
- SalesDatabaseInitializer.java
- org.springframework.http.ResponseEntity
- admin-redesign-check.mjs
- ref_node_assert
- AdminProductManagement
- .hash
- category-ui-check.mjs
- serve-apk.js
- PageResponse
- jakarta.annotation.PostConstruct
- SalesDatabaseInitializer.java
- extra-api-tests.mjs
- ExampleInstrumentedTest.java
- VoucherDto
- org.springframework.web.bind.annotation.PutMapping
- VoucherDto
- org.springframework.web.bind.annotation.PostMapping
- datasource
- AdminCategoryManagement
- AdminInvoiceService.java
- AdminSessionService
- PageResponse
- AuthController
- CreateReceiptRequest.java
- AdminUserController
- guest-checkout-check.mjs
- OrderService.java
- org.junit.jupiter.api.Test
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- VoucherController
- capacitor.build.gradle
- VouchersModal.jsx
- permissions-api-check.mjs
- AdminUserController
- OrderSummaryDto
- EligibleOrderDto
- main.jsx

## God Nodes (most connected - your core abstractions)
1. `App()` - 52 edges
2. `getApiBaseUrl()` - 51 edges
3. `PageResponse` - 41 edges
4. `AdminPromotionRepository` - 39 edges
5. `OrderReviewPage()` - 38 edges
6. `AdminInvoiceService` - 37 edges
7. `OrderDetailDto` - 34 edges
8. `AdminCategoryRepository` - 34 edges
9. `AdminProductRepository` - 34 edges
10. `lucide-react` - 34 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `fetchOrders()`  [EXTRACTED]
  frontend/src/user/components/NotificationsMenu.jsx → frontend/src/lib/orders.js
- `loadVouchers()` --calls--> `fetchActiveVouchers()`  [EXTRACTED]
  frontend/src/user/components/OrderReviewPage.jsx → frontend/src/lib/vouchers.js
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/permissions-api-check.mjs → qa/harness/admin-auth.mjs
- `AdminAccessInterceptor` --references--> `AdminSessionService`  [EXTRACTED]
  backend/src/main/java/furniture/config/AdminAccessInterceptor.java → backend/src/main/java/furniture/service/AdminSessionService.java
- `WebMvcConfig` --references--> `AdminAccessInterceptor`  [EXTRACTED]
  backend/src/main/java/furniture/config/WebMvcConfig.java → backend/src/main/java/furniture/config/AdminAccessInterceptor.java

## Import Cycles
- None detected.

## Communities (76 total, 34 thin omitted)

### Community 0 - "AdminInvoiceService"
Cohesion: 0.11
Nodes (9): CreateInvoiceRequest, InvoiceDetailDto, InvoiceItemDto, InvoiceStatusCountDto, PreviewInvoiceRequest, AdminInvoiceRepository, AdminInvoiceService, AcceptanceAndCornerCasesTest (+1 more)

### Community 1 - "AdminPromotionRepository"
Cohesion: 0.08
Nodes (7): CreateProductDiscountRequest, CreateProgramRequest, CreateVoucherRequest, ProgramResponse, AdminPromotionRepository, AdminPromotionService, AdminPromotionServiceTest

### Community 2 - "AdminSupplierRepository"
Cohesion: 0.07
Nodes (10): CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository, AdminSupplierService (+2 more)

### Community 3 - "AdminLayout.jsx"
Cohesion: 0.10
Nodes (42): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+34 more)

### Community 4 - "AuthRepository"
Cohesion: 0.07
Nodes (38): AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer(), loginUser, logoutAdminUser() (+30 more)

### Community 5 - "org.springframework.stereotype.Service"
Cohesion: 0.10
Nodes (6): AuthResponse, RegisterRequest, AuthRepository, AdminSessionService, AuthService, PasswordUtil

### Community 6 - "AdminIdentity"
Cohesion: 0.11
Nodes (9): CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, AdminStatisticsRepository, AdminStatisticsService (+1 more)

### Community 7 - "AdminIdentity"
Cohesion: 0.14
Nodes (3): AdminProductController, OrderController, AdminIdentity

### Community 10 - "org.springframework.jdbc.core.JdbcTemplate"
Cohesion: 0.07
Nodes (34): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies, @capacitor/cli@^8.5.3 (+26 more)

### Community 11 - "bigdecimal"
Cohesion: 0.16
Nodes (23): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrderById(), fetchOrders(), getLocalOrders(), getOrderUrl(), HISTORY_KEYS (+15 more)

### Community 12 - "AdminOrderRepository"
Cohesion: 0.07
Nodes (33): updateProfile(), validateVoucherApi(), AccountModal(), handleChange(), handleSave(), startEdit(), formatPrice(), OrderReviewPage() (+25 more)

### Community 13 - "AdminUserRepository"
Cohesion: 0.27
Nodes (4): UserSummaryResponse, AdminUserRepository, AdminUserService, AdminUserServiceTest

### Community 14 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.09
Nodes (7): CreateUserRequest, CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, AdminStaffRepository, AdminStaffService, AdminStaffServiceTest

### Community 15 - "AdminStaffRepository"
Cohesion: 0.12
Nodes (4): CategoryRequest, CategoryResponse, AdminCategoryRepository, AdminCategoryService

### Community 18 - "org.junit.jupiter.api.Test"
Cohesion: 0.18
Nodes (5): CustomerTableItemDto, UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 19 - "AdminInvoiceController.java"
Cohesion: 0.08
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 20 - "AdminPermissionsTest.java"
Cohesion: 0.10
Nodes (3): OrderService, GuestCheckoutAccessTest, ProductStockTest

### Community 22 - "AdminCustomerRepository"
Cohesion: 0.13
Nodes (3): AdminCustomerController, AdminInvoiceController, AdminStatisticsController

### Community 24 - "VoucherRepository"
Cohesion: 0.08
Nodes (5): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto, CreateOrderDiscountRequest, InvoiceResponse

### Community 25 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.08
Nodes (11): ProductAuditDto, ProductDetailDto, ProductImageDto, ProductSummaryDto, SaveProductRequest, AdminProductRepository, ProductAuditRepository, AdminProductService (+3 more)

### Community 27 - "adminApiHeaders"
Cohesion: 0.11
Nodes (13): adminApiHeaders(), api(), artifacts, errors, results, suffix, api(), artifacts (+5 more)

### Community 28 - "org.junit.jupiter.api.DisplayName"
Cohesion: 0.11
Nodes (18): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+10 more)

### Community 29 - "OrderDetailDto"
Cohesion: 0.12
Nodes (8): CancelOrderRequest, ConfirmOrderRequest, OrderDetailDto, OrderItemDto, OrderStatusCountDto, AdminOrderRepository, AdminOrderService, AdminOrderServiceTest

### Community 31 - "org.springframework.http.ResponseEntity"
Cohesion: 0.11
Nodes (3): AdminCategoryController, AdminPromotionController, AdminSupplierController

### Community 32 - "admin-redesign-check.mjs"
Cohesion: 0.37
Nodes (3): mockAdminSession(), sessions, pending

### Community 33 - "ref_node_assert"
Cohesion: 0.23
Nodes (9): AdminNavbar(), adminRoleLabel(), getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), load() (+1 more)

### Community 34 - "AdminProductManagement"
Cohesion: 0.12
Nodes (10): artifacts, discounts, errors, future, orderDiscounts, past, product, programs (+2 more)

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.21
Nodes (10): AdminProductManagement(), fetchProducts(), handleAddImageUrl(), handleDeleteImage(), handleFileUpload(), handleFilterSubmit(), handleProductSubmit(), handleResetFilters() (+2 more)

### Community 37 - "serve-apk.js"
Cohesion: 0.13
Nodes (10): artifacts, categories, dialog, errors, names, results, rows, search (+2 more)

### Community 38 - "PageResponse"
Cohesion: 0.13
Nodes (8): APK_PATH, { exec }, fs, http, localIp, os, path, server

### Community 41 - "extra-api-tests.mjs"
Cohesion: 0.16
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 43 - "VoucherDto"
Cohesion: 0.29
Nodes (3): ProductResponse, ProductRepository, ProductService

### Community 45 - "VoucherDto"
Cohesion: 0.26
Nodes (4): OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, VoucherDto

### Community 46 - "org.springframework.web.bind.annotation.PostMapping"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 48 - "datasource"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 52 - "PageResponse"
Cohesion: 0.21
Nodes (3): InvoiceCalculationDto, InvoiceSummaryDto, PageResponse

### Community 54 - "CreateReceiptRequest.java"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

### Community 55 - "AdminUserController"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 56 - "guest-checkout-check.mjs"
Cohesion: 0.40
Nodes (5): errors, f, record(), results, scenario()

### Community 57 - "OrderService.java"
Cohesion: 0.25
Nodes (4): CreateOrderRequest, OrderItemDto, OrderResponse, ValidateVoucherRequest

### Community 70 - "VouchersModal.jsx"
Cohesion: 0.53
Nodes (7): approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), rejectVoucherApi(), formatPrice(), VouchersModal()

### Community 71 - "permissions-api-check.mjs"
Cohesion: 0.25
Nodes (5): api(), results, staff, suffix, tokens

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 281 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminCategoryRepository` connect `AdminStaffRepository` to `AdminInvoiceService`, `jakarta.annotation.PostConstruct`, `OrderReviewPage`, `orders.js`, `AdminPermissionsTest.java`, `org.springframework.transaction.annotation.Transactional`, `org.junit.jupiter.api.Test`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `AdminInvoiceService` be split into smaller, more focused modules?**
  _Cohesion score 0.10980392156862745 - nodes in this community are weakly interconnected._
- **Why does `AdminInvoiceService` connect `AdminInvoiceService` to `org.springframework.stereotype.Service`, `OrderReviewPage`, `EligibleOrderDto`, `org.springframework.web.bind.annotation.GetMapping`, `PageResponse`, `AdminPermissionsTest.java`, `AdminCustomerRepository`, `AdminPermissionsTest.java`, `OrderDetailDto`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `AdminPromotionRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.08243727598566308 - nodes in this community are weakly interconnected._
- **Why does `VoucherRepository` connect `AdminStatisticsServiceTest.java` to `orders.js`, `AdminPermissionsTest.java`, `jakarta.annotation.PostConstruct`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `AdminSupplierRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.07071455016660497 - nodes in this community are weakly interconnected._