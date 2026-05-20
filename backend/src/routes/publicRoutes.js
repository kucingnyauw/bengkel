import express from "express";

// ============================================================================
// CONTROLLERS IMPORT (Alphabetical Order)
// ============================================================================
import OrderController from "#controller/orderController.js";
import PaymentController from "#controller/paymentController.js";
import ProductController from "#controller/productController.js";
import UserController from "#controller/userController.js";

// ============================================================================
// ROUTER INITIALIZATION & CONFIG
// ============================================================================
const publicRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;


// ============================================================================
// 1. AUTH ROUTES (PUBLIC)
// ============================================================================

/**
 * @route POST /api/{version}/auth/validate/email
 * @description Memvalidasi email pengguna untuk keperluan autentikasi (Magic Link/Login)
 * @access Public
 */
publicRouter.post(`${prefix}/auth/validate/email`, UserController.validateUserEmail);


// ============================================================================
// 2. ORDERS ROUTES (PUBLIC)
// ============================================================================

/**
 * @route GET /api/{version}/orders/:orderNumber/history
 * @description Melacak riwayat lengkap pesanan berdasarkan nomor pesanan (timeline perubahan status dari DRAFT hingga saat ini)
 * @access Public (Pelanggan)
 */
publicRouter.get(`${prefix}/orders/:orderNumber/history`, OrderController.trackOrderHistory);


// ============================================================================
// 3. PAYMENTS ROUTES (PUBLIC)
// ============================================================================

/**
 * @route POST /api/{version}/payments/webhook
 * @description Menangani notifikasi webhook dari Midtrans terkait pembaruan status pembayaran
 * @access Public (Sistem Midtrans)
 */
publicRouter.post(`${prefix}/payments/webhook`, PaymentController.handleMidtransWebhook);


// ============================================================================
// 4. PRODUCTS ROUTES (PUBLIC)
// ============================================================================

/**
 * @route GET /api/{version}/products
 * @description Mendapatkan daftar semua produk yang tersedia
 * @access Public
 */
publicRouter.get(`${prefix}/products`, ProductController.getProducts);

/**
 * @route GET /api/{version}/products/services
 * @description Mendapatkan daftar produk khusus jenis jasa (layanan perbaikan/servis)
 * @access Public
 */
publicRouter.get(`${prefix}/products/services`, ProductController.getServices);

/**
 * @route GET /api/{version}/products/spareparts
 * @description Mendapatkan daftar produk khusus jenis sparepart (suku cadang)
 * @access Public
 */
publicRouter.get(`${prefix}/products/spareparts`, ProductController.getSpareparts);

/**
 * @route GET /api/{version}/products/sku/:sku
 * @description Mendapatkan detail produk berdasarkan nomor SKU
 * @access Public
 */
publicRouter.get(`${prefix}/products/sku/:sku`, ProductController.getProductBySku);

/**
 * @route GET /api/{version}/products/:id
 * @description Mendapatkan detail produk berdasarkan ID
 * @access Public
 */
publicRouter.get(`${prefix}/products/:id`, ProductController.getProductById);


export default publicRouter;