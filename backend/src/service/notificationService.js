import NotificationRepository from "#repository/notificationRepository.js";
import logger from "#app/logger.js";
import ApiError from "#shared/utils/error.js";

/**
 * Service untuk mengelola logika bisnis notifikasi
 * @class NotificationService
 */
class NotificationService {
  constructor() {
    this.notifRepo = new NotificationRepository();
  }

  /**
   * Membuat notifikasi untuk satu user
   * @param {Object} data - Data notifikasi
   * @param {string} data.title - Judul
   * @param {string} data.message - Pesan
   * @param {string} data.userId - ID user penerima
   * @param {string} [data.type="INFO"] - Tipe notifikasi
   * @param {string} [data.orderId] - ID order terkait
   * @returns {Promise<Object>} Notifikasi yang dibuat
   */
  async create(data) {
    const notification = await this.notifRepo.create(data);

    logger.info("Notifikasi dibuat", {
      notificationId: notification.id,
      userId: data.userId,
      type: data.type,
    });

    return notification;
  }

  /**
   * Membuat notifikasi untuk multiple users
   * @param {Object} data - Data notifikasi
   * @param {string[]} data.userIds - Array ID user penerima
   * @param {string} data.title - Judul
   * @param {string} data.message - Pesan
   * @param {string} [data.type="INFO"] - Tipe notifikasi
   * @param {string} [data.orderId] - ID order terkait
   * @returns {Promise<number>} Jumlah notifikasi yang dibuat
   */
  async createMany(data) {
    const count = await this.notifRepo.createMany(data);

    logger.info("Notifikasi massal dibuat", {
      count,
      type: data.type,
    });

    return count;
  }

  /**
   * Mendapatkan notifikasi berdasarkan ID
   * @param {string} id - ID notifikasi
   * @returns {Promise<Object>} Data notifikasi
   * @throws {ApiError} 404 - Notifikasi tidak ditemukan
   */
  async getById(id) {
    const notification = await this.notifRepo.findById(id);

    if (!notification) {
      throw ApiError.notFound({
        message: `Notifikasi dengan ID '${id}' tidak ditemukan.`,
      });
    }

    return notification;
  }

  /**
   * Mendapatkan daftar notifikasi user
   * @param {string} userId - ID user
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar notifikasi
   */
  async getByUserId(userId, query = {}) {
    return this.notifRepo.findByUserId(userId, query);
  }

  /**
   * Menandai notifikasi sudah dibaca
   * @param {string} id - ID notifikasi
   * @returns {Promise<Object>} Notifikasi yang sudah diupdate
   */
  async markAsRead(id) {
    const notification = await this.notifRepo.markAsRead(id);

    logger.info("Notifikasi ditandai dibaca", { notificationId: id });

    return notification;
  }

  /**
   * Menandai semua notifikasi user sudah dibaca
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi yang ditandai
   */
  async markAllAsRead(userId) {
    const count = await this.notifRepo.markAllAsRead(userId);

    logger.info("Semua notifikasi ditandai dibaca", { userId, count });

    return count;
  }

  /**
   * Mendapatkan jumlah notifikasi belum dibaca
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi unread
   */
  async getUnreadCount(userId) {
    return this.notifRepo.getUnreadCount(userId);
  }

  /**
   * Menghapus notifikasi
   * @param {string} id - ID notifikasi
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.notifRepo.delete(id);

    logger.info("Notifikasi dihapus", { notificationId: id });
  }

  /**
   * Menghapus semua notifikasi user
   * @param {string} userId - ID user
   * @returns {Promise<number>} Jumlah notifikasi yang dihapus
   */
  async deleteAll(userId) {
    const count = await this.notifRepo.deleteAll(userId);

    logger.info("Semua notifikasi user dihapus", { userId, count });

    return count;
  }


/**
 * Mendapatkan jumlah total notifikasi user
 * @param {string} userId - ID user
 * @returns {Promise<number>} Jumlah total notifikasi
 */
async getTotalCount(userId) {
  return this.notifRepo.getTotalCount(userId);
}
}

export default NotificationService;
