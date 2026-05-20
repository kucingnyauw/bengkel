import Client from "@lib/client.js";

/**
 * Membuat pengeluaran baru dengan optional bukti pembayaran
 * @param {FormData} formData - Form data berisi field pengeluaran dan file bukti
 * @returns {Promise<Object>} Data pengeluaran yang dibuat
 */
export const createExpense = async (formData) => {
  const { data } = await Client.post("/expenses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * Mendapatkan daftar pengeluaran dengan paginasi dan filter
 * @param {Object} [params]
 * @returns {Promise<Object>} Object berisi data dan metadata
 */
export const getExpenses = async (params) => {
  const response = await Client.get("/expenses", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan pengeluaran berdasarkan kasir yang login
 * @param {Object} [params]
 * @returns {Promise<Object>} Object berisi data dan metadata
 */
export const getCashierExpenses = async (params) => {
  const response = await Client.get("/expenses/cashier", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan pengeluaran berdasarkan ID
 * @param {string} id - ID pengeluaran
 * @returns {Promise<Object>} Data pengeluaran
 */
export const getExpenseById = async (id) => {
  const { data } = await Client.get(`/expenses/${id}`);
  return data;
};

/**
 * Mendapatkan pengeluaran berdasarkan shift
 * @param {string} shiftId - ID shift
 * @returns {Promise<Object>} Data pengeluaran dalam shift
 */
export const getExpensesByShift = async (shiftId) => {
  const { data } = await Client.get(`/expenses/shift/${shiftId}`);
  return data;
};

/**
 * Mengupdate pengeluaran dengan optional bukti pembayaran
 * @param {string} id - ID pengeluaran
 * @param {FormData} formData - Form data berisi field yang diupdate dan file bukti
 * @returns {Promise<Object>} Data pengeluaran yang diupdate
 */
export const updateExpense = async (id, formData) => {
  const { data } = await Client.put(`/expenses/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * Menghapus pengeluaran
 * @param {string} id - ID pengeluaran
 * @returns {Promise<void>}
 */
export const deleteExpense = async (id) => {
  await Client.delete(`/expenses/${id}`);
};