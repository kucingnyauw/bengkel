// __test__/stockService_test.js
import StockService from "#service/stockService.js";
import StockRepository from "#repository/stockRepository.js";
import ProductRepository from "#repository/productRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";

// Mock repositories
jest.mock("#repository/stockRepository.js");
jest.mock("#repository/productRepository.js");

// Mock prisma client with transaction support
jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      product: {
        update: jest.fn().mockResolvedValue({}),
      },
      // stockRepo.createInTransaction will be called separately within the transaction
    })
  ),
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("StockService", () => {
  let service;
  let mockStockRepo;
  let mockProductRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new StockService();

    // Get mock instances for each repository
    mockStockRepo = StockRepository.mock.instances[0];
    mockProductRepo = ProductRepository.mock.instances[0];
  });

  // ============================================================
  // recordStockIn
  // ============================================================
  describe("recordStockIn", () => {
    const productId = "prod-1";
    const quantity = 10;
    const recordedById = "user-1";
    const note = "Restock dari supplier";
    const sourceType = "PURCHASE";

    const mockProduct = {
      id: productId,
      name: "Oli Mesin",
      type: "SPAREPART",
      stock: 5,
      isActive: true,
    };

    beforeEach(() => {
      // Default successful path
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      // Mock the createInTransaction method within the transaction
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-1",
        productId,
        type: "IN",
        sourceType,
        quantity,
        recordedById,
        note,
      });
    });

    it("should record stock in successfully for a spare part product", async () => {
      const result = await service.recordStockIn(
        productId,
        quantity,
        recordedById,
        note,
        sourceType
      );

      // Check product validation
      expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);

      // Ensure transaction was called
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Inside transaction, product update and createInTransaction should have been invoked
      // We can't directly spy on the transaction's product.update, but we can check that
      // stockRepo.createInTransaction was called with the correct parameters.
      // The prisma.$transaction mock will call the callback synchronously.
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(), // transaction object
        expect.objectContaining({
          productId,
          type: "IN",
          sourceType,
          quantity,
          recordedById,
          note,
        })
      );

      // Check result
      expect(result).toEqual(
        expect.objectContaining({
          productId,
          type: "IN",
          quantity,
        })
      );
    });

    it("should use default values for note and sourceType", async () => {
      await service.recordStockIn(productId, quantity, recordedById);

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId,
          type: "IN",
          sourceType: "MANUAL",
          quantity,
          recordedById,
          note: null,
        })
      );
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when product is not a spare part (SERVICE)", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when product is not a spare part (PRODUCT)", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "PRODUCT", // not SPAREPART
      });

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // recordStockOut
  // ============================================================
  describe("recordStockOut", () => {
    const productId = "prod-1";
    const quantity = 3;
    const recordedById = "user-1";
    const orderItemId = "oi-1";
    const note = "Stok keluar untuk penjualan";
    const sourceType = "SALE";

    const mockProduct = {
      id: productId,
      name: "Oli Mesin",
      type: "SPAREPART",
      stock: 5,
      isActive: true,
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-2",
        productId,
        type: "OUT",
        sourceType,
        quantity,
        recordedById,
        orderItemId,
        note,
      });
    });

    it("should record stock out successfully", async () => {
      const result = await service.recordStockOut(
        productId,
        quantity,
        recordedById,
        orderItemId,
        note,
        sourceType
      );

      expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId,
          type: "OUT",
          sourceType,
          quantity,
          recordedById,
          orderItemId,
          note,
        })
      );
      expect(result.type).toBe("OUT");
    });

    it("should use default values for optional parameters", async () => {
      await service.recordStockOut(productId, quantity, recordedById);

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderItemId: null,
          note: null,
          sourceType: "MANUAL",
        })
      );
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when product is not spare part", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when stock is insufficient", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        stock: 2, // less than quantity 3
      });

      await expect(
        service.recordStockOut(productId, 3, recordedById)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordStockOut(productId, 3, recordedById)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // recordSaleOut
  // ============================================================
  describe("recordSaleOut", () => {
    it("should call recordStockOut with sourceType SALE", async () => {
      // Arrange
      const productId = "prod-1";
      const quantity = 2;
      const recordedById = "user-1";
      const orderItemId = "oi-1";

      mockProductRepo.findById.mockResolvedValue({
        id: productId,
        name: "Filter Udara",
        type: "SPAREPART",
        stock: 10,
      });
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-sale",
        productId,
        type: "OUT",
        sourceType: "SALE",
      });

      // Act
      await service.recordSaleOut(productId, quantity, recordedById, orderItemId);

      // Assert
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceType: "SALE",
          orderItemId,
          note: null,
        })
      );
    });
  });

  // ============================================================
  // recordReturnIn
  // ============================================================
  describe("recordReturnIn", () => {
    it("should call recordStockIn with sourceType RETURN and default note", async () => {
      const productId = "prod-1";
      const quantity = 5;
      const recordedById = "user-1";

      mockProductRepo.findById.mockResolvedValue({
        id: productId,
        name: "Ban Dalam",
        type: "SPAREPART",
        stock: 3,
      });
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-return",
        productId,
        type: "IN",
        sourceType: "RETURN",
        note: "Retur barang",
      });

      await service.recordReturnIn(productId, quantity, recordedById);

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceType: "RETURN",
          note: "Retur barang",
        })
      );
    });

    it("should use custom note if provided", async () => {
      const productId = "prod-1";
      const quantity = 2;
      const recordedById = "user-1";
      const customNote = "Retur dari customer A";

      mockProductRepo.findById.mockResolvedValue({
        id: productId,
        name: "Kampas Rem",
        type: "SPAREPART",
        stock: 8,
      });
      mockStockRepo.createInTransaction.mockResolvedValue({});

      await service.recordReturnIn(productId, quantity, recordedById, customNote);

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          note: customNote,
        })
      );
    });
  });

  // ============================================================
  // recordAdjustment
  // ============================================================
  describe("recordAdjustment", () => {
    const productId = "prod-1";
    const recordedById = "user-1";
    const note = "Penyesuaian stok tahunan";
    const mockProduct = {
      id: productId,
      name: "Oli Gardan",
      type: "SPAREPART",
      stock: 10,
      isActive: true,
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "adj-1",
        productId,
        type: "ADJUSTMENT",
        sourceType: "ADJUSTMENT",
        quantity: 5,
        recordedById,
        note,
      });
    });

    it("should record positive adjustment (increase stock)", async () => {
      const result = await service.recordAdjustment(
        productId,
        5,
        recordedById,
        note
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: "ADJUSTMENT",
          sourceType: "ADJUSTMENT",
          quantity: 5,
          note,
        })
      );
      expect(result.quantity).toBe(5);
    });

    it("should record negative adjustment (decrease stock) if stock sufficient", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        stock: 10,
      });
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "adj-2",
        quantity: -3,
      });

      await service.recordAdjustment(productId, -3, recordedById, note);

      // Should not throw
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quantity: -3 })
      );
    });

    it("should throw 400 when negative adjustment exceeds stock", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        stock: 2, // only 2, but try to adjust -5
      });

      await expect(
        service.recordAdjustment(productId, -5, recordedById, note)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordAdjustment(productId, -5, recordedById, note)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordAdjustment(productId, 1, recordedById, note)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordAdjustment(productId, 1, recordedById, note)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when product is not spare part", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordAdjustment(productId, 1, recordedById, note)
      ).rejects.toThrow(ApiError);
      await expect(
        service.recordAdjustment(productId, 1, recordedById, note)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // getStockMovements
  // ============================================================
  describe("getStockMovements", () => {
    it("should return paginated stock movements", async () => {
      const mockResult = {
        data: [
          { id: "sm1", type: "IN", quantity: 10 },
          { id: "sm2", type: "OUT", quantity: 5 },
        ],
        metadata: { total: 2, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockStockRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getStockMovements({ page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(mockStockRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it("should pass all filters to repository", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockStockRepo.findMany.mockResolvedValue(mockResult);

      const query = {
        productId: "p1",
        type: "IN",
        sourceType: "PURCHASE",
        page: 2,
        limit: 20,
      };
      await service.getStockMovements(query);
      expect(mockStockRepo.findMany).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // getStockMovementById
  // ============================================================
  describe("getStockMovementById", () => {
    it("should return stock movement when found", async () => {
      const mockMovement = { id: "sm1", type: "IN", quantity: 10 };
      mockStockRepo.findById.mockResolvedValue(mockMovement);

      const result = await service.getStockMovementById("sm1");
      expect(result).toEqual(mockMovement);
      expect(mockStockRepo.findById).toHaveBeenCalledWith("sm1");
    });

    it("should throw 404 when stock movement not found", async () => {
      mockStockRepo.findById.mockResolvedValue(null);

      await expect(service.getStockMovementById("sm99")).rejects.toThrow(ApiError);
      await expect(service.getStockMovementById("sm99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ============================================================
  // getMovementsByProduct
  // ============================================================
  describe("getMovementsByProduct", () => {
    const productId = "prod-1";

    it("should return paginated movements for a valid product", async () => {
      const mockProduct = { id: productId, name: "Oli Mesin" };
      const mockResult = {
        data: [{ id: "sm1", type: "IN", quantity: 5 }],
        metadata: { total: 1 },
      };

      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.findByProductId.mockResolvedValue(mockResult);

      const result = await service.getMovementsByProduct(productId, {
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockResult);
      expect(mockStockRepo.findByProductId).toHaveBeenCalledWith(productId, {
        page: 1,
        limit: 10,
      });
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.getMovementsByProduct("bad-product")
      ).rejects.toThrow(ApiError);
      await expect(
        service.getMovementsByProduct("bad-product")
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getMovementsByOrder
  // ============================================================
  describe("getMovementsByOrder", () => {
    it("should return movements for a given order", async () => {
      const mockMovements = [
        { id: "sm1", type: "OUT", orderItemId: "oi-1", quantity: 2 },
      ];
      mockStockRepo.findByOrderId.mockResolvedValue(mockMovements);

      const result = await service.getMovementsByOrder("order-1");
      expect(result).toEqual(mockMovements);
      expect(mockStockRepo.findByOrderId).toHaveBeenCalledWith("order-1");
    });
  });

  // ============================================================
  // deleteStockMovement
  // ============================================================
  describe("deleteStockMovement", () => {
    const movementId = "sm-1";

    it("should delete stock movement successfully", async () => {
      const mockMovement = {
        id: movementId,
        productId: "prod-1",
        type: "IN",
        quantity: 10,
      };
      mockStockRepo.findById.mockResolvedValue(mockMovement);
      mockStockRepo.delete.mockResolvedValue(undefined);

      await expect(service.deleteStockMovement(movementId)).resolves.toBeUndefined();

      expect(mockStockRepo.findById).toHaveBeenCalledWith(movementId);
      expect(mockStockRepo.delete).toHaveBeenCalledWith(movementId);
    });

    it("should throw 404 when movement not found", async () => {
      mockStockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteStockMovement(movementId)).rejects.toThrow(ApiError);
      await expect(service.deleteStockMovement(movementId)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(mockStockRepo.delete).not.toHaveBeenCalled();
    });
  });
});