import Client from "@lib/client.js";

/**
 * Mendapatkan ringkasan penjualan
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data ringkasan penjualan
 */
export const getSalesSummary = async (params) => {
  const { data } = await Client.get("/reports/sales", { params });
  return data;
};

/**
 * Mendapatkan laporan laba rugi
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data laba rugi
 */
export const getProfitLossReport = async (params) => {
  const { data } = await Client.get("/reports/profit-loss", { params });
  return data;
};

/**
 * Mendapatkan laporan inventaris
 * @returns {Promise<Object>} Data snapshot inventaris
 */
export const getInventoryReport = async () => {
  const { data } = await Client.get("/reports/inventory");
  return data;
};

/**
 * Mendapatkan laporan pengeluaran
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data laporan pengeluaran
 */
export const getExpenseReport = async (params) => {
  const { data } = await Client.get("/reports/expenses", { params });
  return data;
};

/**
 * Mendapatkan laporan pembayaran
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data laporan pembayaran
 */
export const getPaymentReport = async (params) => {
  const { data } = await Client.get("/reports/payments", { params });
  return data;
};

/**
 * Mendapatkan ringkasan dashboard
 * @returns {Promise<Object>} Data dashboard
 */
export const getDashboardSummary = async () => {
  const { data } = await Client.get("/reports/dashboard");
  return data;
};

/**
 * Mendapatkan laporan shift
 * @param {string} shiftId - ID shift
 * @returns {Promise<Object>} Data laporan shift
 */
export const getShiftReport = async (shiftId) => {
  const { data } = await Client.get(`/reports/shift/${shiftId}`);
  return data;
};

/**
 * Mendapatkan laporan produk terlaris
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @param {number} [params.limit] - Batas jumlah produk
 * @returns {Promise<Object>} Data produk terlaris
 */
export const getTopProductsReport = async (params) => {
  const { data } = await Client.get("/reports/products/top", { params });
  return data;
};

/**
 * Mendapatkan laporan performa mekanik
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data performa mekanik
 */
export const getMechanicPerformanceReport = async (params) => {
  const { data } = await Client.get("/reports/mechanics/performance", { params });
  return data;
};

/**
 * Mendapatkan statistik tugas mekanik
 * @param {string} mechanicId - ID mekanik
 * @returns {Promise<Object>} Data statistik tugas
 */
export const getMechanicTaskStats = async (mechanicId) => {
  const { data } = await Client.get(`/reports/mechanics/${mechanicId}/tasks`);
  return data;
};

/**
 * Mendapatkan pendapatan mekanik
 * @param {string} mechanicId - ID mekanik
 * @param {Object} [params]
 * @param {string} [params.startDate] - Tanggal mulai
 * @param {string} [params.endDate] - Tanggal akhir
 * @returns {Promise<Object>} Data pendapatan mekanik
 */
export const getMechanicEarnings = async (mechanicId, params) => {
  const { data } = await Client.get(`/reports/mechanics/${mechanicId}/earnings`, { params });
  return data;
};

/**
 * Mendapatkan statistik task per order
 * @param {string} orderId - ID order
 * @returns {Promise<Object>} Data statistik task
 */
export const getTaskStatsByOrder = async (orderId) => {
  const { data } = await Client.get(`/reports/orders/${orderId}/tasks`);
  return data;
};

/**
 * Mendapatkan laporan pergerakan stok
 * @param {string} productId - ID produk
 * @param {Object} params
 * @param {string} params.startDate - Tanggal mulai
 * @param {string} params.endDate - Tanggal akhir
 * @returns {Promise<Object>} Data pergerakan stok
 */
export const getStockMovementReport = async (productId, params) => {
  const { data } = await Client.get(`/reports/stock/${productId}/movements`, { params });
  return data;
};