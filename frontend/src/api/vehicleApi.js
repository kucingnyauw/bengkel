import Client from "@lib/client.js";

/**
 * Mendaftarkan kendaraan baru
 * @param {Object} payload
 * @param {string} payload.plateNumber - Nomor plat kendaraan
 * @param {string} payload.customerId - ID customer
 * @param {string} [payload.brand] - Merek kendaraan
 * @param {string} [payload.model] - Model kendaraan
 * @returns {Promise<Object>} Data kendaraan yang didaftarkan
 */
export const registerVehicle = async (payload) => {
  const { data } = await Client.post("/vehicles", payload);
  return data;
};

/**
 * Mendapatkan daftar kendaraan dengan paginasi dan filter
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.search] - Pencarian berdasarkan plat, merek, atau model
 * @param {string} [params.customerId] - Filter berdasarkan customer
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getVehicles = async (params) => {
  const response = await Client.get("/vehicles", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan kendaraan berdasarkan ID
 * @param {string} id - ID kendaraan
 * @returns {Promise<Object>} Data kendaraan
 */
export const getVehicleById = async (id) => {
  const { data } = await Client.get(`/vehicles/${id}`);
  return data;
};

/**
 * Mendapatkan kendaraan berdasarkan plat nomor
 * @param {string} plateNumber - Plat nomor
 * @returns {Promise<Object>} Data kendaraan
 */
export const getVehicleByPlateNumber = async (plateNumber) => {
  const { data } = await Client.get(`/vehicles/plate/${plateNumber}`);
  return data;
};

/**
 * Mencari kendaraan berdasarkan plat nomor (partial match)
 * @param {string} plateNumber - Plat nomor yang dicari
 * @returns {Promise<Array>} Daftar kendaraan
 */
export const searchByPlateNumber = async (plateNumber) => {
  const { data } = await Client.get("/vehicles/plate/search", {
    params: { plateNumber },
  });
  return data;
};

/**
 * Mengecek apakah plat nomor sudah terdaftar
 * @param {string} plateNumber - Plat nomor yang dicek
 * @param {string} [excludeId] - ID kendaraan yang dikecualikan
 * @returns {Promise<Object>} Hasil pengecekan
 */
export const checkPlateNumberExists = async (plateNumber, excludeId = null) => {
  const { data } = await Client.get("/vehicles/plate/check", {
    params: { plateNumber, excludeId },
  });
  return data;
};

/**
 * Mendapatkan kendaraan berdasarkan customer
 * @param {string} customerId - ID customer
 * @returns {Promise<Array>} Daftar kendaraan customer
 */
export const getVehiclesByCustomer = async (customerId) => {
  const { data } = await Client.get(`/vehicles/customer/${customerId}`);
  return data;
};

/**
 * Mengupdate data kendaraan
 * @param {string} id - ID kendaraan
 * @param {Object} payload
 * @param {string} [payload.plateNumber] - Plat nomor baru
 * @param {string} [payload.brand] - Merek baru
 * @param {string} [payload.model] - Model baru
 * @returns {Promise<Object>} Data kendaraan yang diupdate
 */
export const updateVehicle = async (id, payload) => {
  const { data } = await Client.put(`/vehicles/${id}`, payload);
  return data;
};

/**
 * Menghapus kendaraan
 * @param {string} id - ID kendaraan
 * @returns {Promise<void>}
 */
export const deleteVehicle = async (id) => {
  await Client.delete(`/vehicles/${id}`);
};