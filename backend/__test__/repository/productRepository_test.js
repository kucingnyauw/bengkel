import prisma from "#app/database.js";
import ProductRepository from "#repository/productRepository.js";

jest.mock("#app/database.js", () => ({
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  productPriceHistory: {
    create: jest.fn(),
  },
}));

/**
 * Unit test untuk ProductRepository
 * @describe ProductRepository
 */
describe("ProductRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ProductRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat produk baru dengan semua field
     */
    it("should create a product with all fields", async () => {
      const input = {
        name: "Oli Mesin Motul",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        description: "Oli mesin berkualitas tinggi",
        price: 150000,
        cost: 100000,
        stock: 50,
        imageId: "file-1",
      };

      const expected = {
        id: "prod-1",
        name: "Oli Mesin Motul",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        description: "Oli mesin berkualitas tinggi",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: { id: "file-1", fileName: "oli.jpg", path: "products/oli.jpg" },
        priceHistory: [],
      };

      prisma.product.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: "Oli Mesin Motul",
          sku: "SP-OLI-001",
          type: "SPAREPART",
          description: "Oli mesin berkualitas tinggi",
          price: 150000,
          cost: 100000,
          stock: 50,
          isActive: true,
          imageId: "file-1",
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          sku: true,
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });

    /**
     * @test Membuat produk dengan nilai default
     */
    it("should create a product with default values", async () => {
      const input = {
        name: "Service Ringan",
        sku: "SV-SVC-001",
        price: 75000,
      };

      prisma.product.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "SPAREPART",
          cost: 0,
          stock: 0,
          isActive: true,
          imageId: undefined,
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
     * @test Mengembalikan produk lengkap dengan gambar dan riwayat harga
     */
    it("should return full product with image and price history", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: { id: "file-1", fileName: "oli.jpg", path: "products/oli.jpg" },
        priceHistory: [
          { id: "ph-1", price: 150000, cost: 100000, effectiveFrom: new Date() },
        ],
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repo.findById("prod-1");

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        select: expect.objectContaining({
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika produk tidak ditemukan
     */
    it("should return null when product not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.findById("prod-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findBySku
   */
  describe("findBySku", () => {
    /**
     * @test Mengembalikan produk berdasarkan SKU
     */
    it("should return product by SKU", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        priceHistory: [],
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repo.findBySku("SP-OLI-001");

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { sku: "SP-OLI-001" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika SKU tidak ditemukan
     */
    it("should return null when SKU not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.findBySku("SKU-NOT-FOUND");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan produk dengan paginasi default
     */
    it("should return products with default pagination", async () => {
      const mockData = [
        {
          id: "prod-1",
          name: "Oli Mesin",
          sku: "SP-OLI-001",
          type: "SPAREPART",
          price: 150000,
          cost: 100000,
          stock: 50,
          isActive: true,
          createdAt: new Date(),
          image: { id: "file-1", path: "products/oli.jpg" },
        },
      ];

      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan produk dengan filter pencarian
     */
    it("should return products filtered by search", async () => {
      prisma.product.count.mockResolvedValue(3);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Oli" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "Oli", mode: "insensitive" } },
              { sku: { contains: "Oli", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    /**
     * @test Mengembalikan produk dengan filter tipe
     */
    it("should return products filtered by type", async () => {
      prisma.product.count.mockResolvedValue(5);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ type: "SERVICE" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SERVICE" },
        })
      );
    });

    /**
     * @test Mengembalikan produk dengan filter isActive
     */
    it("should return products filtered by isActive", async () => {
      prisma.product.count.mockResolvedValue(10);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ isActive: "true" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    /**
     * @test Mengembalikan produk dengan filter isActive boolean
     */
    it("should handle boolean isActive filter", async () => {
      prisma.product.count.mockResolvedValue(2);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ isActive: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: false },
        })
      );
    });

    /**
     * @test Mengembalikan produk stok rendah
     */
    it("should return low stock products", async () => {
      prisma.product.count.mockResolvedValue(4);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ lowStockThreshold: "5" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: "SPAREPART",
            stock: { lte: 5 },
          },
        })
      );
    });

    /**
     * @test Mengembalikan produk dengan filter harga
     */
    it("should return products filtered by price range", async () => {
      prisma.product.count.mockResolvedValue(6);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ minPrice: "50000", maxPrice: "200000" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            price: { gte: 50000, lte: 200000 },
          },
        })
      );
    });

    /**
     * @test Mengembalikan produk dengan sorting kustom
     */
    it("should return products with custom sorting", async () => {
      prisma.product.count.mockResolvedValue(8);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ sortBy: "price", sortOrder: "asc" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: "asc" },
        })
      );
    });

    /**
     * @test Mengabaikan field sorting yang tidak valid
     */
    it("should ignore invalid sort field", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ sortBy: "invalidField", sortOrder: "asc" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada produk
     */
    it("should return empty array when no products", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.product.findMany.mockResolvedValue([]);

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
     * @test Mengupdate data produk
     */
    it("should update a product with given data", async () => {
      const updateData = { name: "Oli Updated", price: 175000 };
      const expected = {
        id: "prod-1",
        name: "Oli Updated",
        sku: "SP-OLI-001",
        price: 175000,
        cost: 100000,
        stock: 50,
        image: null,
        priceHistory: [],
      };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.update("prod-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: updateData,
        select: expect.objectContaining({
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });
  });

  /**
   * @describe updateStatus
   */
  describe("updateStatus", () => {
    /**
     * @test Mengupdate status aktif produk
     */
    it("should update product active status", async () => {
      const expected = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        isActive: false,
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("prod-1", false);

      expect(result.isActive).toBe(false);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          sku: true,
          isActive: true,
          updatedAt: true,
        },
      });
    });
  });

  /**
   * @describe deactivate
   */
  describe("deactivate", () => {
    /**
     * @test Menonaktifkan produk
     */
    it("should deactivate a product", async () => {
      const expected = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        isActive: false,
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.deactivate("prod-1");

      expect(result.isActive).toBe(false);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isActive: false },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe activate
   */
  describe("activate", () => {
    /**
     * @test Mengaktifkan kembali produk
     */
    it("should activate a product", async () => {
      const expected = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        isActive: true,
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.activate("prod-1");

      expect(result.isActive).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isActive: true },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe updateStock
   */
  describe("updateStock", () => {
    /**
     * @test Menambah stok produk
     */
    it("should increment product stock", async () => {
      const expected = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        stock: 60,
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.updateStock("prod-1", 10, true);

      expect(result.stock).toBe(60);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { increment: 10 } },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          updatedAt: true,
        },
      });
    });

    /**
     * @test Mengurangi stok produk
     */
    it("should decrement product stock", async () => {
      const expected = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        stock: 40,
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(expected);

      await repo.updateStock("prod-1", 10, false);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { decrement: 10 } },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe isSkuExists
   */
  describe("isSkuExists", () => {
    /**
     * @test Mengembalikan true ketika SKU sudah digunakan
     */
    it("should return true when SKU exists", async () => {
      prisma.product.findFirst.mockResolvedValue({ id: "prod-1" });

      const result = await repo.isSkuExists("SP-OLI-001");

      expect(result).toBe(true);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { sku: "SP-OLI-001" },
        select: { id: true },
      });
    });

    /**
     * @test Mengembalikan false ketika SKU belum digunakan
     */
    it("should return false when SKU does not exist", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      const result = await repo.isSkuExists("SKU-NEW");

      expect(result).toBe(false);
    });

    /**
     * @test Mengecualikan ID tertentu saat pengecekan
     */
    it("should exclude specific ID when checking", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await repo.isSkuExists("SP-OLI-001", "prod-1");

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          sku: "SP-OLI-001",
          id: { not: "prod-1" },
        },
        select: { id: true },
      });
    });
  });

  /**
   * @describe getLowStockProducts
   */
  describe("getLowStockProducts", () => {
    /**
     * @test Mengembalikan produk dengan stok rendah dengan threshold default
     */
    it("should return low stock products with default threshold", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Oli", sku: "SP-001", stock: 3, price: 150000, cost: 100000 },
        { id: "prod-2", name: "Filter", sku: "SP-002", stock: 0, price: 50000, cost: 30000 },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await repo.getLowStockProducts();

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          type: "SPAREPART",
          stock: { lte: 5 },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          price: true,
          cost: true,
        },
        orderBy: { stock: "asc" },
      });
    });

    /**
     * @test Mengembalikan produk stok rendah dengan threshold kustom
     */
    it("should return low stock products with custom threshold", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.getLowStockProducts(10);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { lte: 10 },
          }),
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada produk stok rendah
     */
    it("should return empty array when no low stock products", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await repo.getLowStockProducts();

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe createPriceHistory
   */
  describe("createPriceHistory", () => {
    /**
     * @test Mencatat riwayat harga produk
     */
    it("should create a price history record", async () => {
      prisma.productPriceHistory.create.mockResolvedValue({});

      await repo.createPriceHistory("prod-1", 175000, 120000);

      expect(prisma.productPriceHistory.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-1",
          price: 175000,
          cost: 120000,
          effectiveFrom: expect.any(Date),
        },
      });
    });
  });

  /**
   * @describe findServices
   */
  describe("findServices", () => {
    /**
     * @test Mengembalikan daftar produk service aktif
     */
    it("should return active service products", async () => {
      const mockServices = [
        { id: "svc-1", name: "Ganti Oli", description: "Ganti oli mesin", price: 75000, cost: 30000 },
        { id: "svc-2", name: "Tune Up", description: "Tune up mesin", price: 150000, cost: 60000 },
      ];

      prisma.product.findMany.mockResolvedValue(mockServices);

      const result = await repo.findServices({});

      expect(result).toEqual(mockServices);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { type: "SERVICE", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          cost: true,
        },
        orderBy: { name: "asc" },
      });
    });

    /**
     * @test Mengembalikan service dengan filter isActive
     */
    it("should return services filtered by isActive", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findServices({ isActive: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SERVICE", isActive: false },
        })
      );
    });
  });

  /**
   * @describe findSpareparts
   */
  describe("findSpareparts", () => {
    /**
     * @test Mengembalikan daftar produk sparepart aktif
     */
    it("should return active sparepart products", async () => {
      const mockSpareparts = [
        {
          id: "sp-1",
          name: "Oli Mesin",
          sku: "SP-001",
          price: 150000,
          cost: 100000,
          stock: 50,
          image: { id: "file-1", path: "products/oli.jpg" },
        },
      ];

      prisma.product.findMany.mockResolvedValue(mockSpareparts);

      const result = await repo.findSpareparts({});

      expect(result).toEqual(mockSpareparts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { type: "SPAREPART", isActive: true },
        select: expect.objectContaining({
          id: true,
          name: true,
          sku: true,
          stock: true,
          image: expect.any(Object),
        }),
        orderBy: { name: "asc" },
      });
    });

    /**
     * @test Mengembalikan sparepart dengan stok tersedia saja
     */
    it("should return only in-stock spareparts", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findSpareparts({ inStockOnly: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SPAREPART", isActive: true, stock: { gt: 0 } },
        })
      );
    });

    /**
     * @test Mengembalikan sparepart dengan filter isActive
     */
    it("should return spareparts filtered by isActive", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findSpareparts({ isActive: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SPAREPART", isActive: false },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada sparepart
     */
    it("should return empty array when no spareparts", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await repo.findSpareparts({});

      expect(result).toEqual([]);
    });
  });
});