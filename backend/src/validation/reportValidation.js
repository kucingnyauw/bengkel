import Joi from "joi";

const dateRangeQuerySchema = Joi.object({
  startDate: Joi.date().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "Tanggal akhir harus berupa tanggal yang valid",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
});

const topProductsQuerySchema = Joi.object({
  startDate: Joi.date().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "Tanggal akhir harus berupa tanggal yang valid",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": "Limit maksimal 100",
  }),
});

const shiftIdParamSchema = Joi.object({
  shiftId: Joi.string().required().messages({
    "any.required": "ID shift harus diisi",
    "string.empty": "ID shift tidak boleh kosong",
  }),
});

const productIdParamSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
});

const mechanicIdParamSchema = Joi.object({
  mechanicId: Joi.string().required().messages({
    "any.required": "ID mekanik harus diisi",
    "string.empty": "ID mekanik tidak boleh kosong",
  }),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID order harus diisi",
    "string.empty": "ID order tidak boleh kosong",
  }),
});

export {
  dateRangeQuerySchema,
  topProductsQuerySchema,
  shiftIdParamSchema,
  productIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
};