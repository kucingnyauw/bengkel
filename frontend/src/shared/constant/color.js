import {
  OrderStatus,
  PaymentStatus,
  ShiftStatus,
  StockMovementType,
  StockSourceType,
  ExpenseCategory,
  Role,
  ProductType,
  PaymentMethod,
  NotificationType,
} from "./enum.js";

/**
 * Color mapping untuk status-color chip MUI.
 *
 * Palet yang digunakan:
 * - "primary"    → monokrom (hitam/putih, warna utama tema)
 * - "secondary"  → ungu aksen (cocok untuk highlight, info khusus)
 * - "success"    → hijau
 * - "warning"    → kuning/oranye
 * - "error"      → merah
 * - "info"       → biru
 * - "default"    → abu-abu netral
 */

export const statusColorMap = {
  [OrderStatus.DRAFT]: "default",
  [OrderStatus.QUEUED]: "warning",
  [OrderStatus.IN_PROGRESS]: "secondary", // ungu: sedang dikerjakan
  [OrderStatus.COMPLETED]: "success",
  [OrderStatus.CLOSED]: "default",
  [OrderStatus.CANCELLED]: "error",
};

export const paymentStatusColorMap = {
  [PaymentStatus.PAID]: "success",
  [PaymentStatus.PENDING]: "warning",
  [PaymentStatus.REFUNDED]: "error",
};

export const shiftStatusColorMap = {
  [ShiftStatus.OPEN]: "success",
  [ShiftStatus.CLOSED]: "default",
};

export const stockMovementTypeColorMap = {
  [StockMovementType.IN]: "success",
  [StockMovementType.OUT]: "error",
  [StockMovementType.ADJUSTMENT]: "warning",
};

export const stockSourceTypeColorMap = {
  [StockSourceType.MANUAL]: "default",
  [StockSourceType.PURCHASE]: "primary",    // monokrom: beli dari supplier
  [StockSourceType.SALE]: "success",
  [StockSourceType.RETURN]: "warning",
  [StockSourceType.ADJUSTMENT]: "secondary", // ungu: penyesuaian stok
};

export const expenseCategoryColorMap = {
  [ExpenseCategory.SUPPLIES]: "info",
  [ExpenseCategory.MAINTENANCE]: "warning",
  [ExpenseCategory.UTILITIES]: "secondary",  // ungu: utilities
  [ExpenseCategory.RENT]: "error",
  [ExpenseCategory.OTHER]: "default",
};

export const roleColorMap = {
  [Role.SUPERADMIN]: "error",               // merah: superadmin (bahaya)
  [Role.ADMIN]: "primary",                  // monokrom: admin
  [Role.CASHIER]: "success",                // hijau: kasir (transaksi)
  [Role.MECHANIC]: "secondary",             // ungu: mekanik
};

export const productTypeColorMap = {
  [ProductType.SPAREPART]: "warning",
  [ProductType.SERVICE]: "secondary",       // ungu: jasa servis
};

export const paymentMethodColorMap = {
  [PaymentMethod.CASH]: "success",
  [PaymentMethod.QRIS]: "secondary",        // ungu: pembayaran digital
};

export const notificationTypeColorMap = {
  [NotificationType.INFO]: "info",
  [NotificationType.WARNING]: "warning",
  [NotificationType.SUCCESS]: "success",
  [NotificationType.ERROR]: "error",
};