import CatchAsync from "#shared/utils/response.js";
import OrderService from "#service/orderService.js";

import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  getOrdersQuerySchema,
  orderIdParamSchema,
  orderIdentifierParamSchema,
  orderNumberParamSchema,
  calculateTotalSchema,
} from "#validation/orderValidation.js";

import validate from "#validation/validation.js";

import {
  OrderDetailDto,
  OrderHistoryDetailDto,
  OrderListDto,
  OrderStatusUpdatedDto,
} from "#dtos/orderDto.js";

/**
 * Controller untuk mengelola endpoint pesanan
 * @class OrderController
 */
class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Membuat pesanan baru (DRAFT).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createOrder = CatchAsync.run(async (req, res) => {
    const payload = validate(createOrderSchema, req.body);
    const cashierId = req.user.id;

    const order = await this.orderService.createOrder(cashierId, payload);

    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat",
      data: new OrderDetailDto(order),
    });
  });

  /**
   * Mendapatkan detail pesanan berdasarkan ID atau nomor order.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getOrder = CatchAsync.run(async (req, res) => {
    const { identifier } = validate(orderIdentifierParamSchema, req.params);

    const order = await this.orderService.getOrder(identifier);

    res.status(200).json({
      success: true,
      message: "Detail pesanan berhasil diambil",
      data: new OrderDetailDto(order),
    });
  });

  /**
   * Mendapatkan daftar pesanan dengan filter dan paginasi.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getOrders = CatchAsync.run(async (req, res) => {
    const query = validate(getOrdersQuerySchema, req.query);

    const result = await this.orderService.getOrders(query);

    res.status(200).json({
      success: true,
      message: "Daftar pesanan berhasil diambil",
      data: result.data.map((order) => new OrderListDto(order)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan pesanan aktif kasir.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getActiveOrders = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;
    const query = validate(getOrdersQuerySchema, req.query);

    const result = await this.orderService.getActiveOrders(cashierId, query);

    res.status(200).json({
      success: true,
      message: "Daftar pesanan aktif berhasil diambil",
      data: result.data.map((order) => new OrderListDto(order)),
      metadata: result.metadata,
    });
  });

  /**
   * Mengupdate status pesanan.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateOrderStatus = CatchAsync.run(async (req, res) => {
    const { id } = validate(orderIdParamSchema, req.params);
    const { status } = validate(updateOrderStatusSchema, req.body);
    const userId = req.user.id;

    const order = await this.orderService.updateOrderStatus(id, status, userId);

    res.status(200).json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi ${status}`,
      data: new OrderStatusUpdatedDto(order),
    });
  });

  /**
   * Menutup pesanan (COMPLETED → CLOSED).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  closeOrder = CatchAsync.run(async (req, res) => {
    const { id } = validate(orderIdParamSchema, req.params);
    const userId = req.user.id;

    const order = await this.orderService.closeOrder(id, userId);

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil ditutup",
      data: new OrderStatusUpdatedDto(order),
    });
  });

  /**
   * Membatalkan pesanan.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  cancelOrder = CatchAsync.run(async (req, res) => {
    const { id } = validate(orderIdParamSchema, req.params);
    const payload = validate(cancelOrderSchema, req.body);
    const userId = req.user.id;

    await this.orderService.cancelOrder(id, payload, userId);

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil dibatalkan",
      data: null,
    });
  });

  /**
   * Soft delete pesanan.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  softDeleteOrder = CatchAsync.run(async (req, res) => {
    const { id } = validate(orderIdParamSchema, req.params);

    await this.orderService.softDeleteOrder(id);

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil dihapus",
      data: null,
    });
  });

  /**
   * Restore pesanan yang sudah di-soft delete.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  restoreOrder = CatchAsync.run(async (req, res) => {
    const { id } = validate(orderIdParamSchema, req.params);

    await this.orderService.restoreOrder(id);

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil dipulihkan",
      data: null,
    });
  });

  /**
   * Menghitung estimasi total pesanan.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  calculateTotal = CatchAsync.run(async (req, res) => {
    console.log("data items" , JSON.stringify(req.body , null ,2));
    const items = validate(calculateTotalSchema, req.body);

    const result = await this.orderService.calculateTotal(items);

    res.status(200).json({
      success: true,
      message: "Total pesanan berhasil dihitung",
      data: result,
    });
  });

  /**
   * Melacak riwayat lengkap pesanan berdasarkan nomor pesanan.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  trackOrderHistory = CatchAsync.run(async (req, res) => {
    const { orderNumber } = validate(orderNumberParamSchema, req.params);

    const result = await this.orderService.trackOrderHistory(orderNumber);

    res.status(200).json({
      success: true,
      message: "Riwayat pesanan berhasil diambil",
      data: new OrderHistoryDetailDto(result),
    });
  });
}

export default new OrderController();