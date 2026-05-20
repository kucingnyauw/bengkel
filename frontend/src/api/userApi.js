import Client from "@lib/client.js";

/**
 * API untuk mengelola data user
 * @module api/userApi
 */

/**
 * Membuat user baru (hanya CASHIER & MECHANIC)
 * @param {Object} payload - Data user
 * @param {string} payload.email - Email user
 * @param {string} payload.fullName - Nama lengkap
 * @param {string} [payload.phone] - Nomor telepon
 * @param {string} [payload.role="CASHIER"] - Role user
 * @returns {Promise<Object>} Data user yang berhasil dibuat
 */
export const createUser = async (payload) => {
  const { data } = await Client.post("/users", payload);
  return data;
};

/**
 * Generate ulang Magic Link untuk user
 * @param {string} id - ID user
 * @returns {Promise<Object>} Status pengiriman Magic Link
 */
export const resendMagicLink = async (id) => {
  const { data } = await Client.post(`/users/${id}/resend-magic-link`);
  return data;
};

/**
 * Mendapatkan data user yang sedang login
 * @returns {Promise<Object>} Data user saat ini
 */
export const getCurrentUser = async () => {
  const { data } = await Client.get("/users/me", { skipError: true });
  return data;
};

/**
 * Validasi email user untuk autentikasi
 * @param {string} email - Email yang akan divalidasi
 * @returns {Promise<Object>} Data validasi email
 */
export const validateUserEmail = async (email) => {
  const { data } = await Client.post("/auth/validate/email", { email });
  return data;
};

/**
 * Mendapatkan daftar user dengan filter dan paginasi
 * @param {Object} [params] - Parameter query
 * @param {number} [params.page=1] - Nomor halaman
 * @param {number} [params.limit=10] - Jumlah item per halaman
 * @param {string} [params.search] - Pencarian berdasarkan nama atau email
 * @param {string} [params.role] - Filter berdasarkan role
 * @param {boolean} [params.isActive] - Filter status aktif
 * @returns {Promise<{data: Array, metadata: Object}>} Daftar user
 */
export const getUsers = async (params) => {
  const response = await Client.get("/users", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan user berdasarkan ID
 * @param {string} id - ID user
 * @returns {Promise<Object>} Data user
 */
export const getUserById = async (id) => {
  const { data } = await Client.get(`/users/${id}`);
  return data;
};

/**
 * Mendapatkan user berdasarkan email
 * @param {string} email - Email user
 * @returns {Promise<Object>} Data user
 */
export const getUserByEmail = async (email) => {
  const { data } = await Client.get(`/users/email/${email}`);
  return data;
};

/**
 * Mendapatkan user berdasarkan nomor telepon
 * @param {string} phone - Nomor telepon
 * @returns {Promise<Object>} Data user
 */
export const getUserByPhone = async (phone) => {
  const { data } = await Client.get(`/users/phone/${phone}`);
  return data;
};

/**
 * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
 * @param {Object} [params] - Parameter query
 * @param {number} [params.page=1] - Nomor halaman
 * @param {number} [params.limit=10] - Jumlah item per halaman
 * @param {string} [params.search] - Pencarian berdasarkan nama atau email
 * @param {string} [params.role] - Filter role spesifik (CASHIER/MECHANIC)
 * @param {boolean} [params.isActive] - Filter status aktif
 * @returns {Promise<{data: Array, metadata: Object}>} Daftar karyawan
 */
export const getEmployees = async (params) => {
  const response = await Client.get("/users/employees", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan daftar admin
 * @returns {Promise<Array>} Daftar admin
 */
export const getAdmins = async () => {
  const { data } = await Client.get("/users/admins");
  return data;
};

/**
 * Mendapatkan user berdasarkan role
 * @param {string} role - Role user (SUPERADMIN/ADMIN/CASHIER/MECHANIC)
 * @returns {Promise<Array>} Daftar user
 */
export const getUsersByRole = async (role) => {
  const { data } = await Client.get(`/users/role/${role}`);
  return data;
};

/**
 * Mengecek ketersediaan email
 * @param {string} email - Email yang dicek
 * @param {string} [excludeId=null] - ID user yang dikecualikan
 * @returns {Promise<Object>} Status ketersediaan email
 */
export const checkEmailExists = async (email, excludeId = null) => {
  const { data } = await Client.get("/users/check/email", {
    params: { email, excludeId },
  });
  return data;
};

/**
 * Mengecek ketersediaan nomor telepon
 * @param {string} phone - Nomor telepon yang dicek
 * @param {string} [excludeId=null] - ID user yang dikecualikan
 * @returns {Promise<Object>} Status ketersediaan nomor telepon
 */
export const checkPhoneExists = async (phone, excludeId = null) => {
  const { data } = await Client.get("/users/check/phone", {
    params: { phone, excludeId },
  });
  return data;
};

/**
 * Memperbarui data user
 * @param {string} id - ID user
 * @param {Object} payload - Data yang akan diupdate
 * @param {string} [payload.fullName] - Nama lengkap
 * @param {string} [payload.phone] - Nomor telepon
 * @param {string} [payload.role] - Role user
 * @param {boolean} [payload.isActive] - Status aktif
 * @returns {Promise<Object>} User yang sudah diupdate
 */
export const updateUser = async (id, payload) => {
  const { data } = await Client.put(`/users/${id}`, payload);
  return data;
};

/**
 * Menghapus user
 * @param {string} id - ID user
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  await Client.delete(`/users/${id}`);
};