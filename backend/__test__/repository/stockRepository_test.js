import prisma from "#app/database.js";
import StockRepository from "#repository/stockRepository.js";

jest.mock("#app/database.js", () => ({
  stockMovement: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
}));

/**
 * Unit test untuk StockRepository
 * @describe StockRepository
 */
describe("StockRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new StockRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat record stok masuk dengan semua field
     */
    it("should create a stock in movement with all fields", async () => {
      const input = {
        productId: "prod-1",
        type: "IN",
        sourceType: "PURCHASE",
        quantity: 100,
        recordedById: "user-1",
        orderItemId: null,
        note: "Restock dari supplier",
      };

      const expected = {
        id: "sm-1",
        type: "IN",
        sourceType: "PURCHASE",
        quantity: 100,
        note: "Restock dari supplier",
        createdAt: new Date(),
        product: { id: "prod-1", name: "Oli", sku: "SP-001", type: "SPAREPART", stock: 150, price: 50000, cost: 30000 },
        orderItem: null,
        recordedBy: { id: "user-1", fullName: "Admin", role: "ADMIN" },
      };

      prisma.stockMovement.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-1",
          type: "IN",
          sourceType: "PURCHASE",
          quantity: 100,
          recordedById: "user-1",
          orderItemId: null,
          note: "Restock dari supplier",
        },
        select: expect.objectContaining({
          id: true,
          type: true,
          product: expect.any(Object),
          recordedBy: expect.any(Object),
        }),
      });
    });

    /**
     * @test Membuat record dengan sourceType default MANUAL
     */
    it("should create a movement with default sourceType MANUAL", async () => {
      const input = {
        productId: "prod-1",
        type: "OUT",
        quantity: 5,
        recordedById: "user-1",
      };

      prisma.stockMovement.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: "MANUAL",
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe createInTransaction
   */
  describe("createInTransaction", () => {
    /**
     * @test Membuat record dalam transaction
     */
    it("should create a movement within a transaction", async () => {
      const mockTx = {
        stockMovement: {
          create: jest.fn().mockResolvedValue({ id: "sm-1" }),
        },
      };

      const data = {
        productId: "prod-1",
        type: "IN",
        quantity: 50,
        recordedById: "user-1",
        sourceType: "PURCHASE",
        note: "Restock",
      };

      const result = await repo.createInTransaction(mockTx, data);

      expect(result).toEqual({ id: "sm-1" });
      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-1",
          type: "IN",
          sourceType: "PURCHASE",
          quantity: 50,
          recordedById: "user-1",
          orderItemId: undefined,
          note: "Restock",
        },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan pergerakan stok lengkap ketika ditemukan
     */
    it("should return full stock movement when found", async () => {
      const mockMovement = {
        id: "sm-1",
        type: "IN",
        sourceType: "PURCHASE",
        quantity: 100,
        note: "Restock",
        createdAt: new Date(),
        product: { id: "prod-1", name: "Oli", sku: "SP-001", type: "SPAREPART", stock: 150, price: 50000, cost: 30000 },
        orderItem: null,
        recordedBy: { id: "user-1", fullName: "Admin", role: "ADMIN" },
      };

      prisma.stockMovement.findUnique.mockResolvedValue(mockMovement);

      const result = await repo.findById("sm-1");

      expect(result).toEqual(mockMovement);
      expect(prisma.stockMovement.findUnique).toHaveBeenCalledWith({
        where: { id: "sm-1" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika tidak ditemukan
     */
    it("should return null when not found", async () => {
      prisma.stockMovement.findUnique.mockResolvedValue(null);

      const result = await repo.findById("sm-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan pergerakan stok dengan paginasi default
     */
    it("should return stock movements with default pagination", async () => {
      const mockData = [
        {
          id: "sm-1",
          type: "IN",
          sourceType: "PURCHASE",
          quantity: 100,
          note: "Restock",
          createdAt: new Date(),
          product: { id: "prod-1", name: "Oli", sku: "SP-001", stock: 150 },
          recordedBy: { id: "user-1", fullName: "Admin" },
          orderItem: null,
        },
      ];

      prisma.stockMovement.count.mockResolvedValue(1);
      prisma.stockMovement.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter productId
     */
    it("should return movements filtered by productId", async () => {
      prisma.stockMovement.count.mockResolvedValue(5);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({ productId: "prod-1" });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: "prod-1" } })
      );
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter type
     */
    it("should return movements filtered by type", async () => {
      prisma.stockMovement.count.mockResolvedValue(10);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({ type: "OUT" });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: "OUT" } })
      );
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter sourceType
     */
    it("should return movements filtered by sourceType", async () => {
      prisma.stockMovement.count.mockResolvedValue(8);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({ sourceType: "SALE" });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sourceType: "SALE" } })
      );
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter orderId
     */
    it("should return movements filtered by orderId", async () => {
      prisma.stockMovement.count.mockResolvedValue(3);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({ orderId: "order-1" });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderItem: { orderId: "order-1" } },
        })
      );
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter pencarian
     */
    it("should return movements filtered by search", async () => {
      prisma.stockMovement.count.mockResolvedValue(2);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Oli" });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { product: { name: { contains: "Oli", mode: "insensitive" } } },
        })
      );
    });

    /**
     * @test Mengembalikan pergerakan stok dengan filter rentang tanggal
     */
    it("should return movements filtered by date range", async () => {
      prisma.stockMovement.count.mockResolvedValue(15);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findMany({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });
  });

  /**
   * @describe recordStockIn
   */
  describe("recordStockIn", () => {
    /**
     * @test Mencatat stok masuk dengan sourceType PURCHASE
     */
    it("should record stock in with PURCHASE sourceType", async () => {
      prisma.stockMovement.create.mockResolvedValue({ id: "sm-1", type: "IN" });

      const result = await repo.recordStockIn("prod-1", 50, "user-1", "Restock", "PURCHASE");

      expect(result.type).toBe("IN");
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: "prod-1",
          type: "IN",
          quantity: 50,
          sourceType: "PURCHASE",
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Mencatat stok masuk dengan nilai default
     */
    it("should record stock in with default values", async () => {
      prisma.stockMovement.create.mockResolvedValue({});

      await repo.recordStockIn("prod-1", 10, "user-1");

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          note: null,
          sourceType: "MANUAL",
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe recordStockOut
   */
  describe("recordStockOut", () => {
    /**
     * @test Mencatat stok keluar dengan sourceType SALE
     */
    it("should record stock out with SALE sourceType", async () => {
      prisma.stockMovement.create.mockResolvedValue({ id: "sm-2", type: "OUT" });

      const result = await repo.recordStockOut("prod-1", 3, "user-1", "oi-1", "Terjual", "SALE");

      expect(result.type).toBe("OUT");
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: "prod-1",
          type: "OUT",
          quantity: 3,
          sourceType: "SALE",
          orderItemId: "oi-1",
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Mencatat stok keluar dengan nilai default
     */
    it("should record stock out with default values", async () => {
      prisma.stockMovement.create.mockResolvedValue({});

      await repo.recordStockOut("prod-1", 2, "user-1");

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderItemId: null,
          note: null,
          sourceType: "SALE",
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe recordAdjustment
   */
  describe("recordAdjustment", () => {
    /**
     * @test Mencatat penyesuaian stok
     */
    it("should record stock adjustment", async () => {
      prisma.stockMovement.create.mockResolvedValue({ id: "sm-3", type: "ADJUSTMENT" });

      const result = await repo.recordAdjustment("prod-1", 10, "user-1", "Penyesuaian tahunan");

      expect(result.type).toBe("ADJUSTMENT");
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ADJUSTMENT",
          sourceType: "ADJUSTMENT",
          quantity: 10,
          note: "Penyesuaian tahunan",
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Mencatat penyesuaian dengan note null
     */
    it("should record adjustment with null note", async () => {
      prisma.stockMovement.create.mockResolvedValue({});

      await repo.recordAdjustment("prod-1", -5, "user-1");

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          note: null,
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findByProductId
   */
  describe("findByProductId", () => {
    /**
     * @test Mendelegasikan ke findMany dengan productId
     */
    it("should delegate to findMany with productId", async () => {
      prisma.stockMovement.count.mockResolvedValue(5);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await repo.findByProductId("prod-1", { page: 1, limit: 20 });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: "prod-1" },
          take: 20,
        })
      );
    });
  });

  /**
   * @describe findByOrderId
   */
  describe("findByOrderId", () => {
    /**
     * @test Mengembalikan pergerakan stok berdasarkan order ID
     */
    it("should return movements by order ID", async () => {
      const mockMovements = [
        { id: "sm-1", type: "OUT", quantity: 2, orderItem: { id: "oi-1", order: { id: "order-1", orderNumber: "ORD-001" } } },
      ];

      prisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const result = await repo.findByOrderId("order-1");

      expect(result).toEqual(mockMovements);
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { orderItem: { orderId: "order-1" } },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pergerakan
     */
    it("should return empty array when no movements", async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await repo.findByOrderId("order-99");

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe getStockSummary
   */
  describe("getStockSummary", () => {
    /**
     * @test Mengembalikan ringkasan stok
     */
    it("should return stock summary", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([
        { type: "IN", _sum: { quantity: 500 }, _count: { id: 10 } },
        { type: "OUT", _sum: { quantity: 300 }, _count: { id: 25 } },
        { type: "ADJUSTMENT", _sum: { quantity: 10 }, _count: { id: 2 } },
      ]);

      const result = await repo.getStockSummary({});

      expect(result).toEqual({
        totalIn: 500,
        totalOut: 300,
        totalAdjustment: 10,
        totalMovements: 37,
      });
    });

    /**
     * @test Mengembalikan nol ketika tidak ada pergerakan
     */
    it("should return zeros when no movements", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([]);

      const result = await repo.getStockSummary({});

      expect(result.totalIn).toBe(0);
      expect(result.totalMovements).toBe(0);
    });

    /**
     * @test Menerapkan filter rentang tanggal
     */
    it("should apply date range filter", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([]);

      await repo.getStockSummary({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.stockMovement.groupBy).toHaveBeenCalledWith({
        by: ["type"],
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        _sum: { quantity: true },
        _count: { id: true },
      });
    });
  });

  /**
   * @describe getTopMovedProducts
   */
  describe("getTopMovedProducts", () => {
    /**
     * @test Mengembalikan produk dengan pergerakan terbanyak
     */
    it("should return top moved products with default limit", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([
        { productId: "prod-1", _sum: { quantity: 200 }, _count: { id: 50 } },
        { productId: "prod-2", _sum: { quantity: 150 }, _count: { id: 40 } },
      ]);

      const result = await repo.getTopMovedProducts({});

      expect(result).toHaveLength(2);
      expect(prisma.stockMovement.groupBy).toHaveBeenCalledWith({
        by: ["productId"],
        where: {},
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      });
    });

    /**
     * @test Mengembalikan dengan limit kustom
     */
    it("should return top moved products with custom limit", async () => {
      prisma.stockMovement.groupBy.mockResolvedValue([]);

      await repo.getTopMovedProducts({ limit: 5 });

      expect(prisma.stockMovement.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus record pergerakan stok
     */
    it("should delete a stock movement by ID", async () => {
      prisma.stockMovement.delete.mockResolvedValue({});

      await repo.delete("sm-1");

      expect(prisma.stockMovement.delete).toHaveBeenCalledWith({
        where: { id: "sm-1" },
      });
    });
  });

  /**
   * @describe fullSelect getter
   */
  describe("fullSelect getter", () => {
    /**
     * @test Mengembalikan fullSelect object
     */
    it("should return fullSelect object", () => {
      const select = repo.fullSelect;

      expect(select).toBeDefined();
      expect(select.id).toBe(true);
      expect(select.product).toBeDefined();
      expect(select.orderItem).toBeDefined();
      expect(select.recordedBy).toBeDefined();
    });
  });

  /**
   * @describe listSelect getter
   */
  describe("listSelect getter", () => {
    /**
     * @test Mengembalikan listSelect object
     */
    it("should return listSelect object", () => {
      const select = repo.listSelect;

      expect(select).toBeDefined();
      expect(select.id).toBe(true);
      expect(select.product).toBeDefined();
      expect(select.orderItem).toBeDefined();
      expect(select.recordedBy).toBeDefined();
    });
  });
});