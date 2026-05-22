import Client from "@lib/client.js";
import supabase from "@lib/supabase.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";

/**
 * Setup Axios Interceptors untuk request dan response
 * Menangani auth token, error handling, dan notifikasi
 *
 * @param {Object} params
 * @param {import("@reduxjs/toolkit").EnhancedStore} params.store - Redux store
 */
export function setupInterceptors({ store }) {
  /**
   * Request Interceptor
   * Menambahkan Authorization header dari Supabase session
   */
  Client.interceptors.request.use(
    async (config) => {
      try {
        config.headers = config.headers || {};

        if (config.skipAuth) {
          return config;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          return config;
        }

        const session = data?.session;

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
      } catch {
        return Promise.reject({
          success: false,
          statusCode: 0,
          code: "REQUEST_SETUP_FAILED",
          message:
            "Gagal menyiapkan permintaan. Silakan muat ulang halaman atau coba beberapa saat lagi.",
          details: null,
        });
      }
    },

    (error) => {
      return Promise.reject({
        success: false,
        statusCode: 0,
        code: "REQUEST_FAILED",
        message:
          "Permintaan tidak dapat diproses. Silakan periksa kembali dan coba lagi.",
        details: null,
      });
    }
  );

  /**
   * Response Interceptor
   * Menangani error response, unauthorized, dan network issues
   */
  Client.interceptors.response.use(
    (response) => response.data,

    async (error) => {
      const { response, config } = error;

      let statusCode = 500;
      let errorCode = "UNKNOWN_ERROR";
      let message =
        "Sistem sedang mengalami gangguan. Tim kami sedang menanganinya. Silakan coba beberapa saat lagi.";
      let details = null;

      if (response?.data) {
        statusCode = response.status;
        errorCode = response.data.code || errorCode;
        message = response.data.message || message;
        details = response.data.details || null;
      } else if (
        error.code === "ECONNABORTED" ||
        error.message?.includes("timeout")
      ) {
        errorCode = "REQUEST_TIMEOUT";
        message =
          "Permintaan membutuhkan waktu terlalu lama. Periksa koneksi internet Anda dan coba kembali.";
      } else if (!navigator.onLine) {
        errorCode = "NO_INTERNET_CONNECTION";
        message =
          "Koneksi internet terputus. Periksa jaringan Anda dan coba kembali saat sudah terhubung.";
      } else if (error.message?.includes("Network Error")) {
        errorCode = "SERVER_UNREACHABLE";
        message =
          "Layanan sedang tidak dapat dijangkau. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
      }

      /**
       * Handle 401 Unauthorized - Session expired atau invalid
       * Redirect ke login jika bukan di halaman login
       */
      if (statusCode === 401 && !window.location.pathname.includes("/login")) {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            await supabase.auth.signOut();
            window.location.replace("/login");
            return Promise.reject({
              success: false,
              statusCode: 401,
              code: "SESSION_EXPIRED",
              message:
                "Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.",
              details: null,
            });
          }

          const session = data?.session;

          if (!session?.access_token) {
            await supabase.auth.signOut();
            window.location.replace("/login");
          }
        } catch {
          window.location.replace("/login");
        }
      }

      /**
       * Tampilkan notifikasi error untuk network issues atau server error
       */
      if (
        errorCode === "NO_INTERNET_CONNECTION" ||
        errorCode === "SERVER_UNREACHABLE" ||
        errorCode === "REQUEST_TIMEOUT" ||
        statusCode >= 500
      ) {
        if (!config?.skipErrorNotification) {
          store.dispatch(
            showNotification({
              title: getErrorTitle(errorCode),
              message,
              type: "error",
              variant: "dialog",
              duration: 6000,
            })
          );
        }
      }

      const normalizedError = {
        success: false,
        statusCode,
        code: errorCode,
        message,
        details,
        original: error,
      };

      return Promise.reject(normalizedError);
    }
  );
}

/**
 * Mendapatkan judul error yang mudah dibaca berdasarkan error code
 *
 * @param {string} code - Error code dari response
 * @returns {string} Judul error dalam Bahasa Indonesia
 */
function getErrorTitle(code) {
  switch (code) {
    case "NO_INTERNET_CONNECTION":
      return "Koneksi Terputus";

    case "SERVER_UNREACHABLE":
      return "Layanan Tidak Tersedia";

    case "REQUEST_TIMEOUT":
      return "Waktu Permintaan Habis";

    case "AUTH_SERVICE_UNAVAILABLE":
      return "Layanan Masuk Terganggu";

    case "DATABASE_UNAVAILABLE":
      return "Penyimpanan Data Terganggu";

    case "DATABASE_ERROR":
      return "Kesalahan Penyimpanan Data";

    case "INTERNAL_SERVER_ERROR":
      return "Gangguan Layanan";

    default:
      return "Gangguan Sistem";
  }
}
