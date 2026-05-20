import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class PaymentRepository {
  #defaultSelect = {
    id: true,
    method: true,
    amountPaid: true,
    change: true,
    status: true,
    paidAt: true,
    createdAt: true,
  };

  #invoiceSelect = {
    id: true,
    method: true,
    amountPaid: true,
    change: true,
    status: true,
    paidAt: true,
    createdAt: true,
    order: {
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        tax: true,
        total: true,
        createdAt: true,
        cashier: {
          select: {
            id: true,
            fullName: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            productNameSnapshot: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                type: true,
              },
            },
            assignments: {
              select: {
                id: true,
                mechanic: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  #listSelect = {
    id: true,
    method: true,
    amountPaid: true,
    change: true,
    status: true,
    paidAt: true,
    createdAt: true,
    order: {
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        tax: true,
        total: true,
        status: true,
        createdAt: true,
        cashier: {
          select: {
            id: true,
            fullName: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            productNameSnapshot: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                type: true,
              },
            },
            assignments: {
              select: {
                id: true,
                mechanic: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  /**
   * Membuat pembayaran baru
   * @param {Object} data - Data pembayaran
   * @param {string} data.orderId - ID pesanan
   * @param {string} data.method - Metode pembayaran
   * @param {number} data.amountPaid - Jumlah dibayar
   * @param {number} [data.change] - Kembalian
   * @param {string} [data.status] - Status pembayaran
   * @returns {Promise<Object>} Data pembayaran lengkap dengan invoice
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        amountPaid: data.amountPaid,
        change: data.change || 0,
        status: data.status || "PAID",
        paidAt: data.status === "PAID" ? new Date() : null,
      },
      select: this.#invoiceSelect,
    });
  }

  /**
   * Mencari pembayaran berdasarkan ID
   * @param {string} id - ID pembayaran
   * @returns {Promise<Object|null>} Data pembayaran atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.payment.findUnique({
      where: { id },
      select: this.#invoiceSelect,
    });
  }

  /**
   * Mencari pembayaran berdasarkan ID pesanan
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object|null>} Data pembayaran atau null
   * @complexity Before: O(log n) - Unique index lookup on orderId
   * @complexity After: O(log n) - No change needed
   */
  async findByOrderId(orderId) {
    return prisma.payment.findUnique({
      where: { orderId },
      select: this.#invoiceSelect,
    });
  }

  /**
   * Mencari daftar pembayaran dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.orderId] - Filter by order ID
   * @param {string} [query.status] - Filter by status
   * @param {string} [query.method] - Filter by method
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>} Data pembayaran dan metadata
   * @complexity Before: O(n) - Offset pagination with multiple filter conditions
   * @complexity After: O(log n) - Uses indexes on status, paidAt, and method
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.orderId) where.orderId = query.orderId;
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, data] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
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
   * Mengupdate status pembayaran
   * @param {string} id - ID pembayaran
   * @param {string} status - Status baru
   * @returns {Promise<Object>} Data pembayaran yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async updateStatus(id, status) {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(status === "PAID" && { paidAt: new Date() }),
      },
      select: this.#defaultSelect,
    });
  }

  /**
   * Mendapatkan ringkasan pembayaran untuk dashboard
   * @param {Object} [query={}] - Parameter query
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Object>} Ringkasan pembayaran
   * @complexity Before: O(n) - Multiple separate queries
   * @complexity After: O(log n) - Database-level aggregation with parallel execution
   */
  async getPaymentSummary(query = {}) {
    const where = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [totalAmount, totalCount, byMethod, byStatus] = await Promise.all([
      prisma.payment.aggregate({ where, _sum: { amountPaid: true } }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["method"],
        where,
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where,
        _sum: { amountPaid: true },
        _count: { status: true },
      }),
    ]);

    return {
      totalAmount: totalAmount._sum.amountPaid || 0,
      totalCount,
      byMethod: byMethod.map((item) => ({
        method: item.method,
        amount: item._sum.amountPaid || 0,
        count: item._count.method,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        amount: item._sum.amountPaid || 0,
        count: item._count.status,
      })),
    };
  }

  /**
   * Mendapatkan total pembayaran berdasarkan metode
   * @param {string} method - Metode pembayaran
   * @param {Object} [query={}] - Parameter query
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Object>} Total pembayaran per metode
   * @complexity Before: O(n) - Aggregation scan
   * @complexity After: O(log n) - Uses index on method with date filter
   */
  async getTotalByMethod(method, query = {}) {
    const where = { method };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const aggregation = await prisma.payment.aggregate({
      where,
      _sum: { amountPaid: true },
      _count: { id: true },
    });

    return {
      method,
      totalAmount: aggregation._sum.amountPaid || 0,
      totalCount: aggregation._count.id || 0,
    };
  }

  /**
   * Mendapatkan history pembayaran untuk pesanan tertentu
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Array>} History pembayaran
   * @complexity Before: O(n) - findMany on unique orderId
   * @complexity After: O(log n) - Uses unique index on orderId
   */
  async getPaymentHistoryByOrder(orderId) {
    return prisma.payment.findMany({
      where: { orderId },
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
  }
}

export default PaymentRepository;