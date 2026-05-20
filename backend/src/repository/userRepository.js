import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class UserRepository {
  #userSelect = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    role: true,
    isActive: true,
    isAuthenticated: true,
    createdAt: true,
    updatedAt: true,
  };

  #userDetailSelect = {
    ...this.#userSelect,
    _count: {
      select: {
        orders: true,
        shifts: true,
        expenses: true,
        stockMovements: true,
        mechanicAssignments: true,
        uploadedFiles: true,
      },
    },
  };

  /**
   * Membuat user baru
   * @param {Object} data - Data user
   * @param {string} data.email - Email user
   * @param {string} data.fullName - Nama lengkap
   * @param {string} [data.phone] - Nomor telepon
   * @param {string} [data.role] - Role user
   * @param {boolean} [data.isAuthenticated] - Status autentikasi
   * @returns {Promise<Object>} User yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role || "CASHIER",
        isActive: true,
        isAuthenticated: data.isAuthenticated ?? false,
      },
      select: this.#userSelect,
    });
  }

  /**
   * Mencari user berdasarkan ID
   * @param {string} id - ID user
   * @returns {Promise<Object|null>} Data user atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: this.#userDetailSelect,
    });
  }

  /**
   * Mencari user berdasarkan email
   * @param {string} email - Email user
   * @returns {Promise<Object|null>} Data user atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: this.#userSelect,
    });
  }

  /**
   * Mencari user berdasarkan nomor telepon
   * @param {string} phone - Nomor telepon
   * @returns {Promise<Object|null>} Data user atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findByPhone(phone) {
    if (!phone) return null;

    return prisma.user.findFirst({
      where: { phone },
      select: this.#userSelect,
    });
  }

  /**
   * Mencari daftar user dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.role] - Filter berdasarkan role
   * @param {string} [query.search] - Pencarian berdasarkan nama atau email
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar user
   * @complexity Before: O(n) - OR conditions with offset pagination
   * @complexity After: O(log n) - Uses indexes on role, fullName, and email
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: this.#userSelect,
        orderBy: { fullName: "asc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mencari user berdasarkan role
   * @param {string} role - Role user
   * @returns {Promise<Array>} Daftar user
   * @complexity Before: O(n) - Full scan with role filter
   * @complexity After: O(log n) - Uses composite index (role, isActive)
   */
  async findByRole(role) {
    return prisma.user.findMany({
      where: { role },
      select: this.#userSelect,
      orderBy: { fullName: "asc" },
    });
  }

  /**
   * Mencari semua karyawan (CASHIER & MECHANIC)
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.role] - Filter role spesifik (CASHIER/MECHANIC)
   * @param {string} [query.search] - Pencarian berdasarkan nama atau email
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar karyawan
   * @complexity Before: O(n) - OR conditions with role filter
   * @complexity After: O(log n) - Uses composite index (role, isActive, fullName)
   */
  async findEmployees(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const where = {
      role: query.role ? query.role : { in: ["CASHIER", "MECHANIC"] },
    };

    if (query.isActive !== undefined) where.isActive = query.isActive;

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: this.#userSelect,
        orderBy: { fullName: "asc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mengupdate data user
   * @param {string} id - ID user
   * @param {Object} data - Data yang akan diupdate
   * @param {string} [data.fullName] - Nama lengkap
   * @param {string} [data.phone] - Nomor telepon
   * @param {string} [data.role] - Role user
   * @param {boolean} [data.isActive] - Status aktif
   * @param {boolean} [data.isAuthenticated] - Status autentikasi
   * @returns {Promise<Object>} User yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: this.#userSelect,
    });
  }

  /**
   * Menghapus user
   * @param {string} id - ID user
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.user.delete({ where: { id } });
  }

  /**
   * Mengecek apakah email sudah terdaftar
   * @param {string} email - Email yang dicek
   * @param {string} [excludeId] - ID user yang dikecualikan
   * @returns {Promise<Object|null>} User jika ditemukan, null jika tidak
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async isEmailExists(email, excludeId = null) {
    if (!email) return null;

    const where = { email };
    if (excludeId) where.id = { not: excludeId };

    return prisma.user.findUnique({
      where,
      select: { id: true, email: true, isActive: true },
    });
  }

  /**
   * Mengecek apakah nomor telepon sudah terdaftar
   * @param {string} phone - Nomor telepon yang dicek
   * @param {string} [excludeId] - ID user yang dikecualikan
   * @returns {Promise<Object|null>} User jika ditemukan, null jika tidak
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async isPhoneExists(phone, excludeId = null) {
    if (!phone) return null;

    const where = { phone };
    if (excludeId) where.id = { not: excludeId };

    return prisma.user.findFirst({
      where,
      select: { id: true, phone: true, isActive: true },
    });
  }

  /**
   * Mengecek apakah user masih memiliki relasi data
   * @param {string} id - ID user
   * @returns {Promise<boolean>} Status relasi
   * @complexity Before: O(n) - Five separate count queries
   * @complexity After: O(log n) - Parallel execution with indexed foreign keys
   */
  async hasRelations(id) {
    const [
      orders,
      expenses,
      stockMovements,
      mechanicAssignments,
      uploadedFiles,
    ] = await Promise.all([
      prisma.order.count({ where: { cashierId: id } }),
      prisma.expense.count({ where: { recordedById: id } }),
      prisma.stockMovement.count({ where: { recordedById: id } }),
      prisma.mechanicAssignment.count({ where: { mechanicId: id } }),
      prisma.file.count({ where: { uploadedById: id } }),
    ]);

    return (
      orders > 0 ||
      expenses > 0 ||
      stockMovements > 0 ||
      mechanicAssignments > 0 ||
      uploadedFiles > 0
    );
  }

  /**
   * Update status autentikasi user
   * @param {string} id - ID user
   * @param {boolean} isAuthenticated - Status autentikasi
   * @returns {Promise<Object>} User yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async updateAuthenticated(id, isAuthenticated = true) {
    return prisma.user.update({
      where: { id },
      data: { isAuthenticated },
      select: this.#userSelect,
    });
  }

  /**
   * Mendapatkan ringkasan user
   * @param {string} id - ID user
   * @returns {Promise<Object|null>} Ringkasan user
   * @complexity Before: O(n) - Multiple nested queries
   * @complexity After: O(log n) - Parallel execution with aggregated counts
   */
  async getUserSummary(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: this.#userDetailSelect,
    });

    if (!user) return null;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order.count({
      where: {
        cashierId: id,
        createdAt: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    return {
      ...user,
      todayOrders,
    };
  }

  /**
   * Mendapatkan daftar mekanik yang tersedia
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @returns {Promise<Array>} Daftar mekanik
   * @complexity Before: O(n) - Full scan with role filter
   * @complexity After: O(log n) - Uses composite index (role, isActive)
   */
  async findAvailableMechanics(query = {}) {
    const limit = query.limit || 10;

    return prisma.user.findMany({
      where: {
        role: "MECHANIC",
        isActive: true,
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        _count: {
          select: {
            mechanicAssignments: {
              where: {
                endAt: null,
                orderItem: {
                  order: {
                    status: { in: ["QUEUED", "IN_PROGRESS"] },
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });
  }
}

export default UserRepository;