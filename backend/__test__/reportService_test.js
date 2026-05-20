// __test__/reportService_test.js
import ReportService from "#service/reportService.js";
import ReportRepository from "#repository/reportRepository.js";
import prisma from "#app/database.js";

// Mock repository
jest.mock("#repository/reportRepository.js");

// Mock Storage utility (for signed URLs)
jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

// Mock prisma client
jest.mock("#app/database.js", () => ({
  order: {
    findMany: jest.fn(),
    count: jest.fn(),   // used by countOrdersByStatus? Not directly, but service uses countOrdersByStatus repo, so we don't need prisma.order.count here.
  },
  mechanicAssignment: {
    findMany: jest.fn(),
  },
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe("ReportService", () => {
  let service;
  let mockReportRepo;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportService();

    // Get mock repository instance
    mockReportRepo = ReportRepository.mock.instances[0];

    mockStorage = require("#shared/utils/storage.js");
  });

  // ============================================================
  // getSalesSummary
  // ============================================================
  describe("getSalesSummary", () => {
    it("should return sales summary with daily breakdown", async () => {
      const salesData = {
        totalOrders: 50,
        totalSales: 25000000,
        totalSubtotal: 22500000,
        totalTax: 2500000,
      };
      const dailySales = [
        { date: "2025-05-01", orderCount: 10, totalSales: 5000000 },
      ];

      mockReportRepo.getSalesData.mockResolvedValue(salesData);
      mockReportRepo.getDailySalesSummary.mockResolvedValue(dailySales);

      const result = await service.getSalesSummary({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-05-31"),
      });

      expect(result).toEqual({
        period: {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
        summary: salesData,
        dailyBreakdown: dailySales,
      });
      expect(mockReportRepo.getSalesData).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
      expect(mockReportRepo.getDailySalesSummary).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });

    it("should return null period when no dates are provided", async () => {
      mockReportRepo.getSalesData.mockResolvedValue({ totalOrders: 0, totalSales: 0 });
      mockReportRepo.getDailySalesSummary.mockResolvedValue([]);

      const result = await service.getSalesSummary({});
      expect(result.period).toEqual({ startDate: null, endDate: null });
    });
  });

  // ============================================================
  // getProfitLossReport
  // ============================================================
  describe("getProfitLossReport", () => {
    it("should return profit loss data with period", async () => {
      const profitLossData = {
        grossRevenue: 50000000,
        totalCogs: 30000000,
        grossProfit: 20000000,
        grossMargin: 40,
        totalOperatingExpenses: 5000000,
        netProfit: 15000000,
        netMargin: 30,
      };
      mockReportRepo.getProfitLossData.mockResolvedValue(profitLossData);

      const range = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-05-31"),
      };
      const result = await service.getProfitLossReport(range);

      expect(result).toEqual({
        period: range,
        ...profitLossData,
      });
    });
  });

  // ============================================================
  // getShiftReport
  // ============================================================
  describe("getShiftReport", () => {
    it("should return shift report and add signed URLs for expense receipts", async () => {
      const shiftReport = {
        id: "shift-1",
        expenses: [
          { id: "exp1", receipt: { path: "receipts/r1.jpg" } },
          { id: "exp2", receipt: null },
        ],
      };
      mockReportRepo.getShiftSummary.mockResolvedValue(shiftReport);

      const result = await service.getShiftReport("shift-1");

      expect(result).toBeDefined();
      expect(result.expenses[0].receipt.url).toBe("https://signed-url.com/image.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("receipts/r1.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it("should return null when shift not found", async () => {
      mockReportRepo.getShiftSummary.mockResolvedValue(null);
      const result = await service.getShiftReport("shift-99");
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // getInventoryReport
  // ============================================================
  describe("getInventoryReport", () => {
    it("should return inventory snapshot and add signed URLs for item images", async () => {
      const snapshot = {
        totalAssetValue: 100000000,
        items: [
          { id: "p1", name: "Oli", stock: 10, image: "oli.jpg" },
          { id: "p2", name: "Filter", stock: 5, image: "filter.jpg" },
        ],
      };
      mockReportRepo.getInventorySnapshot.mockResolvedValue(snapshot);

      const result = await service.getInventoryReport();

      expect(result.totalAssetValue).toBe(100000000);
      expect(result.items[0].image).toBe("https://signed-url.com/image.jpg");
      expect(result.items[1].image).toBe("https://signed-url.com/image.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledTimes(2);
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("oli.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("filter.jpg");
    });
  });

  // ============================================================
  // getTopProductsReport
  // ============================================================
  describe("getTopProductsReport", () => {
    it("should return top products with signed URLs and aggregated summary", async () => {
      const products = [
        {
          productId: "p1",
          productName: "Oli",
          quantitySold: 10,
          totalRevenue: 500000,
          profit: 200000,
          image: "oli.jpg",
        },
        {
          productId: "p2",
          productName: "Filter",
          quantitySold: 5,
          totalRevenue: 250000,
          profit: 100000,
          image: null,
        },
      ];
      mockReportRepo.getProductSalesReport.mockResolvedValue(products);

      const result = await service.getTopProductsReport({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        limit: 10,
      });

      expect(result.period).toEqual({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
      expect(result.products).toHaveLength(2);
      expect(result.products[0].image).toBe("https://signed-url.com/image.jpg");
      expect(result.products[1].image).toBeNull();
      expect(result.summary).toEqual({
        totalQuantity: 15,
        totalRevenue: 750000,
        totalProfit: 300000,
        productCount: 2,
      });
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("oli.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledTimes(1); // only one with image
    });
  });

  // ============================================================
  // getMechanicPerformanceReport
  // ============================================================
  describe("getMechanicPerformanceReport", () => {
    it("should return mechanic performance with aggregated summary", async () => {
      const mechanics = [
        {
          mechanicId: "m1",
          mechanicName: "Joko",
          totalTasks: 50,
          completedTasks: 45,
          totalEarnings: 5000000,
        },
        {
          mechanicId: "m2",
          mechanicName: "Budi",
          totalTasks: 30,
          completedTasks: 25,
          totalEarnings: 3500000,
        },
      ];
      mockReportRepo.getMechanicPerformanceReport.mockResolvedValue(mechanics);

      const result = await service.getMechanicPerformanceReport({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      });

      expect(result.mechanics).toEqual(mechanics);
      expect(result.summary).toEqual({
        totalMechanics: 2,
        totalTasks: 80,
        totalCompleted: 70,
        totalEarnings: 8500000,
        averageCompletionRate: (70 / 80) * 100,
      });
    });
  });

  // ============================================================
  // getDashboardSummary
  // ============================================================
  describe("getDashboardSummary", () => {
    it("should return admin dashboard summary for SUPERADMIN role", async () => {
      const todaySales = { totalOrders: 5, totalSales: 1000000 };
      const monthSales = { totalOrders: 100, totalSales: 20000000 };
      const activeShift = {
        id: "s1",
        cashier: { fullName: "Ani" },
        openedAt: new Date(),
        startingCash: 1000000,
        cashSales: 5000000,
        _count: { orders: 25 },
      };
      const pendingCount = 8;
      const productSummary = { totalProducts: 200, activeProducts: 180, totalStockValue: 50000000 };
      const lowStockProducts = [
        { id: "lp1", sku: "SKU1", name: "Ban", stock: 2, image: "ban.jpg" },
        { id: "lp2", sku: "SKU2", name: "Kampas", stock: 0, image: null },
      ];

      mockReportRepo.getSalesData
        .mockResolvedValueOnce(todaySales)   // for today
        .mockResolvedValueOnce(monthSales);  // for this month
      mockReportRepo.getActiveShift.mockResolvedValue(activeShift);
      mockReportRepo.countOrdersByStatus.mockResolvedValue(pendingCount);
      mockReportRepo.getProductSummary.mockResolvedValue(productSummary);
      mockReportRepo.getLowStockProducts.mockResolvedValue(lowStockProducts);

      const result = await service.getDashboardSummary("SUPERADMIN");

      expect(result.today).toBeDefined();
      expect(result.today.revenue).toBe(1000000);
      expect(result.thisMonth.revenue).toBe(20000000);
      expect(result.activeShift.id).toBe("s1");
      expect(result.inventory.lowStockCount).toBe(2);
      expect(result.inventory.lowStockProducts[0].image).toBe("https://signed-url.com/image.jpg");
      expect(result.inventory.lowStockProducts[1].image).toBeNull();
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("ban.jpg");
    });

    it("should return cashier dashboard summary", async () => {
      const cashierId = "cashier-1";
      const activeShift = {
        id: "s1",
        openedAt: new Date(),
        startingCash: 1000000,
        cashSales: 3000000,
        _count: { orders: 15 },
      };
      const todaySales = { todayOrders: 5, todaySales: 2500000, pendingOrders: 2 };
      const recentOrders = [{ id: "o1", orderNumber: "ORD-001", total: 500000 }];
      mockReportRepo.getActiveShift.mockResolvedValue(activeShift);
      mockReportRepo.getCashierTodaySales.mockResolvedValue(todaySales);
      prisma.order.findMany.mockResolvedValue(recentOrders);

      const result = await service.getDashboardSummary("CASHIER", cashierId);

      expect(result.activeShift.id).toBe("s1");
      expect(result.todaySales.todayOrders).toBe(5);
      expect(result.recentOrders).toHaveLength(1);
    });

    it("should return mechanic dashboard summary", async () => {
      const mechanicId = "mech-1";
      const todayTasks = { pending: 2, completed: 3, earnings: 150000 };
      const overallStats = { totalTasks: 100, completedTasks: 80, pendingTasks: 20 };
      const pendingAssignments = [
        {
          id: "a1",
          orderItem: {
            id: "oi-1",
            productNameSnapshot: "Ganti Oli",
            order: {
              id: "o1",
              orderNumber: "ORD-001",
              status: "IN_PROGRESS",
              vehicle: { plateNumber: "B 1234 CD" },
            },
          },
        },
      ];

      mockReportRepo.getMechanicTodayTasks.mockResolvedValue(todayTasks);
      mockReportRepo.getMechanicTaskStats.mockResolvedValue(overallStats);
      prisma.mechanicAssignment.findMany.mockResolvedValue(pendingAssignments);

      const result = await service.getDashboardSummary("MECHANIC", mechanicId);

      expect(result.todayTasks.earnings).toBe(150000);
      expect(result.overallStats.completed).toBe(80);
      expect(result.pendingTasks).toHaveLength(1);
      expect(result.pendingTasks[0].serviceName).toBe("Ganti Oli");
    });
  });

  // ============================================================
  // getExpenseReport
  // ============================================================
  describe("getExpenseReport", () => {
    it("should return total expenses and breakdown by category", async () => {
      mockReportRepo.sumExpenses.mockResolvedValue(10000000);
      const categories = [
        { category: "ATK", total: 5000000 },
        { category: "Listrik", total: 5000000 },
      ];
      mockReportRepo.getExpensesByCategory.mockResolvedValue(categories);

      const range = { startDate: new Date("2025-01-01"), endDate: new Date("2025-05-31") };
      const result = await service.getExpenseReport(range);

      expect(result.totalExpense).toBe(10000000);
      expect(result.expensesByCategory).toEqual(categories);
    });
  });

  // ============================================================
  // getPaymentReport
  // ============================================================
  describe("getPaymentReport", () => {
    it("should return payment summary with period", async () => {
      const paymentSummary = {
        totalAmount: 50000000,
        totalCount: 100,
        byMethod: [{ method: "CASH", total: 30000000 }],
        byStatus: [{ status: "COMPLETED", total: 50000000 }],
      };
      mockReportRepo.getPaymentSummary.mockResolvedValue(paymentSummary);

      const range = { startDate: new Date("2025-01-01"), endDate: new Date("2025-05-31") };
      const result = await service.getPaymentReport(range);

      expect(result.totalAmount).toBe(50000000);
      expect(result.byMethod).toEqual(paymentSummary.byMethod);
    });
  });

  // ============================================================
  // getStockMovementReport
  // ============================================================
  describe("getStockMovementReport", () => {
    it("should return movement summary and consistency check", async () => {
      const movementSummary = { totalIn: 100, totalOut: 45, netChange: 55 };
      const consistency = { isConsistent: true };
      mockReportRepo.getMovementSummaryByDateRange.mockResolvedValue(movementSummary);
      mockReportRepo.validateStockConsistency.mockResolvedValue(consistency);

      const result = await service.getStockMovementReport("prod-1", {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-05-31"),
      });

      expect(result.productId).toBe("prod-1");
      expect(result.movement).toEqual(movementSummary);
      expect(result.consistency).toEqual(consistency);
    });
  });

  // ============================================================
  // getTaskStatsByOrder
  // ============================================================
  describe("getTaskStatsByOrder", () => {
    it("should delegate to repository", async () => {
      const stats = { total: 5, assigned: 3, unassigned: 2, tasks: [] };
      mockReportRepo.getTaskStatsByOrder.mockResolvedValue(stats);

      const result = await service.getTaskStatsByOrder("order-1");
      expect(result).toEqual(stats);
      expect(mockReportRepo.getTaskStatsByOrder).toHaveBeenCalledWith("order-1");
    });
  });

  // ============================================================
  // getMechanicTaskStats
  // ============================================================
  describe("getMechanicTaskStats", () => {
    it("should delegate to repository", async () => {
      const stats = { totalTasks: 100, completedTasks: 80, pendingTasks: 20 };
      mockReportRepo.getMechanicTaskStats.mockResolvedValue(stats);

      const result = await service.getMechanicTaskStats("mech-1");
      expect(result).toEqual(stats);
    });
  });

  // ============================================================
  // getMechanicEarnings
  // ============================================================
  describe("getMechanicEarnings", () => {
    it("should return earnings data with period and mechanicId", async () => {
      const earnings = { totalEarnings: 10000000, taskCount: 50, averagePerTask: 200000 };
      mockReportRepo.getTotalEarningsByMechanic.mockResolvedValue(earnings);

      const range = { startDate: new Date("2025-01-01"), endDate: new Date("2025-05-31") };
      const result = await service.getMechanicEarnings("mech-1", range);

      expect(result).toEqual({
        mechanicId: "mech-1",
        period: { startDate: range.startDate, endDate: range.endDate },
        ...earnings,
      });
    });

    it("should default period to null when no range provided", async () => {
      mockReportRepo.getTotalEarningsByMechanic.mockResolvedValue({ totalEarnings: 0, taskCount: 0, averagePerTask: 0 });
      const result = await service.getMechanicEarnings("mech-1");

      expect(result.period).toEqual({ startDate: null, endDate: null });
    });
  });
});