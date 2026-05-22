import StockRepository from "#repository/stockRepository.js";
import ProductRepository from "#repository/productRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis mutasi stok
 * @class StockService
 */
class StockService {
  constructor() {
    this.stockRepo = new StockRepository();
    this.productRepo = new ProductRepository();
    this.notifRepo = new NotificationRepository();
    this.settingRepo = new SettingRepository();
  }

  /**
   * Mendapatkan threshold stok rendah dari settings
   * @returns {Promise<number>}
   * @private
   */
  async #getLowStockThreshold() {
    const setting = await this.settingRepo.findByKey("stock_low_threshold");
    return setting ? Number(setting.value) : 5;
  }

  /**
   * Mengirim notifikasi stok rendah ke admin
   * @param {Object} product - Data produk
   * @returns {Promise<void>}
   * @private
   */
  async #notifyLowStock(product) {
    try {
      const threshold = await this.#getLowStockThreshold();

      if (product.stock <= threshold) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

        const notifications = admins.map((admin) => ({
          title: "Peringatan Stok Rendah",
          message: product.stock === 0
            ? `Stok '${product.name}' (SKU: ${product.sku}) HABIS! Segera lakukan pembelian.`
            : `Stok '${product.name}' (SKU: ${product.sku}) tinggal ${product.stock} unit (batas minimum: ${threshold}).`,
          type: product.stock === 0 ? "ERROR" : "WARNING",
          userId: admin.id,
        }));

        if (notifications.length > 0) {
          await Promise.all(notifications.map((n) => this.notifRepo.create(n)));
          logger.info(`Notifikasi stok rendah dikirim untuk ${product.name}`, {
            productId: product.id,
            stock: product.stock,
            threshold,
            notifiedAdmins: admins.length,
          });
        }
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi stok rendah", {
        productId: product.id,
        error: err.message,
      });
    }
  }

  /**
   * Mengirim notifikasi stok kembali normal
   * @param {Object} product - Data produk
   * @param {number} previousStock - Stok sebelumnya
   * @returns {Promise<void>}
   * @private
   */
  async #notifyStockRestored(product, previousStock) {
    try {
      const threshold = await this.#getLowStockThreshold();

      if (previousStock <= threshold && product.stock > threshold) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

        const notifications = admins.map((admin) => ({
          title: "Stok Kembali Normal",
          message: `Stok '${product.name}' (SKU: ${product.sku}) sudah kembali normal: ${product.stock} unit.`,
          type: "SUCCESS",
          userId: admin.id,
        }));

        if (notifications.length > 0) {
          await Promise.all(notifications.map((n) => this.notifRepo.create(n)));
        }
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi stok normal", {
        productId: product.id,
        error: err.message,
      });
    }
  }

  /**
   * Mencatat stok masuk
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [note=null]
   * @param {StockSourceType} [sourceType="MANUAL"]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordStockIn(productId, quantity, recordedById, note = null, sourceType = "MANUAL") {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat stok masuk. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok masuk. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    const previousStock = product.stock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "IN",
          sourceType,
          quantity,
          recordedById,
          note,
        }),
      };
    });

    await this.#notifyStockRestored(result.updatedProduct, previousStock);

    logger.info("Stok masuk berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      recordedById,
    });

    return result.movement;
  }

  /**
   * Mencatat stok keluar
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [orderItemId=null]
   * @param {string} [note=null]
   * @param {StockSourceType} [sourceType="MANUAL"]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordStockOut(productId, quantity, recordedById, orderItemId = null, note = null, sourceType = "MANUAL") {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat stok keluar. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok keluar. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    if (product.stock < quantity) {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok keluar. Stok produk '${product.name}' tidak mencukupi. Stok saat ini: ${product.stock}, Diminta: ${quantity}.`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "OUT",
          sourceType,
          quantity,
          recordedById,
          orderItemId,
          note,
        }),
      };
    });

    await this.#notifyLowStock(result.updatedProduct);

    logger.info("Stok keluar berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      orderItemId,
      recordedById,
    });

    return result.movement;
  }

  /**
   * Mencatat stok keluar untuk penjualan
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} orderItemId
   * @returns {Promise<Object>}
   */
  async recordSaleOut(productId, quantity, recordedById, orderItemId) {
    return this.recordStockOut(productId, quantity, recordedById, orderItemId, null, "SALE");
  }

  /**
   * Mencatat stok masuk untuk retur
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [note=null]
   * @returns {Promise<Object>}
   */
  async recordReturnIn(productId, quantity, recordedById, note = null) {
    return this.recordStockIn(productId, quantity, recordedById, note || "Retur barang", "RETURN");
  }

  /**
   * Mencatat penyesuaian stok
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} note
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordAdjustment(productId, quantity, recordedById, note) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat penyesuaian. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat penyesuaian. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    if (quantity < 0 && product.stock < Math.abs(quantity)) {
      throw ApiError.badRequest({
        message: `Gagal mencatat penyesuaian. Stok produk '${product.name}' tidak mencukupi. Stok saat ini: ${product.stock}.`,
      });
    }

    const previousStock = product.stock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: quantity > 0
            ? { increment: quantity }
            : { decrement: Math.abs(quantity) },
        },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "ADJUSTMENT",
          sourceType: "ADJUSTMENT",
          quantity,
          recordedById,
          note,
        }),
      };
    });

    if (quantity < 0) {
      await this.#notifyLowStock(result.updatedProduct);
    } else {
      await this.#notifyStockRestored(result.updatedProduct, previousStock);
    }

    logger.info("Penyesuaian stok berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      previousStock: product.stock,
      newStock: result.updatedProduct.stock,
      recordedById,
      note,
    });

    return result.movement;
  }

  /**
   * Mendapatkan daftar mutasi stok dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<Object>}
   */
  async getStockMovements(query = {}) {
    const result = await this.stockRepo.findMany(query);

    logger.info("Mengambil daftar mutasi stok", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: {
        productId: query.productId,
        type: query.type,
        sourceType: query.sourceType,
      },
    });

    return result;
  }

  /**
   * Mendapatkan detail mutasi stok berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getStockMovementById(id) {
    const movement = await this.stockRepo.findById(id);

    if (!movement) {
      throw ApiError.notFound({
        message: `Mutasi stok dengan ID '${id}' tidak ditemukan.`,
      });
    }

    return movement;
  }

  /**
   * Mendapatkan mutasi stok berdasarkan produk
   * @param {string} productId
   * @param {Object} [query={}]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getMovementsByProduct(productId, query = {}) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    return this.stockRepo.findByProductId(productId, query);
  }

  /**
   * Mendapatkan mutasi stok berdasarkan order
   * @param {string} orderId
   * @returns {Promise<Array>}
   */
  async getMovementsByOrder(orderId) {
    return this.stockRepo.findByOrderId(orderId);
  }

  /**
   * Menghapus record mutasi stok
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async deleteStockMovement(id) {
    const movement = await this.stockRepo.findById(id);

    if (!movement) {
      throw ApiError.notFound({
        message: `Gagal menghapus. Mutasi stok dengan ID '${id}' tidak ditemukan.`,
      });
    }

    await this.stockRepo.delete(id);

    logger.info("Mutasi stok berhasil dihapus", {
      movementId: id,
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
    });
  }
}

export default StockService;