import supabase from "#lib/supabase.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import CacheManager from "#shared/utils/cache.js";
import logger from "#app/logger.js";

const userRepo = new UserRepository();

const userCache = new CacheManager("auth:user");

const getSupabaseUser = async (token) => {
  try {
    logger.info({
      message: "[AUTH] Verify Supabase User",
    });

    const { data, error } = await supabase.auth.getUser(token);

    logger.info({
      message: "[AUTH] Supabase Response",
      hasUser: !!data?.user,
      hasError: !!error,
    });

    if (error) {
      logger.error({
        message: "[AUTH] Supabase Error",
        error: error.message,
      });

      const errorMessage = error.message?.toLowerCase() || "";

      if (
        errorMessage.includes("jwt") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid")
      ) {
        throw ApiError.unauthorized({
          code: "SESSION_EXPIRED",
          message:
            "Sesi login Anda sudah berakhir. Silakan login kembali untuk melanjutkan.",
        });
      }

      throw ApiError.serviceUnavailable({
        code: "AUTH_SERVICE_UNAVAILABLE",
        message:
          "Layanan autentikasi sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
      });
    }

    if (!data?.user) {
      throw ApiError.unauthorized({
        code: "INVALID_SESSION",
        message:
          "Sesi login tidak valid. Silakan login kembali untuk melanjutkan.",
      });
    }

    return data.user;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    logger.error({
      message: "[AUTH] Unexpected Error",
      error: err.message,
    });

    throw ApiError.serviceUnavailable({
      code: "NETWORK_ERROR",
      message:
        "Tidak dapat terhubung ke layanan autentikasi. Periksa koneksi internet Anda dan coba kembali.",
    });
  }
};

const getUserByEmail = async (email) => {
  const cacheKey = `email:${email}`;

  const cached = await userCache.get(cacheKey);

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

  const user = await userRepo.findByEmail(email);

  if (user) {
    await userCache.set(cacheKey, user, 3600);

    logger.info({
      message: "[AUTH] User Cached",
      email,
    });
  }

  return user;
};

const authMiddleware = async (req, res, next) => {
  try {
    logger.info({
      message: "[AUTH] Incoming Request",
      method: req.method,
      path: req.originalUrl,
    });

    const authHeader = req.headers.authorization;

    logger.info({
      message: "[AUTH] Authorization Header",
      exists: !!authHeader,
    });

    if (!authHeader) {
      throw ApiError.unauthorized({
        code: "UNAUTHORIZED",
        message: "Anda perlu login untuk mengakses halaman ini.",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    logger.info({
      message: "[AUTH] Access Token",
      exists: !!token,
    });

    if (!token) {
      throw ApiError.unauthorized({
        code: "INVALID_TOKEN",
        message: "Format token autentikasi tidak valid. Silakan login kembali.",
      });
    }

    const supabaseUser = await getSupabaseUser(token);

    logger.info({
      message: "[AUTH] Supabase User Verified",
      email: supabaseUser.email,
    });

    const user = await getUserByEmail(supabaseUser.email);

    if (!user) {
      throw ApiError.unauthorized({
        code: "USER_NOT_FOUND",
        message:
          "Akun tidak ditemukan dalam sistem. Silakan hubungi administrator.",
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden({
        code: "ACCOUNT_INACTIVE",
        message:
          "Akun Anda sedang tidak aktif. Silakan hubungi administrator untuk informasi lebih lanjut.",
      });
    }

    if (!user.isAuthenticated) {
      await userRepo.updateAuthStatus(user.id);

      user.isAuthenticated = true;

      logger.info({
        message: "[AUTH] User Auth Status Updated",
        userId: user.id,
        email: user.email,
      });
    }

    req.user = user;

    logger.info({
      message: "[AUTH] Authentication Success",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (err) {
    logger.error({
      message: "[AUTH] Authentication Failed",
      error: err.message,
      code: err.code || null,
      statusCode: err.statusCode || 500,
      path: req.originalUrl,
      method: req.method,
    });

    next(err);
  }
};

export default authMiddleware;
