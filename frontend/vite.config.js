// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
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
      "@views": path.resolve(__dirname, "src/views")
    }
  }
});