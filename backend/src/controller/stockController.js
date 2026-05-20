import CatchAsync from "#shared/utils/response.js";
import StockService from "#service/stockService.js";

import {
  recordStockInSchema,
  recordStockOutSchema,
  recordStockAdjustmentSchema,
  getStockMovementsQuerySchema,
  productIdParamSchema,
  movementIdParamSchema,
  orderIdParamSchema,
} from "#validation/stockValidation.js";

import validate from "#validation/validation.js";

import {
  StockMovementDetailDto,
  StockMovementListDto,
} from "#dtos/stockDto.js";

/**
 * Controller untuk mengelola endpoint mutasi stok
 * @class StockController
 */
class StockController {
  constructor() {
    this.stockService = new StockService();
  }

  /**
   * [POST] Mencatat stok masuk
   * @param {import('express').Request} req - Express request
   * @param {Object} req.body - Request body
   * @param {string} req.body.productId - ID produk
   * @param {number} req.body.quantity - Jumlah stok masuk
   * @param {string} [req.body.note] - Catatan
   * @param {string} [req.body.sourceType] - Sumber stok masuk
   * @param {Object} req.user - User yang sedang login
   * @param {string} req.user.id - ID user
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 201 {Object} success - Status sukses
   * @response 201 {StockMovementDetailDto} data - Detail mutasi stok
   */
  recordStockIn = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockInSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordStockIn(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note,
      payload.sourceType
    );

    res.status(201).json({
      success: true,
      message: "Stok masuk berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok keluar
   * @param {import('express').Request} req - Express request
   * @param {Object} req.body - Request body
   * @param {string} req.body.productId - ID produk
   * @param {number} req.body.quantity - Jumlah stok keluar
   * @param {string} [req.body.orderItemId] - ID order item terkait
   * @param {string} [req.body.note] - Catatan
   * @param {string} [req.body.sourceType] - Sumber stok keluar
   * @param {Object} req.user - User yang sedang login
   * @param {string} req.user.id - ID user
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 201 {Object} success - Status sukses
   * @response 201 {StockMovementDetailDto} data - Detail mutasi stok
   */
  recordStockOut = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockOutSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordStockOut(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.orderItemId,
      payload.note,
      payload.sourceType
    );

    res.status(201).json({
      success: true,
      message: "Stok keluar berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok keluar untuk penjualan
   * @param {import('express').Request} req - Express request
   * @param {Object} req.body - Request body
   * @param {string} req.body.productId - ID produk
   * @param {number} req.body.quantity - Jumlah stok keluar
   * @param {string} req.body.orderItemId - ID order item terkait
   * @param {Object} req.user - User yang sedang login
   * @param {string} req.user.id - ID user
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 201 {Object} success - Status sukses
   * @response 201 {StockMovementDetailDto} data - Detail mutasi stok
   */
  recordSaleOut = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockOutSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordSaleOut(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.orderItemId
    );

    res.status(201).json({
      success: true,
      message: "Stok keluar penjualan berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok masuk untuk retur
   * @param {import('express').Request} req - Express request
   * @param {Object} req.body - Request body
   * @param {string} req.body.productId - ID produk
   * @param {number} req.body.quantity - Jumlah stok masuk
   * @param {string} [req.body.note] - Catatan
   * @param {Object} req.user - User yang sedang login
   * @param {string} req.user.id - ID user
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 201 {Object} success - Status sukses
   * @response 201 {StockMovementDetailDto} data - Detail mutasi stok
   */
  recordReturnIn = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockInSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordReturnIn(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note
    );

    res.status(201).json({
      success: true,
      message: "Stok masuk retur berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat penyesuaian stok
   * @param {import('express').Request} req - Express request
   * @param {Object} req.body - Request body
   * @param {string} req.body.productId - ID produk
   * @param {number} req.body.quantity - Jumlah penyesuaian (positif/negatif)
   * @param {string} req.body.note - Catatan penyesuaian (wajib)
   * @param {Object} req.user - User yang sedang login
   * @param {string} req.user.id - ID user
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 201 {Object} success - Status sukses
   * @response 201 {StockMovementDetailDto} data - Detail mutasi stok
   */
  recordAdjustment = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockAdjustmentSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordAdjustment(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note
    );

    res.status(201).json({
      success: true,
      message: "Penyesuaian stok berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [GET] Mendapatkan daftar mutasi stok dengan filter dan paginasi
   * @param {import('express').Request} req - Express request
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.page] - Nomor halaman
   * @param {string} [req.query.limit] - Jumlah item per halaman
   * @param {string} [req.query.productId] - Filter ID produk
   * @param {string} [req.query.type] - Filter tipe (IN, OUT, ADJUSTMENT)
   * @param {string} [req.query.sourceType] - Filter sumber
   * @param {string} [req.query.recordedById] - Filter user pencatat
   * @param {string} [req.query.orderId] - Filter order
   * @param {string} [req.query.startDate] - Filter tanggal mulai
   * @param {string} [req.query.endDate] - Filter tanggal akhir
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 200 {Object} success - Status sukses
   * @response 200 {StockMovementListDto[]} data - Daftar mutasi stok
   * @response 200 {Object} metadata - Metadata pagination
   * @response 200 {number} metadata.total - Total data
   * @response 200 {number} metadata.currentPage - Halaman saat ini
   * @response 200 {number} metadata.itemsPerPage - Item per halaman
   * @response 200 {number} metadata.totalPages - Total halaman
   * @response 200 {boolean} metadata.hasNextPage - Ada halaman berikutnya
   * @response 200 {boolean} metadata.hasPrevPage - Ada halaman sebelumnya
   */
  getStockMovements = CatchAsync.run(async (req, res) => {
    const query = validate(getStockMovementsQuerySchema, req.query);

    const result = await this.stockService.getStockMovements(query);

    res.status(200).json({
      success: true,
      message: "Daftar mutasi stok berhasil diambil",
      data: result.data.map((movement) => new StockMovementListDto(movement)),
      metadata: result.metadata,
    });
  });

  /**
   * [GET] Mendapatkan detail mutasi stok berdasarkan ID
   * @param {import('express').Request} req - Express request
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - ID mutasi stok
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 200 {Object} success - Status sukses
   * @response 200 {StockMovementDetailDto} data - Detail mutasi stok
   */
  getStockMovementById = CatchAsync.run(async (req, res) => {
    const { id } = validate(movementIdParamSchema, req.params);

    const movement = await this.stockService.getStockMovementById(id);

    res.status(200).json({
      success: true,
      message: "Detail mutasi stok berhasil diambil",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [GET] Mendapatkan mutasi stok berdasarkan produk
   * @param {import('express').Request} req - Express request
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.productId - ID produk
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.page] - Nomor halaman
   * @param {string} [req.query.limit] - Jumlah item per halaman
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 200 {Object} success - Status sukses
   * @response 200 {StockMovementListDto[]} data - Daftar mutasi stok produk
   * @response 200 {Object} metadata - Metadata pagination
   */
  getMovementsByProduct = CatchAsync.run(async (req, res) => {
    const { productId } = validate(productIdParamSchema, req.params);
    const query = validate(getStockMovementsQuerySchema, req.query);

    const result = await this.stockService.getMovementsByProduct(
      productId,
      query
    );

    res.status(200).json({
      success: true,
      message: "Riwayat mutasi stok produk berhasil diambil",
      data: result.data.map((movement) => new StockMovementListDto(movement)),
      metadata: result.metadata,
    });
  });

  /**
   * [GET] Mendapatkan mutasi stok berdasarkan order
   * @param {import('express').Request} req - Express request
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.orderId - ID order
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 200 {Object} success - Status sukses
   * @response 200 {StockMovementListDto[]} data - Daftar mutasi stok
   */
  getMovementsByOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const movements = await this.stockService.getMovementsByOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Mutasi stok berdasarkan order berhasil diambil",
      data: movements.map((movement) => new StockMovementListDto(movement)),
    });
  });

  /**
   * [DELETE] Menghapus record mutasi stok
   * @param {import('express').Request} req - Express request
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - ID mutasi stok
   * @param {import('express').Response} res - Express response
   * @returns {Promise<void>} Response JSON
   * @response 200 {Object} success - Status sukses
   * @response 200 {null} data - null
   */
  deleteStockMovement = CatchAsync.run(async (req, res) => {
    const { id } = validate(movementIdParamSchema, req.params);

    await this.stockService.deleteStockMovement(id);

    res.status(200).json({
      success: true,
      message: "Record mutasi stok berhasil dihapus",
      data: null,
    });
  });
}

export default new StockController();
