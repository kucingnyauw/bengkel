// __test__/taskService_test.js
import TaskService from "#service/taskService.js";
import TaskRepository from "#repository/taskRepository.js";
import UserRepository from "#repository/userRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";

jest.mock("#repository/taskRepository.js");
jest.mock("#repository/userRepository.js");
jest.mock("#repository/orderRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/settingRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateAll: jest.fn().mockResolvedValue(undefined),
    buildKey: jest.fn((key) => `order:${key}`),
  }));
});

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

jest.mock("#app/database.js", () => ({
  mechanicAssignment: { findMany: jest.fn() },
  orderStatusHistory: { create: jest.fn() },
  $transaction: jest.fn((fn) => fn({
    order: { update: jest.fn().mockResolvedValue({}) },
    orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    shift: { update: jest.fn().mockResolvedValue({}) },
    stockMovement: { create: jest.fn().mockResolvedValue({}) },
    payment: { deleteMany: jest.fn().mockResolvedValue({}) },
    product: { update: jest.fn().mockResolvedValue({}) },
  })),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("TaskService", () => {
  let service;
  let mockTaskRepo;
  let mockUserRepo;
  let mockOrderRepo;
  let mockNotifRepo;
  let mockSettingRepo;
  let mockCache;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService();

    mockTaskRepo = TaskRepository.mock.instances[0];
    mockUserRepo = UserRepository.mock.instances[0];
    mockOrderRepo = OrderRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];

    mockCache = service.cache;
    mockSettingRepo.findByKey.mockResolvedValue({ value: "5" });
    mockStorage = require("#shared/utils/storage.js");
  });

  // ============================================================
  // assignMechanicToOrder
  // ============================================================
  describe("assignMechanicToOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";

    const mockMechanic = {
      id: mechanicId,
      fullName: "Joko",
      role: "MECHANIC",
    };

    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli" },
          productNameSnapshot: "Ganti Oli",
          assignments: [],
        },
        {
          id: "oi-2",
          product: { type: "SERVICE", name: "Tune Up" },
          productNameSnapshot: "Tune Up",
          assignments: [],
        },
      ],
    };

    const mockAssignment = (itemId) => ({
      id: `a-${itemId}`,
      orderItemId: itemId,
      mechanicId,
    });

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockTaskRepo.assignMechanic.mockImplementation((itemId) =>
        Promise.resolve(mockAssignment(itemId))
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should assign mechanic to all unassigned service items and invalidate cache", async () => {
      const result = await service.assignMechanicToOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(result[0].orderItemId).toBe("oi-1");
      expect(result[1].orderItemId).toBe("oi-2");
      expect(mockTaskRepo.getActiveTaskCount).toHaveBeenCalledWith(mechanicId);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledTimes(2);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledWith("oi-1", mechanicId);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledWith("oi-2", mechanicId);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId,
          status: "QUEUED",
          changedById: mechanicId,
          note: expect.stringContaining("Joko ditugaskan ke 2 item service"),
        }),
      });
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mechanicId,
          title: "Tugas Baru Diterima",
          type: "INFO",
        })
      );
    });

    it("should throw 400 when user is not a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: mechanicId, role: "CASHIER" });

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when mechanic is not available (max capacity reached)", async () => {
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(5);

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when order status is not QUEUED", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: "DRAFT" });

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when order has no service items", async () => {
      const orderNoService = {
        ...mockOrder,
        items: [{ id: "oi-1", product: { type: "SPAREPART" }, assignments: [] }],
      };
      mockOrderRepo.findById.mockResolvedValue(orderNoService);

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when all service items already have assignments", async () => {
      const allAssigned = {
        ...mockOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE" },
            assignments: [{ id: "a-old" }],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(allAssigned);

      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.assignMechanicToOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // unassignMechanicFromOrder
  // ============================================================
  describe("unassignMechanicFromOrder", () => {
    const orderId = "order-1";
    const userId = "cashier-1";

    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      cashierId: userId,
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE" },
          assignments: [
            { id: "a1", mechanicId: "m1", mechanic: { fullName: "Joko" } },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.unassignMechanic.mockResolvedValue(undefined);
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should unassign all mechanics from service items, invalidate cache, and send notifications", async () => {
      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledTimes(1);
      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledWith("a1");
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            status: "QUEUED",
            changedById: userId,
            note: expect.stringContaining("Joko dilepas"),
          }),
        })
      );
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "m1",
          title: "Penugasan Dilepas",
          type: "WARNING",
        })
      );
    });

    it("should unassign from IN_PROGRESS order", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "IN_PROGRESS" });

      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledTimes(1);
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toThrow(ApiError);
      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it.each(["COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw 400 when order status is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status });

        await expect(service.unassignMechanicFromOrder(orderId, userId))
          .rejects.toThrow(ApiError);
        await expect(service.unassignMechanicFromOrder(orderId, userId))
          .rejects.toMatchObject({ statusCode: 400 });
      }
    );

    it("should throw 400 when order is DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "DRAFT" });

      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toThrow(ApiError);
      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when no mechanic is assigned to service items", async () => {
      const orderWithoutAssignment = {
        ...baseOrder,
        items: [
          { id: "oi-1", product: { type: "SERVICE" }, assignments: [] },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderWithoutAssignment);

      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toThrow(ApiError);
      await expect(service.unassignMechanicFromOrder(orderId, userId))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // getTaskById
  // ============================================================
  describe("getTaskById", () => {
    it("should return assignment and add signed URL if product image exists", async () => {
      const assignment = {
        id: "a1",
        orderItem: {
          product: {
            id: "p1",
            name: "Ganti Oli",
            image: { path: "product-images/oli.jpg" },
          },
        },
      };
      mockTaskRepo.findById.mockResolvedValue(assignment);

      const result = await service.getTaskById("a1");

      expect(result.orderItem.product.image.url).toBe("https://signed-url.com/image.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("product-images/oli.jpg");
    });

    it("should return assignment without signed URL if no image", async () => {
      const assignment = {
        id: "a1",
        orderItem: {
          product: {
            id: "p1",
            name: "Ganti Oli",
            image: null,
          },
        },
      };
      mockTaskRepo.findById.mockResolvedValue(assignment);

      const result = await service.getTaskById("a1");

      expect(result.orderItem.product.image).toBeNull();
    });

    it("should throw 404 when assignment not found", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(service.getTaskById("a99")).rejects.toThrow(ApiError);
      await expect(service.getTaskById("a99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getTasksByOrderId
  // ============================================================
  describe("getTasksByOrderId", () => {
    const orderId = "order-1";
    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "IN_PROGRESS",
      total: 150000,
      createdAt: new Date("2025-01-01"),
      startedAt: new Date("2025-01-02"),
      completedAt: null,
      customer: { id: "c1", name: "Budi", phone: "0812" },
      vehicle: { id: "v1", plateNumber: "B 1234 CD", brand: "Toyota", model: "Avanza" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli", image: { path: "img/oli.jpg" } },
          productNameSnapshot: "Ganti Oli",
          quantity: 1,
          unitPrice: 50000,
          subtotal: 50000,
          assignments: [],
        },
      ],
    };

    it("should return order with grouped services, assignments, and signed URLs", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: { id: "m1", fullName: "Joko" },
          startAt: new Date("2025-01-02T10:00:00"),
          endAt: null,
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);

      expect(result.orderId).toBe(orderId);
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.customer.name).toBe("Budi");
      expect(result.services).toHaveLength(1);
      const svc = result.services[0];
      expect(svc.serviceName).toBe("Ganti Oli");
      expect(svc.assignments).toHaveLength(1);
      expect(svc.assignments[0].status).toBe("IN_PROGRESS");
      expect(svc.assignments[0].statusLabel).toBe("Dikerjakan");
      expect(svc.product.image).toBe("https://signed-url.com/image.jpg");
    });

    it("should return assignments with COMPLETED status when endAt exists", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: { id: "m1", fullName: "Joko" },
          startAt: new Date("2025-01-02T10:00:00"),
          endAt: new Date("2025-01-02T11:00:00"),
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);
      const svc = result.services[0];
      expect(svc.assignments[0].status).toBe("COMPLETED");
      expect(svc.assignments[0].statusLabel).toBe("Selesai");
    });

    it("should return assignments with PENDING status when no startAt", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: null,
          startAt: null,
          endAt: null,
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);
      const svc = result.services[0];
      expect(svc.assignments[0].status).toBe("PENDING");
      expect(svc.assignments[0].statusLabel).toBe("Menunggu");
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.getTasksByOrderId("bad-order")).rejects.toThrow(ApiError);
      await expect(service.getTasksByOrderId("bad-order")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getTasks
  // ============================================================
  describe("getTasks", () => {
    it("should delegate to taskRepo.findMany with query", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.findMany.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10, status: "IN_PROGRESS" };
      const result = await service.getTasks(query);

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMany).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // getTasksByMechanic
  // ============================================================
  describe("getTasksByMechanic", () => {
    it("should group assignments by order", async () => {
      const assignments = [
        {
          id: "a1",
          orderItem: {
            id: "oi-1",
            productNameSnapshot: "Ganti Oli",
            product: { name: "Ganti Oli" },
            order: {
              id: "order-1",
              orderNumber: "ORD-001",
              status: "QUEUED",
              createdAt: new Date(),
              customer: { name: "Budi" },
              vehicle: { plateNumber: "B 1234 CD" },
            },
          },
          startAt: null,
          endAt: null,
        },
      ];

      mockTaskRepo.findByMechanicId.mockResolvedValue(assignments);

      const result = await service.getTasksByMechanic("m1");

      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe("order-1");
      expect(result[0].services).toHaveLength(1);
      expect(result[0].services[0].name).toBe("Ganti Oli");
    });

    it("should skip assignments without order", async () => {
      mockTaskRepo.findByMechanicId.mockResolvedValue([
        { id: "a1", orderItem: null },
      ]);

      const result = await service.getTasksByMechanic("m1");
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // getTasksByOrderItem
  // ============================================================
  describe("getTasksByOrderItem", () => {
    it("should delegate to repo.findByOrderItemId", async () => {
      const mockAssignments = [{ id: "a1" }];
      mockTaskRepo.findByOrderItemId.mockResolvedValue(mockAssignments);

      const result = await service.getTasksByOrderItem("oi-1");
      expect(result).toEqual(mockAssignments);
      expect(mockTaskRepo.findByOrderItemId).toHaveBeenCalledWith("oi-1");
    });
  });

  // ============================================================
  // getMyTasks
  // ============================================================
  describe("getMyTasks", () => {
    it("should delegate to taskRepo.findMyTasks with mechanicId and query", async () => {
      const mockResult = { data: [], metadata: {} };
      mockTaskRepo.findMyTasks.mockResolvedValue(mockResult);

      const result = await service.getMyTasks("m1", { page: 2, limit: 5 });
      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMyTasks).toHaveBeenCalledWith("m1", { page: 2, limit: 5 });
    });
  });

  // ============================================================
  // getUnassignedTasks
  // ============================================================
  describe("getUnassignedTasks", () => {
    it("should delegate to taskRepo.findUnassignedServiceTasks", async () => {
      const mockResult = { data: [], metadata: {} };
      mockTaskRepo.findUnassignedServiceTasks.mockResolvedValue(mockResult);

      const result = await service.getUnassignedTasks({ search: "oli" });
      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findUnassignedServiceTasks).toHaveBeenCalledWith({ search: "oli" });
    });
  });

  // ============================================================
  // startOrder
  // ============================================================
  describe("startOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";
    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      startedAt: null,
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD" },
      cashierId: "cashier-1",
    };

    const pendingAssignments = [
      {
        id: "a1",
        startAt: null,
        orderItem: {
          id: "oi-1",
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli" },
        },
      },
      {
        id: "a2",
        startAt: null,
        orderItem: {
          id: "oi-2",
          productNameSnapshot: "Tune Up",
          product: { name: "Tune Up" },
        },
      },
    ];

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      prisma.mechanicAssignment.findMany.mockResolvedValue(pendingAssignments);
      mockTaskRepo.startTask.mockImplementation((id) =>
        Promise.resolve({
          id,
          startAt: new Date(),
          orderItem: pendingAssignments.find(a => a.id === id)?.orderItem,
        })
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should start all pending assignments, transition to IN_PROGRESS, and invalidate cache", async () => {
      const result = await service.startOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(mockTaskRepo.startTask).toHaveBeenCalledTimes(2);
      expect(mockTaskRepo.startTask).toHaveBeenCalledWith("a1");
      expect(mockTaskRepo.startTask).toHaveBeenCalledWith("a2");
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: "Pengerjaan Dimulai",
        })
      );
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when order status is not QUEUED", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: "DRAFT" });

      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when mechanic has no active assignments in this order", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 409 when all assignments are already started", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([
        { ...pendingAssignments[0], startAt: new Date() },
      ]);

      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.startOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // completeOrder
  // ============================================================
  describe("completeOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";
    const now = new Date();
    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "IN_PROGRESS",
      startedAt: new Date(now.getTime() - 3600000),
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD" },
      cashierId: "cashier-1",
    };

    const activeAssignments = [
      {
        id: "a1",
        startAt: new Date(now.getTime() - 3600000),
        endAt: null,
        orderItem: {
          id: "oi-1",
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli" },
        },
      },
    ];

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      prisma.mechanicAssignment.findMany.mockResolvedValue(activeAssignments);
      mockTaskRepo.completeTask.mockImplementation((id) =>
        Promise.resolve({
          id,
          startAt: activeAssignments[0].startAt,
          endAt: new Date(),
          orderItem: activeAssignments[0].orderItem,
        })
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should complete all pending assignments, transition to COMPLETED, and invalidate cache", async () => {
      const result = await service.completeOrder(orderId, mechanicId);

      expect(result).toHaveLength(1);
      expect(mockTaskRepo.completeTask).toHaveBeenCalledWith("a1");
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: "Pengerjaan Selesai",
          type: "SUCCESS",
        })
      );
    });

    it("should throw 404 when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when order status is not IN_PROGRESS", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: "QUEUED" });

      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when mechanic has no active assignments", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 409 when all assignments are already completed", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([
        { ...activeAssignments[0], endAt: new Date() },
      ]);

      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toThrow(ApiError);
      await expect(service.completeOrder(orderId, mechanicId))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // getAvailableMechanics
  // ============================================================
  describe("getAvailableMechanics", () => {
    it("should return mechanics with isAvailable status", async () => {
      const mockResult = {
        data: [
          { id: "m1", fullName: "Joko", activeTaskCount: 3 },
          { id: "m2", fullName: "Budi", activeTaskCount: 5 },
        ],
        metadata: { total: 2 },
      };
      mockTaskRepo.getAvailableMechanics.mockResolvedValue(mockResult);
      mockTaskRepo.getActiveTaskCount.mockImplementation((id) => {
        if (id === "m1") return Promise.resolve(3);
        if (id === "m2") return Promise.resolve(5);
        return Promise.resolve(0);
      });

      const result = await service.getAvailableMechanics({ page: 1, limit: 10 });

      expect(result.data[0].isAvailable).toBe(true);
      expect(result.data[1].isAvailable).toBe(false);
    });
  });

  // ============================================================
  // getMechanicAvailabilityStatus
  // ============================================================
  describe("getMechanicAvailabilityStatus", () => {
    it("should return availability status for a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "m1", role: "MECHANIC" });
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(4);

      const result = await service.getMechanicAvailabilityStatus("m1");

      expect(result).toEqual({
        isAvailable: true,
        activeTaskCount: 4,
        maxTasks: 5,
        remainingCapacity: 1,
      });
    });

    it("should throw 400 when user is not a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "m1", role: "CASHIER" });

      await expect(service.getMechanicAvailabilityStatus("m1"))
        .rejects.toThrow(ApiError);
      await expect(service.getMechanicAvailabilityStatus("m1"))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // hasMechanicAssigned
  // ============================================================
  describe("hasMechanicAssigned", () => {
    it("should delegate to taskRepo.hasMechanicAssigned", async () => {
      mockTaskRepo.hasMechanicAssigned.mockResolvedValue(true);

      const result = await service.hasMechanicAssigned("oi-1");
      expect(result).toBe(true);
      expect(mockTaskRepo.hasMechanicAssigned).toHaveBeenCalledWith("oi-1");
    });
  });

  // ============================================================
  // bulkAssignMechanics
  // ============================================================
  describe("bulkAssignMechanics", () => {
    const mockMechanic = { id: "m1", fullName: "Joko", role: "MECHANIC" };
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-001",
      status: "QUEUED",
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli" },
          productNameSnapshot: "Ganti Oli",
          assignments: [],
        },
      ],
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockTaskRepo.assignMechanic.mockResolvedValue({ id: "a-new" });
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should process all assignments and return success/failed", async () => {
      const mockOrder2 = { ...mockOrder, id: "o2", orderNumber: "ORD-002", status: "DRAFT" };

      mockOrderRepo.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder2);

      const assignments = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];

      const result = await service.bulkAssignMechanics(assignments);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].orderId).toBe("o2");
    });

    it("should handle empty assignments array", async () => {
      const result = await service.bulkAssignMechanics([]);
      expect(result.success).toEqual([]);
      expect(result.failed).toEqual([]);
    });
  });

  // ============================================================
  // getMyTaskHistory
  // ============================================================
  describe("getMyTaskHistory", () => {
    it("should delegate to taskRepo.findHistoryByMechanic", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.findHistoryByMechanic.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 5, startDate: "2025-01-01" };
      const result = await service.getMyTaskHistory("m1", query);

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findHistoryByMechanic).toHaveBeenCalledWith("m1", query);
    });
  });
});