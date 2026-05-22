import axios from "axios";

/**
 * Environment Variables
 */
const apiUrl = import.meta.env.VITE_API_URL;
const apiVersion = import.meta.env.VITE_API_VERSION;

if (!apiUrl || !apiVersion) {
  throw new Error(
    "VITE_API_URL atau VITE_API_VERSION belum dikonfigurasi."
  );
}

/**
 * API Base URL
 */
const baseURL = `${apiUrl}/api/${apiVersion}`;

/**
 * Global Axios Client
 */
export const Client = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default Client;