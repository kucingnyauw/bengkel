import Client from "@lib/client.js";

/**
 * Menugaskan mekanik ke semua item service dalam order (QUEUED)
 * @param {string} orderId - ID pesanan
 * @param {string} mechanicId - ID mekanik
 * @returns {Promise<Object>} Response API
 */
export const assignMechanicToOrder = async (orderId, mechanicId) => {
  const { data } = await Client.post("/tasks/assign", { orderId, mechanicId });
  return data;
};

/**
 * Bulk assign mekanik ke banyak order
 * @param {Array<{orderId: string, mechanicId: string}>} assignments - Daftar assignment
 * @returns {Promise<Object>} Response API
 */
export const bulkAssignMechanics = async (assignments) => {
  const { data } = await Client.post("/tasks/bulk-assign", { assignments });
  return data;
};

/**
 * Membatalkan penugasan mekanik dari order
 * @param {string} orderId - ID order
 * @returns {Promise<Object>} Response API
 */
export const unassignMechanicFromOrder = async (orderId) => {
  const { data } = await Client.post(`/tasks/order/${orderId}/unassign`);
  return data;
};

/**
 * Memulai pengerjaan semua tugas dalam order
 * @param {string} orderId - ID order
 * @returns {Promise<Object>} Response API
 */
export const startOrder = async (orderId) => {
  const { data } = await Client.post(`/tasks/order/${orderId}/start`);
  return data;
};

/**
 * Menyelesaikan semua tugas dalam order
 * @param {string} orderId - ID order
 * @returns {Promise<Object>} Response API
 */
export const completeOrder = async (orderId) => {
  const { data } = await Client.post(`/tasks/order/${orderId}/complete`);
  return data;
};

/**
 * Mendapatkan daftar task dengan paginasi dan filter
 * @param {Object} [params]
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getTasks = async (params) => {
  const response = await Client.get("/tasks", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan task mekanik yang sedang login
 * @param {Object} [params]
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getMyTasks = async (params) => {
  const response = await Client.get("/tasks/me", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan riwayat task mekanik yang sedang login
 * @param {Object} [params]
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getMyTaskHistory = async (params) => {
  const response = await Client.get("/tasks/me/history", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan task yang belum ditugaskan
 * @param {Object} [params]
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getUnassignedTasks = async (params) => {
  const response = await Client.get("/tasks/unassigned", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan daftar mekanik yang tersedia dengan paginasi
 * @param {Object} [params]
 * @returns {Promise<{data: Array, metadata: Object}>}
 */
export const getAvailableMechanics = async (params) => {
  const response = await Client.get("/tasks/mechanics/available", { params });
  return { data: response.data, metadata: response.metadata };
};

/**
 * Mendapatkan task berdasarkan mekanik
 * @param {string} mechanicId - ID mekanik
 * @param {Object} [params]
 * @returns {Promise<Object>} Response API
 */
export const getTasksByMechanic = async (mechanicId, params) => {
  const { data } = await Client.get(`/tasks/mechanic/${mechanicId}`, { params });
  return data;
};

/**
 * Mendapatkan semua task dalam satu order (grouped dengan detail)
 * @param {string} orderId - ID order
 * @returns {Promise<Object>} Response API
 */
export const getTasksByOrderId = async (orderId) => {
  const { data } = await Client.get(`/tasks/order/${orderId}`);
  return data;
};

/**
 * Mendapatkan task berdasarkan order item
 * @param {string} orderItemId - ID order item
 * @returns {Promise<Object>} Response API
 */
export const getTasksByOrderItem = async (orderItemId) => {
  const { data } = await Client.get(`/tasks/order-item/${orderItemId}`);
  return data;
};

/**
 * Mengecek apakah mekanik sudah ditugaskan ke item pesanan
 * @param {string} orderItemId - ID order item
 * @returns {Promise<Object>} Response API
 */
export const checkMechanicAssigned = async (orderItemId) => {
  const { data } = await Client.get(`/tasks/order-item/${orderItemId}/check`);
  return data;
};

/**
 * Mendapatkan task berdasarkan ID
 * @param {string} id - ID assignment
 * @returns {Promise<Object>} Response API
 */
export const getTaskById = async (id) => {
  const { data } = await Client.get(`/tasks/${id}`);
  return data;
};