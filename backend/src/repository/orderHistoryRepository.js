import prisma from "#app/database.js";

class OrderHistoryRepository {
  #orderHistorySelect = {
    id: true,
    orderNumber: true,
    status: true,
    subtotal: true,
    tax: true,
    total: true,
    diagnosedAt: true,
    startedAt: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    cashier: {
      select: { id: true, fullName: true },
    },
    customer: {
      select: { id: true, name: true, phone: true },
    },
    vehicle: {
      select: { id: true, plateNumber: true, brand: true, model: true },
    },
    payment: {
      select: {
        id: true,
        method: true,
        amountPaid: true,
        status: true,
        paidAt: true,
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
            type: true,
            image: {
              select: { path: true }
            }
          },
        },
        assignments: {
          select: {
            id: true,
            mechanicId: true,
            startAt: true,
            endAt: true,
            mechanic: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    },
    histories: {
      select: {
        id: true,
        status: true,
        createdAt: true,
        note: true,
        changedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    },
  };

  #historyListSelect = {
    id: true,
    status: true,
    note: true,
    createdAt: true,
    changedBy: {
      select: { id: true, fullName: true },
    },
    order: {
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
    },
  };

  /**
   * Mencari riwayat pesanan berdasarkan nomor pesanan
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<Object|null>} Data pesanan lengkap dengan riwayat
   */
  async findByOrderNumber(orderNumber) {
    return prisma.order.findFirst({
      where: { orderNumber, deletedAt: null },
      select: this.#orderHistorySelect,
    });
  }

  /**
   * Mencari riwayat pesanan berdasarkan ID pesanan
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object|null>} Data pesanan lengkap dengan riwayat
   */
  async findByOrderId(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      select: this.#orderHistorySelect,
    });
  }

  /**
   * Membuat record riwayat status baru
   * @param {Object} data - Data riwayat status
   * @param {string} data.orderId - ID pesanan
   * @param {string} data.status - Status baru
   * @param {string} data.changedById - ID user yang mengubah
   * @param {string} [data.note] - Catatan perubahan
   * @returns {Promise<Object>} Record riwayat yang dibuat
   */
  async createHistory(data) {
    return prisma.orderStatusHistory.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        changedById: data.changedById,
        note: data.note || null,
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
  }

  /**
   * Mendapatkan riwayat status berdasarkan ID pesanan
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Array>} Daftar riwayat status
   */
  async getHistoryByOrderId(orderId) {
    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      select: {
        id: true,
        status: true,
        note: true,
        createdAt: true,
        changedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Mendapatkan riwayat status dengan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.orderId] - Filter by order ID
   * @param {string} [query.status] - Filter by status
   * @param {string} [query.changedById] - Filter by user
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>} Data riwayat dan metadata
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.orderId) where.orderId = query.orderId;
    if (query.status) where.status = query.status;
    if (query.changedById) where.changedById = query.changedById;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, data] = await Promise.all([
      prisma.orderStatusHistory.count({ where }),
      prisma.orderStatusHistory.findMany({
        where,
        skip,
        take: limit,
        select: this.#historyListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: {
        total,
        page: query.page || 1,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mendapatkan statistik perubahan status
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Statistik perubahan status
   */
  async getStatusTransitionStats(orderId) {
    const stats = await prisma.orderStatusHistory.groupBy({
      by: ["status"],
      where: { orderId },
      _count: { status: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    const totalChanges = await prisma.orderStatusHistory.count({
      where: { orderId },
    });

    return {
      totalChanges,
      statusBreakdown: stats.map((item) => ({
        status: item.status,
        count: item._count.status,
        firstOccurrence: item._min.createdAt,
        lastOccurrence: item._max.createdAt,
      })),
    };
  }

  /**
   * Mendapatkan durasi setiap status untuk pesanan
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Array>} Durasi setiap status dalam detik
   */
  async getStatusDurations(orderId) {
    const query = `
      WITH status_timeline AS (
        SELECT 
          "status",
          "createdAt",
          LEAD("createdAt") OVER (ORDER BY "createdAt") as "nextCreatedAt"
        FROM "OrderStatusHistory"
        WHERE "orderId" = $1
        ORDER BY "createdAt" ASC
      )
      SELECT 
        "status",
        "createdAt" as "startTime",
        "nextCreatedAt" as "endTime",
        EXTRACT(EPOCH FROM ("nextCreatedAt" - "createdAt"))::int as "durationSeconds"
      FROM status_timeline
      WHERE "nextCreatedAt" IS NOT NULL
      ORDER BY "createdAt"
    `;

    return prisma.$queryRawUnsafe(query, orderId);
  }

  /**
   * Mendapatkan ringkasan timeline pesanan
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Ringkasan timeline
   */
  async getOrderTimeline(orderId) {
    const [order, histories, durations] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId, deletedAt: null },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          diagnosedAt: true,
          startedAt: true,
          completedAt: true,
          closedAt: true,
          createdAt: true,
          customer: { select: { name: true } },
          vehicle: { select: { plateNumber: true } },
        },
      }),
      prisma.orderStatusHistory.findMany({
        where: { orderId },
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
          changedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.getStatusDurations(orderId),
    ]);

    if (!order) return null;

    const totalDurationSeconds = durations.reduce((sum, d) => sum + d.durationSeconds, 0);

    return {
      order,
      histories,
      durations,
      totalDurationSeconds,
    };
  }
}

export default OrderHistoryRepository;