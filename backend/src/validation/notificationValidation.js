import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const createNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    "any.required": "Judul notifikasi harus diisi",
    "string.empty": "Judul notifikasi tidak boleh kosong",
    "string.min": "Judul notifikasi minimal 1 karakter",
    "string.max": "Judul notifikasi maksimal 100 karakter",
  }),
  message: Joi.string().min(1).max(500).required().messages({
    "any.required": "Pesan notifikasi harus diisi",
    "string.empty": "Pesan notifikasi tidak boleh kosong",
    "string.min": "Pesan notifikasi minimal 1 karakter",
    "string.max": "Pesan notifikasi maksimal 500 karakter",
  }),
  type: Joi.string().valid("INFO", "WARNING", "SUCCESS", "ERROR").optional().default("INFO").messages({
    "any.only": "Tipe notifikasi harus INFO, WARNING, SUCCESS, atau ERROR",
  }),
  userId: Joi.string().required().messages({
    "any.required": "ID user harus diisi",
    "string.empty": "ID user tidak boleh kosong",
  }),
  orderId: Joi.string().optional().allow("").messages({
    "string.empty": "ID order tidak boleh kosong",
  }),
});

const createBulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required().messages({
    "any.required": "Array userIds harus diisi",
    "array.min": "Minimal satu user harus dipilih",
  }),
  title: Joi.string().min(1).max(100).required().messages({
    "any.required": "Judul notifikasi harus diisi",
    "string.empty": "Judul notifikasi tidak boleh kosong",
    "string.min": "Judul notifikasi minimal 1 karakter",
    "string.max": "Judul notifikasi maksimal 100 karakter",
  }),
  message: Joi.string().min(1).max(500).required().messages({
    "any.required": "Pesan notifikasi harus diisi",
    "string.empty": "Pesan notifikasi tidak boleh kosong",
    "string.min": "Pesan notifikasi minimal 1 karakter",
    "string.max": "Pesan notifikasi maksimal 500 karakter",
  }),
  type: Joi.string().valid("INFO", "WARNING", "SUCCESS", "ERROR").optional().default("INFO").messages({
    "any.only": "Tipe notifikasi harus INFO, WARNING, SUCCESS, atau ERROR",
  }),
  orderId: Joi.string().optional().allow("").messages({
    "string.empty": "ID order tidak boleh kosong",
  }),
});

const getNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(MAX_PAGE).optional().default(1).messages({
    "number.base": "Halaman harus berupa angka",
    "number.integer": "Halaman harus berupa bilangan bulat",
    "number.min": "Halaman minimal 1",
    "number.max": `Halaman maksimal ${MAX_PAGE}`,
  }),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().default(20).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": `Limit maksimal ${MAX_LIMIT}`,
  }),
  isRead: Joi.boolean().optional().messages({
    "boolean.base": "Status baca harus berupa boolean",
  }),
  type: Joi.string().valid("INFO", "WARNING", "SUCCESS", "ERROR").optional().messages({
    "any.only": "Tipe notifikasi harus INFO, WARNING, SUCCESS, atau ERROR",
  }),
});

const notificationIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID notifikasi harus diisi",
    "string.empty": "ID notifikasi tidak boleh kosong",
  }),
});

export {
  createNotificationSchema,
  createBulkNotificationSchema,
  getNotificationsQuerySchema,
  notificationIdParamSchema,
};