import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
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
  }

  /**
   * Generate SKU unik berdasarkan tipe produk
   * @param {string} type
   * @returns {Promise<string>}
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
   * @param {Object} file
   * @param {string} userId
   * @returns {Promise<Object>}
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
   * @param {string} fileId
   * @param {string} productId
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
   * Generate signed URL untuk gambar produk
   * @param {Object} product
   * @returns {Promise<Object>}
   * @private
   */
  async #addSignedUrl(product) {
    if (product?.image?.path) {
      product.image.url = await Storage.getSignedUrl(product.image.path);
    }
    return product;
  }

  /**
   * Generate signed URL untuk multiple produk
   * @param {Array} products
   * @returns {Promise<Array>}
   * @private
   */
  async #addSignedUrlsToProducts(products) {
    if (!products?.length) return products;
    await Promise.all(products.map((p) => this.#addSignedUrl(p)));
    return products;
  }

  /**
   * Membuat produk baru
   * @param {Object} payload
   * @param {Object} [productFile]
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async createProduct(payload, productFile, userId) {
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
   * @param {string} productId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getProductById(productId) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    return this.#addSignedUrl(product);
  }

  /**
   * Mendapatkan produk berdasarkan SKU
   * @param {string} sku
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getProductBySku(sku) {
    const product = await this.productRepo.findBySku(sku);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan SKU '${sku}' tidak ditemukan.`,
      });
    }

    return this.#addSignedUrl(product);
  }

  /**
   * Mendapatkan daftar produk
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getProducts(query = {}) {
    const result = await this.productRepo.findMany(query);
    result.data = await this.#addSignedUrlsToProducts(result.data);
    return result;
  }

  /**
   * Mendapatkan daftar produk service
   * @param {Object} [query={}]
   * @returns {Promise<Array>}
   */
  async getServices(query = {}) {
    return this.productRepo.findServices(query);
  }

  /**
   * Mendapatkan daftar produk sparepart
   * @param {Object} [query={}]
   * @returns {Promise<Array>}
   */
  async getSpareparts(query = {}) {
    const spareparts = await this.productRepo.findSpareparts(query);
    return this.#addSignedUrlsToProducts(spareparts);
  }

  /**
   * Memperbarui produk
   * @param {string} productId
   * @param {Object} payload
   * @param {Object} [productFile]
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError}
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
   * @param {string} productId
   * @returns {Promise<Object>}
   * @throws {ApiError}
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
   * @param {number} [threshold=5]
   * @returns {Promise<Array>}
   */
  async getLowStockProducts(threshold = 5) {
    return this.productRepo.getLowStockProducts(threshold);
  }

  /**
   * Mengecek ketersediaan SKU
   * @param {string} sku
   * @param {string} [excludeId]
   * @returns {Promise<{available: boolean, message: string}>}
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