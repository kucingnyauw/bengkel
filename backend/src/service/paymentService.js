import PaymentRepository from "#repository/paymentRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import CacheManager from "#shared/utils/cache.js";
import Currency from "#shared/utils/currency.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import midtrans from "#lib/midtrans.js";
import axios from "axios";
import crypto from "crypto";
import { getIO } from "#app/io.js";

/**
 * Service untuk mengelola logika bisnis pembayaran
 *
 * Alur SERVICE:
 *   DRAFT -> (payment) -> QUEUED -> (start task) -> IN_PROGRESS -> (complete all tasks) -> COMPLETED -> (close) -> CLOSED
 *
 * Alur SPAREPART ONLY:
 *   DRAFT -> (payment) -> COMPLETED -> (close) -> CLOSED
 *
 * @class PaymentService
 */
class PaymentService {
  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.orderRepo = new OrderRepository();
    this.settingRepo = new SettingRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("order");
  }

  /**
   * Invalidasi cache order history
   * @param {string} orderNumber
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateOrderHistoryCache(orderNumber) {
    await this.cache.invalidate(`history:${orderNumber}`);
  }

  /**
   * Mengirim notifikasi
   * @param {string} userId
   * @param {string} title
   * @param {string} message
   * @param {string} [type="INFO"]
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    try {
      await this.notifRepo.create({ title, message, type, userId });
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi pembayaran", {
        userId,
        error: err.message,
      });
    }
  }

  /**
   * Format detail item untuk ditampilkan di notifikasi
   * @param {Array} items
   * @returns {string}
   * @private
   */
  #formatItemDetails(items) {
    if (!items || items.length === 0) return "";
    return items
      .map((item, index) => {
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : "";
        return `  ${index + 1}. ${item.productNameSnapshot}${qty} = ${Currency.toIDR(item.subtotal)}`;
      })
      .join("\n");
  }

  /**
   * Format info kendaraan
   * @param {Object} vehicle
   * @returns {string}
   * @private
   */
  #formatVehicleInfo(vehicle) {
    if (!vehicle) return "Tidak ada kendaraan";
    return `${vehicle.plateNumber} - ${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  }

  /**
   * Membuat pembayaran
   * @param {Object} payload
   * @param {string} payload.orderId
   * @param {string} payload.method
   * @param {number} [payload.amountPaid]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async createPayment(payload) {
    const { orderId, method, amountPaid } = payload;

    if (method === "CASH") {
      return this.createCashPayment(orderId, amountPaid);
    } else if (method === "QRIS") {
      return this.createQrisPayment(orderId);
    } else {
      throw ApiError.badRequest({
        message: `Metode pembayaran '${method}' tidak didukung.`,
      });
    }
  }

  /**
   * Cek apakah order memiliki item SERVICE
   * @param {Object} order
   * @returns {boolean}
   * @private
   */
  #hasServiceItem(order) {
    return (
      order.items?.some((item) => item.product?.type === "SERVICE") ?? false
    );
  }

  /**
   * Menentukan status setelah pembayaran
   * @param {Object} order
   * @returns {string}
   * @private
   */
  #getStatusAfterPayment(order) {
    return this.#hasServiceItem(order) ? "QUEUED" : "COMPLETED";
  }

  /**
   * Memproses pembayaran tunai (CASH)
   * @param {string} orderId
   * @param {number} amountPaid
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async createCashPayment(orderId, amountPaid) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw ApiError.notFound({
        message: `Gagal membuat pembayaran. Pesanan dengan ID '${orderId}' tidak ditemukan.`,
      });
    }

    if (order.status === "COMPLETED" || order.status === "CLOSED") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran. Pesanan '${order.orderNumber}' sudah selesai atau ditutup.`,
      });
    }

    if (order.status === "CANCELLED") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran. Pesanan '${order.orderNumber}' sudah dibatalkan.`,
      });
    }

    if (order.status !== "DRAFT") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran. Hanya pesanan dengan status DRAFT yang dapat dibayar. Status saat ini: ${order.status}`,
      });
    }

    const existingPayment = await this.paymentRepo.findByOrderId(orderId);
    if (existingPayment) {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran. Pesanan '${order.orderNumber}' sudah memiliki pembayaran.`,
      });
    }

    if (amountPaid < order.total) {
      throw ApiError.badRequest({
        message: `Gagal membuat pembayaran. Jumlah pembayaran (${Currency.toIDR(amountPaid)}) kurang dari total tagihan (${Currency.toIDR(order.total)}).`,
      });
    }

    const change = amountPaid - order.total;
    const hasService = this.#hasServiceItem(order);
    const newStatus = this.#getStatusAfterPayment(order);

    const result = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(newStatus === "COMPLETED" && { completedAt: new Date() }),
        },
      });

      if (hasService) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: newStatus,
            changedById: order.cashierId,
            note: "Pembayaran tunai berhasil. Pesanan masuk antrian dan siap dikerjakan oleh mekanik.",
          },
        });
      }

      const payment = await tx.payment.create({
        data: {
          orderId,
          method: "CASH",
          amountPaid,
          change,
          paidAt: new Date(),
        },
        select: {
          id: true,
          method: true,
          amountPaid: true,
          change: true,
          status: true,
          paidAt: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              subtotal: true,
              tax: true,
              total: true,
              createdAt: true,
              cashier: { select: { id: true, fullName: true } },
              customer: { select: { id: true, name: true, phone: true } },
              vehicle: {
                select: {
                  id: true,
                  plateNumber: true,
                  brand: true,
                  model: true,
                },
              },
              items: {
                select: {
                  id: true,
                  quantity: true,
                  unitPrice: true,
                  subtotal: true,
                  productNameSnapshot: true,
                  product: {
                    select: { id: true, name: true, sku: true, type: true },
                  },
                  assignments: {
                    select: {
                      id: true,
                      mechanic: { select: { id: true, fullName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return payment;
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    const customerName = order.customer?.name || "Pelanggan";
    const vehicleInfo = this.#formatVehicleInfo(order.vehicle);
    const itemDetails = this.#formatItemDetails(order.items);

    const notificationMessage = [
      `Pembayaran Tunai Berhasil`,
      ``,
      `Pesanan       : #${order.orderNumber}`,
      `Pelanggan     : ${customerName}`,
      `Kendaraan     : ${vehicleInfo}`,
      ``,
      `Rincian Pesanan:`,
      `${itemDetails}`,
      ``,
      `Total Tagihan  : ${Currency.toIDR(order.total)}`,
      `Jumlah Dibayar : ${Currency.toIDR(amountPaid)}`,
      `Kembalian      : ${Currency.toIDR(change)}`,
      ``,
      `Status Pesanan : ${newStatus}`,
      hasService
        ? `Pesanan masuk antrian dan menunggu pengerjaan mekanik.`
        : `Pesanan sparepart langsung selesai.`,
    ].join("\n");

    await this.#sendNotification(
      order.cashierId,
      `Pembayaran Tunai - #${order.orderNumber}`,
      notificationMessage,
      "SUCCESS"
    );

    if (hasService) {
      const mechanics = await prisma.user.findMany({
        where: { role: "MECHANIC", isActive: true },
        select: { id: true, fullName: true },
      });

      const serviceItems = order.items.filter(
        (i) => i.product?.type === "SERVICE"
      );

      for (const mechanic of mechanics) {
        const mechanicMessage = [
          `Pesanan Baru Siap Dikerjakan`,
          ``,
          `Pesanan       : #${order.orderNumber}`,
          `Pelanggan     : ${customerName}`,
          `Kendaraan     : ${vehicleInfo}`,
          ``,
          `Item Service (${serviceItems.length}):`,
          `${this.#formatItemDetails(serviceItems)}`,
          ``,
          `Silakan ambil task dan mulai pengerjaan.`,
        ].join("\n");

        await this.#sendNotification(
          mechanic.id,
          `Task Baru - #${order.orderNumber}`,
          mechanicMessage,
          "INFO"
        );
      }
    }

    logger.info(`Pembayaran CASH berhasil, pesanan ${newStatus}`, {
      paymentId: result.id,
      orderId,
      orderNumber: result.order.orderNumber,
      amountPaid,
      change,
      newStatus,
    });

    return result;
  }

  /**
   * Memproses pembayaran QRIS via Midtrans
   * @param {string} orderId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async createQrisPayment(orderId) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw ApiError.notFound({
        message: `Gagal membuat pembayaran QRIS. Pesanan dengan ID '${orderId}' tidak ditemukan.`,
      });
    }

    if (order.status === "COMPLETED" || order.status === "CLOSED") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran QRIS. Pesanan '${order.orderNumber}' sudah selesai atau ditutup.`,
      });
    }

    if (order.status === "CANCELLED") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran QRIS. Pesanan '${order.orderNumber}' sudah dibatalkan.`,
      });
    }

    if (order.status !== "DRAFT") {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran QRIS. Hanya pesanan dengan status DRAFT yang dapat dibayar. Status saat ini: ${order.status}`,
      });
    }

    const existingPayment = await this.paymentRepo.findByOrderId(orderId);
    if (existingPayment) {
      throw ApiError.conflict({
        message: `Gagal membuat pembayaran QRIS. Pesanan '${order.orderNumber}' sudah memiliki pembayaran.`,
      });
    }

    const itemDetails = order.items.map((item) => ({
      id: item.productId,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.productNameSnapshot,
      category: item.product?.type === "SERVICE" ? "Service" : "Sparepart",
    }));

    const itemsTotal = itemDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (order.tax > 0) {
      itemDetails.push({
        id: "TAX",
        price: order.tax,
        quantity: 1,
        name: "Pajak",
        category: "Tax",
      });
    }

    const totalAfterTax = itemsTotal + order.tax;

    if (totalAfterTax !== order.total) {
      const adjustment = order.total - totalAfterTax;
      if (adjustment !== 0) {
        itemDetails.push({
          id: "ADJUSTMENT",
          price: adjustment,
          quantity: 1,
          name: adjustment > 0 ? "Biaya Tambahan" : "Diskon",
          category: "Adjustment",
        });
      }
    }

    const parameter = {
      payment_type: "qris",
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.total,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: order.customer?.name || "Customer",
        email: order.customer?.email || null,
        phone: order.customer?.phone || null,
      },
    };

    const transaction = await midtrans.charge(parameter);

    if (!transaction || !["200", "201"].includes(transaction.status_code)) {
      logger.error("Midtrans charge gagal", {
        orderId,
        orderNumber: order.orderNumber,
        statusCode: transaction?.status_code,
        statusMessage: transaction?.status_message,
      });
      throw ApiError.internal({
        message: "Gagal memproses transaksi QRIS. Silakan coba lagi.",
      });
    }

    let qrCodeUrl = null;
    if (transaction.actions) {
      const qrAction = transaction.actions.find(
        (action) => action.name === "generate-qr-code"
      );
      if (qrAction) {
        qrCodeUrl = qrAction.url;
      }
    }

    await this.paymentRepo.create({
      orderId,
      method: "QRIS",
      amountPaid: 0,
      change: 0,
      status: "PENDING",
    });

    const customerName = order.customer?.name || "Pelanggan";

    const notificationMessage = [
      `Pembayaran QRIS Menunggu`,
      ``,
      `Pesanan       : #${order.orderNumber}`,
      `Pelanggan     : ${customerName}`,
      `Total         : ${Currency.toIDR(order.total)}`,
      ``,
      `Status        : Menunggu Pembayaran`,
      ``,
      `Silakan scan QR Code untuk menyelesaikan pembayaran.`,
      `Pastikan nominal sesuai dengan total tagihan.`,
    ].join("\n");

    await this.#sendNotification(
      order.cashierId,
      `QRIS Pending - #${order.orderNumber}`,
      notificationMessage,
      "INFO"
    );

    logger.info("Pembayaran QRIS berhasil dibuat", {
      orderId,
      orderNumber: order.orderNumber,
      transactionId: transaction.transaction_id,
      amount: order.total,
    });

    return {
      orderId,
      orderNumber: order.orderNumber,
      transactionId: transaction.transaction_id,
      qrCodeUrl,
      amount: order.total,
      status: "PENDING",
    };
  }

  /**
   * Mendapatkan detail pembayaran berdasarkan ID
   * @param {string} paymentId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getPaymentById(paymentId) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment)
      throw ApiError.notFound({
        message: `Pembayaran dengan ID '${paymentId}' tidak ditemukan.`,
      });
    return payment;
  }

  /**
   * Mendapatkan daftar pembayaran dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getPayments(query = {}) {
    const result = await this.paymentRepo.findMany(query);

    result.data = result.data.map((payment) => {
      const order = payment.order;
      if (!order) return payment;

      const subtotal = Number(order.subtotal) || 0;
      const tax = Number(order.tax) || 0;
      const taxRate = subtotal > 0 ? Math.round((tax / subtotal) * 100) : 0;

      return {
        ...payment,
        order: {
          ...order,
          taxRate,
        },
      };
    });

    return result;
  }

  /**
   * Mendapatkan pembayaran berdasarkan ID pesanan
   * @param {string} orderId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getPaymentByOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({
        message: `Pesanan dengan ID '${orderId}' tidak ditemukan.`,
      });

    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment)
      throw ApiError.notFound({
        message: `Pesanan '${order.orderNumber}' belum memiliki pembayaran.`,
      });

    return payment;
  }

  /**
   * Mendapatkan status pembayaran QRIS dari Midtrans
   * @param {string} orderId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getPaymentStatus(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({
        message: `Pesanan dengan ID '${orderId}' tidak ditemukan.`,
      });

    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment)
      throw ApiError.notFound({
        message: `Pesanan '${order.orderNumber}' belum memiliki pembayaran.`,
      });

    if (payment.method !== "QRIS") {
      return {
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
        method: payment.method,
        status: payment.status,
        amountPaid: payment.amountPaid,
        change: payment.change,
        paidAt: payment.paidAt,
      };
    }

    if (payment.status === "PAID" || payment.status === "REFUNDED") {
      return {
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
        method: payment.method,
        status: payment.status,
        amountPaid: payment.amountPaid,
        change: payment.change,
        paidAt: payment.paidAt,
      };
    }

    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const isMidtransProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

      const baseUrl = isMidtransProduction
        ? "https://api.midtrans.com/v2"
        : "https://api.sandbox.midtrans.com/v2";
      const authString = Buffer.from(`${serverKey}:`).toString("base64");

      const response = await axios.get(
        `${baseUrl}/${order.orderNumber}/status`,
        {
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const midtransStatus = response.data;
      logger.info("Status pembayaran dari Midtrans", {
        orderId,
        orderNumber: order.orderNumber,
        midtransStatus: midtransStatus.transaction_status,
        paymentStatus: payment.status,
      });

      return {
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
        method: payment.method,
        midtransTransactionId: midtransStatus.transaction_id,
        midtransStatus: midtransStatus.transaction_status,
        fraudStatus: midtransStatus.fraud_status,
        paymentType: midtransStatus.payment_type,
        grossAmount: midtransStatus.gross_amount,
        currency: midtransStatus.currency,
        transactionTime: midtransStatus.transaction_time,
        settlementTime: midtransStatus.settlement_time,
        expiryTime: midtransStatus.expiry_time,
        dbStatus: payment.status,
      };
    } catch (error) {
      logger.error("Gagal mendapatkan status dari Midtrans", {
        orderId,
        orderNumber: order.orderNumber,
        error: error.message,
      });
      return {
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
        method: payment.method,
        status: payment.status,
        amountPaid: payment.amountPaid,
        change: payment.change,
        paidAt: payment.paidAt,
        note: "Gagal mengambil status terbaru dari Midtrans",
      };
    }
  }

  /**
   * Verifikasi signature key webhook Midtrans
   * @param {Object} payload
   * @returns {boolean}
   * @private
   */
  #verifyWebhookSignature(payload) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const { order_id, status_code, gross_amount, signature_key } = payload;
    const payloadString = order_id + status_code + gross_amount + serverKey;
    const generatedSignature = crypto
      .createHash("sha512")
      .update(payloadString)
      .digest("hex");
    const isValid = generatedSignature === signature_key;

    if (!isValid) {
      logger.error("Webhook signature tidak valid", {
        order_id,
        expected: generatedSignature,
        received: signature_key,
      });
    }
    return isValid;
  }

  /**
   * Webhook handler untuk notifikasi pembayaran QRIS dari Midtrans
   * @param {Object} payload
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async handleMidtransWebhook(payload) {
    const {
      order_id: orderNumber,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      gross_amount: rawGrossAmount,
      transaction_id: transactionId,
      payment_type: paymentType,
      settlement_time: settlementTime,
    } = payload;

    const grossAmount = parseInt(rawGrossAmount);

    if (!this.#verifyWebhookSignature(payload)) {
      throw ApiError.unauthorized({
        message: "Signature webhook tidak valid.",
      });
    }

    logger.info("Menerima webhook Midtrans", {
      orderNumber,
      transactionStatus,
      fraudStatus,
      transactionId,
      paymentType,
    });

    const order = await prisma.order.findFirst({
      where: { orderNumber, deletedAt: null },
      include: {
        items: {
          include: { product: { select: { type: true } } },
        },
        customer: { select: { name: true } },
        vehicle: { select: { plateNumber: true, brand: true, model: true } },
      },
    });

    if (!order) {
      logger.error("Order tidak ditemukan untuk webhook", { orderNumber });
      throw ApiError.notFound({
        message: `Pesanan dengan nomor '${orderNumber}' tidak ditemukan.`,
      });
    }

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment) {
      logger.error("Payment tidak ditemukan untuk webhook", { orderNumber });
      throw ApiError.notFound({
        message: `Pembayaran untuk pesanan '${orderNumber}' tidak ditemukan.`,
      });
    }

    if (payment.status !== "PENDING") {
      logger.info("Payment sudah tidak PENDING, webhook diabaikan", {
        orderNumber,
        currentStatus: payment.status,
      });
      return;
    }

    if (grossAmount !== order.total) {
      logger.error("Gross amount tidak sesuai", {
        orderNumber,
        expectedAmount: order.total,
        receivedAmount: grossAmount,
      });
      throw ApiError.badRequest({
        message: "Jumlah pembayaran tidak sesuai dengan total pesanan.",
      });
    }

    const isSuccess =
      (transactionStatus === "capture" && fraudStatus === "accept") ||
      transactionStatus === "settlement";

    const isFailed =
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire" ||
      transactionStatus === "failure";

    const hasServiceItem = this.#hasServiceItem(order);
    const customerName = order.customer?.name || "Pelanggan";
    const vehicleInfo = this.#formatVehicleInfo(order.vehicle);

    if (isSuccess) {
      const newStatus = this.#getStatusAfterPayment(order);

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            amountPaid: grossAmount,
            paidAt: settlementTime ? new Date(settlementTime) : new Date(),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            ...(newStatus === "COMPLETED" && { completedAt: new Date() }),
          },
        });

        if (hasServiceItem) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: newStatus,
              changedById: order.cashierId,
              note: `Pembayaran QRIS berhasil (${paymentType}). Pesanan masuk antrian dan siap dikerjakan oleh mekanik.`,
            },
          });
        }
      });

      await this.#invalidateOrderHistoryCache(orderNumber);

      const itemDetails = this.#formatItemDetails(order.items);

      const notificationMessage = [
        `Pembayaran QRIS Berhasil`,
        ``,
        `Pesanan         : #${orderNumber}`,
        `Pelanggan       : ${customerName}`,
        `Kendaraan       : ${vehicleInfo}`,
        ``,
        `Rincian Pesanan:`,
        `${itemDetails}`,
        ``,
        `Total           : ${Currency.toIDR(grossAmount)}`,
        `Transaksi       : ${transactionId}`,
        `Metode          : ${paymentType}`,
        ``,
        `Status Pesanan  : ${newStatus}`,
        hasServiceItem
          ? `Pesanan masuk antrian dan menunggu pengerjaan mekanik.`
          : `Pesanan sparepart langsung selesai.`,
      ].join("\n");

      await this.#sendNotification(
        order.cashierId,
        `QRIS Berhasil - #${orderNumber}`,
        notificationMessage,
        "SUCCESS"
      );

      if (hasServiceItem) {
        const mechanics = await prisma.user.findMany({
          where: { role: "MECHANIC", isActive: true },
          select: { id: true, fullName: true },
        });

        const serviceItems = order.items.filter(
          (i) => i.product?.type === "SERVICE"
        );

        for (const mechanic of mechanics) {
          const mechanicMessage = [
            `Pesanan Baru Siap Dikerjakan`,
            ``,
            `Pesanan       : #${orderNumber}`,
            `Pelanggan     : ${customerName}`,
            `Kendaraan     : ${vehicleInfo}`,
            ``,
            `Item Service (${serviceItems.length}):`,
            `${this.#formatItemDetails(serviceItems)}`,
            ``,
            `Silakan ambil task dan mulai pengerjaan.`,
          ].join("\n");

          await this.#sendNotification(
            mechanic.id,
            `Task Baru - #${orderNumber}`,
            mechanicMessage,
            "INFO"
          );
        }
      }

      try {
        const io = getIO();
        io.emit("payment:status", {
          orderId: order.id,
          orderNumber,
          status: "PAID",
          paymentStatus: "Lunas",
        });
      } catch (socketError) {
        logger.error("Gagal emit socket event", {
          orderNumber,
          error: socketError.message,
        });
      }

      logger.info("Pembayaran QRIS berhasil", {
        orderNumber,
        transactionId,
        amount: grossAmount,
        newStatus,
      });
    } else if (isFailed) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });

        if (hasServiceItem) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: "DRAFT",
              changedById: order.cashierId,
              note: `Pembayaran QRIS gagal (${transactionStatus}). Pesanan tetap sebagai draft dan dapat dicoba kembali.`,
            },
          });
        }
      });

      await this.#invalidateOrderHistoryCache(orderNumber);

      const notificationMessage = [
        `Pembayaran QRIS Gagal`,
        ``,
        `Pesanan         : #${orderNumber}`,
        `Pelanggan       : ${customerName}`,
        `Total           : ${Currency.toIDR(grossAmount)}`,
        `Transaksi       : ${transactionId}`,
        ``,
        `Status          : ${transactionStatus}`,
        ``,
        `Pesanan tetap sebagai draft. Silakan coba lakukan pembayaran kembali.`,
      ].join("\n");

      await this.#sendNotification(
        order.cashierId,
        `QRIS Gagal - #${orderNumber}`,
        notificationMessage,
        "ERROR"
      );

      try {
        const io = getIO();
        io.emit("payment:status", {
          orderId: order.id,
          orderNumber,
          status: "REFUNDED",
          paymentStatus: "Gagal",
        });
      } catch (socketError) {
        logger.error("Gagal emit socket event", {
          orderNumber,
          error: socketError.message,
        });
      }

      logger.warn("Pembayaran QRIS gagal", {
        orderNumber,
        transactionId,
        transactionStatus,
        fraudStatus,
      });
    } else {
      logger.info("Status pembayaran tidak memerlukan tindakan", {
        orderNumber,
        transactionStatus,
      });
    }
  }

  /**
   * Merefund pembayaran yang sudah PAID
   * @param {string} paymentId
   * @param {Object} [payload]
   * @param {string} [payload.reason]
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async refundPayment(paymentId, payload = {}, userId) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment)
      throw ApiError.notFound({
        message: `Pembayaran dengan ID '${paymentId}' tidak ditemukan.`,
      });

    if (payment.status !== "PAID") {
      throw ApiError.conflict({
        message: `Hanya pembayaran dengan status PAID yang dapat direfund.`,
      });
    }

    const changedById = userId || payment.order.cashierId;
    const reason = payload.reason || "Tidak ada alasan";

    const order = await this.orderRepo.findById(payment.order.id);
    const hasServiceItem = this.#hasServiceItem(order);

    const updated = await prisma.$transaction(async (tx) => {
      const refunded = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "REFUNDED" },
        select: {
          id: true,
          method: true,
          amountPaid: true,
          change: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      });

      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "CANCELLED" },
      });

      if (hasServiceItem) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: "CANCELLED",
            changedById,
            note: `Pembayaran direfund. Alasan: ${reason}. Pesanan dibatalkan.`,
          },
        });
      }

      return refunded;
    });

    await this.#invalidateOrderHistoryCache(payment.order.orderNumber);

    const notificationMessage = [
      `Pembayaran Direfund`,
      ``,
      `Pesanan         : #${payment.order.orderNumber}`,
      `Jumlah          : ${Currency.toIDR(payment.amountPaid)}`,
      `Alasan          : ${reason}`,
      ``,
      `Status Pesanan  : CANCELLED`,
      ``,
      `Pesanan telah dibatalkan.`,
    ].join("\n");

    await this.#sendNotification(
      payment.order.cashierId || changedById,
      `Refund - #${payment.order.orderNumber}`,
      notificationMessage,
      "WARNING"
    );

    logger.warn("Pembayaran direfund, pesanan dibatalkan", {
      paymentId,
      orderId: payment.order.id,
      amountPaid: payment.amountPaid,
      reason,
    });

    return updated;
  }
}

export default PaymentService;