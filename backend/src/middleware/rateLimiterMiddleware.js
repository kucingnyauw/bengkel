// #middleware/rateLimiterMiddleware.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import ApiError from "#shared/utils/error.js";

/**
 * Rate Limiter Middleware
 *
 * Membatasi jumlah request client dalam periode waktu tertentu.
 *
 * Default identifier:
 * - Authenticated: user.id
 * - Guest: normalized IP (IPv4/IPv6 safe)
 */
const rateLimiterMiddleware = (options = {}) => {
  const {
    windowMs = 60_000,
    max = 100,
    message,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator,
    skip,
  } = options;

  const safeKeyGenerator = (req) => {
    if (typeof keyGenerator === "function") {
      return keyGenerator(req);
    }

    return req.user?.id || ipKeyGenerator(req.ip);
  };

  return rateLimit({
    windowMs,
    max,

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: safeKeyGenerator,

    ...(skip && { skip }),

    skipFailedRequests,
    skipSuccessfulRequests,

    handler: (req, res, next, limiterOptions) => {
      const retryAfter = Math.ceil(limiterOptions.windowMs / 1000);

      res.set("Retry-After", String(retryAfter));

      return next(
        ApiError.tooManyRequests({
          message:
            message ||
            `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`,
        })
      );
    },
  });
};

export default rateLimiterMiddleware;