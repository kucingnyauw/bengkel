import Client from "@lib/client.js";

/**
 * Membuat customer baru
 * @param {Object} payload
 * @param {string} payload.name - Nama customer
 * @param {string} [payload.phone] - Nomor telepon customer
 * @returns {Promise<Object>} Data customer yang dibuat
 */
export const createCustomer = async (payload) => {
  const { data } = await Client.post("/customers", payload);
  return data;
};

/**
 * Upsert customer berdasarkan nomor telepon
 * @param {Object} payload
 * @param {string} payload.name - Nama customer
 * @param {string} payload.phone - Nomor telepon customer
 * @returns {Promise<Object>} Data customer hasil upsert
 */
export const upsertCustomer = async (payload) => {
  const { data } = await Client.put("/customers/upsert", payload);
  return data;
};

/**
 * Mendapatkan daftar customer dengan paginasi dan filter
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.search] - Pencarian berdasarkan nama atau telepon
 * @returns {Promise<Object>} Object berisi data dan metadata
 */
export const getCustomers = async (params) => {
  const response = await Client.get("/customers", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan customer berdasarkan ID
 * @param {string} id - ID customer
 * @returns {Promise<Object>} Data customer
 */
export const getCustomerById = async (id) => {
  const { data } = await Client.get(`/customers/${id}`);
  return data;
};

/**
 * Mendapatkan customer berdasarkan nomor telepon
 * @param {string} phone - Nomor telepon customer
 * @returns {Promise<Object>} Data customer
 */
export const getCustomerByPhone = async (phone) => {
  const { data } = await Client.get(`/customers/phone/${phone}`);
  return data;
};

/**
 * Mengecek ketersediaan nomor telepon
 * @param {string} phone - Nomor telepon yang dicek
 * @param {string} [excludeId] - ID customer yang dikecualikan
 * @returns {Promise<Object>} Hasil pengecekan
 */
export const checkPhoneAvailability = async (phone, excludeId = null) => {
  const { data } = await Client.get("/customers/phone/check", {
    params: { phone, excludeId },
  });
  return data;
};

/**
 * Mengupdate data customer
 * @param {string} id - ID customer
 * @param {Object} payload
 * @param {string} [payload.name] - Nama baru
 * @param {string} [payload.phone] - Nomor telepon baru
 * @returns {Promise<Object>} Data customer yang diupdate
 */
export const updateCustomer = async (id, payload) => {
  const { data } = await Client.put(`/customers/${id}`, payload);
  return data;
};

/**
 * Menghapus customer
 * @param {string} id - ID customer
 * @returns {Promise<void>}
 */
export const deleteCustomer = async (id) => {
  await Client.delete(`/customers/${id}`);
};