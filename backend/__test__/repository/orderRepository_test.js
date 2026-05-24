import prisma from "#app/database.js";
import OrderRepository from "#repository/orderRepository.js";

jest.mock("#app/database.js", () => ({
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}));

/**
 * Unit test untuk OrderRepository
 * @describe OrderRepository
 */
describe("OrderRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new OrderRepository();
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan pesanan lengkap dengan full select ketika ditemukan
     */
    it("should return full order with histories when found", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
        cashierId: "cashier-1",
        shiftId: "shift-1",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        startedAt: new Date(),
        completedAt: new Date(),
        closedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
        items: [
          {
            id: "oi-1",
            quantity: 2,
            unitPrice: 50000,
            subtotal: 100000,
            productNameSnapshot: "Oli",
            product: { id: "p1", name: "Oli", type: "SPAREPART", image: { path: "img/oli.jpg" } },
            assignments: [
              { id: "a1", mechanicId: "mech-1", startAt: new Date(), endAt: new Date(), mechanic: { id: "mech-1", fullName: "Joko" } },
            ],
          },
        ],
        histories: [
          { id: "h1", status: "DRAFT", createdAt: new Date(), note: "Dibuat", changedBy: { id: "c1", fullName: "Kasir" } },
          { id: "h2", status: "COMPLETED", createdAt: new Date(), note: "Selesai", changedBy: { id: "c1", fullName: "Kasir" } },
        ],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await repo.findById("order-1");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1", deletedAt: null },
        select: expect.objectContaining({
          id: true,
          orderNumber: true,
          cashier: expect.any(Object),
          customer: expect.any(Object),
          vehicle: expect.any(Object),
          payment: expect.any(Object),
          items: expect.any(Object),
          histories: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika pesanan tidak ditemukan
     */
    it("should return null when order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findById("order-99");

      expect(result).toBeNull();
    });

    /**
     * @test Tidak mengembalikan pesanan yang sudah di-soft delete
     */
    it("should not return soft-deleted orders", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findById("order-deleted");

      expect(result).toBeNull();
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-deleted", deletedAt: null },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findByOrderNumber
   */
  describe("findByOrderNumber", () => {
    /**
     * @test Mengembalikan pesanan detail ketika ditemukan
     */
    it("should return detail order when found by order number", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "QUEUED",
        subtotal: 200000,
        tax: 22000,
        total: 222000,
        items: [],
      };

      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderNumber("ORD-20250601-0001");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-20250601-0001", deletedAt: null },
        select: expect.objectContaining({
          items: expect.objectContaining({
            select: expect.objectContaining({
              assignments: expect.any(Object),
            }),
          }),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika nomor pesanan tidak ditemukan
     */
    it("should return null when order number not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-999");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe isOrderNumberExists
   */
  describe("isOrderNumberExists", () => {
    /**
     * @test Mengembalikan true ketika nomor pesanan sudah ada
     */
    it("should return true when order number exists", async () => {
      prisma.order.findFirst.mockResolvedValue({ id: "order-1" });

      const result = await repo.isOrderNumberExists("ORD-001");

      expect(result).toBe(true);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-001" },
        select: { id: true },
      });
    });

    /**
     * @test Mengembalikan false ketika nomor pesanan belum ada
     */
    it("should return false when order number does not exist", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.isOrderNumberExists("ORD-NEW");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan pesanan dengan paginasi default
     */
    it("should return orders with default pagination", async () => {
      const mockData = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          status: "COMPLETED",
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "c1", fullName: "Kasir" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
          items: [],
          _count: { items: 2 },
        },
      ];

      prisma.order.count.mockResolvedValue(1);
      prisma.order.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan pesanan dengan filter status
     */
    it("should return orders filtered by status", async () => {
      prisma.order.count.mockResolvedValue(5);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "QUEUED" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: "QUEUED" },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan filter cashierId
     */
    it("should return orders filtered by cashierId", async () => {
      prisma.order.count.mockResolvedValue(8);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ cashierId: "cashier-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, cashierId: "cashier-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan filter shiftId
     */
    it("should return orders filtered by shiftId", async () => {
      prisma.order.count.mockResolvedValue(15);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ shiftId: "shift-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, shiftId: "shift-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan filter customerId
     */
    it("should return orders filtered by customerId", async () => {
      prisma.order.count.mockResolvedValue(3);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ customerId: "cust-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, customerId: "cust-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan filter vehicleId
     */
    it("should return orders filtered by vehicleId", async () => {
      prisma.order.count.mockResolvedValue(2);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ vehicleId: "veh-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, vehicleId: "veh-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan pencarian order number
     */
    it("should return orders filtered by search", async () => {
      prisma.order.count.mockResolvedValue(4);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "ORD-2025" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            orderNumber: { contains: "ORD-2025", mode: "insensitive" },
          },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan dengan filter rentang tanggal
     */
    it("should return orders filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.order.count.mockResolvedValue(20);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pesanan
     */
    it("should return empty array when no orders", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe findActiveByCashier
   */
  describe("findActiveByCashier", () => {
    /**
     * @test Mengembalikan pesanan aktif untuk kasir dengan default filter
     */
    it("should return active orders for cashier with default active status filter", async () => {
      const mockData = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          status: "QUEUED",
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "cashier-1", fullName: "Kasir" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          vehicle: null,
          payment: null,
          items: [],
          _count: { items: 1 },
        },
      ];

      prisma.order.count.mockResolvedValue(1);
      prisma.order.findMany.mockResolvedValue(mockData);

      const result = await repo.findActiveByCashier("cashier-1", {});

      expect(result.data).toEqual(mockData);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cashierId: "cashier-1",
            deletedAt: null,
            status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
          },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan aktif dengan filter status spesifik
     */
    it("should return active orders with specific status filter", async () => {
      prisma.order.count.mockResolvedValue(3);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findActiveByCashier("cashier-1", { status: "IN_PROGRESS" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cashierId: "cashier-1",
            deletedAt: null,
            status: "IN_PROGRESS",
          },
        })
      );
    });

    /**
     * @test Mengembalikan pesanan aktif dengan filter pencarian
     */
    it("should return active orders with search filter", async () => {
      prisma.order.count.mockResolvedValue(2);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findActiveByCashier("cashier-1", { search: "ORD-001" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cashierId: "cashier-1",
            deletedAt: null,
            status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
            orderNumber: { contains: "ORD-001", mode: "insensitive" },
          },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pesanan aktif
     */
    it("should return empty array when no active orders", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await repo.findActiveByCashier("cashier-1", {});

      expect(result.data).toEqual([]);
    });
  });

  /**
   * @describe update
   */
  describe("update", () => {
    /**
     * @test Mengupdate data pesanan
     */
    it("should update an order with given data", async () => {
      const updateData = { status: "COMPLETED", completedAt: new Date() };
      const expected = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        items: [],
      };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.update("order-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: updateData,
        select: expect.objectContaining({
          id: true,
          items: expect.any(Object),
        }),
      });
    });
  });

  /**
   * @describe updateStatus
   */
  describe("updateStatus", () => {
    /**
     * @test Mengupdate status ke IN_PROGRESS dengan timestamp startedAt
     */
    it("should update status to IN_PROGRESS with startedAt timestamp", async () => {
      const expected = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "IN_PROGRESS",
        startedAt: expect.any(Date),
        completedAt: null,
        closedAt: null,
        updatedAt: expect.any(Date),
      };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("order-1", "IN_PROGRESS");

      expect(result.status).toBe("IN_PROGRESS");
      expect(result.startedAt).toBeDefined();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: "IN_PROGRESS",
          updatedAt: expect.any(Date),
          startedAt: expect.any(Date),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          startedAt: true,
          completedAt: true,
          closedAt: true,
          updatedAt: true,
        },
      });
    });

    /**
     * @test Mengupdate status ke COMPLETED dengan timestamp completedAt
     */
    it("should update status to COMPLETED with completedAt timestamp", async () => {
      const expected = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: expect.any(Date),
        closedAt: null,
        updatedAt: expect.any(Date),
      };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("order-1", "COMPLETED");

      expect(result.status).toBe("COMPLETED");
      expect(result.completedAt).toBeDefined();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({
          status: "COMPLETED",
          completedAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengupdate status ke CLOSED dengan timestamp closedAt
     */
    it("should update status to CLOSED with closedAt timestamp", async () => {
      const expected = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "CLOSED",
        startedAt: new Date(),
        completedAt: new Date(),
        closedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("order-1", "CLOSED");

      expect(result.status).toBe("CLOSED");
      expect(result.closedAt).toBeDefined();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({
          status: "CLOSED",
          closedAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengupdate status ke DRAFT tanpa timestamp tambahan
     */
    it("should update status to DRAFT without extra timestamps", async () => {
      const expected = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "DRAFT",
        startedAt: null,
        completedAt: null,
        closedAt: null,
        updatedAt: expect.any(Date),
      };

      prisma.order.update.mockResolvedValue(expected);

      await repo.updateStatus("order-1", "DRAFT");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: "DRAFT",
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe softDelete
   */
  describe("softDelete", () => {
    /**
     * @test Soft delete pesanan dengan mengisi deletedAt
     */
    it("should soft delete an order by setting deletedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.softDelete("order-1");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  /**
   * @describe restore
   */
  describe("restore", () => {
    /**
     * @test Restore pesanan dengan mengosongkan deletedAt
     */
    it("should restore a soft-deleted order by clearing deletedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.restore("order-1");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { deletedAt: null },
      });
    });
  });
});