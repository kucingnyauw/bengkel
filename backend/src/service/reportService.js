import ReportRepository from "#repository/reportRepository.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis laporan
 * @class ReportService
 */
class ReportService {
  constructor() {
    this.reportRepo = new ReportRepository();
  }

  /**
   * Menambahkan signed URL ke image path
   * @param {string|null} path - Image path
   * @returns {Promise<string|null>} Signed URL atau null
   * @private
   */
  async #getSignedUrl(path) {
    if (!path) return null;
    return Storage.getSignedUrl(path);
  }

  /**
   * Mendapatkan ringkasan penjualan
   * @param {Object} [range={}] - Rentang waktu
   * @param {Date} [range.startDate]
   * @param {Date} [range.endDate]
   * @returns {Promise<Object>} Ringkasan penjualan
   */
  async getSalesSummary(range = {}) {
    const { startDate, endDate } = range;
    const salesData = await this.reportRepo.getSalesData({ startDate, endDate });
    const dailySales = await this.reportRepo.getDailySalesSummary({ startDate, endDate });

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      summary: salesData,
      dailyBreakdown: dailySales,
    };
  }

  /**
   * Mendapatkan laporan laba rugi
   * @param {Object} [range={}] - Rentang waktu
   * @returns {Promise<Object>} Laporan laba rugi
   */
  async getProfitLossReport(range = {}) {
    const { startDate, endDate } = range;
    const profitLossData = await this.reportRepo.getProfitLossData({ startDate, endDate });

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      ...profitLossData,
    };
  }

  /**
   * Mendapatkan laporan shift
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>} Laporan shift
   */
  async getShiftReport(shiftId) {
    const report = await this.reportRepo.getShiftSummary(shiftId);
    if (!report) return null;

    for (const expense of report.expenses || []) {
      if (expense.receipt?.path) {
        expense.receipt.url = await this.#getSignedUrl(expense.receipt.path);
      }
    }

    return report;
  }

  /**
   * Mendapatkan laporan inventori
   * @returns {Promise<Object>} Laporan inventori
   */
  async getInventoryReport() {
    const snapshot = await this.reportRepo.getInventorySnapshot();

    for (const item of snapshot.items) {
      if (item.image) {
        item.image = await this.#getSignedUrl(item.image);
      }
    }

    return snapshot;
  }

  /**
   * Mendapatkan laporan produk terlaris
   * @param {Object} params - Parameter
   * @param {Date} [params.startDate]
   * @param {Date} [params.endDate]
   * @param {number} [params.limit=10]
   * @returns {Promise<Object>} Laporan produk terlaris
   */
  async getTopProductsReport({ startDate, endDate, limit = 10 }) {
    const products = await this.reportRepo.getProductSalesReport({ startDate, endDate }, limit);

    for (const product of products) {
      if (product.image) {
        product.image = await this.#getSignedUrl(product.image);
      }
    }

    const totalQuantity = products.reduce((sum, p) => sum + p.quantitySold, 0);
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      summary: { totalQuantity, totalRevenue, totalProfit, productCount: products.length },
      products,
    };
  }

  /**
   * Mendapatkan laporan performa mekanik
   * @param {Object} [range={}] - Rentang waktu
   * @returns {Promise<Object>} Laporan performa mekanik
   */
  async getMechanicPerformanceReport(range = {}) {
    const { startDate, endDate } = range;
    const mechanics = await this.reportRepo.getMechanicPerformanceReport({ startDate, endDate });

    const totalTasks = mechanics.reduce((sum, m) => sum + m.totalTasks, 0);
    const totalCompleted = mechanics.reduce((sum, m) => sum + m.completedTasks, 0);
    const totalEarnings = mechanics.reduce((sum, m) => sum + m.totalEarnings, 0);

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      summary: {
        totalMechanics: mechanics.length,
        totalTasks,
        totalCompleted,
        totalEarnings,
        averageCompletionRate: totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0,
      },
      mechanics,
    };
  }

  /**
   * Mendapatkan ringkasan dashboard berdasarkan role
   * @param {string} role - Role user
   * @param {string} [userId] - ID user
   * @returns {Promise<Object>} Ringkasan dashboard
   */
  async getDashboardSummary(role, userId = null) {
    logger.info("Mengambil ringkasan dashboard", { role, userId });

    switch (role) {
      case "CASHIER":
        return await this._getCashierDashboard(userId);
      case "MECHANIC":
        return await this._getMechanicDashboard(userId);
      case "SUPERADMIN":
      case "ADMIN":
      default:
        return await this._getAdminDashboard();
    }
  }

  /**
   * Dashboard untuk Superadmin/Admin
   * @returns {Promise<Object>}
   * @private
   */
  async _getAdminDashboard() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todaySales, monthSales, activeShift, pendingCount, productSummary, lowStockProducts] = await Promise.all([
      this.reportRepo.getSalesData({ startDate: startOfDay, endDate: endOfDay }),
      this.reportRepo.getSalesData({ startDate: startOfMonth, endDate: endOfDay }),
      this.reportRepo.getActiveShift(),
      this.reportRepo.countOrdersByStatus(["DRAFT", "QUEUED", "IN_PROGRESS"]),
      this.reportRepo.getProductSummary(),
      this.reportRepo.getLowStockProducts(5),
    ]);

    const lowStockWithImages = await Promise.all(
      lowStockProducts.slice(0, 5).map(async (p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        image: await this.#getSignedUrl(p.image),
      }))
    );

    return {
      today: {
        date: startOfDay.toISOString(),
        orders: todaySales.totalOrders,
        revenue: todaySales.totalSales,
        averageOrderValue: todaySales.totalOrders > 0 ? todaySales.totalSales / todaySales.totalOrders : 0,
      },
      thisMonth: { orders: monthSales.totalOrders, revenue: monthSales.totalSales },
      pending: { orders: pendingCount },
      activeShift: activeShift
        ? {
            id: activeShift.id,
            cashier: activeShift.cashier?.fullName || null,
            openedAt: activeShift.openedAt,
            startingCash: activeShift.startingCash,
            currentCashSales: activeShift.cashSales,
            orderCount: activeShift._count?.orders || 0,
          }
        : null,
      inventory: {
        totalProducts: productSummary.totalProducts,
        activeProducts: productSummary.activeProducts,
        lowStockCount: lowStockProducts.length,
        totalStockValue: productSummary.totalStockValue,
        lowStockProducts: lowStockWithImages,
      },
    };
  }

  /**
   * Dashboard untuk Kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>}
   * @private
   */
  async _getCashierDashboard(cashierId) {
    const [activeShift, todaySales] = await Promise.all([
      this.reportRepo.getActiveShift(),
      this.reportRepo.getCashierTodaySales(cashierId),
    ]);

    const recentOrders = await prisma.order.findMany({
      where: { cashierId, deletedAt: null },
      select: {
        id: true, orderNumber: true, total: true, status: true, createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      activeShift: activeShift
        ? {
            id: activeShift.id,
            openedAt: activeShift.openedAt,
            startingCash: activeShift.startingCash,
            currentCashSales: activeShift.cashSales,
            orderCount: activeShift._count?.orders || 0,
          }
        : null,
      todaySales: {
        todayOrders: todaySales.todayOrders,
        todaySales: todaySales.todaySales,
        pendingOrders: todaySales.pendingOrders,
      },
      recentOrders,
    };
  }

  /**
   * Dashboard untuk Mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   * @private
   */
  async _getMechanicDashboard(mechanicId) {
    const [todayTasks, overallStats, pendingAssignments] = await Promise.all([
      this.reportRepo.getMechanicTodayTasks(mechanicId),
      this.reportRepo.getMechanicTaskStats(mechanicId),
      prisma.mechanicAssignment.findMany({
        where: {
          mechanicId,
          endAt: null,
          orderItem: { order: { status: { in: ["QUEUED", "IN_PROGRESS"] }, deletedAt: null } },
        },
        select: {
          id: true,
          orderItem: {
            select: {
              id: true, productNameSnapshot: true,
              order: {
                select: {
                  id: true, orderNumber: true, status: true,
                  vehicle: { select: { plateNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);

    return {
      todayTasks: {
        pending: todayTasks.pending,
        completed: todayTasks.completed,
        earnings: todayTasks.earnings,
      },
      overallStats: {
        total: overallStats.totalTasks,
        completed: overallStats.completedTasks,
        pending: overallStats.pendingTasks,
      },
      pendingTasks: pendingAssignments.map((a) => ({
        assignmentId: a.id,
        orderItemId: a.orderItem?.id,
        serviceName: a.orderItem?.productNameSnapshot,
        orderId: a.orderItem?.order?.id,
        orderNumber: a.orderItem?.order?.orderNumber,
        status: a.orderItem?.order?.status,
        plateNumber: a.orderItem?.order?.vehicle?.plateNumber,
      })),
    };
  }

  /**
   * Mendapatkan laporan pengeluaran
   * @param {Object} [range={}] - Rentang waktu
   * @returns {Promise<Object>} Laporan pengeluaran
   */
  async getExpenseReport(range = {}) {
    const { startDate, endDate } = range;
    const [totalExpense, expensesByCategory] = await Promise.all([
      this.reportRepo.sumExpenses({ startDate, endDate }),
      this.reportRepo.getExpensesByCategory({ startDate, endDate }),
    ]);

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      totalExpense,
      expensesByCategory,
    };
  }

  /**
   * Mendapatkan laporan pembayaran
   * @param {Object} [range={}] - Rentang waktu
   * @returns {Promise<Object>} Laporan pembayaran
   */
  async getPaymentReport(range = {}) {
    const { startDate, endDate } = range;
    const paymentSummary = await this.reportRepo.getPaymentSummary({ startDate, endDate });

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      ...paymentSummary,
    };
  }

  /**
   * Mendapatkan laporan pergerakan stok
   * @param {string} productId - ID produk
   * @param {Object} range - Rentang waktu
   * @param {Date} range.startDate
   * @param {Date} range.endDate
   * @returns {Promise<Object>} Laporan pergerakan stok
   */
  async getStockMovementReport(productId, { startDate, endDate }) {
    const movementSummary = await this.reportRepo.getMovementSummaryByDateRange(productId, startDate, endDate);
    const stockConsistency = await this.reportRepo.validateStockConsistency(productId);

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      productId,
      movement: movementSummary,
      consistency: stockConsistency,
    };
  }

  /**
   * Mendapatkan statistik task per order
   * @param {string} orderId - ID order
   * @returns {Promise<Object>} Statistik task
   */
  async getTaskStatsByOrder(orderId) {
    return this.reportRepo.getTaskStatsByOrder(orderId);
  }

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>} Statistik tugas
   */
  async getMechanicTaskStats(mechanicId) {
    return this.reportRepo.getMechanicTaskStats(mechanicId);
  }

  /**
   * Mendapatkan total pendapatan mekanik
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [range={}] - Rentang waktu
   * @returns {Promise<Object>} Pendapatan mekanik
   */
  async getMechanicEarnings(mechanicId, range = {}) {
    const earnings = await this.reportRepo.getTotalEarningsByMechanic(mechanicId, range);

    return {
      mechanicId,
      period: { startDate: range.startDate || null, endDate: range.endDate || null },
      ...earnings,
    };
  }
}

export default ReportService;