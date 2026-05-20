import Client from "@lib/client.js";

/**
 * Mendapatkan semua settings
 * @returns {Promise<Object>} Object berisi data settings
 */
export const getSettings = async () => {
  const { data } = await Client.get("/settings");
  return data;
};

/**
 * Mendapatkan setting berdasarkan key
 * @param {string} key - Key setting
 * @returns {Promise<Object>} Object berisi key dan value
 */
export const getSettingByKey = async (key) => {
  const { data } = await Client.get(`/settings/${key}`);
  return data;
};

/**
 * Update satu setting
 * @param {string} key - Key setting
 * @param {string} value - Nilai baru
 * @returns {Promise<Object>} Data setting yang diupdate
 */
export const updateSetting = async (key, value) => {
  const { data } = await Client.put(`/settings/${key}`, { value });
  return data;
};

/**
 * Bulk update settings
 * @param {Array<{key: string, value: string}>} settings - Array settings
 * @returns {Promise<Object>} Data settings yang diupdate
 */
export const bulkUpdateSettings = async (settings) => {
  const { data } = await Client.put("/settings", { settings });
  return data;
};