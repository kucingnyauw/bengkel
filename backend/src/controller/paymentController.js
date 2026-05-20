import CatchAsync from "#shared/utils/response.js";
import PaymentService from "#service/paymentService.js";

import {
  createPaymentSchema,
  refundPaymentSchema,
  getPaymentsQuerySchema,
  orderIdParamSchema,
  paymentIdParamSchema,
} from "#validation/paymentValidation.js";

import validate from "#validation/validation.js";

import {
  PaymentInvoiceDto,
  PaymentListDto,
  PaymentStatusDto,
  PaymentQrisDto,
  PaymentQrisStatusDto,
} from "#dtos/paymentDto.js";

/**
 * Controller untuk mengelola endpoint pembayaran
 * @class PaymentController
 */
class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Membuat pembayaran (CASH/QRIS)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createPayment = CatchAsync.run(async (req, res) => {
    const payload = validate(createPaymentSchema, req.body);

    const payment = await this.paymentService.createPayment(payload);

    if (payload.method === "QRIS") {
      res.status(201).json({
        success: true,
        message: "Pembayaran QRIS berhasil dibuat, silakan scan QR code",
        data: new PaymentQrisDto(payment),
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Pembayaran berhasil, pesanan selesai",
        data: new PaymentInvoiceDto(payment),
      });
    }
  });

  /**
   * Mendapatkan detail pembayaran berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPaymentById = CatchAsync.run(async (req, res) => {
    const { id } = validate(paymentIdParamSchema, req.params);

    const payment = await this.paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      message: "Detail pembayaran berhasil diambil",
      data: new PaymentInvoiceDto(payment),
    });
  });

  /**
   * Mendapatkan daftar pembayaran dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPayments = CatchAsync.run(async (req, res) => {
    const query = validate(getPaymentsQuerySchema, req.query);

    const result = await this.paymentService.getPayments(query);

    res.status(200).json({
      success: true,
      message: "Daftar pembayaran berhasil diambil",
      data: result.data.map((payment) => new PaymentListDto(payment)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan pembayaran berdasarkan ID pesanan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPaymentByOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const payment = await this.paymentService.getPaymentByOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Pembayaran pesanan berhasil diambil",
      data: new PaymentInvoiceDto(payment),
    });
  });

  /**
   * Mendapatkan status pembayaran QRIS dari Midtrans
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPaymentStatus = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const status = await this.paymentService.getPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      message: "Status pembayaran berhasil diambil",
      data: new PaymentQrisStatusDto(status),
    });
  });

  /**
   * Webhook handler untuk notifikasi dari Midtrans
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handleMidtransWebhook = CatchAsync.run(async (req, res) => {
    await this.paymentService.handleMidtransWebhook(req.body);

    res.status(200).json({
      success: true,
      message: "Webhook diproses",
    });
  });

  /**
   * Refund pembayaran dan batalkan pesanan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  refundPayment = CatchAsync.run(async (req, res) => {
    const { id } = validate(paymentIdParamSchema, req.params);
    const payload = validate(refundPaymentSchema, req.body);

    const payment = await this.paymentService.refundPayment(id, payload);

    res.status(200).json({
      success: true,
      message: "Pembayaran berhasil direfund, pesanan dibatalkan",
      data: new PaymentStatusDto(payment),
    });
  });
}

export default new PaymentController();