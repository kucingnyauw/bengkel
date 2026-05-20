import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const recordStockInSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
  quantity: Joi.number().integer().min(1).max(999999).required().messages({
    "any.required": "Jumlah stok masuk harus diisi",
    "number.base": "Jumlah stok masuk harus berupa angka",
    "number.integer": "Jumlah stok masuk harus berupa bilangan bulat",
    "number.min": "Jumlah stok masuk minimal 1",
    "number.max": "Jumlah stok masuk maksimal 999.999",
  }),
  note: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Catatan maksimal 255 karakter",
  }),
  sourceType: Joi.string()
    .valid("MANUAL", "PURCHASE", "RETURN", "ADJUSTMENT")
    .optional()
    .default("MANUAL")
    .messages({
      "any.only": "Source type harus MANUAL, PURCHASE, RETURN, atau ADJUSTMENT",
    }),
});

const recordStockOutSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
  quantity: Joi.number().integer().min(1).max(999999).required().messages({
    "any.required": "Jumlah stok keluar harus diisi",
    "number.base": "Jumlah stok keluar harus berupa angka",
    "number.integer": "Jumlah stok keluar harus berupa bilangan bulat",
    "number.min": "Jumlah stok keluar minimal 1",
    "number.max": "Jumlah stok keluar maksimal 999.999",
  }),
  orderItemId: Joi.string().optional().messages({
    "string.empty": "ID item pesanan tidak boleh kosong",
  }),
  note: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Catatan maksimal 255 karakter",
  }),
  sourceType: Joi.string()
    .valid("MANUAL", "SALE", "ADJUSTMENT")
    .optional()
    .default("MANUAL")
    .messages({
      "any.only": "Source type harus MANUAL, SALE, atau ADJUSTMENT",
    }),
});

const recordStockAdjustmentSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
  quantity: Joi.number().integer().required().messages({
    "any.required": "Jumlah penyesuaian harus diisi",
    "number.base": "Jumlah penyesuaian harus berupa angka",
    "number.integer": "Jumlah penyesuaian harus berupa bilangan bulat",
  }),
  note: Joi.string().max(255).required().messages({
    "any.required": "Catatan penyesuaian harus diisi",
    "string.empty": "Catatan penyesuaian tidak boleh kosong",
    "string.max": "Catatan maksimal 255 karakter",
  }),
});

const getStockMovementsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(MAX_PAGE).optional().default(1).messages({
    "number.base": "Halaman harus berupa angka",
    "number.integer": "Halaman harus berupa bilangan bulat",
    "number.min": "Halaman minimal 1",
    "number.max": `Halaman maksimal ${MAX_PAGE}`,
  }),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": `Limit maksimal ${MAX_LIMIT}`,
  }),
  productId: Joi.string().optional().messages({
    "string.empty": "ID produk tidak boleh kosong",
  }),
  type: Joi.string().valid("IN", "OUT", "ADJUSTMENT").optional().messages({
    "any.only": "Tipe mutasi harus IN, OUT, atau ADJUSTMENT",
  }),
  sourceType: Joi.string()
    .valid("MANUAL", "PURCHASE", "SALE", "RETURN", "ADJUSTMENT")
    .optional()
    .messages({
      "any.only": "Source type tidak valid",
    }),
  recordedById: Joi.string().optional().messages({
    "string.empty": "ID user pencatat tidak boleh kosong",
  }),
  orderId: Joi.string().optional().messages({
    "string.empty": "ID order tidak boleh kosong",
  }),
  startDate: Joi.date().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "Tanggal akhir harus berupa tanggal yang valid",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
});

const productIdParamSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
});

const movementIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID mutasi stok harus diisi",
    "string.empty": "ID mutasi stok tidak boleh kosong",
  }),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID order harus diisi",
    "string.empty": "ID order tidak boleh kosong",
  }),
});

export {
  recordStockInSchema,
  recordStockOutSchema,
  recordStockAdjustmentSchema,
  getStockMovementsQuerySchema,
  productIdParamSchema,
  movementIdParamSchema,
  orderIdParamSchema,
};