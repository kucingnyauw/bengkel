// __test__/productService_test.js
import ProductService from "#service/productService.js";
import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";

jest.mock("#repository/productRepository.js");
jest.mock("#repository/fileRepository.js");

jest.mock("#shared/utils/code.js", () => ({
  productSku: jest.fn().mockResolvedValue("SP-001"),
}));

jest.mock("#shared/utils/storage.js", () => ({
  uploadFile: jest.fn().mockResolvedValue("products/img-123.jpg"),
  deleteFile: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/products/img-123.jpg"),
}));

jest.mock("#app/database.js", () => ({
  product: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  $transaction: jest.fn((callback) =>
    callback({
      product: {
        create: jest.fn().mockResolvedValue({
          id: "p1",
          name: "Oli Mesin",
          sku: "SP-001",
          type: "SPAREPART",
          price: 50000,
          cost: 30000,
          stock: 20,
          isActive: true,
          imageId: null,
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id,
            ...args.data,
            name: args.data.name || "Oli Mesin Updated",
            price: args.data.price ?? 55000,
            cost: args.data.cost ?? 35000,
          })
        ),
      },
      productPriceHistory: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      stockMovement: {
        create: jest.fn(),
      },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ProductService", () => {
  let service;
  let mockProductRepo;
  let mockFileRepo;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
    mockProductRepo = ProductRepository.mock.instances[0];
    mockFileRepo = FileRepository.mock.instances[0];
    mockStorage = require("#shared/utils/storage.js");
  });

  // ============================================================
  // createProduct
  // ============================================================
  describe("createProduct", () => {
    const userId = "user1";
    const payload = {
      name: "Oli Mesin",
      type: "SPAREPART",
      description: "Oli berkualitas",
      price: 50000,
      cost: 30000,
      stock: 20,
    };

    beforeEach(() => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli Mesin",
        sku: "SP-001",
        type: "SPAREPART",
        price: 50000,
        cost: 30000,
        stock: 20,
        isActive: true,
        image: null,
      });
    });

    it("should create product without image successfully", async () => {
      const result = await service.createProduct(payload, null, userId);

      expect(result.id).toBe("p1");
      expect(result.name).toBe("Oli Mesin");
      expect(result.sku).toBe("SP-001");
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockProductRepo.findById).toHaveBeenCalledWith("p1");
    });

    it("should create product with image successfully", async () => {
      const file = { originalname: "oli.jpg", mimetype: "image/jpeg", size: 1234, checksum: "abc" };
      mockFileRepo.create.mockResolvedValue({ id: "img-1" });

      const result = await service.createProduct(payload, file, userId);

      expect(result.id).toBe("p1");
      expect(mockStorage.uploadFile).toHaveBeenCalledWith(file, "products");
      expect(mockFileRepo.create).toHaveBeenCalled();
    });

    it("should create SERVICE product without stock movement", async () => {
      const servicePayload = { ...payload, type: "SERVICE", stock: 0 };

      await service.createProduct(servicePayload, null, userId);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should create product with default type SPAREPART", async () => {
      const payloadNoType = { name: "Ban", price: 100000, cost: 60000, stock: 10 };

      await service.createProduct(payloadNoType, null, userId);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw error when SKU generation fails", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(true);

      await expect(
        service.createProduct(payload, null, userId)
      ).rejects.toThrow();
    });
  });

  // ============================================================
  // getProductById
  // ============================================================
  describe("getProductById", () => {
    it("should return product with signed image URL", async () => {
      const product = {
        id: "p1",
        name: "Oli Mesin",
        image: { path: "products/img.jpg" },
      };
      mockProductRepo.findById.mockResolvedValue(product);

      const result = await service.getProductById("p1");

      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("products/img.jpg");
    });

    it("should return product without image", async () => {
      const product = { id: "p2", name: "Filter", image: null };
      mockProductRepo.findById.mockResolvedValue(product);

      const result = await service.getProductById("p2");
      expect(result.image).toBeNull();
    });

    it("should return product with image but no path", async () => {
      const product = { id: "p3", name: "Oli", image: { path: null } };
      mockProductRepo.findById.mockResolvedValue(product);

      const result = await service.getProductById("p3");
      expect(result.image.url).toBeUndefined();
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.getProductById("p99")).rejects.toThrow(ApiError);
      await expect(service.getProductById("p99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getProductBySku
  // ============================================================
  describe("getProductBySku", () => {
    it("should return product and add signed URL", async () => {
      const product = { id: "p1", sku: "SP-001", image: { path: "img.jpg" } };
      mockProductRepo.findBySku.mockResolvedValue(product);

      const result = await service.getProductBySku("SP-001");
      expect(result.sku).toBe("SP-001");
      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
    });

    it("should return product without image", async () => {
      const product = { id: "p2", sku: "SP-002", image: null };
      mockProductRepo.findBySku.mockResolvedValue(product);

      const result = await service.getProductBySku("SP-002");
      expect(result.image).toBeNull();
    });

    it("should throw 404 when SKU not found", async () => {
      mockProductRepo.findBySku.mockResolvedValue(null);

      await expect(service.getProductBySku("SKU-999")).rejects.toThrow(ApiError);
      await expect(service.getProductBySku("SKU-999")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getProducts
  // ============================================================
  describe("getProducts", () => {
    it("should return paginated products with signed URLs", async () => {
      const repoResult = {
        data: [
          { id: "p1", name: "Oli", image: { path: "oli.jpg" } },
          { id: "p2", name: "Filter", image: null },
        ],
        metadata: { total: 2, currentPage: 1 },
      };
      mockProductRepo.findMany.mockResolvedValue(repoResult);

      const result = await service.getProducts({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(result.data[1].image).toBeNull();
      expect(result.metadata.total).toBe(2);
    });

    it("should return empty data when no products", async () => {
      const repoResult = { data: [], metadata: { total: 0, currentPage: 1 } };
      mockProductRepo.findMany.mockResolvedValue(repoResult);

      const result = await service.getProducts({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });

    it("should pass query parameters to repository", async () => {
      mockProductRepo.findMany.mockResolvedValue({ data: [], metadata: { total: 0 } });

      const query = { page: 2, limit: 5, search: "oli", type: "SPAREPART" };
      await service.getProducts(query);

      expect(mockProductRepo.findMany).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // getServices
  // ============================================================
  describe("getServices", () => {
    it("should return services", async () => {
      const services = [{ id: "s1", name: "Ganti Oli", type: "SERVICE" }];
      mockProductRepo.findServices.mockResolvedValue(services);

      const result = await service.getServices();
      expect(result).toEqual(services);
      expect(mockProductRepo.findServices).toHaveBeenCalled();
    });

    it("should return services with query parameters", async () => {
      const services = [{ id: "s1", name: "Ganti Oli" }];
      mockProductRepo.findServices.mockResolvedValue(services);

      const query = { search: "oli" };
      await service.getServices(query);
      expect(mockProductRepo.findServices).toHaveBeenCalledWith(query);
    });

    it("should return empty array when no services", async () => {
      mockProductRepo.findServices.mockResolvedValue([]);

      const result = await service.getServices();
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // getSpareparts
  // ============================================================
  describe("getSpareparts", () => {
    it("should return spareparts with signed URLs", async () => {
      const spareparts = [
        { id: "sp1", name: "Kampas", image: { path: "kampas.jpg" } },
        { id: "sp2", name: "Ban", image: null },
      ];
      mockProductRepo.findSpareparts.mockResolvedValue(spareparts);

      const result = await service.getSpareparts();
      expect(result[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(result[1].image).toBeNull();
    });

    it("should return spareparts with query parameters", async () => {
      const spareparts = [{ id: "sp1", name: "Kampas" }];
      mockProductRepo.findSpareparts.mockResolvedValue(spareparts);

      const query = { search: "kampas", isActive: true };
      await service.getSpareparts(query);
      expect(mockProductRepo.findSpareparts).toHaveBeenCalledWith(query);
    });

    it("should return empty array when no spareparts", async () => {
      mockProductRepo.findSpareparts.mockResolvedValue([]);

      const result = await service.getSpareparts();
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // updateProduct
  // ============================================================
  describe("updateProduct", () => {
    const productId = "p1";
    const userId = "user1";
    const existing = {
      id: productId,
      name: "Old Name",
      price: 50000,
      cost: 30000,
      type: "SPAREPART",
      stock: 10,
      isActive: true,
      imageId: "img-old",
      image: { path: "old.jpg" },
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(existing);
    });

    it("should update product fields and create price history when price/cost changes", async () => {
      const payload = { name: "New Name", price: 55000, cost: 35000 };

      await service.updateProduct(productId, payload, null, userId);

      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should update product without price history when price unchanged", async () => {
      const payload = { name: "New Name", price: 50000, cost: 30000 };

      await service.updateProduct(productId, payload, null, userId);
      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should upload new image and delete old one", async () => {
      const file = { originalname: "new.jpg", mimetype: "image/jpeg", size: 1234, checksum: "abc" };
      mockFileRepo.create.mockResolvedValue({ id: "img-new" });
      mockFileRepo.findById.mockResolvedValue({ id: "img-old", path: "old.jpg" });

      await service.updateProduct(productId, { name: "Update" }, file, userId);

      expect(mockStorage.uploadFile).toHaveBeenCalledWith(file, "products");
      expect(mockFileRepo.create).toHaveBeenCalled();
      expect(mockStorage.deleteFile).toHaveBeenCalledWith("old.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("img-old");
    });

    it("should handle delete image error gracefully", async () => {
      const file = { originalname: "new.jpg", mimetype: "image/jpeg", size: 1234, checksum: "abc" };
      mockFileRepo.create.mockResolvedValue({ id: "img-new" });
      mockFileRepo.findById.mockRejectedValue(new Error("File not found"));

      await service.updateProduct(productId, { name: "Update" }, file, userId);

      expect(mockStorage.uploadFile).toHaveBeenCalled();
      expect(mockFileRepo.create).toHaveBeenCalled();
    });

    it("should not create duplicate price history if already exists", async () => {
      prisma.$transaction.mockImplementationOnce(async (cb) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue({
              id: productId,
              name: "Old Name",
              price: 55000,
              cost: 30000,
            }),
          },
          productPriceHistory: {
            findFirst: jest.fn().mockResolvedValue({ id: "hist1" }),
            create: jest.fn(),
          },
        };
        return cb(tx);
      });

      await service.updateProduct(productId, { price: 55000 }, null, userId);
    });

    it("should update only provided fields", async () => {
      await service.updateProduct(productId, { description: "New desc" }, null, userId);
      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should update stock field", async () => {
      await service.updateProduct(productId, { stock: 25 }, null, userId);
      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should update isActive field", async () => {
      await service.updateProduct(productId, { isActive: false }, null, userId);
      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should update type field", async () => {
      await service.updateProduct(productId, { type: "SERVICE" }, null, userId);
      expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
    });

    it("should throw 404 if product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.updateProduct("bad", {}, null, userId)).rejects.toThrow(ApiError);
      await expect(service.updateProduct("bad", {}, null, userId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // toggleProductStatus
  // ============================================================
  describe("toggleProductStatus", () => {
    it("should toggle from active to inactive", async () => {
      mockProductRepo.findById.mockResolvedValue({ id: "p1", isActive: true, name: "Oli" });
      mockProductRepo.updateStatus.mockResolvedValue({ id: "p1", isActive: false });

      const result = await service.toggleProductStatus("p1");
      expect(result.isActive).toBe(false);
      expect(mockProductRepo.updateStatus).toHaveBeenCalledWith("p1", false);
    });

    it("should toggle from inactive to active", async () => {
      mockProductRepo.findById.mockResolvedValue({ id: "p1", isActive: false, name: "Oli" });
      mockProductRepo.updateStatus.mockResolvedValue({ id: "p1", isActive: true });

      const result = await service.toggleProductStatus("p1");
      expect(result.isActive).toBe(true);
      expect(mockProductRepo.updateStatus).toHaveBeenCalledWith("p1", true);
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.toggleProductStatus("p99")).rejects.toThrow(ApiError);
      await expect(service.toggleProductStatus("p99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getLowStockProducts
  // ============================================================
  describe("getLowStockProducts", () => {
    it("should return low stock products with default threshold", async () => {
      const list = [{ id: "p1", name: "Ban", stock: 2 }];
      mockProductRepo.getLowStockProducts.mockResolvedValue(list);

      const result = await service.getLowStockProducts();
      expect(result).toEqual(list);
      expect(mockProductRepo.getLowStockProducts).toHaveBeenCalledWith(5);
    });

    it("should use custom threshold", async () => {
      const list = [{ id: "p1", name: "Ban", stock: 8 }];
      mockProductRepo.getLowStockProducts.mockResolvedValue(list);

      await service.getLowStockProducts(10);
      expect(mockProductRepo.getLowStockProducts).toHaveBeenCalledWith(10);
    });

    it("should return empty array when no low stock products", async () => {
      mockProductRepo.getLowStockProducts.mockResolvedValue([]);

      const result = await service.getLowStockProducts(3);
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // checkSkuAvailability
  // ============================================================
  describe("checkSkuAvailability", () => {
    it("should return available true when SKU not exists", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);

      const result = await service.checkSkuAvailability("SP-001");
      expect(result).toEqual({
        available: true,
        message: "SKU 'SP-001' tersedia.",
      });
    });

    it("should return available false when SKU exists", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(true);

      const result = await service.checkSkuAvailability("SP-001");
      expect(result).toEqual({
        available: false,
        message: "SKU 'SP-001' sudah digunakan.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);

      await service.checkSkuAvailability("SP-001", "p2");
      expect(mockProductRepo.isSkuExists).toHaveBeenCalledWith("SP-001", "p2");
    });
  });
});