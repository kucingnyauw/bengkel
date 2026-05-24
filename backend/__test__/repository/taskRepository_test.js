import TaskService from "#service/taskService.js";

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
  })),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk TaskService
 * @describe TaskService
 */
describe("TaskService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService();

    const { SettingRepository } = require("#repository/settingRepository.js");
    SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ value: "5" });

    const { NotificationRepository } = require("#repository/notificationRepository.js");
    NotificationRepository.mock.instances[0].create.mockResolvedValue({});
  });

  /**
   * @describe assignMechanicToOrder
   */
  describe("assignMechanicToOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";
    const mockOrder = {
      id: orderId, orderNumber: "ORD-001", status: "QUEUED", cashierId: "cashier-1",
      customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        { id: "oi-1", product: { type: "SERVICE", name: "Ganti Oli" }, productNameSnapshot: "Ganti Oli", assignments: [] },
        { id: "oi-2", product: { type: "SERVICE", name: "Tune Up" }, productNameSnapshot: "Tune Up", assignments: [] },
      ],
    };

    beforeEach(() => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");
      const { OrderRepository } = require("#repository/orderRepository.js");

      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: mechanicId, fullName: "Joko", role: "MECHANIC" });
      TaskRepository.mock.instances[0].getActiveTaskCount.mockResolvedValue(2);
      OrderRepository.mock.instances[0].findById.mockResolvedValue(mockOrder);
      TaskRepository.mock.instances[0].assignMechanic.mockImplementation((itemId) =>
        Promise.resolve({ id: `a-${itemId}`, orderItemId: itemId, mechanicId })
      );
    });

    /**
     * @test Menugaskan mekanik ke semua item service
     */
    it("should assign mechanic to all unassigned service items", async () => {
      const result = await service.assignMechanicToOrder(orderId, mechanicId);
      expect(result).toHaveLength(2);
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    /**
     * @test Melempar 400 ketika user bukan mekanik
     */
    it("should throw 400 when user is not a mechanic", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: mechanicId, role: "CASHIER" });

      await expect(service.assignMechanicToOrder(orderId, mechanicId)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 400 ketika kapasitas penuh
     */
    it("should throw 400 when max capacity reached", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].getActiveTaskCount.mockResolvedValue(5);

      await expect(service.assignMechanicToOrder(orderId, mechanicId)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.assignMechanicToOrder(orderId, mechanicId)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 400 ketika status bukan QUEUED
     */
    it("should throw 400 when order status is not QUEUED", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({ ...mockOrder, status: "DRAFT" });

      await expect(service.assignMechanicToOrder(orderId, mechanicId)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe unassignMechanicFromOrder
   */
  describe("unassignMechanicFromOrder", () => {
    const baseOrder = {
      id: "order-1", orderNumber: "ORD-001", status: "QUEUED", cashierId: "cashier-1",
      customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        { id: "oi-1", product: { type: "SERVICE" }, assignments: [{ id: "a1", mechanicId: "m1", mechanic: { fullName: "Joko" } }] },
      ],
    };

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");

      OrderRepository.mock.instances[0].findById.mockResolvedValue(baseOrder);
      TaskRepository.mock.instances[0].unassignMechanic.mockResolvedValue();
    });

    /**
     * @test Melepas mekanik dari item service
     */
    it("should unassign all mechanics", async () => {
      await service.unassignMechanicFromOrder("order-1", "cashier-1");

      const { TaskRepository } = require("#repository/taskRepository.js");
      expect(TaskRepository.mock.instances[0].unassignMechanic).toHaveBeenCalledTimes(1);
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.unassignMechanicFromOrder("order-1", "cashier-1")).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 400 untuk status COMPLETED/CLOSED/CANCELLED
     */
    it.each(["COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw 400 when status is %s",
      async (status) => {
        const { OrderRepository } = require("#repository/orderRepository.js");
        OrderRepository.mock.instances[0].findById.mockResolvedValue({ ...baseOrder, status });

        await expect(service.unassignMechanicFromOrder("order-1", "cashier-1")).rejects.toMatchObject({ statusCode: 400 });
      }
    );
  });

  /**
   * @describe getTaskById
   */
  describe("getTaskById", () => {
    /**
     * @test Mengembalikan task dengan signed URL
     */
    it("should return task with signed URL", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findById.mockResolvedValue({
        id: "a1",
        orderItem: { product: { id: "p1", name: "Ganti Oli", image: { path: "img/oli.jpg" } } },
      });

      const result = await service.getTaskById("a1");
      expect(result.orderItem.product.image.url).toBe("https://signed-url.com/image.jpg");
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getTaskById("a99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe startOrder
   */
  describe("startOrder", () => {
    const mechanicId = "mech-1";
    const pendingAssignments = [
      { id: "a1", startAt: null, orderItem: { id: "oi-1", productNameSnapshot: "Ganti Oli", product: { name: "Ganti Oli" } } },
      { id: "a2", startAt: null, orderItem: { id: "oi-2", productNameSnapshot: "Tune Up", product: { name: "Tune Up" } } },
    ];

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { UserRepository } = require("#repository/userRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");
      const { default: prisma } = require("#app/database.js");

      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "order-1", orderNumber: "ORD-001", status: "QUEUED",
        customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        cashierId: "cashier-1",
      });
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: mechanicId, fullName: "Joko" });
      prisma.mechanicAssignment.findMany.mockResolvedValue(pendingAssignments);
      TaskRepository.mock.instances[0].startTask.mockImplementation((id) =>
        Promise.resolve({ id, startAt: new Date(), orderItem: pendingAssignments.find(a => a.id === id)?.orderItem })
      );
    });

    /**
     * @test Memulai semua assignment
     */
    it("should start all pending assignments", async () => {
      const result = await service.startOrder("order-1", mechanicId);
      expect(result).toHaveLength(2);
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.startOrder("order-1", mechanicId)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 400 ketika status bukan QUEUED
     */
    it("should throw 400 when status not QUEUED", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "order-1", orderNumber: "ORD-001", status: "DRAFT",
        customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD" }, cashierId: "cashier-1",
      });

      await expect(service.startOrder("order-1", mechanicId)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe completeOrder
   */
  describe("completeOrder", () => {
    const mechanicId = "mech-1";
    const now = new Date();
    const activeAssignments = [
      { id: "a1", startAt: new Date(now.getTime() - 3600000), endAt: null, orderItem: { id: "oi-1", productNameSnapshot: "Ganti Oli", product: { name: "Ganti Oli" } } },
    ];

    beforeEach(() => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      const { UserRepository } = require("#repository/userRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");
      const { default: prisma } = require("#app/database.js");

      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "order-1", orderNumber: "ORD-001", status: "IN_PROGRESS",
        startedAt: new Date(now.getTime() - 3600000),
        customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        cashierId: "cashier-1",
      });
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: mechanicId, fullName: "Joko" });
      prisma.mechanicAssignment.findMany.mockResolvedValue(activeAssignments);
      TaskRepository.mock.instances[0].completeTask.mockImplementation((id) =>
        Promise.resolve({ id, startAt: activeAssignments[0].startAt, endAt: new Date(), orderItem: activeAssignments[0].orderItem })
      );
    });

    /**
     * @test Menyelesaikan semua assignment
     */
    it("should complete all pending assignments", async () => {
      const result = await service.completeOrder("order-1", mechanicId);
      expect(result).toHaveLength(1);
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    /**
     * @test Melempar 404 ketika pesanan tidak ditemukan
     */
    it("should throw 404 when order not found", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.completeOrder("order-1", mechanicId)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 400 ketika status bukan IN_PROGRESS
     */
    it("should throw 400 when status not IN_PROGRESS", async () => {
      const { OrderRepository } = require("#repository/orderRepository.js");
      OrderRepository.mock.instances[0].findById.mockResolvedValue({
        id: "order-1", orderNumber: "ORD-001", status: "QUEUED",
        customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD" }, cashierId: "cashier-1",
      });

      await expect(service.completeOrder("order-1", mechanicId)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe getAvailableMechanics
   */
  describe("getAvailableMechanics", () => {
    /**
     * @test Mengembalikan mekanik dengan status ketersediaan
     */
    it("should return mechanics with availability", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].getAvailableMechanics.mockResolvedValue({
        data: [{ id: "m1", fullName: "Joko" }, { id: "m2", fullName: "Budi" }],
        metadata: { total: 2 },
      });
      TaskRepository.mock.instances[0].getActiveTaskCount
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);

      const result = await service.getAvailableMechanics({});
      expect(result.data[0].isAvailable).toBe(true);
      expect(result.data[1].isAvailable).toBe(false);
    });
  });

  /**
   * @describe getMechanicAvailabilityStatus
   */
  describe("getMechanicAvailabilityStatus", () => {
    /**
     * @test Mengembalikan status ketersediaan
     */
    it("should return availability status", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");

      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: "m1", role: "MECHANIC" });
      TaskRepository.mock.instances[0].getActiveTaskCount.mockResolvedValue(4);

      const result = await service.getMechanicAvailabilityStatus("m1");
      expect(result.isAvailable).toBe(true);
      expect(result.remainingCapacity).toBe(1);
    });

    /**
     * @test Melempar 400 ketika bukan mekanik
     */
    it("should throw 400 when not a mechanic", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: "m1", role: "CASHIER" });

      await expect(service.getMechanicAvailabilityStatus("m1")).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  /**
   * @describe hasMechanicAssigned
   */
  describe("hasMechanicAssigned", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].hasMechanicAssigned.mockResolvedValue(true);

      const result = await service.hasMechanicAssigned("oi-1");
      expect(result).toBe(true);
    });
  });

  /**
   * @describe bulkAssignMechanics
   */
  describe("bulkAssignMechanics", () => {
    /**
     * @test Memproses bulk assign
     */
    it("should process bulk assignments", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { TaskRepository } = require("#repository/taskRepository.js");
      const { OrderRepository } = require("#repository/orderRepository.js");

      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: "m1", fullName: "Joko", role: "MECHANIC" });
      TaskRepository.mock.instances[0].getActiveTaskCount.mockResolvedValue(2);
      TaskRepository.mock.instances[0].assignMechanic.mockResolvedValue({ id: "a-new" });

      OrderRepository.mock.instances[0].findById
        .mockResolvedValueOnce({
          id: "o1", orderNumber: "ORD-001", status: "QUEUED", cashierId: "c1",
          customer: { name: "Budi" }, vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          items: [{ id: "oi-1", product: { type: "SERVICE" }, productNameSnapshot: "Ganti Oli", assignments: [] }],
        })
        .mockResolvedValueOnce({
          id: "o2", orderNumber: "ORD-002", status: "DRAFT", cashierId: "c1",
          customer: { name: "Ani" }, vehicle: null,
          items: [],
        });

      const result = await service.bulkAssignMechanics([
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ]);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  /**
   * @describe getTasks
   */
  describe("getTasks", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findMany.mockResolvedValue({ data: [], metadata: { total: 0 } });

      const result = await service.getTasks({});
      expect(result.data).toEqual([]);
    });
  });

  /**
   * @describe getMyTasks
   */
  describe("getMyTasks", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findMyTasks.mockResolvedValue({ data: [], metadata: {} });

      await service.getMyTasks("m1", {});
      expect(TaskRepository.mock.instances[0].findMyTasks).toHaveBeenCalledWith("m1", {});
    });
  });

  /**
   * @describe getUnassignedTasks
   */
  describe("getUnassignedTasks", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findUnassignedServiceTasks.mockResolvedValue({ data: [], metadata: {} });

      await service.getUnassignedTasks({});
      expect(TaskRepository.mock.instances[0].findUnassignedServiceTasks).toHaveBeenCalledWith({});
    });
  });

  /**
   * @describe getMyTaskHistory
   */
  describe("getMyTaskHistory", () => {
    /**
     * @test Mendelegasikan ke repository
     */
    it("should delegate to repository", async () => {
      const { TaskRepository } = require("#repository/taskRepository.js");
      TaskRepository.mock.instances[0].findHistoryByMechanic.mockResolvedValue({ data: [], metadata: { total: 0 } });

      await service.getMyTaskHistory("m1", {});
      expect(TaskRepository.mock.instances[0].findHistoryByMechanic).toHaveBeenCalledWith("m1", {});
    });
  });
});