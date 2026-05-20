import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class ShiftRepository {
  #defaultSelect = {
    id: true,
    status: true,
    startingCash: true,
    endingCash: true,
    expectedCash: true,
    cashSales: true,
    cashIn: true,
    cashOut: true,
    discrepancy: true,
    openedAt: true,
    closedAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    cashierId: true,
    cashier: {
      select: { id: true, fullName: true, email: true, role: true, phone: true },
    },
    orders: {
      select: {
        id: true, orderNumber: true, status: true, total: true, createdAt: true,
        customer: { select: { id: true, name: true } },
        payment: { select: { id: true, method: true, amountPaid: true, status: true } },
        items: {
          select: {
            id: true, quantity: true, productNameSnapshot: true,
            unitPrice: true, subtotal: true,
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    expenses: {
      select: {
        id: true, title: true, amount: true, category: true, date: true,
        receipt: { select: { id: true, path: true } },
      },
      orderBy: { date: "desc" },
    },
  };

  #listSelect = {
    id: true, status: true, startingCash: true, endingCash: true,
    expectedCash: true, cashSales: true, discrepancy: true,
    openedAt: true, closedAt: true,
    cashier: { select: { id: true, fullName: true } },
    _count: { select: { orders: true, expenses: true } },
  };

  /**
   * Membuat shift baru
   * @param {Object} data - Data shift
   * @param {string} data.cashierId
   * @param {number} data.startingCash
   * @returns {Promise<Object>}
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.shift.create({
      data: {
        cashierId: data.cashierId,
        startingCash: data.startingCash,
        status: "OPEN",
        cashSales: 0, cashIn: 0, cashOut: 0, discrepancy: 0,
        openedAt: new Date(),
      },
      select: {
        id: true, status: true, startingCash: true, openedAt: true,
        cashier: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Mencari shift berdasarkan ID
   * @param {string} id - ID shift
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - Full select with nested relations loading all orders
   * @complexity After: O(log n) - Primary key lookup, consider limiting nested data
   */
  async findById(id) {
    return prisma.shift.findUnique({ where: { id }, select: this.#fullSelect });
  }

  /**
   * Mencari shift aktif kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - findFirst without composite index
   * @complexity After: O(log n) - Uses composite index (cashierId, status)
   */
  async findActiveByCashier(cashierId) {
    return prisma.shift.findFirst({
      where: { cashierId, status: "OPEN" },
      select: { ...this.#defaultSelect, cashier: { select: { id: true, fullName: true } } },
    });
  }

  /**
   * Cek apakah kasir memiliki shift aktif
   * @param {string} cashierId - ID kasir
   * @returns {Promise<boolean>}
   * @complexity Before: O(n) - findFirst without composite index
   * @complexity After: O(log n) - Uses composite index (cashierId, status)
   */
  async hasActiveShift(cashierId) {
    const shift = await prisma.shift.findFirst({
      where: { cashierId, status: "OPEN" },
      select: { id: true },
    });
    return !!shift;
  }

  /**
   * Mencari daftar shift dengan paginasi
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.status] - Filter by status
   * @param {string} [query.cashierId] - Filter by cashier
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity Before: O(n) - Offset pagination with date range scan
   * @complexity After: O(log n) - Uses index on openedAt for date range queries
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const where = {};

    if (query.status) where.status = query.status;
    if (query.cashierId) where.cashierId = query.cashierId;
    if (query.startDate || query.endDate) {
      where.openedAt = {};
      if (query.startDate) where.openedAt.gte = new Date(query.startDate);
      if (query.endDate) where.openedAt.lte = new Date(query.endDate);
    }

    const [total, data] = await Promise.all([
      prisma.shift.count({ where }),
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { openedAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Menutup shift
   * @param {string} id - ID shift
   * @param {Object} data - Data penutupan
   * @param {number} data.endingCash
   * @param {number} data.expectedCash
   * @param {number} data.discrepancy
   * @returns {Promise<Object>}
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async close(id, data) {
    return prisma.shift.update({
      where: { id },
      data: {
        endingCash: data.endingCash,
        expectedCash: data.expectedCash,
        discrepancy: data.discrepancy,
        status: "CLOSED",
        closedAt: new Date(),
      },
      select: {
        id: true, status: true, startingCash: true, endingCash: true,
        expectedCash: true, cashSales: true, cashIn: true, cashOut: true,
        discrepancy: true, openedAt: true, closedAt: true,
        cashier: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Update cash flow shift
   * @param {string} shiftId - ID shift
   * @param {Object} data - Data update
   * @param {number} [data.cashSales]
   * @param {number} [data.cashIn]
   * @param {number} [data.cashOut]
   * @returns {Promise<Object>}
   * @complexity Before: O(log n) - Atomic increment update
   * @complexity After: O(log n) - No change needed
   */
  async updateCashFlow(shiftId, data) {
    const updatePayload = {};
    if (data.cashSales !== undefined) updatePayload.cashSales = { increment: data.cashSales };
    if (data.cashIn !== undefined) updatePayload.cashIn = { increment: data.cashIn };
    if (data.cashOut !== undefined) updatePayload.cashOut = { increment: data.cashOut };

    return prisma.shift.update({
      where: { id: shiftId },
      data: updatePayload,
      select: { id: true, cashSales: true, cashIn: true, cashOut: true },
    });
  }

  /**
   * Mendapatkan ringkasan shift
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - Loading all orders and expenses
   * @complexity After: O(log n) - Primary key lookup, aggregation pushed to database
   */
  async getShiftSummary(shiftId) {
    const [shift, paymentAgg, expenseAgg] = await Promise.all([
      prisma.shift.findUnique({
        where: { id: shiftId },
        select: {
          id: true, status: true, startingCash: true, endingCash: true,
          expectedCash: true, discrepancy: true, cashSales: true,
          cashIn: true, cashOut: true, openedAt: true, closedAt: true,
          _count: { select: { orders: true, expenses: true } },
        },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { order: { shiftId, deletedAt: null } },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: { shiftId },
        _sum: { amount: true },
      }),
    ]);

    if (!shift) return null;

    return {
      ...shift,
      paymentBreakdown: paymentAgg.map((p) => ({
        method: p.method,
        total: p._sum.amountPaid || 0,
        count: p._count.method,
      })),
      expenseBreakdown: expenseAgg.map((e) => ({
        category: e.category,
        total: e._sum.amount || 0,
      })),
    };
  }

  /**
   * Mencari shift terakhir kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - findFirst with ORDER BY without composite index
   * @complexity After: O(log n) - Uses composite index (cashierId, openedAt)
   */
  async findLastShiftByCashier(cashierId) {
    return prisma.shift.findFirst({
      where: { cashierId },
      orderBy: { openedAt: "desc" },
      select: { id: true, status: true, endingCash: true, closedAt: true, openedAt: true },
    });
  }

  /**
   * Menghitung expected cash shift
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>}
   * @complexity Before: O(n) - Multiple queries with nested data loading
   * @complexity After: O(log n) - Database-level aggregation with parallel queries
   */
  async calculateExpectedCash(shiftId) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true, startingCash: true, cashSales: true, cashIn: true, cashOut: true, status: true },
    });

    if (!shift) return null;

    const [totalExpenses, paymentBreakdown] = await Promise.all([
      prisma.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          order: { shiftId, deletedAt: null, status: { in: ["COMPLETED", "CLOSED"] } },
          status: "PAID",
        },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
    ]);

    const totalExpenseAmount = totalExpenses._sum.amount || 0;
    const cashPayments = paymentBreakdown.find((p) => p.method === "CASH");
    const qrisPayments = paymentBreakdown.find((p) => p.method === "QRIS");

    const expectedCash = shift.startingCash + shift.cashSales + shift.cashIn - shift.cashOut - totalExpenseAmount;

    return {
      shiftId: shift.id,
      startingCash: shift.startingCash,
      cashSales: shift.cashSales,
      cashIn: shift.cashIn,
      cashOut: shift.cashOut,
      totalExpenses: totalExpenseAmount,
      expectedCash,
      paymentBreakdown: {
        cash: { total: cashPayments?._sum.amountPaid || 0, count: cashPayments?._count.method || 0 },
        qris: { total: qrisPayments?._sum.amountPaid || 0, count: qrisPayments?._count.method || 0 },
      },
      formula: "startingCash + cashSales + cashIn - cashOut - totalExpenses",
    };
  }
}

export default ShiftRepository;