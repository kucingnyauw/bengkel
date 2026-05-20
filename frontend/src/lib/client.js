import axios from "axios";
import supabase from "@lib/supabase.js";

export const Client = (() => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiVersion = import.meta.env.VITE_API_VERSION;

  if (!apiUrl || !apiVersion) {
    throw new Error("VITE_API_URL or VITE_API_VERSION is not defined.");
  }

  const baseURL = `${apiUrl}/api/${apiVersion}`;

  const client = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use(async (config) => {
    config.headers = config.headers || {};

    if (config.skipAuth) {
      return config;
    }

    const { data } = await supabase.auth.getSession();

    const session = data?.session;

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const { config, response } = error;

      if (!config?.skipError) {
        if (
          response?.status === 401 &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.replace("/login");
        }
      }

      const message =
        error?.response?.data?.message || error?.message || "Terjadi kesalahan";

      return Promise.reject(new Error(message));
    }
  );

  return client;
})();

export default Client;
