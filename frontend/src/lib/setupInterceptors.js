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
          console.error("[Supabase Session Error]", error);
        }

        const session = data?.session;

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
      } catch (err) {
        console.error("[Axios Request Interceptor Error]", err);
        return Promise.reject(err);
      }
    },

    (error) => {
      console.error("[Axios Request Error]", error);
      return Promise.reject(error);
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
      let message = "Terjadi gangguan pada sistem. Silakan coba kembali.";
      let details = null;

      if (response?.data) {
        statusCode = response.status;
        errorCode = response.data.code || errorCode;
        message = response.data.message || message;
        details = response.data.details || null;
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorCode = "REQUEST_TIMEOUT";
        message = "Permintaan membutuhkan waktu terlalu lama. Periksa koneksi internet Anda lalu coba kembali.";
      } else if (!navigator.onLine) {
        errorCode = "NO_INTERNET_CONNECTION";
        message = "Koneksi internet terputus. Periksa jaringan Anda lalu coba kembali.";
      } else if (error.message?.includes("Network Error")) {
        errorCode = "SERVER_UNREACHABLE";
        message = "Server tidak dapat dihubungi. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
      }

      /**
       * Handle 401 Unauthorized - Session expired atau invalid
       * Redirect ke login jika bukan di halaman login
       */
      if (
        statusCode === 401 &&
        !window.location.pathname.includes("/login")
      ) {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("[Supabase Session Check Error]", error);
          }

          const session = data?.session;

          if (!session?.access_token) {
            await supabase.auth.signOut();
            window.location.replace("/login");
          }
        } catch (err) {
          console.error("[Unauthorized Handler Error]", err);
          window.location.replace("/login");
        }
      }

      /**
       * Tampilkan notifikasi error untuk network issues atau server error
       * Tidak mengubah auth status agar UI tetap bisa digunakan
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
      return "Server Tidak Tersedia";

    case "REQUEST_TIMEOUT":
      return "Waktu Habis";

    case "AUTH_SERVICE_UNAVAILABLE":
      return "Layanan Autentikasi Terganggu";

    case "DATABASE_UNAVAILABLE":
      return "Database Tidak Tersedia";

    case "DATABASE_ERROR":
      return "Kesalahan Database";

    case "INTERNAL_SERVER_ERROR":
      return "Kesalahan Server";

    default:
      return "Gangguan Sistem";
  }
}