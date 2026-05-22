import supabase from "#lib/supabase.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import CacheManager from "#shared/utils/cache.js";
import logger from "#app/logger.js";

const userRepo = new UserRepository();

const userCache = new CacheManager("auth:user");

/**
 * Mendapatkan user Supabase berdasarkan access token
 *
 * @param {string} token
 * @returns {Promise<Object>}
 * @throws {ApiError}
 */
const getSupabaseUser = async (token) => {
  try {
    logger.info({
      message: "[AUTH] Verify Supabase User",
    });

    const { data, error } =
      await supabase.auth.getUser(token);

    logger.info({
      message: "[AUTH] Supabase Response",
      hasUser: !!data?.user,
      hasError: !!error,
    });

    /**
     * Supabase Error
     */
    if (error) {
      logger.error({
        message: "[AUTH] Supabase Error",
        error: error.message,
      });

      const errorMessage =
        error.message?.toLowerCase() || "";

      /**
       * Invalid / Expired Session
       */
      if (
        errorMessage.includes("jwt") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid")
      ) {
        throw ApiError.unauthorized({
          code: "SESSION_EXPIRED",
          message:
            "Sesi login Anda sudah berakhir. Silakan login kembali.",
        });
      }

      /**
       * Auth Service Error
       */
      throw ApiError.serviceUnavailable({
        code: "AUTH_SERVICE_UNAVAILABLE",
        message:
          "Layanan autentikasi sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
      });
    }

    /**
     * No User
     */
    if (!data?.user) {
      throw ApiError.unauthorized({
        code: "INVALID_SESSION",
        message:
          "Sesi login tidak valid. Silakan login kembali.",
      });
    }

    return data.user;
  } catch (err) {
    /**
     * ApiError passthrough
     */
    if (err instanceof ApiError) {
      throw err;
    }

    logger.error({
      message: "[AUTH] Unexpected Error",
      error: err.message,
    });

    /**
     * Network / Connectivity Error
     */
    throw ApiError.serviceUnavailable({
      code: "NETWORK_ERROR",
      message:
        "Tidak dapat terhubung ke layanan autentikasi. Periksa koneksi internet Anda lalu coba kembali.",
    });
  }
};

/**
 * Mendapatkan user database dengan cache
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const getUserByEmail = async (email) => {
  const cacheKey = `email:${email}`;

  /**
   * Check Cache
   */
  const cached =
    await userCache.get(cacheKey);

  if (cached) {
    logger.info({
      message: "[AUTH] User Cache Hit",
      email,
    });

    return cached;
  }

  logger.info({
    message: "[AUTH] Fetch User From Database",
    email,
  });

  const user =
    await userRepo.findByEmail(email);

  /**
   * Save Cache
   */
  if (user) {
    await userCache.set(
      cacheKey,
      user,
      3600
    );

    logger.info({
      message: "[AUTH] User Cached",
      email,
    });
  }

  return user;
};

/**
 * Middleware autentikasi JWT Supabase
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
const authMiddleware = async (
  req,
  res,
  next
) => {
  try {
    logger.info({
      message: "[AUTH] Incoming Request",
      method: req.method,
      path: req.originalUrl,
    });

    /**
     * Authorization Header
     */
    const authHeader =
      req.headers.authorization;

    logger.info({
      message: "[AUTH] Authorization Header",
      exists: !!authHeader,
    });

    /**
     * No Authorization Header
     */
    if (!authHeader) {
      throw ApiError.unauthorized({
        code: "UNAUTHORIZED",
        message:
          "Anda perlu login untuk melanjutkan.",
      });
    }

    /**
     * Extract Bearer Token
     */
    const token =
      authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    logger.info({
      message: "[AUTH] Access Token",
      exists: !!token,
    });

    /**
     * No Token
     */
    if (!token) {
      throw ApiError.unauthorized({
        code: "INVALID_TOKEN",
        message:
          "Token autentikasi tidak valid.",
      });
    }

    /**
     * Verify Supabase User
     */
    const supabaseUser =
      await getSupabaseUser(token);

    logger.info({
      message: "[AUTH] Supabase User Verified",
      email: supabaseUser.email,
    });

    /**
     * Get Application User
     */
    const user =
      await getUserByEmail(
        supabaseUser.email
      );

    /**
     * User Not Found
     */
    if (!user) {
      throw ApiError.unauthorized({
        code: "USER_NOT_FOUND",
        message:
          "Akun pengguna tidak ditemukan.",
      });
    }

    /**
     * User Inactive
     */
    if (!user.isActive) {
      throw ApiError.forbidden({
        code: "ACCOUNT_INACTIVE",
        message:
          "Akun Anda saat ini tidak aktif. Silakan hubungi administrator.",
      });
    }

    /**
     * Attach User
     */
    req.user = user;

    logger.info({
      message:
        "[AUTH] Authentication Success",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (err) {
    logger.error({
      message:
        "[AUTH] Authentication Failed",
      error: err.message,
      code: err.code || null,
      statusCode:
        err.statusCode || 500,
      path: req.originalUrl,
      method: req.method,
    });

    next(err);
  }
};

export default authMiddleware;