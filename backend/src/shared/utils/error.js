// #shared/utils/error.js

/**
 * Custom API Error
 */
class ApiError extends Error {
  /**
   * @param {Object} params
   * @param {string} params.message
   * @param {number} [params.statusCode=500]
   * @param {string} [params.code="INTERNAL_SERVER_ERROR"]
   * @param {*} [params.details=null]
   * @param {boolean} [params.isOperational=true]
   */
  constructor({
    message,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details = null,
    isOperational = true,
  }) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize Error
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }

  /**
   * 400 Bad Request
   */
  static badRequest({
    message = "Permintaan tidak valid",
    code = "BAD_REQUEST",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 400,
      code,
      details,
    });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized({
    message = "Autentikasi diperlukan",
    code = "UNAUTHORIZED",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 401,
      code,
      details,
    });
  }

  /**
   * 403 Forbidden
   */
  static forbidden({
    message = "Anda tidak memiliki akses",
    code = "FORBIDDEN",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 403,
      code,
      details,
    });
  }

  /**
   * 404 Not Found
   */
  static notFound({
    message = "Data tidak ditemukan",
    code = "NOT_FOUND",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 404,
      code,
      details,
    });
  }

  /**
   * 408 Request Timeout
   */
  static requestTimeout({
    message = "Waktu permintaan habis",
    code = "REQUEST_TIMEOUT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 408,
      code,
      details,
    });
  }

  /**
   * 409 Conflict
   */
  static conflict({
    message = "Data sudah ada",
    code = "RESOURCE_CONFLICT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 409,
      code,
      details,
    });
  }

  /**
   * 422 Validation Error
   */
  static unprocessableEntity({
    message = "Validasi gagal",
    code = "VALIDATION_ERROR",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 422,
      code,
      details,
    });
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests({
    message = "Terlalu banyak permintaan. Silakan coba lagi nanti.",
    code = "RATE_LIMITED",
    retryAfter = 60,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 429,
      code,
      details: {
        retryAfter,
      },
    });
  }

  /**
   * 500 Internal Server Error
   */
  static internal({
    message = "Terjadi kesalahan pada sistem",
    code = "INTERNAL_SERVER_ERROR",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 500,
      code,
      details,
    });
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable({
    message = "Layanan sedang tidak tersedia",
    code = "SERVICE_UNAVAILABLE",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 503,
      code,
      details,
    });
  }

  /**
   * 504 Gateway Timeout
   */
  static gatewayTimeout({
    message = "Gateway timeout",
    code = "GATEWAY_TIMEOUT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 504,
      code,
      details,
    });
  }
}

export default ApiError;