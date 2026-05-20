import Client from "@lib/client.js";

/**
 * Mendapatkan notifikasi user yang sedang login
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {boolean} [params.isRead] - Filter status baca
 * @param {string} [params.type] - Filter tipe notifikasi
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getMyNotifications = async (params) => {
  const response = await Client.get("/notifications/me", { params });
  return {
    data: response.data,
    metadata: response.metadata,
  };
};

/**
 * Mendapatkan notifikasi berdasarkan ID
 * @param {string} id - ID notifikasi
 * @returns {Promise<Object>} Data notifikasi
 */
export const getNotificationById = async (id) => {
  const { data } = await Client.get(`/notifications/${id}`);
  return data;
};

/**
 * Mendapatkan jumlah notifikasi belum dibaca
 * @returns {Promise<Object>} Object berisi unreadCount
 */
export const getUnreadCount = async () => {
  const { data } = await Client.get("/notifications/unread-count");
  return data;
};

/**
 * Mendapatkan jumlah total notifikasi
 * @returns {Promise<Object>} Object berisi total
 */
export const getTotalCount = async () => {
  const { data } = await Client.get("/notifications/total-count");
  return data;
};

/**
 * Menandai notifikasi sudah dibaca
 * @param {string} id - ID notifikasi
 * @returns {Promise<Object>} Notifikasi yang sudah diupdate
 */
export const markAsRead = async (id) => {
  const { data } = await Client.patch(`/notifications/${id}/read`);
  return data;
};

/**
 * Menandai semua notifikasi sudah dibaca
 * @returns {Promise<Object>} Object berisi count
 */
export const markAllAsRead = async () => {
  const { data } = await Client.patch("/notifications/read-all");
  return data;
};

/**
 * Menghapus notifikasi
 * @param {string} id - ID notifikasi
 * @returns {Promise<void>}
 */
export const deleteNotification = async (id) => {
  await Client.delete(`/notifications/${id}`);
};

/**
 * Menghapus semua notifikasi user
 * @returns {Promise<Object>} Object berisi count
 */
export const deleteAllNotifications = async () => {
  const { data } = await Client.delete("/notifications");
  return data;
};