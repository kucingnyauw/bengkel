import Client from "@lib/client.js";

/**
 * Membuat pembayaran untuk pesanan
 * @param {Object} payload
 * @param {string} payload.orderId - ID pesanan
 * @param {string} payload.method - Metode pembayaran (CASH/QRIS)
 * @param {number} [payload.amountPaid] - Jumlah yang dibayarkan (wajib untuk CASH)
 * @returns {Promise<Object>} Data pembayaran (CASH: invoice, QRIS: QR code)
 */
export const createPayment = async (payload) => {
  const { data } = await Client.post("/payments", payload);
  return data;
};

/**
 * Mendapatkan status pembayaran QRIS dari Midtrans
 * @param {string} orderId - ID pesanan
 * @returns {Promise<Object>} Status pembayaran dari Midtrans
 */
export const getPaymentStatus = async (orderId) => {
  const { data } = await Client.get(`/payments/order/${orderId}/status`);
  return data;
};

/**
 * Refund pembayaran
 * @param {string} id - ID pembayaran
 * @param {Object} [payload]
 * @param {string} [payload.reason] - Alasan refund
 * @returns {Promise<Object>} Data pembayaran yang direfund
 */
export const refundPayment = async (id, payload) => {
  const { data } = await Client.post(`/payments/${id}/refund`, payload);
  return data;
};

/**
 * Mendapatkan daftar pembayaran dengan paginasi dan filter
 * @param {Object} [params]
 * @param {number} [params.page] - Nomor halaman
 * @param {number} [params.limit] - Jumlah per halaman
 * @param {string} [params.orderId] - Filter berdasarkan ID pesanan
 * @param {string} [params.status] - Filter berdasarkan status (PENDING/PAID/REFUNDED)
 * @param {string} [params.method] - Filter berdasarkan metode (CASH/QRIS)
 * @param {string} [params.startDate] - Filter tanggal mulai
 * @param {string} [params.endDate] - Filter tanggal akhir
 * @returns {Promise<{data: Array, metadata: Object}>} Object berisi data dan metadata
 */
export const getPayments = async (params) => {
  const response = await Client.get("/payments", { params });
  return { data: response.data, metadata: response.metadata };

  
};

/**
 * Mendapatkan pembayaran berdasarkan ID
 * @param {string} id - ID pembayaran
 * @returns {Promise<Object>} Data pembayaran
 */
export const getPaymentById = async (id) => {
  const { data } = await Client.get(`/payments/${id}`);
  return data;
};

/**
 * Mendapatkan pembayaran berdasarkan ID pesanan
 * @param {string} orderId - ID pesanan
 * @returns {Promise<Object>} Data pembayaran
 */
export const getPaymentByOrder = async (orderId) => {
  const { data } = await Client.get(`/payments/order/${orderId}`);
  return data;
};