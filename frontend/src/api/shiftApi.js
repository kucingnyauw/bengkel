import Client from "@lib/client.js";

/**
 * Membuka shift baru untuk kasir yang sedang login
 * @param {Object} payload
 * @param {number} payload.startingCash - Saldo awal kas
 * @returns {Promise<Object>} Data shift yang dibuka
 */
export const openShift = async (payload) => {
  const { data } = await Client.post("/shifts/open", payload);
  return data;
};

/**
 * Menutup shift aktif
 * @param {string} id - ID shift
 * @param {Object} payload
 * @param {number} payload.endingCash - Jumlah kas akhir aktual
 * @returns {Promise<Object>} Data shift yang ditutup
 */
export const closeShift = async (id, payload) => {
  const { data } = await Client.post(`/shifts/${id}/close`, payload);
  return data;
};

/**
 * Mendapatkan shift aktif kasir yang sedang login
 * @returns {Promise<Object|null>} Data shift aktif atau null
 */
export const getActiveShift = async () => {
  const { data } = await Client.get("/shifts/active");
  return data;
};

/**
 * Mengecek apakah kasir memiliki shift aktif
 * @returns {Promise<Object>} Status shift aktif
 */
export const checkActiveShift = async () => {
  const { data } = await Client.get("/shifts/active/check");
  return data;
};

/**
 * Mendapatkan daftar shift dengan paginasi dan filter
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.status] - Filter berdasarkan status
 * @param {string} [params.cashierId] - Filter berdasarkan kasir
 * @param {string} [params.startDate] - Filter tanggal mulai
 * @param {string} [params.endDate] - Filter tanggal akhir
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getShifts = async (params) => {
  const response = await Client.get("/shifts", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan daftar shift kasir yang sedang login
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.status] - Filter berdasarkan status
 * @param {string} [params.startDate] - Filter tanggal mulai
 * @param {string} [params.endDate] - Filter tanggal akhir
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getCashiersShifts = async (params) => {
  const response = await Client.get("/shifts/cashiers", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan shift berdasarkan ID
 * @param {string} id - ID shift
 * @returns {Promise<Object>} Data shift
 */
export const getShiftById = async (id) => {
  const { data } = await Client.get(`/shifts/${id}`);
  return data;
};

/**
 * Mencatat kas masuk
 * @param {string} id - ID shift
 * @param {Object} payload
 * @param {number} payload.amount - Jumlah kas masuk
 * @param {string} [payload.note] - Catatan
 * @returns {Promise<Object>} Data cash flow yang diupdate
 */
export const recordCashIn = async (id, payload) => {
  const { data } = await Client.post(`/shifts/${id}/cash-in`, payload);
  return data;
};

/**
 * Mencatat kas keluar
 * @param {string} id - ID shift
 * @param {Object} payload
 * @param {number} payload.amount - Jumlah kas keluar
 * @param {string} [payload.note] - Catatan
 * @returns {Promise<Object>} Data cash flow yang diupdate
 */
export const recordCashOut = async (id, payload) => {
  const { data } = await Client.post(`/shifts/${id}/cash-out`, payload);
  return data;
};

/**
 * Mendapatkan saran starting cash berdasarkan shift sebelumnya
 * @returns {Promise<Object>} Saran starting cash
 */
export const getStartingCashSuggestion = async () => {
  const { data } = await Client.get("/shifts/starting-cash-suggestion");
  return data;
};

/**
 * Menghitung expected cash shift berdasarkan data sistem
 * @param {string} id - ID shift
 * @returns {Promise<Object>} Detail kalkulasi expected cash
 */
export const getExpectedCash = async (id) => {
  const { data } = await Client.get(`/shifts/${id}/expected-cash`);
  return data;
};