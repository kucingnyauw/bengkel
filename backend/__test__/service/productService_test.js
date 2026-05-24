import ProductService from "#service/productService.js";

jest.mock("#repository/productRepository.js");
jest.mock("#repository/fileRepository.js");

jest.mock("#shared/utils/code.js", () => ({
  productSku: jest.fn(),
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
          id: "p1", name: "Oli Mesin", sku: "SP-001", type: "SPAREPART",
          price: 50000, cost: 30000, stock: 20, isActive: true, imageId: null,
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id, ...args.data,
            name: args.data.name || "Updated",
            price: args.data.price ?? 55000,
            cost: args.data.cost ?? 35000,
          })
        ),
      },
      productPriceHistory: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      stockMovement: { create: jest.fn() },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk ProductService
 * @describe ProductService
 */
describe("ProductService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
  });

  /**
   * @describe createProduct
   */
  describe("createProduct", () => {
    const userId = "user1";
    const payload = { name: "Oli Mesin", type: "SPAREPART", price: 50000, cost: 30000, stock: 20 };

    beforeEach(() => {
      const { productSku } = require("#shared/utils/code.js");
      productSku.mockResolvedValue("SP-001");

      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].isSkuExists.mockResolvedValue(false);
      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "p1", name: "Oli Mesin", sku: "SP-001", type: "SPAREPART",
        price: 50000, cost: 30000, stock: 20, isActive: true, image: null,
      });
    });

    /**
     * @test Membuat produk tanpa gambar
     */
    it("should create product without image", async () => {
      const result = await service.createProduct(payload, null, userId);
      expect(result.id).toBe("p1");
      expect(result.sku).toBe("SP-001");
    });

    /**
     * @test Membuat produk dengan nilai default cost dan stock
     */
    it("should use default cost and stock when not provided", async () => {
      await service.createProduct({ name: "Oli", price: 50000 }, null, userId);
      expect(require("#app/database.js").$transaction).toHaveBeenCalled();
    });

    /**
     * @test Membuat produk dengan gambar
     */
    it("should create product with image", async () => {
      const { FileRepository } = require("#repository/fileRepository.js");
      FileRepository.mock.instances[0].create.mockResolvedValue({ id: "img-1" });

      const file = { originalname: "oli.jpg", mimetype: "image/jpeg", size: 1234, checksum: "abc" };
      await service.createProduct(payload, file, userId);

      const { uploadFile } = require("#shared/utils/storage.js");
      expect(uploadFile).toHaveBeenCalledWith(file, "products");
      expect(FileRepository.mock.instances[0].create).toHaveBeenCalled();
    });

    /**
     * @test Menangani SKU collision
     */
    it("should handle SKU collision", async () => {
      const { productSku } = require("#shared/utils/code.js");
      productSku.mockResolvedValueOnce("SP-006").mockResolvedValueOnce("SP-007");

      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].isSkuExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await service.createProduct(payload, null, userId);
      expect(productSku).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @describe getProductById
   */
  describe("getProductById", () => {
    /**
     * @test Mengembalikan produk dengan signed URL
     */
    it("should return product with signed image URL", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "p1", name: "Oli", image: { path: "products/img.jpg" },
      });

      const result = await service.getProductById("p1");
      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getProductById("p99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getProductBySku
   */
  describe("getProductBySku", () => {
    /**
     * @test Mengembalikan produk berdasarkan SKU
     */
    it("should return product by SKU", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findBySku.mockResolvedValue({
        id: "p1", sku: "SP-001", image: { path: "img.jpg" },
      });

      const result = await service.getProductBySku("SP-001");
      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
    });

    /**
     * @test Melempar 404 ketika SKU tidak ditemukan
     */
    it("should throw 404 when SKU not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findBySku.mockResolvedValue(null);

      await expect(service.getProductBySku("SKU-999")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getProducts
   */
  describe("getProducts", () => {
    /**
     * @test Mengembalikan produk dengan signed URLs
     */
    it("should return products with signed URLs", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [
          { id: "p1", image: { path: "oli.jpg" } },
          { id: "p2", image: null },
        ],
        metadata: { total: 2 },
      });

      const result = await service.getProducts({ page: 1 });
      expect(result.data).toHaveLength(2);
    });
  });

  /**
   * @describe getServices
   */
  describe("getServices", () => {
    /**
     * @test Mengembalikan daftar service
     */
    it("should return services", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findServices.mockResolvedValue([
        { id: "s1", name: "Ganti Oli" },
      ]);

      const result = await service.getServices();
      expect(result).toHaveLength(1);
    });
  });

  /**
   * @describe getSpareparts
   */
  describe("getSpareparts", () => {
    /**
     * @test Mengembalikan sparepart dengan signed URLs
     */
    it("should return spareparts with signed URLs", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findSpareparts.mockResolvedValue([
        { id: "sp1", image: { path: "kampas.jpg" } },
      ]);

      const result = await service.getSpareparts();
      expect(result[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
    });
  });

  /**
   * @describe updateProduct
   */
  describe("updateProduct", () => {
    const productId = "p1";
    const userId = "user1";
    const existing = {
      id: productId, name: "Old", price: 50000, cost: 30000,
      type: "SPAREPART", stock: 10, isActive: true,
      imageId: "img-old", image: { path: "old.jpg" },
    };

    beforeEach(() => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(existing);
    });

    /**
     * @test Mengupdate produk dan membuat price history
     */
    it("should update product and create price history", async () => {
      await service.updateProduct(productId, { name: "New", price: "55000", cost: "35000" }, null, userId);
      expect(require("#app/database.js").$transaction).toHaveBeenCalled();
    });

    /**
     * @test Mengupload gambar baru dan menghapus yang lama
     */
    it("should upload new image and delete old one", async () => {
      const { FileRepository } = require("#repository/fileRepository.js");
      FileRepository.mock.instances[0].create.mockResolvedValue({ id: "img-new" });
      FileRepository.mock.instances[0].findById.mockResolvedValue({ id: "img-old", path: "old.jpg" });

      const file = { originalname: "new.jpg", mimetype: "image/jpeg", size: 1234, checksum: "abc" };
      await service.updateProduct(productId, {}, file, userId);

      const { uploadFile, deleteFile } = require("#shared/utils/storage.js");
      expect(uploadFile).toHaveBeenCalledWith(file, "products");
      expect(deleteFile).toHaveBeenCalledWith("old.jpg");
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.updateProduct("bad", {}, null, userId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe toggleProductStatus
   */
  describe("toggleProductStatus", () => {
    /**
     * @test Toggle status aktif ke nonaktif
     */
    it("should toggle from active to inactive", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({ id: "p1", isActive: true });
      ProductRepository.mock.instances[0].updateStatus.mockResolvedValue({ id: "p1", isActive: false });

      const result = await service.toggleProductStatus("p1");
      expect(result.isActive).toBe(false);
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.toggleProductStatus("p99")).rejects.toMatchObject({ statusCode: 404 });
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
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].getLowStockProducts.mockResolvedValue([{ id: "p1" }]);

      const result = await service.getLowStockProducts(10);
      expect(result).toHaveLength(1);
    });
  });

  /**
   * @describe checkSkuAvailability
   */
  describe("checkSkuAvailability", () => {
    /**
     * @test Mengembalikan status ketersediaan SKU
     */
    it("should return SKU availability", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].isSkuExists.mockResolvedValue(true);

      const result = await service.checkSkuAvailability("SP-001");
      expect(result.available).toBe(false);
    });
  });
});