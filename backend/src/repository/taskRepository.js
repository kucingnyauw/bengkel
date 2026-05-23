import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class TaskRepository {
  #taskSelect = {
    id: true,
    startAt: true,
    endAt: true,
    createdAt: true,
  };

  #mechanicSelect = {
    id: true,
    fullName: true,
  };

  #orderItemBasicSelect = {
    id: true,
    quantity: true,
    productNameSnapshot: true,
    product: {
      select: { 
        id: true, 
        name: true, 
        type: true,
      },
    },
    order: {
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
        vehicle: { select: { plateNumber: true } },
      },
    },
  };

  #fullSelect = {
    ...this.#taskSelect,
    mechanic: {
      select: { ...this.#mechanicSelect, email: true, phone: true },
    },
    orderItem: {
      select: {
        ...this.#orderItemBasicSelect,
        unitPrice: true,
        subtotal: true,
        product: {
          select: { 
            id: true, 
            name: true, 
            type: true, 
            description: true,
            image: { select: { path: true } },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            customer: { select: { id: true, name: true, phone: true } },
            vehicle: {
              select: { id: true, plateNumber: true, brand: true, model: true },
            },
          },
        },
      },
    },
  };

  #listSelect = {
    ...this.#taskSelect,
    mechanic: { select: this.#mechanicSelect },
    orderItem: { select: this.#orderItemBasicSelect },
  };

  /**
   * Mencari order item by ID
   * @param {string} id - ID order item
   * @returns {Promise<Object|null>}
   * @complexity O(log n)
   */
  async findOrderItemById(id) {
    return prisma.orderItem.findUnique({
      where: { id },
      select: {
        id: true,
        product: { 
          select: { 
            type: true,
            image: { select: { path: true } },
          } 
        },
        assignments: { select: { id: true } },
      },
    });
  }

  /**
   * Mencari daftar task dengan filter dan pagination (grouped by order)
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @param {string} [query.mechanicId] - Filter by mechanic ID
   * @param {string} [query.orderItemId] - Filter by order item ID
   * @param {string} [query.orderId] - Filter by order ID
   * @param {string} [query.orderStatus] - Filter by order status
   * @param {string} [query.search] - Search by product name, mechanic name, customer name, plate number, order number
   * @param {string|Date} [query.startDate] - Filter tanggal mulai (berdasarkan order createdAt)
   * @param {string|Date} [query.endDate] - Filter tanggal akhir (berdasarkan order createdAt)
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity O(log n) - Single query grouped by order
   */

  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const conditions = [];
    const params = [];

    if (query.mechanicId) {
        params.push(query.mechanicId);
        conditions.push(`ma."mechanicId" = $${params.length}`);
    }

    if (query.orderNumber) {
        params.push(`%${query.orderNumber}%`);
        conditions.push(`o."orderNumber" ILIKE $${params.length}`);
    }

    if (query.startDate) {
        params.push(new Date(query.startDate));
        conditions.push(`ma."startAt" >= $${params.length}`);
    }

    if (query.endDate) {
        params.push(new Date(query.endDate));
        conditions.push(`ma."endAt" <= $${params.length}`);
    }

    if (query.orderStatus) {
        params.push(query.orderStatus);
        conditions.push(`o."status"::text = $${params.length}`);
    }

    if (query.isActive === true) {
        conditions.push(`ma."endAt" IS NULL`);
    }

    if (query.isCompleted === true) {
        conditions.push(`ma."endAt" IS NOT NULL`);
    }

    if (query.search) {
        params.push(`%${query.search}%`);
        conditions.push(`(
            oi."productNameSnapshot" ILIKE $${params.length} OR 
            o."orderNumber" ILIKE $${params.length} OR 
            u."fullName" ILIKE $${params.length} OR 
            c."name" ILIKE $${params.length} OR 
            v."plateNumber" ILIKE $${params.length}
        )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
        SELECT COUNT(DISTINCT o."id")::int as total
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        INNER JOIN "User" u ON ma."mechanicId" = u."id"
        LEFT JOIN "Customer" c ON o."customerId" = c."id"
        LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
        ${whereClause}
    `;

    const dataQuery = `
        SELECT 
            o."id" as "orderId",
            o."orderNumber",
            o."status",
            o."createdAt" as "orderCreatedAt",
            c."name" as "customerName",
            v."plateNumber",
            v."brand",
            v."model",
            ARRAY_AGG(
                JSON_BUILD_OBJECT(
                    'assignmentId', ma."id",
                    'mechanicId', ma."mechanicId",
                    'mechanicName', u."fullName",
                    'serviceName', oi."productNameSnapshot",
                    'startAt', ma."startAt",
                    'endAt', ma."endAt"
                )
                ORDER BY ma."createdAt" ASC
            ) as "services"
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        INNER JOIN "User" u ON ma."mechanicId" = u."id"
        LEFT JOIN "Customer" c ON o."customerId" = c."id"
        LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
        ${whereClause}
        GROUP BY o."id", o."orderNumber", o."status", o."createdAt", c."name", v."plateNumber", v."brand", v."model"
        ORDER BY o."createdAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
        prisma.$queryRawUnsafe(countQuery, ...params),
        prisma.$queryRawUnsafe(dataQuery, ...params, limit, skip),
    ]);

    const data = rawData.map((item) => ({
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        status: item.status,
        createdAt: item.orderCreatedAt,
        customer: {
            name: item.customerName,
        },
        vehicle: item.plateNumber
            ? {
                plateNumber: item.plateNumber,
                brand: item.brand,
                model: item.model,
            }
            : null,
        services: (item.services || []).map((s) => ({
            assignmentId: s.assignmentId,
            mechanicId: s.mechanicId,
            mechanicName: s.mechanicName,
            serviceName: s.serviceName,
            startAt: s.startAt,
            endAt: s.endAt,
            taskStatus: s.endAt ? "COMPLETED" : s.startAt ? "IN_PROGRESS" : "PENDING",
        })),
    }));

    return {
        data,
        metadata: Pagination.generateMetadata(
            Number(countResult[0].total),
            query.page || 1,
            limit
        ),
    };
}

  /**
   * Mencari task service yang belum ditugaskan (grouped by order)
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity O(log n) - Database-level grouping with indexed WHERE
   */
 

  async findUnassignedServiceTasks(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const countQuery = `
        SELECT COUNT(DISTINCT oi."id")::int as total
        FROM "OrderItem" oi
        INNER JOIN "Product" p ON oi."productId" = p."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        LEFT JOIN "MechanicAssignment" ma ON oi."id" = ma."orderItemId"
        WHERE p."type" = 'SERVICE'
          AND o."status" = 'QUEUED'
          AND o."deletedAt" IS NULL
          AND ma."id" IS NULL
    `;

    const dataQuery = `
        SELECT 
            oi."id",
            oi."quantity",
            oi."productNameSnapshot",
            p."id" as "productId",
            p."name" as "productName",
            p."description" as "productDescription",
            p."price" as "productPrice",
            f."path" as "imagePath",
            o."id" as "orderId",
            o."orderNumber",
            o."status" as "orderStatus",
            o."createdAt" as "orderCreatedAt",
            c."name" as "customerName",
            v."plateNumber",
            v."brand",
            v."model"
        FROM "OrderItem" oi
        INNER JOIN "Product" p ON oi."productId" = p."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        LEFT JOIN "Customer" c ON o."customerId" = c."id"
        LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
        LEFT JOIN "File" f ON p."imageId" = f."id"
        LEFT JOIN "MechanicAssignment" ma ON oi."id" = ma."orderItemId"
        WHERE p."type" = 'SERVICE'
          AND o."status" = 'QUEUED'
          AND o."deletedAt" IS NULL
          AND ma."id" IS NULL
        ORDER BY o."createdAt" DESC
        LIMIT $1 OFFSET $2
    `;

    const [countResult, rawData] = await Promise.all([
        prisma.$queryRawUnsafe(countQuery),
        prisma.$queryRawUnsafe(dataQuery, limit, skip),
    ]);

    const groupedMap = new Map();
    for (const item of rawData) {
        const orderId = item.orderId;
        if (!groupedMap.has(orderId)) {
            groupedMap.set(orderId, {
                orderId,
                orderNumber: item.orderNumber,
                status: item.orderStatus,
                createdAt: item.orderCreatedAt,
                customer: { name: item.customerName },
                vehicle: item.plateNumber ? {
                    plateNumber: item.plateNumber,
                    brand: item.brand,
                    model: item.model,
                } : null,
                services: [],
            });
        }
        groupedMap.get(orderId).services.push({
            id: item.id,
            name: item.productNameSnapshot || item.productName,
            quantity: item.quantity,
            price: item.productPrice,
            image: item.imagePath || null,
        });
    }

    return {
        data: Array.from(groupedMap.values()),
        metadata: Pagination.generateMetadata(
            Number(countResult[0].total), 
            query.page || 1, 
            limit
        ),
    };
}


  /**
   * Mencari task berdasarkan ID
   * @param {string} id - ID task
   * @returns {Promise<Object|null>}
   * @complexity O(log n)
   */
  async findById(id) {
    return prisma.mechanicAssignment.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari task berdasarkan ID order item
   * @param {string} orderItemId - ID order item
   * @returns {Promise<Array>}
   * @complexity O(log n)
   */
  async findByOrderItemId(orderItemId) {
    return prisma.mechanicAssignment.findMany({
      where: { orderItemId },
      select: this.#listSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Mencari semua task berdasarkan order ID
   * @param {string} orderId - ID order
   * @returns {Promise<Array>}
   * @complexity O(log n)
   */
  async findByOrderId(orderId) {
    return prisma.mechanicAssignment.findMany({
      where: { orderItem: { orderId } },
      select: this.#fullSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Mencari task aktif berdasarkan ID mekanik
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}] - Parameter query tambahan
   * @param {string} [query.orderId] - Filter by order ID
   * @returns {Promise<Array>}
   * @complexity O(log n)
   */
  async findByMechanicId(mechanicId, query = {}) {
    const where = {
      mechanicId,
      endAt: null,
      orderItem: { order: { status: { in: ["QUEUED", "IN_PROGRESS"] } } },
    };

    if (query.orderId) {
      where.orderItem = { ...where.orderItem, orderId: query.orderId };
    }

    return prisma.mechanicAssignment.findMany({
      where,
      select: {
        id: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        orderItem: {
          select: {
            productNameSnapshot: true,
            product: { 
              select: { 
                name: true,
                image: { select: { path: true } },
              } 
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true,
                customer: { select: { name: true } },
                vehicle: { select: { plateNumber: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Menugaskan mekanik ke order item
   * @param {string} orderItemId - ID order item
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   * @complexity O(1)
   */
  async assignMechanic(orderItemId, mechanicId) {
    return prisma.mechanicAssignment.create({
      data: { orderItemId, mechanicId },
      select: this.#fullSelect,
    });
  }

  /**
   * Membatalkan penugasan mekanik
   * @param {string} id - ID task
   * @returns {Promise<void>}
   * @complexity O(log n)
   */
  async unassignMechanic(id) {
    await prisma.mechanicAssignment.delete({ where: { id } });
  }

  /**
   * Memulai task
   * @param {string} id - ID task
   * @returns {Promise<Object>}
   * @complexity O(log n)
   */
  async startTask(id) {
    return prisma.mechanicAssignment.update({
      where: { id },
      data: { startAt: new Date() },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        orderItem: {
          select: {
            productNameSnapshot: true,
            product: { 
              select: { 
                name: true,
                image: { select: { path: true } },
              } 
            },
            order: {
              select: { id: true, orderNumber: true, status: true, cashierId: true },
            },
          },
        },
      },
    });
  }

  /**
   * Menyelesaikan task
   * @param {string} id - ID task
   * @returns {Promise<Object>}
   * @complexity O(log n)
   */
  async completeTask(id) {
    return prisma.mechanicAssignment.update({
      where: { id },
      data: { endAt: new Date() },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        orderItem: {
          select: {
            productNameSnapshot: true,
            product: { 
              select: { 
                name: true,
                image: { select: { path: true } },
              } 
            },
            order: { select: { id: true, orderNumber: true, cashierId: true } },
          },
        },
      },
    });
  }

  /**
   * Mengecek apakah order item sudah memiliki mekanik
   * @param {string} orderItemId - ID order item
   * @returns {Promise<boolean>}
   * @complexity O(log n)
   */
  async hasMechanicAssigned(orderItemId) {
    const assignment = await prisma.mechanicAssignment.findFirst({
      where: { orderItemId },
      select: { id: true },
    });
    return !!assignment;
  }

  /**
   * Mendapatkan jumlah task aktif mekanik (unique order)
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<number>}
   * @complexity O(log n)
   */
  async getActiveTaskCount(mechanicId) {
    const result = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT oi."orderId") as count
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE ma."mechanicId" = ${mechanicId}
        AND ma."endAt" IS NULL
        AND o."status"::text IN ('QUEUED', 'IN_PROGRESS')
    `;
    
    return Number(result[0].count);
  }

  /**
   * Mendapatkan daftar mekanik yang tersedia dengan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @param {string} [query.search] - Search by mechanic name
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity O(log n)
   */
  async getAvailableMechanics(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const whereClause = query.search 
      ? `WHERE u."role" = 'MECHANIC' AND u."fullName" ILIKE $1`
      : `WHERE u."role" = 'MECHANIC'`;
    
    const searchParam = query.search ? [`%${query.search}%`] : [];

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "User" u
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        u."id",
        u."fullName",
        u."email",
        u."phone",
        COUNT(DISTINCT oi."orderId") as "activeTaskCount"
      FROM "User" u
      LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" AND ma."endAt" IS NULL
      LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      LEFT JOIN "Order" o ON oi."orderId" = o."id" AND o."status"::text IN ('QUEUED', 'IN_PROGRESS')
      ${whereClause}
      GROUP BY u."id", u."fullName", u."email", u."phone"
      ORDER BY u."fullName" ASC
      LIMIT $${searchParam.length + 1} OFFSET $${searchParam.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, ...searchParam),
      prisma.$queryRawUnsafe(dataQuery, ...searchParam, limit, skip),
    ]);

    const data = rawData.map((item) => ({
      id: item.id,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      activeTaskCount: Number(item.activeTaskCount),
    }));

    return {
      data,
      metadata: Pagination.generateMetadata(
        Number(countResult[0].total), 
        query.page || 1, 
        limit
      ),
    };
  }

  /**
   * Mencari task milik mekanik yang sedang login (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @param {string} [query.orderId] - Filter by order ID
   * @param {string} [query.search] - Search by product name, customer name, plate number, order number
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity O(log n)
   */
  async findMyTasks(mechanicId, query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const conditions = [
      `ma."mechanicId" = $1`,
      `ma."endAt" IS NULL`,
      `o."status"::text IN ('QUEUED', 'IN_PROGRESS')`,
      `o."deletedAt" IS NULL`
    ];
    const params = [mechanicId];

    if (query.orderId) {
      params.push(query.orderId);
      conditions.push(`o."id" = $${params.length}`);
    }

    if (query.search) {
      params.push(`%${query.search}%`);
      conditions.push(`(
        oi."productNameSnapshot" ILIKE $${params.length} OR 
        o."orderNumber" ILIKE $${params.length} OR 
        c."name" ILIKE $${params.length} OR 
        v."plateNumber" ILIKE $${params.length}
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(DISTINCT o."id")::int as total
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      LEFT JOIN "Customer" c ON o."customerId" = c."id"
      LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        o."id" as "orderId",
        o."orderNumber",
        o."status",
        o."createdAt",
        c."name" as "customerName",
        v."plateNumber",
        v."brand",
        v."model",
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'assignmentId', ma."id",
            'serviceName', oi."productNameSnapshot",
            'startAt', ma."startAt",
            'endAt', ma."endAt"
          )
          ORDER BY ma."createdAt" ASC
        ) as "services"
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      LEFT JOIN "Customer" c ON o."customerId" = c."id"
      LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
      ${whereClause}
      GROUP BY o."id", o."orderNumber", o."status", o."createdAt", c."name", v."plateNumber", v."brand", v."model"
      ORDER BY o."createdAt" DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, ...params),
      prisma.$queryRawUnsafe(dataQuery, ...params, limit, skip),
    ]);

    const data = rawData.map((item) => ({
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      status: item.status,
      createdAt: item.createdAt,
      customer: {
        name: item.customerName,
      },
      vehicle: item.plateNumber
        ? {
            plateNumber: item.plateNumber,
            brand: item.brand,
            model: item.model,
          }
        : null,
      services: (item.services || []).map((s) => ({
        assignmentId: s.assignmentId,
        serviceName: s.serviceName,
        startAt: s.startAt,
        endAt: s.endAt,
        taskStatus: s.endAt ? "COMPLETED" : s.startAt ? "IN_PROGRESS" : "PENDING",
      })),
    }));

    return {
      data,
      metadata: Pagination.generateMetadata(
        Number(countResult[0].total),
        query.page || 1,
        limit
      ),
    };
  }

  /**
   * Mencari riwayat task mekanik yang sudah selesai (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @param {string} [query.search] - Search by product name, order number, customer name, plate number
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>}
   * @complexity O(log n)
   */
  async findHistoryByMechanic(mechanicId, query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const conditions = [
      `ma."mechanicId" = $1`,
      `ma."endAt" IS NOT NULL`,
      `o."status"::text IN ('COMPLETED', 'CLOSED')`,
      `o."deletedAt" IS NULL`
    ];
    const params = [mechanicId];

    if (query.search) {
      params.push(`%${query.search}%`);
      conditions.push(`(
        oi."productNameSnapshot" ILIKE $${params.length} OR 
        o."orderNumber" ILIKE $${params.length} OR 
        c."name" ILIKE $${params.length} OR 
        v."plateNumber" ILIKE $${params.length}
      )`);
    }

    if (query.startDate) {
      params.push(new Date(query.startDate));
      conditions.push(`ma."endAt" >= $${params.length}`);
    }

    if (query.endDate) {
      params.push(new Date(query.endDate));
      conditions.push(`ma."endAt" <= $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(DISTINCT o."id")::int as total
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      LEFT JOIN "Customer" c ON o."customerId" = c."id"
      LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        o."id" as "orderId",
        o."orderNumber",
        o."status",
        o."createdAt" as "orderCreatedAt",
        c."name" as "customerName",
        v."plateNumber",
        v."brand",
        v."model",
        MIN(ma."startAt") as "startedAt",
        MAX(ma."endAt") as "completedAt",
        COALESCE(SUM(oi."subtotal"), 0)::int as "totalEarnings",
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'assignmentId', ma."id",
            'serviceName', oi."productNameSnapshot",
            'startAt', ma."startAt",
            'endAt', ma."endAt"
          )
          ORDER BY ma."endAt" DESC
        ) as "services"
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      LEFT JOIN "Customer" c ON o."customerId" = c."id"
      LEFT JOIN "Vehicle" v ON o."vehicleId" = v."id"
      ${whereClause}
      GROUP BY o."id", o."orderNumber", o."status", o."createdAt", c."name", v."plateNumber", v."brand", v."model"
      ORDER BY MAX(ma."endAt") DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, ...params),
      prisma.$queryRawUnsafe(dataQuery, ...params, limit, skip),
    ]);

    const data = rawData.map((item) => ({
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      status: item.status,
      orderCreatedAt: item.orderCreatedAt,
      customer: {
        name: item.customerName,
      },
      vehicle: item.plateNumber
        ? {
            plateNumber: item.plateNumber,
            brand: item.brand,
            model: item.model,
          }
        : null,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      duration: item.startedAt && item.completedAt
        ? this.#formatDuration(new Date(item.startedAt), new Date(item.completedAt))
        : null,
      totalEarnings: Number(item.totalEarnings),
      services: (item.services || []).map((s) => ({
        assignmentId: s.assignmentId,
        serviceName: s.serviceName,
        startAt: s.startAt,
        endAt: s.endAt,
      })),
    }));

    return {
      data,
      metadata: Pagination.generateMetadata(
        Number(countResult[0].total),
        query.page || 1,
        limit
      ),
    };
  }

  /**
   * Format durasi
   * @param {Date} startAt
   * @param {Date} endAt
   * @returns {string}
   * @private
   */
  #formatDuration(startAt, endAt) {
    const diff = new Date(endAt) - new Date(startAt);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`;
  }
}

export default TaskRepository;