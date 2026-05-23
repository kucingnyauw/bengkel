import express from "express";

import CustomerController from "#controller/customerController.js";
import ExpenseController from "#controller/expenseController.js";
import NotificationController from "#controller/notificationController.js";
import OrderController from "#controller/orderController.js";
import PaymentController from "#controller/paymentController.js";
import ProductController from "#controller/productController.js";
import ReportController from "#controller/reportController.js";
import SettingController from "#controller/settingController.js";
import ShiftController from "#controller/shiftController.js";
import StockController from "#controller/stockController.js";
import TaskController from "#controller/taskController.js";
import UserController from "#controller/userController.js";
import VehicleController from "#controller/vehicleController.js";

import authMiddleware from "#middleware/authMiddleware.js";
import roleMiddleware from "#middleware/roleMiddleware.js";
import timeoutMiddleware from "#middleware/timeoutMiddleware.js";
import rateLimiterMiddleware from "#middleware/rateLimiterMiddleware.js";

import {
  fileUploadSingle,
  fileUploadOptional,
} from "#middleware/fileMiddleware.js";

const privateRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;

privateRouter.use(authMiddleware);

const adminOnly = roleMiddleware({ allowedRoles: ["ADMIN"] });
const cashierOnly = roleMiddleware({ allowedRoles: ["CASHIER"] });
const mechanicOnly = roleMiddleware({ allowedRoles: ["MECHANIC"] });
const adminAndCashier = roleMiddleware({ allowedRoles: ["ADMIN", "CASHIER"] });
const adminAndMechanic = roleMiddleware({ allowedRoles: ["ADMIN", "MECHANIC"] });
const allRoles = roleMiddleware({ allowedRoles: ["ADMIN", "CASHIER", "MECHANIC"] });

const shortTimeout = timeoutMiddleware({ timeoutMs: 10000 });
const mediumTimeout = timeoutMiddleware({ timeoutMs: 20000 });
const longTimeout = timeoutMiddleware({ timeoutMs: 45000 });
const reportTimeout = timeoutMiddleware({ timeoutMs: 60000 });

const generalLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 100 });
const createLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 30 });
const reportLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 20 });
const authLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 10 });

/**
 * ============================================================================
 * 1. CUSTOMERS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/customers
 * @description Membuat pelanggan baru
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/customers`,
  adminAndCashier,
  createLimiter,
  CustomerController.createCustomer
);

/**
 * @route PUT /api/{version}/customers/upsert
 * @description Membuat atau memperbarui data pelanggan
 * @access Admin, Kasir
 */
privateRouter.put(
  `${prefix}/customers/upsert`,
  adminAndCashier,
  createLimiter,
  CustomerController.upsertCustomer
);

/**
 * @route GET /api/{version}/customers
 * @description Mendapatkan semua pelanggan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/customers`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  CustomerController.getCustomers
);

/**
 * @route GET /api/{version}/customers/phone/check
 * @description Memeriksa ketersediaan nomor telepon pelanggan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/customers/phone/check`,
  adminAndCashier,
  generalLimiter,
  CustomerController.checkPhoneAvailability
);

/**
 * @route GET /api/{version}/customers/phone/:phone
 * @description Mendapatkan pelanggan berdasarkan nomor telepon
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/customers/phone/:phone`,
  adminAndCashier,
  generalLimiter,
  CustomerController.getCustomerByPhone
);

/**
 * @route GET /api/{version}/customers/:id
 * @description Mendapatkan pelanggan berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/customers/:id`,
  adminAndCashier,
  generalLimiter,
  CustomerController.getCustomerById
);

/**
 * @route PUT /api/{version}/customers/:id
 * @description Memperbarui data pelanggan
 * @access Admin, Kasir
 */
privateRouter.put(
  `${prefix}/customers/:id`,
  adminAndCashier,
  createLimiter,
  CustomerController.updateCustomer
);

/**
 * @route DELETE /api/{version}/customers/:id
 * @description Menghapus pelanggan
 * @access Admin, Kasir
 */
privateRouter.delete(
  `${prefix}/customers/:id`,
  adminAndCashier,
  createLimiter,
  CustomerController.deleteCustomer
);

/**
 * ============================================================================
 * 2. EXPENSES ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/expenses
 * @description Membuat pengeluaran baru
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/expenses`,
  cashierOnly,
  createLimiter,
  fileUploadOptional("receipt"),
  ExpenseController.createExpense
);

/**
 * @route GET /api/{version}/expenses
 * @description Mendapatkan semua pengeluaran
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/expenses`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  ExpenseController.getExpenses
);

/**
 * @route GET /api/{version}/expenses/cashier
 * @description Mendapatkan pengeluaran berdasarkan kasir yang login
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/expenses/cashier`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  ExpenseController.getExpensesByCashier
);

/**
 * @route GET /api/{version}/expenses/shift/:shiftId
 * @description Mendapatkan pengeluaran berdasarkan shift
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/expenses/shift/:shiftId`,
  adminAndCashier,
  generalLimiter,
  ExpenseController.getExpensesByShift
);

/**
 * @route GET /api/{version}/expenses/:id
 * @description Mendapatkan pengeluaran berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/expenses/:id`,
  adminAndCashier,
  generalLimiter,
  ExpenseController.getExpenseById
);

/**
 * @route PUT /api/{version}/expenses/:id
 * @description Memperbarui pengeluaran
 * @access Kasir
 */
privateRouter.put(
  `${prefix}/expenses/:id`,
  cashierOnly,
  createLimiter,
  fileUploadOptional("receipt"),
  ExpenseController.updateExpense
);

/**
 * @route DELETE /api/{version}/expenses/:id
 * @description Menghapus pengeluaran
 * @access Kasir
 */
privateRouter.delete(
  `${prefix}/expenses/:id`,
  cashierOnly,
  createLimiter,
  ExpenseController.deleteExpense
);

/**
 * ============================================================================
 * 3. NOTIFICATIONS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/notifications
 * @description Membuat notifikasi baru
 * @access Admin
 */
privateRouter.post(
  `${prefix}/notifications`,
  adminOnly,
  createLimiter,
  NotificationController.createNotification
);

/**
 * @route POST /api/{version}/notifications/bulk
 * @description Membuat notifikasi untuk multiple users
 * @access Admin
 */
privateRouter.post(
  `${prefix}/notifications/bulk`,
  adminOnly,
  createLimiter,
  NotificationController.createBulkNotification
);

/**
 * @route GET /api/{version}/notifications/me
 * @description Mendapatkan notifikasi user yang sedang login
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/notifications/me`,
  allRoles,
  generalLimiter,
  shortTimeout,
  NotificationController.getMyNotifications
);

/**
 * @route GET /api/{version}/notifications/unread-count
 * @description Mendapatkan jumlah notifikasi belum dibaca
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/notifications/unread-count`,
  allRoles,
  generalLimiter,
  NotificationController.getUnreadCount
);

/**
 * @route GET /api/{version}/notifications/total-count
 * @description Mendapatkan jumlah total notifikasi user
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/notifications/total-count`,
  allRoles,
  generalLimiter,
  NotificationController.getTotalCount
);

/**
 * @route GET /api/{version}/notifications/:id
 * @description Mendapatkan notifikasi berdasarkan ID
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/notifications/:id`,
  allRoles,
  generalLimiter,
  NotificationController.getNotificationById
);

/**
 * @route PATCH /api/{version}/notifications/read-all
 * @description Menandai semua notifikasi sudah dibaca
 * @access Semua role
 */
privateRouter.patch(
  `${prefix}/notifications/read-all`,
  allRoles,
  createLimiter,
  NotificationController.markAllAsRead
);

/**
 * @route PATCH /api/{version}/notifications/:id/read
 * @description Menandai notifikasi sudah dibaca
 * @access Semua role
 */
privateRouter.patch(
  `${prefix}/notifications/:id/read`,
  allRoles,
  createLimiter,
  NotificationController.markAsRead
);

/**
 * @route DELETE /api/{version}/notifications
 * @description Menghapus semua notifikasi user
 * @access Semua role
 */
privateRouter.delete(
  `${prefix}/notifications`,
  allRoles,
  createLimiter,
  NotificationController.deleteAllNotifications
);

/**
 * @route DELETE /api/{version}/notifications/:id
 * @description Menghapus notifikasi
 * @access Semua role
 */
privateRouter.delete(
  `${prefix}/notifications/:id`,
  allRoles,
  createLimiter,
  NotificationController.deleteNotification
);

/**
 * ============================================================================
 * 4. ORDERS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/orders
 * @description Membuat pesanan baru
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/orders`,
  cashierOnly,
  createLimiter,
  longTimeout,
  OrderController.createOrder
);

/**
 * @route POST /api/{version}/orders/calculate
 * @description Menghitung total pesanan
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/orders/calculate`,
  cashierOnly,
  createLimiter,
  mediumTimeout,
  OrderController.calculateTotal
);

/**
 * @route GET /api/{version}/orders
 * @description Mendapatkan semua pesanan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/orders`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  OrderController.getOrders
);

/**
 * @route GET /api/{version}/orders/active
 * @description Mendapatkan pesanan yang sedang aktif
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/orders/active`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  OrderController.getActiveOrders
);

/**
 * @route GET /api/{version}/orders/:identifier
 * @description Mendapatkan pesanan berdasarkan ID atau nomor invoice
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/orders/:identifier`,
  adminAndCashier,
  generalLimiter,
  OrderController.getOrder
);

/**
 * @route PATCH /api/{version}/orders/:id/status
 * @description Memperbarui status pesanan
 * @access Semua role
 */
privateRouter.patch(
  `${prefix}/orders/:id/status`,
  allRoles,
  createLimiter,
  longTimeout,
  OrderController.updateOrderStatus
);

/**
 * @route PATCH /api/{version}/orders/:id/close
 * @description Menutup pesanan (COMPLETED → CLOSED)
 * @access Admin, Kasir
 */
privateRouter.patch(
  `${prefix}/orders/:id/close`,
  adminAndCashier,
  createLimiter,
  OrderController.closeOrder
);

/**
 * @route POST /api/{version}/orders/:id/cancel
 * @description Membatalkan pesanan
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/orders/:id/cancel`,
  adminAndCashier,
  createLimiter,
  longTimeout,
  OrderController.cancelOrder
);

/**
 * @route POST /api/{version}/orders/:id/restore
 * @description Mengembalikan pesanan yang telah dihapus
 * @access Admin
 */
privateRouter.post(
  `${prefix}/orders/:id/restore`,
  adminOnly,
  authLimiter,
  OrderController.restoreOrder
);

/**
 * @route DELETE /api/{version}/orders/:id
 * @description Menghapus pesanan secara lunak (soft delete)
 * @access Admin
 */
privateRouter.delete(
  `${prefix}/orders/:id`,
  adminOnly,
  authLimiter,
  OrderController.softDeleteOrder
);

/**
 * ============================================================================
 * 5. PAYMENTS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/payments
 * @description Membuat pembayaran baru
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/payments`,
  cashierOnly,
  createLimiter,
  longTimeout,
  PaymentController.createPayment
);

/**
 * @route GET /api/{version}/payments
 * @description Mendapatkan semua pembayaran
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/payments`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  PaymentController.getPayments
);

/**
 * @route GET /api/{version}/payments/order/:orderId
 * @description Mendapatkan pembayaran berdasarkan pesanan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/payments/order/:orderId`,
  adminAndCashier,
  generalLimiter,
  PaymentController.getPaymentByOrder
);

/**
 * @route GET /api/{version}/payments/order/:orderId/status
 * @description Mendapatkan status pembayaran QRIS dari Midtrans
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/payments/order/:orderId/status`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  PaymentController.getPaymentStatus
);

/**
 * @route GET /api/{version}/payments/:id
 * @description Mendapatkan pembayaran berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/payments/:id`,
  adminAndCashier,
  generalLimiter,
  PaymentController.getPaymentById
);

/**
 * @route POST /api/{version}/payments/:id/refund
 * @description Melakukan refund pembayaran
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/payments/:id/refund`,
  adminAndCashier,
  authLimiter,
  longTimeout,
  PaymentController.refundPayment
);

/**
 * ============================================================================
 * 6. PRODUCTS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/products
 * @description Membuat produk baru
 * @access Admin
 */
privateRouter.post(
  `${prefix}/products`,
  adminOnly,
  createLimiter,
  fileUploadSingle("image"),
  ProductController.createProduct
);

/**
 * @route GET /api/{version}/products
 * @description Mendapatkan semua produk
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/products`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  ProductController.getProducts
);

/**
 * @route GET /api/{version}/products/services
 * @description Mendapatkan produk jenis jasa
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/products/services`,
  adminAndCashier,
  generalLimiter,
  ProductController.getServices
);

/**
 * @route GET /api/{version}/products/spareparts
 * @description Mendapatkan produk jenis sparepart
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/products/spareparts`,
  adminAndCashier,
  generalLimiter,
  ProductController.getSpareparts
);

/**
 * @route GET /api/{version}/products/low-stock
 * @description Mendapatkan produk dengan stok rendah
 * @access Admin
 */
privateRouter.get(
  `${prefix}/products/low-stock`,
  adminOnly,
  generalLimiter,
  ProductController.getLowStockProducts
);

/**
 * @route GET /api/{version}/products/check/sku
 * @description Memeriksa ketersediaan SKU
 * @access Admin
 */
privateRouter.get(
  `${prefix}/products/check/sku`,
  adminOnly,
  generalLimiter,
  ProductController.checkSkuAvailability
);

/**
 * @route GET /api/{version}/products/sku/:sku
 * @description Mendapatkan produk berdasarkan SKU
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/products/sku/:sku`,
  adminAndCashier,
  generalLimiter,
  ProductController.getProductBySku
);

/**
 * @route GET /api/{version}/products/:id
 * @description Mendapatkan produk berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/products/:id`,
  adminAndCashier,
  generalLimiter,
  ProductController.getProductById
);

/**
 * @route PUT /api/{version}/products/:id
 * @description Memperbarui produk
 * @access Admin
 */
privateRouter.put(
  `${prefix}/products/:id`,
  adminOnly,
  createLimiter,
  fileUploadOptional("image"),
  ProductController.updateProduct
);

/**
 * @route PATCH /api/{version}/products/:id/status
 * @description Memperbarui status produk / Toggle status aktif/nonaktif (soft delete)
 * @access Admin
 */
privateRouter.patch(
  `${prefix}/products/:id/status`,
  adminOnly,
  createLimiter,
  ProductController.updateProductStatus
);

/**
 * ============================================================================
 * 7. REPORTS ROUTES
 * ============================================================================
 */

/**
 * @route GET /api/{version}/reports/dashboard
 * @description Mendapatkan ringkasan dashboard
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/reports/dashboard`,
  allRoles,
  reportLimiter,
  reportTimeout,
  ReportController.getDashboardSummary
);

/**
 * @route GET /api/{version}/reports/sales
 * @description Mendapatkan laporan penjualan
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/sales`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getSalesSummary
);

/**
 * @route GET /api/{version}/reports/profit-loss
 * @description Mendapatkan laporan laba rugi
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/profit-loss`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getProfitLossReport
);

/**
 * @route GET /api/{version}/reports/inventory
 * @description Mendapatkan laporan inventaris
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/inventory`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getInventoryReport
);

/**
 * @route GET /api/{version}/reports/expenses
 * @description Mendapatkan laporan pengeluaran
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/expenses`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getExpenseReport
);

/**
 * @route GET /api/{version}/reports/payments
 * @description Mendapatkan laporan pembayaran
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/payments`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getPaymentReport
);

/**
 * @route GET /api/{version}/reports/products/top
 * @description Mendapatkan laporan produk terlaris
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/products/top`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getTopProductsReport
);

/**
 * @route GET /api/{version}/reports/mechanics/performance
 * @description Mendapatkan laporan performa mekanik
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/mechanics/performance`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getMechanicPerformanceReport
);

/**
 * @route GET /api/{version}/reports/mechanics/:mechanicId/tasks
 * @description Mendapatkan statistik tugas mekanik
 * @access Admin, Mekanik
 */
privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/tasks`,
  adminAndMechanic,
  generalLimiter,
  ReportController.getMechanicTaskStats
);

/**
 * @route GET /api/{version}/reports/mechanics/:mechanicId/earnings
 * @description Mendapatkan pendapatan mekanik
 * @access Admin, Mekanik
 */
privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/earnings`,
  adminAndMechanic,
  generalLimiter,
  mediumTimeout,
  ReportController.getMechanicEarnings
);

/**
 * @route GET /api/{version}/reports/shift/:shiftId
 * @description Mendapatkan laporan berdasarkan shift
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/shift/:shiftId`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  ReportController.getShiftReport
);

/**
 * @route GET /api/{version}/reports/stock/:productId/movements
 * @description Mendapatkan laporan pergerakan stok produk
 * @access Admin
 */
privateRouter.get(
  `${prefix}/reports/stock/:productId/movements`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  ReportController.getStockMovementReport
);

/**
 * @route GET /api/{version}/reports/orders/:orderId/tasks
 * @description Mendapatkan statistik tugas berdasarkan pesanan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/reports/orders/:orderId/tasks`,
  adminAndCashier,
  generalLimiter,
  ReportController.getTaskStatsByOrder
);

/**
 * ============================================================================
 * 8. SETTINGS ROUTES
 * ============================================================================
 */

/**
 * @route PUT /api/{version}/settings
 * @description Bulk update settings
 * @access Admin
 */
privateRouter.put(
  `${prefix}/settings`,
  adminOnly,
  authLimiter,
  SettingController.bulkUpdate
);

/**
 * @route GET /api/{version}/settings
 * @description Mendapatkan semua settings
 * @access Admin
 */
privateRouter.get(
  `${prefix}/settings`,
  adminOnly,
  generalLimiter,
  SettingController.getAll
);

/**
 * @route GET /api/{version}/settings/:key
 * @description Mendapatkan setting berdasarkan key
 * @access Admin
 */
privateRouter.get(
  `${prefix}/settings/:key`,
  adminOnly,
  generalLimiter,
  SettingController.getByKey
);

/**
 * @route PUT /api/{version}/settings/:key
 * @description Update satu setting
 * @access Admin
 */
privateRouter.put(
  `${prefix}/settings/:key`,
  adminOnly,
  authLimiter,
  SettingController.update
);

/**
 * ============================================================================
 * 9. SHIFTS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/shifts/open
 * @description Membuka shift baru
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/shifts/open`,
  cashierOnly,
  createLimiter,
  ShiftController.openShift
);

/**
 * @route GET /api/{version}/shifts
 * @description Mendapatkan semua shift
 * @access Admin
 */
privateRouter.get(
  `${prefix}/shifts`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  ShiftController.getShifts
);

/**
 * @route GET /api/{version}/shifts/active
 * @description Mendapatkan shift yang sedang aktif
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/shifts/active`,
  cashierOnly,
  generalLimiter,
  ShiftController.getActiveShift
);

/**
 * @route GET /api/{version}/shifts/active/check
 * @description Memeriksa apakah ada shift yang aktif
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/shifts/active/check`,
  cashierOnly,
  generalLimiter,
  ShiftController.checkActiveShift
);

/**
 * @route GET /api/{version}/shifts/cashiers
 * @description Mendapatkan daftar shift berdasarkan kasir
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/shifts/cashiers`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  ShiftController.getShiftListByCashierId
);

/**
 * @route GET /api/{version}/shifts/starting-cash-suggestion
 * @description Mendapatkan saran starting cash berdasarkan shift sebelumnya
 * @access Kasir
 */
privateRouter.get(
  `${prefix}/shifts/starting-cash-suggestion`,
  cashierOnly,
  generalLimiter,
  ShiftController.getStartingCashSuggestion
);

/**
 * @route GET /api/{version}/shifts/:id
 * @description Mendapatkan shift berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/shifts/:id`,
  adminAndCashier,
  generalLimiter,
  ShiftController.getShiftById
);

/**
 * @route GET /api/{version}/shifts/:id/expected-cash
 * @description Menghitung expected cash shift berdasarkan data sistem
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/shifts/:id/expected-cash`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  ShiftController.getExpectedCash
);

/**
 * @route POST /api/{version}/shifts/:id/close
 * @description Menutup shift
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/shifts/:id/close`,
  cashierOnly,
  createLimiter,
  longTimeout,
  ShiftController.closeShift
);

/**
 * @route POST /api/{version}/shifts/:id/cash-in
 * @description Mencatat pemasukan kas
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/shifts/:id/cash-in`,
  cashierOnly,
  createLimiter,
  ShiftController.recordCashIn
);

/**
 * @route POST /api/{version}/shifts/:id/cash-out
 * @description Mencatat pengeluaran kas
 * @access Kasir
 */
privateRouter.post(
  `${prefix}/shifts/:id/cash-out`,
  cashierOnly,
  createLimiter,
  ShiftController.recordCashOut
);

/**
 * ============================================================================
 * 10. STOCK ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/stock/in
 * @description Mencatat stok masuk
 * @access Admin
 */
privateRouter.post(
  `${prefix}/stock/in`,
  adminOnly,
  createLimiter,
  StockController.recordStockIn
);

/**
 * @route POST /api/{version}/stock/out
 * @description Mencatat stok keluar
 * @access Admin
 */
privateRouter.post(
  `${prefix}/stock/out`,
  adminOnly,
  createLimiter,
  StockController.recordStockOut
);

/**
 * @route POST /api/{version}/stock/sale
 * @description Mencatat stok keluar karena penjualan
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/stock/sale`,
  adminAndCashier,
  createLimiter,
  StockController.recordSaleOut
);

/**
 * @route POST /api/{version}/stock/return
 * @description Mencatat stok masuk karena retur
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/stock/return`,
  adminAndCashier,
  createLimiter,
  StockController.recordReturnIn
);

/**
 * @route POST /api/{version}/stock/adjust
 * @description Mencatat penyesuaian stok
 * @access Admin
 */
privateRouter.post(
  `${prefix}/stock/adjust`,
  adminOnly,
  createLimiter,
  StockController.recordAdjustment
);

/**
 * @route GET /api/{version}/stock/movements
 * @description Mendapatkan semua pergerakan stok
 * @access Admin
 */
privateRouter.get(
  `${prefix}/stock/movements`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  StockController.getStockMovements
);

/**
 * @route GET /api/{version}/stock/movements/:id
 * @description Mendapatkan pergerakan stok berdasarkan ID
 * @access Admin
 */
privateRouter.get(
  `${prefix}/stock/movements/:id`,
  adminOnly,
  generalLimiter,
  StockController.getStockMovementById
);

/**
 * @route GET /api/{version}/stock/products/:productId/movements
 * @description Mendapatkan pergerakan stok berdasarkan produk
 * @access Admin
 */
privateRouter.get(
  `${prefix}/stock/products/:productId/movements`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  StockController.getMovementsByProduct
);

/**
 * @route GET /api/{version}/stock/orders/:orderId/movements
 * @description Mendapatkan pergerakan stok berdasarkan pesanan
 * @access Admin
 */
privateRouter.get(
  `${prefix}/stock/orders/:orderId/movements`,
  adminOnly,
  generalLimiter,
  StockController.getMovementsByOrder
);

/**
 * @route DELETE /api/{version}/stock/movements/:id
 * @description Menghapus catatan pergerakan stok
 * @access Admin
 */
privateRouter.delete(
  `${prefix}/stock/movements/:id`,
  adminOnly,
  authLimiter,
  StockController.deleteStockMovement
);

/**
 * ============================================================================
 * 11. TASKS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/tasks/assign
 * @description Menugaskan mekanik ke tugas
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/tasks/assign`,
  adminAndCashier,
  createLimiter,
  TaskController.assignMechanic
);

/**
 * @route POST /api/{version}/tasks/bulk-assign
 * @description Menugaskan mekanik ke banyak tugas sekaligus
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/tasks/bulk-assign`,
  adminAndCashier,
  createLimiter,
  TaskController.bulkAssignMechanics
);

/**
 * @route GET /api/{version}/tasks
 * @description Mendapatkan semua tugas
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/tasks`,
  allRoles,
  generalLimiter,
  mediumTimeout,
  TaskController.getTasks
);

/**
 * @route GET /api/{version}/tasks/me
 * @description Mendapatkan tugas mekanik yang sedang login (aktif)
 * @access Mekanik
 */
privateRouter.get(
  `${prefix}/tasks/me`,
  mechanicOnly,
  generalLimiter,
  shortTimeout,
  TaskController.getMyTasks
);

/**
 * @route GET /api/{version}/tasks/me/history
 * @description Mendapatkan riwayat tugas mekanik yang sedang login (selesai)
 * @access Mekanik
 */
privateRouter.get(
  `${prefix}/tasks/me/history`,
  mechanicOnly,
  generalLimiter,
  mediumTimeout,
  TaskController.getMyTaskHistory
);

/**
 * @route GET /api/{version}/tasks/unassigned
 * @description Mendapatkan tugas yang belum ditugaskan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/tasks/unassigned`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  TaskController.getUnassignedTasks
);

/**
 * @route GET /api/{version}/tasks/mechanics/available
 * @description Mendapatkan mekanik yang tersedia
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/tasks/mechanics/available`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  TaskController.getAvailableMechanics
);

/**
 * @route GET /api/{version}/tasks/mechanic/:mechanicId
 * @description Mendapatkan tugas berdasarkan mekanik
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/tasks/mechanic/:mechanicId`,
  allRoles,
  generalLimiter,
  TaskController.getTasksByMechanic
);

/**
 * @route GET /api/{version}/tasks/order/:orderId
 * @description Mendapatkan semua task dalam satu order (grouped dengan detail)
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/tasks/order/:orderId`,
  allRoles,
  generalLimiter,
  TaskController.getTasksByOrderId
);

/**
 * @route GET /api/{version}/tasks/order-item/:orderItemId/check
 * @description Memeriksa apakah mekanik sudah ditugaskan ke item pesanan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/tasks/order-item/:orderItemId/check`,
  adminAndCashier,
  generalLimiter,
  TaskController.checkMechanicAssigned
);

/**
 * @route GET /api/{version}/tasks/:id
 * @description Mendapatkan tugas berdasarkan ID
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/tasks/:id`,
  allRoles,
  generalLimiter,
  TaskController.getTaskById
);

/**
 * @route POST /api/{version}/tasks/order/:orderId/unassign
 * @description Membatalkan penugasan mekanik dari pesanan
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/unassign`,
  adminAndCashier,
  createLimiter,
  TaskController.unassignMechanicFromOrder
);

/**
 * @route POST /api/{version}/tasks/order/:orderId/start
 * @description Memulai pengerjaan semua tugas dalam pesanan
 * @access Mekanik
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/start`,
  mechanicOnly,
  createLimiter,
  TaskController.startOrder
);

/**
 * @route POST /api/{version}/tasks/order/:orderId/complete
 * @description Menyelesaikan semua tugas dalam pesanan
 * @access Mekanik
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/complete`,
  mechanicOnly,
  createLimiter,
  TaskController.completeOrder
);

/**
 * ============================================================================
 * 12. USERS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/users
 * @description Membuat user baru
 * @access Admin
 */
privateRouter.post(
  `${prefix}/users`,
  adminOnly,
  createLimiter,
  UserController.createUser
);

/**
 * @route GET /api/{version}/users
 * @description Mendapatkan semua user
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  UserController.getUsers
);

/**
 * @route GET /api/{version}/users/me
 * @description Mendapatkan data user yang sedang login
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/users/me`,
  allRoles,
  generalLimiter,
  UserController.getCurrentUser
);

/**
 * @route GET /api/{version}/users/employees
 * @description Mendapatkan daftar karyawan
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/users/employees`,
  allRoles,
  generalLimiter,
  shortTimeout,
  UserController.getEmployees
);

/**
 * @route GET /api/{version}/users/admins
 * @description Mendapatkan daftar admin
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/admins`,
  adminOnly,
  generalLimiter,
  UserController.getAdmins
);

/**
 * @route GET /api/{version}/users/check/email
 * @description Memeriksa ketersediaan email
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/check/email`,
  adminOnly,
  generalLimiter,
  UserController.checkEmailExists
);

/**
 * @route GET /api/{version}/users/check/phone
 * @description Memeriksa ketersediaan nomor telepon
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/check/phone`,
  adminOnly,
  generalLimiter,
  UserController.checkPhoneExists
);

/**
 * @route GET /api/{version}/users/role/:role
 * @description Mendapatkan user berdasarkan role
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/role/:role`,
  adminOnly,
  generalLimiter,
  UserController.getUsersByRole
);

/**
 * @route GET /api/{version}/users/email/:email
 * @description Mendapatkan user berdasarkan email
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/email/:email`,
  adminOnly,
  generalLimiter,
  UserController.getUserByEmail
);

/**
 * @route GET /api/{version}/users/phone/:phone
 * @description Mendapatkan user berdasarkan nomor telepon
 * @access Admin
 */
privateRouter.get(
  `${prefix}/users/phone/:phone`,
  adminOnly,
  generalLimiter,
  UserController.getUserByPhone
);

/**
 * @route GET /api/{version}/users/:id
 * @description Mendapatkan user berdasarkan ID
 * @access Semua role
 */
privateRouter.get(
  `${prefix}/users/:id`,
  allRoles,
  generalLimiter,
  UserController.getUserById
);

/**
 * @route PUT /api/{version}/users/:id
 * @description Memperbarui data user
 * @access Admin
 */
privateRouter.put(
  `${prefix}/users/:id`,
  adminOnly,
  createLimiter,
  UserController.updateUser
);




/**
 * @route DELETE /api/{version}/users/:id
 * @description Menghapus user
 * @access Admin
 */
privateRouter.delete(
  `${prefix}/users/:id`,
  adminOnly,
  authLimiter,
  UserController.deleteUser
);

/**
 * @route POST /api/{version}/users/:id/resend-magic-link
 * @description Generate ulang Magic Link untuk user yang belum terautentikasi
 * @access Admin
 */
privateRouter.post(
  `${prefix}/users/:id/resend-magic-link`,
  adminOnly,
  authLimiter,
  UserController.resendMagicLink
);

/**
 * ============================================================================
 * 13. VEHICLES ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/vehicles
 * @description Mendaftarkan kendaraan baru
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/vehicles`,
  adminAndCashier,
  createLimiter,
  VehicleController.registerVehicle
);

/**
 * @route GET /api/{version}/vehicles
 * @description Mendapatkan semua kendaraan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  VehicleController.getVehicles
);

/**
 * @route GET /api/{version}/vehicles/check/plate
 * @description Memeriksa apakah nomor plat sudah terdaftar
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles/check/plate`,
  adminAndCashier,
  generalLimiter,
  VehicleController.checkPlateNumberExists
);

/**
 * @route GET /api/{version}/vehicles/search/plate
 * @description Mencari kendaraan berdasarkan nomor plat
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles/search/plate`,
  adminAndCashier,
  generalLimiter,
  VehicleController.searchByPlateNumber
);

/**
 * @route GET /api/{version}/vehicles/plate/:plateNumber
 * @description Mendapatkan kendaraan berdasarkan nomor plat
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles/plate/:plateNumber`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehicleByPlateNumber
);

/**
 * @route GET /api/{version}/vehicles/customer/:customerId
 * @description Mendapatkan kendaraan berdasarkan pelanggan
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles/customer/:customerId`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehiclesByCustomer
);

/**
 * @route GET /api/{version}/vehicles/:id
 * @description Mendapatkan kendaraan berdasarkan ID
 * @access Admin, Kasir
 */
privateRouter.get(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehicleById
);

/**
 * @route PUT /api/{version}/vehicles/:id
 * @description Memperbarui data kendaraan
 * @access Admin, Kasir
 */
privateRouter.put(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  createLimiter,
  VehicleController.updateVehicle
);

/**
 * @route DELETE /api/{version}/vehicles/:id
 * @description Menghapus kendaraan
 * @access Admin
 */
privateRouter.delete(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  authLimiter,
  VehicleController.deleteVehicle
);

export default privateRouter;