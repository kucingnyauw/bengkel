/**
 * Data Transfer Object untuk response Report
 * @module dtos/reportDto
 */

/**
 * Base DTO class untuk memastikan spread compatibility
 * @class BaseDto
 */
class BaseDto {
  /**
   * Convert DTO ke plain object
   * @returns {Object}
   */
  toJSON() {
    return { ...this };
  }
}

/**
 * DTO untuk ringkasan data penjualan
 * @class SalesDataDto
 * @extends BaseDto
 */
class SalesDataDto extends BaseDto {
  /**
   * @param {Object} data - Data agregat penjualan
   */
  constructor(data) {
    super();
    this.totalOrders = data.totalOrders || 0;
    this.totalSales = data.totalSales || 0;
    this.totalSubtotal = data.totalSubtotal || 0;
    this.totalTax = data.totalTax || 0;
  }
}

/**
 * DTO untuk ringkasan penjualan harian
 * @class DailySalesDto
 * @extends BaseDto
 */
class DailySalesDto extends BaseDto {
  /**
   * @param {Object} data - Data penjualan harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.orderCount = data.orderCount || 0;
    this.totalSales = data.totalSales || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
  }
}

/**
 * DTO untuk laporan laba rugi
 * @class ProfitLossDto
 * @extends BaseDto
 */
class ProfitLossDto extends BaseDto {
  /**
   * @param {Object} data - Data laba rugi
   */
  constructor(data) {
    super();
    this.grossRevenue = data.grossRevenue || 0;
    this.totalCogs = data.totalCogs || 0;
    this.grossProfit = data.grossProfit || 0;
    this.grossMargin = data.grossMargin || 0;
    this.totalOperatingExpenses = data.totalOperatingExpenses || 0;
    this.netProfit = data.netProfit || 0;
    this.netMargin = data.netMargin || 0;
  }
}

/**
 * DTO untuk item dalam snapshot inventori
 * @class InventoryItemDto
 * @extends BaseDto
 */
class InventoryItemDto extends BaseDto {
  /**
   * @param {Object} data - Data item inventori
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.sku = data.sku;
    this.name = data.name;
    this.stock = data.stock || 0;
    this.cost = data.cost || 0;
    this.price = data.price || 0;
    this.image = data.image || null;
    this.assetValue = data.assetValue || 0;
    this.retailValue = data.retailValue || 0;
    this.potentialProfit = data.potentialProfit || 0;
    this.stockStatus = data.stockStatus || "HEALTHY";
  }
}

/**
 * DTO untuk snapshot inventori
 * @class InventorySnapshotDto
 * @extends BaseDto
 */
class InventorySnapshotDto extends BaseDto {
  /**
   * @param {Object} data - Data snapshot inventori
   */
  constructor(data) {
    super();
    this.totalAssetValue = data.totalAssetValue || 0;
    this.totalRetailValue = data.totalRetailValue || 0;
    this.potentialProfit = data.potentialProfit || 0;
    this.profitMargin = data.profitMargin || 0;
    this.items = data.items?.map((i) => new InventoryItemDto(i)) ?? [];
  }
}

/**
 * DTO untuk breakdown pembayaran
 * @class PaymentBreakdownDto
 * @extends BaseDto
 */
class PaymentBreakdownDto extends BaseDto {
  /**
   * @param {Object} data - Data breakdown pembayaran
   */
  constructor(data) {
    super();
    this.method = data.method;
    this.total = data.total || 0;
    this.count = data.count || 0;
  }
}

/**
 * DTO untuk ringkasan order dalam laporan shift
 * @class ShiftReportOrderDto
 * @extends BaseDto
 */
class ShiftReportOrderDto extends BaseDto {
  /**
   * @param {Object} data - Data order
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.total = data.total || 0;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.customer = data.customer ? { name: data.customer.name } : null;
    this.payment = data.payment
      ? { method: data.payment.method, amountPaid: data.payment.amountPaid || 0, status: data.payment.status }
      : null;
  }
}

/**
 * DTO untuk laporan ringkasan shift
 * @class ShiftReportDto
 * @extends BaseDto
 */
class ShiftReportDto extends BaseDto {
  /**
   * @param {Object} data - Data laporan shift
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash || 0;
    this.endingCash = data.endingCash ?? null;
    this.expectedCash = data.expectedCash ?? null;
    this.cashSales = data.cashSales || 0;
    this.cashIn = data.cashIn || 0;
    this.cashOut = data.cashOut || 0;
    this.discrepancy = data.discrepancy || 0;
    this.totalExpenses = data.totalExpenses || 0;
    this.netSales = data.netSales || 0;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt ?? null;
    this.paymentBreakdown = data.paymentBreakdown?.map((p) => new PaymentBreakdownDto(p)) ?? [];
    this.cashier = data.cashier ? { id: data.cashier.id, fullName: data.cashier.fullName } : null;
    this.orders = data.orders?.map((o) => new ShiftReportOrderDto(o)) ?? [];
  }
}

/**
 * DTO untuk laporan penjualan per produk
 * @class ProductSalesDto
 * @extends BaseDto
 */
class ProductSalesDto extends BaseDto {
  /**
   * @param {Object} data - Data penjualan produk
   */
  constructor(data) {
    super();
    this.productId = data.productId;
    this.productName = data.productName;
    this.sku = data.sku;
    this.type = data.type;
    this.image = data.image || null;
    this.quantitySold = data.quantitySold || 0;
    this.totalRevenue = data.totalRevenue || 0;
    this.totalCost = data.totalCost || 0;
    this.profit = data.profit || 0;
  }
}

/**
 * DTO untuk laporan performa mekanik
 * @class MechanicPerformanceDto
 * @extends BaseDto
 */
class MechanicPerformanceDto extends BaseDto {
  /**
   * @param {Object} data - Data performa mekanik
   */
  constructor(data) {
    super();
    this.mechanicId = data.mechanicId;
    this.mechanicName = data.mechanicName;
    this.email = data.email;
    this.totalTasks = data.totalTasks || 0;
    this.completedTasks = data.completedTasks || 0;
    this.pendingTasks = data.pendingTasks || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.averagePerTask = data.averagePerTask || 0;
    this.completionRate = data.completionRate || 0;
  }
}

/**
 * DTO untuk ringkasan dashboard (Superadmin/Admin)
 * @class DashboardSummaryDto
 * @extends BaseDto
 */
class DashboardSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard
   */
  constructor(data) {
    super();
    this.today = data.today
      ? { date: data.today.date, orders: data.today.orders || 0, revenue: data.today.revenue || 0, averageOrderValue: data.today.averageOrderValue || 0 }
      : null;

    this.thisMonth = data.thisMonth
      ? { orders: data.thisMonth.orders || 0, revenue: data.thisMonth.revenue || 0 }
      : null;

    this.pending = data.pending
      ? { orders: data.pending.orders || 0 }
      : null;

    this.activeShift = data.activeShift
      ? {
          id: data.activeShift.id,
          cashier: data.activeShift.cashier?.fullName || null,
          openedAt: data.activeShift.openedAt,
          startingCash: data.activeShift.startingCash || 0,
          currentCashSales: data.activeShift.cashSales || 0,
          orderCount: data.activeShift._count?.orders || 0,
        }
      : null;

    this.inventory = data.inventory
      ? {
          totalProducts: data.inventory.totalProducts || 0,
          activeProducts: data.inventory.activeProducts || 0,
          lowStockCount: data.inventory.lowStockCount || 0,
          totalStockValue: data.inventory.totalStockValue || 0,
          lowStockProducts: data.inventory.lowStockProducts || [],
        }
      : null;
  }
}

/**
 * DTO untuk dashboard kasir
 * @class CashierDashboardDto
 * @extends BaseDto
 */
class CashierDashboardDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard kasir
   */
  constructor(data) {
    super();
    this.activeShift = data.activeShift
      ? {
          id: data.activeShift.id,
          openedAt: data.activeShift.openedAt,
          startingCash: data.activeShift.startingCash || 0,
          currentCashSales: data.activeShift.cashSales || 0,
          orderCount: data.activeShift._count?.orders || 0,
        }
      : null;

    this.todaySales = data.todaySales
      ? {
          todayOrders: data.todaySales.todayOrders || 0,
          todaySales: data.todaySales.todaySales || 0,
          pendingOrders: data.todaySales.pendingOrders || 0,
        }
      : null;

    this.recentOrders = data.recentOrders || [];
  }
}

/**
 * DTO untuk dashboard mekanik
 * @class MechanicDashboardDto
 * @extends BaseDto
 */
class MechanicDashboardDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard mekanik
   */
  constructor(data) {
    super();
    this.todayTasks = {
      pending: data.todayTasks?.pending ?? 0,
      completed: data.todayTasks?.completed ?? 0,
      earnings: data.todayTasks?.earnings ?? 0,
    };

    this.overallStats = {
      totalTasks: data.overallStats?.total ?? 0,
      completedTasks: data.overallStats?.completed ?? 0,
      pendingTasks: data.overallStats?.pending ?? 0,
    };

    this.pendingTasks = data.pendingTasks || [];
  }
}

/**
 * DTO untuk laporan ringkasan pembayaran
 * @class PaymentReportDto
 * @extends BaseDto
 */
class PaymentReportDto extends BaseDto {
  /**
   * @param {Object} data - Data pembayaran
   */
  constructor(data) {
    super();
    this.totalAmount = data.totalAmount || 0;
    this.totalCount = data.totalCount || 0;
    this.byMethod = data.byMethod ?? [];
    this.byStatus = data.byStatus ?? [];
  }
}

/**
 * DTO untuk ringkasan pergerakan stok
 * @class MovementSummaryDto
 * @extends BaseDto
 */
class MovementSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data pergerakan stok
   */
  constructor(data) {
    super();
    this.in = data.IN ?? 0;
    this.out = data.OUT ?? 0;
    this.adjustment = data.ADJUSTMENT ?? 0;
    this.netChange = data.netChange ?? 0;
  }
}

/**
 * DTO untuk validasi konsistensi stok
 * @class StockConsistencyDto
 * @extends BaseDto
 */
class StockConsistencyDto extends BaseDto {
  /**
   * @param {Object} data - Data konsistensi stok
   */
  constructor(data) {
    super();
    this.current = data.current || 0;
    this.calculated = data.calculated || 0;
    this.difference = data.difference || 0;
    this.isConsistent = data.isConsistent ?? false;
  }
}

/**
 * DTO untuk statistik task per order
 * @class TaskStatsDto
 * @extends BaseDto
 */
class TaskStatsDto extends BaseDto {
  /**
   * @param {Object} data - Data statistik task
   */
  constructor(data) {
    super();
    this.total = data.total || 0;
    this.assigned = data.assigned || 0;
    this.unassigned = data.unassigned || 0;
    this.tasks = data.tasks ?? [];
  }
}

/**
 * DTO untuk statistik tugas mekanik
 * @class MechanicTaskStatsDto
 * @extends BaseDto
 */
class MechanicTaskStatsDto extends BaseDto {
  /**
   * @param {Object} data - Data statistik mekanik
   */
  constructor(data) {
    super();
    this.pending = data.pending ?? 0;
    this.completed = data.completed ?? 0;
    this.total = data.total ?? 0;
  }
}

/**
 * DTO untuk pendapatan mekanik
 * @class MechanicEarningsDto
 * @extends BaseDto
 */
class MechanicEarningsDto extends BaseDto {
  /**
   * @param {Object} data - Data pendapatan mekanik
   */
  constructor(data) {
    super();
    this.totalEarnings = data.totalEarnings || 0;
    this.taskCount = data.taskCount || 0;
    this.averagePerTask = data.averagePerTask || 0;
  }
}

/**
 * DTO untuk pengeluaran per kategori
 * @class ExpenseByCategoryDto
 * @extends BaseDto
 */
class ExpenseByCategoryDto extends BaseDto {
  /**
   * @param {Object} data - Data pengeluaran
   */
  constructor(data) {
    super();
    this.category = data.category;
    this.total = data.total || 0;
    this.count = data.count || 0;
  }
}

export {
  SalesDataDto,
  DailySalesDto,
  ProfitLossDto,
  InventoryItemDto,
  InventorySnapshotDto,
  PaymentBreakdownDto,
  ShiftReportOrderDto,
  ShiftReportDto,
  ProductSalesDto,
  MechanicPerformanceDto,
  DashboardSummaryDto,
  CashierDashboardDto,
  MechanicDashboardDto,
  PaymentReportDto,
  MovementSummaryDto,
  StockConsistencyDto,
  TaskStatsDto,
  MechanicTaskStatsDto,
  MechanicEarningsDto,
  ExpenseByCategoryDto,
};