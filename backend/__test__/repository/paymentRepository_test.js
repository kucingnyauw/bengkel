import prisma from "#app/database.js";
import PaymentRepository from "#repository/paymentRepository.js";

jest.mock("#app/database.js", () => ({
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
}));

/**
 * Unit test untuk PaymentRepository
 * @describe PaymentRepository
 */
describe("PaymentRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PaymentRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat pembayaran CASH dengan status PAID
     */
    it("should create a CASH payment with PAID status", async () => {
      const input = {
        orderId: "order-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
      };

      const expected = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
        paidAt: expect.any(Date),
        createdAt: new Date(),
        order: {
          id: "order-1",
          orderNumber: "ORD-001",
          subtotal: 100000,
          tax: 11000,
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "cashier-1", fullName: "Kasir 1" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          items: [],
        },
      };

      prisma.payment.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: expect.any(Date),
        },
        select: expect.objectContaining({
          id: true,
          method: true,
          order: expect.any(Object),
        }),
      });
    });

    /**
     * @test Membuat pembayaran QRIS dengan status PENDING
     */
    it("should create a QRIS payment with PENDING status", async () => {
      const input = {
        orderId: "order-2",
        method: "QRIS",
        amountPaid: 0,
        status: "PENDING",
      };

      const expected = {
        id: "pay-2",
        method: "QRIS",
        amountPaid: 0,
        change: 0,
        status: "PENDING",
        paidAt: null,
        createdAt: new Date(),
        order: null,
      };

      prisma.payment.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result.status).toBe("PENDING");
      expect(result.paidAt).toBeNull();
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          change: 0,
          status: "PENDING",
          paidAt: null,
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Membuat pembayaran dengan nilai default change dan status
     */
    it("should create a payment with default change and status", async () => {
      const input = {
        orderId: "order-3",
        method: "CASH",
        amountPaid: 100000,
      };

      prisma.payment.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          change: 0,
          status: "PAID",
          paidAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan pembayaran dengan invoice lengkap
     */
    it("should return payment with full invoice when found", async () => {
      const mockPayment = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
        paidAt: new Date(),
        createdAt: new Date(),
        order: {
          id: "order-1",
          orderNumber: "ORD-001",
          subtotal: 100000,
          tax: 11000,
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "cashier-1", fullName: "Kasir 1" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          items: [],
        },
      };

      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await repo.findById("pay-1");

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        select: expect.objectContaining({
          order: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika tidak ditemukan
     */
    it("should return null when not found", async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await repo.findById("pay-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByOrderId
   */
  describe("findByOrderId", () => {
    /**
     * @test Mengembalikan pembayaran berdasarkan order ID
     */
    it("should return payment by order ID", async () => {
      const mockPayment = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
        paidAt: new Date(),
        createdAt: new Date(),
        order: { id: "order-1", orderNumber: "ORD-001" },
      };

      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await repo.findByOrderId("order-1");

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika order tidak memiliki pembayaran
     */
    it("should return null when order has no payment", async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await repo.findByOrderId("order-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan pembayaran dengan paginasi default
     */
    it("should return payments with default pagination", async () => {
      const mockData = [
        {
          id: "pay-1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: new Date(),
          createdAt: new Date(),
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            subtotal: 100000,
            tax: 11000,
            total: 111000,
            status: "COMPLETED",
            createdAt: new Date(),
            cashier: { id: "c1", fullName: "Kasir" },
            customer: { id: "cust-1", name: "Budi", phone: "0812" },
            vehicle: null,
            items: [],
          },
        },
      ];

      prisma.payment.count.mockResolvedValue(1);
      prisma.payment.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan pembayaran dengan filter orderId
     */
    it("should return payments filtered by orderId", async () => {
      prisma.payment.count.mockResolvedValue(1);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany({ orderId: "order-1" });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: "order-1" },
        })
      );
    });

    /**
     * @test Mengembalikan pembayaran dengan filter status
     */
    it("should return payments filtered by status", async () => {
      prisma.payment.count.mockResolvedValue(10);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "PAID" });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "PAID" },
        })
      );
    });

    /**
     * @test Mengembalikan pembayaran dengan filter method
     */
    it("should return payments filtered by method", async () => {
      prisma.payment.count.mockResolvedValue(8);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany({ method: "QRIS" });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { method: "QRIS" },
        })
      );
    });

    /**
     * @test Mengembalikan pembayaran dengan filter rentang tanggal
     */
    it("should return payments filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.payment.count.mockResolvedValue(20);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
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
     * @test Mengembalikan array kosong ketika tidak ada pembayaran
     */
    it("should return empty array when no payments", async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe updateStatus
   */
  describe("updateStatus", () => {
    /**
     * @test Mengupdate status ke PAID dengan paidAt terisi
     */
    it("should update status to PAID with paidAt timestamp", async () => {
      const expected = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
        paidAt: expect.any(Date),
        createdAt: new Date(),
      };

      prisma.payment.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("pay-1", "PAID");

      expect(result.status).toBe("PAID");
      expect(result.paidAt).toBeDefined();
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: {
          status: "PAID",
          paidAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengupdate status ke REFUNDED tanpa paidAt
     */
    it("should update status to REFUNDED without paidAt", async () => {
      const expected = {
        id: "pay-1",
        method: "QRIS",
        amountPaid: 0,
        change: 0,
        status: "REFUNDED",
        paidAt: null,
        createdAt: new Date(),
      };

      prisma.payment.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("pay-1", "REFUNDED");

      expect(result.status).toBe("REFUNDED");
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: {
          status: "REFUNDED",
        },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengupdate status ke PENDING tanpa paidAt
     */
    it("should update status to PENDING without paidAt", async () => {
      prisma.payment.update.mockResolvedValue({});

      await repo.updateStatus("pay-1", "PENDING");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: "PENDING" },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe getPaymentSummary
   */
  describe("getPaymentSummary", () => {
    /**
     * @test Mengembalikan ringkasan pembayaran lengkap
     */
    it("should return complete payment summary", async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: 50000000 } });
      prisma.payment.count.mockResolvedValue(100);
      prisma.payment.groupBy
        .mockResolvedValueOnce([
          { method: "CASH", _sum: { amountPaid: 30000000 }, _count: { method: 60 } },
          { method: "QRIS", _sum: { amountPaid: 20000000 }, _count: { method: 40 } },
        ])
        .mockResolvedValueOnce([
          { status: "PAID", _sum: { amountPaid: 48000000 }, _count: { status: 95 } },
          { status: "REFUNDED", _sum: { amountPaid: 2000000 }, _count: { status: 5 } },
        ]);

      const result = await repo.getPaymentSummary({});

      expect(result.totalAmount).toBe(50000000);
      expect(result.totalCount).toBe(100);
      expect(result.byMethod).toEqual([
        { method: "CASH", amount: 30000000, count: 60 },
        { method: "QRIS", amount: 20000000, count: 40 },
      ]);
      expect(result.byStatus).toEqual([
        { status: "PAID", amount: 48000000, count: 95 },
        { status: "REFUNDED", amount: 2000000, count: 5 },
      ]);
    });

    /**
     * @test Mengembalikan ringkasan dengan filter rentang tanggal
     */
    it("should return payment summary with date range filter", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: 0 } });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await repo.getPaymentSummary(query);

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        _sum: { amountPaid: true },
      });
    });

    /**
     * @test Menangani nilai null pada aggregasi
     */
    it("should handle null aggregation values", async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: null } });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await repo.getPaymentSummary({});

      expect(result.totalAmount).toBe(0);
    });
  });

  /**
   * @describe getTotalByMethod
   */
  describe("getTotalByMethod", () => {
    /**
     * @test Mengembalikan total pembayaran berdasarkan metode
     */
    it("should return total payment by method", async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amountPaid: 30000000 },
        _count: { id: 60 },
      });

      const result = await repo.getTotalByMethod("CASH", {});

      expect(result).toEqual({
        method: "CASH",
        totalAmount: 30000000,
        totalCount: 60,
      });
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: { method: "CASH" },
        _sum: { amountPaid: true },
        _count: { id: true },
      });
    });

    /**
     * @test Mengembalikan total dengan filter rentang tanggal
     */
    it("should return total by method with date range filter", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amountPaid: 15000000 },
        _count: { id: 30 },
      });

      await repo.getTotalByMethod("QRIS", query);

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: {
          method: "QRIS",
          createdAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        _sum: { amountPaid: true },
        _count: { id: true },
      });
    });

    /**
     * @test Menangani nilai null pada aggregasi
     */
    it("should handle null aggregation values", async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amountPaid: null },
        _count: { id: null },
      });

      const result = await repo.getTotalByMethod("CASH", {});

      expect(result.totalAmount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  /**
   * @describe getPaymentHistoryByOrder
   */
  describe("getPaymentHistoryByOrder", () => {
    /**
     * @test Mengembalikan history pembayaran untuk pesanan
     */
    it("should return payment history for an order", async () => {
      const mockHistory = [
        {
          id: "pay-1",
          method: "QRIS",
          amountPaid: 0,
          change: 0,
          status: "PENDING",
          paidAt: null,
          createdAt: new Date("2025-06-01T08:00:00"),
        },
        {
          id: "pay-2",
          method: "QRIS",
          amountPaid: 150000,
          change: 0,
          status: "PAID",
          paidAt: new Date("2025-06-01T08:05:00"),
          createdAt: new Date("2025-06-01T08:05:00"),
        },
      ];

      prisma.payment.findMany.mockResolvedValue(mockHistory);

      const result = await repo.getPaymentHistoryByOrder("order-1");

      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
        select: {
          id: true,
          method: true,
          amountPaid: true,
          change: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada history
     */
    it("should return empty array when no payment history", async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await repo.getPaymentHistoryByOrder("order-99");

      expect(result).toEqual([]);
    });
  });
});