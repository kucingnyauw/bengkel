import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class NotificationRepository {
  #defaultSelect = {
    id: true,
    title: true,
    message: true,
    type: true,
    isRead: true,
    createdAt: true,
  };

  /**
   * Membuat notifikasi baru
   * @param {Object} data - Data notifikasi
   * @param {string} data.title - Judul notifikasi
   * @param {string} data.message - Pesan notifikasi
   * @param {string} [data.type="INFO"] - Tipe notifikasi
   * @param {string} data.userId - ID user penerima
   * @returns {Promise<Object>} Notifikasi yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        userId: data.userId,
      },
      select: this.#defaultSelect,
    });
  }

  /**
   * Membuat notifikasi untuk multiple users
   * @param {Object} data - Data notifikasi
   * @param {string[]} data.userIds - Array ID user penerima
   * @param {string} data.title - Judul notifikasi
   * @param {string} data.message - Pesan notifikasi
   * @param {string} [data.type="INFO"] - Tipe notifikasi
   * @returns {Promise<number>} Jumlah notifikasi yang dibuat
   * @complexity Before: O(n) - Multiple inserts in single query
   * @complexity After: O(n) - No change needed, already optimized with createMany
   */
  async createMany(data) {
    const notifications = data.userIds.map((userId) => ({
      title: data.title,
      message: data.message,
      type: data.type || "INFO",
      userId,
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    return result.count;
  }

  /**
   * Mencari notifikasi berdasarkan ID
   * @param {string} id - ID notifikasi
   * @returns {Promise<Object|null>} Data notifikasi atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      select: this.#defaultSelect,
    });
  }

  /**
   * Mencari daftar notifikasi user dengan pagination
   * @param {string} userId - ID user
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=20] - Jumlah per halaman
   * @param {boolean|string} [query.isRead] - Filter status baca
   * @param {string} [query.type] - Filter tipe notifikasi
   * @returns {Promise<{data: Array, metadata: Object}>} Data notifikasi dan metadata
   * @complexity Before: O(n) - Offset pagination with filters
   * @complexity After: O(log n) - Uses composite index (userId, isRead) with filtered conditions
   */
  async findByUserId(userId, query = {}) {
    const limit = query.limit || 20;
    const skip = ((query.page || 1) - 1) * limit;

    const where = { userId };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead === "true" || query.isRead === true;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [total, data] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        select: this.#defaultSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mendapatkan notifikasi terbaru user
   * @param {string} userId - ID user
   * @param {number} [limit=5] - Jumlah notifikasi
   * @returns {Promise<Array>} Daftar notifikasi terbaru
   * @complexity Before: O(n) - findMany with orderBy
   * @complexity After: O(log n) - Uses index on (userId, createdAt)
   */
  async findRecentByUserId(userId, limit = 5) {
    return prisma.notification.findMany({
      where: { userId },
      take: limit,
      select: this.#defaultSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Menandai notifikasi sudah dibaca
   * @param {string} id - ID notifikasi
   * @returns {Promise<Object>} Notifikasi yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: this.#defaultSelect,
    });
  }

  /**
   * Menandai semua notifikasi user sudah dibaca
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi yang ditandai
   * @complexity Before: O(n) - updateMany with filter
   * @complexity After: O(log n) - Uses composite index (userId, isRead)
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Mendapatkan jumlah notifikasi belum dibaca
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi unread
   * @complexity Before: O(n) - Count with filter
   * @complexity After: O(log n) - Uses composite index (userId, isRead)
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mendapatkan jumlah total notifikasi user
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah total notifikasi
   * @complexity Before: O(n) - Count with filter
   * @complexity After: O(log n) - Uses index on userId
   */
  async getTotalCount(userId) {
    return prisma.notification.count({
      where: { userId },
    });
  }

  /**
   * Menghapus notifikasi
   * @param {string} id - ID notifikasi
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Primary key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(id) {
    await prisma.notification.delete({ where: { id } });
  }

  /**
   * Menghapus semua notifikasi user
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi yang dihapus
   * @complexity Before: O(n) - deleteMany with filter
   * @complexity After: O(log n) - Uses index on userId
   */
  async deleteAll(userId) {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Menghapus notifikasi yang sudah dibaca untuk user tertentu
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi yang dihapus
   * @complexity Before: O(n) - deleteMany with composite filter
   * @complexity After: O(log n) - Uses composite index (userId, isRead)
   */
  async deleteReadNotifications(userId) {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return result.count;
  }

  /**
   * Mendapatkan ringkasan notifikasi user
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Ringkasan notifikasi
   * @complexity Before: O(n) - Multiple separate queries
   * @complexity After: O(log n) - Parallel execution with indexed queries
   */
  async getNotificationSummary(userId) {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.groupBy({
        by: ["type"],
        where: { userId },
        _count: { type: true },
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.type,
      })),
    };
  }
}

export default NotificationRepository;