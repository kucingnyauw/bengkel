import Client from "@lib/client.js";

/**
 * Membuat pesanan baru (DRAFT).
 * Input: customer (opsional) + kendaraan (opsional) + items (opsional).
 *
 * @param {Object} payload
 * @param {string} [payload.customerId] - ID customer
 * @param {string} [payload.vehicleId] - ID kendaraan
 * @param {Array<{productId: string, quantity: number, mechanicId?: string}>} [payload.items] - Item pesanan
 * @returns {Promise<Object>} Data pesanan yang dibuat
 */
export const createOrder = async (payload) => {
  const { data } = await Client.post("/orders", payload);
  return data;
};

/**
 * Menghitung estimasi total pesanan
 * @param {Array<{productId: string, quantity: number}>} items - Item pesanan
 * @returns {Promise<Object>} Estimasi total
 */

export const calculateTotal = async (items) => {
  const { data } = await Client.post("/orders/calculate", items); // ← hapus { items }
  return data;
};

/**
 * Mendapatkan daftar pesanan dengan filter dan paginasi
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.status] - Filter berdasarkan status
 * @param {string} [params.search] - Pencarian berdasarkan nomor order
 * @param {string} [params.customerId] - Filter berdasarkan customer
 * @param {string} [params.startDate] - Filter tanggal mulai
 * @param {string} [params.endDate] - Filter tanggal akhir
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getOrders = async (params) => {
  const response = await Client.get("/orders", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan pesanan aktif kasir
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getActiveOrders = async (params) => {
  const response = await Client.get("/orders/active", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan detail pesanan berdasarkan ID atau nomor order
 * @param {string} identifier - ID atau nomor pesanan
 * @returns {Promise<Object>} Data pesanan
 */
export const getOrder = async (identifier) => {
  const { data } = await Client.get(`/orders/${identifier}`);
  return data;
};

/**
 * Mengupdate status pesanan
 * @param {string} id - ID pesanan
 * @param {Object} payload
 * @param {string} payload.status - Status baru
 * @param {string} [payload.note] - Catatan perubahan status
 * @returns {Promise<Object>} Data pesanan yang diupdate
 */
export const updateOrderStatus = async (id, payload) => {
  const { data } = await Client.patch(`/orders/${id}/status`, payload);
  return data;
};

/**
 * Menutup pesanan (COMPLETED → CLOSED)
 * @param {string} id - ID pesanan
 * @returns {Promise<Object>} Data pesanan yang diupdate
 */
export const closeOrder = async (id) => {
  const { data } = await Client.patch(`/orders/${id}/close`);
  return data;
};

/**
 * Membatalkan pesanan
 * @param {string} id - ID pesanan
 * @param {Object} payload
 * @param {string} payload.reason - Alasan pembatalan
 * @returns {Promise<Object>} Response pembatalan
 */
export const cancelOrder = async (id, payload) => {
  const { data } = await Client.post(`/orders/${id}/cancel`, payload);
  return data;
};

/**
 * Restore pesanan yang di-soft delete
 * @param {string} id - ID pesanan
 * @returns {Promise<Object>} Data pesanan yang direstore
 */
export const restoreOrder = async (id) => {
  const { data } = await Client.post(`/orders/${id}/restore`);
  return data;
};

/**
 * Soft delete pesanan
 * @param {string} id - ID pesanan
 * @returns {Promise<void>}
 */
export const softDeleteOrder = async (id) => {
  await Client.delete(`/orders/${id}`);
};