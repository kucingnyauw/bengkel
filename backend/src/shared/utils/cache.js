import redis from "#lib/redis.js";

/**
 * Cache Manager dengan dukungan namespacing, indexing, dan distributed locking
 * 
 * @class CacheManager
 * @description
 * Menyediakan utilitas untuk mengelola cache Redis dengan fitur:
 * - Namespacing cache menggunakan prefix
 * - Auto-indexing untuk memudahkan invalidation
 * - Serialisasi/deserialisasi JSON otomatis
 * - Distributed locking untuk mencegah race condition
 * 
 * @example
 * const userCache = new CacheManager("user");
 * await userCache.set("profile:123", { name: "John" }, 3600);
 * const data = await userCache.get("profile:123");
 */
class CacheManager {
  /**
   * Membuat instance CacheManager dengan prefix namespace
   * @param {string} prefix - Prefix namespace untuk cache (wajib)
   * @throws {Error} Jika prefix tidak diisi
   */
  constructor(prefix) {
    if (!prefix) {
      throw new Error("Prefix cache wajib diisi untuk membedakan namespace cache.");
    }

    this.prefix = prefix;
    this.indexKey = `${prefix}:__index__`;
  }

  /**
   * Membangun full cache key dengan prefix namespace
   * @param {string} key - Cache key (tanpa prefix)
   * @returns {string} Full cache key dengan format `{prefix}:{key}`
   * @throws {Error} Jika key kosong
   * @private
   */
  buildKey(key) {
    if (!key) {
      throw new Error("Cache key tidak boleh kosong.");
    }
    return `${this.prefix}:${key}`;
  }

  /**
   * Mengambil data dari cache
   * @param {string} key - Cache key (tanpa prefix)
   * @returns {Promise<Object|string|null>} Data yang tersimpan atau null jika tidak ditemukan. Otomatis parse JSON, jika gagal mengembalikan string mentah.
   * @example
   * const user = await userCache.get("profile:123");
   * const token = await authCache.get("refresh:token");
   */
  async get(key) {
    const fullKey = this.buildKey(key);
    const data = await redis.get(fullKey);
    
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Menyimpan data ke cache dengan TTL
   * @param {string} key - Cache key (tanpa prefix)
   * @param {Object|string|number|boolean} value - Data yang akan disimpan (non-string akan di-serialize ke JSON)
   * @param {number} [ttlSeconds=60] - Time-to-live dalam detik
   * @returns {Promise<void>}
   * @example
   * await cache.set("session:abc", { userId: "123" }, 3600);
   * await cache.set("token", "xyz123");
   */
  async set(key, value, ttlSeconds = 60) {
    const fullKey = this.buildKey(key);

    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);

    await redis.set(fullKey, serialized, { ex: ttlSeconds });
    await redis.sadd(this.indexKey, fullKey);
  }

  /**
   * Invalidasi (menghapus) cache berdasarkan pattern
   * @param {string} pattern - Pattern string untuk filter key yang akan dihapus
   * @returns {Promise<void>}
   * @description Mencari semua key dalam namespace yang mengandung pattern, lalu menghapusnya dari Redis dan index
   * @example
   * await cache.invalidate("user:profile");
   */
  async invalidate(pattern) {
    const keys = await redis.smembers(this.indexKey);
    if (!keys?.length) return;

    const toDelete = keys.filter((k) => k.includes(pattern));

    if (toDelete.length) {
      await redis.del(toDelete);
      await redis.srem(this.indexKey, ...toDelete);
    }
  }

  /**
   * Invalidasi (menghapus) seluruh cache dalam namespace ini
   * @returns {Promise<void>}
   * @description Menghapus semua key yang terdaftar di index dan mereset index key
   * @example
   * await cache.invalidateAll();
   */
  async invalidateAll() {
    const keys = await redis.smembers(this.indexKey);

    if (keys?.length) {
      await redis.del(keys);
      await redis.del(this.indexKey);
    }
  }

  /**
   * Mendapatkan distributed lock untuk mencegah race condition
   * @param {string} key - Kunci untuk lock
   * @param {number} [ttlSeconds=10] - Durasi lock dalam detik
   * @returns {Promise<{lockKey: string, token: string}|null>} Object lock berisi lockKey dan token, atau null jika gagal mendapatkan lock
   * @description Menggunakan mekanisme NX (set only if not exists) untuk memastikan hanya satu proses yang mendapat lock
   * @example
   * const lock = await cache.acquireLock("order:123", 30);
   * if (lock) {
   *   try {
   *     await processOrder();
   *   } finally {
   *     await cache.releaseLock(lock);
   *   }
   * }
   */
  async acquireLock(key, ttlSeconds = 10) {
    const lockKey = this.buildKey(`lock:${key}`);
    const token = crypto.randomUUID();

    const result = await redis.set(lockKey, token, {
      nx: true,
      ex: ttlSeconds,
    });

    if (!result) {
      return null;
    }

    return { lockKey, token };
  }

  /**
   * Melepaskan distributed lock
   * @param {{lockKey: string, token: string}|null} lock - Object lock yang didapat dari acquireLock()
   * @returns {Promise<void>}
   * @description Hanya menghapus lock jika token masih cocok (mencegah penghapusan lock milik proses lain)
   * @example
   * await cache.releaseLock(lock);
   */
  async releaseLock(lock) {
    if (!lock) return;

    const current = await redis.get(lock.lockKey);

    if (current === lock.token) {
      await redis.del(lock.lockKey);
    }
  }
}

export default CacheManager;