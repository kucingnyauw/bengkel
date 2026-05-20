import Client from "@lib/client.js";

/**
 * Mencatat stok masuk
 * @param {Object} payload
 * @param {string} payload.productId - ID produk
 * @param {number} payload.quantity - Jumlah stok masuk
 * @param {string} [payload.note] - Catatan
 * @param {string} [payload.sourceType] - Sumber stok masuk
 * @returns {Promise<Object>} Data mutasi stok
 */
export const recordStockIn = async (payload) => {
  const { data } = await Client.post("/stock/in", payload);
  return data;
};

/**
 * Mencatat stok keluar
 * @param {Object} payload
 * @param {string} payload.productId - ID produk
 * @param {number} payload.quantity - Jumlah stok keluar
 * @param {string} [payload.orderItemId] - ID order item terkait
 * @param {string} [payload.note] - Catatan
 * @param {string} [payload.sourceType] - Sumber stok keluar
 * @returns {Promise<Object>} Data mutasi stok
 */
export const recordStockOut = async (payload) => {
  const { data } = await Client.post("/stock/out", payload);
  return data;
};

/**
 * Mencatat stok keluar untuk penjualan
 * @param {Object} payload
 * @param {string} payload.productId - ID produk
 * @param {number} payload.quantity - Jumlah terjual
 * @param {string} payload.orderItemId - ID order item
 * @returns {Promise<Object>} Data mutasi stok
 */
export const recordSaleOut = async (payload) => {
  const { data } = await Client.post("/stock/sale", payload);
  return data;
};

/**
 * Mencatat stok masuk untuk retur
 * @param {Object} payload
 * @param {string} payload.productId - ID produk
 * @param {number} payload.quantity - Jumlah retur
 * @param {string} [payload.note] - Catatan
 * @returns {Promise<Object>} Data mutasi stok
 */
export const recordReturnIn = async (payload) => {
  const { data } = await Client.post("/stock/return", payload);
  return data;
};

/**
 * Mencatat penyesuaian stok
 * @param {Object} payload
 * @param {string} payload.productId - ID produk
 * @param {number} payload.quantity - Jumlah penyesuaian
 * @param {string} [payload.note] - Catatan
 * @returns {Promise<Object>} Data mutasi stok
 */
export const recordAdjustment = async (payload) => {
  const { data } = await Client.post("/stock/adjust", payload);
  return data;
};

/**
 * Mendapatkan daftar mutasi stok dengan paginasi dan filter
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.productId] - Filter berdasarkan produk
 * @param {string} [params.type] - Filter berdasarkan tipe
 * @param {string} [params.sourceType] - Filter berdasarkan sumber
 * @param {string} [params.recordedById] - Filter berdasarkan user
 * @param {string} [params.orderId] - Filter berdasarkan order
 * @param {string} [params.startDate] - Filter tanggal mulai
 * @param {string} [params.endDate] - Filter tanggal akhir
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getStockMovements = async (params) => {
  const response = await Client.get("/stock/movements", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan mutasi stok berdasarkan ID
 * @param {string} id - ID mutasi
 * @returns {Promise<Object>} Data mutasi stok
 */
export const getStockMovementById = async (id) => {
  const { data } = await Client.get(`/stock/movements/${id}`);
  return data;
};

/**
 * Mendapatkan mutasi stok berdasarkan produk
 * @param {string} productId - ID produk
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getMovementsByProduct = async (productId, params) => {
  const response = await Client.get(`/stock/products/${productId}/movements`, { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan mutasi stok berdasarkan order
 * @param {string} orderId - ID order
 * @returns {Promise<Array>} Daftar mutasi stok
 */
export const getMovementsByOrder = async (orderId) => {
  const { data } = await Client.get(`/stock/orders/${orderId}/movements`);
  return data;
};

/**
 * Menghapus record mutasi stok
 * @param {string} id - ID mutasi
 * @returns {Promise<void>}
 */
export const deleteStockMovement = async (id) => {
  await Client.delete(`/stock/movements/${id}`);
};