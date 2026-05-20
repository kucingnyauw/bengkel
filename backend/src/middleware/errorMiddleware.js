import { isDev } from "#config/env.js";
import logger from "#app/logger.js";
import ApiError from "#shared/utils/error.js";

/**
 * Middleware penanganan error terpusat.
 * Menangani berbagai jenis error termasuk Prisma, Supabase, Redis, dan timeout.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorMiddleware = (err, req, res, next) => {
  const isApiError = err instanceof ApiError;

  let statusCode = isApiError ? err.statusCode : 500;
  let message = isApiError ? err.message : "Terjadi kesalahan pada sistem";

  if (!isApiError) {
    const errorStack = err.stack || "";
    const errorMessage = err.message || "";

    if (err.code?.startsWith("P")) {
      statusCode = 503;
      message = "Layanan database sedang tidak tersedia. Silakan coba beberapa saat lagi.";
      logger.error({ message: "Database connection error", code: err.code, path: req.originalUrl });
    } else if (errorMessage.includes("supabase") || errorMessage.includes("Storage") || errorStack.includes("supabase")) {
      statusCode = 503;
      message = "Layanan penyimpanan sedang tidak tersedia. Silakan coba beberapa saat lagi.";
      logger.error({ message: "Storage service error", originalError: errorMessage, path: req.originalUrl });
    } else if (
      errorStack.includes("upstash") ||
      errorStack.includes("redis") ||
      errorStack.includes("ioredis") ||
      errorMessage.includes("fetch failed")
    ) {
      statusCode = 503;
      message = "Layanan cache sedang tidak tersedia. Silakan coba beberapa saat lagi.";
      logger.error({ message: "Redis/Upstash connection error", originalError: errorMessage, path: req.originalUrl });
    } else if (err.code === "ETIMEDOUT" || err.code === "ECONNRESET" || errorMessage.includes("timeout")) {
      statusCode = 504;
      message = "Permintaan membutuhkan waktu terlalu lama. Silakan coba lagi.";
      logger.error({ message: "Request timeout", originalError: errorMessage, path: req.originalUrl });
    } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
      statusCode = 503;
      message = "Layanan sedang tidak dapat dijangkau. Silakan coba beberapa saat lagi.";
      logger.error({ message: "Connection refused", code: err.code, path: req.originalUrl });
    }
  }

  const response = { success: false, message };

  if (isApiError && err.details) {
    response.details = err.details;
  }

  if (isDev) {
    response.stack = err.stack;
    response.errorName = err.name;
    response.errorCode = err.code || null;
  }

  logger.error({
    message: err.message,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    errorName: err.name,
    errorCode: err.code || null,
    ...(err.details && { details: err.details }),
    ...(isDev && { stack: err.stack }),
  });

  res.status(statusCode).json(response);
};