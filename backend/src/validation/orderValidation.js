import Joi from "joi";
import {
  MAX_ORDER_ITEMS,
  MIN_ORDER_ITEMS,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  MAX_LIMIT,
  MAX_PAGE,
} from "#shared/constant/constants.js";

const ORDER_NUMBER_REGEX = /^ORD-\d{8}-[A-F0-9]{4}$/;

const orderItemSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
  quantity: Joi.number()
    .integer()
    .min(MIN_ITEM_QUANTITY)
    .max(MAX_ITEM_QUANTITY)
    .required()
    .messages({
      "any.required": "Jumlah item harus diisi",
      "number.base": "Jumlah item harus berupa angka",
      "number.integer": "Jumlah item harus berupa bilangan bulat",
      "number.min": `Jumlah item minimal ${MIN_ITEM_QUANTITY}`,
      "number.max": `Jumlah item maksimal ${MAX_ITEM_QUANTITY}`,
    }),
});

/**
 * Schema untuk membuat order baru (DRAFT)
 */
const createOrderSchema = Joi.object({
  customerId: Joi.string().optional().allow(null, "").messages({
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
  vehicleId: Joi.string().optional().allow(null, "").messages({
    "string.empty": "ID kendaraan tidak boleh kosong",
  }),
  items: Joi.array()
    .items(orderItemSchema)
    .min(MIN_ORDER_ITEMS)
    .max(MAX_ORDER_ITEMS)
    .required()
    .messages({
      "any.required": "Item pesanan harus diisi",
      "array.base": "Item pesanan harus berupa array",
      "array.min": `Minimal ${MIN_ORDER_ITEMS} item dalam pesanan`,
      "array.max": `Maksimal ${MAX_ORDER_ITEMS} item dalam pesanan`,
    }),
});

/**
 * Schema untuk update status order
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED")
    .required()
    .messages({
      "any.required": "Status pesanan harus diisi",
      "string.empty": "Status pesanan tidak boleh kosong",
      "any.only": "Status pesanan tidak valid",
    }),
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().min(3).max(255).required().messages({
    "any.required": "Alasan pembatalan harus diisi",
    "string.empty": "Alasan pembatalan tidak boleh kosong",
    "string.min": "Alasan pembatalan minimal 3 karakter",
    "string.max": "Alasan pembatalan maksimal 255 karakter",
  }),
});

const getOrdersQuerySchema = Joi.object({
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
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  status: Joi.string()
    .valid("DRAFT", "QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED")
    .optional()
    .messages({ "any.only": "Status pesanan tidak valid" }),
  cashierId: Joi.string().optional(),
  shiftId: Joi.string().optional(),
  customerId: Joi.string().optional(),
  vehicleId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
});

const orderIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID pesanan harus diisi",
    "string.empty": "ID pesanan tidak boleh kosong",
  }),
});

const orderIdentifierParamSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "any.required": "ID atau nomor pesanan harus diisi",
    "string.empty": "ID atau nomor pesanan tidak boleh kosong",
  }),
});

const orderNumberParamSchema = Joi.object({
  orderNumber: Joi.string().pattern(ORDER_NUMBER_REGEX).required().messages({
    "any.required": "Nomor pesanan harus diisi",
    "string.empty": "Nomor pesanan tidak boleh kosong",
    "string.pattern.base": "Format nomor pesanan tidak valid. Format: ORD-YYYYMMDD-XXXX",
  }),
});

const calculateTotalSchema = Joi.array()
  .items(orderItemSchema)
  .min(MIN_ORDER_ITEMS)
  .max(MAX_ORDER_ITEMS)
  .required()
  .messages({
    "any.required": "Item pesanan harus diisi",
    "array.base": "Item pesanan harus berupa array",
    "array.min": `Minimal ada ${MIN_ORDER_ITEMS} item dalam pesanan`,
    "array.max": `Maksimal ${MAX_ORDER_ITEMS} item dalam pesanan`,
  });

export {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  getOrdersQuerySchema,
  orderIdParamSchema,
  orderIdentifierParamSchema,
  orderNumberParamSchema,
  calculateTotalSchema,
};