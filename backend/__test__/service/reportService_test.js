import ReportService from "#service/reportService.js";

jest.mock("#repository/reportRepository.js");

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

jest.mock("#app/database.js", () => ({
  order: { findMany: jest.fn() },
  mechanicAssignment: { findMany: jest.fn() },
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

/**
 * Unit test untuk ReportService
 * @describe ReportService
 */
describe("ReportService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportService();
  });

  /**
   * @describe getSalesSummary
   */
  describe("getSalesSummary", () => {
    /**
     * @test Mengembalikan ringkasan penjualan dengan breakdown harian
     */
    it("should return sales summary with daily breakdown", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getSalesData.mockResolvedValue({
        totalOrders: 50, totalSales: 25000000, totalSubtotal: 22500000, totalTax: 2500000,
      });
      ReportRepository.mock.instances[0].getDailySalesSummary.mockResolvedValue([
        { date: "2025-05-01", orderCount: 10, totalSales: 5000000, averageOrderValue: 500000 },
      ]);

      const result = await service.getSalesSummary({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-05-31"),
      });

      expect(result.summary.totalOrders).toBe(50);
      expect(result.dailyBreakdown).toHaveLength(1);
    });

    /**
     * @test Mengembalikan period null tanpa tanggal
     */
    it("should return null period without dates", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getSalesData.mockResolvedValue({
        totalOrders: 0, totalSales: 0, totalSubtotal: 0, totalTax: 0,
      });
      ReportRepository.mock.instances[0].getDailySalesSummary.mockResolvedValue([]);

      const result = await service.getSalesSummary({});
      expect(result.period).toEqual({ startDate: null, endDate: null });
    });
  });

  /**
   * @describe getProfitLossReport
   */
  describe("getProfitLossReport", () => {
    /**
     * @test Mengembalikan data laba rugi
     */
    it("should return profit loss data", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getProfitLossData.mockResolvedValue({
        grossRevenue: 50000000, totalCogs: 30000000, grossProfit: 20000000,
        grossMargin: 40, totalOperatingExpenses: 5000000, netProfit: 15000000, netMargin: 30,
      });

      const result = await service.getProfitLossReport({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-05-31"),
      });

      expect(result.grossRevenue).toBe(50000000);
    });
  });

  /**
   * @describe getShiftReport
   */
  describe("getShiftReport", () => {
    /**
     * @test Mengembalikan laporan shift dengan signed URLs
     */
    it("should return shift report with signed URLs", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getShiftSummary.mockResolvedValue({
        id: "shift-1",
        expenses: [
          { id: "exp1", receipt: { path: "receipts/r1.jpg" } },
          { id: "exp2", receipt: null },
        ],
      });

      const result = await service.getShiftReport("shift-1");
      expect(result.expenses[0].receipt.url).toBe("https://signed-url.com/image.jpg");
    });

    /**
     * @test Mengembalikan null ketika shift tidak ditemukan
     */
    it("should return null when shift not found", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getShiftSummary.mockResolvedValue(null);

      const result = await service.getShiftReport("shift-99");
      expect(result).toBeNull();
    });
  });

  /**
   * @describe getInventoryReport
   */
  describe("getInventoryReport", () => {
    /**
     * @test Mengembalikan snapshot inventori dengan signed URLs
     */
    it("should return inventory snapshot with signed URLs", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getInventorySnapshot.mockResolvedValue({
        totalAssetValue: 100000000,
        items: [
          { id: "p1", name: "Oli", stock: 10, image: "oli.jpg" },
          { id: "p2", name: "Filter", stock: 5, image: null },
        ],
      });

      const result = await service.getInventoryReport();
      expect(result.items[0].image).toBe("https://signed-url.com/image.jpg");
      expect(result.items[1].image).toBeNull();
    });
  });

  /**
   * @describe getTopProductsReport
   */
  describe("getTopProductsReport", () => {
    /**
     * @test Mengembalikan produk teratas dengan ringkasan
     */
    it("should return top products with summary", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getProductSalesReport.mockResolvedValue([
        { productId: "p1", productName: "Oli", quantitySold: 10, totalRevenue: 500000, profit: 200000, image: "oli.jpg" },
        { productId: "p2", productName: "Filter", quantitySold: 5, totalRevenue: 250000, profit: 100000, image: null },
      ]);

      const result = await service.getTopProductsReport({ limit: 10 });
      expect(result.products).toHaveLength(2);
      expect(result.summary.totalQuantity).toBe(15);
    });
  });

  /**
   * @describe getMechanicPerformanceReport
   */
  describe("getMechanicPerformanceReport", () => {
    /**
     * @test Mengembalikan performa mekanik dengan ringkasan
     */
    it("should return mechanic performance with summary", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getMechanicPerformanceReport.mockResolvedValue([
        { mechanicId: "m1", mechanicName: "Joko", totalTasks: 50, completedTasks: 45, totalEarnings: 5000000 },
        { mechanicId: "m2", mechanicName: "Budi", totalTasks: 30, completedTasks: 25, totalEarnings: 3500000 },
      ]);

      const result = await service.getMechanicPerformanceReport({});
      expect(result.mechanics).toHaveLength(2);
      expect(result.summary.totalEarnings).toBe(8500000);
    });
  });

  /**
   * @describe getDashboardSummary
   */
  describe("getDashboardSummary", () => {
    /**
     * @test Mengembalikan dashboard ADMIN
     */
    it("should return admin dashboard", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      const repo = ReportRepository.mock.instances[0];

      repo.getSalesData
        .mockResolvedValueOnce({ totalOrders: 5, totalSales: 1000000, totalSubtotal: 900000, totalTax: 100000 })
        .mockResolvedValueOnce({ totalOrders: 100, totalSales: 20000000, totalSubtotal: 18000000, totalTax: 2000000 });
      repo.getActiveShift.mockResolvedValue({
        id: "s1", cashier: { fullName: "Ani" }, openedAt: new Date(),
        startingCash: 1000000, cashSales: 5000000, _count: { orders: 25 },
      });
      repo.countOrdersByStatus.mockResolvedValue(8);
      repo.getProductSummary.mockResolvedValue({ totalProducts: 200, activeProducts: 180, totalStockValue: 50000000, totalStockQuantity: 1000 });
      repo.getLowStockProducts.mockResolvedValue([
        { id: "lp1", sku: "SKU1", name: "Ban", stock: 2, image: "ban.jpg" },
        { id: "lp2", sku: "SKU2", name: "Kampas", stock: 0, image: null },
      ]);

      const result = await service.getDashboardSummary("ADMIN");
      expect(result.today.revenue).toBe(1000000);
      expect(result.pending.orders).toBe(8);
    });

    /**
     * @test Mengembalikan dashboard CASHIER
     */
    it("should return cashier dashboard", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      const repo = ReportRepository.mock.instances[0];
      const { default: prisma } = require("#app/database.js");

      repo.getActiveShift.mockResolvedValue({
        id: "s1", openedAt: new Date(), startingCash: 1000000, cashSales: 3000000, _count: { orders: 15 },
      });
      repo.getCashierTodaySales.mockResolvedValue({ todayOrders: 5, todaySales: 2500000, pendingOrders: 2 });
      prisma.order.findMany.mockResolvedValue([
        { id: "o1", orderNumber: "ORD-001", total: 500000, status: "COMPLETED", createdAt: new Date(), customer: { name: "Budi" } },
      ]);

      const result = await service.getDashboardSummary("CASHIER", "cashier-1");
      expect(result.todaySales.todayOrders).toBe(5);
      expect(result.recentOrders).toHaveLength(1);
    });

    /**
     * @test Mengembalikan dashboard MECHANIC
     */
    it("should return mechanic dashboard", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      const repo = ReportRepository.mock.instances[0];
      const { default: prisma } = require("#app/database.js");

      repo.getMechanicTodayTasks.mockResolvedValue({ pending: 2, completed: 3, earnings: 150000 });
      repo.getMechanicTaskStats.mockResolvedValue({ totalTasks: 100, completedTasks: 80, pendingTasks: 20 });
      prisma.mechanicAssignment.findMany.mockResolvedValue([
        {
          id: "a1",
          orderItem: {
            id: "oi-1", productNameSnapshot: "Ganti Oli",
            order: { id: "o1", orderNumber: "ORD-001", status: "IN_PROGRESS", vehicle: { plateNumber: "B 1234 CD" } },
          },
        },
      ]);

      const result = await service.getDashboardSummary("MECHANIC", "mech-1");
      expect(result.todayTasks.earnings).toBe(150000);
      expect(result.pendingTasks).toHaveLength(1);
    });

    /**
     * @test Mengembalikan null untuk role tidak dikenal
     */
    it("should return null for unknown role", async () => {
      const result = await service.getDashboardSummary("UNKNOWN");
      expect(result).toBeNull();
    });
  });

  /**
   * @describe getExpenseReport
   */
  describe("getExpenseReport", () => {
    /**
     * @test Mengembalikan laporan pengeluaran
     */
    it("should return expense report", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].sumExpenses.mockResolvedValue(10000000);
      ReportRepository.mock.instances[0].getExpensesByCategory.mockResolvedValue([
        { category: "SUPPLIES", total: 5000000, count: 10 },
      ]);

      const result = await service.getExpenseReport({});
      expect(result.totalExpense).toBe(10000000);
    });
  });

  /**
   * @describe getPaymentReport
   */
  describe("getPaymentReport", () => {
    /**
     * @test Mengembalikan laporan pembayaran
     */
    it("should return payment report", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getPaymentSummary.mockResolvedValue({
        totalAmount: 50000000, totalCount: 100,
        byMethod: [{ method: "CASH", amount: 30000000, count: 60 }],
        byStatus: [{ status: "PAID", amount: 50000000, count: 100 }],
      });

      const result = await service.getPaymentReport({});
      expect(result.totalAmount).toBe(50000000);
    });
  });

  /**
   * @describe getStockMovementReport
   */
  describe("getStockMovementReport", () => {
    /**
     * @test Mengembalikan laporan pergerakan stok
     */
    it("should return stock movement report", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getMovementSummaryByDateRange.mockResolvedValue({
        IN: 100, OUT: 45, ADJUSTMENT: 0, netChange: 55,
      });
      ReportRepository.mock.instances[0].validateStockConsistency.mockResolvedValue({
        current: 55, calculated: 55, difference: 0, isConsistent: true,
      });

      const result = await service.getStockMovementReport("prod-1", {});
      expect(result.movement.netChange).toBe(55);
      expect(result.consistency.isConsistent).toBe(true);
    });
  });

  /**
   * @describe getTaskStatsByOrder
   */
  describe("getTaskStatsByOrder", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getTaskStatsByOrder.mockResolvedValue({
        total: 5, assigned: 3, unassigned: 2, tasks: [],
      });

      const result = await service.getTaskStatsByOrder("order-1");
      expect(result.total).toBe(5);
    });
  });

  /**
   * @describe getMechanicTaskStats
   */
  describe("getMechanicTaskStats", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getMechanicTaskStats.mockResolvedValue({
        totalTasks: 100, completedTasks: 80, pendingTasks: 20,
      });

      const result = await service.getMechanicTaskStats("mech-1");
      expect(result.totalTasks).toBe(100);
    });
  });

  /**
   * @describe getMechanicEarnings
   */
  describe("getMechanicEarnings", () => {
    /**
     * @test Mengembalikan data pendapatan mekanik
     */
    it("should return mechanic earnings", async () => {
      const { ReportRepository } = require("#repository/reportRepository.js");
      ReportRepository.mock.instances[0].getTotalEarningsByMechanic.mockResolvedValue({
        totalEarnings: 10000000, taskCount: 50, averagePerTask: 200000,
      });

      const result = await service.getMechanicEarnings("mech-1", {});
      expect(result.totalEarnings).toBe(10000000);
    });
  });
});