import prisma from "#app/database.js";
import CustomerRepository from "#repository/customerRepository.js";

jest.mock("#app/database.js", () => ({
  customer: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  order: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  vehicle: {
    count: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
}));

jest.mock("#shared/utils/pagination.js", () => ({
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })),
}));

/**
 * Unit test untuk CustomerRepository
 * @describe CustomerRepository
 */
describe("CustomerRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CustomerRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat pelanggan baru dengan semua field
     */
    it("should create a customer with all fields", async () => {
      const input = { name: "Budi Santoso", phone: "081234567890" };
      const expected = { id: "c1", name: "Budi Santoso", phone: "081234567890", createdAt: new Date() };

      prisma.customer.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { name: "Budi Santoso", phone: "081234567890" },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    });

    /**
     * @test Membuat pelanggan tanpa nomor telepon
     */
    it("should create a customer without phone", async () => {
      const input = { name: "Ani Rahayu" };
      const expected = { id: "c2", name: "Ani Rahayu", phone: null, createdAt: new Date() };

      prisma.customer.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { name: "Ani Rahayu", phone: null },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe upsert
   */
  describe("upsert", () => {
    /**
     * @test Mengupdate pelanggan yang sudah ada berdasarkan phone
     */
    it("should update existing customer when phone exists", async () => {
      const input = { name: "Budi Updated", phone: "081234567890" };
      const existing = { id: "c1" };
      const updated = { id: "c1", name: "Budi Updated", phone: "081234567890", createdAt: new Date() };

      prisma.customer.findUnique.mockResolvedValue(existing);
      prisma.customer.update.mockResolvedValue(updated);

      const result = await repo.upsert(input);

      expect(result).toEqual(updated);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { phone: "081234567890" },
        select: { id: true },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "Budi Updated" },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    /**
     * @test Membuat pelanggan baru ketika phone belum ada
     */
    it("should create new customer when phone does not exist", async () => {
      const input = { name: "New Customer", phone: "089876543210" };
      const created = { id: "c3", name: "New Customer", phone: "089876543210", createdAt: new Date() };

      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(created);

      const result = await repo.upsert(input);

      expect(result).toEqual(created);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { phone: "089876543210" },
        select: { id: true },
      });
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { name: "New Customer", phone: "089876543210" },
        select: expect.any(Object),
      });
      expect(prisma.customer.update).not.toHaveBeenCalled();
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan pelanggan lengkap ketika ditemukan
     */
    it("should return full customer data when found", async () => {
      const mockCustomer = {
        id: "c1",
        name: "Budi",
        phone: "0812",
        createdAt: new Date(),
        vehicles: [],
        orders: [],
        _count: { vehicles: 0, orders: 0 },
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await repo.findById("c1");

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
        select: expect.objectContaining({
          id: true,
          name: true,
          phone: true,
          vehicles: expect.any(Object),
          orders: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika pelanggan tidak ditemukan
     */
    it("should return null when customer not found", async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const result = await repo.findById("c99");

      expect(result).toBeNull();
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: "c99" },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findByPhone
   */
  describe("findByPhone", () => {
    /**
     * @test Mengembalikan pelanggan ketika nomor telepon ditemukan
     */
    it("should return customer when phone found", async () => {
      const mockCustomer = {
        id: "c1",
        name: "Budi",
        phone: "081234567890",
        createdAt: new Date(),
        vehicles: [],
        orders: [],
        _count: { vehicles: 0, orders: 0 },
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await repo.findByPhone("081234567890");

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { phone: "081234567890" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika nomor telepon tidak ditemukan
     */
    it("should return null when phone not found", async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const result = await repo.findByPhone("089999999999");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan pelanggan dengan paginasi default
     */
    it("should return customers with default pagination", async () => {
      const mockData = [
        { id: "c1", name: "Budi", phone: "0812", createdAt: new Date(), vehicles: [], _count: { vehicles: 0, orders: 0 } },
        { id: "c2", name: "Ani", phone: "0813", createdAt: new Date(), vehicles: [], _count: { vehicles: 0, orders: 0 } },
      ];

      prisma.customer.count.mockResolvedValue(2);
      prisma.customer.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(result.metadata.page).toBe(1);
      expect(result.metadata.limit).toBe(10);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan pelanggan dengan filter pencarian
     */
    it("should return customers with search filter", async () => {
      const query = { search: "Budi", page: 1, limit: 5 };

      prisma.customer.count.mockResolvedValue(1);
      prisma.customer.findMany.mockResolvedValue([
        { id: "c1", name: "Budi", phone: "0812", createdAt: new Date(), vehicles: [], _count: { vehicles: 0, orders: 0 } },
      ]);

      const result = await repo.findMany(query);

      expect(result.data).toHaveLength(1);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "Budi", mode: "insensitive" } },
            { phone: { contains: "Budi", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 5,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pelanggan
     */
    it("should return empty array when no customers", async () => {
      prisma.customer.count.mockResolvedValue(0);
      prisma.customer.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });

    /**
     * @test Menangani halaman kedua dengan offset yang benar
     */
    it("should handle second page with correct offset", async () => {
      prisma.customer.count.mockResolvedValue(25);
      prisma.customer.findMany.mockResolvedValue([]);

      await repo.findMany({ page: 2, limit: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  /**
   * @describe searchByName
   */
  describe("searchByName", () => {
    /**
     * @test Mencari pelanggan berdasarkan nama dengan limit default
     */
    it("should search customers by name with default limit", async () => {
      const mockResults = [
        { id: "c1", name: "Budi Santoso", phone: "0812", vehicles: [] },
      ];

      prisma.customer.findMany.mockResolvedValue(mockResults);

      const result = await repo.searchByName("Budi");

      expect(result).toEqual(mockResults);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: "Budi", mode: "insensitive" },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          phone: true,
          vehicles: {
            select: { id: true, plateNumber: true },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      });
    });

    /**
     * @test Mencari pelanggan dengan limit kustom
     */
    it("should search customers with custom limit", async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      await repo.searchByName("Ani", 5);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada yang cocok
     */
    it("should return empty array when no matches", async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      const result = await repo.searchByName("XYZ123");

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe update
   */
  describe("update", () => {
    /**
     * @test Mengupdate nama dan telepon pelanggan
     */
    it("should update customer name and phone", async () => {
      const updated = { id: "c1", name: "Budi Updated", phone: "089876543210", createdAt: new Date() };

      prisma.customer.update.mockResolvedValue(updated);

      const result = await repo.update("c1", { name: "Budi Updated", phone: "089876543210" });

      expect(result).toEqual(updated);
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "Budi Updated", phone: "089876543210" },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    });

    /**
     * @test Mengupdate hanya nama pelanggan
     */
    it("should update only customer name", async () => {
      const updated = { id: "c1", name: "New Name", phone: "081234567890", createdAt: new Date() };

      prisma.customer.update.mockResolvedValue(updated);

      await repo.update("c1", { name: "New Name" });

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "New Name", phone: undefined },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus pelanggan berdasarkan ID
     */
    it("should delete customer by ID", async () => {
      prisma.customer.delete.mockResolvedValue({});

      await repo.delete("c1");

      expect(prisma.customer.delete).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
    });
  });

  /**
   * @describe isPhoneExists
   */
  describe("isPhoneExists", () => {
    /**
     * @test Mengembalikan true ketika nomor telepon sudah digunakan
     */
    it("should return true when phone exists", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1" });

      const result = await repo.isPhoneExists("081234567890");

      expect(result).toBe(true);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { phone: "081234567890" },
        select: { id: true },
      });
    });

    /**
     * @test Mengembalikan false ketika nomor telepon belum digunakan
     */
    it("should return false when phone does not exist", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      const result = await repo.isPhoneExists("089999999999");

      expect(result).toBe(false);
    });

    /**
     * @test Mengecualikan ID tertentu saat pengecekan
     */
    it("should exclude specific ID when checking", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await repo.isPhoneExists("081234567890", "c1");

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          phone: "081234567890",
          id: { not: "c1" },
        },
        select: { id: true },
      });
    });
  });

  /**
   * @describe hasOrders
   */
  describe("hasOrders", () => {
    /**
     * @test Mengembalikan true ketika pelanggan memiliki order
     */
    it("should return true when customer has orders", async () => {
      prisma.order.count.mockResolvedValue(5);

      const result = await repo.hasOrders("c1");

      expect(result).toBe(true);
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          customerId: "c1",
          deletedAt: null,
        },
      });
    });

    /**
     * @test Mengembalikan false ketika pelanggan tidak memiliki order
     */
    it("should return false when customer has no orders", async () => {
      prisma.order.count.mockResolvedValue(0);

      const result = await repo.hasOrders("c1");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe hasVehicles
   */
  describe("hasVehicles", () => {
    /**
     * @test Mengembalikan true ketika pelanggan memiliki kendaraan
     */
    it("should return true when customer has vehicles", async () => {
      prisma.vehicle.count.mockResolvedValue(3);

      const result = await repo.hasVehicles("c1");

      expect(result).toBe(true);
      expect(prisma.vehicle.count).toHaveBeenCalledWith({
        where: { customerId: "c1" },
      });
    });

    /**
     * @test Mengembalikan false ketika pelanggan tidak memiliki kendaraan
     */
    it("should return false when customer has no vehicles", async () => {
      prisma.vehicle.count.mockResolvedValue(0);

      const result = await repo.hasVehicles("c1");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe getCustomerSummary
   */
  describe("getCustomerSummary", () => {
    /**
     * @test Mengembalikan ringkasan pelanggan lengkap
     */
    it("should return complete customer summary", async () => {
      const mockCustomer = {
        id: "c1",
        name: "Budi",
        phone: "0812",
        createdAt: new Date("2025-01-01"),
        _count: { vehicles: 2, orders: 10 },
        orders: [{ total: 500000, createdAt: new Date("2025-06-01") }],
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.order.aggregate.mockResolvedValue({ _sum: { total: 5000000 } });

      const result = await repo.getCustomerSummary("c1");

      expect(result).toEqual({
        id: "c1",
        name: "Budi",
        phone: "0812",
        createdAt: mockCustomer.createdAt,
        totalVehicles: 2,
        totalOrders: 10,
        totalSpent: 5000000,
        lastOrder: mockCustomer.orders[0],
      });
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          customerId: "c1",
          deletedAt: null,
          status: { in: ["COMPLETED", "CLOSED"] },
        },
        _sum: { total: true },
      });
    });

    /**
     * @test Mengembalikan null ketika pelanggan tidak ditemukan
     */
    it("should return null when customer not found", async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const result = await repo.getCustomerSummary("c99");

      expect(result).toBeNull();
      expect(prisma.order.aggregate).not.toHaveBeenCalled();
    });

    /**
     * @test Menangani pelanggan tanpa order
     */
    it("should handle customer with no orders", async () => {
      const mockCustomer = {
        id: "c2",
        name: "New Customer",
        phone: "0813",
        createdAt: new Date(),
        _count: { vehicles: 0, orders: 0 },
        orders: [],
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.order.aggregate.mockResolvedValue({ _sum: { total: 0 } });

      const result = await repo.getCustomerSummary("c2");

      expect(result.totalSpent).toBe(0);
      expect(result.lastOrder).toBeNull();
    });
  });

  /**
   * @describe getTopCustomers
   */
  describe("getTopCustomers", () => {
    /**
     * @test Mengembalikan pelanggan teratas dengan limit default
     */
    it("should return top customers with default limit", async () => {
      const mockTopCustomers = [
        { id: "c1", name: "Budi", phone: "0812", totalOrders: 50, totalSpent: 10000000, lastOrderDate: new Date() },
        { id: "c2", name: "Ani", phone: "0813", totalOrders: 30, totalSpent: 5000000, lastOrderDate: new Date() },
      ];

      prisma.$queryRawUnsafe.mockResolvedValue(mockTopCustomers);

      const result = await repo.getTopCustomers();

      expect(result).toEqual(mockTopCustomers);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.any(String), 10);
    });

    /**
     * @test Mengembalikan pelanggan teratas dengan limit kustom
     */
    it("should return top customers with custom limit", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await repo.getTopCustomers(5);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.any(String), 5);
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada pelanggan
     */
    it("should return empty array when no customers", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getTopCustomers();

      expect(result).toEqual([]);
    });
  });
});