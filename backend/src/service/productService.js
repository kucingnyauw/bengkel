import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import CacheManager from "#shared/utils/cache.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis produk
 * @class ProductService
 */
class ProductService {
  constructor() {
    this.productRepo = new ProductRepository();
    this.fileRepo = new FileRepository();
    this.productListCache = new CacheManager("product:list");
  }

  /**
   * Generate SKU unik berdasarkan tipe produk
   * @param {string} type - Tipe produk
   * @returns {Promise<string>} SKU yang unik
   * @private
   */
  async #generateSku(type) {
    const prefix = type === "SPAREPART" ? "SP" : "SV";

    const lastProduct = await prisma.product.findFirst({
      where: { sku: { startsWith: prefix } },
      orderBy: { sku: "desc" },
      select: { sku: true },
    });

    let sku;
    let exists = true;

    while (exists) {
      sku = await CodeGenerator.productSku(type, lastProduct?.sku);
      exists = await this.productRepo.isSkuExists(sku);
      if (exists) lastProduct.sku = sku;
    }

    return sku;
  }

  /**
   * Upload file gambar produk
   * @param {Object} file - File dari middleware
   * @param {string} userId - ID user
   * @returns {Promise<Object>} File record
   * @private
   */
  async #uploadImage(file, userId) {
    const path = await Storage.uploadFile(file, "products");

    return this.fileRepo.create({
      path: path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum: file.checksum,
      uploadedById: userId,
    });
  }

  /**
   * Menghapus file gambar lama
   * @param {string} fileId - ID file
   * @param {string} productId - ID produk (untuk log)
   * @returns {Promise<void>}
   * @private
   */
  async #deleteImage(fileId, productId) {
    try {
      const oldFile = await this.fileRepo.findById(fileId);
      if (oldFile) {
        await Storage.deleteFile(oldFile.path);
        await this.fileRepo.delete(oldFile.id);
      }
    } catch (err) {
      logger.warn("Gagal membersihkan file gambar lama", {
        productId,
        fileId,
        error: err.message,
      });
    }
  }

  /**
   * Invalidasi semua cache list produk
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateListCache() {
    await this.productListCache.invalidateAll();
  }

  /**
   * Membuat produk baru
   * @param {Object} payload - Data produk
   * @param {Object} [productFile] - File gambar
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Produk yang berhasil dibuat
   */
  async createProduct(payload, productFile, userId) {
    throw ApiError.badRequest({message : "test aja ngab"})
    const type = payload.type || "SPAREPART";
    const sku = await this.#generateSku(type);

    let imageId = null;

    if (productFile) {
      const fileRecord = await this.#uploadImage(productFile, userId);
      imageId = fileRecord.id;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: payload.name,
          sku,
          type,
          description: payload.description,
          price: payload.price,
          cost: payload.cost || 0,
          stock: payload.stock || 0,
          isActive: true,
          imageId,
        },
      });

      await tx.productPriceHistory.create({
        data: {
          productId: newProduct.id,
          price: newProduct.price,
          cost: newProduct.cost,
          effectiveFrom: new Date(),
        },
      });

      if (payload.stock && payload.stock > 0 && type !== "SERVICE") {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            type: "IN",
            sourceType: "MANUAL",
            quantity: payload.stock,
            note: "Stok awal produk",
            recordedById: userId,
          },
        });
      }

      return newProduct;
    });

    await this.#invalidateListCache();

    logger.info("Produk berhasil dibuat", {
      productId: product.id,
      name: product.name,
      sku,
      type,
      userId,
    });

    return this.productRepo.findById(product.id);
  }

  /**
   * Mendapatkan produk berdasarkan ID
   * @param {string} productId - ID produk
   * @returns {Promise<Object>} Data produk
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async getProductById(productId) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.image && product.image.path) {
      const signedUrl = await Storage.getSignedUrl(product.image.path);
      product.image.url = signedUrl;
    }

    return product;
  }

  /**
   * Mendapatkan produk berdasarkan SKU
   * @param {string} sku - Kode SKU
   * @returns {Promise<Object>} Data produk
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async getProductBySku(sku) {
    const product = await this.productRepo.findBySku(sku);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan SKU '${sku}' tidak ditemukan.`,
      });
    }

    if (product.image && product.image.path) {
      const signedUrl = await Storage.getSignedUrl(product.image.path);
      product.image.url = signedUrl;
    }

    return product;
  }

  /**
   * Mendapatkan daftar produk dengan cache
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar produk
   */
  async getProducts(query = {}) {
    const cacheKey = `products:${JSON.stringify(query)}`;

    const cached = await this.productListCache.get(cacheKey);
    if (cached) return cached;

    const result = await this.productRepo.findMany(query);

    for (const product of result.data) {
      if (product.image && product.image.path) {
        const signedUrl = await Storage.getSignedUrl(product.image.path);
        product.image.url = signedUrl;
      }
    }

    await this.productListCache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Mendapatkan daftar produk service dengan cache
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<Array>} Daftar service
   */
  async getServices(query = {}) {
    const cacheKey = `services:${JSON.stringify(query)}`;

    const cached = await this.productListCache.get(cacheKey);
    if (cached) return cached;

    const services = await this.productRepo.findServices(query);

    await this.productListCache.set(cacheKey, services, 300);

    return services;
  }

  /**
   * Mendapatkan daftar produk sparepart dengan cache
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<Array>} Daftar sparepart
   */
  async getSpareparts(query = {}) {
    const cacheKey = `spareparts:${JSON.stringify(query)}`;

    const cached = await this.productListCache.get(cacheKey);
    if (cached) return cached;

    const spareparts = await this.productRepo.findSpareparts(query);

    for (const sparepart of spareparts) {
      if (sparepart.image && sparepart.image.path) {
        const signedUrl = await Storage.getSignedUrl(sparepart.image.path);
        sparepart.image.url = signedUrl;
      }
    }

    await this.productListCache.set(cacheKey, spareparts, 300);

    return spareparts;
  }

  /**
   * Memperbarui produk
   * @param {string} productId - ID produk
   * @param {Object} payload - Data yang akan diupdate
   * @param {Object} [productFile] - File gambar baru
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Produk yang sudah diupdate
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async updateProduct(productId, payload, productFile, userId) {
    const existing = await this.productRepo.findById(productId);
    if (!existing) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    let imageId = existing.imageId;

    if (productFile) {
      const newFileRecord = await this.#uploadImage(productFile, userId);
      imageId = newFileRecord.id;
      if (existing.imageId) {
        await this.#deleteImage(existing.imageId, productId);
      }
    }

    const newPrice =
      payload.price !== undefined ? Number(payload.price) : existing.price;
    const newCost =
      payload.cost !== undefined ? Number(payload.cost) : existing.cost;

    const priceChanged = newPrice !== Number(existing.price);
    const costChanged = newCost !== Number(existing.cost);
    const shouldCreatePriceHistory = priceChanged || costChanged;

    const updateData = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.price !== undefined) updateData.price = Number(payload.price);
    if (payload.cost !== undefined) updateData.cost = Number(payload.cost);
    if (payload.stock !== undefined) updateData.stock = Number(payload.stock);
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    updateData.imageId = imageId;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      if (shouldCreatePriceHistory) {
        const existingHistory = await tx.productPriceHistory.findFirst({
          where: {
            productId,
            price: product.price,
            cost: product.cost,
            effectiveFrom: {
              gte: new Date(Date.now() - 1000),
            },
          },
          orderBy: { effectiveFrom: "desc" },
        });

        if (!existingHistory) {
          await tx.productPriceHistory.create({
            data: {
              productId,
              price: product.price,
              cost: product.cost,
              effectiveFrom: new Date(),
            },
          });
        }
      }

      return product;
    });

    await this.#invalidateListCache();

    logger.info("Produk berhasil diperbarui", {
      productId,
      previousName: existing.name,
      newName: updated.name,
      userId,
    });

    return this.productRepo.findById(productId);
  }

  /**
   * Toggle status aktif produk (ON/OFF)
   * @param {string} productId - ID produk
   * @returns {Promise<Object>} Produk dengan status terbaru
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async toggleProductStatus(productId) {
    const existing = await this.productRepo.findById(productId);
    if (!existing) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    const newStatus = !existing.isActive;
    const updated = await this.productRepo.updateStatus(productId, newStatus);

    await this.#invalidateListCache();

    logger.info("Status produk berhasil diubah", {
      productId,
      name: existing.name,
      previousStatus: existing.isActive,
      newStatus,
    });

    return updated;
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {number} [threshold=5] - Batas threshold
   * @returns {Promise<Array>} Daftar produk stok rendah
   */
  async getLowStockProducts(threshold = 5) {
    return this.productRepo.getLowStockProducts(threshold);
  }

  /**
   * Mengecek ketersediaan SKU
   * @param {string} sku - SKU yang dicek
   * @param {string} [excludeId] - ID produk yang dikecualikan
   * @returns {Promise<{available: boolean, message: string}>} Status ketersediaan
   */
  async checkSkuAvailability(sku, excludeId = null) {
    const exists = await this.productRepo.isSkuExists(sku, excludeId);
    return {
      available: !exists,
      message: exists
        ? `SKU '${sku}' sudah digunakan.`
        : `SKU '${sku}' tersedia.`,
    };
  }
}

export default ProductService;
