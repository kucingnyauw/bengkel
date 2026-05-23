import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const API_URL = env.VITE_API_URL;
  const API_VERSION = env.VITE_API_VERSION;
  const API_PREFIX = `/api/${API_VERSION}`;

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@api": path.resolve(__dirname, "src/api"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@components": path.resolve(__dirname, "src/components"),
        "@data": path.resolve(__dirname, "src/data"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@layout": path.resolve(__dirname, "src/layout"),
        "@lib": path.resolve(__dirname, "src/lib"),
        "@menu": path.resolve(__dirname, "src/menuItems"),
        "@routes": path.resolve(__dirname, "src/routes"),
        "@shared": path.resolve(__dirname, "src/shared"),
        "@store": path.resolve(__dirname, "src/store"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@views": path.resolve(__dirname, "src/views"),
      },
    },

    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: false,
      host: env.VITE_HOST || "localhost",

      proxy: {
        [API_PREFIX]: {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          ws: true,

          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.error("❌ Proxy Error:", err.message);
            });

            proxy.on("proxyReq", (_, req) => {
              if (env.VITE_DEBUG_PROXY === "true") {
                console.log(
                  "📤",
                  req.method,
                  req.url,
                  "→",
                  API_URL + req.url
                );
              }
            });

            proxy.on("proxyRes", (proxyRes, req) => {
              if (env.VITE_DEBUG_PROXY === "true") {
                console.log("📥", proxyRes.statusCode, req.url);
              }
            });
          },
        },
      },

      cors:
        env.VITE_CORS_ENABLED === "true"
          ? {
              origin: env.VITE_CORS_ORIGIN || "*",
              methods: [
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS",
              ],
              allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
              ],
              credentials: env.VITE_CORS_CREDENTIALS === "true",
            }
          : false,
    },

    build: {
      outDir: env.VITE_BUILD_DIR || "dist",
      sourcemap: env.VITE_SOURCEMAP === "true",
      minify: env.VITE_MINIFY !== "false" ? "terser" : false,

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor";
            }

            if (
              id.includes("@mui/material") ||
              id.includes("@mui/icons-material")
            ) {
              return "mui";
            }

            if (
              id.includes("@reduxjs/toolkit") ||
              id.includes("react-redux")
            ) {
              return "redux";
            }

            if (id.includes("@tanstack/react-query")) {
              return "query";
            }
          },
        },
      },
    },
  };
});