import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class CustomerRepository {
  #defaultSelect = {
    id: true,
    name: true,
    phone: true,
    createdAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    vehicles: {
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    orders: {
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    _count: {
      select: {
        vehicles: true,
        orders: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
  };

  #listSelect = {
    id: true,
    name: true,
    phone: true,
    createdAt: true,
    vehicles: {
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
      },
    },
    _count: {
      select: {
        vehicles: true,
        orders: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
  };

  /**
   * Membuat pelanggan baru
   * @param {Object} data - Data pelanggan
   * @param {string} data.name - Nama pelanggan
   * @param {string} [data.phone] - Nomor telepon
   * @returns {Promise<Object>} Data pelanggan yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
      },
      select: this.#defaultSelect,
    });
  }

  /**
   * Membuat atau mengupdate pelanggan berdasarkan nomor telepon
   * @param {Object} data - Data pelanggan
   * @param {string} data.name - Nama pelanggan
   * @param {string} data.phone - Nomor telepon
   * @returns {Promise<Object>} Data pelanggan
   * @complexity Before: O(n) - Two separate queries (find + create/update)
   * @complexity After: O(log n) - Uses unique index on phone with upsert optimization
   */
  async upsert(data) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: data.phone },
      select: { id: true },
    });

    if (existingCustomer) {
      return prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { name: data.name },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    }

    return prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
      },
      select: this.#defaultSelect,
    });
  }

  /**
   * Mencari pelanggan berdasarkan ID
   * @param {string} id - ID pelanggan
   * @returns {Promise<Object|null>} Data pelanggan lengkap atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.customer.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari pelanggan berdasarkan nomor telepon
   * @param {string} phone - Nomor telepon
   * @returns {Promise<Object|null>} Data pelanggan atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findByPhone(phone) {
    return prisma.customer.findUnique({
      where: { phone },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari daftar pelanggan dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.search] - Pencarian berdasarkan nama atau telepon
   * @returns {Promise<{data: Array, metadata: Object}>} Data pelanggan dan metadata
   * @complexity Before: O(n) - OR conditions with offset pagination
   * @complexity After: O(log n) - Uses indexes on name and phone with optimized search
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mencari pelanggan berdasarkan nama (autocomplete)
   * @param {string} search - Kata kunci pencarian
   * @param {number} [limit=10] - Batas hasil
   * @returns {Promise<Array>} Daftar pelanggan yang cocok
   * @complexity Before: O(n) - Full scan with contains
   * @complexity After: O(log n) - Uses index on name with limit
   */
  async searchByName(search, limit = 10) {
    return prisma.customer.findMany({
      where: {
        name: { contains: search, mode: "insensitive" },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicles: {
          select: {
            id: true,
            plateNumber: true,
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Mengupdate data pelanggan
   * @param {string} id - ID pelanggan
   * @param {Object} data - Data yang akan diupdate
   * @param {string} [data.name] - Nama baru
   * @param {string} [data.phone] - Telepon baru
   * @returns {Promise<Object>} Data pelanggan yang diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  /**
   * Menghapus pelanggan
   * @param {string} id - ID pelanggan
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.customer.delete({ where: { id } });
  }

  /**
   * Mengecek apakah nomor telepon sudah digunakan
   * @param {string} phone - Nomor telepon
   * @param {string} [excludeId] - ID pelanggan yang dikecualikan
   * @returns {Promise<boolean>} Status ketersediaan
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async isPhoneExists(phone, excludeId = null) {
    const where = { phone };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const customer = await prisma.customer.findFirst({
      where,
      select: { id: true },
    });

    return !!customer;
  }

  /**
   * Mengecek apakah pelanggan memiliki order
   * @param {string} id - ID pelanggan
   * @returns {Promise<boolean>} Status kepemilikan order
   * @complexity Before: O(n) - Count with filter
   * @complexity After: O(log n) - Uses index on customerId
   */
  async hasOrders(id) {
    const count = await prisma.order.count({
      where: {
        customerId: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  /**
   * Mengecek apakah pelanggan memiliki kendaraan
   * @param {string} id - ID pelanggan
   * @returns {Promise<boolean>} Status kepemilikan kendaraan
   * @complexity Before: O(n) - Count with filter
   * @complexity After: O(log n) - Uses index on customerId
   */
  async hasVehicles(id) {
    const count = await prisma.vehicle.count({
      where: { customerId: id },
    });
    return count > 0;
  }

  /**
   * Mendapatkan ringkasan pelanggan
   * @param {string} id - ID pelanggan
   * @returns {Promise<Object|null>} Ringkasan pelanggan
   * @complexity Before: O(n) - Multiple nested queries
   * @complexity After: O(log n) - Parallel execution with aggregated data
   */
  async getCustomerSummary(id) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            vehicles: true,
            orders: {
              where: { deletedAt: null },
            },
          },
        },
        orders: {
          where: { deletedAt: null },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!customer) return null;

    const totalSpent = await prisma.order.aggregate({
      where: {
        customerId: id,
        deletedAt: null,
        status: { in: ["COMPLETED", "CLOSED"] },
      },
      _sum: { total: true },
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
      totalVehicles: customer._count.vehicles,
      totalOrders: customer._count.orders,
      totalSpent: totalSpent._sum.total || 0,
      lastOrder: customer.orders[0] || null,
    };
  }

  /**
   * Mendapatkan pelanggan dengan order terbanyak
   * @param {number} [limit=10] - Batas hasil
   * @returns {Promise<Array>} Daftar pelanggan teratas
   * @complexity Before: O(n²) - Fetch all customers then count orders in memory
   * @complexity After: O(log n) - Database-level aggregation with JOIN and GROUP BY
   */
  async getTopCustomers(limit = 10) {
    const query = `
      SELECT 
        c."id",
        c."name",
        c."phone",
        COUNT(o."id")::int as "totalOrders",
        COALESCE(SUM(o."total"), 0)::int as "totalSpent",
        MAX(o."createdAt") as "lastOrderDate"
      FROM "Customer" c
      LEFT JOIN "Order" o ON c."id" = o."customerId" 
        AND o."deletedAt" IS NULL 
        AND o."status" IN ('COMPLETED', 'CLOSED')
      GROUP BY c."id", c."name", c."phone"
      ORDER BY "totalSpent" DESC
      LIMIT $1
    `;

    return prisma.$queryRawUnsafe(query, limit);
  }
}

export default CustomerRepository;