import prisma from "#app/database.js";
import OrderHistoryRepository from "#repository/orderHistoryRepository.js";

jest.mock("#app/database.js", () => ({
  order: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
}));

/**
 * Unit test untuk OrderHistoryRepository
 * @describe OrderHistoryRepository
 */
describe("OrderHistoryRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new OrderHistoryRepository();
  });

  /**
   * @describe findByOrderNumber
   */
  describe("findByOrderNumber", () => {
    /**
     * @test Mengembalikan pesanan lengkap dengan riwayat ketika ditemukan
     */
    it("should return full order with history when found by order number", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        diagnosedAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        cashier: { id: "user-1", fullName: "Kasir 1" },
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
        items: [],
        histories: [],
      };

      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderNumber("ORD-20250601-0001");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-20250601-0001", deletedAt: null },
        select: expect.objectContaining({
          id: true,
          orderNumber: true,
          status: true,
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
     * @test Mengembalikan null ketika nomor pesanan tidak ditemukan
     */
    it("should return null when order number not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-99999999-XXXX");

      expect(result).toBeNull();
    });

    /**
     * @test Tidak mengembalikan pesanan yang sudah di-soft delete
     */
    it("should not return soft-deleted orders", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-DELETED");

      expect(result).toBeNull();
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-DELETED", deletedAt: null },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findByOrderId
   */
  describe("findByOrderId", () => {
    /**
     * @test Mengembalikan pesanan lengkap dengan riwayat ketika ditemukan
     */
    it("should return full order with history when found by ID", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        createdAt: new Date(),
        updatedAt: new Date(),
        cashier: { id: "user-1", fullName: "Kasir 1" },
        customer: null,
        vehicle: null,
        payment: null,
        items: [],
        histories: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderId("order-1");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1", deletedAt: null },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika ID pesanan tidak ditemukan
     */
    it("should return null when order ID not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findByOrderId("order-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe createHistory
   */
  describe("createHistory", () => {
    /**
     * @test Membuat record riwayat status baru dengan semua field
     */
    it("should create a new status history record with all fields", async () => {
      const input = {
        orderId: "order-1",
        status: "IN_PROGRESS",
        changedById: "user-1",
        note: "Mekanik mulai pengerjaan",
      };

      const expected = {
        id: "hist-1",
        status: "IN_PROGRESS",
        note: "Mekanik mulai pengerjaan",
        createdAt: new Date(),
        changedBy: { id: "user-1", fullName: "Mekanik 1" },
      };

      prisma.orderStatusHistory.create.mockResolvedValue(expected);

      const result = await repo.createHistory(input);

      expect(result).toEqual(expected);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-1",
          status: "IN_PROGRESS",
          changedById: "user-1",
          note: "Mekanik mulai pengerjaan",
        },
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
          changedBy: {
            select: { id: true, fullName: true },
          },
        },
      });
    });

    /**
     * @test Membuat record riwayat tanpa catatan
     */
    it("should create a history record with null note", async () => {
      const input = {
        orderId: "order-1",
        status: "QUEUED",
        changedById: "user-1",
      };

      const expected = {
        id: "hist-2",
        status: "QUEUED",
        note: null,
        createdAt: new Date(),
        changedBy: { id: "user-1", fullName: "Kasir 1" },
      };

      prisma.orderStatusHistory.create.mockResolvedValue(expected);

      const result = await repo.createHistory(input);

      expect(result.note).toBeNull();
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          note: null,
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe getHistoryByOrderId
   */
  describe("getHistoryByOrderId", () => {
    /**
     * @test Mengembalikan daftar riwayat status untuk pesanan
     */
    it("should return status history list for an order", async () => {
      const mockHistories = [
        {
          id: "hist-1",
          status: "DRAFT",
          note: "Pesanan dibuat",
          createdAt: new Date("2025-06-01T08:00:00"),
          changedBy: { id: "user-1", fullName: "Kasir 1" },
        },
        {
          id: "hist-2",
          status: "QUEUED",
          note: "Pembayaran berhasil",
          createdAt: new Date("2025-06-01T08:05:00"),
          changedBy: { id: "user-1", fullName: "Kasir 1" },
        },
        {
          id: "hist-3",
          status: "IN_PROGRESS",
          note: "Mekanik mulai pengerjaan",
          createdAt: new Date("2025-06-01T08:15:00"),
          changedBy: { id: "user-2", fullName: "Mekanik 1" },
        },
      ];

      prisma.orderStatusHistory.findMany.mockResolvedValue(mockHistories);

      const result = await repo.getHistoryByOrderId("order-1");

      expect(result).toEqual(mockHistories);
      expect(result).toHaveLength(3);
      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
        select: expect.any(Object),
        orderBy: { createdAt: "asc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika pesanan tidak memiliki riwayat
     */
    it("should return empty array when order has no history", async () => {
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      const result = await repo.getHistoryByOrderId("order-99");

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan riwayat dengan paginasi default
     */
    it("should return histories with default pagination", async () => {
      const mockData = [
        {
          id: "hist-1",
          status: "COMPLETED",
          note: "Pesanan selesai",
          createdAt: new Date(),
          changedBy: { id: "user-1", fullName: "Kasir 1" },
          order: { id: "order-1", orderNumber: "ORD-001", status: "COMPLETED", total: 111000, createdAt: new Date() },
        },
      ];

      prisma.orderStatusHistory.count.mockResolvedValue(1);
      prisma.orderStatusHistory.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(result.metadata.page).toBe(1);
      expect(result.metadata.limit).toBe(10);
      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.objectContaining({
          order: expect.any(Object),
        }),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan riwayat dengan filter orderId
     */
    it("should return histories filtered by orderId", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(5);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      await repo.findMany({ orderId: "order-1" });

      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: "order-1" },
        })
      );
    });

    /**
     * @test Mengembalikan riwayat dengan filter status
     */
    it("should return histories filtered by status", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(10);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "COMPLETED" });

      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "COMPLETED" },
        })
      );
    });

    /**
     * @test Mengembalikan riwayat dengan filter changedById
     */
    it("should return histories filtered by changedById", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(8);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      await repo.findMany({ changedById: "user-1" });

      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { changedById: "user-1" },
        })
      );
    });

    /**
     * @test Mengembalikan riwayat dengan filter rentang tanggal
     */
    it("should return histories filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.orderStatusHistory.count.mockResolvedValue(20);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada riwayat
     */
    it("should return empty array when no histories", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(0);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe getStatusTransitionStats
   */
  describe("getStatusTransitionStats", () => {
    /**
     * @test Mengembalikan statistik perubahan status
     */
    it("should return status transition statistics", async () => {
      const mockStats = [
        { status: "DRAFT", _count: { status: 1 }, _min: { createdAt: new Date("2025-06-01T08:00:00") }, _max: { createdAt: new Date("2025-06-01T08:00:00") } },
        { status: "QUEUED", _count: { status: 1 }, _min: { createdAt: new Date("2025-06-01T08:05:00") }, _max: { createdAt: new Date("2025-06-01T08:05:00") } },
        { status: "IN_PROGRESS", _count: { status: 1 }, _min: { createdAt: new Date("2025-06-01T08:15:00") }, _max: { createdAt: new Date("2025-06-01T08:15:00") } },
      ];

      prisma.orderStatusHistory.groupBy.mockResolvedValue(mockStats);
      prisma.orderStatusHistory.count.mockResolvedValue(3);

      const result = await repo.getStatusTransitionStats("order-1");

      expect(result.totalChanges).toBe(3);
      expect(result.statusBreakdown).toHaveLength(3);
      expect(result.statusBreakdown[0]).toEqual({
        status: "DRAFT",
        count: 1,
        firstOccurrence: mockStats[0]._min.createdAt,
        lastOccurrence: mockStats[0]._max.createdAt,
      });
      expect(prisma.orderStatusHistory.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        where: { orderId: "order-1" },
        _count: { status: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      });
    });

    /**
     * @test Mengembalikan statistik kosong untuk pesanan tanpa riwayat
     */
    it("should return empty stats for order with no history", async () => {
      prisma.orderStatusHistory.groupBy.mockResolvedValue([]);
      prisma.orderStatusHistory.count.mockResolvedValue(0);

      const result = await repo.getStatusTransitionStats("order-99");

      expect(result.totalChanges).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
    });
  });

  /**
   * @describe getStatusDurations
   */
  describe("getStatusDurations", () => {
    /**
     * @test Mengembalikan durasi setiap status menggunakan raw query
     */
    it("should return status durations using raw query", async () => {
      const mockDurations = [
        { status: "DRAFT", startTime: new Date("2025-06-01T08:00:00"), endTime: new Date("2025-06-01T08:05:00"), durationSeconds: 300 },
        { status: "QUEUED", startTime: new Date("2025-06-01T08:05:00"), endTime: new Date("2025-06-01T08:15:00"), durationSeconds: 600 },
        { status: "IN_PROGRESS", startTime: new Date("2025-06-01T08:15:00"), endTime: new Date("2025-06-01T09:00:00"), durationSeconds: 2700 },
      ];

      prisma.$queryRawUnsafe.mockResolvedValue(mockDurations);

      const result = await repo.getStatusDurations("order-1");

      expect(result).toEqual(mockDurations);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WITH status_timeline AS"),
        "order-1"
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada riwayat
     */
    it("should return empty array when no history", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getStatusDurations("order-99");

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe getOrderTimeline
   */
  describe("getOrderTimeline", () => {
    /**
     * @test Mengembalikan ringkasan timeline pesanan lengkap
     */
    it("should return complete order timeline summary", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        total: 111000,
        diagnosedAt: new Date("2025-06-01T08:05:00"),
        startedAt: new Date("2025-06-01T08:15:00"),
        completedAt: new Date("2025-06-01T09:00:00"),
        closedAt: null,
        createdAt: new Date("2025-06-01T08:00:00"),
        customer: { name: "Budi" },
        vehicle: { plateNumber: "B 1234 CD" },
      };

      const mockHistories = [
        { id: "hist-1", status: "DRAFT", note: "Dibuat", createdAt: new Date(), changedBy: { id: "u1", fullName: "Kasir" } },
        { id: "hist-2", status: "QUEUED", note: "Dibayar", createdAt: new Date(), changedBy: { id: "u1", fullName: "Kasir" } },
      ];

      const mockDurations = [
        { status: "DRAFT", startTime: new Date(), endTime: new Date(), durationSeconds: 300 },
        { status: "QUEUED", startTime: new Date(), endTime: new Date(), durationSeconds: 600 },
      ];

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.orderStatusHistory.findMany.mockResolvedValue(mockHistories);
      prisma.$queryRawUnsafe.mockResolvedValue(mockDurations);

      const result = await repo.getOrderTimeline("order-1");

      expect(result.order).toEqual(mockOrder);
      expect(result.histories).toEqual(mockHistories);
      expect(result.durations).toEqual(mockDurations);
      expect(result.totalDurationSeconds).toBe(900);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1", deletedAt: null },
        select: expect.objectContaining({
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          customer: expect.any(Object),
          vehicle: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika pesanan tidak ditemukan
     */
    it("should return null when order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getOrderTimeline("order-99");

      expect(result).toBeNull();
      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalled();
      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    /**
     * @test Menghitung total durasi dengan benar ketika tidak ada durasi
     */
    it("should calculate zero total duration when no durations", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "DRAFT",
        total: 50000,
        createdAt: new Date(),
        customer: null,
        vehicle: null,
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getOrderTimeline("order-1");

      expect(result.totalDurationSeconds).toBe(0);
    });
  });
});