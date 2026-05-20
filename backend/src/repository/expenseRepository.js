import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class ExpenseRepository {
  #defaultSelect = {
    id: true,
    title: true,
    description: true,
    amount: true,
    category: true,
    date: true,
    createdAt: true,
    updatedAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    shift: {
      select: {
        id: true,
        status: true,
        openedAt: true,
        closedAt: true,
        cashier: {
          select: {
            id: true,
            fullName: true,
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
    receipt: {
      select: {
        id: true,
        fileName: true,
        path: true,
      },
    },
  };

  #listSelect = {
    id: true,
    title: true,
    amount: true,
    category: true,
    date: true,
    createdAt: true,
    shift: {
      select: {
        id: true,
        openedAt: true,
        closedAt: true,
      },
    },
    recordedBy: {
      select: {
        id: true,
        fullName: true,
      },
    },
    receipt: {
      select: {
        id: true,
        path: true,
      },
    },
  };

  /**
   * Membuat pengeluaran baru
   * @param {Object} data - Data pengeluaran
   * @param {string} data.title - Judul pengeluaran
   * @param {string} [data.description] - Deskripsi pengeluaran
   * @param {number} data.amount - Jumlah pengeluaran
   * @param {string} data.recordedById - ID user yang mencatat
   * @param {string} [data.category] - Kategori pengeluaran
   * @param {string|Date} [data.date] - Tanggal pengeluaran
   * @param {string} [data.shiftId] - ID shift terkait
   * @param {string} [data.receiptId] - ID file bukti pengeluaran
   * @returns {Promise<Object>} Data pengeluaran yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.expense.create({
      data: {
        title: data.title,
        description: data.description,
        amount: data.amount,
        category: data.category || "OTHER",
        date: data.date || new Date(),
        shiftId: data.shiftId,
        recordedById: data.recordedById,
        receiptId: data.receiptId,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari pengeluaran berdasarkan ID
   * @param {string} id - ID pengeluaran
   * @returns {Promise<Object|null>} Data pengeluaran lengkap atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.expense.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari daftar pengeluaran dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @param {string} [query.category] - Filter berdasarkan kategori
   * @param {string} [query.shiftId] - Filter berdasarkan ID shift
   * @param {string} [query.recordedById] - Filter berdasarkan ID user pencatat
   * @param {string} [query.search] - Pencarian berdasarkan judul
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>} Data pengeluaran dan metadata pagination
   * @complexity Before: O(n) - Offset pagination with multiple filter conditions
   * @complexity After: O(log n) - Uses indexes on date, category, shiftId, and recordedById
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.category) where.category = query.category;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.recordedById) where.recordedById = query.recordedById;
    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [total, data] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mengupdate data pengeluaran
   * @param {string} id - ID pengeluaran
   * @param {Object} data - Data yang akan diupdate
   * @param {string} [data.title] - Judul pengeluaran
   * @param {string} [data.description] - Deskripsi
   * @param {number} [data.amount] - Jumlah
   * @param {string} [data.category] - Kategori
   * @param {string|Date} [data.date] - Tanggal
   * @param {string} [data.receiptId] - ID bukti
   * @returns {Promise<Object>} Data pengeluaran yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.expense.update({
      where: { id },
      data,
      select: this.#defaultSelect,
    });
  }

  /**
   * Menghapus pengeluaran berdasarkan ID
   * @param {string} id - ID pengeluaran
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * Mendapatkan total pengeluaran dengan filter
   * @param {Object} [query={}] - Parameter query
   * @param {string} [query.category] - Filter kategori
   * @param {string} [query.shiftId] - Filter shift
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<number>} Total pengeluaran
   * @complexity Before: O(n) - Aggregation scan
   * @complexity After: O(log n) - Uses indexes with filtered aggregation
   */
  async getTotalExpenses(query = {}) {
    const where = {};

    if (query.category) where.category = query.category;
    if (query.shiftId) where.shiftId = query.shiftId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const aggregation = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return aggregation._sum.amount || 0;
  }

  /**
   * Mendapatkan ringkasan pengeluaran berdasarkan kategori
   * @param {Object} [query={}] - Parameter query
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Array>} Ringkasan pengeluaran per kategori
   * @complexity Before: O(n) - GROUP BY scan
   * @complexity After: O(log n) - Uses index on category with date filter
   */
  async getExpensesByCategory(query = {}) {
    const where = {};

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const expenses = await prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    return expenses.map((item) => ({
      category: item.category,
      totalAmount: item._sum.amount || 0,
      count: item._count.id,
    }));
  }

  /**
   * Mendapatkan pengeluaran untuk shift tertentu
   * @param {string} shiftId - ID shift
   * @returns {Promise<Array>} Daftar pengeluaran
   * @complexity Before: O(n) - Full scan with shiftId filter
   * @complexity After: O(log n) - Uses index on shiftId
   */
  async findByShiftId(shiftId) {
    return prisma.expense.findMany({
      where: { shiftId },
      select: this.#listSelect,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Mendapatkan pengeluaran harian
   * @param {Object} [query={}] - Parameter query
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<Array>} Ringkasan pengeluaran harian
   * @complexity Before: O(n) - Fetch all then group in memory
   * @complexity After: O(log n) - Database-level aggregation with GROUP BY date
   */
  async getDailyExpenses(query = {}) {
    const whereConditions = [];
    const params = [];

    if (query.startDate) {
      params.push(new Date(query.startDate));
      whereConditions.push(`"date" >= $${params.length}`);
    }

    if (query.endDate) {
      params.push(new Date(query.endDate));
      whereConditions.push(`"date" <= $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const rawQuery = `
      SELECT 
        DATE("date") as date,
        SUM("amount")::int as "totalAmount",
        COUNT("id")::int as "count"
      FROM "Expense"
      ${whereClause}
      GROUP BY DATE("date")
      ORDER BY DATE("date") DESC
    `;

    return prisma.$queryRawUnsafe(rawQuery, ...params);
  }
}

export default ExpenseRepository;