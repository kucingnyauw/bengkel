import StockRepository from "#repository/stockRepository.js";
import ProductRepository from "#repository/productRepository.js";
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
  }

  /**
   * Mencatat stok masuk
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok masuk
   * @param {string} recordedById - ID user pencatat
   * @param {string} [note=null] - Catatan
   * @param {StockSourceType} [sourceType="MANUAL"] - Sumber stok masuk
   * @returns {Promise<Object>} Data mutasi stok
   * @throws {ApiError} 404 - Produk tidak ditemukan
   * @throws {ApiError} 400 - Produk bukan sparepart
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

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      return this.stockRepo.createInTransaction(tx, {
        productId,
        type: "IN",
        sourceType,
        quantity,
        recordedById,
        note,
      });
    });

    logger.info("Stok masuk berhasil dicatat", {
      stockMovementId: result.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      recordedById,
    });

    return result;
  }

  /**
   * Mencatat stok keluar
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok keluar
   * @param {string} recordedById - ID user pencatat
   * @param {string} [orderItemId=null] - ID order item terkait
   * @param {string} [note=null] - Catatan
   * @param {StockSourceType} [sourceType="MANUAL"] - Sumber stok keluar
   * @returns {Promise<Object>} Data mutasi stok
   * @throws {ApiError} 404 - Produk tidak ditemukan
   * @throws {ApiError} 400 - Produk bukan sparepart atau stok tidak cukup
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
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      return this.stockRepo.createInTransaction(tx, {
        productId,
        type: "OUT",
        sourceType,
        quantity,
        recordedById,
        orderItemId,
        note,
      });
    });

    logger.info("Stok keluar berhasil dicatat", {
      stockMovementId: result.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      orderItemId,
      recordedById,
    });

    return result;
  }

  /**
   * Mencatat stok keluar untuk penjualan
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok keluar
   * @param {string} recordedById - ID user pencatat
   * @param {string} orderItemId - ID order item terkait
   * @returns {Promise<Object>} Data mutasi stok keluar penjualan
   */
  async recordSaleOut(productId, quantity, recordedById, orderItemId) {
    return this.recordStockOut(productId, quantity, recordedById, orderItemId, null, "SALE");
  }

  /**
   * Mencatat stok masuk untuk retur
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok masuk
   * @param {string} recordedById - ID user pencatat
   * @param {string} [note=null] - Catatan
   * @returns {Promise<Object>} Data mutasi stok masuk retur
   */
  async recordReturnIn(productId, quantity, recordedById, note = null) {
    return this.recordStockIn(productId, quantity, recordedById, note || "Retur barang", "RETURN");
  }

  /**
   * Mencatat penyesuaian stok
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah penyesuaian
   * @param {string} recordedById - ID user pencatat
   * @param {string} note - Catatan penyesuaian (wajib)
   * @returns {Promise<Object>} Data mutasi stok penyesuaian
   * @throws {ApiError} 404 - Produk tidak ditemukan
   * @throws {ApiError} 400 - Produk bukan sparepart atau stok tidak cukup
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

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: quantity > 0
            ? { increment: quantity }
            : { decrement: Math.abs(quantity) },
        },
      });

      return this.stockRepo.createInTransaction(tx, {
        productId,
        type: "ADJUSTMENT",
        sourceType: "ADJUSTMENT",
        quantity,
        recordedById,
        note,
      });
    });

    logger.info("Penyesuaian stok berhasil dicatat", {
      stockMovementId: result.id,
      productId,
      productName: product.name,
      quantity,
      previousStock: product.stock,
      newStock: product.stock + quantity,
      recordedById,
      note,
    });

    return result;
  }

  /**
   * Mendapatkan daftar mutasi stok dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<Object>} Daftar mutasi stok dengan metadata pagination
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
   * @param {string} id - ID mutasi stok
   * @returns {Promise<Object>} Detail mutasi stok
   * @throws {ApiError} 404 - Mutasi tidak ditemukan
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
   * @param {string} productId - ID produk
   * @param {Object} [query={}] - Parameter query paginasi
   * @returns {Promise<Object>} Daftar mutasi stok produk
   * @throws {ApiError} 404 - Produk tidak ditemukan
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
   * @param {string} orderId - ID order
   * @returns {Promise<Array>} Daftar mutasi stok
   */
  async getMovementsByOrder(orderId) {
    return this.stockRepo.findByOrderId(orderId);
  }

  /**
   * Menghapus record mutasi stok
   * @param {string} id - ID mutasi stok
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - Mutasi tidak ditemukan
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