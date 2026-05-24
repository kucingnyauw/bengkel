import OrderService from "#service/orderService.js";

jest.mock("#repository/orderRepository.js");
jest.mock("#repository/productRepository.js");
jest.mock("#repository/stockRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/orderHistoryRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock("#shared/utils/code.js", () => ({
  orderNumber: jest.fn().mockResolvedValue("ORD-20260519-ABCD"),
}));

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("#app/database.js", () => ({
  orderItem: { findMany: jest.fn() },
  payment: { findFirst: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn((callback) =>
    callback({
      order: {
        create: jest.fn().mockResolvedValue({
          id: "o1", orderNumber: "ORD-001", status: "DRAFT", subtotal: 100000, tax: 11000, total: 111000,
          createdAt: new Date(), customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD" },
          items: [
            { productId: "p1", productNameSnapshot: "Kampas Rem", quantity: 2, unitPrice: 50000, subtotal: 100000, product: { type: "SPAREPART" } },
          ],
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id, orderNumber: "ORD-001", status: args.data.status || "CANCELLED",
            closedAt: args.data.closedAt || null, updatedAt: args.data.updatedAt || new Date(),
          })
        ),
      },
      orderStatusHistory: { create: jest.fn() },
      product: { update: jest.fn() },
      shift: { update: jest.fn() },
      stockMovement: { create: jest.fn() },
      payment: { deleteMany: jest.fn() },
    })
  ),
}));

/**
 * Unit test untuk OrderService
 * @describe OrderService
 */
describe("OrderService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderService();
  });

  /**
   * @describe calculateTotal
   */
  describe("calculateTotal", () => {
    /**
     * @test Menghitung total untuk SPAREPART dan SERVICE
     */
    it("should calculate total for SPAREPART and SERVICE", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      const { SettingRepository } = require("#repository/settingRepository.js");

      ProductRepository.mock.instances[0].findById
        .mockResolvedValueOnce({ id: "p1", name: "Kampas", type: "SPAREPART", price: 50000, stock: 10, isActive: true })
        .mockResolvedValueOnce({ id: "p2", name: "Servis", type: "SERVICE", price: 100000, stock: 0, isActive: true });
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ value: "11" });

      const result = await service.calculateTotal([
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ]);

      expect(result.subtotal).toBe(200000);
      expect(result.tax).toBe(22000);
    });

    /**
     * @test Melempar error ketika stok SPAREPART tidak mencukupi
     */
    it("should throw when SPAREPART stock insufficient", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "p1", name: "Oli", type: "SPAREPART", price: 50000, stock: 2, isActive: true,
      });

      await expect(
        service.calculateTotal([{ productId: "p1", quantity: 5 }])
      ).rejects.toThrow(/Stok produk.*tidak mencukupi/);
    });

    /**
     * @test Melempar 404 ketika produk tidak ditemukan
     */
    it("should throw 404 when product not found", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(
        service.calculateTotal([{ productId: "p99", quantity: 1 }])
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe createOrder
   */
  describe("createOrder", () => {
    const cashierId = "c1";

    beforeEach(() => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { SettingRepository } = require("#repository/settingRepository.js");
      const { OrderRepository } = require("#repository/orderRepository.js");

      ShiftRepository.mock.instances[0].hasActiveShift.mockResolvedValue(true);
      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({ id: "s1", status: "OPEN" });
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ value: "11" });
      OrderRepository.mock.instances[0].isOrderNumberExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001", items: [],
      });
    });

    /**
     * @test Membuat pesanan SPAREPART tanpa customer
     */
    it("should create SPAREPART only order without customer", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "p1", type: "SPAREPART", price: 50000, stock: 10, isActive: true,
      });

      const result = await service.createOrder(cashierId, {
        customerId: null, vehicleId: null, items: [{ productId: "p1", quantity: 1 }],
      });

      expect(result).toBeDefined();
    });

    /**
     * @test Melempar 400 ketika pesanan SERVICE tanpa customer
     */
    it("should throw 400 when service order has no customer", async () => {
      const { ProductRepository } = require("#repository/productRepository.js");
      ProductRepository.mock.instances[0].findById.mockResolvedValue({
        id: "p2", type: "SERVICE", price: 100000, isActive: true,
      });

      await expect(
        service.createOrder(cashierId, { items: [{ productId: "p2", quantity: 1 }] })
      ).rejects.toThrow(/memerlukan customer/);
    });

    /**
     * @test Melempar 400 ketika kasir tidak memiliki shift aktif
     */
    it("should throw 400 when cashier has no active shift", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].hasActiveShift.mockResolvedValue(false);

      await expect(
        service.createOrder(cashierId, { items: [{ productId: "p1", quantity: 1 }] })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe updateOrderStatus
   */
  describe("updateOrderStatus", () => {
    const mockOrder = {
      id: "o1", orderNumber: "ORD-001", status: "QUEUED", total: 100000,
      shiftId: "s1", cashierId: "c1",
      items: [{ product: { type: "SPAREPART" }, productId: "p1", quantity: 2 }],
    };

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(mockOrder);
      OrderRepository.mock.instances[0].findByOrderNumber.mockResolvedValue({
        ...mockOrder, status: "CANCELLED",
      });

      const { default: prisma } = require("#app/database.js");
      prisma.orderItem.findMany.mockResolvedValue([
        { id: "oi1", productId: "p1", quantity: 2, product: { type: "SPAREPART" } },
      ]);
    });

    /**
     * @test Membatalkan pesanan dan membatalkan transaksi Midtrans QRIS
     */
    it("should cancel order and cancel Midtrans QRIS transaction", async () => {
      const { default: prisma } = require("#app/database.js");
      prisma.payment.findFirst.mockResolvedValue({ id: "pay1", method: "QRIS", status: "PENDING" });

      const { default: axios } = require("axios");
      axios.post.mockResolvedValue({ data: { status_code: "200" } });

      process.env.MIDTRANS_IS_PRODUCTION = "true";
      const result = await service.updateOrderStatus("o1", "CANCELLED", "u1");

      expect(result.status).toBe("CANCELLED");
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("api.midtrans.com"),
        expect.any(Object),
        expect.any(Object)
      );
      process.env.MIDTRANS_IS_PRODUCTION = "false";
    });

    /**
     * @test Menangani Midtrans 404 dengan graceful
     */
    it("should handle Midtrans 404 gracefully", async () => {
      const { default: prisma } = require("#app/database.js");
      prisma.payment.findFirst.mockResolvedValue({ id: "pay1", method: "QRIS", status: "PENDING" });

      const { default: axios } = require("axios");
      axios.post.mockRejectedValue({ response: { status: 404 } });

      const result = await service.updateOrderStatus("o1", "CANCELLED", "u1");
      expect(result.status).toBe("CANCELLED");
    });

    /**
     * @test Melempar internal error ketika Midtrans gagal non-404
     */
    it("should throw internal error when Midtrans fails with non-404", async () => {
      const { default: prisma } = require("#app/database.js");
      prisma.payment.findFirst.mockResolvedValue({ id: "pay1", method: "QRIS", status: "PENDING" });

      const { default: axios } = require("axios");
      axios.post.mockRejectedValue({ response: { status: 500 } });

      await expect(
        service.updateOrderStatus("o1", "CANCELLED", "u1")
      ).rejects.toThrow(/Gagal membatalkan transaksi di Midtrans/);
    });
  });

  /**
   * @describe cancelOrder
   */
  describe("cancelOrder", () => {
    /**
     * @test Notifikasi admin ketika total >= 500000
     */
    it("should notify admins when total >= 500000", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { UserRepository } = require("#repository/userRepository.js");
      const { NotificationRepository } = require("#repository/notificationRepository.js");

      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001", status: "QUEUED", total: 600000,
        shiftId: "s1", cashierId: "c1", items: [],
      });
      UserRepository.mock.instances[0].findByRole.mockResolvedValue([
        { id: "admin1", isActive: true },
      ]);

      const { default: prisma } = require("#app/database.js");
      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.cancelOrder("o1", { reason: "Batal" }, "u1");

      expect(NotificationRepository.mock.instances[0].create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Pesanan Besar Dibatalkan"),
        })
      );
    });
  });

  /**
   * @describe getOrder
   */
  describe("getOrder", () => {
    /**
     * @test Mengembalikan pesanan berdasarkan nomor pesanan
     */
    it("should return order by order number", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findByOrderNumber.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001", items: [],
      });

      const result = await service.getOrder("ORD-001");
      expect(result.orderNumber).toBe("ORD-001");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findByOrderNumber.mockResolvedValue(null);
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getOrder("ORD-999")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getOrders
   */
  describe("getOrders", () => {
    /**
     * @test Mengembalikan pesanan dengan paginasi
     */
    it("should return paginated orders", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [], metadata: { total: 0 },
      });

      await service.getOrders();
      expect(OrderRepository.mock.instances[0].findMany).toHaveBeenCalledWith({});
    });
  });

  /**
   * @describe getActiveOrders
   */
  describe("getActiveOrders", () => {
    /**
     * @test Mengembalikan pesanan aktif kasir
     */
    it("should return active orders for cashier", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        data: [], metadata: { total: 0 },
      });

      await service.getActiveOrders("c1");
      expect(OrderRepository.mock.instances[0].findActiveByCashier).toHaveBeenCalledWith("c1", {});
    });
  });

  /**
   * @describe closeOrder
   */
  describe("closeOrder", () => {
    /**
     * @test Menutup pesanan COMPLETED
     */
    it("should close COMPLETED order", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001", status: "COMPLETED",
        items: [{ product: { type: "SERVICE" } }],
        customer: { name: "Budi" },
        vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        total: 111000,
      });

      const result = await service.closeOrder("o1", "u1");
      expect(result.status).toBe("CLOSED");
    });

    /**
     * @test Melempar 409 ketika pesanan bukan COMPLETED
     */
    it("should throw 409 when order is not COMPLETED", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001", status: "QUEUED", items: [],
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe softDeleteOrder
   */
  describe("softDeleteOrder", () => {
    /**
     * @test Soft delete pesanan
     */
    it("should soft delete order", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001",
      });
      OrderRepository.mock.instances[0].softDelete.mockResolvedValue();

      await service.softDeleteOrder("o1");
      expect(OrderRepository.mock.instances[0].softDelete).toHaveBeenCalledWith("o1");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.softDeleteOrder("o99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe restoreOrder
   */
  describe("restoreOrder", () => {
    /**
     * @test Restore pesanan
     */
    it("should restore order", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "o1", orderNumber: "ORD-001",
      });
      OrderRepository.mock.instances[0].restore.mockResolvedValue();

      await service.restoreOrder("o1");
      expect(OrderRepository.mock.instances[0].restore).toHaveBeenCalledWith("o1");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.restoreOrder("o99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe trackOrderHistory
   */
  describe("trackOrderHistory", () => {
    /**
     * @test Mengembalikan riwayat pesanan dari cache
     */
    it("should return cached order history", async () => {
      const cached = { orderNumber: "ORD-001", currentStatus: "COMPLETED" };
      service.cache.get.mockResolvedValue(cached);

      const result = await service.trackOrderHistory("ORD-001");
      expect(result).toEqual(cached);
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      service.cache.get.mockResolvedValue(null);
      const { OrderHistoryRepository } = require("#repository/orderHistoryRepository.js");
      OrderHistoryRepository.mock.instances[0].findByOrderNumber.mockResolvedValue(null);

      await expect(service.trackOrderHistory("ORD-999")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});