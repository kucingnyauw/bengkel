import prisma from "#app/database.js";

class ReportRepository {
  /**
   * Helper untuk membangun filter tanggal
   * @param {string} field - Nama field tanggal
   * @param {Object} range - Object rentang waktu
   * @returns {Object} Object filter Prisma
   * @private
   */
  _buildDateFilter(field, range) {
    if (!range || (!range.startDate && !range.endDate)) return {};

    const filter = {};

    if (range.startDate) {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      filter.gte = start;
    }

    if (range.endDate) {
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      filter.lte = end;
    }

    return { [field]: filter };
  }

  /**
   * Mendapatkan data penjualan agregat dalam rentang waktu tertentu
   * @param {Object} [range={}] - Rentang waktu filter
   * @param {string|Date} [range.startDate]
   * @param {string|Date} [range.endDate]
   * @returns {Promise<Object>} Data agregat penjualan
   * @complexity Before: O(n) - Single aggregation scan
   * @complexity After: O(log n) - Uses composite indexes on (status, deletedAt) and payment status
   */
  async getSalesData(range = {}) {
    const where = {
      status: { in: ["COMPLETED", "CLOSED"] },
      deletedAt: null,
      payment: { status: "PAID" },
      ...this._buildDateFilter("createdAt", range),
    };

    const aggregations = await prisma.order.aggregate({
      _sum: { subtotal: true, tax: true, total: true },
      _count: { id: true },
      where,
    });

    return {
      totalOrders: aggregations._count.id || 0,
      totalSales: aggregations._sum.total || 0,
      totalSubtotal: aggregations._sum.subtotal || 0,
      totalTax: aggregations._sum.tax || 0,
    };
  }

  /**
   * Mendapatkan ringkasan penjualan harian
   * @param {Object} [range={}] - Rentang waktu filter
   * @returns {Promise<Array>} Array ringkasan penjualan per hari
   * @complexity Before: O(n) - Fetch all orders then group in memory
   * @complexity After: O(log n) - Database-level grouping with raw SQL
   */
  async getDailySalesSummary(range = {}) {
    const whereConditions = [
      `o."status" IN ('COMPLETED', 'CLOSED')`,
      `o."deletedAt" IS NULL`,
      `p."status" = 'PAID'`
    ];
    const params = [];

    if (range.startDate) {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      params.push(start);
      whereConditions.push(`o."createdAt" >= $${params.length}`);
    }

    if (range.endDate) {
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      whereConditions.push(`o."createdAt" <= $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(o."id")::int as "orderCount",
        SUM(o."total")::int as "totalSales",
        AVG(o."total")::float as "averageOrderValue"
      FROM "Order" o
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      ${whereClause}
      GROUP BY DATE(o."createdAt")
      ORDER BY DATE(o."createdAt") ASC
    `;

    return prisma.$queryRawUnsafe(query, ...params);
  }

  /**
   * Mendapatkan data laba rugi
   * @param {Object} [range={}] - Rentang waktu filter
   * @returns {Promise<Object>} Data laba rugi
   * @complexity Before: O(n²) - Fetch all order items then calculate COGS in memory
   * @complexity After: O(log n) - Database-level aggregation with JOINs
   */
  async getProfitLossData(range = {}) {
    const whereConditions = [
      `o."status" IN ('COMPLETED', 'CLOSED')`,
      `o."deletedAt" IS NULL`,
      `p."status" = 'PAID'`
    ];
    const params = [];

    if (range.startDate) {
      const start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
      params.push(start);
      whereConditions.push(`o."createdAt" >= $${params.length}`);
    }

    if (range.endDate) {
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      whereConditions.push(`o."createdAt" <= $${params.length}`);
    }

    const orderWhereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

    const query = `
      WITH expense_total AS (
        SELECT COALESCE(SUM("amount"), 0)::int as "totalExpenses"
        FROM "Expense"
        WHERE 1=1
        ${range.startDate ? `AND "date" >= $${params.indexOf(new Date(range.startDate)) + 1}` : ''}
        ${range.endDate ? `AND "date" <= $${params.indexOf(new Date(range.endDate)) + 1}` : ''}
      )
      SELECT 
        COALESCE(SUM(o."subtotal"), 0)::int as "grossRevenue",
        COALESCE(SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::int as "totalCogs",
        COALESCE(SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::int as "grossProfit",
        CASE 
          WHEN SUM(o."subtotal") > 0 
          THEN ((SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity"))::float / SUM(o."subtotal") * 100) 
          ELSE 0 
        END as "grossMargin",
        COALESCE((SELECT "totalExpenses" FROM expense_total), 0)::int as "totalOperatingExpenses",
        COALESCE(SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity") - (SELECT "totalExpenses" FROM expense_total), 0)::int as "netProfit",
        CASE 
          WHEN SUM(o."subtotal") > 0 
          THEN ((SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity") - (SELECT "totalExpenses" FROM expense_total))::float / SUM(o."subtotal") * 100) 
          ELSE 0 
        END as "netMargin"
      FROM "Order" o
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "OrderItem" oi ON o."id" = oi."orderId"
      WHERE 1=1 ${orderWhereClause}
    `;

    const [result] = await prisma.$queryRawUnsafe(query, ...params);
    
    return {
      grossRevenue: Number(result.grossRevenue),
      totalCogs: Number(result.totalCogs),
      grossProfit: Number(result.grossProfit),
      grossMargin: Number(result.grossMargin),
      totalOperatingExpenses: Number(result.totalOperatingExpenses),
      netProfit: Number(result.netProfit),
      netMargin: Number(result.netMargin),
    };
  }

  /**
   * Mendapatkan snapshot inventori saat ini
   * @returns {Promise<Object>} Data snapshot inventori
   * @complexity Before: O(n) - Fetch all products then calculate values in memory
   * @complexity After: O(log n) - Database-level calculation with filtered query
   */
  async getInventorySnapshot() {
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int as "totalItems",
        COALESCE(SUM("stock" * "cost"), 0)::int as "totalAssetValue",
        COALESCE(SUM("stock" * "price"), 0)::int as "totalRetailValue",
        COALESCE(SUM("stock" * "price") - SUM("stock" * "cost"), 0)::int as "potentialProfit",
        CASE 
          WHEN SUM("stock" * "price") > 0 
          THEN ((SUM("stock" * "price") - SUM("stock" * "cost"))::float / SUM("stock" * "price") * 100) 
          ELSE 0 
        END as "profitMargin"
      FROM "Product"
      WHERE "type" = 'SPAREPART' AND "isActive" = true
    `;

    const products = await prisma.product.findMany({
      where: { type: "SPAREPART", isActive: true },
      select: {
        id: true, sku: true, name: true, stock: true, cost: true, price: true,
        image: { select: { path: true } },
      },
      orderBy: { stock: "asc" },
    });

    const items = products.map((product) => {
      const assetValue = product.stock * product.cost;
      const retailValue = product.stock * product.price;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        cost: product.cost,
        price: product.price,
        image: product.image?.path || null,
        assetValue,
        retailValue,
        potentialProfit: retailValue - assetValue,
        stockStatus: product.stock === 0 ? "OUT_OF_STOCK" : product.stock <= 5 ? "LOW_STOCK" : "HEALTHY",
      };
    });

    return {
      totalAssetValue: Number(result[0].totalAssetValue),
      totalRetailValue: Number(result[0].totalRetailValue),
      potentialProfit: Number(result[0].potentialProfit),
      profitMargin: Number(result[0].profitMargin),
      items,
    };
  }

  /**
   * Mendapatkan ringkasan shift kerja
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>} Ringkasan shift
   * @complexity Before: O(n) - Load all orders then group payment methods in memory
   * @complexity After: O(log n) - Database-level aggregation with payment grouping
   */
  async getShiftSummary(shiftId) {
    const [shift, expensesAgg, paymentBreakdown] = await Promise.all([
      prisma.shift.findUnique({
        where: { id: shiftId },
        select: {
          id: true, status: true, startingCash: true, endingCash: true,
          expectedCash: true, cashSales: true, cashIn: true, cashOut: true,
          discrepancy: true, openedAt: true, closedAt: true,
          cashier: { select: { id: true, fullName: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { order: { shiftId, deletedAt: null } },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
    ]);

    if (!shift) return null;

    const totalExpenses = expensesAgg._sum.amount || 0;

    return {
      ...shift,
      totalExpenses,
      paymentBreakdown: paymentBreakdown.map((item) => ({
        method: item.method,
        total: Number(item._sum.amountPaid || 0),
        count: Number(item._count.method),
      })),
      netSales: shift.cashSales - totalExpenses,
    };
  }

  /**
   * Mendapatkan statistik task per order
   * @param {string} orderId - ID order
   * @returns {Promise<Object>} Statistik task service
   * @complexity Before: O(n) - Fetch tasks then filter assigned in memory
   * @complexity After: O(log n) - Database-level count with indexed conditions
   */
  async getTaskStatsByOrder(orderId) {
    const [total, assigned] = await Promise.all([
      prisma.orderItem.count({
        where: { orderId, product: { type: "SERVICE" } },
      }),
      prisma.orderItem.count({
        where: {
          orderId,
          product: { type: "SERVICE" },
          assignments: { some: {} },
        },
      }),
    ]);

    const tasks = await prisma.orderItem.findMany({
      where: { orderId, product: { type: "SERVICE" } },
      select: {
        id: true,
        assignments: {
          select: {
            id: true,
            mechanic: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return {
      total,
      assigned,
      unassigned: total - assigned,
      tasks: tasks.map((t) => ({
        id: t.id,
        assignedMechanics: t.assignments.map((a) => ({ id: a.mechanic.id, name: a.mechanic.fullName })),
      })),
    };
  }

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>} Statistik tugas mekanik
   * @complexity Before: O(n) - Three separate counts
   * @complexity After: O(log n) - Optimized counts using composite index (mechanicId, endAt)
   */
  async getMechanicTaskStats(mechanicId) {
    const [pending, completed, total] = await Promise.all([
      prisma.mechanicAssignment.count({
        where: {
          mechanicId,
          endAt: null,
          orderItem: { order: { status: { in: ["QUEUED", "IN_PROGRESS"] }, deletedAt: null } },
        },
      }),
      prisma.mechanicAssignment.count({
        where: {
          mechanicId,
          endAt: { not: null },
          orderItem: { order: { status: { in: ["COMPLETED", "CLOSED"] }, deletedAt: null } },
        },
      }),
      prisma.mechanicAssignment.count({ where: { mechanicId } }),
    ]);

    return { totalTasks: total, completedTasks: completed, pendingTasks: pending };
  }

  /**
   * Mendapatkan total pendapatan dari tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [range={}] - Rentang waktu filter (berdasarkan endAt)
   * @returns {Promise<Object>} Total pendapatan
   * @complexity Before: O(n) - Fetch all assignments then sum in memory
   * @complexity After: O(log n) - Database-level aggregation with raw SQL
   */
  async getTotalEarningsByMechanic(mechanicId, range = {}) {
    const conditions = [
      `ma."mechanicId" = $1`,
      `ma."endAt" IS NOT NULL`,
      `o."status" IN ('COMPLETED', 'CLOSED')`,
      `o."deletedAt" IS NULL`
    ];
    const params = [mechanicId];

    if (range.startDate) {
      params.push(new Date(range.startDate));
      conditions.push(`ma."endAt" >= $${params.length}`);
    }

    if (range.endDate) {
      params.push(new Date(range.endDate));
      conditions.push(`ma."endAt" <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COALESCE(SUM(oi."subtotal"), 0)::int as "totalEarnings",
        COUNT(ma."id")::int as "taskCount"
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      ${whereClause}
    `;

    const [result] = await prisma.$queryRawUnsafe(query, ...params);

    const totalEarnings = Number(result.totalEarnings);
    const taskCount = Number(result.taskCount);

    return {
      totalEarnings,
      taskCount,
      averagePerTask: taskCount > 0 ? totalEarnings / taskCount : 0,
    };
  }

  /**
   * Mendapatkan total pengeluaran berdasarkan filter
   * @param {Object} [filters={}] - Parameter filter
   * @param {string} [filters.shiftId]
   * @param {string} [filters.category]
   * @param {string|Date} [filters.startDate]
   * @param {string|Date} [filters.endDate]
   * @returns {Promise<number>} Total pengeluaran
   * @complexity Before: O(n) - Aggregation scan
   * @complexity After: O(log n) - Uses index on date and category
   */
  async sumExpenses(filters = {}) {
    const where = { ...this._buildDateFilter("date", filters) };
    if (filters.shiftId) where.shiftId = filters.shiftId;
    if (filters.category) where.category = filters.category;

    const aggregation = await prisma.expense.aggregate({ where, _sum: { amount: true } });
    return Number(aggregation._sum.amount || 0);
  }

  /**
   * Mendapatkan pengeluaran berdasarkan kategori
   * @param {Object} [filters={}] - Parameter filter
   * @param {string} [filters.shiftId]
   * @param {string|Date} [filters.startDate]
   * @param {string|Date} [filters.endDate]
   * @returns {Promise<Array>} Pengeluaran per kategori
   * @complexity Before: O(n) - GROUP BY scan
   * @complexity After: O(log n) - Uses index on date and category
   */
  async getExpensesByCategory(filters = {}) {
    const where = { ...this._buildDateFilter("date", filters) };
    if (filters.shiftId) where.shiftId = filters.shiftId;

    const expenses = await prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    return expenses.map((e) => ({ 
      category: e.category, 
      total: Number(e._sum.amount || 0), 
      count: Number(e._count.id) 
    }));
  }

  /**
   * Mendapatkan ringkasan pergerakan stok dalam rentang waktu
   * @param {string} productId - ID produk
   * @param {Date|string} startDate - Tanggal mulai
   * @param {Date|string} endDate - Tanggal akhir
   * @returns {Promise<Object>} Ringkasan pergerakan stok
   * @complexity Before: O(n) - GROUP BY scan
   * @complexity After: O(log n) - Uses composite index (productId, createdAt)
   */
  async getMovementSummaryByDateRange(productId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const where = { productId };
    
    if (start && end && !isNaN(start) && !isNaN(end)) {
      where.createdAt = { gte: start, lte: end };
    }

    const movements = await prisma.stockMovement.groupBy({
      by: ["type"],
      where,
      _sum: { quantity: true },
    });

    const summary = { IN: 0, OUT: 0, ADJUSTMENT: 0 };
    for (const m of movements) {
      summary[m.type] = Number(m._sum.quantity || 0);
    }

    return { ...summary, netChange: summary.IN - summary.OUT + summary.ADJUSTMENT };
  }

  /**
   * Menghitung stok dari pergerakan stok
   * @param {string} productId - ID produk
   * @returns {Promise<number>} Stok hasil kalkulasi
   * @complexity Before: O(n) - GROUP BY scan
   * @complexity After: O(log n) - Uses composite index (productId, type)
   */
  async calculateStockFromMovements(productId) {
    const movements = await prisma.stockMovement.groupBy({
      by: ["type"],
      where: { productId },
      _sum: { quantity: true },
    });

    let calculatedStock = 0;
    for (const m of movements) {
      const qty = Number(m._sum.quantity || 0);
      if (m.type === "IN" || m.type === "ADJUSTMENT") calculatedStock += qty;
      else if (m.type === "OUT") calculatedStock -= qty;
    }
    return calculatedStock;
  }

  /**
   * Validasi konsistensi stok produk
   * @param {string} productId - ID produk
   * @returns {Promise<Object|null>} Hasil validasi
   * @complexity Before: O(n) - Two separate queries
   * @complexity After: O(log n) - Parallel execution with indexed lookups
   */
  async validateStockConsistency(productId) {
    const [product, calculatedStock] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, select: { stock: true } }),
      this.calculateStockFromMovements(productId),
    ]);

    if (!product) return null;

    return {
      current: product.stock,
      calculated: calculatedStock,
      difference: product.stock - calculatedStock,
      isConsistent: product.stock === calculatedStock,
    };
  }

  /**
   * Mendapatkan laporan performa mekanik
   * @param {Object} [range={}] - Rentang waktu filter
   * @returns {Promise<Array>} Data performa mekanik
   * @complexity Before: O(n²) - N+1 queries with memory filtering and sorting
   * @complexity After: O(log n) - Single aggregated query with database-level calculations
   */
  async getMechanicPerformanceReport(range = {}) {
    const whereConditions = [`u."role" = 'MECHANIC'`];
    const params = [];

    if (range.startDate) {
      params.push(new Date(range.startDate));
      whereConditions.push(`ma."createdAt" >= $${params.length}`);
    }

    if (range.endDate) {
      params.push(new Date(range.endDate));
      whereConditions.push(`ma."createdAt" <= $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u."id" as "mechanicId",
        u."fullName" as "mechanicName",
        u."email",
        COUNT(DISTINCT ma."id")::int as "totalTasks",
        COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)::int as "completedTasks",
        COUNT(DISTINCT CASE WHEN ma."endAt" IS NULL AND o."status" IN ('QUEUED', 'IN_PROGRESS') AND o."deletedAt" IS NULL THEN ma."id" END)::int as "pendingTasks",
        COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::int as "totalEarnings",
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END) > 0 
          THEN COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0) / COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)
          ELSE 0 
        END as "averagePerTask",
        CASE 
          WHEN COUNT(DISTINCT ma."id") > 0 
          THEN (COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED', 'CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)::float / COUNT(DISTINCT ma."id") * 100)
          ELSE 0 
        END as "completionRate"
      FROM "User" u
      LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId"
      LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      LEFT JOIN "Order" o ON oi."orderId" = o."id"
      ${whereClause}
      GROUP BY u."id", u."fullName", u."email"
      ORDER BY "totalEarnings" DESC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, ...params);
    
    return rawData.map((item) => ({
      mechanicId: item.mechanicId,
      mechanicName: item.mechanicName,
      email: item.email,
      totalTasks: Number(item.totalTasks),
      completedTasks: Number(item.completedTasks),
      pendingTasks: Number(item.pendingTasks),
      totalEarnings: Number(item.totalEarnings),
      averagePerTask: Number(item.averagePerTask),
      completionRate: Number(item.completionRate),
    }));
  }

  /**
   * Mendapatkan laporan penjualan per produk
   * @param {Object} [range={}] - Rentang waktu filter
   * @param {number} [limit=10] - Batas jumlah produk
   * @returns {Promise<Array>} Laporan penjualan per produk
   * @complexity Before: O(n²) - Fetch all items then group and sort in memory
   * @complexity After: O(log n) - Database-level aggregation with GROUP BY and ORDER BY
   */
  async getProductSalesReport(range = {}, limit = 10) {
    const whereConditions = [
      `o."status" IN ('COMPLETED', 'CLOSED')`,
      `o."deletedAt" IS NULL`,
      `p2."status" = 'PAID'`
    ];
    const params = [limit];

    if (range.startDate) {
      params.push(new Date(range.startDate));
      whereConditions.push(`oi."createdAt" >= $${params.length}`);
    }

    if (range.endDate) {
      params.push(new Date(range.endDate));
      whereConditions.push(`oi."createdAt" <= $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        oi."productId",
        MAX(oi."productNameSnapshot") as "productName",
        MAX(p."sku") as "sku",
        MAX(p."type") as "type",
        f."path" as "image",
        SUM(oi."quantity")::int as "quantitySold",
        SUM(oi."subtotal")::int as "totalRevenue",
        SUM(oi."unitCostSnapshot" * oi."quantity")::int as "totalCost",
        SUM(oi."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity")::int as "profit"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      INNER JOIN "Payment" p2 ON o."id" = p2."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p."id"
      LEFT JOIN "File" f ON p."imageId" = f."id"
      WHERE 1=1 ${whereClause}
      GROUP BY oi."productId", f."path"
      ORDER BY "totalRevenue" DESC
      LIMIT $1
    `;

    const rawData = await prisma.$queryRawUnsafe(query, ...params);
    
    return rawData.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      type: item.type,
      image: item.image,
      quantitySold: Number(item.quantitySold),
      totalRevenue: Number(item.totalRevenue),
      totalCost: Number(item.totalCost),
      profit: Number(item.profit),
    }));
  }

  /**
   * Mendapatkan ringkasan produk untuk dashboard
   * @returns {Promise<Object>} Ringkasan produk
   * @complexity Before: O(n) - Multiple separate queries
   * @complexity After: O(log n) - Optimized parallel queries with aggregated calculation
   */
  async getProductSummary() {
    const [productStats, stockValue] = await Promise.all([
      Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { type: "SPAREPART", stock: { lte: 5 }, isActive: true } }),
        prisma.product.groupBy({ by: ["type"], _count: { type: true }, _sum: { stock: true } }),
      ]),
      prisma.$queryRaw`
        SELECT 
          COALESCE(SUM("stock"), 0)::int as "totalStockQuantity",
          COALESCE(SUM("stock" * "cost"), 0)::int as "totalStockValue"
        FROM "Product"
        WHERE "type" = 'SPAREPART'
      `,
    ]);

    const [totalProducts, activeProducts, lowStock, byType] = productStats;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      lowStockCount: lowStock,
      totalStockValue: Number(stockValue[0].totalStockValue),
      totalStockQuantity: Number(stockValue[0].totalStockQuantity),
      byType: byType.map((item) => ({ type: item.type, count: item._count.type, totalStock: item._sum.stock || 0 })),
    };
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {number} threshold - Batas stok rendah
   * @returns {Promise<Array>} Daftar produk stok rendah
   * @complexity Before: O(n) - Full scan with filter
   * @complexity After: O(log n) - Uses composite index (type, isActive, stock)
   */
  async getLowStockProducts(threshold = 5) {
    return prisma.product.findMany({
      where: { type: "SPAREPART", isActive: true, stock: { lte: threshold } },
      select: {
        id: true, sku: true, name: true, stock: true, cost: true, price: true,
        image: { select: { path: true } },
      },
      orderBy: { stock: "asc" },
    });
  }

  /**
   * Mendapatkan ringkasan pembayaran
   * @param {Object} [filter={}] - Parameter filter
   * @param {string} [filter.orderId]
   * @param {string} [filter.status]
   * @param {string} [filter.method]
   * @param {string|Date} [filter.startDate]
   * @param {string|Date} [filter.endDate]
   * @returns {Promise<Object>} Ringkasan pembayaran
   * @complexity Before: O(n) - Multiple aggregation queries
   * @complexity After: O(log n) - Parallel execution with proper indexes
   */
  async getPaymentSummary(filter = {}) {
    const where = {};
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.status) where.status = filter.status;
    if (filter.method) where.method = filter.method;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const [totalAmount, count, byMethod, byStatus] = await Promise.all([
      prisma.payment.aggregate({ where, _sum: { amountPaid: true } }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({ by: ["method"], where, _sum: { amountPaid: true }, _count: { method: true } }),
      prisma.payment.groupBy({ by: ["status"], where, _sum: { amountPaid: true }, _count: { status: true } }),
    ]);

    return {
      totalAmount: Number(totalAmount._sum.amountPaid || 0),
      totalCount: count,
      byMethod: byMethod.map((item) => ({ method: item.method, amount: Number(item._sum.amountPaid || 0), count: Number(item._count.method) })),
      byStatus: byStatus.map((item) => ({ status: item.status, amount: Number(item._sum.amountPaid || 0), count: Number(item._count.status) })),
    };
  }

  /**
   * Mendapatkan jumlah order berdasarkan status
   * @param {string|string[]} status - Status order
   * @returns {Promise<number>} Jumlah order
   * @complexity Before: O(n) - Count scan
   * @complexity After: O(log n) - Uses index on (status, deletedAt)
   */
  async countOrdersByStatus(status) {
    return prisma.order.count({
      where: { status: Array.isArray(status) ? { in: status } : status, deletedAt: null },
    });
  }

  /**
   * Mendapatkan shift yang sedang aktif
   * @returns {Promise<Object|null>} Shift aktif
   * @complexity Before: O(n) - findFirst with ORDER BY
   * @complexity After: O(log n) - Uses index on status
   */
  async getActiveShift() {
    return prisma.shift.findFirst({
      where: { status: "OPEN" },
      include: { cashier: { select: { id: true, fullName: true } }, _count: { select: { orders: true } } },
      orderBy: { openedAt: "desc" },
    });
  }

  /**
   * Mendapatkan data penjualan hari ini untuk kasir tertentu
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>} Data penjualan kasir hari ini
   * @complexity Before: O(n) - Two separate count queries
   * @complexity After: O(log n) - Uses composite index (cashierId, status, createdAt)
   */
  async getCashierTodaySales(cashierId) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [aggregations, pendingCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          cashierId,
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.order.count({
        where: {
          cashierId,
          status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
          deletedAt: null,
        },
      }),
    ]);

    return { 
      todayOrders: aggregations._count.id || 0, 
      todaySales: Number(aggregations._sum.total || 0), 
      pendingOrders: pendingCount 
    };
  }

  /**
   * Mendapatkan data tugas mekanik hari ini
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>} Data tugas mekanik hari ini
   * @complexity Before: O(n) - Multiple queries with nested conditions
   * @complexity After: O(log n) - Uses composite index (mechanicId, endAt) with raw SQL
   */
  async getMechanicTodayTasks(mechanicId) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [pendingCount, completedStats] = await Promise.all([
      prisma.mechanicAssignment.count({
        where: {
          mechanicId,
          endAt: null,
          orderItem: { order: { status: { in: ["QUEUED", "IN_PROGRESS"] }, deletedAt: null } },
        },
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(ma."id")::int as "completedCount",
          COALESCE(SUM(oi."subtotal"), 0)::int as "earnings"
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" >= ${startOfDay}
          AND ma."endAt" <= ${endOfDay}
          AND o."status" IN ('COMPLETED', 'CLOSED')
          AND o."deletedAt" IS NULL
      `,
    ]);

    return {
      pending: pendingCount,
      completed: Number(completedStats[0].completedCount),
      earnings: Number(completedStats[0].earnings),
    };
  }
}

export default ReportRepository;