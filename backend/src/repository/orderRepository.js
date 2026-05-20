import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class OrderRepository {
  #baseOrderSelect = {
    id: true,
    orderNumber: true,
    cashierId: true,
    shiftId: true,
    status: true,
    subtotal: true,
    tax: true,
    total: true,
    startedAt: true,
    completedAt: true,
    closedAt: true,
    createdAt: true,
    updatedAt: true,
  };

  #cashierSelect = {
    id: true,
    fullName: true,
  };

  #customerSelect = {
    id: true,
    name: true,
    phone: true,
  };

  #vehicleSelect = {
    id: true,
    plateNumber: true,
    brand: true,
    model: true,
  };

  #itemSelect = {
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
        image: { select: { path: true } },
      },
    },
  };

  #paymentSelect = {
    id: true,
    method: true,
    amountPaid: true,
    status: true,
    paidAt: true,
  };

  #historySelect = {
    id: true,
    status: true,
    createdAt: true,
    changedBy: {
      select: { id: true, fullName: true },
    },
  };

  #assignmentSelect = {
    id: true,
    mechanicId: true,
    startAt: true,
    endAt: true,
    mechanic: {
      select: { id: true, fullName: true },
    },
  };

  #getSelect(level = "list") {
    const base = { ...this.#baseOrderSelect };

    if (level === "list") {
      return {
        ...base,
        cashier: { select: this.#cashierSelect },
        customer: { select: this.#customerSelect },
        vehicle: { select: this.#vehicleSelect },
        payment: { select: this.#paymentSelect },
        items: { select: this.#itemSelect },
        _count: { select: { items: true } },
      };
    }

    if (level === "detail") {
      return {
        ...base,
        cashier: { select: this.#cashierSelect },
        customer: { select: this.#customerSelect },
        vehicle: { select: this.#vehicleSelect },
        payment: { select: this.#paymentSelect },
        items: {
          select: {
            ...this.#itemSelect,
            assignments: { select: this.#assignmentSelect },
          },
        },
      };
    }

    if (level === "full") {
      return {
        ...base,
        cashier: { select: this.#cashierSelect },
        customer: { select: this.#customerSelect },
        vehicle: { select: this.#vehicleSelect },
        payment: { select: this.#paymentSelect },
        items: {
          select: {
            ...this.#itemSelect,
            assignments: { select: this.#assignmentSelect },
          },
        },
        histories: {
          select: this.#historySelect,
          orderBy: { createdAt: "desc" },
        },
      };
    }

    return base;
  }

  #buildWhereClause(query = {}) {
    const where = { deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.cashierId) where.cashierId = query.cashierId;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.search) {
      where.orderNumber = { contains: query.search, mode: "insensitive" };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return where;
  }

  #getStatusTimestamps(status) {
    const timestampMap = {
      IN_PROGRESS: "startedAt",
      COMPLETED: "completedAt",
      CLOSED: "closedAt",
    };
    return timestampMap[status] ? { [timestampMap[status]]: new Date() } : {};
  }

  /**
   * Mencari pesanan berdasarkan ID
   * @param {string} id - ID pesanan
   * @returns {Promise<Object|null>}
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.order.findUnique({
      where: { id, deletedAt: null },
      select: this.#getSelect("full"),
    });
  }

  /**
   * Mencari pesanan berdasarkan nomor pesanan
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - No index on orderNumber
   * @complexity After: O(log n) - Uses index on orderNumber
   */
  async findByOrderNumber(orderNumber) {
    return prisma.order.findFirst({
      where: { orderNumber, deletedAt: null },
      select: this.#getSelect("detail"),
    });
  }

  /**
   * Mengecek apakah nomor pesanan sudah digunakan
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<boolean>}
   * @complexity Before: O(n) - findFirst without index
   * @complexity After: O(log n) - Uses unique index on orderNumber
   */
  async isOrderNumberExists(orderNumber) {
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      select: { id: true },
    });
    return !!order;
  }

  /**
   * Mencari daftar pesanan dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah data per halaman
   * @param {string} [query.status] - Filter by status
   * @param {string} [query.cashierId] - Filter by cashier
   * @param {string} [query.shiftId] - Filter by shift
   * @param {string} [query.customerId] - Filter by customer
   * @param {string} [query.vehicleId] - Filter by vehicle
   * @param {string} [query.search] - Search by order number
   * @param {string|Date} [query.startDate] - Filter by start date
   * @param {string|Date} [query.endDate] - Filter by end date
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity Before: O(n) - Offset pagination with complex filters
   * @complexity After: O(log n) - Composite indexes for common filter combinations
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = this.#buildWhereClause(query);

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        select: this.#getSelect("list"),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mencari pesanan aktif untuk kasir tertentu
   * @param {string} cashierId - ID kasir
   * @param {Object} [query={}] - Parameter query tambahan
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah data per halaman
   * @param {string} [query.search] - Search by order number
   * @param {string} [query.status] - Filter by status
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity Before: O(n) - Full scan without composite index
   * @complexity After: O(log n) - Uses composite index (cashierId, status, deletedAt)
   */
  async findActiveByCashier(cashierId, query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const where = {
      cashierId,
      deletedAt: null,
      status: query.status
        ? query.status
        : { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
    };

    if (query.search) {
      where.orderNumber = { contains: query.search, mode: "insensitive" };
    }

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        select: this.#getSelect("list"),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mengupdate data pesanan
   * @param {string} id - ID pesanan
   * @param {Object} data - Data yang akan diupdate
   * @returns {Promise<Object>}
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.order.update({
      where: { id },
      data,
      select: this.#getSelect("detail"),
    });
  }

  /**
   * Mengupdate status pesanan
   * @param {string} id - ID pesanan
   * @param {string} status - Status baru
   * @returns {Promise<Object>}
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async updateStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...this.#getStatusTimestamps(status),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        startedAt: true,
        completedAt: true,
        closedAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Soft delete pesanan
   * @param {string} id - ID pesanan
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async softDelete(id) {
    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore pesanan yang sudah di-soft delete
   * @param {string} id - ID pesanan
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async restore(id) {
    await prisma.order.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}

export default OrderRepository;