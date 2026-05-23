/**
 * Konfigurasi Utama Express.js - Bengkel Vespa API
 * Mengatur Middleware, Keamanan, CORS, Routing, dan Error Handling.
 */

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import privateRouter from "#routes/privateRoutes.js";
import publicRouter from "#routes/publicRoutes.js";
import { errorMiddleware } from "#middleware/errorMiddleware.js";
import { isProd } from "#config/env.js";

/**
 * Memuat variabel environment dari file .env
 */
dotenv.config();

/**
 * Inisialisasi Express Application
 * @type {import("express").Application}
 */
const web = express();

/**
 * Pengaturan Proxy (Sangat Penting untuk Rate Limiter)
 * Memastikan Express membaca IP klien asli (X-Forwarded-For) 
 * jika berada di belakang Load Balancer, Nginx, atau Cloudflare.
 */
web.set("trust proxy", 1);

/**
 * Resolusi path direktori saat ini
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * Resolusi path direktori saat ini (direktori induk file)
 * @type {string}
 */
const __dirname = path.dirname(__filename);

/**
 * Konfigurasi path untuk file Swagger YAML
 * @type {string}
 */
const swaggerPath = path.resolve(__dirname, "../docs/swagger.yml");

/**
 * Objek dokumen Swagger yang dimuat dari YAML
 * @type {Object}
 */
const swaggerDocument = YAML.load(swaggerPath);

/**
 * Versi API (diambil dari environment)
 * @type {string}
 */
const version = process.env.API_VERSION || "v1";

/**
 * Base URL Server
 * @type {string}
 */
const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;

/**
 * Menyuntikkan konfigurasi URL server ke dalam dokumen Swagger
 */
swaggerDocument.servers = [
  {
    url: `${serverUrl}/api/${version}`,
    description: isProd ? "Production Server" : "Development Server",
  },
];

/**
 * Daftar origin yang diizinkan untuk CORS
 * @type {Array<string>}
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || [];

/**
 * Konfigurasi CORS (Cross-Origin Resource Sharing)
 * @type {import("cors").CorsOptions}
 */
const corsOptions = {
  /**
   * Validasi asal request (origin)
   * @param {string|undefined} origin - Origin dari request
   * @param {Function} callback - Callback untuk menyetujui/menolak origin
   * @returns {void}
   */
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProd) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith("ngrok-free.app") || origin.endsWith("ngrok.io")) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "ngrok-skip-browser-warning",
    "Origin",
    "Referer",
    "User-Agent",
  ],
  exposedHeaders: ["set-cookie", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400,
};

/**
 * Implementasi CORS Middleware
 */
web.use(cors(corsOptions));

/**
 * Implementasi Helmet Middleware untuk keamanan Header HTTP
 */
web.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

/**
 * Implementasi Kompresi GZIP
 * Memperkecil ukuran response body untuk performa jaringan yang lebih baik.
 */
web.use(compression());

/**
 * Implementasi Body Parser (JSON)
 * LIMIT KRITIKAL: Maksimal 1MB. Mencegah serangan fuzzing / payload raksasa 
 * yang dapat memicu Out Of Memory (OOM) atau mengunci Event Loop.
 */
web.use(express.json({ limit: "1mb" }));

/**
 * Implementasi Body Parser (URL-Encoded)
 * Limit maksimal 1MB untuk data form-urlencoded.
 */
web.use(express.urlencoded({ extended: true, limit: "1mb" }));

/**
 * Implementasi HTTP Request Logger (Morgan)
 */
web.use(morgan(isProd ? "combined" : "dev"));

/**
 * Endpoint Health Check
 * Digunakan oleh Load Balancer / Container Orchestrator untuk mengecek status server.
 */
web.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

/**
 * Endpoint Dokumentasi API (Swagger UI)
 */
web.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Bengkel Vespa API Docs",
    swaggerOptions: {
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
    },
  })
);

/**
 * Redirect Route Root ke halaman Dokumentasi
 */
web.get("/", (_req, res) => {
  res.redirect("/docs");
});

/**
 * Registrasi Rute Publik
 */
web.use(publicRouter);

/**
 * Registrasi Rute Privat (Membutuhkan Autentikasi)
 */
web.use(privateRouter);

/**
 * Fallback Route (404 Not Found)
 * Menangkap semua request ke endpoint yang tidak terdaftar.
 */
web.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan atau tidak tersedia.",
  });
});

/**
 * Global Error Handler Middleware
 * Menangkap semua error yang dilempar (throw) dari Controller/Service.
 */
web.use(errorMiddleware);

/**
 * Ekspor instance Express
 */
export default web;