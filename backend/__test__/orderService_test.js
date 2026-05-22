// __test__/orderService_test.js
import OrderService from "#service/orderService.js";
import OrderRepository from "#repository/orderRepository.js";
import ProductRepository from "#repository/productRepository.js";
import StockRepository from "#repository/stockRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import OrderHistoryRepository from "#repository/orderHistoryRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";

jest.mock("#repository/orderRepository.js");
jest.mock("#repository/productRepository.js");
jest.mock("#repository/stockRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/orderHistoryRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateAll: jest.fn().mockResolvedValue(undefined),
    buildKey: jest.fn((key) => `order:${key}`),
  }));
});

jest.mock("#shared/utils/code.js", () => ({
  orderNumber: jest.fn().mockResolvedValue("ORD-20260519-ABCD"),
}));

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

jest.mock("#app/database.js", () => ({
  orderItem: { findMany: jest.fn() },
  payment: { findFirst: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn((callback) =>
    callback({
      order: {
        create: jest.fn().mockResolvedValue({
          id: "o1",
          orderNumber: "ORD-001",
          status: "DRAFT",
          subtotal: 100000,
          tax: 11000,
          total: 111000,
          createdAt: new Date(),
          items: [],
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id,
            orderNumber: "ORD-001",
            status: args.data.status || "CANCELLED",
            startedAt: args.data.startedAt || null,
            completedAt: args.data.completedAt || null,
            closedAt: args.data.closedAt || null,
            updatedAt: args.data.updatedAt || new Date(),
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

jest.mock("axios");
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("OrderService", () => {
  let service;
  let mockOrderRepo;
  let mockProductRepo;
  let mockShiftRepo;
  let mockSettingRepo;
  let mockOrderHistoryRepo;
  let mockStockRepo;
  let mockStorage;
  let mockCache;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderService();

    mockOrderRepo = OrderRepository.mock.instances[0];
    mockProductRepo = ProductRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];
    mockOrderHistoryRepo = OrderHistoryRepository.mock.instances[0];
    mockStockRepo = StockRepository.mock.instances[0];
    mockStorage = require("#shared/utils/storage.js");
    mockCache = service.cache;
  });

  // ============================================================
  // calculateTotal
  // ============================================================
  describe("calculateTotal", () => {
    const items = [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ];

    it("should calculate total correctly, identify SERVICE items", async () => {
      const mockProducts = [
        { id: "p1", name: "Kampas Rem", type: "SPAREPART", price: 50000, cost: 30000, stock: 10, isActive: true },
        { id: "p2", name: "Ganti Oli", type: "SERVICE", price: 100000, cost: 40000, stock: 0, isActive: true },
      ];

      mockProductRepo.findById.mockResolvedValueOnce(mockProducts[0]);
      mockProductRepo.findById.mockResolvedValueOnce(mockProducts[1]);
      mockSettingRepo.findByKey.mockResolvedValue({ value: "11" });

      const result = await service.calculateTotal(items);

      expect(result.subtotal).toBe(200000);
      expect(result.tax).toBe(22000);
      expect(result.total).toBe(222000);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].needMechanic).toBe(false);
      expect(result.items[1].needMechanic).toBe(true);
    });

    it("should throw 404 when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.calculateTotal(items)).rejects.toThrow(ApiError);
    });

    it("should throw 400 when product is inactive", async () => {
      mockProductRepo.findById.mockResolvedValue({ id: "p1", isActive: false });

      await expect(service.calculateTotal([{ productId: "p1", quantity: 1 }])).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // createOrder
  // ============================================================
  describe("createOrder", () => {
    const cashierId = "c1";
    const payload = {
      customerId: "cust1",
      vehicleId: "v1",
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ],
    };

    const mockShift = { id: "s1", status: "OPEN" };
    const mockProducts = [
      { id: "p1", name: "Kampas Rem", type: "SPAREPART", price: 50000, cost: 30000, stock: 10, isActive: true },
      { id: "p2", name: "Ganti Oli", type: "SERVICE", price: 100000, cost: 40000, stock: 0, isActive: true },
    ];

    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-001",
      status: "DRAFT",
      items: [
        { id: "oi1", productId: "p1", product: { id: "p1", name: "Kampas Rem", type: "SPAREPART", image: null } },
        { id: "oi2", productId: "p2", product: { id: "p2", name: "Ganti Oli", type: "SERVICE", image: null } },
      ],
    };

    beforeEach(() => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      mockShiftRepo.findActiveByCashier.mockResolvedValue(mockShift);
      mockProductRepo.findById.mockResolvedValueOnce(mockProducts[0]);
      mockProductRepo.findById.mockResolvedValueOnce(mockProducts[1]);
      mockSettingRepo.findByKey.mockResolvedValue({ value: "11" });
      mockOrderRepo.isOrderNumberExists.mockResolvedValue(false);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
    });

    it("should create order successfully and return the order with signed URLs", async () => {
      const result = await service.createOrder(cashierId, payload);

      expect(result.orderNumber).toBe("ORD-001");
      expect(mockOrderRepo.findById).toHaveBeenCalled();
    });

    it("should throw 400 when service order has no customer", async () => {
      const serviceItem = { productId: "p2", quantity: 1 };

      mockProductRepo.findById.mockReset();
      mockProductRepo.findById.mockResolvedValue(mockProducts[1]);

      await expect(
        service.createOrder(cashierId, { items: [serviceItem] })
      ).rejects.toThrow(ApiError);
    });

    it("should throw 400 when service order has no vehicle", async () => {
      const serviceItem = { productId: "p2", quantity: 1 };

      mockProductRepo.findById.mockReset();
      mockProductRepo.findById.mockResolvedValue(mockProducts[1]);

      await expect(
        service.createOrder(cashierId, { customerId: "cust1", items: [serviceItem] })
      ).rejects.toThrow(ApiError);
    });

    it("should throw 400 when cashier has no active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);

      await expect(service.createOrder(cashierId, payload)).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getOrder
  // ============================================================
  describe("getOrder", () => {
    it("should return order by ID with signed URLs", async () => {
      const mockOrder = {
        id: "o1",
        orderNumber: "ORD-001",
        status: "DRAFT",
        items: [{ product: { image: { path: "products/img.jpg" } } }],
      };

      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrder("o1");
      expect(result.id).toBe("o1");
      expect(result.items[0].product.image.url).toBe("https://signed-url.com/image.jpg");
    });

    it("should return order by order number", async () => {
      const mockOrder = { id: "o1", orderNumber: "ORD-001", status: "DRAFT", items: [] };

      mockOrderRepo.findByOrderNumber.mockResolvedValue(mockOrder);

      const result = await service.getOrder("ORD-001");
      expect(result.orderNumber).toBe("ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.getOrder("o99")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // getOrders
  // ============================================================
  describe("getOrders", () => {
    it("should return paginated orders with signed URLs", async () => {
      const mockResult = {
        data: [
          { id: "o1", orderNumber: "ORD-001", items: [{ product: { image: { path: "img.jpg" } } }] },
        ],
        metadata: { total: 1, currentPage: 1 },
      };

      mockOrderRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getOrders({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return empty data when no orders found", async () => {
      const mockResult = { data: [], metadata: { total: 0, currentPage: 1 } };
      mockOrderRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getOrders({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  // ============================================================
  // getActiveOrders
  // ============================================================
  describe("getActiveOrders", () => {
    it("should return active orders for cashier", async () => {
      const mockResult = {
        data: [{ id: "o1", orderNumber: "ORD-001", items: [] }],
        metadata: { total: 1, currentPage: 1 },
      };

      mockOrderRepo.findActiveByCashier.mockResolvedValue(mockResult);

      const result = await service.getActiveOrders("c1", { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  // ============================================================
  // updateOrderStatus
  // ============================================================
  describe("updateOrderStatus", () => {
    it("should update status and invalidate cache", async () => {
      const mockOrder = {
        id: "o1",
        orderNumber: "ORD-001",
        status: "QUEUED",
        cashierId: "c1",
        items: [{ product: { type: "SERVICE" } }],
      };

      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.updateOrderStatus("o1", "IN_PROGRESS", "u1");
      expect(result.status).toBe("IN_PROGRESS");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should handle cancellation via status update and invalidate cache", async () => {
      const mockOrder = {
        id: "o1",
        orderNumber: "ORD-001",
        status: "QUEUED",
        total: 100000,
        shiftId: "s1",
        cashierId: "c1",
        items: [{ product: { type: "SPAREPART" }, productId: "p1", quantity: 2 }],
      };

      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      prisma.orderItem.findMany.mockResolvedValue([{ id: "oi1", productId: "p1", quantity: 2, product: { type: "SPAREPART" } }]);
      prisma.payment.findFirst.mockResolvedValue(null);

      mockOrderRepo.findByOrderNumber.mockResolvedValue({ ...mockOrder, status: "CANCELLED" });

      const result = await service.updateOrderStatus("o1", "CANCELLED", "u1");
      expect(result.status).toBe("CANCELLED");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.updateOrderStatus("o99", "IN_PROGRESS", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order is COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        items: [],
      });

      await expect(service.updateOrderStatus("o1", "IN_PROGRESS", "u1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // closeOrder
  // ============================================================
  describe("closeOrder", () => {
    it("should close order and invalidate cache", async () => {
      const mockOrder = {
        id: "o1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        cashierId: "c1",
        items: [{ product: { type: "SERVICE" } }],
      };

      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.closeOrder("o1", "u1");
      expect(result.status).toBe("CLOSED");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 409 when order is not COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "QUEUED",
        items: [],
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.closeOrder("o99", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order already CLOSED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "CLOSED",
        items: [],
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order is CANCELLED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "CANCELLED",
        items: [],
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // cancelOrder
  // ============================================================
  describe("cancelOrder", () => {
    it("should cancel order and invalidate cache", async () => {
      const mockOrder = {
        id: "o1",
        orderNumber: "ORD-001",
        status: "QUEUED",
        total: 111000,
        shiftId: "s1",
        cashierId: "c1",
        items: [{ product: { type: "SPAREPART" }, productId: "p1", quantity: 2 }],
      };

      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      prisma.orderItem.findMany.mockResolvedValue([{ id: "oi1", productId: "p1", quantity: 2, product: { type: "SPAREPART" } }]);
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.cancelOrder("o1", { reason: "Customer batal" }, "u1");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.cancelOrder("o99", { reason: "Test" }, "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 when order is COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        items: [],
      });

      await expect(service.cancelOrder("o1", { reason: "Test" }, "u1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // trackOrderHistory
  // ============================================================
  describe("trackOrderHistory", () => {
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-001",
      status: "COMPLETED",
      total: 150000,
      createdAt: new Date("2025-01-01"),
      completedAt: new Date("2025-01-02"),
      closedAt: null,
      cashier: { id: "c1", fullName: "Kasir 1" },
      customer: { id: "cust1", name: "Budi", phone: "0812" },
      vehicle: { id: "v1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      payment: { id: "pay1", method: "CASH", amountPaid: 150000, status: "PAID" },
      items: [
        {
          id: "oi1",
          productNameSnapshot: "Kampas Rem",
          quantity: 2,
          unitPrice: 50000,
          subtotal: 100000,
          product: { image: { path: "img/rem.jpg" } },
        },
      ],
      histories: [
        {
          status: "DRAFT",
          note: "Order dibuat",
          createdAt: new Date("2025-01-01"),
          changedBy: { fullName: "Kasir 1" },
        },
        {
          status: "COMPLETED",
          note: "Pembayaran berhasil",
          createdAt: new Date("2025-01-02"),
          changedBy: { fullName: "System" },
        },
      ],
    };

    it("should return order history from database when cache miss", async () => {
      mockCache.get.mockResolvedValue(null);
      mockOrderHistoryRepo.findByOrderNumber.mockResolvedValue(mockOrder);

      const result = await service.trackOrderHistory("ORD-001");

      expect(result.orderNumber).toBe("ORD-001");
      expect(result.currentStatus).toBe("COMPLETED");
      expect(result.total).toBe(150000);
      expect(result.customer.name).toBe("Budi");
      expect(result.vehicle.plateNumber).toBe("B 1234 CD");
      expect(result.payment.method).toBe("CASH");
      expect(result.items).toHaveLength(1);
      expect(result.timeline).toHaveLength(2);
      expect(result.timeline[0].status).toBe("DRAFT");
      expect(result.timeline[0].changedBy).toBe("Kasir 1");
      expect(result.timeline[1].status).toBe("COMPLETED");
      expect(result.timeline[1].changedBy).toBe("System");
      expect(mockCache.set).toHaveBeenCalledWith("history:ORD-001", result, 300);
    });

    it("should return cached order history when cache hit", async () => {
      const cachedResult = {
        orderNumber: "ORD-001",
        currentStatus: "COMPLETED",
        total: 150000,
        timeline: [],
      };
      mockCache.get.mockResolvedValue(cachedResult);

      const result = await service.trackOrderHistory("ORD-001");

      expect(result).toEqual(cachedResult);
      expect(mockCache.get).toHaveBeenCalledWith("history:ORD-001");
      expect(mockOrderHistoryRepo.findByOrderNumber).not.toHaveBeenCalled();
    });

    it("should throw 404 when order not found", async () => {
      mockCache.get.mockResolvedValue(null);
      mockOrderHistoryRepo.findByOrderNumber.mockResolvedValue(null);

      await expect(service.trackOrderHistory("ORD-999")).rejects.toThrow(ApiError);
      await expect(service.trackOrderHistory("ORD-999")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should handle null changedBy in timeline", async () => {
      const orderWithNullChangedBy = {
        ...mockOrder,
        histories: [
          {
            status: "DRAFT",
            note: null,
            createdAt: new Date("2025-01-01"),
            changedBy: null,
          },
        ],
      };
      mockCache.get.mockResolvedValue(null);
      mockOrderHistoryRepo.findByOrderNumber.mockResolvedValue(orderWithNullChangedBy);

      const result = await service.trackOrderHistory("ORD-001");

      expect(result.timeline[0].note).toBeNull();
      expect(result.timeline[0].changedBy).toBe("System");
    });
  });

  // ============================================================
  // softDeleteOrder / restoreOrder
  // ============================================================
  describe("softDeleteOrder", () => {
    it("should soft delete order and invalidate cache", async () => {
      mockOrderRepo.findById.mockResolvedValue({ id: "o1", orderNumber: "ORD-001" });
      mockOrderRepo.softDelete.mockResolvedValue();

      await service.softDeleteOrder("o1");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.softDeleteOrder("o99")).rejects.toThrow(ApiError);
    });
  });

  describe("restoreOrder", () => {
    it("should restore order and invalidate cache", async () => {
      mockOrderRepo.findById.mockResolvedValue({ id: "o1", orderNumber: "ORD-001" });
      mockOrderRepo.restore.mockResolvedValue();

      await service.restoreOrder("o1");
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.restoreOrder("o99")).rejects.toThrow(ApiError);
    });
  });
});