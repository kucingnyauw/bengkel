import supabase from "#lib/supabase.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import CacheManager from "#shared/utils/cache.js";
import { isDev } from "#config/env.js";

const userRepo = new UserRepository();
const userCache = new CacheManager("auth:user");

/**
 * Mendapatkan user dari Supabase berdasarkan token
 * @param {string} token - JWT token dari Supabase
 * @returns {Promise<Object|null>} Supabase user atau null jika gagal
 */
const getSupabaseUser = async (token) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
};

/**
 * Mendapatkan user dari database dengan cache (TTL 1 jam)
 * @param {string} email - Email user
 * @returns {Promise<Object|null>} User dari database atau null
 */
const getUserByEmail = async (email) => {
  const cacheKey = `email:${email}`;

  const cached = await userCache.get(cacheKey);
  if (cached) return cached;

  const user = await userRepo.findByEmail(email);

  if (user) {
    await userCache.set(cacheKey, user, 3600);
  }

  return user;
};

/**
 * Mendapatkan superadmin untuk environment development
 * @param {import("express").Request} req - Express request object
 * @returns {Promise<Object>} User superadmin dari database
 * @throws {ApiError} Unauthorized jika superadmin tidak ditemukan
 */
const getDevUser = async (req) => {
  const devEmail = req.headers["x-dev-email"] || "rifkyf589@gmail.com";

  const user = await getUserByEmail(devEmail);

  if (!user) {
    throw ApiError.unauthorized({
      message: "User dev tidak ditemukan",
    });
  }

  // if (user.role !== "SUPERADMIN") {
  //   throw ApiError.unauthorized({
  //     message: "User dev harus SUPERADMIN",
  //   });
  // }

  return user;
};

/**
 * Middleware untuk autentikasi menggunakan Supabase JWT token dengan caching
 * Di development, bisa menggunakan akun superadmin default tanpa token
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 * @param {import("express").NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {ApiError} Unauthorized jika token tidak valid, user tidak ditemukan, atau tidak aktif
 */
const authMiddleware = async (req, res, next) => {
  try {
    if (isDev) {
      const user = await getDevUser(req);

      if (!user.isActive) {
        throw ApiError.unauthorized({
          message: "Akun pengguna tidak aktif",
        });
      }

      req.user = user;
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized({
        message: "Authorization header tidak ditemukan",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      throw ApiError.unauthorized({
        message: "Token tidak ditemukan",
      });
    }

    const supabaseUser = await getSupabaseUser(token);

    if (!supabaseUser?.email) {
      throw ApiError.unauthorized({
        message: "Sesi tidak valid atau sudah berakhir",
      });
    }

    const user = await getUserByEmail(supabaseUser.email);

    if (!user) {
      throw ApiError.unauthorized({
        message: "Pengguna tidak ditemukan",
      });
    }

    if (!user.isActive) {
      throw ApiError.unauthorized({
        message: "Akun pengguna tidak aktif",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export default authMiddleware;