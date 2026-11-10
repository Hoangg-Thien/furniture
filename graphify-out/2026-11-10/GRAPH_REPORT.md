# Graph Report - furniture  (2026-11-10)

## Corpus Check
- 258 files · ~204,165 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 43 file(s) not represented in the graph (top: .xml 10, .log 9, .css 8)

## Summary
- 1627 nodes · 5463 edges · 71 communities (43 shown, 28 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 693 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2388c9ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminStaffRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminSupplierRepository
- AdminSessionService
- org.springframework.stereotype.Service
- AdminIdentity
- AdminIdentity
- OrderReviewPage
- org.springframework.http.ResponseEntity
- AuthRepository
- bigdecimal
- AdminPermissionsTest.java
- AdminUserRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminInvoiceRepository
- AdminInvoiceService.java
- start.mjs
- FileStorageService.java
- AdminProductManagement
- AdminPermissionsTest.java
- AdminPermissionsTest.java
- orders.js
- PageResponse
- org.junit.jupiter.api.Test
- org.springframework.transaction.annotation.Transactional
- AdminPromotionRepository
- AcceptanceAndCornerCasesTest.java
- auth.js
- OrderDetailDto
- adminApiHeaders
- org.springframework.http.ResponseEntity
- admin-redesign-check.mjs
- Application.java
- AdminProductManagement
- .hash
- category-ui-check.mjs
- serve-apk.js
- PageResponse
- jakarta.annotation.PostConstruct
- OrderRepository
- extra-api-tests.mjs
- VoucherDto
- org.springframework.web.bind.annotation.PutMapping
- AdminActivityDto
- org.springframework.web.bind.annotation.PostMapping
- AdminUserRepository
- org.springframework.web.bind.annotation.PutMapping
- AdminIdentity
- AdminInvoiceService.java
- SalesDatabaseInitializer.java
- PageResponse
- AuthController
- CreateReceiptRequest.java
- CreateReceiptRequest.java
- product-audit-check.mjs
- OrderShippingInfo.jsx
- com.getcapacitor.BridgeActivity
- model/ProductImageDto.java
- AdminUserController
- capacitor.build.gradle

## God Nodes (most connected - your core abstractions)
1. `App()` - 53 edges
2. `getApiBaseUrl()` - 50 edges
3. `PageResponse` - 41 edges
4. `AdminPromotionRepository` - 39 edges
5. `OrderReviewPage()` - 38 edges
6. `AdminInvoiceService` - 37 edges
7. `AdminCategoryRepository` - 34 edges
8. `OrderDetailDto` - 34 edges
9. `AdminProductRepository` - 34 edges
10. `lucide-react` - 34 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `fetchOrders()`  [EXTRACTED]
  frontend/src/user/components/NotificationsMenu.jsx → frontend/src/lib/orders.js
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/product-audit-check.mjs → qa/harness/admin-auth.mjs
- `load()` --calls--> `getApiBaseUrl()`  [EXTRACTED]
  frontend/src/admin/ProductAuditDialog.jsx → frontend/src/lib/apiConfig.js
- `App()` --calls--> `AdminLayout()`  [EXTRACTED]
  frontend/src/user/App.jsx → frontend/src/admin/AdminLayout.jsx
- `App()` --calls--> `AdminLoginPage()`  [EXTRACTED]
  frontend/src/user/App.jsx → frontend/src/admin/AdminLoginPage.jsx

## Import Cycles
- None detected.

## Communities (71 total, 28 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.05
Nodes (15): CategoryRequest, CategoryResponse, ProductAuditDto, ProductDetailDto, ProductImageDto, ProductSummaryDto, SaveProductRequest, AdminCategoryRepository (+7 more)

### Community 1 - "AdminStaffRepository"
Cohesion: 0.14
Nodes (6): CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, AdminStaffRepository, AdminStaffService, AdminStaffServiceTest

### Community 2 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.13
Nodes (3): AdminCustomerController, AdminInvoiceController, AdminStatisticsController

### Community 3 - "AdminSupplierRepository"
Cohesion: 0.07
Nodes (10): CreateReceiptRequest, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository, AdminSupplierService (+2 more)

### Community 4 - "AdminSessionService"
Cohesion: 0.14
Nodes (4): AdminSessionController, LoginRequest, AdminSessionService, AuthService

### Community 5 - "org.springframework.stereotype.Service"
Cohesion: 0.08
Nodes (27): getCurrentAdminUser(), logoutAdminUser(), fetchOrderById(), DEFAULT_PRODUCTS, loadProducts(), App(), getCurrentRoute(), handleAddToCart() (+19 more)

### Community 6 - "AdminIdentity"
Cohesion: 0.08
Nodes (35): updateProfile(), approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), rejectVoucherApi(), validateVoucherApi(), AccountModal() (+27 more)

### Community 7 - "AdminIdentity"
Cohesion: 0.11
Nodes (39): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+31 more)

### Community 8 - "OrderReviewPage"
Cohesion: 0.12
Nodes (9): CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, AdminStatisticsRepository, AdminStatisticsService (+1 more)

### Community 9 - "org.springframework.http.ResponseEntity"
Cohesion: 0.09
Nodes (4): AdminCategoryController, AdminPromotionController, AdminSupplierController, VoucherController

### Community 11 - "bigdecimal"
Cohesion: 0.21
Nodes (4): UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 12 - "AdminPermissionsTest.java"
Cohesion: 0.09
Nodes (3): PasswordUtil, GuestCheckoutAccessTest, ProductStockTest

### Community 13 - "AdminUserRepository"
Cohesion: 0.09
Nodes (7): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, InvoiceResponse

### Community 14 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.07
Nodes (36): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, react-dom@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies (+28 more)

### Community 17 - "start.mjs"
Cohesion: 0.08
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 19 - "AdminProductManagement"
Cohesion: 0.14
Nodes (14): AdminProductManagement(), fetchProducts(), handleAddImageUrl(), handleDeleteImage(), handleFileUpload(), handleFilterSubmit(), handleProductSubmit(), handleResetFilters() (+6 more)

### Community 21 - "AdminPermissionsTest.java"
Cohesion: 0.27
Nodes (4): ProductController, ProductResponse, ProductRepository, ProductService

### Community 22 - "orders.js"
Cohesion: 0.16
Nodes (22): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrders(), getLocalOrders(), getOrderUrl(), HISTORY_KEYS, LAST_ORDER_KEYS (+14 more)

### Community 23 - "PageResponse"
Cohesion: 0.18
Nodes (4): CustomerTableItemDto, InvoiceSummaryDto, OrderSummaryDto, PageResponse

### Community 24 - "org.junit.jupiter.api.Test"
Cohesion: 0.05
Nodes (17): CreateInvoiceRequest, EligibleOrderDto, InvoiceDetailDto, InvoiceItemDto, PreviewInvoiceRequest, CancelOrderRequest, ConfirmOrderRequest, OrderDetailDto (+9 more)

### Community 26 - "AdminPromotionRepository"
Cohesion: 0.07
Nodes (8): CreateOrderDiscountRequest, CreateProductDiscountRequest, CreateProgramRequest, CreateVoucherRequest, ProgramResponse, AdminPromotionRepository, AdminPromotionService, AdminPromotionServiceTest

### Community 27 - "AcceptanceAndCornerCasesTest.java"
Cohesion: 0.23
Nodes (3): InvoiceCalculationDto, AcceptanceAndCornerCasesTest, CustomerOrderServiceTest

### Community 28 - "auth.js"
Cohesion: 0.21
Nodes (14): AdminLoginPage(), handleLogin(), getCurrentUser(), loginAdmin(), loginCustomer(), loginUser, logoutUser(), registerUser() (+6 more)

### Community 29 - "OrderDetailDto"
Cohesion: 0.11
Nodes (18): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+10 more)

### Community 30 - "adminApiHeaders"
Cohesion: 0.12
Nodes (13): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+5 more)

### Community 31 - "org.springframework.http.ResponseEntity"
Cohesion: 0.36
Nodes (3): mockAdminSession(), sessions, pending

### Community 32 - "admin-redesign-check.mjs"
Cohesion: 0.12
Nodes (10): artifacts, discounts, errors, future, orderDiscounts, past, product, programs (+2 more)

### Community 34 - "AdminProductManagement"
Cohesion: 0.13
Nodes (10): artifacts, categories, dialog, errors, names, results, rows, search (+2 more)

### Community 35 - ".hash"
Cohesion: 0.13
Nodes (8): APK_PATH, { exec }, fs, http, localIp, os, path, server

### Community 36 - "category-ui-check.mjs"
Cohesion: 0.23
Nodes (7): getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), NotificationsMenu(), load(), markRead()

### Community 37 - "serve-apk.js"
Cohesion: 0.14
Nodes (3): AdminAccessInterceptor, AdminActivityInterceptor, AdminActivityRepository

### Community 38 - "PageResponse"
Cohesion: 0.16
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 40 - "OrderRepository"
Cohesion: 0.05
Nodes (8): CreateOrderRequest, CreateVoucherRequest, OrderItemDto, ValidateVoucherRequest, OrderRepository, VoucherRepository, OrderService, VoucherService

### Community 41 - "extra-api-tests.mjs"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 43 - "VoucherDto"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 47 - "AdminUserRepository"
Cohesion: 0.24
Nodes (5): CreateUserRequest, UserSummaryResponse, AdminUserRepository, AdminUserService, AdminUserServiceTest

### Community 49 - "AdminIdentity"
Cohesion: 0.16
Nodes (3): AdminProductController, OrderController, AdminIdentity

### Community 50 - "AdminInvoiceService.java"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

### Community 52 - "PageResponse"
Cohesion: 0.40
Nodes (5): errors, f, record(), results, scenario()

### Community 53 - "AuthController"
Cohesion: 0.18
Nodes (3): AuthController, RegisterRequest, UpdateProfileRequest

### Community 54 - "CreateReceiptRequest.java"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 57 - "product-audit-check.mjs"
Cohesion: 0.22
Nodes (5): api(), artifacts, errors, results, suffix

### Community 59 - "OrderShippingInfo.jsx"
Cohesion: 0.39
Nodes (5): formatDate(), OrderShippingInfo(), getDeliveryEstimate(), REGIONS, VIETNAM_LOCATIONS

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminInvoiceService` connect `org.junit.jupiter.api.Test` to `AdminStaffRepository`, `org.springframework.web.bind.annotation.GetMapping`, `AdminPermissionsTest.java`, `AdminInvoiceRepository`, `AdminInvoiceService.java`, `AdminPermissionsTest.java`, `PageResponse`, `AcceptanceAndCornerCasesTest.java`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.05244096769520498 - nodes in this community are weakly interconnected._
- **Why does `OrderRepository` connect `OrderRepository` to `org.springframework.transaction.annotation.Transactional`, `AcceptanceAndCornerCasesTest.java`, `AdminPermissionsTest.java`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `AdminStaffRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.1431451612903226 - nodes in this community are weakly interconnected._
- **Why does `AdminPromotionRepository` connect `AdminPromotionRepository` to `org.springframework.transaction.annotation.Transactional`, `AdminUserRepository`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `org.springframework.web.bind.annotation.GetMapping` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._