import ApiError from "#shared/utils/error.js";
import { Redis } from "@upstash/redis";

const { UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN } = process.env;

/**
 * Validasi environment variables untuk Upstash Redis
 * @throws {ApiError} 500 - Jika UPSTASH_REDIS_URL atau UPSTASH_REDIS_TOKEN tidak diset
 */
if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
  throw ApiError.internal({
    message: "Upstash environment variables are not set. Required: UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN",
  });
}

/**
 * Instance Redis client menggunakan Upstash Redis (REST API-based)
 * 
 * @type {Redis}
 * @description
 * Menggunakan layanan Upstash Redis yang berbasis REST API,
 * cocok untuk environment serverless dan edge functions.
 * 
 * Environment variables yang dibutuhkan:
 * - `UPSTASH_REDIS_URL` - URL endpoint Upstash Redis
 * - `UPSTASH_REDIS_TOKEN` - Token autentikasi untuk mengakses Upstash Redis
 * 
 * @example
 * // Menyimpan data dengan expiry 1 jam
 * await redis.set("session:123", JSON.stringify(userData), { ex: 3600 });
 * 
 * @example
 * // Mengambil data
 * const data = await redis.get("session:123");
 * 
 * @example
 * // Menghapus data
 * await redis.del("session:123");
 * 
 * @see https://docs.upstash.com/redis
 */
const redis = new Redis({
  url: UPSTASH_REDIS_URL,
  token: UPSTASH_REDIS_TOKEN,
});

export default redis;