import prisma from "#app/database.js";
import ShiftRepository from "#repository/shiftRepository.js";

jest.mock("#app/database.js", () => ({
  shift: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    groupBy: jest.fn(),
  },
  expense: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
}));

/**
 * Unit test untuk ShiftRepository
 * @describe ShiftRepository
 */
describe("ShiftRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ShiftRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat shift baru dengan status OPEN
     */
    it("should create a new shift with OPEN status", async () => {
      const input = {
        cashierId: "cashier-1",
        startingCash: 1000000,
      };

      const expected = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        openedAt: new Date(),
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
      };

      prisma.shift.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          cashierId: "cashier-1",
          startingCash: 1000000,
          status: "OPEN",
          cashSales: 0,
          cashIn: 0,
          cashOut: 0,
          discrepancy: 0,
          openedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          startingCash: true,
          openedAt: true,
          cashier: { select: { id: true, fullName: true } },
        },
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan shift lengkap dengan orders dan expenses
     */
    it("should return full shift with orders and expenses", async () => {
      const mockShift = {
        id: "shift-1",
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 6500000,
        cashier: { id: "c1", fullName: "Kasir 1", email: "kasir@email.com", role: "CASHIER", phone: "0812" },
        orders: [],
        expenses: [],
      };

      prisma.shift.findUnique.mockResolvedValue(mockShift);

      const result = await repo.findById("shift-1");

      expect(result).toEqual(mockShift);
      expect(prisma.shift.findUnique).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        select: expect.objectContaining({
          orders: expect.any(Object),
          expenses: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika shift tidak ditemukan
     */
    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.findById("shift-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findActiveByCashier
   */
  describe("findActiveByCashier", () => {
    /**
     * @test Mengembalikan shift aktif kasir
     */
    it("should return active shift for cashier", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
      };

      prisma.shift.findFirst.mockResolvedValue(mockShift);

      const result = await repo.findActiveByCashier("cashier-1");

      expect(result).toEqual(mockShift);
      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { cashierId: "cashier-1", status: "OPEN" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika tidak ada shift aktif
     */
    it("should return null when no active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.findActiveByCashier("cashier-1");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe hasActiveShift
   */
  describe("hasActiveShift", () => {
    /**
     * @test Mengembalikan true ketika kasir memiliki shift aktif
     */
    it("should return true when cashier has active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue({ id: "shift-1" });

      const result = await repo.hasActiveShift("cashier-1");

      expect(result).toBe(true);
    });

    /**
     * @test Mengembalikan false ketika tidak ada shift aktif
     */
    it("should return false when no active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.hasActiveShift("cashier-1");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan shift dengan paginasi default
     */
    it("should return shifts with default pagination", async () => {
      const mockData = [
        {
          id: "shift-1",
          status: "CLOSED",
          startingCash: 1000000,
          endingCash: 6500000,
          cashSales: 5500000,
          cashier: { id: "c1", fullName: "Kasir 1" },
          _count: { orders: 25, expenses: 5 },
        },
      ];

      prisma.shift.count.mockResolvedValue(1);
      prisma.shift.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { openedAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan shift dengan filter status
     */
    it("should return shifts filtered by status", async () => {
      prisma.shift.count.mockResolvedValue(5);
      prisma.shift.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "OPEN" });

      expect(prisma.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "OPEN" } })
      );
    });

    /**
     * @test Mengembalikan shift dengan filter cashierId
     */
    it("should return shifts filtered by cashierId", async () => {
      prisma.shift.count.mockResolvedValue(8);
      prisma.shift.findMany.mockResolvedValue([]);

      await repo.findMany({ cashierId: "cashier-1" });

      expect(prisma.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cashierId: "cashier-1" } })
      );
    });

    /**
     * @test Mengembalikan shift dengan filter rentang tanggal
     */
    it("should return shifts filtered by date range", async () => {
      prisma.shift.count.mockResolvedValue(20);
      prisma.shift.findMany.mockResolvedValue([]);

      await repo.findMany({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            openedAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });
  });

  /**
   * @describe close
   */
  describe("close", () => {
    /**
     * @test Menutup shift dengan data penutupan
     */
    it("should close a shift with closing data", async () => {
      const closeData = {
        endingCash: 6500000,
        expectedCash: 6500000,
        discrepancy: 0,
      };

      const expected = {
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
      };

      prisma.shift.update.mockResolvedValue(expected);

      const result = await repo.close("shift-1", closeData);

      expect(result.status).toBe("CLOSED");
      expect(result.closedAt).toBeDefined();
      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: {
          endingCash: 6500000,
          expectedCash: 6500000,
          discrepancy: 0,
          status: "CLOSED",
          closedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    /**
     * @test Menutup shift dengan selisih negatif
     */
    it("should close a shift with negative discrepancy", async () => {
      const closeData = {
        endingCash: 6000000,
        expectedCash: 6500000,
        discrepancy: -500000,
      };

      prisma.shift.update.mockResolvedValue({});

      await repo.close("shift-1", closeData);

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: expect.objectContaining({
          endingCash: 6000000,
          discrepancy: -500000,
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe updateCashFlow
   */
  describe("updateCashFlow", () => {
    /**
     * @test Menambah cash sales
     */
    it("should increment cash sales", async () => {
      prisma.shift.update.mockResolvedValue({
        id: "shift-1",
        cashSales: 5500000,
        cashIn: 0,
        cashOut: 0,
      });

      const result = await repo.updateCashFlow("shift-1", { cashSales: 500000 });

      expect(result.cashSales).toBe(5500000);
      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: { cashSales: { increment: 500000 } },
        select: { id: true, cashSales: true, cashIn: true, cashOut: true },
      });
    });

    /**
     * @test Menambah cash in
     */
    it("should increment cash in", async () => {
      prisma.shift.update.mockResolvedValue({});

      await repo.updateCashFlow("shift-1", { cashIn: 200000 });

      expect(prisma.shift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { cashIn: { increment: 200000 } },
        })
      );
    });

    /**
     * @test Menambah cash out
     */
    it("should increment cash out", async () => {
      prisma.shift.update.mockResolvedValue({});

      await repo.updateCashFlow("shift-1", { cashOut: 100000 });

      expect(prisma.shift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { cashOut: { increment: 100000 } },
        })
      );
    });

    /**
     * @test Mengupdate multiple cash flow sekaligus
     */
    it("should update multiple cash flows at once", async () => {
      prisma.shift.update.mockResolvedValue({});

      await repo.updateCashFlow("shift-1", {
        cashSales: 500000,
        cashIn: 200000,
        cashOut: 100000,
      });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: {
          cashSales: { increment: 500000 },
          cashIn: { increment: 200000 },
          cashOut: { increment: 100000 },
        },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe getShiftSummary
   */
  describe("getShiftSummary", () => {
    /**
     * @test Mengembalikan ringkasan shift
     */
    it("should return shift summary with breakdowns", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 6500000,
        expectedCash: 6500000,
        discrepancy: 0,
        cashSales: 5500000,
        cashIn: 200000,
        cashOut: 200000,
        openedAt: new Date(),
        closedAt: new Date(),
        _count: { orders: 25, expenses: 5 },
      });
      prisma.payment.groupBy.mockResolvedValue([
        { method: "CASH", _sum: { amountPaid: 4000000 }, _count: { method: 20 } },
        { method: "QRIS", _sum: { amountPaid: 1500000 }, _count: { method: 5 } },
      ]);
      prisma.expense.groupBy.mockResolvedValue([
        { category: "SUPPLIES", _sum: { amount: 300000 } },
        { category: "OTHER", _sum: { amount: 200000 } },
      ]);

      const result = await repo.getShiftSummary("shift-1");

      expect(result.id).toBe("shift-1");
      expect(result.paymentBreakdown).toHaveLength(2);
      expect(result.expenseBreakdown).toHaveLength(2);
      expect(result._count.orders).toBe(25);
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
   * @describe findLastShiftByCashier
   */
  describe("findLastShiftByCashier", () => {
    /**
     * @test Mengembalikan shift terakhir kasir
     */
    it("should return the last shift for a cashier", async () => {
      const mockShift = {
        id: "shift-5",
        status: "CLOSED",
        endingCash: 2500000,
        closedAt: new Date(),
        openedAt: new Date(),
      };

      prisma.shift.findFirst.mockResolvedValue(mockShift);

      const result = await repo.findLastShiftByCashier("cashier-1");

      expect(result).toEqual(mockShift);
      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { cashierId: "cashier-1" },
        orderBy: { openedAt: "desc" },
        select: { id: true, status: true, endingCash: true, closedAt: true, openedAt: true },
      });
    });

    /**
     * @test Mengembalikan null ketika kasir belum pernah shift
     */
    it("should return null when cashier has no shifts", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.findLastShiftByCashier("cashier-new");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe calculateExpectedCash
   */
  describe("calculateExpectedCash", () => {
    /**
     * @test Menghitung expected cash dengan benar
     */
    it("should calculate expected cash correctly", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        startingCash: 1000000,
        cashSales: 5000000,
        cashIn: 200000,
        cashOut: 100000,
        status: "OPEN",
      });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
      prisma.payment.groupBy.mockResolvedValue([
        { method: "CASH", _sum: { amountPaid: 3000000 }, _count: { method: 15 } },
        { method: "QRIS", _sum: { amountPaid: 2000000 }, _count: { method: 10 } },
      ]);

      const result = await repo.calculateExpectedCash("shift-1");

      expect(result.expectedCash).toBe(5600000);
      expect(result.paymentBreakdown.cash.total).toBe(3000000);
      expect(result.paymentBreakdown.qris.total).toBe(2000000);
      expect(result.formula).toBe("startingCash + cashSales + cashIn - cashOut - totalExpenses");
    });

    /**
     * @test Menangani payment breakdown kosong
     */
    it("should handle empty payment breakdown", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        startingCash: 1000000,
        cashSales: 0,
        cashIn: 0,
        cashOut: 0,
        status: "OPEN",
      });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.payment.groupBy.mockResolvedValue([]);

      const result = await repo.calculateExpectedCash("shift-1");

      expect(result.expectedCash).toBe(1000000);
      expect(result.paymentBreakdown.cash.total).toBe(0);
      expect(result.paymentBreakdown.qris.total).toBe(0);
    });

    /**
     * @test Mengembalikan null ketika shift tidak ditemukan
     */
    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.calculateExpectedCash("shift-99");

      expect(result).toBeNull();
    });
  });
});