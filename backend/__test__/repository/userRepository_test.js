import prisma from "#app/database.js";
import UserRepository from "#repository/userRepository.js";

jest.mock("#app/database.js", () => ({
  user: {
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
  },
  expense: {
    count: jest.fn(),
  },
  stockMovement: {
    count: jest.fn(),
  },
  mechanicAssignment: {
    count: jest.fn(),
  },
  file: {
    count: jest.fn(),
  },
}));

/**
 * Unit test untuk UserRepository
 * @describe UserRepository
 */
describe("UserRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UserRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat user baru dengan semua field
     */
    it("should create a user with all fields", async () => {
      const input = {
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "081234567890",
        role: "CASHIER",
        isAuthenticated: false,
      };

      const expected = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "081234567890",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "kasir@bengkel.com",
          fullName: "Kasir 1",
          phone: "081234567890",
          role: "CASHIER",
          isActive: true,
          isAuthenticated: false,
        },
        select: expect.any(Object),
      });
    });

    /**
     * @test Membuat user dengan nilai default
     */
    it("should create a user with default values", async () => {
      const input = {
        email: "mekanik@bengkel.com",
        fullName: "Mekanik 1",
      };

      prisma.user.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "CASHIER",
          isActive: true,
          isAuthenticated: false,
        }),
        select: expect.any(Object),
      });
    });

    /**
     * @test Membuat user dengan isAuthenticated true
     */
    it("should create a user with isAuthenticated true", async () => {
      const input = {
        email: "admin@bengkel.com",
        fullName: "Admin",
        role: "ADMIN",
        isAuthenticated: true,
      };

      prisma.user.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isAuthenticated: true,
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
     * @test Mengembalikan user lengkap dengan counts
     */
    it("should return user with detail counts when found", async () => {
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "0812",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          orders: 50,
          shifts: 30,
          expenses: 10,
          stockMovements: 5,
          mechanicAssignments: 0,
          uploadedFiles: 2,
        },
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findById("user-1");

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: expect.objectContaining({
          _count: expect.any(Object),
        }),
      });
    });

    /**
     * @test Mengembalikan null ketika user tidak ditemukan
     */
    it("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findById("user-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByEmail
   */
  describe("findByEmail", () => {
    /**
     * @test Mengembalikan user berdasarkan email
     */
    it("should return user by email", async () => {
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "0812",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findByEmail("kasir@bengkel.com");

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "kasir@bengkel.com" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika email tidak ditemukan
     */
    it("should return null when email not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findByEmail("unknown@email.com");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByPhone
   */
  describe("findByPhone", () => {
    /**
     * @test Mengembalikan user berdasarkan phone
     */
    it("should return user by phone", async () => {
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "081234567890",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repo.findByPhone("081234567890");

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: "081234567890" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengembalikan null ketika phone null
     */
    it("should return null when phone is null", async () => {
      const result = await repo.findByPhone(null);

      expect(result).toBeNull();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    /**
     * @test Mengembalikan null ketika phone tidak ditemukan
     */
    it("should return null when phone not found", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByPhone("089999999999");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan user dengan paginasi default
     */
    it("should return users with default pagination", async () => {
      const mockData = [
        { id: "u1", email: "a@email.com", fullName: "Andi", phone: "0811", role: "CASHIER", isActive: true, isAuthenticated: true, createdAt: new Date(), updatedAt: new Date() },
        { id: "u2", email: "b@email.com", fullName: "Budi", phone: "0812", role: "MECHANIC", isActive: true, isAuthenticated: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      prisma.user.count.mockResolvedValue(2);
      prisma.user.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { fullName: "asc" },
      });
    });

    /**
     * @test Mengembalikan user dengan filter role
     */
    it("should return users filtered by role", async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findMany({ role: "MECHANIC" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: "MECHANIC" } })
      );
    });

    /**
     * @test Mengembalikan user dengan filter isActive
     */
    it("should return users filtered by isActive", async () => {
      prisma.user.count.mockResolvedValue(3);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findMany({ isActive: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
    });

    /**
     * @test Mengembalikan user dengan pencarian
     */
    it("should return users filtered by search", async () => {
      prisma.user.count.mockResolvedValue(2);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Budi" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { fullName: { contains: "Budi", mode: "insensitive" } },
              { email: { contains: "Budi", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });

  /**
   * @describe findByRole
   */
  describe("findByRole", () => {
    /**
     * @test Mengembalikan user berdasarkan role
     */
    it("should return users by role", async () => {
      const mockUsers = [
        { id: "u1", email: "m1@email.com", fullName: "Mekanik 1", phone: "0811", role: "MECHANIC", isActive: true, isAuthenticated: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await repo.findByRole("MECHANIC");

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: "MECHANIC" },
        select: expect.any(Object),
        orderBy: { fullName: "asc" },
      });
    });
  });

  /**
   * @describe findEmployees
   */
  describe("findEmployees", () => {
    /**
     * @test Mengembalikan karyawan (CASHIER & MECHANIC)
     */
    it("should return employees with default role filter", async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findEmployees({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: { in: ["CASHIER", "MECHANIC"] } },
        })
      );
    });

    /**
     * @test Mengembalikan karyawan dengan role spesifik
     */
    it("should return employees with specific role filter", async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findEmployees({ role: "MECHANIC" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: "MECHANIC" },
        })
      );
    });
  });

  /**
   * @describe update
   */
  describe("update", () => {
    /**
     * @test Mengupdate data user
     */
    it("should update user data", async () => {
      const updateData = { fullName: "Kasir Updated", phone: "089876543210" };
      const expected = {
        id: "user-1",
        email: "kasir@email.com",
        fullName: "Kasir Updated",
        phone: "089876543210",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(expected);

      const result = await repo.update("user-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: updateData,
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus user berdasarkan ID
     */
    it("should delete a user by ID", async () => {
      prisma.user.delete.mockResolvedValue({});

      await repo.delete("user-1");

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });
  });

  /**
   * @describe isEmailExists
   */
  describe("isEmailExists", () => {
    /**
     * @test Mengembalikan user ketika email exists
     */
    it("should return user when email exists", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "kasir@email.com",
        isActive: true,
      });

      const result = await repo.isEmailExists("kasir@email.com");

      expect(result).toEqual({ id: "user-1", email: "kasir@email.com", isActive: true });
    });

    /**
     * @test Mengembalikan null ketika email tidak exists
     */
    it("should return null when email does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.isEmailExists("new@email.com");

      expect(result).toBeNull();
    });

    /**
     * @test Mengembalikan null ketika email null
     */
    it("should return null when email is null", async () => {
      const result = await repo.isEmailExists(null);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    /**
     * @test Mengecualikan ID tertentu
     */
    it("should exclude specific ID when checking", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await repo.isEmailExists("kasir@email.com", "user-1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "kasir@email.com", id: { not: "user-1" } },
        select: { id: true, email: true, isActive: true },
      });
    });
  });

  /**
   * @describe isPhoneExists
   */
  describe("isPhoneExists", () => {
    /**
     * @test Mengembalikan user ketika phone exists
     */
    it("should return user when phone exists", async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        phone: "081234567890",
        isActive: true,
      });

      const result = await repo.isPhoneExists("081234567890");

      expect(result).toEqual({ id: "user-1", phone: "081234567890", isActive: true });
    });

    /**
     * @test Mengembalikan null ketika phone null
     */
    it("should return null when phone is null", async () => {
      const result = await repo.isPhoneExists(null);

      expect(result).toBeNull();
    });

    /**
     * @test Mengecualikan ID tertentu
     */
    it("should exclude specific ID when checking", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await repo.isPhoneExists("081234567890", "user-1");

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: "081234567890", id: { not: "user-1" } },
        select: { id: true, phone: true, isActive: true },
      });
    });
  });

  /**
   * @describe hasRelations
   */
  describe("hasRelations", () => {
    /**
     * @test Mengembalikan true ketika user memiliki relasi
     */
    it("should return true when user has relations", async () => {
      prisma.order.count.mockResolvedValue(5);
      prisma.expense.count.mockResolvedValue(0);
      prisma.stockMovement.count.mockResolvedValue(0);
      prisma.mechanicAssignment.count.mockResolvedValue(0);
      prisma.file.count.mockResolvedValue(0);

      const result = await repo.hasRelations("user-1");

      expect(result).toBe(true);
    });

    /**
     * @test Mengembalikan false ketika user tidak memiliki relasi
     */
    it("should return false when user has no relations", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.expense.count.mockResolvedValue(0);
      prisma.stockMovement.count.mockResolvedValue(0);
      prisma.mechanicAssignment.count.mockResolvedValue(0);
      prisma.file.count.mockResolvedValue(0);

      const result = await repo.hasRelations("user-1");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe updateAuthenticated
   */
  describe("updateAuthenticated", () => {
    /**
     * @test Update status autentikasi menjadi true
     */
    it("should update authentication status to true", async () => {
      prisma.user.update.mockResolvedValue({});

      await repo.updateAuthenticated("user-1", true);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { isAuthenticated: true },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe getUserSummary
   */
  describe("getUserSummary", () => {
    /**
     * @test Mengembalikan ringkasan user dengan todayOrders
     */
    it("should return user summary with todayOrders", async () => {
      const mockUser = {
        id: "user-1",
        email: "kasir@email.com",
        fullName: "Kasir",
        _count: { orders: 100, shifts: 50, expenses: 10, stockMovements: 5, mechanicAssignments: 0, uploadedFiles: 2 },
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.order.count.mockResolvedValue(8);

      const result = await repo.getUserSummary("user-1");

      expect(result.todayOrders).toBe(8);
    });

    /**
     * @test Mengembalikan null ketika user tidak ditemukan
     */
    it("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.getUserSummary("user-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findAvailableMechanics
   */
  describe("findAvailableMechanics", () => {
    /**
     * @test Mengembalikan mekanik yang tersedia
     */
    it("should return available mechanics", async () => {
      const mockMechanics = [
        {
          id: "m1",
          fullName: "Joko",
          email: "joko@email.com",
          phone: "0812",
          _count: { mechanicAssignments: 2 },
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockMechanics);

      const result = await repo.findAvailableMechanics({});

      expect(result).toEqual(mockMechanics);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: "MECHANIC", isActive: true },
        take: 10,
        select: expect.any(Object),
        orderBy: { fullName: "asc" },
      });
    });
  });

  /**
   * @describe updateAuthStatus
   */
  describe("updateAuthStatus", () => {
    /**
     * @test Update status autentikasi jika belum terautentikasi
     */
    it("should update auth status when not authenticated", async () => {
      prisma.user.findUnique.mockResolvedValue({ isAuthenticated: false });
      prisma.user.update.mockResolvedValue({});

      await repo.updateAuthStatus("user-1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { isAuthenticated: true },
        select: expect.any(Object),
      });
    });

    /**
     * @test Tidak update jika sudah terautentikasi
     */
    it("should not update when already authenticated", async () => {
      prisma.user.findUnique.mockResolvedValue({ isAuthenticated: true });

      await repo.updateAuthStatus("user-1");

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    /**
     * @test Tidak melakukan apa-apa ketika user tidak ditemukan
     */
    it("should do nothing when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await repo.updateAuthStatus("user-99");

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});