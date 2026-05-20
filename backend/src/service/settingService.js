import SettingRepository from "#repository/settingRepository.js";

/**
 * Service untuk mengelola settings aplikasi
 * @class SettingService
 */
class SettingService {
  constructor() {
    this.settingRepo = new SettingRepository();
    this.cache = new Map();
  }

  /**
   * Mendapatkan nilai setting
   * @param {string} key - Key setting
   * @param {*} defaultValue - Nilai default jika tidak ditemukan
   * @returns {Promise<*>} Nilai setting
   */
  async get(key, defaultValue = null) {
    if (this.cache.has(key)) return this.cache.get(key);

    const setting = await this.settingRepo.findByKey(key);
    const value = setting ? setting.value : defaultValue;

    this.cache.set(key, value);
    return value;
  }

  /**
   * Mendapatkan nilai setting sebagai number
   * @param {string} key - Key setting
   * @param {number} defaultValue - Nilai default
   * @returns {Promise<number>}
   */
  async getNumber(key, defaultValue = 0) {
    return Number(await this.get(key, defaultValue));
  }

  /**
   * Mendapatkan nilai setting sebagai boolean
   * @param {string} key - Key setting
   * @param {boolean} defaultValue - Nilai default
   * @returns {Promise<boolean>}
   */
  async getBoolean(key, defaultValue = false) {
    const value = await this.get(key, defaultValue);
    return value === "true" || value === true;
  }

  /**
   * Mendapatkan nilai setting sebagai string
   * @param {string} key - Key setting
   * @param {string} defaultValue - Nilai default
   * @returns {Promise<string>}
   */
  async getString(key, defaultValue = "") {
    return String(await this.get(key, defaultValue));
  }

  /**
   * Menyimpan atau mengupdate setting
   * @param {string} key - Key setting
   * @param {*} value - Nilai setting
   * @returns {Promise<Object>}
   */
  async set(key, value) {
    this.cache.delete(key);
    return this.settingRepo.upsert(key, String(value));
  }

  /**
   * Menghapus cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Mendapatkan semua settings
   * @returns {Promise<Array>}
   */
  async getAll() {
    return this.settingRepo.findAll();
  }

  /**
   * Menghapus setting
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) {
    this.cache.delete(key);
    await this.settingRepo.delete(key);
  }
}

export default SettingService;