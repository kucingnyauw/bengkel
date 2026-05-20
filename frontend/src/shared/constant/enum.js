const Role = Object.freeze({
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  CASHIER: "CASHIER",
  MECHANIC: "MECHANIC",
});

const ProductType = Object.freeze({
  SPAREPART: "SPAREPART",
  SERVICE: "SERVICE",
});

const OrderStatus = Object.freeze({
  DRAFT: "DRAFT",
  QUEUED: "QUEUED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

const PaymentMethod = Object.freeze({
  CASH: "CASH",
  QRIS: "QRIS",
});

const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
});

const ShiftStatus = Object.freeze({
  OPEN: "OPEN",
  CLOSED: "CLOSED",
});

const StockMovementType = Object.freeze({
  IN: "IN",
  OUT: "OUT",
  ADJUSTMENT: "ADJUSTMENT",
});

const StockSourceType = Object.freeze({
  MANUAL: "MANUAL",
  PURCHASE: "PURCHASE",
  SALE: "SALE",
  RETURN: "RETURN",
  ADJUSTMENT: "ADJUSTMENT",
});

const ExpenseCategory = Object.freeze({
  SUPPLIES: "SUPPLIES",
  MAINTENANCE: "MAINTENANCE",
  UTILITIES: "UTILITIES",
  RENT: "RENT",
  OTHER: "OTHER",
});

const NotificationType = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
});

export {
  Role,
  ProductType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShiftStatus,
  StockMovementType,
  StockSourceType,
  ExpenseCategory,
  NotificationType,
};