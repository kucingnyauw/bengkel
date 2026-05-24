import prisma from "#app/database.js";
import ExpenseRepository from "#repository/expenseRepository.js";

jest.mock("#app/database.js", () => ({
  expense: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
}));

/**
 * Unit test untuk ExpenseRepository
 * @describe ExpenseRepository
 */
describe("ExpenseRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ExpenseRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat pengeluaran baru dengan semua field
     */
    it("should create an expense with all fields", async () => {
      const input = {
        title: "Beli ATK",
        description: "Pembelian alat tulis kantor",
        amount: 150000,
        category: "SUPPLIES",
        date: new Date("2025-06-01"),
        shiftId: "shift-1",
        recordedById: "user-1",
        receiptId: "file-1",
      };

      const expected = {
        id: "exp-1",
        title: "Beli ATK",
        description: "Pembelian alat tulis kantor",
        amount: 150000,
        category: "SUPPLIES",
        date: new Date("2025-06-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        shift: {
          id: "shift-1",
          status: "CLOSED",
          openedAt: new Date(),
          closedAt: new Date(),
          cashier: { id: "user-1", fullName: "Kasir 1" },
        },
        recordedBy: { id: "user-1", fullName: "Kasir 1", role: "CASHIER" },
        receipt: { id: "file-1", fileName: "receipt.jpg", path: "receipts/receipt.jpg" },
      };

      prisma.expense.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: {
          title: "Beli ATK",
          description: "Pembelian alat tulis kantor",
          amount: 150000,
          category: "SUPPLIES",
          date: new Date("2025-06-01"),
          shiftId: "shift-1",
          recordedById: "user-1",
          receiptId: "file-1",
        },
        select: expect.objectContaining({
          id: true,
          title: true,
          amount: true,
          category: true,
          shift: expect.any(Object),
          recordedBy: expect.any(Object),
          receipt: expect.any(Object),
        }),
      });
    });

    /**
     * @test Membuat pengeluaran dengan nilai default
     */
    it("should create an expense with default values", async () => {
      const input = {
        title: "Parkir",
        amount: 5000,
        recordedById: "user-1",
      };

      const expected = {
        id: "exp-2",
        title: "Parkir",
        amount: 5000,
        category: "OTHER",
        date: new Date(),
        shift: null,
        recordedBy: { id: "user-1", fullName: "Kasir 1", role: "CASHIER" },
        receipt: null,
      };

      prisma.expense.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Parkir",
          description: undefined,
          amount: 5000,
          category: "OTHER",
          shiftId: undefined,
          receiptId: undefined,
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan pengeluaran lengkap ketika ditemukan
     */
    it("should return full expense data when found", async () => {
      const mockExpense = {
        id: "exp-1",
        title: "Beli ATK",
        description: "Pembelian ATK",
        amount: 150000,
        category: "SUPPLIES",
        date: new Date("2025-06-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        shift: {
          id: "shift-1",
          status: "CLOSED",
          openedAt: new Date(),
          closedAt: new Date(),
          cashier: { id: "user-1", fullName: "Kasir 1" },
        },
        recordedBy: { id: "user-1", fullName: "Kasir 1", role: "CASHIER" },
        receipt: { id: "file-1", fileName: "receipt.jpg", path: "receipts/receipt.jpg" },
      };

      prisma.expense.findUnique.mockResolvedValue(mockExpense);

      const result = await repo.findById("exp-1");

      expect(result).toEqual(mockExpense);
      expect(prisma.expense.findUnique).toHaveBeenCalledWith({
        where: { id: "exp-1" },
        select: expect.objectContaining({
          shift: expect.any(Object),
          recordedBy: expect.any(Object),
          receipt: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika pengeluaran tidak ditemukan
     */
    it("should return null when expense not found", async () => {
      prisma.expense.findUnique.mockResolvedValue(null);

      const result = await repo.findById("exp-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan pengeluaran dengan paginasi default
     */
    it("should return expenses with default pagination", async () => {
      const mockData = [
        {
          id: "exp-1",
          title: "Beli ATK",
          amount: 150000,
          category: "SUPPLIES",
          date: new Date("2025-06-01"),
          createdAt: new Date(),
          shift: { id: "shift-1", openedAt: new Date(), closedAt: new Date() },
          recordedBy: { id: "user-1", fullName: "Kasir 1" },
          receipt: { id: "file-1", path: "receipts/r1.jpg" },
        },
      ];

      prisma.expense.count.mockResolvedValue(1);
      prisma.expense.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { date: "desc" },
      });
    });

    /**
     * @test Mengembalikan pengeluaran dengan filter kategori
     */
    it("should return expenses filtered by category", async () => {
      const query = { category: "SUPPLIES", page: 1, limit: 5 };

      prisma.expense.count.mockResolvedValue(3);
      prisma.expense.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: "SUPPLIES" },
          skip: 0,
          take: 5,
        })
      );
    });

    /**
     * @test Mengembalikan pengeluaran dengan filter shift
     */
    it("should return expenses filtered by shift ID", async () => {
      const query = { shiftId: "shift-1" };

      prisma.expense.count.mockResolvedValue(5);
      prisma.expense.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shiftId: "shift-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pengeluaran dengan filter pencarian
     */
    it("should return expenses filtered by search", async () => {
      const query = { search: "ATK" };

      prisma.expense.count.mockResolvedValue(2);
      prisma.expense.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { title: { contains: "ATK", mode: "insensitive" } },
        })
      );
    });

    /**
     * @test Mengembalikan pengeluaran dengan filter rentang tanggal
     */
    it("should return expenses filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.expense.count.mockResolvedValue(10);
      prisma.expense.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            date: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });

    /**
     * @test Mengembalikan pengeluaran dengan filter user pencatat
     */
    it("should return expenses filtered by recordedById", async () => {
      const query = { recordedById: "user-1" };

      prisma.expense.count.mockResolvedValue(8);
      prisma.expense.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recordedById: "user-1" },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pengeluaran
     */
    it("should return empty array when no expenses", async () => {
      prisma.expense.count.mockResolvedValue(0);
      prisma.expense.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe update
   */
  describe("update", () => {
    /**
     * @test Mengupdate pengeluaran dengan data baru
     */
    it("should update an expense with new data", async () => {
      const updateData = {
        title: "Beli ATK Updated",
        amount: 200000,
        category: "MAINTENANCE",
      };

      const expected = {
        id: "exp-1",
        title: "Beli ATK Updated",
        amount: 200000,
        category: "MAINTENANCE",
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.expense.update.mockResolvedValue(expected);

      const result = await repo.update("exp-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: "exp-1" },
        data: updateData,
        select: expect.objectContaining({
          id: true,
          title: true,
          amount: true,
          category: true,
        }),
      });
    });

    /**
     * @test Mengupdate hanya judul pengeluaran
     */
    it("should update only expense title", async () => {
      const updateData = { title: "New Title" };
      const expected = { id: "exp-1", title: "New Title", amount: 150000 };

      prisma.expense.update.mockResolvedValue(expected);

      await repo.update("exp-1", updateData);

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: "exp-1" },
        data: { title: "New Title" },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus pengeluaran berdasarkan ID
     */
    it("should delete an expense by ID", async () => {
      prisma.expense.delete.mockResolvedValue({});

      await repo.delete("exp-1");

      expect(prisma.expense.delete).toHaveBeenCalledWith({
        where: { id: "exp-1" },
      });
    });
  });

  /**
   * @describe getTotalExpenses
   */
  describe("getTotalExpenses", () => {
    /**
     * @test Mengembalikan total pengeluaran tanpa filter
     */
    it("should return total expenses without filters", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 5000000 } });

      const result = await repo.getTotalExpenses({});

      expect(result).toBe(5000000);
      expect(prisma.expense.aggregate).toHaveBeenCalledWith({
        where: {},
        _sum: { amount: true },
      });
    });

    /**
     * @test Mengembalikan total pengeluaran dengan filter kategori
     */
    it("should return total expenses filtered by category", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 1500000 } });

      const result = await repo.getTotalExpenses({ category: "SUPPLIES" });

      expect(result).toBe(1500000);
      expect(prisma.expense.aggregate).toHaveBeenCalledWith({
        where: { category: "SUPPLIES" },
        _sum: { amount: true },
      });
    });

    /**
     * @test Mengembalikan total pengeluaran dengan filter shift
     */
    it("should return total expenses filtered by shift ID", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 750000 } });

      const result = await repo.getTotalExpenses({ shiftId: "shift-1" });

      expect(result).toBe(750000);
      expect(prisma.expense.aggregate).toHaveBeenCalledWith({
        where: { shiftId: "shift-1" },
        _sum: { amount: true },
      });
    });

    /**
     * @test Mengembalikan total pengeluaran dengan filter rentang tanggal
     */
    it("should return total expenses filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 3000000 } });

      const result = await repo.getTotalExpenses(query);

      expect(result).toBe(3000000);
      expect(prisma.expense.aggregate).toHaveBeenCalledWith({
        where: {
          date: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        _sum: { amount: true },
      });
    });

    /**
     * @test Mengembalikan 0 ketika tidak ada pengeluaran
     */
    it("should return 0 when no expenses found", async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await repo.getTotalExpenses({});

      expect(result).toBe(0);
    });
  });

  /**
   * @describe getExpensesByCategory
   */
  describe("getExpensesByCategory", () => {
    /**
     * @test Mengembalikan ringkasan pengeluaran per kategori
     */
    it("should return expenses grouped by category", async () => {
      const mockGroupBy = [
        { category: "SUPPLIES", _sum: { amount: 2500000 }, _count: { id: 15 } },
        { category: "MAINTENANCE", _sum: { amount: 1500000 }, _count: { id: 8 } },
        { category: "UTILITIES", _sum: { amount: 1000000 }, _count: { id: 5 } },
      ];

      prisma.expense.groupBy.mockResolvedValue(mockGroupBy);

      const result = await repo.getExpensesByCategory({});

      expect(result).toEqual([
        { category: "SUPPLIES", totalAmount: 2500000, count: 15 },
        { category: "MAINTENANCE", totalAmount: 1500000, count: 8 },
        { category: "UTILITIES", totalAmount: 1000000, count: 5 },
      ]);
      expect(prisma.expense.groupBy).toHaveBeenCalledWith({
        by: ["category"],
        where: {},
        _sum: { amount: true },
        _count: { id: true },
      });
    });

    /**
     * @test Mengembalikan ringkasan dengan filter rentang tanggal
     */
    it("should return expenses by category with date range filter", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.expense.groupBy.mockResolvedValue([]);

      await repo.getExpensesByCategory(query);

      expect(prisma.expense.groupBy).toHaveBeenCalledWith({
        by: ["category"],
        where: {
          date: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      });
    });

    /**
     * @test Menangani nilai null pada sum amount
     */
    it("should handle null sum amount", async () => {
      prisma.expense.groupBy.mockResolvedValue([
        { category: "OTHER", _sum: { amount: null }, _count: { id: 0 } },
      ]);

      const result = await repo.getExpensesByCategory({});

      expect(result[0].totalAmount).toBe(0);
      expect(result[0].count).toBe(0);
    });
  });

  /**
   * @describe findByShiftId
   */
  describe("findByShiftId", () => {
    /**
     * @test Mengembalikan pengeluaran untuk shift tertentu
     */
    it("should return expenses for a specific shift", async () => {
      const mockExpenses = [
        {
          id: "exp-1",
          title: "Beli ATK",
          amount: 150000,
          category: "SUPPLIES",
          date: new Date(),
          createdAt: new Date(),
          shift: { id: "shift-1", openedAt: new Date(), closedAt: new Date() },
          recordedBy: { id: "user-1", fullName: "Kasir 1" },
          receipt: { id: "file-1", path: "receipts/r1.jpg" },
        },
        {
          id: "exp-2",
          title: "Parkir",
          amount: 5000,
          category: "OTHER",
          date: new Date(),
          createdAt: new Date(),
          shift: { id: "shift-1", openedAt: new Date(), closedAt: new Date() },
          recordedBy: { id: "user-1", fullName: "Kasir 1" },
          receipt: null,
        },
      ];

      prisma.expense.findMany.mockResolvedValue(mockExpenses);

      const result = await repo.findByShiftId("shift-1");

      expect(result).toEqual(mockExpenses);
      expect(result).toHaveLength(2);
      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { shiftId: "shift-1" },
        select: expect.any(Object),
        orderBy: { date: "desc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika shift tidak memiliki pengeluaran
     */
    it("should return empty array when shift has no expenses", async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      const result = await repo.findByShiftId("shift-99");

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe getDailyExpenses
   */
  describe("getDailyExpenses", () => {
    /**
     * @test Mengembalikan ringkasan pengeluaran harian tanpa filter
     */
    it("should return daily expenses summary without filters", async () => {
      const mockDaily = [
        { date: new Date("2025-06-01"), totalAmount: 500000, count: 5 },
        { date: new Date("2025-05-31"), totalAmount: 300000, count: 3 },
      ];

      prisma.$queryRawUnsafe.mockResolvedValue(mockDaily);

      const result = await repo.getDailyExpenses({});

      expect(result).toEqual(mockDaily);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("GROUP BY DATE"),
        ...[]
      );
    });

    /**
     * @test Mengembalikan ringkasan pengeluaran harian dengan filter tanggal
     */
    it("should return daily expenses summary with date filter", async () => {
      const query = {
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await repo.getDailyExpenses(query);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WHERE"),
        new Date("2025-06-01"),
        new Date("2025-06-30")
      );
    });

    /**
     * @test Mengembalikan ringkasan harian hanya dengan startDate
     */
    it("should return daily expenses with only startDate", async () => {
      const query = { startDate: new Date("2025-01-01") };

      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await repo.getDailyExpenses(query);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WHERE"),
        new Date("2025-01-01")
      );
    });

    /**
     * @test Mengembalikan ringkasan harian hanya dengan endDate
     */
    it("should return daily expenses with only endDate", async () => {
      const query = { endDate: new Date("2025-12-31") };

      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await repo.getDailyExpenses(query);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WHERE"),
        new Date("2025-12-31")
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada data
     */
    it("should return empty array when no daily data", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getDailyExpenses({});

      expect(result).toEqual([]);
    });
  });
});