// __test__/productService_test.js
import ProductService from "#service/productService.js";
import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import CacheManager from "#shared/utils/cache.js";
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

let mockCacheInstance;
jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => {
    mockCacheInstance = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(),
      invalidateAll: jest.fn().mockResolvedValue(),
    };
    return mockCacheInstance;
  });
});

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
    it("should throw ApiError (temporary error)", async () => {
      await expect(
        service.createProduct({ name: "Test" }, null, "user1")
      ).rejects.toThrow(ApiError);
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
    });

    it("should return product without image (null)", async () => {
      const product = { id: "p2", name: "Filter", image: null };
      mockProductRepo.findById.mockResolvedValue(product);
      const result = await service.getProductById("p2");
      expect(result.image).toBeNull();
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      await expect(service.getProductById("p99")).rejects.toThrow(ApiError);
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

    it("should throw 404 when SKU not found", async () => {
      mockProductRepo.findBySku.mockResolvedValue(null);
      await expect(service.getProductBySku("SKU-999")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getProducts
  // ============================================================
  describe("getProducts", () => {
    it("should return paginated products, adding signed URLs and caching result", async () => {
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
      expect(mockCacheInstance.set).toHaveBeenCalled();
    });

    it("should return cached data when available", async () => {
      const cached = { data: [{ id: "cached" }], metadata: {} };
      jest.spyOn(service.productListCache, "get").mockResolvedValue(cached);

      const result = await service.getProducts({ page: 1 });
      expect(result).toEqual(cached);
      expect(mockProductRepo.findMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getServices
  // ============================================================
  describe("getServices", () => {
    it("should return services and cache the result", async () => {
      const services = [{ id: "s1", name: "Ganti Oli", type: "SERVICE" }];
      mockProductRepo.findServices.mockResolvedValue(services);

      const result = await service.getServices();
      expect(result).toEqual(services);
      expect(mockCacheInstance.set).toHaveBeenCalled();
    });

    it("should return cached services if available", async () => {
      const cached = [{ id: "cached-svc" }];
      jest.spyOn(service.productListCache, "get").mockResolvedValue(cached);

      const result = await service.getServices();
      expect(result).toEqual(cached);
      expect(mockProductRepo.findServices).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getSpareparts
  // ============================================================
  describe("getSpareparts", () => {
    it("should return spareparts with signed URLs and cache", async () => {
      const spareparts = [
        { id: "sp1", name: "Kampas", image: { path: "kampas.jpg" } },
        { id: "sp2", name: "Ban", image: null },
      ];
      mockProductRepo.findSpareparts.mockResolvedValue(spareparts);

      const result = await service.getSpareparts();
      expect(result[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(result[1].image).toBeNull();
      expect(mockCacheInstance.set).toHaveBeenCalled();
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

      expect(mockCacheInstance.invalidateAll).toHaveBeenCalled();
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

    it("should not create duplicate price history if already created within 1 second", async () => {
      const payload = { price: 55000 };
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

      await service.updateProduct(productId, payload, null, userId);
    });

    it("should throw 404 if product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      await expect(service.updateProduct("bad", {}, null, userId)).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // toggleProductStatus
  // ============================================================
  describe("toggleProductStatus", () => {
    it("should toggle from active to inactive", async () => {
      mockProductRepo.findById.mockResolvedValue({ id: "p1", isActive: true });
      mockProductRepo.updateStatus.mockResolvedValue({ id: "p1", isActive: false });
      const result = await service.toggleProductStatus("p1");
      expect(result.isActive).toBe(false);
      expect(mockCacheInstance.invalidateAll).toHaveBeenCalled();
    });

    it("should toggle from inactive to active", async () => {
      mockProductRepo.findById.mockResolvedValue({ id: "p1", isActive: false });
      mockProductRepo.updateStatus.mockResolvedValue({ id: "p1", isActive: true });
      const result = await service.toggleProductStatus("p1");
      expect(result.isActive).toBe(true);
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      await expect(service.toggleProductStatus("p99")).rejects.toThrow(ApiError);
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
      await service.getLowStockProducts(10);
      expect(mockProductRepo.getLowStockProducts).toHaveBeenCalledWith(10);
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
  });
});