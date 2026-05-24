import PaymentService from "#service/paymentService.js";

jest.mock("#repository/paymentRepository.js");
jest.mock("#repository/orderRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");
jest.mock("#repository/settingRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock("#lib/midtrans.js", () => ({
  __esModule: true,
  default: { charge: jest.fn() },
}));

jest.mock("#app/io.js", () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn() }),
}));

jest.mock("axios");

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      payment: {
        create: jest.fn().mockResolvedValue({
          id: "pay1", method: "CASH", amountPaid: 120000, change: 20000,
          status: "PAID", paidAt: new Date(), createdAt: new Date(),
          order: {
            id: "order-1", orderNumber: "ORD-001", status: "QUEUED",
            subtotal: 100000, tax: 11000, total: 111000, createdAt: new Date(),
            cashier: { id: "cashier-1", fullName: "Kasir" },
            customer: { id: "cust-1", name: "Budi", phone: "0812" },
            vehicle: { id: "v1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
            items: [],
          },
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, status: args.data.status || "REFUNDED" })
        ),
      },
      order: { update: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
    })
  ),
  order: { findFirst: jest.fn() },
  user: { findMany: jest.fn().mockResolvedValue([{ id: "mech-1", fullName: "Joko", isActive: true }]) },
}));

/**
 * Unit test untuk PaymentService
 * @describe PaymentService
 */
describe("PaymentService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService();

    const { NotificationRepository } = require("#repository/notificationRepository.js");
    NotificationRepository.mock.instances[0].create.mockResolvedValue({});
  });

  /**
   * @describe createPayment
   */
  describe("createPayment", () => {
    /**
     * @test Mengarahkan ke createCashPayment untuk metode CASH
     */
    it("should route to createCashPayment for CASH", async () => {
      jest.spyOn(service, "createCashPayment").mockResolvedValue({ id: "pay1" });
      await service.createPayment({ orderId: "o1", method: "CASH", amountPaid: 100000 });
      expect(service.createCashPayment).toHaveBeenCalledWith("o1", 100000);
    });

    /**
     * @test Mengarahkan ke createQrisPayment untuk metode QRIS
     */
    it("should route to createQrisPayment for QRIS", async () => {
      jest.spyOn(service, "createQrisPayment").mockResolvedValue({ id: "pay2" });
      await service.createPayment({ orderId: "o1", method: "QRIS" });
      expect(service.createQrisPayment).toHaveBeenCalledWith("o1");
    });

    /**
     * @test Melempar 400 untuk metode tidak didukung
     */
    it("should throw 400 for unsupported method", async () => {
      await expect(
        service.createPayment({ orderId: "o1", method: "TRANSFER" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe createCashPayment
   */
  describe("createCashPayment", () => {
    const orderId = "order-1";
    const amountPaid = 120000;
    const baseOrder = {
      id: orderId, orderNumber: "ORD-001", status: "DRAFT", total: 100000,
      cashierId: "cashier-1", customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        { product: { type: "SPAREPART" }, quantity: 1, unitPrice: 50000, subtotal: 50000, productNameSnapshot: "Oli" },
        { product: { type: "SERVICE" }, quantity: 1, unitPrice: 50000, subtotal: 50000, productNameSnapshot: "Ganti Oli" },
      ],
    };

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(baseOrder);
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue(null);
    });

    /**
     * @test Membuat pembayaran CASH dan transisi ke QUEUED
     */
    it("should create CASH payment and transition to QUEUED", async () => {
      const result = await service.createCashPayment(orderId, amountPaid);
      expect(result.id).toBe("pay1");
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    /**
     * @test Transisi ke COMPLETED ketika hanya sparepart
     */
    it("should transition to COMPLETED when only spareparts", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        ...baseOrder,
        items: [{ product: { type: "SPAREPART" }, quantity: 1, unitPrice: 50000, subtotal: 50000, productNameSnapshot: "Oli" }],
      });

      await service.createCashPayment(orderId, amountPaid);
      expect(require("#app/database.js").$transaction).toHaveBeenCalled();
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 409 ketika pesanan COMPLETED
     */
    it("should throw 409 when order is COMPLETED", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({ ...baseOrder, status: "COMPLETED" });

      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toMatchObject({ statusCode: 409 });
    });

    /**
     * @test Melempar 400 ketika jumlah kurang dari total
     */
    it("should throw 400 when amount less than total", async () => {
      await expect(service.createCashPayment(orderId, 50000)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 409 ketika pembayaran sudah ada
     */
    it("should throw 409 when payment exists", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue({ id: "existing" });

      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe createQrisPayment
   */
  describe("createQrisPayment", () => {
    const order = {
      id: "order-2", orderNumber: "ORD-002", status: "DRAFT", total: 150000,
      cashierId: "cashier-1", tax: 0, customer: { name: "Budi", email: null, phone: null },
      items: [{ product: { type: "SPAREPART" }, productId: "p1", productNameSnapshot: "Oli", quantity: 2, unitPrice: 50000 }],
    };

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(order);
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue(null);

      const { default: midtrans } = require("#lib/midtrans.js");
      midtrans.charge.mockResolvedValue({
        status_code: "201", transaction_id: "trx-1",
        actions: [{ name: "generate-qr-code", url: "https://qr.midtrans.com/abc" }],
      });
      PaymentRepository.mock.instances[0].create.mockResolvedValue({ id: "pay-qr" });
    });

    /**
     * @test Mengembalikan data QRIS dengan qrCodeUrl
     */
    it("should return QRIS data with qrCodeUrl", async () => {
      const result = await service.createQrisPayment("order-2");
      expect(result.qrCodeUrl).toBe("https://qr.midtrans.com/abc");
    });

    /**
     * @test Melempar 500 ketika Midtrans gagal
     */
    it("should throw 500 when Midtrans fails", async () => {
      const { default: midtrans } = require("#lib/midtrans.js");
      midtrans.charge.mockResolvedValue({ status_code: "400", status_message: "error" });

      await expect(service.createQrisPayment("order-2")).rejects.toMatchObject({ statusCode: 500 });
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.createQrisPayment("order-2")).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 409 ketika pembayaran sudah ada
     */
    it("should throw 409 when payment exists", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue({ id: "pay-old" });

      await expect(service.createQrisPayment("order-2")).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe getPaymentById
   */
  describe("getPaymentById", () => {
    /**
     * @test Mengembalikan pembayaran ketika ditemukan
     */
    it("should return payment when found", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findById.mockResolvedValue({ id: "pay1" });

      const result = await service.getPaymentById("pay1");
      expect(result).toEqual({ id: "pay1" });
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getPaymentById("pay99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getPayments
   */
  describe("getPayments", () => {
    /**
     * @test Mengembalikan pembayaran dengan taxRate
     */
    it("should return payments with taxRate", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [{ id: "pay1", order: { subtotal: 100000, tax: 11000 } }],
        metadata: { total: 1 },
      });

      const result = await service.getPayments({});
      expect(result.data[0].order.taxRate).toBe(11);
    });
  });

  /**
   * @describe getPaymentByOrder
   */
  describe("getPaymentByOrder", () => {
    /**
     * @test Mengembalikan pembayaran untuk pesanan
     */
    it("should return payment for order", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({ id: "o1", orderNumber: "ORD-001" });
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue({ id: "pay1" });

      const result = await service.getPaymentByOrder("o1");
      expect(result).toEqual({ id: "pay1" });
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getPaymentByOrder("o1")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe refundPayment
   */
  describe("refundPayment", () => {
    const payment = {
      id: "pay1", status: "PAID", amountPaid: 150000,
      order: { id: "order-1", cashierId: "c1", orderNumber: "ORD-001" },
    };

    /**
     * @test Refund pembayaran dan batalkan pesanan
     */
    it("should refund payment and cancel order", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      const { OrderRepository } = require("#repository/orderRepository.js");
      PaymentRepository.mock.instances[0].findById.mockResolvedValue(payment);
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        items: [{ product: { type: "SERVICE" } }],
      });

      const result = await service.refundPayment("pay1", { reason: "Test" }, "u1");
      expect(result.status).toBe("REFUNDED");
    });

    /**
     * @test Melempar 404 ketika pembayaran tidak ditemukan
     */
    it("should throw 404 when payment not found", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.refundPayment("pay99", {}, "u1")).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 409 ketika pembayaran bukan PAID
     */
    it("should throw 409 when payment not PAID", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findById.mockResolvedValue({ ...payment, status: "PENDING" });

      await expect(service.refundPayment("pay1", {}, "u1")).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe handleMidtransWebhook
   */
  describe("handleMidtransWebhook", () => {
    const validPayload = {
      order_id: "ORD-001", status_code: "200", gross_amount: "150000",
      signature_key: "valid_sig", transaction_status: "settlement",
      fraud_status: "accept", transaction_id: "trx-1", payment_type: "qris",
    };

    const order = {
      id: "order-1", orderNumber: "ORD-001", total: 150000, cashierId: "c1",
      customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [{ product: { type: "SERVICE" }, productNameSnapshot: "Ganti Oli", quantity: 1, unitPrice: 150000, subtotal: 150000 }],
    };

    beforeEach(() => {
      const crypto = require("crypto");
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("valid_sig") }),
      });

      const { default: prisma } = require("#app/database.js");
      prisma.order.findFirst.mockResolvedValue(order);

      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue({ id: "pay1", status: "PENDING" });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    /**
     * @test Memproses pembayaran sukses
     */
    it("should process successful payment", async () => {
      await service.handleMidtransWebhook(validPayload);
      expect(require("#app/database.js").$transaction).toHaveBeenCalled();
    });

    /**
     * @test Menangani pembayaran gagal
     */
    it("should handle failed payment", async () => {
      await service.handleMidtransWebhook({ ...validPayload, transaction_status: "deny" });
      expect(require("#app/database.js").$transaction).toHaveBeenCalled();
    });

    /**
     * @test Melempar 401 jika signature invalid
     */
    it("should throw 401 when signature invalid", async () => {
      const crypto = require("crypto");
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("wrong_sig") }),
      });

      await expect(service.handleMidtransWebhook(validPayload)).rejects.toMatchObject({ statusCode: 401 });
    });

    /**
     * @test Tidak melakukan apa-apa jika payment bukan PENDING
     */
    it("should skip when payment not PENDING", async () => {
      const { PaymentRepository } = require("#repository/paymentRepository.js");
      PaymentRepository.mock.instances[0].findByOrderId.mockResolvedValue({ status: "PAID" });

      await service.handleMidtransWebhook(validPayload);
      expect(require("#app/database.js").$transaction).not.toHaveBeenCalled();
    });

    /**
     * @test Melempar 400 jika gross amount tidak cocok
     */
    it("should throw 400 when gross amount mismatch", async () => {
      await expect(
        service.handleMidtransWebhook({ ...validPayload, gross_amount: "100000" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 404 jika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { default: prisma } = require("#app/database.js");
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.handleMidtransWebhook(validPayload)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});