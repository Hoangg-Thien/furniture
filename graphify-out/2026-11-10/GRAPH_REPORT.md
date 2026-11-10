# Graph Report - furniture  (2026-11-10)

## Corpus Check
- 258 files · ~204,553 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 43 file(s) not represented in the graph (top: .xml 10, .log 9, .css 8)

## Summary
- 1629 nodes · 5504 edges · 60 communities (38 shown, 22 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 693 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec6faac9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .verify
- AdminStaffRepository
- org.springframework.web.bind.annotation.GetMapping
- AdminSupplierRepository
- OrderRepository
- org.springframework.stereotype.Service
- AdminIdentity
- AdminIdentity
- OrderReviewPage
- org.springframework.http.ResponseEntity
- AccountModal
- bigdecimal
- AdminPermissionsTest.java
- AdminUserRepository
- product-audit-check.mjs
- AdminInvoiceRepository
- AdminInvoiceService.java
- VoucherController
- FileStorageService.java
- AdminProductManagement
- AdminPermissionsTest.java
- AdminPermissionsTest.java
- PageResponse
- AdminNotificationController.java
- org.springframework.transaction.annotation.Transactional
- AdminPromotionRepository
- AcceptanceAndCornerCasesTest.java
- org.springframework.web.bind.annotation.PutMapping
- OrderDetailDto
- adminApiHeaders
- admin-redesign-check.mjs
- org.springframework.http.ResponseEntity
- AdminProductManagement
- .hash
- category-ui-check.mjs
- serve-apk.js
- PageResponse
- OrderRepository
- extra-api-tests.mjs
- ExampleInstrumentedTest.java
- AdminActivityDto
- org.springframework.web.bind.annotation.PostMapping
- AdminUserRepository
- org.springframework.web.bind.annotation.PutMapping
- AdminInvoiceService.java
- AuthController
- CreateReceiptRequest.java
- CreateReceiptRequest.java
- product-audit-check.mjs
- capacitor.settings.gradle

## God Nodes (most connected - your core abstractions)
1. `App()` - 53 edges
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
- `api()` --calls--> `adminApiHeaders()`  [EXTRACTED]
  qa/harness/product-audit-check.mjs → qa/harness/admin-auth.mjs
- `WebMvcConfig` --references--> `AdminAccessInterceptor`  [EXTRACTED]
  backend/src/main/java/furniture/config/WebMvcConfig.java → backend/src/main/java/furniture/config/AdminAccessInterceptor.java
- `WebMvcConfig` --references--> `AdminActivityInterceptor`  [EXTRACTED]
  backend/src/main/java/furniture/config/WebMvcConfig.java → backend/src/main/java/furniture/config/AdminActivityInterceptor.java
- `AdminCategoryController` --references--> `AdminCategoryService`  [EXTRACTED]
  backend/src/main/java/furniture/controller/AdminCategoryController.java → backend/src/main/java/furniture/service/AdminCategoryService.java
- `AdminCustomerController` --references--> `AdminCustomerService`  [EXTRACTED]
  backend/src/main/java/furniture/controller/AdminCustomerController.java → backend/src/main/java/furniture/service/AdminCustomerService.java

## Import Cycles
- None detected.

## Communities (60 total, 22 thin omitted)

### Community 0 - ".verify"
Cohesion: 0.05
Nodes (23): CreateInvoiceRequest, EligibleOrderDto, InvoiceDetailDto, InvoiceItemDto, InvoiceStatusCountDto, InvoiceSummaryDto, PreviewInvoiceRequest, CancelOrderRequest (+15 more)

### Community 1 - "AdminStaffRepository"
Cohesion: 0.05
Nodes (11): InvoiceCalculationDto, CategoryRevenueDto, DailyRevenuePointDto, DashboardOverviewDto, DeadStockProductDto, TopProductDto, VoucherReportDto, InvoiceResponse (+3 more)

### Community 2 - "org.springframework.web.bind.annotation.GetMapping"
Cohesion: 0.06
Nodes (11): CreateReceiptRequest, IntegerQuantityDeserializer, ReceiptItemRequest, PurchaseReceiptItemDto, PurchaseReceiptSummaryDto, SupplierRequest, SupplierResponse, AdminSupplierRepository (+3 more)

### Community 3 - "AdminSupplierRepository"
Cohesion: 0.07
Nodes (11): CreateOrderDiscountRequest, CreateProductDiscountRequest, CreateProgramRequest, CreateVoucherRequest, OrderDiscountDto, ProductDiscountDto, ProgramDetailResponse, ProgramResponse (+3 more)

### Community 4 - "OrderRepository"
Cohesion: 0.05
Nodes (9): CreateOrderRequest, CreateVoucherRequest, OrderItemDto, OrderResponse, ValidateVoucherRequest, OrderRepository, VoucherRepository, OrderService (+1 more)

### Community 5 - "org.springframework.stereotype.Service"
Cohesion: 0.05
Nodes (15): CategoryRequest, CategoryResponse, ProductAuditDto, ProductDetailDto, ProductImageDto, ProductSummaryDto, SaveProductRequest, AdminCategoryRepository (+7 more)

### Community 6 - "AdminIdentity"
Cohesion: 0.08
Nodes (11): CreateUserRequest, CreateStaffRequest, StaffSummaryDto, UpdateStaffRequest, UserSummaryResponse, AdminStaffRepository, AdminUserRepository, AdminStaffService (+3 more)

### Community 7 - "AdminIdentity"
Cohesion: 0.10
Nodes (41): AdminCustomerManagement(), AdminDashboard(), load(), money(), statuses, AdminDataTable(), AdminGlobalSearchModal(), AdminInvoiceManagement() (+33 more)

### Community 8 - "OrderReviewPage"
Cohesion: 0.09
Nodes (30): cacheCancelledOrder(), cancelOrderApi(), createOrder(), fetchOrderById(), getOrderUrl(), HISTORY_KEYS, LAST_ORDER_KEYS, orderKey() (+22 more)

### Community 9 - "org.springframework.http.ResponseEntity"
Cohesion: 0.07
Nodes (44): AdminLayout(), refresh(), AdminLoginPage(), handleLogin(), getCurrentAdminUser(), getCurrentUser(), loginAdmin(), loginCustomer() (+36 more)

### Community 10 - "AccountModal"
Cohesion: 0.23
Nodes (10): updateProfile(), AccountModal(), handleChange(), handleSave(), startEdit(), handleToggleDefaultInfo(), getAllProvinces(), getDistricts() (+2 more)

### Community 11 - "bigdecimal"
Cohesion: 0.13
Nodes (3): AdminCustomerController, AdminInvoiceController, AdminStatisticsController

### Community 12 - "AdminPermissionsTest.java"
Cohesion: 0.08
Nodes (6): AdminAccessInterceptor, AdminActivityInterceptor, AdminSessionController, AdminActivityRepository, AdminSessionService, AdminPermissionsTest

### Community 13 - "AdminUserRepository"
Cohesion: 0.06
Nodes (36): dependencies, @capacitor/android@^8.5.3, @capacitor/core@^8.5.3, lucide-react@^1.52.0, react@^19.2.8, react-dom@^19.2.8, @supabase/supabase-js@^2.117.2, devDependencies (+28 more)

### Community 14 - "product-audit-check.mjs"
Cohesion: 0.22
Nodes (5): api(), artifacts, errors, results, suffix

### Community 16 - "AdminInvoiceService.java"
Cohesion: 0.15
Nodes (8): CustomerCartItemDto, CustomerDetailResponse, CustomerOrderDto, CustomerTableItemDto, UpdateCustomerRequest, AdminCustomerRepository, AdminCustomerService, AdminCustomerServiceTest

### Community 18 - "FileStorageService.java"
Cohesion: 0.11
Nodes (22): getOrderNotifications(), loadReadNotificationIds(), ORDER_MESSAGES, saveReadNotificationIds(), fetchOrders(), getLocalOrders(), EMPTY_PRODUCTS, formatPrice() (+14 more)

### Community 19 - "AdminProductManagement"
Cohesion: 0.08
Nodes (24): cp, fd, java, result, root, runtime, socket, dependencies (+16 more)

### Community 25 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.13
Nodes (3): AdminProductController, OrderController, AdminIdentity

### Community 26 - "AdminPromotionRepository"
Cohesion: 0.12
Nodes (13): adminApiHeaders(), api(), results, staff, suffix, tokens, api(), artifacts (+5 more)

### Community 27 - "AcceptanceAndCornerCasesTest.java"
Cohesion: 0.13
Nodes (4): AuthResponse, LoginRequest, AuthRepository, AuthService

### Community 28 - "org.springframework.web.bind.annotation.PutMapping"
Cohesion: 0.13
Nodes (4): AdminOrderController, AdminStaffController, AdminUserController, ResetPasswordRequest

### Community 29 - "OrderDetailDto"
Cohesion: 0.11
Nodes (18): name, driver-class-name, password, url, username, ddl-auto, dialect, date-format (+10 more)

### Community 30 - "adminApiHeaders"
Cohesion: 0.36
Nodes (3): mockAdminSession(), sessions, pending

### Community 32 - "admin-redesign-check.mjs"
Cohesion: 0.16
Nodes (5): ProductResponse, ProductRepository, FileStorageService, ProductService, ProductStockTest

### Community 33 - "org.springframework.http.ResponseEntity"
Cohesion: 0.11
Nodes (3): AdminCategoryController, AdminPromotionController, AdminSupplierController

### Community 34 - "AdminProductManagement"
Cohesion: 0.19
Nodes (3): AuthController, RegisterRequest, UpdateProfileRequest

### Community 35 - ".hash"
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

### Community 40 - "OrderRepository"
Cohesion: 0.16
Nodes (11): after, before, check(), f, form, html, orderBody, record() (+3 more)

### Community 42 - "ExampleInstrumentedTest.java"
Cohesion: 0.25
Nodes (10): check(), orderBody, out, request(), results, sql(), stock(), suffix (+2 more)

### Community 45 - "AdminActivityDto"
Cohesion: 0.20
Nodes (9): driver-class-name, password, url, username, ddl-auto, hibernate, spring, datasource (+1 more)

### Community 47 - "AdminUserRepository"
Cohesion: 0.44
Nodes (8): approveVoucherApi(), createVoucherApi(), fetchActiveVouchers(), fetchAllVouchersForAdmin(), rejectVoucherApi(), loadVouchers(), formatPrice(), VouchersModal()

### Community 48 - "org.springframework.web.bind.annotation.PutMapping"
Cohesion: 0.29
Nodes (5): accountHeaders, api(), body, create(), price

### Community 53 - "AuthController"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 54 - "CreateReceiptRequest.java"
Cohesion: 0.40
Nodes (5): errors, f, record(), results, scenario()

## Knowledge Gaps
- **1 isolated node(s):** `mrp:demo`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminPromotionRepository` connect `AdminSupplierRepository` to `AdminStaffRepository`, `PageResponse`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `mrp:demo` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `.verify` be split into smaller, more focused modules?**
  _Cohesion score 0.05046017137416693 - nodes in this community are weakly interconnected._
- **Why does `AdminCategoryRepository` connect `org.springframework.stereotype.Service` to `.verify`, `AdminStaffRepository`, `AdminInvoiceRepository`, `PageResponse`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `AdminStaffRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.05202547080341417 - nodes in this community are weakly interconnected._
- **Why does `AdminStaffRepository` connect `AdminIdentity` to `.verify`, `AdminStaffRepository`, `AdminInvoiceRepository`, `AdminInvoiceService.java`, `PageResponse`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `org.springframework.web.bind.annotation.GetMapping` be split into smaller, more focused modules?**
  _Cohesion score 0.05965324713488099 - nodes in this community are weakly interconnected._