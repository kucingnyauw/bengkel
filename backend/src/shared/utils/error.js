/**
 * @class ApiError
 * @extends Error
 * @description Kelas kustom untuk menangani error API beserta kode status HTTP.
 */
class ApiError extends Error {
  /**
   * @constructor
   * @param {Object} params - Konfigurasi error.
   * @param {string} params.message - Pesan error yang akan dikirim ke klien.
   * @param {number} [params.statusCode=500] - Kode status HTTP.
   * @param {*} [params.details=null] - Detail tambahan terkait error (opsional).
   */
  constructor({ message, statusCode = 500, details = null }) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * @static
   * @description Menghasilkan error 400 Bad Request.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Permintaan tidak valid"] - Pesan error.
   * @param {*} [params.details=null] - Detail tambahan error.
   * @returns {ApiError} Instance ApiError.
   */
  static badRequest({
    message = "Permintaan tidak valid",
    details = null,
  } = {}) {
    return new ApiError({ message, statusCode: 400, details });
  }

  /**
   * @static
   * @description Menghasilkan error 401 Unauthorized.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Autentikasi diperlukan"] - Pesan error.
   * @returns {ApiError} Instance ApiError.
   */
  static unauthorized({ message = "Autentikasi diperlukan" } = {}) {
    return new ApiError({ message, statusCode: 401 });
  }

  /**
   * @static
   * @description Menghasilkan error 403 Forbidden.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Anda tidak memiliki akses"] - Pesan error.
   * @returns {ApiError} Instance ApiError.
   */
  static forbidden({ message = "Anda tidak memiliki akses" } = {}) {
    return new ApiError({ message, statusCode: 403 });
  }

  /**
   * @static
   * @description Menghasilkan error 404 Not Found.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Data tidak ditemukan"] - Pesan error.
   * @returns {ApiError} Instance ApiError.
   */
  static notFound({ message = "Data tidak ditemukan" } = {}) {
    return new ApiError({ message, statusCode: 404 });
  }

  /**
   * @static
   * @description Menghasilkan error 408 Request Timeout.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Waktu permintaan habis"] - Pesan error.
   * @returns {ApiError} Instance ApiError.
   */
  static requestTimeout({ message = "Waktu permintaan habis" } = {}) {
    return new ApiError({ message, statusCode: 408 });
  }

  /**
   * @static
   * @description Menghasilkan error 409 Conflict.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Data sudah ada"] - Pesan error.
   * @returns {ApiError} Instance ApiError.
   */
  static conflict({ message = "Data sudah ada" } = {}) {
    return new ApiError({ message, statusCode: 409 });
  }

  /**
   * @static
   * @description Menghasilkan error 500 Internal Server Error.
   * @param {Object} [params] - Konfigurasi error.
   * @param {string} [params.message="Terjadi kesalahan pada sistem"] - Pesan error.
   * @param {*} [params.details=null] - Detail tambahan error.
   * @returns {ApiError} Instance ApiError.
   */
  static internal({
    message = "Terjadi kesalahan pada sistem",
    details = null,
  } = {}) {
    return new ApiError({ message, statusCode: 500, details });
  }
}

export default ApiError;