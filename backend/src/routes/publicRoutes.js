import express from "express";

/**
 * ============================================================================
 * CONTROLLERS IMPORT (Alphabetical Order)
 * ============================================================================
 */
import HealthController from "#controller/healthController.js";
import OrderController from "#controller/orderController.js";
import PaymentController from "#controller/paymentController.js";
import ProductController from "#controller/productController.js";
import UserController from "#controller/userController.js";

/**
 * ============================================================================
 * MIDDLEWARE IMPORT
 * ============================================================================
 */
import rateLimiterMiddleware from "#middleware/rateLimiterMiddleware.js";

/**
 * ============================================================================
 * ROUTER INITIALIZATION & CONFIG
 * ============================================================================
 */
const publicRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;

/**
 * ============================================================================
 * RATE LIMITER CONFIGURATIONS
 * ============================================================================
 */
const generalLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 60 });
const strictLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 10 });
const webhookLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 30 });

/**
 * ============================================================================
 * 1. AUTH ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route POST /api/{version}/auth/validate/email
 * @description Memvalidasi email pengguna untuk keperluan autentikasi (Magic Link/Login)
 * @access Public
 */
publicRouter.post(
  `${prefix}/auth/validate/email`,
  strictLimiter,
  UserController.validateUserEmail
);

/**
 * ============================================================================
 * 2. HEALTH ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route GET /api/{version}/health
 * @description Memeriksa status kesehatan sistem secara menyeluruh (Database, Redis, Supabase)
 * @access Public
 */
publicRouter.get(
  `${prefix}/health`,
  generalLimiter,
  HealthController.checkHealth
);

/**
 * ============================================================================
 * 3. ORDERS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route GET /api/{version}/orders/:orderNumber/history
 * @description Melacak riwayat lengkap pesanan berdasarkan nomor pesanan (timeline perubahan status dari DRAFT hingga saat ini)
 * @access Public (Pelanggan)
 */
publicRouter.get(
  `${prefix}/orders/:orderNumber/history`,
  generalLimiter,
  OrderController.trackOrderHistory
);

/**
 * ============================================================================
 * 4. PAYMENTS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route POST /api/{version}/payments/webhook
 * @description Menangani notifikasi webhook dari Midtrans terkait pembaruan status pembayaran
 * @access Public (Sistem Midtrans)
 */
publicRouter.post(
  `${prefix}/payments/webhook`,
  webhookLimiter,
  PaymentController.handleMidtransWebhook
);

/**
 * ============================================================================
 * 5. PRODUCTS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route GET /api/{version}/products
 * @description Mendapatkan daftar semua produk yang tersedia
 * @access Public
 */
publicRouter.get(
  `${prefix}/products`,
  generalLimiter,
  ProductController.getProducts
);

/**
 * @route GET /api/{version}/products/services
 * @description Mendapatkan daftar produk khusus jenis jasa (layanan perbaikan/servis)
 * @access Public
 */
publicRouter.get(
  `${prefix}/products/services`,
  generalLimiter,
  ProductController.getServices
);

/**
 * @route GET /api/{version}/products/spareparts
 * @description Mendapatkan daftar produk khusus jenis sparepart (suku cadang)
 * @access Public
 */
publicRouter.get(
  `${prefix}/products/spareparts`,
  generalLimiter,
  ProductController.getSpareparts
);

/**
 * @route GET /api/{version}/products/sku/:sku
 * @description Mendapatkan detail produk berdasarkan nomor SKU
 * @access Public
 */
publicRouter.get(
  `${prefix}/products/sku/:sku`,
  generalLimiter,
  ProductController.getProductBySku
);

/**
 * @route GET /api/{version}/products/:id
 * @description Mendapatkan detail produk berdasarkan ID
 * @access Public
 */
publicRouter.get(
  `${prefix}/products/:id`,
  generalLimiter,
  ProductController.getProductById
);

export default publicRouter;