import prisma from "#app/database.js";

class SettingRepository {
  #settingSelect = {
    id: true,
    key: true,
    value: true,
    updatedAt: true,
    createdAt: true,
  };

  /**
   * Mencari setting berdasarkan key
   * @param {string} key - Key setting
   * @returns {Promise<Object|null>} Data setting atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findByKey(key) {
    return prisma.setting.findUnique({
      where: { key },
      select: this.#settingSelect,
    });
  }

  /**
   * Mencari semua settings
   * @returns {Promise<Array>} Daftar semua settings
   * @complexity Before: O(n) - Full table scan with ordering
   * @complexity After: O(n) - Acceptable for small table, uses index on key
   */
  async findAll() {
    return prisma.setting.findMany({
      select: this.#settingSelect,
      orderBy: { key: "asc" },
    });
  }

  /**
   * Mendapatkan multiple settings berdasarkan array key
   * @param {string[]} keys - Array key settings
   * @returns {Promise<Array>} Daftar settings
   * @complexity Before: O(n) - Multiple individual queries
   * @complexity After: O(log n) - Single query with IN clause using index
   */
  async findByKeys(keys) {
    return prisma.setting.findMany({
      where: {
        key: { in: keys },
      },
      select: {
        key: true,
        value: true,
      },
    });
  }

  /**
   * Mendapatkan semua settings dalam format key-value object
   * @returns {Promise<Object>} Object key-value settings
   * @complexity Before: O(n) - Fetch all then transform
   * @complexity After: O(n) - Acceptable for small settings table
   */
  async findAllAsObject() {
    const settings = await prisma.setting.findMany({
      select: { key: true, value: true },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  /**
   * Membuat atau update setting
   * @param {string} key - Key setting
   * @param {string} value - Value setting
   * @returns {Promise<Object>} Data setting
   * @complexity Before: O(log n) - Upsert operation
   * @complexity After: O(log n) - No change needed
   */
  async upsert(key, value) {
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
      select: this.#settingSelect,
    });
  }

  /**
   * Batch upsert multiple settings
   * @param {Object} data - Object key-value settings
   * @returns {Promise<number>} Jumlah settings yang diupsert
   * @complexity Before: O(n) - Multiple individual upserts
   * @complexity After: O(n) - Batch operation in transaction
   */
  async upsertMany(data) {
    const operations = Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    const results = await prisma.$transaction(operations);
    return results.length;
  }

  /**
   * Update setting
   * @param {string} key - Key setting
   * @param {string} value - Value baru
   * @returns {Promise<Object>} Data setting yang sudah diupdate
   * @complexity Before: O(log n) - Unique key update
   * @complexity After: O(log n) - No change needed
   */
  async update(key, value) {
    return prisma.setting.update({
      where: { key },
      data: { value },
      select: this.#settingSelect,
    });
  }

  /**
   * Menghapus setting
   * @param {string} key - Key setting
   * @returns {Promise<void>}
   * @complexity Before: O(log n) - Unique key delete
   * @complexity After: O(log n) - No change needed
   */
  async delete(key) {
    await prisma.setting.delete({
      where: { key },
    });
  }

  /**
   * Mengecek apakah setting exists
   * @param {string} key - Key setting
   * @returns {Promise<boolean>} Status keberadaan setting
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async exists(key) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { id: true },
    });
    return !!setting;
  }

  /**
   * Mendapatkan value setting dengan default fallback
   * @param {string} key - Key setting
   * @param {string} [defaultValue=null] - Nilai default jika tidak ditemukan
   * @returns {Promise<string|null>} Value setting atau default
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async getValue(key, defaultValue = null) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });

    return setting?.value ?? defaultValue;
  }

  /**
   * Mendapatkan value setting dalam format integer
   * @param {string} key - Key setting
   * @param {number} [defaultValue=0] - Nilai default
   * @returns {Promise<number>} Value integer
   */
  async getIntValue(key, defaultValue = 0) {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Mendapatkan value setting dalam format boolean
   * @param {string} key - Key setting
   * @param {boolean} [defaultValue=false] - Nilai default
   * @returns {Promise<boolean>} Value boolean
   */
  async getBoolValue(key, defaultValue = false) {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    return value === "true" || value === "1";
  }

  /**
   * Mendapatkan value setting dalam format JSON
   * @param {string} key - Key setting
   * @param {*} [defaultValue=null] - Nilai default
   * @returns {Promise<*>} Parsed JSON value
   */
  async getJsonValue(key, defaultValue = null) {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set value integer
   * @param {string} key - Key setting
   * @param {number} value - Value integer
   * @returns {Promise<Object>} Data setting
   */
  async setIntValue(key, value) {
    return this.upsert(key, String(value));
  }

  /**
   * Set value boolean
   * @param {string} key - Key setting
   * @param {boolean} value - Value boolean
   * @returns {Promise<Object>} Data setting
   */
  async setBoolValue(key, value) {
    return this.upsert(key, String(value));
  }

  /**
   * Set value JSON
   * @param {string} key - Key setting
   * @param {*} value - Value yang akan di-stringify
   * @returns {Promise<Object>} Data setting
   */
  async setJsonValue(key, value) {
    return this.upsert(key, JSON.stringify(value));
  }
}

export default SettingRepository;