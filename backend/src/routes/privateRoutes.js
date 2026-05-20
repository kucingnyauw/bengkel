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

import {
  fileUploadSingle,
  fileUploadOptional,
} from "#middleware/fileMiddleware.js";

const privateRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;

privateRouter.use(authMiddleware);

const adminOnly = roleMiddleware({ allowedRoles: ["ADMIN", "SUPERADMIN"] });
const cashierOnly = roleMiddleware({ allowedRoles: ["CASHIER", "SUPERADMIN"] });
const mechanicOnly = roleMiddleware({
  allowedRoles: ["MECHANIC", "SUPERADMIN"],
});
const adminAndCashier = roleMiddleware({
  allowedRoles: ["ADMIN", "CASHIER", "SUPERADMIN"],
});
const adminAndMechanic = roleMiddleware({
  allowedRoles: ["ADMIN", "MECHANIC", "SUPERADMIN"],
});
const allRoles = roleMiddleware({
  allowedRoles: ["ADMIN", "CASHIER", "MECHANIC", "SUPERADMIN"],
});

const shortTimeout = timeoutMiddleware({ timeoutMs: 10000 });
const mediumTimeout = timeoutMiddleware({ timeoutMs: 20000 });
const longTimeout = timeoutMiddleware({ timeoutMs: 45000 });
const reportTimeout = timeoutMiddleware({ timeoutMs: 60000 });

/**
 * ============================================================================
 * 1. CUSTOMERS ROUTES
 * ============================================================================
 */

/**
 * @route POST /api/{version}/customers
 * @description Membuat pelanggan baru
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/customers`,
  adminAndCashier,
  CustomerController.createCustomer
);

/**
 * @route PUT /api/{version}/customers/upsert
 * @description Membuat atau memperbarui data pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.put(
  `${prefix}/customers/upsert`,
  adminAndCashier,
  CustomerController.upsertCustomer
);

/**
 * @route GET /api/{version}/customers
 * @description Mendapatkan semua pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/customers`,
  adminAndCashier,
  shortTimeout,
  CustomerController.getCustomers
);

/**
 * @route GET /api/{version}/customers/phone/check
 * @description Memeriksa ketersediaan nomor telepon pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/customers/phone/check`,
  adminAndCashier,
  CustomerController.checkPhoneAvailability
);

/**
 * @route GET /api/{version}/customers/phone/:phone
 * @description Mendapatkan pelanggan berdasarkan nomor telepon
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/customers/phone/:phone`,
  adminAndCashier,
  CustomerController.getCustomerByPhone
);

/**
 * @route GET /api/{version}/customers/:id
 * @description Mendapatkan pelanggan berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/customers/:id`,
  adminAndCashier,
  CustomerController.getCustomerById
);

/**
 * @route PUT /api/{version}/customers/:id
 * @description Memperbarui data pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.put(
  `${prefix}/customers/:id`,
  adminAndCashier,
  CustomerController.updateCustomer
);

/**
 * @route DELETE /api/{version}/customers/:id
 * @description Menghapus pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.delete(
  `${prefix}/customers/:id`,
  adminAndCashier,
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
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/expenses`,
  cashierOnly,
  fileUploadOptional("receipt"),
  ExpenseController.createExpense
);

/**
 * @route GET /api/{version}/expenses
 * @description Mendapatkan semua pengeluaran
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/expenses`,
  adminAndCashier,
  shortTimeout,
  ExpenseController.getExpenses
);

/**
 * @route GET /api/{version}/expenses/cashier
 * @description Mendapatkan pengeluaran berdasarkan kasir yang login
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/expenses/cashier`,
  cashierOnly,
  shortTimeout,
  ExpenseController.getExpensesByCashier
);

/**
 * @route GET /api/{version}/expenses/shift/:shiftId
 * @description Mendapatkan pengeluaran berdasarkan shift
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/expenses/shift/:shiftId`,
  adminAndCashier,
  ExpenseController.getExpensesByShift
);

/**
 * @route GET /api/{version}/expenses/:id
 * @description Mendapatkan pengeluaran berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/expenses/:id`,
  adminAndCashier,
  ExpenseController.getExpenseById
);

/**
 * @route PUT /api/{version}/expenses/:id
 * @description Memperbarui pengeluaran
 * @access Kasir & Superadmin
 */
privateRouter.put(
  `${prefix}/expenses/:id`,
  cashierOnly,
  fileUploadOptional("receipt"),
  ExpenseController.updateExpense
);

/**
 * @route DELETE /api/{version}/expenses/:id
 * @description Menghapus pengeluaran
 * @access Kasir & Superadmin
 */
privateRouter.delete(
  `${prefix}/expenses/:id`,
  cashierOnly,
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
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/notifications`,
  adminOnly,
  NotificationController.createNotification
);

/**
 * @route POST /api/{version}/notifications/bulk
 * @description Membuat notifikasi untuk multiple users
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/notifications/bulk`,
  adminOnly,
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
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/orders`,
  cashierOnly,
  longTimeout,
  OrderController.createOrder
);

/**
 * @route POST /api/{version}/orders/calculate
 * @description Menghitung total pesanan
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/orders/calculate`,
  cashierOnly,
  mediumTimeout,
  OrderController.calculateTotal
);

/**
 * @route GET /api/{version}/orders
 * @description Mendapatkan semua pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/orders`,
  adminAndCashier,
  mediumTimeout,
  OrderController.getOrders
);

/**
 * @route GET /api/{version}/orders/active
 * @description Mendapatkan pesanan yang sedang aktif
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/orders/active`,
  cashierOnly,
  shortTimeout,
  OrderController.getActiveOrders
);

/**
 * @route GET /api/{version}/orders/:identifier
 * @description Mendapatkan pesanan berdasarkan ID atau nomor invoice
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/orders/:identifier`,
  adminAndCashier,
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
  longTimeout,
  OrderController.updateOrderStatus
);

/**
 * @route PATCH /api/{version}/orders/:id/close
 * @description Menutup pesanan (COMPLETED → CLOSED)
 * @access Admin, Kasir & Superadmin
 */
privateRouter.patch(
  `${prefix}/orders/:id/close`,
  adminAndCashier,
  OrderController.closeOrder
);

/**
 * @route POST /api/{version}/orders/:id/cancel
 * @description Membatalkan pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/orders/:id/cancel`,
  adminAndCashier,
  longTimeout,
  OrderController.cancelOrder
);

/**
 * @route POST /api/{version}/orders/:id/restore
 * @description Mengembalikan pesanan yang telah dihapus
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/orders/:id/restore`,
  adminOnly,
  OrderController.restoreOrder
);

/**
 * @route DELETE /api/{version}/orders/:id
 * @description Menghapus pesanan secara lunak (soft delete)
 * @access Admin & Superadmin
 */
privateRouter.delete(
  `${prefix}/orders/:id`,
  adminOnly,
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
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/payments`,
  cashierOnly,
  longTimeout,
  PaymentController.createPayment
);

/**
 * @route GET /api/{version}/payments
 * @description Mendapatkan semua pembayaran
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/payments`,
  adminAndCashier,
  shortTimeout,
  PaymentController.getPayments
);

/**
 * @route GET /api/{version}/payments/order/:orderId
 * @description Mendapatkan pembayaran berdasarkan pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/payments/order/:orderId`,
  adminAndCashier,
  PaymentController.getPaymentByOrder
);

/**
 * @route GET /api/{version}/payments/order/:orderId/status
 * @description Mendapatkan status pembayaran QRIS dari Midtrans
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/payments/order/:orderId/status`,
  adminAndCashier,
  mediumTimeout,
  PaymentController.getPaymentStatus
);

/**
 * @route GET /api/{version}/payments/:id
 * @description Mendapatkan pembayaran berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/payments/:id`,
  adminAndCashier,
  PaymentController.getPaymentById
);

/**
 * @route POST /api/{version}/payments/:id/refund
 * @description Melakukan refund pembayaran
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/payments/:id/refund`,
  adminAndCashier,
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
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/products`,
  adminOnly,
  fileUploadSingle("image"),
  ProductController.createProduct
);

/**
 * @route GET /api/{version}/products
 * @description Mendapatkan semua produk
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/products`,
  adminAndCashier,
  shortTimeout,
  ProductController.getProducts
);

/**
 * @route GET /api/{version}/products/services
 * @description Mendapatkan produk jenis jasa
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/products/services`,
  adminAndCashier,
  ProductController.getServices
);

/**
 * @route GET /api/{version}/products/spareparts
 * @description Mendapatkan produk jenis sparepart
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/products/spareparts`,
  adminAndCashier,
  ProductController.getSpareparts
);

/**
 * @route GET /api/{version}/products/low-stock
 * @description Mendapatkan produk dengan stok rendah
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/products/low-stock`,
  adminOnly,
  ProductController.getLowStockProducts
);

/**
 * @route GET /api/{version}/products/check/sku
 * @description Memeriksa ketersediaan SKU
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/products/check/sku`,
  adminOnly,
  ProductController.checkSkuAvailability
);

/**
 * @route GET /api/{version}/products/sku/:sku
 * @description Mendapatkan produk berdasarkan SKU
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/products/sku/:sku`,
  adminAndCashier,
  ProductController.getProductBySku
);

/**
 * @route GET /api/{version}/products/:id
 * @description Mendapatkan produk berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/products/:id`,
  adminAndCashier,
  ProductController.getProductById
);

/**
 * @route PUT /api/{version}/products/:id
 * @description Memperbarui produk
 * @access Admin & Superadmin
 */
privateRouter.put(
  `${prefix}/products/:id`,
  adminOnly,
  fileUploadOptional("image"),
  ProductController.updateProduct
);

/**
 * @route PATCH /api/{version}/products/:id/status
 * @description Memperbarui status produk / Toggle status aktif/nonaktif (soft delete)
 * @access Admin & Superadmin
 */
privateRouter.patch(
  `${prefix}/products/:id/status`,
  adminOnly,
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
  reportTimeout,
  ReportController.getDashboardSummary
);

/**
 * @route GET /api/{version}/reports/sales
 * @description Mendapatkan laporan penjualan
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/sales`,
  adminOnly,
  reportTimeout,
  ReportController.getSalesSummary
);

/**
 * @route GET /api/{version}/reports/profit-loss
 * @description Mendapatkan laporan laba rugi
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/profit-loss`,
  adminOnly,
  reportTimeout,
  ReportController.getProfitLossReport
);

/**
 * @route GET /api/{version}/reports/inventory
 * @description Mendapatkan laporan inventaris
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/inventory`,
  adminOnly,
  reportTimeout,
  ReportController.getInventoryReport
);

/**
 * @route GET /api/{version}/reports/expenses
 * @description Mendapatkan laporan pengeluaran
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/expenses`,
  adminOnly,
  mediumTimeout,
  ReportController.getExpenseReport
);

/**
 * @route GET /api/{version}/reports/payments
 * @description Mendapatkan laporan pembayaran
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/payments`,
  adminOnly,
  mediumTimeout,
  ReportController.getPaymentReport
);

/**
 * @route GET /api/{version}/reports/products/top
 * @description Mendapatkan laporan produk terlaris
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/products/top`,
  adminOnly,
  reportTimeout,
  ReportController.getTopProductsReport
);

/**
 * @route GET /api/{version}/reports/mechanics/performance
 * @description Mendapatkan laporan performa mekanik
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/mechanics/performance`,
  adminOnly,
  reportTimeout,
  ReportController.getMechanicPerformanceReport
);

/**
 * @route GET /api/{version}/reports/mechanics/:mechanicId/tasks
 * @description Mendapatkan statistik tugas mekanik
 * @access Admin, Mekanik & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/tasks`,
  adminAndMechanic,
  ReportController.getMechanicTaskStats
);

/**
 * @route GET /api/{version}/reports/mechanics/:mechanicId/earnings
 * @description Mendapatkan pendapatan mekanik
 * @access Admin, Mekanik & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/earnings`,
  adminAndMechanic,
  mediumTimeout,
  ReportController.getMechanicEarnings
);

/**
 * @route GET /api/{version}/reports/shift/:shiftId
 * @description Mendapatkan laporan berdasarkan shift
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/shift/:shiftId`,
  adminOnly,
  mediumTimeout,
  ReportController.getShiftReport
);

/**
 * @route GET /api/{version}/reports/stock/:productId/movements
 * @description Mendapatkan laporan pergerakan stok produk
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/stock/:productId/movements`,
  adminOnly,
  mediumTimeout,
  ReportController.getStockMovementReport
);

/**
 * @route GET /api/{version}/reports/orders/:orderId/tasks
 * @description Mendapatkan statistik tugas berdasarkan pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/reports/orders/:orderId/tasks`,
  adminAndCashier,
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
 * @access Admin & Superadmin
 */
privateRouter.put(
  `${prefix}/settings`,
  adminOnly,
  SettingController.bulkUpdate
);

/**
 * @route GET /api/{version}/settings
 * @description Mendapatkan semua settings
 * @access Admin & Superadmin
 */
privateRouter.get(`${prefix}/settings`, adminOnly, SettingController.getAll);

/**
 * @route GET /api/{version}/settings/:key
 * @description Mendapatkan setting berdasarkan key
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/settings/:key`,
  adminOnly,
  SettingController.getByKey
);

/**
 * @route PUT /api/{version}/settings/:key
 * @description Update satu setting
 * @access Admin & Superadmin
 */
privateRouter.put(
  `${prefix}/settings/:key`,
  adminOnly,
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
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/shifts/open`,
  cashierOnly,
  ShiftController.openShift
);

/**
 * @route GET /api/{version}/shifts
 * @description Mendapatkan semua shift
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts`,
  adminOnly,
  shortTimeout,
  ShiftController.getShifts
);

/**
 * @route GET /api/{version}/shifts/active
 * @description Mendapatkan shift yang sedang aktif
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/active`,
  cashierOnly,
  ShiftController.getActiveShift
);

/**
 * @route GET /api/{version}/shifts/active/check
 * @description Memeriksa apakah ada shift yang aktif
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/active/check`,
  cashierOnly,
  ShiftController.checkActiveShift
);

/**
 * @route GET /api/{version}/shifts/cashiers
 * @description Mendapatkan daftar shift berdasarkan kasir
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/cashiers`,
  cashierOnly,
  shortTimeout,
  ShiftController.getShiftListByCashierId
);

/**
 * @route GET /api/{version}/shifts/starting-cash-suggestion
 * @description Mendapatkan saran starting cash berdasarkan shift sebelumnya
 * @access Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/starting-cash-suggestion`,
  cashierOnly,
  ShiftController.getStartingCashSuggestion
);

/**
 * @route GET /api/{version}/shifts/:id
 * @description Mendapatkan shift berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/:id`,
  adminAndCashier,
  ShiftController.getShiftById
);

/**
 * @route GET /api/{version}/shifts/:id/expected-cash
 * @description Menghitung expected cash shift berdasarkan data sistem
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/shifts/:id/expected-cash`,
  adminAndCashier,
  mediumTimeout,
  ShiftController.getExpectedCash
);

/**
 * @route POST /api/{version}/shifts/:id/close
 * @description Menutup shift
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/shifts/:id/close`,
  cashierOnly,
  longTimeout,
  ShiftController.closeShift
);

/**
 * @route POST /api/{version}/shifts/:id/cash-in
 * @description Mencatat pemasukan kas
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/shifts/:id/cash-in`,
  cashierOnly,
  ShiftController.recordCashIn
);

/**
 * @route POST /api/{version}/shifts/:id/cash-out
 * @description Mencatat pengeluaran kas
 * @access Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/shifts/:id/cash-out`,
  cashierOnly,
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
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/stock/in`,
  adminOnly,
  StockController.recordStockIn
);

/**
 * @route POST /api/{version}/stock/out
 * @description Mencatat stok keluar
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/stock/out`,
  adminOnly,
  StockController.recordStockOut
);

/**
 * @route POST /api/{version}/stock/sale
 * @description Mencatat stok keluar karena penjualan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/stock/sale`,
  adminAndCashier,
  StockController.recordSaleOut
);

/**
 * @route POST /api/{version}/stock/return
 * @description Mencatat stok masuk karena retur
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/stock/return`,
  adminAndCashier,
  StockController.recordReturnIn
);

/**
 * @route POST /api/{version}/stock/adjust
 * @description Mencatat penyesuaian stok
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/stock/adjust`,
  adminOnly,
  StockController.recordAdjustment
);

/**
 * @route GET /api/{version}/stock/movements
 * @description Mendapatkan semua pergerakan stok
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/stock/movements`,
  adminOnly,
  mediumTimeout,
  StockController.getStockMovements
);

/**
 * @route GET /api/{version}/stock/movements/:id
 * @description Mendapatkan pergerakan stok berdasarkan ID
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/stock/movements/:id`,
  adminOnly,
  StockController.getStockMovementById
);

/**
 * @route GET /api/{version}/stock/products/:productId/movements
 * @description Mendapatkan pergerakan stok berdasarkan produk
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/stock/products/:productId/movements`,
  adminOnly,
  shortTimeout,
  StockController.getMovementsByProduct
);

/**
 * @route GET /api/{version}/stock/orders/:orderId/movements
 * @description Mendapatkan pergerakan stok berdasarkan pesanan
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/stock/orders/:orderId/movements`,
  adminOnly,
  StockController.getMovementsByOrder
);

/**
 * @route DELETE /api/{version}/stock/movements/:id
 * @description Menghapus catatan pergerakan stok
 * @access Admin & Superadmin
 */
privateRouter.delete(
  `${prefix}/stock/movements/:id`,
  adminOnly,
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
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/tasks/assign`,
  adminAndCashier,
  TaskController.assignMechanic
);

/**
 * @route POST /api/{version}/tasks/bulk-assign
 * @description Menugaskan mekanik ke banyak tugas sekaligus
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/tasks/bulk-assign`,
  adminAndCashier,
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
  mediumTimeout,
  TaskController.getTasks
);

/**
 * @route GET /api/{version}/tasks/me
 * @description Mendapatkan tugas mekanik yang sedang login (aktif)
 * @access Mekanik & Superadmin
 */
privateRouter.get(
  `${prefix}/tasks/me`,
  mechanicOnly,
  shortTimeout,
  TaskController.getMyTasks
);

/**
 * @route GET /api/{version}/tasks/me/history
 * @description Mendapatkan riwayat tugas mekanik yang sedang login (selesai)
 * @access Mekanik & Superadmin
 */
privateRouter.get(
  `${prefix}/tasks/me/history`,
  mechanicOnly,
  mediumTimeout,
  TaskController.getMyTaskHistory
);

/**
 * @route GET /api/{version}/tasks/unassigned
 * @description Mendapatkan tugas yang belum ditugaskan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/tasks/unassigned`,
  adminAndCashier,
  shortTimeout,
  TaskController.getUnassignedTasks
);

/**
 * @route GET /api/{version}/tasks/mechanics/available
 * @description Mendapatkan mekanik yang tersedia
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/tasks/mechanics/available`,
  adminAndCashier,
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
  TaskController.getTasksByOrderId
);

/**
 * @route GET /api/{version}/tasks/order-item/:orderItemId/check
 * @description Memeriksa apakah mekanik sudah ditugaskan ke item pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/tasks/order-item/:orderItemId/check`,
  adminAndCashier,
  TaskController.checkMechanicAssigned
);

/**
 * @route GET /api/{version}/tasks/:id
 * @description Mendapatkan tugas berdasarkan ID
 * @access Semua role
 */
privateRouter.get(`${prefix}/tasks/:id`, allRoles, TaskController.getTaskById);

/**
 * @route POST /api/{version}/tasks/order/:orderId/unassign
 * @description Membatalkan penugasan mekanik dari pesanan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/unassign`,
  adminAndCashier,
  TaskController.unassignMechanicFromOrder
);

/**
 * @route POST /api/{version}/tasks/order/:orderId/start
 * @description Memulai pengerjaan semua tugas dalam pesanan
 * @access Mekanik & Superadmin
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/start`,
  mechanicOnly,
  TaskController.startOrder
);

/**
 * @route POST /api/{version}/tasks/order/:orderId/complete
 * @description Menyelesaikan semua tugas dalam pesanan
 * @access Mekanik & Superadmin
 */
privateRouter.post(
  `${prefix}/tasks/order/:orderId/complete`,
  mechanicOnly,
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
 * @access Admin & Superadmin
 */
privateRouter.post(`${prefix}/users`, adminOnly, UserController.createUser);

/**
 * @route GET /api/{version}/users
 * @description Mendapatkan semua user
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users`,
  adminOnly,
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
  shortTimeout,
  UserController.getEmployees
);

/**
 * @route GET /api/{version}/users/admins
 * @description Mendapatkan daftar admin
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/admins`,
  adminOnly,
  UserController.getAdmins
);

/**
 * @route GET /api/{version}/users/check/email
 * @description Memeriksa ketersediaan email
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/check/email`,
  adminOnly,
  UserController.checkEmailExists
);

/**
 * @route GET /api/{version}/users/check/phone
 * @description Memeriksa ketersediaan nomor telepon
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/check/phone`,
  adminOnly,
  UserController.checkPhoneExists
);

/**
 * @route GET /api/{version}/users/role/:role
 * @description Mendapatkan user berdasarkan role
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/role/:role`,
  adminOnly,
  UserController.getUsersByRole
);

/**
 * @route GET /api/{version}/users/email/:email
 * @description Mendapatkan user berdasarkan email
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/email/:email`,
  adminOnly,
  UserController.getUserByEmail
);

/**
 * @route GET /api/{version}/users/phone/:phone
 * @description Mendapatkan user berdasarkan nomor telepon
 * @access Admin & Superadmin
 */
privateRouter.get(
  `${prefix}/users/phone/:phone`,
  adminOnly,
  UserController.getUserByPhone
);

/**
 * @route GET /api/{version}/users/:id
 * @description Mendapatkan user berdasarkan ID
 * @access Semua role
 */
privateRouter.get(`${prefix}/users/:id`, allRoles, UserController.getUserById);

/**
 * @route PUT /api/{version}/users/:id
 * @description Memperbarui data user
 * @access Admin & Superadmin
 */
privateRouter.put(`${prefix}/users/:id`, adminOnly, UserController.updateUser);

/**
 * @route DELETE /api/{version}/users/:id
 * @description Menghapus user
 * @access Admin & Superadmin
 */
privateRouter.delete(
  `${prefix}/users/:id`,
  adminOnly,
  UserController.deleteUser
);

/**
 * @route POST /api/{version}/users/:id/resend-magic-link
 * @description Generate ulang Magic Link untuk user yang belum terautentikasi
 * @access Admin & Superadmin
 */
privateRouter.post(
  `${prefix}/users/:id/resend-magic-link`,
  adminOnly,
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
 * @access Admin, Kasir & Superadmin
 */
privateRouter.post(
  `${prefix}/vehicles`,
  adminAndCashier,
  VehicleController.registerVehicle
);

/**
 * @route GET /api/{version}/vehicles
 * @description Mendapatkan semua kendaraan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles`,
  adminAndCashier,
  mediumTimeout,
  VehicleController.getVehicles
);

/**
 * @route GET /api/{version}/vehicles/check/plate
 * @description Memeriksa apakah nomor plat sudah terdaftar
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles/check/plate`,
  adminAndCashier,
  VehicleController.checkPlateNumberExists
);

/**
 * @route GET /api/{version}/vehicles/search/plate
 * @description Mencari kendaraan berdasarkan nomor plat
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles/search/plate`,
  adminAndCashier,
  VehicleController.searchByPlateNumber
);

/**
 * @route GET /api/{version}/vehicles/plate/:plateNumber
 * @description Mendapatkan kendaraan berdasarkan nomor plat
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles/plate/:plateNumber`,
  adminAndCashier,
  VehicleController.getVehicleByPlateNumber
);

/**
 * @route GET /api/{version}/vehicles/customer/:customerId
 * @description Mendapatkan kendaraan berdasarkan pelanggan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles/customer/:customerId`,
  adminAndCashier,
  VehicleController.getVehiclesByCustomer
);

/**
 * @route GET /api/{version}/vehicles/:id
 * @description Mendapatkan kendaraan berdasarkan ID
 * @access Admin, Kasir & Superadmin
 */
privateRouter.get(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  VehicleController.getVehicleById
);

/**
 * @route PUT /api/{version}/vehicles/:id
 * @description Memperbarui data kendaraan
 * @access Admin, Kasir & Superadmin
 */
privateRouter.put(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  VehicleController.updateVehicle
);

/**
 * @route DELETE /api/{version}/vehicles/:id
 * @description Menghapus kendaraan
 * @access Admin & Superadmin
 */
privateRouter.delete(
  `${prefix}/vehicles/:id`,
  adminOnly,
  VehicleController.deleteVehicle
);

export default privateRouter;
