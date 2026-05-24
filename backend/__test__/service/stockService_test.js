import StockService from "#service/stockService.js";

jest.mock("#repository/stockRepository.js");
jest.mock("#repository/productRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/notificationRepository.js");

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      product: { update: jest.fn().mockResolvedValue({}) },
    })
  ),
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: "user-1", fullName: "User 1" }),
    findMany: jest.fn().mockResolvedValue([{ id: "admin-1", fullName: "Admin", isActive: true }]),
  },
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk StockService
 * @describe StockService
 */
describe("StockService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StockService();

    const { SettingRepository } = require("#repository/settingRepository.js");
    SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ value: "5" });

    const { NotificationRepository } = require("#repository/notificationRepository.js");
    NotificationRepository.mock.instances[0].create.mockResolvedValue({});
  });

  /**
   * @describe recordStockIn
   */
  describe("recordStockIn", () => {
    const productId = "prod-1";
    const quantity = 10;
    const recordedById = "user-1";
    const note = "Restock dari supplier";
    const sourceType = "PURCHASE";

    const mockProduct = {
      id: productId, name: "Oli Mesin", sku: "SP-ABC123", type: "SPAREPART",
      stock: 5, cost: 30000, price: 50000, isActive: true,
    };

    beforeEach(() => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue(mockProduct);
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({
        id: "sm-1", productId, type: "IN", sourceType, quantity, recordedById, note,
      });
    });

    /**
     * @test Mencatat stok masuk berhasil
     */
    it("should record stock in successfully", async () => {
      const result = await service.recordStockIn(productId, quantity, recordedById, note, sourceType);
      expect(result.type).toBe("IN");
    });

    /**
     * @test Menggunakan nilai default
     */
    it("should use default values", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      await service.recordStockIn(productId, quantity, recordedById);

      expect(StockRepository.mock.instances[0].createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sourceType: "MANUAL", note: null })
      );
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.recordStockIn(productId, quantity, recordedById)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 400 ketika produk SERVICE
     */
    it("should throw 400 when product is SERVICE", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({ ...mockProduct, type: "SERVICE" });

      await expect(service.recordStockIn(productId, quantity, recordedById)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe recordStockOut
   */
  describe("recordStockOut", () => {
    const productId = "prod-1";
    const quantity = 3;
    const recordedById = "user-1";
    const orderItemId = "oi-1";
    const note = "Stok keluar untuk penjualan";
    const sourceType = "SALE";

    const mockProduct = {
      id: productId, name: "Oli Mesin", sku: "SP-ABC123", type: "SPAREPART",
      stock: 5, cost: 30000, price: 50000, isActive: true,
    };

    beforeEach(() => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue(mockProduct);
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({
        id: "sm-2", productId, type: "OUT", sourceType, quantity, recordedById, orderItemId, note,
      });
    });

    /**
     * @test Mencatat stok keluar berhasil
     */
    it("should record stock out successfully", async () => {
      const result = await service.recordStockOut(productId, quantity, recordedById, orderItemId, note, sourceType);
      expect(result.type).toBe("OUT");
    });

    /**
     * @test Melempar 400 ketika stok tidak mencukupi
     */
    it("should throw 400 when stock insufficient", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({ ...mockProduct, stock: 2 });

      await expect(service.recordStockOut(productId, 3, recordedById)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.recordStockOut(productId, quantity, recordedById)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe recordSaleOut
   */
  describe("recordSaleOut", () => {
    /**
     * @test Memanggil recordStockOut dengan sourceType SALE
     */
    it("should call recordStockOut with SALE sourceType", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "prod-1", name: "Filter", sku: "SP-DEF", type: "SPAREPART", stock: 10, cost: 20000, price: 35000,
      });
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({ id: "sm-sale", type: "OUT", sourceType: "SALE" });

      await service.recordSaleOut("prod-1", 2, "user-1", "oi-1");

      expect(StockRepository.mock.instances[0].createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sourceType: "SALE" })
      );
    });
  });

  /**
   * @describe recordReturnIn
   */
  describe("recordReturnIn", () => {
    /**
     * @test Memanggil recordStockIn dengan sourceType RETURN
     */
    it("should call recordStockIn with RETURN sourceType", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "prod-1", name: "Ban", sku: "SP-GHI", type: "SPAREPART", stock: 3, cost: 25000, price: 45000,
      });
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({ id: "sm-return", type: "IN", sourceType: "RETURN" });

      await service.recordReturnIn("prod-1", 5, "user-1");

      expect(StockRepository.mock.instances[0].createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sourceType: "RETURN", note: "Retur barang dari pelanggan" })
      );
    });
  });

  /**
   * @describe recordAdjustment
   */
  describe("recordAdjustment", () => {
    const productId = "prod-1";
    const recordedById = "user-1";
    const note = "Penyesuaian stok";
    const mockProduct = {
      id: productId, name: "Oli Gardan", sku: "SP-MNO", type: "SPAREPART",
      stock: 10, cost: 35000, price: 60000, isActive: true,
    };

    beforeEach(() => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue(mockProduct);
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({
        id: "adj-1", type: "ADJUSTMENT", sourceType: "ADJUSTMENT", quantity: 5, recordedById, note,
      });
    });

    /**
     * @test Mencatat penyesuaian positif
     */
    it("should record positive adjustment", async () => {
      const result = await service.recordAdjustment(productId, 5, recordedById, note);
      expect(result.quantity).toBe(5);
    });

    /**
     * @test Mencatat penyesuaian negatif
     */
    it("should record negative adjustment if stock sufficient", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue({ ...mockProduct, stock: 10 });
      StockRepository.mock.instances[0].createInTransaction.mockResolvedValue({ id: "adj-2", quantity: -3 });

      await service.recordAdjustment(productId, -3, recordedById, note);

      expect(StockRepository.mock.instances[0].createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quantity: -3 })
      );
    });

    /**
     * @test Melempar 400 ketika penyesuaian negatif melebihi stok
     */
    it("should throw 400 when negative adjustment exceeds stock", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({ ...mockProduct, stock: 2 });

      await expect(service.recordAdjustment(productId, -5, recordedById, note)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.recordAdjustment(productId, 1, recordedById, note)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getStockMovements
   */
  describe("getStockMovements", () => {
    /**
     * @test Mengembalikan mutasi stok dengan paginasi
     */
    it("should return paginated stock movements", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [{ id: "sm1", type: "IN", quantity: 10 }],
        metadata: { total: 1 },
      });

      const result = await service.getStockMovements({ page: 1 });
      expect(result.data).toHaveLength(1);
    });
  });

  /**
   * @describe getStockMovementById
   */
  describe("getStockMovementById", () => {
    /**
     * @test Mengembalikan mutasi stok
     */
    it("should return stock movement", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findById.mockResolvedValue({ id: "sm1", type: "IN", quantity: 10 });

      const result = await service.getStockMovementById("sm1");
      expect(result.id).toBe("sm1");
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getStockMovementById("sm99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getMovementsByProduct
   */
  describe("getMovementsByProduct", () => {
    /**
     * @test Mengembalikan mutasi untuk produk
     */
    it("should return movements for product", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { StockRepository } = require("#repository/stockRepository.js");

      ProductRepository.mock.instances[0].findById.mockResolvedValue({ id: "prod-1", name: "Oli" });
      StockRepository.mock.instances[0].findByProductId.mockResolvedValue({
        data: [{ id: "sm1" }], metadata: { total: 1 },
      });

      const result = await service.getMovementsByProduct("prod-1", {});
      expect(result.data).toHaveLength(1);
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getMovementsByProduct("bad")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getMovementsByOrder
   */
  describe("getMovementsByOrder", () => {
    /**
     * @test Mengembalikan mutasi untuk order
     */
    it("should return movements for order", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findByOrderId.mockResolvedValue([{ id: "sm1" }]);

      const result = await service.getMovementsByOrder("order-1");
      expect(result).toHaveLength(1);
    });
  });

  /**
   * @describe deleteStockMovement
   */
  describe("deleteStockMovement", () => {
    /**
     * @test Menghapus mutasi stok
     */
    it("should delete stock movement", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findById.mockResolvedValue({
        id: "sm-1", productId: "prod-1", type: "IN", quantity: 10,
      });
      StockRepository.mock.instances[0].delete.mockResolvedValue();

      await expect(service.deleteStockMovement("sm-1")).resolves.toBeUndefined();
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { StockRepository } = require("#repository/stockRepository.js");
      StockRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.deleteStockMovement("sm-99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});