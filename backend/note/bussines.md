# POS Bengkel — Business Logic Service Layer (Domain Architecture Spec)

Dokumen ini mendefinisikan business logic layer yang diturunkan langsung dari schema Prisma dengan pendekatan domain-driven design, event-ledger integrity, dan strict transactional boundaries.

---

## 1. Identity & Workforce Domain (User Aggregate)

Domain ini mengelola seluruh aktor sistem: ADMIN, CASHIER, MECHANIC. Fokus utama adalah RBAC, assignment tracking, dan operational state derivation.

### createUser(payload)

- Validasi unik `phone` (jika ada)
- Default role: CASHIER
- Inisialisasi relasi kosong:

  - orders
  - shifts
  - assignedTasks

---

### getUserById(userId)

Mengembalikan aggregate user lengkap:

- Profile user
- Shift history (OPEN/CLOSED)
- Orders (cashier scope)
- Mechanic assignments (OrderItem-level task mapping)

---

### updateUserRole(userId, role)

- Guard rule:

  - MECHANIC → CASHIER hanya jika tidak ada task aktif

- ADMIN downgrade dibatasi policy
- Side effect:

  - invalidasi cache authorization/session

---

### getActiveCashiers()

- Query: Shift.status = OPEN
- Join User → Shift
- Output: cashier + active shift context

---

### getMechanics()

- Filter: role = MECHANIC
- Include:

  - active OrderItem assignments
  - workload context

---

## 2. Product Catalog & Pricing Domain

Domain ini memisahkan identity produk, pricing lifecycle, dan stock behavior (delegated ke Inventory domain).

### createProduct(payload, thumbnail)

- SKU wajib unik
- Default:

  - stock = 0
  - isActive = true

- Price history seed record dibuat otomatis
- Rule:

  - SERVICE type tidak mengonsumsi inventory secara fisik

---

### updateProduct(productId, patch)

- Hanya metadata update:

  - name, description, imageUrl, isActive

- Stock mutation dilarang (delegated ke Inventory Service)
- Optimistic concurrency via `updatedAt`

---

### getProductBySku(sku)

- Index-based lookup (critical POS path)
- Target: O(1)-style retrieval untuk barcode scan flow

---

### updateProductPrice(productId, newPrice, effectiveFrom)

- Append-only `ProductPriceHistory`
- Tidak ada overwrite data historis
- Active price = latest where effectiveFrom ≤ now()

---

### getProducts(query)

- Filter:

  - type (SPAREPART / SERVICE)
  - isActive
  - name search

- Pagination/cursor support

---

## 3. Customer & Vehicle Domain

Domain ini membentuk relationship graph: Customer → Vehicle → Order.

### upsertCustomer(payload)

- Identity key: phone
- Behavior:

  - insert jika belum ada
  - update partial jika sudah ada

- Vehicle relation tidak boleh hilang (preserved merge)

---

### registerVehicle(payload)

- plateNumber unik
- Relasi:

  - Customer (1) → Vehicle (N)

---

### searchVehicleByPlate(plateNumber)

- Indexed lookup
- Output enrichment:

  - vehicle data
  - customer data
  - optional last order snapshot

---

### getVehicleHistory(vehicleId)

- Join chain:
  Order → OrderItem → Payment
- Sort: descending createdAt
- Use case:

  - service history
  - diagnostic context
  - upsell insight

---

## 4. Shift Domain (Cash Session Ledger)

Shift adalah bounded financial context untuk rekonsiliasi kas.

### openShift(cashierId, startingCash)

- Constraint: hanya 1 shift OPEN per cashier
- Initialize:

  - cashSales = 0
  - cashIn = 0
  - cashOut = 0

---

### closeShift(shiftId, actualEndingCash)

Expected cash formula:

startingCash + cashSales + cashIn - cashOut - expenses

```id="shift_formula"

- discrepancy = actual - expected
- State transition: OPEN → CLOSED

---

### getShiftSummary(shiftId)
- Aggregasi:
  - cash sales (order-based)
  - cash movements
  - expenses linked shift
- Output: real-time reconciliation snapshot

---

### recordCashIn / recordCashOut
- Immutable financial event
- Audit-first design (append-only)

---

### getShifts(query)
- Filter:
  - cashierId
  - status
  - date range

---

## 5. Order Domain (Core Transaction Aggregate)

Order adalah central system of record untuk seluruh transaksi POS.

### createOrder(payload)
Atomic transaction:
- Create Order
- Create OrderItem(s)
- Create StockMovement OUT (SPAREPART only)

Rule branching:
- vehicleId exists → SERVICE mode
- mechanic assignment per item

---

### getOrderById(orderId)
Full aggregate:
- cashier
- customer
- vehicle
- items + mechanic mapping
- payments

---

### updateOrderStatus(orderId, status)
State machine:
- PENDING → COMPLETED
- PENDING → CANCELLED

Rule:
- COMPLETED hanya bisa via PaymentService flow

---

### cancelOrder(orderId, reason)
Compensation logic:
- StockMovement reversal (IN)
- Payment invalidation
- Status → CANCELLED

---

### getOrders(query)
Filters:
- status
- cashier
- mechanic (via OrderItem)
- date range

---

## 6. Payment Domain (Financial Ledger Layer)

Payment adalah sub-ledger dari Order.

### processPayment(orderId, payload)
Side effects:
- Payment.status → PAID
- Order.paidTotal increment
- Jika paidTotal ≥ total:
  - Order.status → COMPLETED
  - Order.isClosed → true
- CASH payment:
  - Shift.cashSales increment

---

### refundPayment(orderId, reason)
Guard:
- no double refund

Effects:
- Payment → REFUNDED
- Order → REFUNDED
- Stock rollback (conditional)

---

### getPayments(query)
Aggregation dimension:
- method
- status
- cashier
- time range

---

## 7. Inventory Domain (Event Ledger System)

Inventory adalah event-sourced system, bukan mutable state.

### recordStockAdjustment(productId, payload)
- Type: ADJUSTMENT
- Required: recordedById
- Audit-compliant event

---

### checkStockAvailability(productId, requestedQuantity)
Invariant:
```

stock >= requestedQuantity

```id="stock_check"

---

### getStockMovementsByProduct(productId)
Event stream:
- IN
- OUT
- ADJUSTMENT

---

### getStockMovements(query)
Global warehouse audit stream

---

## 8. Expense Domain (Operational Cost Layer)

Expense adalah bagian dari financial reconciliation system.

### recordExpense(payload, receipt)
Category:
- SUPPLIES
- MAINTENANCE
- UTILITIES
- SALARY
- RENT
- OTHER

Optional:
- shiftId linkage → affects cash reconciliation

---

### updateExpense(expenseId, patch)
- Partial update only
- Preserve accounting integrity

---

### getExpensesByDateRange(range)
- Input untuk P&L report engine

---

### getExpensesByShift(shiftId)
- Shift-level cost breakdown

---

## CROSS-DOMAIN INVARIANTS (SYSTEM GUARANTEES)

### Inventory Integrity
- Stock ONLY changes via StockMovement
- No direct Product.stock mutation in business flow

---

### Order Integrity
- Every SPAREPART order item generates OUT movement
- SERVICE items do not affect inventory

---

### Payment Integrity
- Payment updates propagate:
  - Order status
  - Shift.cashSales (if CASH)

---

### Shift Integrity
- Expected cash always derived, never stored manually
- Discrepancy is computed field

---

### Pricing Integrity
- Price history immutable
- Order stores snapshot unitPrice

---
```
