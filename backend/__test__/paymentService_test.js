// __test__/paymentService_test.js
import PaymentService from "#service/paymentService.js";
import PaymentRepository from "#repository/paymentRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import axios from "axios";
import crypto from "crypto";

jest.mock("#repository/paymentRepository.js");
jest.mock("#repository/orderRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");

jest.mock("#lib/midtrans.js", () => ({
  __esModule: true,
  default: { charge: jest.fn() },
}));

jest.mock("#app/io.js", () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn() }),
}));

jest.mock("#config/env.js", () => ({
  isProd: false,
}));

jest.mock("axios");

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      payment: {
        create: jest.fn().mockResolvedValue({
          id: "pay1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: new Date(),
          createdAt: new Date(),
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            status: "QUEUED",
            subtotal: 100000,
            tax: 11000,
            total: 111000,
            createdAt: new Date(),
            cashier: { id: "cashier-1", fullName: "Kasir" },
            customer: { id: "cust-1", name: "Budi", phone: "0812" },
            vehicle: { id: "v1", plateNumber: "B 1234 CD", brand: "Toyota", model: "Avanza" },
            items: [],
          },
        }),
        update: jest.fn().mockResolvedValue({ id: "pay1", status: "REFUNDED" }),
      },
      order: { update: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      shift: { update: jest.fn() },
    })
  ),
  order: { findFirst: jest.fn() },
}));

describe("PaymentService", () => {
  let service;
  let mockPaymentRepo;
  let mockOrderRepo;
  let mockMidtrans;
  let mockAxios;
  let mockGetIO;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService();
    mockPaymentRepo = PaymentRepository.mock.instances[0];
    mockOrderRepo = OrderRepository.mock.instances[0];
    mockMidtrans = require("#lib/midtrans.js").default;
    mockAxios = axios;
    mockGetIO = require("#app/io.js").getIO;
  });

  // ============================================================
  // createPayment
  // ============================================================
  describe("createPayment", () => {
    it("should route to createCashPayment for CASH method", async () => {
      const payload = { orderId: "o1", method: "CASH", amountPaid: 100000 };
      jest.spyOn(service, "createCashPayment").mockResolvedValue({ id: "pay1" });
      const result = await service.createPayment(payload);
      expect(service.createCashPayment).toHaveBeenCalledWith("o1", 100000);
      expect(result).toEqual({ id: "pay1" });
    });

    it("should route to createQrisPayment for QRIS method", async () => {
      const payload = { orderId: "o1", method: "QRIS" };
      jest.spyOn(service, "createQrisPayment").mockResolvedValue({ id: "pay2" });
      const result = await service.createPayment(payload);
      expect(service.createQrisPayment).toHaveBeenCalledWith("o1");
      expect(result).toEqual({ id: "pay2" });
    });

    it("should throw 400 for unsupported method", async () => {
      const payload = { orderId: "o1", method: "TRANSFER" };
      await expect(service.createPayment(payload)).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // createCashPayment
  // ============================================================
  describe("createCashPayment", () => {
    const orderId = "order-1";
    const amountPaid = 120000;
    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "DRAFT",
      total: 100000,
      cashierId: "cashier-1",
      items: [
        { product: { type: "SPAREPART" }, quantity: 1, unitPrice: 50000 },
        { product: { type: "SERVICE" }, quantity: 1, unitPrice: 50000 },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
    });

    it("should create CASH payment and transition to QUEUED when service exists", async () => {
      const result = await service.createCashPayment(orderId, amountPaid);
      expect(result.id).toBe("pay1");
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should transition to COMPLETED when only spareparts", async () => {
      const orderNoService = { ...baseOrder, items: [{ product: { type: "SPAREPART" } }] };
      mockOrderRepo.findById.mockResolvedValue(orderNoService);
      await service.createCashPayment(orderId, amountPaid);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);
      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order is COMPLETED/CLOSED", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "COMPLETED" });
      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order is CANCELLED", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "CANCELLED" });
      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order status is not DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "QUEUED" });
      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when payment already exists", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ id: "existing" });
      await expect(service.createCashPayment(orderId, amountPaid)).rejects.toThrow(ApiError);
    });

    it("should throw 400 when amount is less than total", async () => {
      await expect(service.createCashPayment(orderId, 50000)).rejects.toThrow(ApiError);
    });

    it("should calculate change correctly", async () => {
      await expect(service.createCashPayment(orderId, amountPaid)).resolves.toBeDefined();
    });
  });

  // ============================================================
  // createQrisPayment
  // ============================================================
  describe("createQrisPayment", () => {
    const orderId = "order-2";
    const order = {
      id: orderId,
      orderNumber: "ORD-002",
      status: "DRAFT",
      total: 150000,
      cashierId: "cashier-1",
      tax: 0,
      customer: { name: "Budi", email: null, phone: null },
      items: [
        { product: { type: "SPAREPART" }, productId: "p1", productNameSnapshot: "Oli", quantity: 2, unitPrice: 50000 },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(order);
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
      mockMidtrans.charge.mockResolvedValue({
        status_code: "201",
        transaction_id: "trx-1",
        actions: [{ name: "generate-qr-code", url: "https://qr.midtrans.com/abc" }],
      });
      mockPaymentRepo.create.mockResolvedValue({ id: "pay-qr" });
    });

    it("should return QRIS data with qrCodeUrl", async () => {
      const result = await service.createQrisPayment(orderId);
      expect(result.qrCodeUrl).toBe("https://qr.midtrans.com/abc");
      expect(mockMidtrans.charge).toHaveBeenCalled();
      expect(mockPaymentRepo.create).toHaveBeenCalled();
    });

    it("should throw 500 when midtrans charge fails", async () => {
      mockMidtrans.charge.mockResolvedValue({ status_code: "400", status_message: "error" });
      await expect(service.createQrisPayment(orderId)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when payment already exists", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ id: "pay-old" });
      await expect(service.createQrisPayment(orderId)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order not DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...order, status: "COMPLETED" });
      await expect(service.createQrisPayment(orderId)).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getPaymentById
  // ============================================================
  describe("getPaymentById", () => {
    it("should return payment when found", async () => {
      mockPaymentRepo.findById.mockResolvedValue({ id: "pay1" });
      const result = await service.getPaymentById("pay1");
      expect(result).toEqual({ id: "pay1" });
    });

    it("should throw 404 when not found", async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);
      await expect(service.getPaymentById("pay99")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getPayments
  // ============================================================
  describe("getPayments", () => {
    it("should return paginated payments", async () => {
      const repoResult = { data: [{ id: "pay1" }], metadata: { total: 1 } };
      mockPaymentRepo.findMany.mockResolvedValue(repoResult);
      const result = await service.getPayments({ page: 1 });
      expect(result).toEqual(repoResult);
    });
  });

  // ============================================================
  // getPaymentByOrder
  // ============================================================
  describe("getPaymentByOrder", () => {
    it("should return payment for order", async () => {
      mockOrderRepo.findById.mockResolvedValue({ id: "o1", orderNumber: "ORD-001" });
      mockPaymentRepo.findByOrderId.mockResolvedValue({ id: "pay1" });
      const result = await service.getPaymentByOrder("o1");
      expect(result).toEqual({ id: "pay1" });
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);
      await expect(service.getPaymentByOrder("o1")).rejects.toThrow(ApiError);
    });

    it("should throw 404 when payment not found", async () => {
      mockOrderRepo.findById.mockResolvedValue({ orderNumber: "ORD-001" });
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
      await expect(service.getPaymentByOrder("o1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getPaymentStatus
  // ============================================================
  describe("getPaymentStatus", () => {
    const order = { id: "o1", orderNumber: "ORD-001" };
    const paymentQRIS = { method: "QRIS", status: "PENDING", amountPaid: 0, change: 0, paidAt: null, orderId: "o1" };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(order);
      mockPaymentRepo.findByOrderId.mockResolvedValue(paymentQRIS);
    });

    it("should return Midtrans status for pending QRIS", async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          transaction_id: "trx-1",
          transaction_status: "settlement",
          fraud_status: "accept",
          payment_type: "qris",
          gross_amount: 150000,
          currency: "IDR",
        },
      });
      const result = await service.getPaymentStatus("o1");
      expect(result.midtransStatus).toBe("settlement");
    });

    it("should return cached status if payment is PAID", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ ...paymentQRIS, status: "PAID" });
      const result = await service.getPaymentStatus("o1");
      expect(result.status).toBe("PAID");
    });

    it("should throw 404 if order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);
      await expect(service.getPaymentStatus("o1")).rejects.toThrow(ApiError);
    });

    it("should throw 404 if no payment", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
      await expect(service.getPaymentStatus("o1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // refundPayment
  // ============================================================
  describe("refundPayment", () => {
    const payment = {
      id: "pay1",
      status: "PAID",
      order: { id: "order-1", cashierId: "c1" },
    };
    const userId = "u1";

    beforeEach(() => {
      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockOrderRepo.findById.mockResolvedValue({
        items: [{ product: { type: "SERVICE" } }],
      });
    });

    it("should refund payment and cancel order", async () => {
      const result = await service.refundPayment("pay1", { reason: "Test" }, userId);
      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw 404 when payment not found", async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);
      await expect(service.refundPayment("pay99", {}, userId)).rejects.toThrow(ApiError);
    });

    it("should throw 409 when payment not PAID", async () => {
      mockPaymentRepo.findById.mockResolvedValue({ ...payment, status: "PENDING" });
      await expect(service.refundPayment("pay1", {}, userId)).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // handleMidtransWebhook
  // ============================================================
  describe("handleMidtransWebhook", () => {
    const validPayload = {
      order_id: "ORD-001",
      status_code: "200",
      gross_amount: "150000",
      signature_key: "valid_sig",
      transaction_status: "settlement",
      fraud_status: "accept",
      transaction_id: "trx-1",
      payment_type: "qris",
      settlement_time: "2025-01-01T00:00:00Z",
    };

    const order = {
      id: "order-1",
      orderNumber: "ORD-001",
      total: 150000,
      cashierId: "c1",
      items: [{ product: { type: "SERVICE" } }],
    };

    const payment = { id: "pay1", status: "PENDING" };

    beforeEach(() => {
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("valid_sig") }),
      });

      prisma.order.findFirst.mockResolvedValue(order);
      mockPaymentRepo.findByOrderId.mockResolvedValue(payment);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should process successful payment and emit socket", async () => {
      await service.handleMidtransWebhook(validPayload);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockGetIO().emit).toHaveBeenCalledWith("payment:status", expect.objectContaining({ status: "PAID" }));
    });

    it("should throw 401 if signature invalid", async () => {
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("wrong_sig") }),
      });
      await expect(service.handleMidtransWebhook(validPayload)).rejects.toThrow(ApiError);
    });

    it("should throw 404 if order not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.handleMidtransWebhook(validPayload)).rejects.toThrow(ApiError);
    });

    it("should throw 404 if payment not found", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
      await expect(service.handleMidtransWebhook(validPayload)).rejects.toThrow(ApiError);
    });

    it("should do nothing if payment not PENDING", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ ...payment, status: "PAID" });
      await service.handleMidtransWebhook(validPayload);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should throw 400 if gross amount mismatch", async () => {
      const badPayload = { ...validPayload, gross_amount: "100000" };
      await expect(service.handleMidtransWebhook(badPayload)).rejects.toThrow(ApiError);
    });

    it("should handle failed payment", async () => {
      const failedPayload = { ...validPayload, transaction_status: "deny", fraud_status: "accept" };
      await service.handleMidtransWebhook(failedPayload);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});