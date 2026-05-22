// #middleware/errorMiddleware.js

import { isDev } from "#config/env.js";
import logger from "#app/logger.js";
import ApiError from "#shared/utils/error.js";

/**
 * Centralized Error Middleware
 *
 * Menangani seluruh error aplikasi secara terpusat:
 * - ApiError
 * - Prisma
 * - JWT
 * - Redis / Upstash
 * - Supabase / Storage
 * - Timeout
 * - Upload Error
 * - Network / DNS
 * - Invalid JSON
 *
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {import("express").Response}
 */
export const errorMiddleware = (err, req, res, next) => {
  const normalizedError = normalizeError(err);

  const {
    statusCode,
    message,
    code,
    details,
    stack,
    name,
    isOperational,
  } = normalizedError;

  /**
   * Structured logging
   */
  logger.error({
    message,
    code,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    errorName: name,
    isOperational,
    details: details || null,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    ...(isDev && { stack }),
  });

  /**
   * Standard response
   */
  const response = {
    success: false,
    message,
    code,
  };

  /**
   * Optional details
   */
  if (
    details &&
    typeof details === "object" &&
    Object.keys(details).length > 0
  ) {
    response.details = details;
  }

  /**
   * Development debug
   */
  if (isDev) {
    response.debug = {
      name,
      stack,
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Normalize unknown error into ApiError
 *
 * @param {any} err
 * @returns {ApiError}
 */
function normalizeError(err) {
  /**
   * Already normalized
   */
  if (err instanceof ApiError) {
    return err;
  }

  const errorMessage = err?.message || "";
  const errorStack = err?.stack || "";
  const errorCode = err?.code || "";

  /**
   * Prisma Error
   */
  if (isPrismaError(err)) {
    return handlePrismaError(err);
  }

  /**
   * Supabase / Storage
   */
  if (
    includes(errorMessage, ["supabase", "storage"]) ||
    includes(errorStack, ["supabase"])
  ) {
    return ApiError.serviceUnavailable({
      message:
        "Layanan penyimpanan sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
      code: "STORAGE_SERVICE_UNAVAILABLE",
    });
  }

  /**
   * Redis / Upstash
   */
  if (
    includes(errorStack, ["redis", "ioredis", "upstash"]) ||
    includes(errorMessage, [
      "redis",
      "upstash",
      "fetch failed",
    ])
  ) {
    return ApiError.serviceUnavailable({
      message:
        "Sistem sedang mengalami gangguan sementara. Silakan coba beberapa saat lagi.",
      code: "CACHE_SERVICE_UNAVAILABLE",
    });
  }

  /**
   * Timeout
   */
  if (
    ["ETIMEDOUT", "ECONNRESET"].includes(errorCode) ||
    includes(errorMessage, ["timeout"])
  ) {
    return ApiError.gatewayTimeout({
      message:
        "Permintaan membutuhkan waktu terlalu lama untuk diproses. Silakan coba kembali.",
      code: "REQUEST_TIMEOUT",
    });
  }

  /**
   * Network / DNS
   */
  if (
    ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(
      errorCode
    )
  ) {
    return ApiError.serviceUnavailable({
      message:
        "Layanan sedang tidak dapat diakses sementara. Silakan coba lagi beberapa saat lagi.",
      code: "SERVICE_UNREACHABLE",
    });
  }

  /**
   * Invalid JSON
   */
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return ApiError.badRequest({
      message:
        "Format data yang dikirim tidak valid. Periksa kembali input Anda.",
      code: "INVALID_JSON",
    });
  }

  /**
   * JWT Invalid
   */
  if (err.name === "JsonWebTokenError") {
    return ApiError.unauthorized({
      message:
        "Sesi login tidak valid. Silakan login kembali.",
      code: "INVALID_TOKEN",
    });
  }

  /**
   * JWT Expired
   */
  if (err.name === "TokenExpiredError") {
    return ApiError.unauthorized({
      message:
        "Sesi login telah berakhir. Silakan login kembali.",
      code: "TOKEN_EXPIRED",
    });
  }

  /**
   * Multer Upload Error
   */
  if (err.name === "MulterError") {
    return ApiError.badRequest({
      message:
        "Upload file gagal. Pastikan ukuran dan format file sesuai.",
      code: "FILE_UPLOAD_ERROR",
      details: {
        field: err.field || null,
      },
    });
  }

  /**
   * Abort Request
   */
  if (err.name === "AbortError") {
    return ApiError.requestTimeout({
      message:
        "Permintaan dibatalkan sebelum proses selesai.",
      code: "REQUEST_ABORTED",
    });
  }

  /**
   * Unknown Internal Error
   */
  return ApiError.internal({
    message:
      "Terjadi gangguan pada sistem. Silakan coba beberapa saat lagi.",
    code: "INTERNAL_SERVER_ERROR",
  });
}

/**
 * Detect Prisma Error
 *
 * @param {any} err
 * @returns {boolean}
 */
function isPrismaError(err) {
  return (
    err?.code?.startsWith("P") ||
    err?.name?.includes("Prisma") ||
    err?.message?.includes("prisma")
  );
}

/**
 * Handle Prisma Error
 *
 * @param {any} err
 * @returns {ApiError}
 */
function handlePrismaError(err) {
  const message = err?.message?.toLowerCase?.() || "";

  /**
   * Database connection issue
   */
  if (
    message.includes("can't reach database server") ||
    message.includes("connection") ||
    message.includes("database server") ||
    message.includes("connection refused")
  ) {
    return ApiError.serviceUnavailable({
      message:
        "Koneksi ke server sedang bermasalah. Pastikan internet stabil dan coba kembali beberapa saat lagi.",
      code: "DATABASE_UNAVAILABLE",
    });
  }

  switch (err.code) {
    /**
     * Duplicate data
     */
    case "P2002":
      return ApiError.conflict({
        message:
          "Data yang Anda masukkan sudah terdaftar sebelumnya.",
        code: "DUPLICATE_ENTRY",
      });

    /**
     * Record not found
     */
    case "P2025":
      return ApiError.notFound({
        message:
          "Data yang diminta tidak ditemukan atau sudah dihapus.",
        code: "RESOURCE_NOT_FOUND",
      });

    /**
     * Invalid relation
     */
    case "P2003":
      return ApiError.badRequest({
        message:
          "Data yang dikirim tidak sesuai atau memiliki relasi yang tidak valid.",
        code: "INVALID_RELATION",
      });

    /**
     * Validation error
     */
    case "P2000":
    case "P2006":
    case "P2012":
      return ApiError.badRequest({
        message:
          "Beberapa data yang dikirim tidak valid. Periksa kembali input Anda.",
        code: "DATABASE_VALIDATION_ERROR",
      });

    /**
     * Explicit database unavailable
     */
    case "P1001":
    case "P1002":
      return ApiError.serviceUnavailable({
        message:
          "Server sedang mengalami gangguan koneksi. Silakan coba kembali beberapa saat lagi.",
        code: "DATABASE_UNAVAILABLE",
      });

    /**
     * Generic Prisma Error
     */
    default:
      return ApiError.internal({
        message:
          "Terjadi gangguan saat memproses data. Silakan coba kembali.",
        code: "DATABASE_ERROR",
        details: isDev && err.code
          ? {
              prismaCode: err.code,
            }
          : null,
      });
  }
}

/**
 * Case-insensitive includes helper
 *
 * @param {string} value
 * @param {string[]} keywords
 * @returns {boolean}
 */
function includes(value, keywords = []) {
  const normalized = String(value).toLowerCase();

  return keywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );
}