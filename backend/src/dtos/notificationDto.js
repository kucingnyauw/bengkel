/**
 * Data Transfer Object untuk response Notification
 * @module dtos/notificationDto
 */

/**
 * DTO untuk detail notifikasi
 * @class NotificationDto
 */
class NotificationDto {
  /**
   * @param {Object} data - Data notifikasi dari database
   * @param {string} data.id - ID notifikasi
   * @param {string} data.title - Judul notifikasi
   * @param {string} data.message - Pesan notifikasi
   * @param {string} data.type - Tipe notifikasi
   * @param {boolean} data.isRead - Status baca
   * @param {string} data.createdAt - Tanggal dibuat
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.message = data.message;
    this.type = data.type;
    this.isRead = data.isRead;
    this.createdAt = data.createdAt;
  }
}

/**
 * DTO untuk jumlah notifikasi unread
 * @class NotificationUnreadCountDto
 */
class NotificationUnreadCountDto {
  /**
   * @param {number} count - Jumlah notifikasi unread
   */
  constructor(count) {
    this.unreadCount = count;
  }
}

export { NotificationDto, NotificationUnreadCountDto };