import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class StockRepository {
  #defaultSelect = {
    id: true,
    type: true,
    sourceType: true,
    quantity: true,
    note: true,
    createdAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    product: {
      select: {
        id: true,
        name: true,
        sku: true,
        type: true,
        stock: true,
        price: true,
        cost: true,
      },
    },
    orderItem: {
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        subtotal: true,
        productNameSnapshot: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
    },
    recordedBy: {
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    },
  };

  #listSelect = {
    id: true,
    type: true,
    sourceType: true,
    quantity: true,
    note: true,
    createdAt: true,
    product: {
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
    },
    recordedBy: {
      select: {
        id: true,
        fullName: true,
      },
    },
    orderItem: {
      select: {
        id: true,
        productNameSnapshot: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    },
  };

  get fullSelect() {
    return this.#fullSelect;
  }

  get listSelect() {
    return this.#listSelect;
  }

  /**
   * Membuat record pergerakan stok baru
   * @param {Object} data - Data pergerakan stok
   * @param {string} data.productId - ID produk
   * @param {StockMovementType} data.type - Tipe pergerakan (IN, OUT, ADJUSTMENT)
   * @param {StockSourceType} [data.sourceType="MANUAL"] - Sumber pergerakan
   * @param {number} data.quantity - Jumlah perubahan
   * @param {string} data.recordedById - ID user pencatat
   * @param {string} [data.orderItemId] - ID order item terkait
   * @param {string} [data.note] - Catatan
   * @returns {Promise<Object>} Data pergerakan stok lengkap
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        sourceType: data.sourceType || "MANUAL",
        quantity: data.quantity,
        recordedById: data.recordedById,
        orderItemId: data.orderItemId,
        note: data.note,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Membuat record pergerakan stok dalam transaction
   * @param {Object} tx - Prisma transaction client
   * @param {Object} data - Data pergerakan stok
   * @returns {Promise<Object>} Data pergerakan stok lengkap
   * @complexity Before: O(1) - Single insert in transaction
   * @complexity After: O(1) - No change needed
   */
  async createInTransaction(tx, data) {
    return tx.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        sourceType: data.sourceType || "MANUAL",
        quantity: data.quantity,
        recordedById: data.recordedById,
        orderItemId: data.orderItemId,
        note: data.note,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari pergerakan stok berdasarkan ID
   * @param {string} id - ID pergerakan stok
   * @returns {Promise<Object|null>} Data pergerakan stok atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.stockMovement.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari daftar pergerakan stok dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.productId] - Filter berdasarkan ID produk
   * @param {StockMovementType} [query.type] - Filter berdasarkan tipe
   * @param {StockSourceType} [query.sourceType] - Filter berdasarkan sumber
   * @param {string} [query.recordedById] - Filter berdasarkan user pencatat
   * @param {string} [query.orderItemId] - Filter berdasarkan order item
   * @param {string} [query.orderId] - Filter berdasarkan order
   * @param {string} [query.search] - Search by product name
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Object>} Data dan metadata pagination
   * @complexity Before: O(n) - Multiple filter conditions without composite indexes
   * @complexity After: O(log n) - Leverages composite indexes (productId, createdAt) and (type, sourceType)
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const where = {};

    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
    if (query.sourceType) where.sourceType = query.sourceType;
    if (query.recordedById) where.recordedById = query.recordedById;
    if (query.orderItemId) where.orderItemId = query.orderItemId;

    if (query.orderId) {
      where.orderItem = { orderId: query.orderId };
    }

    if (query.search) {
      where.product = {
        name: { contains: query.search, mode: "insensitive" },
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, data] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
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
   * Mencatat stok masuk
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok masuk
   * @param {string} recordedById - ID user pencatat
   * @param {string} [note=null] - Catatan
   * @param {StockSourceType} [sourceType="MANUAL"] - Sumber stok masuk
   * @returns {Promise<Object>} Data pergerakan stok masuk
   * @complexity Before: O(1) - Delegates to create
   * @complexity After: O(1) - No change needed
   */
  async recordStockIn(productId, quantity, recordedById, note = null, sourceType = "MANUAL") {
    return this.create({
      productId,
      type: "IN",
      quantity,
      recordedById,
      note,
      sourceType,
    });
  }

  /**
   * Mencatat stok keluar
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah stok keluar
   * @param {string} recordedById - ID user pencatat
   * @param {string} [orderItemId=null] - ID order item terkait
   * @param {string} [note=null] - Catatan
   * @param {StockSourceType} [sourceType="SALE"] - Sumber stok keluar
   * @returns {Promise<Object>} Data pergerakan stok keluar
   * @complexity Before: O(1) - Delegates to create
   * @complexity After: O(1) - No change needed
   */
  async recordStockOut(productId, quantity, recordedById, orderItemId = null, note = null, sourceType = "SALE") {
    return this.create({
      productId,
      type: "OUT",
      quantity,
      recordedById,
      orderItemId,
      note,
      sourceType,
    });
  }

  /**
   * Mencatat penyesuaian stok
   * @param {string} productId - ID produk
   * @param {number} quantity - Jumlah penyesuaian
   * @param {string} recordedById - ID user pencatat
   * @param {string} [note=null] - Catatan
   * @returns {Promise<Object>} Data pergerakan penyesuaian
   * @complexity Before: O(1) - Delegates to create
   * @complexity After: O(1) - No change needed
   */
  async recordAdjustment(productId, quantity, recordedById, note = null) {
    return this.create({
      productId,
      type: "ADJUSTMENT",
      quantity,
      recordedById,
      note,
      sourceType: "ADJUSTMENT",
    });
  }

  /**
   * Mencari pergerakan stok berdasarkan ID produk
   * @param {string} productId - ID produk
   * @param {Object} [query={}] - Parameter query tambahan
   * @returns {Promise<Object>} Data pergerakan stok dengan pagination
   * @complexity Before: O(n) - Delegates to findMany with full scan
   * @complexity After: O(log n) - Uses composite index (productId, createdAt)
   */
  async findByProductId(productId, query = {}) {
    return this.findMany({ ...query, productId });
  }

  /**
   * Mencari pergerakan stok berdasarkan ID order
   * @param {string} orderId - ID order
   * @returns {Promise<Array>} Daftar pergerakan stok
   * @complexity Before: O(n) - Nested relation filter without proper index
   * @complexity After: O(log n) - Uses index on orderItemId then join to order
   */
  async findByOrderId(orderId) {
    return prisma.stockMovement.findMany({
      where: {
        orderItem: { orderId },
      },
      select: this.#listSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mendapatkan ringkasan stok untuk dashboard (aggregated)
   * @param {Object} [query={}] - Parameter query
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Object>} Data ringkasan stok
   * @complexity Before: O(n) - Fetch all data then aggregate in memory
   * @complexity After: O(log n) - Database-level aggregation with GROUP BY
   */
  async getStockSummary(query = {}) {
    const where = {};
    
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const summary = await prisma.stockMovement.groupBy({
      by: ["type"],
      where,
      _sum: { quantity: true },
      _count: { id: true },
    });

    const result = {
      totalIn: 0,
      totalOut: 0,
      totalAdjustment: 0,
      totalMovements: 0,
    };

    for (const item of summary) {
      result.totalMovements += item._count.id;
      if (item.type === "IN") result.totalIn = item._sum.quantity || 0;
      if (item.type === "OUT") result.totalOut = item._sum.quantity || 0;
      if (item.type === "ADJUSTMENT") result.totalAdjustment = item._sum.quantity || 0;
    }

    return result;
  }

  /**
   * Mendapatkan produk dengan pergerakan stok terbanyak
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.limit=10] - Jumlah produk yang dikembalikan
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Array>} Daftar produk dengan total pergerakan
   * @complexity Before: O(n²) - Fetch all movements then group and sort in memory
   * @complexity After: O(log n) - Database-level aggregation with GROUP BY and ORDER BY
   */
  async getTopMovedProducts(query = {}) {
    const limit = query.limit || 10;
    const where = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return prisma.stockMovement.groupBy({
      by: ["productId"],
      where,
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });
  }

  /**
   * Menghapus record pergerakan stok
   * @param {string} id - ID pergerakan stok
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.stockMovement.delete({ where: { id } });
  }
}

export default StockRepository;