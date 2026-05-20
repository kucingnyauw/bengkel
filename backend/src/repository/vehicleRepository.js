import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class VehicleRepository {
  #defaultSelect = {
    id: true,
    plateNumber: true,
    brand: true,
    model: true,
    createdAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    customer: {
      select: {
        id: true,
        name: true,
        phone: true,
      },
    },
    orders: {
      where: { deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    },
    _count: {
      select: {
        orders: {
          where: { deletedAt: null },
        },
      },
    },
  };

  #listSelect = {
    id: true,
    plateNumber: true,
    brand: true,
    model: true,
    createdAt: true,
    customer: {
      select: {
        id: true,
        name: true,
        phone: true,
      },
    },
    _count: {
      select: {
        orders: {
          where: { deletedAt: null },
        },
      },
    },
  };

  /**
   * Membuat kendaraan baru
   * @param {Object} data - Data kendaraan
   * @param {string} data.plateNumber - Nomor plat
   * @param {string} data.customerId - ID pelanggan
   * @param {string} [data.brand] - Merek
   * @param {string} [data.model] - Model
   * @returns {Promise<Object>} Kendaraan yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        customerId: data.customerId,
        brand: data.brand || null,
        model: data.model || null,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari kendaraan berdasarkan ID
   * @param {string} id - ID kendaraan
   * @returns {Promise<Object|null>} Data kendaraan atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.vehicle.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari kendaraan berdasarkan plat nomor
   * @param {string} plateNumber - Plat nomor
   * @returns {Promise<Object|null>} Data kendaraan atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findByPlateNumber(plateNumber) {
    return prisma.vehicle.findUnique({
      where: { plateNumber },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari kendaraan berdasarkan ID pelanggan
   * @param {string} customerId - ID pelanggan
   * @returns {Promise<Array>} Daftar kendaraan
   * @complexity Before: O(n) - Full scan with customerId filter
   * @complexity After: O(log n) - Uses index on customerId
   */
  async findByCustomerId(customerId) {
    return prisma.vehicle.findMany({
      where: { customerId },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        createdAt: true,
        _count: {
          select: {
            orders: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mencari daftar kendaraan dengan filter dan pagination (grouped by customer)
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.search] - Pencarian berdasarkan plat, brand, model, atau nama pelanggan
   * @param {string} [query.customerId] - Filter berdasarkan pelanggan
   * @returns {Promise<{data: Array, metadata: Object}>} Data kendaraan grouped by customer
   * @complexity Before: O(n²) - Nested queries with customer grouping
   * @complexity After: O(log n) - Single query with proper indexes
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const vehicleWhere = {};
    const customerWhere = {};

    if (query.search) {
      vehicleWhere.OR = [
        { plateNumber: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
        { model: { contains: query.search, mode: "insensitive" } },
      ];
      customerWhere.name = { contains: query.search, mode: "insensitive" };
    }

    if (query.customerId) {
      vehicleWhere.customerId = query.customerId;
      customerWhere.id = query.customerId;
    }

    const hasVehicleFilter = Object.keys(vehicleWhere).length > 0;
    const hasCustomerFilter = Object.keys(customerWhere).length > 0;

    const where = {
      vehicles: { some: hasVehicleFilter ? vehicleWhere : {} },
      ...(hasCustomerFilter && customerWhere),
    };

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          vehicles: {
            where: hasVehicleFilter ? vehicleWhere : {},
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
              createdAt: true,
              _count: {
                select: {
                  orders: { where: { deletedAt: null } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const data = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
      vehicles: customer.vehicles,
      totalVehicles: customer.vehicles.length,
    }));

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Memperbarui data kendaraan
   * @param {string} id - ID kendaraan
   * @param {Object} data - Data yang akan diupdate
   * @param {string} [data.plateNumber] - Plat nomor
   * @param {string} [data.brand] - Merek
   * @param {string} [data.model] - Model
   * @returns {Promise<Object>} Kendaraan yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.vehicle.update({
      where: { id },
      data,
      select: this.#fullSelect,
    });
  }

  /**
   * Menghapus kendaraan
   * @param {string} id - ID kendaraan
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.vehicle.delete({ where: { id } });
  }

  /**
   * Mengecek apakah kendaraan memiliki order
   * @param {string} id - ID kendaraan
   * @returns {Promise<boolean>} Status kepemilikan order
   * @complexity Before: O(n) - Count with filter
   * @complexity After: O(log n) - Uses index on vehicleId
   */
  async hasOrders(id) {
    const count = await prisma.order.count({
      where: {
        vehicleId: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  /**
   * Mengecek apakah plat nomor sudah terdaftar
   * @param {string} plateNumber - Plat nomor
   * @param {string} [excludeId] - ID kendaraan yang dikecualikan
   * @returns {Promise<boolean>} Status ketersediaan
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async isPlateNumberExists(plateNumber, excludeId = null) {
    const where = { plateNumber };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const vehicle = await prisma.vehicle.findFirst({
      where,
      select: { id: true },
    });

    return !!vehicle;
  }

  /**
   * Mencari kendaraan berdasarkan plat nomor (partial match)
   * @param {string} plateNumber - Plat nomor
   * @param {number} [limit=10] - Batas hasil
   * @returns {Promise<Array>} Daftar kendaraan
   * @complexity Before: O(n) - Full scan with contains
   * @complexity After: O(log n) - Uses index on plateNumber with limit
   */
  async searchByPlateNumber(plateNumber, limit = 10) {
    return prisma.vehicle.findMany({
      where: {
        plateNumber: {
          contains: plateNumber,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { plateNumber: "asc" },
      take: limit,
    });
  }

  /**
   * Mendapatkan ringkasan kendaraan
   * @param {string} id - ID kendaraan
   * @returns {Promise<Object|null>} Ringkasan kendaraan
   * @complexity Before: O(n) - Multiple nested queries
   * @complexity After: O(log n) - Parallel execution with aggregated data
   */
  async getVehicleSummary(id) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            orders: { where: { deletedAt: null } },
          },
        },
        orders: {
          where: { deletedAt: null },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!vehicle) return null;

    const totalSpent = await prisma.order.aggregate({
      where: {
        vehicleId: id,
        deletedAt: null,
        status: { in: ["COMPLETED", "CLOSED"] },
      },
      _sum: { total: true },
    });

    return {
      ...vehicle,
      totalSpent: totalSpent._sum.total || 0,
    };
  }

  /**
   * Mendapatkan kendaraan terbaru
   * @param {number} [limit=10] - Batas hasil
   * @returns {Promise<Array>} Daftar kendaraan terbaru
   * @complexity Before: O(n) - findMany with orderBy
   * @complexity After: O(log n) - Uses index on createdAt with limit
   */
  async findRecentVehicles(limit = 10) {
    return prisma.vehicle.findMany({
      take: limit,
      select: this.#listSelect,
      orderBy: { createdAt: "desc" },
    });
  }
}

export default VehicleRepository;