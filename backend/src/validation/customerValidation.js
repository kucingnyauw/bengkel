import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const createCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "any.required": "Nama pelanggan harus diisi",
    "string.empty": "Nama pelanggan tidak boleh kosong",
    "string.min": "Nama pelanggan minimal 1 karakter",
    "string.max": "Nama pelanggan maksimal 100 karakter",
  }),
  phone: Joi.string().min(1).max(20).required().messages({
    "any.required": "Nomor telepon harus diisi",
    "string.empty": "Nomor telepon tidak boleh kosong",
    "string.min": "Nomor telepon minimal 1 karakter",
    "string.max": "Nomor telepon maksimal 20 karakter",
  }),
});

const upsertCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "any.required": "Nama pelanggan harus diisi",
    "string.empty": "Nama pelanggan tidak boleh kosong",
    "string.min": "Nama pelanggan minimal 1 karakter",
    "string.max": "Nama pelanggan maksimal 100 karakter",
  }),
  phone: Joi.string().max(20).required().messages({
    "any.required": "Nomor telepon harus diisi untuk operasi upsert",
    "string.empty": "Nomor telepon tidak boleh kosong",
    "string.max": "Nomor telepon maksimal 20 karakter",
  }),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Nama pelanggan tidak boleh kosong",
    "string.min": "Nama pelanggan minimal 1 karakter",
    "string.max": "Nama pelanggan maksimal 100 karakter",
  }),
  phone: Joi.string().max(20).optional().allow("").messages({
    "string.max": "Nomor telepon maksimal 20 karakter",
  }),
}).min(1).messages({
  "object.min": "Minimal satu field harus diisi untuk update",
});

const getCustomersQuerySchema = Joi.object({
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
});

const customerIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID pelanggan harus diisi",
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
});

const customerPhoneParamSchema = Joi.object({
  phone: Joi.string().max(20).required().messages({
    "any.required": "Nomor telepon harus diisi",
    "string.empty": "Nomor telepon tidak boleh kosong",
    "string.max": "Nomor telepon maksimal 20 karakter",
  }),
});

const checkPhoneAvailabilitySchema = Joi.object({
  phone: Joi.string().max(20).required().messages({
    "any.required": "Nomor telepon harus diisi",
    "string.empty": "Nomor telepon tidak boleh kosong",
    "string.max": "Nomor telepon maksimal 20 karakter",
  }),
  excludeId: Joi.string().optional().messages({
    "string.empty": "ID pengecualian tidak boleh kosong",
  }),
});

export {
  createCustomerSchema,
  upsertCustomerSchema,
  updateCustomerSchema,
  getCustomersQuerySchema,
  customerIdParamSchema,
  customerPhoneParamSchema,
  checkPhoneAvailabilitySchema,
};