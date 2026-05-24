import prisma from "#app/database.js";
import ReportRepository from "#repository/reportRepository.js";

jest.mock("#app/database.js", () => ({
  order: {
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  orderItem: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  expense: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  shift: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  mechanicAssignment: {
    count: jest.fn(),
  },
  stockMovement: {
    groupBy: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
}));

/**
 * Unit test untuk ReportRepository
 * @describe ReportRepository
 */
describe("ReportRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ReportRepository();
  });

  /**
   * @describe _buildDateFilter
   */
  describe("_buildDateFilter", () => {
    /**
     * @test Mengembalikan objek kosong jika range tidak diberikan
     */
    it("should return empty object when no range provided", () => {
      const result = repo._buildDateFilter("createdAt", {});
      expect(result).toEqual({});
    });

    /**
     * @test Mengembalikan filter dengan gte dan lte
     */
    it("should return filter with gte and lte", () => {
      const start = new Date("2025-01-01");
      const end = new Date("2025-06-30");
      const result = repo._buildDateFilter("createdAt", { startDate: start, endDate: end });

      expect(result).toEqual({
        createdAt: {
          gte: expect.any(Date),
          lte: expect.any(Date),
        },
      });
    });

    /**
     * @test Mengembalikan filter hanya dengan gte
     */
    it("should return filter with only gte", () => {
      const start = new Date("2025-01-01");
      const result = repo._buildDateFilter("date", { startDate: start });

      expect(result.date.gte).toBeDefined();
      expect(result.date.lte).toBeUndefined();
    });

    /**
     * @test Mengembalikan filter hanya dengan lte
     */
    it("should return filter with only lte", () => {
      const end = new Date("2025-06-30");
      const result = repo._buildDateFilter("createdAt", { endDate: end });

      expect(result.createdAt.lte).toBeDefined();
      expect(result.createdAt.gte).toBeUndefined();
    });
  });

  /**
   * @describe getSalesData
   */
  describe("getSalesData", () => {
    /**
     * @test Mengembalikan data penjualan agregat
     */
    it("should return aggregated sales data", async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { subtotal: 50000000, tax: 5500000, total: 55500000 },
        _count: { id: 150 },
      });

      const result = await repo.getSalesData({});

      expect(result).toEqual({
        totalOrders: 150,
        totalSales: 55500000,
        totalSubtotal: 50000000,
        totalTax: 5500000,
      });
    });

    /**
     * @test Mengembalikan nol ketika tidak ada data
     */
    it("should return zeros when no data", async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { subtotal: null, tax: null, total: null },
        _count: { id: 0 },
      });

      const result = await repo.getSalesData({});

      expect(result.totalOrders).toBe(0);
      expect(result.totalSales).toBe(0);
    });

    /**
     * @test Menerapkan filter rentang tanggal
     */
    it("should apply date range filter", async () => {
      prisma.order.aggregate.mockResolvedValue({ _sum: {}, _count: { id: 0 } });

      await repo.getSalesData({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          payment: { status: "PAID" },
          createdAt: { gte: expect.any(Date), lte: expect.any(Date) },
        }),
        _sum: { subtotal: true, tax: true, total: true },
        _count: { id: true },
      });
    });
  });

  /**
   * @describe getDailySalesSummary
   */
  describe("getDailySalesSummary", () => {
    /**
     * @test Mengembalikan ringkasan penjualan harian
     */
    it("should return daily sales summary", async () => {
      const mockRawData = [
        { date: "2025-06-01", orderCount: 5, totalSales: 2500000, averageOrderValue: 500000 },
        { date: "2025-06-02", orderCount: 8, totalSales: 4000000, averageOrderValue: 500000 },
      ];

      prisma.$queryRawUnsafe.mockResolvedValue(mockRawData);

      const result = await repo.getDailySalesSummary({});

      expect(result).toEqual([
        { date: "2025-06-01", orderCount: 5, totalSales: 2500000, averageOrderValue: 500000 },
        { date: "2025-06-02", orderCount: 8, totalSales: 4000000, averageOrderValue: 500000 },
      ]);
    });

    /**
     * @test Menerapkan filter rentang tanggal
     */
    it("should apply date range filter", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await repo.getDailySalesSummary({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WHERE"),
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  /**
   * @describe getProfitLossData
   */
  describe("getProfitLossData", () => {
    /**
     * @test Mengembalikan data laba rugi
     */
    it("should return profit loss data", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{
        grossRevenue: 50000000n,
        totalCogs: 30000000n,
        grossProfit: 20000000n,
        grossMargin: 40.0,
        totalOperatingExpenses: 5000000n,
        netProfit: 15000000n,
        netMargin: 30.0,
      }]);

      const result = await repo.getProfitLossData({});

      expect(result.grossRevenue).toBe(50000000);
      expect(result.grossProfit).toBe(20000000);
      expect(result.netProfit).toBe(15000000);
    });

    /**
     * @test Mengembalikan nol ketika tidak ada data
     */
    it("should return zeros when no data", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{
        grossRevenue: 0n,
        totalCogs: 0n,
        grossProfit: 0n,
        grossMargin: 0,
        totalOperatingExpenses: 0n,
        netProfit: 0n,
        netMargin: 0,
      }]);

      const result = await repo.getProfitLossData({});

      expect(result.grossRevenue).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });

  /**
   * @describe getInventorySnapshot
   */
  describe("getInventorySnapshot", () => {
    /**
     * @test Mengembalikan snapshot inventori
     */
    it("should return inventory snapshot", async () => {
      prisma.$queryRaw.mockResolvedValue([{
        totalItems: 25,
        totalAssetValue: 100000000n,
        totalRetailValue: 150000000n,
        potentialProfit: 50000000n,
        profitMargin: 33.33,
      }]);

      prisma.product.findMany.mockResolvedValue([
        { id: "p1", sku: "SP-001", name: "Oli", stock: 50, cost: 50000, price: 75000, image: { path: "img/oli.jpg" } },
        { id: "p2", sku: "SP-002", name: "Filter", stock: 0, cost: 30000, price: 50000, image: null },
      ]);

      const result = await repo.getInventorySnapshot();

      expect(result.totalAssetValue).toBe(100000000);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].stockStatus).toBe("HEALTHY");
      expect(result.items[1].stockStatus).toBe("OUT_OF_STOCK");
    });
  });

  /**
   * @describe getShiftSummary
   */
  describe("getShiftSummary", () => {
    /**
     * @test Mengembalikan ringkasan shift
     */
    it("should return shift summary", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 6500000,
        expectedCash: 6500000,
        cashSales: 5500000,
        cashIn: 200000,
        cashOut: 200000,
        discrepancy: 0,
        openedAt: new Date(),
        closedAt: new Date(),
        cashier: { id: "c1", fullName: "Kasir 1" },
        _count: { orders: 25 },
      });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
      prisma.payment.groupBy.mockResolvedValue([
        { method: "CASH", _sum: { amountPaid: 4000000 }, _count: { method: 20 } },
        { method: "QRIS", _sum: { amountPaid: 1500000 }, _count: { method: 5 } },
      ]);

      const result = await repo.getShiftSummary("shift-1");

      expect(result.id).toBe("shift-1");
      expect(result.totalExpenses).toBe(500000);
      expect(result.paymentBreakdown).toHaveLength(2);
      expect(result.netSales).toBe(5000000);
    });

    /**
     * @test Mengembalikan null ketika shift tidak ditemukan
     */
    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.getShiftSummary("shift-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe getTaskStatsByOrder
   */
  describe("getTaskStatsByOrder", () => {
    /**
     * @test Mengembalikan statistik task per order
     */
    it("should return task stats by order", async () => {
      prisma.orderItem.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      prisma.orderItem.findMany.mockResolvedValue([
        {
          id: "oi-1",
          assignments: [
            { id: "a1", mechanic: { id: "m1", fullName: "Joko" } },
          ],
        },
        {
          id: "oi-2",
          assignments: [],
        },
      ]);

      const result = await repo.getTaskStatsByOrder("order-1");

      expect(result.total).toBe(5);
      expect(result.assigned).toBe(3);
      expect(result.unassigned).toBe(2);
      expect(result.tasks).toHaveLength(2);
    });
  });

  /**
   * @describe getMechanicTaskStats
   */
  describe("getMechanicTaskStats", () => {
    /**
     * @test Mengembalikan statistik tugas mekanik
     */
    it("should return mechanic task stats", async () => {
      prisma.mechanicAssignment.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(53);

      const result = await repo.getMechanicTaskStats("mech-1");

      expect(result).toEqual({
        totalTasks: 53,
        completedTasks: 50,
        pendingTasks: 3,
      });
    });
  });

  /**
   * @describe getTotalEarningsByMechanic
   */
  describe("getTotalEarningsByMechanic", () => {
    /**
     * @test Mengembalikan total pendapatan mekanik
     */
    it("should return total earnings by mechanic", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{
        totalEarnings: 5000000n,
        taskCount: 50,
      }]);

      const result = await repo.getTotalEarningsByMechanic("mech-1", {});

      expect(result.totalEarnings).toBe(5000000);
      expect(result.taskCount).toBe(50);
      expect(result.averagePerTask).toBe(100000);
    });

    /**
     * @test Mengembalikan nol ketika tidak ada data
     */
    it("should return zeros when no data", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{
        totalEarnings: 0n,
        taskCount: 0,
      }]);

      const result = await repo.getTotalEarningsByMechanic("mech-1", {});

      expect(result.totalEarnings).toBe(0);
      expect(result.averagePerTask).toBe(0);
    });
  });

  /**
   * @describe sumExpenses
   */
  describe("sumExpenses", () => {
    /**
     * @test Mengembalikan total pengeluaran
     */
    it("should return total expenses", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 5000000 } });

      const result = await repo.sumExpenses({});

      expect(result).toBe(5000000);
    });

    /**
     * @test Mengembalikan 0 ketika tidak ada pengeluaran
     */
    it("should return 0 when no expenses", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await repo.sumExpenses({});

      expect(result).toBe(0);
    });
  });

  /**
   * @describe getExpensesByCategory
   */
  describe("getExpensesByCategory", () => {
    /**
     * @test Mengembalikan pengeluaran berdasarkan kategori
     */
    it("should return expenses by category", async () => {
      prisma.expense.groupBy.mockResolvedValue([
        { category: "SUPPLIES", _sum: { amount: 2000000 }, _count: { id: 10 } },
        { category: "MAINTENANCE", _sum: { amount: 1500000 }, _count: { id: 5 } },
      ]);

      const result = await repo.getExpensesByCategory({});

      expect(result).toEqual([
        { category: "SUPPLIES", total: 2000000, count: 10 },
        { category: "MAINTENANCE", total: 1500000, count: 5 },
      ]);
    });
  });

  /**
   * @describe getMovementSummaryByDateRange
   */
  describe("getMovementSummaryByDateRange", () => {
    /**
     * @test Mengembalikan ringkasan pergerakan stok
     */
    it("should return movement summary", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([
        { type: "IN", _sum: { quantity: 100 } },
        { type: "OUT", _sum: { quantity: 45 } },
        { type: "ADJUSTMENT", _sum: { quantity: 5 } },
      ]);

      const result = await repo.getMovementSummaryByDateRange(
        "prod-1",
        new Date("2025-01-01"),
        new Date("2025-06-30")
      );

      expect(result).toEqual({
        IN: 100,
        OUT: 45,
        ADJUSTMENT: 5,
        netChange: 60,
      });
    });
  });

  /**
   * @describe validateStockConsistency
   */
  describe("validateStockConsistency", () => {
    /**
     * @test Mengembalikan hasil validasi konsistensi
     */
    it("should return stock consistency validation", async () => {
      prisma.product.findUnique.mockResolvedValue({ stock: 60 });
      prisma.stockMovement.groupBy.mockResolvedValue([
        { type: "IN", _sum: { quantity: 100 } },
        { type: "OUT", _sum: { quantity: 40 } },
      ]);

      const result = await repo.validateStockConsistency("prod-1");

      expect(result).toEqual({
        current: 60,
        calculated: 60,
        difference: 0,
        isConsistent: true,
      });
    });

    /**
     * @test Mengembalikan null ketika produk tidak ditemukan
     */
    it("should return null when product not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.validateStockConsistency("prod-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe getMechanicPerformanceReport
   */
  describe("getMechanicPerformanceReport", () => {
    /**
     * @test Mengembalikan laporan performa mekanik
     */
    it("should return mechanic performance report", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([
        {
          mechanicId: "m1",
          mechanicName: "Joko",
          email: "joko@email.com",
          totalTasks: 50,
          completedTasks: 45,
          pendingTasks: 5,
          totalEarnings: 5000000n,
          averagePerTask: 111111,
          completionRate: 90.0,
        },
      ]);

      const result = await repo.getMechanicPerformanceReport({});

      expect(result).toHaveLength(1);
      expect(result[0].mechanicName).toBe("Joko");
      expect(result[0].completionRate).toBe(90);
    });
  });

  /**
   * @describe getProductSalesReport
   */
  describe("getProductSalesReport", () => {
    /**
     * @test Mengembalikan laporan penjualan produk
     */
    it("should return product sales report", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([
        {
          productId: "p1",
          productName: "Oli Mesin",
          sku: "SP-001",
          type: "SPAREPART",
          image: "img/oli.jpg",
          quantitySold: 100,
          totalRevenue: 15000000n,
          totalCost: 10000000n,
          profit: 5000000n,
        },
      ]);

      const result = await repo.getProductSalesReport({}, 10);

      expect(result).toHaveLength(1);
      expect(result[0].profit).toBe(5000000);
    });
  });

  /**
   * @describe getProductSummary
   */
  describe("getProductSummary", () => {
    /**
     * @test Mengembalikan ringkasan produk
     */
    it("should return product summary", async () => {
      prisma.product.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(180)
        .mockResolvedValueOnce(12);
      prisma.product.groupBy.mockResolvedValue([
        { type: "SPAREPART", _count: { type: 150 }, _sum: { stock: 500 } },
        { type: "SERVICE", _count: { type: 50 }, _sum: { stock: 0 } },
      ]);
      prisma.$queryRaw.mockResolvedValue([{
        totalStockQuantity: 500,
        totalStockValue: 50000000n,
      }]);

      const result = await repo.getProductSummary();

      expect(result.totalProducts).toBe(200);
      expect(result.activeProducts).toBe(180);
      expect(result.lowStockCount).toBe(12);
      expect(result.byType).toHaveLength(2);
    });
  });

  /**
   * @describe getLowStockProducts
   */
  describe("getLowStockProducts", () => {
    /**
     * @test Mengembalikan produk stok rendah
     */
    it("should return low stock products", async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: "p1", sku: "SP-001", name: "Oli", stock: 3, cost: 50000, price: 75000, image: { path: "img/oli.jpg" } },
      ]);

      const result = await repo.getLowStockProducts(5);

      expect(result).toHaveLength(1);
      expect(result[0].stock).toBe(3);
    });
  });

  /**
   * @describe getPaymentSummary
   */
  describe("getPaymentSummary", () => {
    /**
     * @test Mengembalikan ringkasan pembayaran
     */
    it("should return payment summary", async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: 50000000 } });
      prisma.payment.count.mockResolvedValue(100);
      prisma.payment.groupBy
        .mockResolvedValueOnce([
          { method: "CASH", _sum: { amountPaid: 30000000 }, _count: { method: 60 } },
        ])
        .mockResolvedValueOnce([
          { status: "PAID", _sum: { amountPaid: 50000000 }, _count: { status: 100 } },
        ]);

      const result = await repo.getPaymentSummary({});

      expect(result.totalAmount).toBe(50000000);
      expect(result.totalCount).toBe(100);
    });
  });

  /**
   * @describe countOrdersByStatus
   */
  describe("countOrdersByStatus", () => {
    /**
     * @test Mengembalikan jumlah order berdasarkan status
     */
    it("should return order count by status", async () => {
      prisma.order.count.mockResolvedValue(25);

      const result = await repo.countOrdersByStatus("QUEUED");

      expect(result).toBe(25);
    });

    /**
     * @test Menangani array status
     */
    it("should handle array of statuses", async () => {
      prisma.order.count.mockResolvedValue(10);

      await repo.countOrdersByStatus(["DRAFT", "QUEUED", "IN_PROGRESS"]);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
          deletedAt: null,
        },
      });
    });
  });

  /**
   * @describe getActiveShift
   */
  describe("getActiveShift", () => {
    /**
     * @test Mengembalikan shift aktif
     */
    it("should return active shift", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        cashier: { id: "c1", fullName: "Kasir 1" },
        _count: { orders: 15 },
      };

      prisma.shift.findFirst.mockResolvedValue(mockShift);

      const result = await repo.getActiveShift();

      expect(result).toEqual(mockShift);
    });

    /**
     * @test Mengembalikan null ketika tidak ada shift aktif
     */
    it("should return null when no active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.getActiveShift();

      expect(result).toBeNull();
    });
  });

  /**
   * @describe getCashierTodaySales
   */
  describe("getCashierTodaySales", () => {
    /**
     * @test Mengembalikan penjualan kasir hari ini
     */
    it("should return cashier today sales", async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: 5000000 },
        _count: { id: 10 },
      });
      prisma.order.count.mockResolvedValue(3);

      const result = await repo.getCashierTodaySales("cashier-1");

      expect(result).toEqual({
        todayOrders: 10,
        todaySales: 5000000,
        pendingOrders: 3,
      });
    });
  });

  /**
   * @describe getMechanicTodayTasks
   */
  describe("getMechanicTodayTasks", () => {
    /**
     * @test Mengembalikan tugas mekanik hari ini
     */
    it("should return mechanic today tasks", async () => {
      prisma.mechanicAssignment.count.mockResolvedValue(2);
      prisma.$queryRaw.mockResolvedValue([{
        completedCount: 5,
        earnings: 750000n,
      }]);

      const result = await repo.getMechanicTodayTasks("mech-1");

      expect(result).toEqual({
        pending: 2,
        completed: 5,
        earnings: 750000,
      });
    });
  });
});