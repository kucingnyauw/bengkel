import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const createPaymentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID pesanan harus diisi",
    "string.empty": "ID pesanan tidak boleh kosong",
  }),

  method: Joi.string()
    .uppercase()
    .valid("CASH", "QRIS")
    .required()
    .messages({
      "any.required": "Metode pembayaran harus diisi",
      "string.empty": "Metode pembayaran tidak boleh kosong",
      "any.only": "Metode pembayaran harus CASH atau QRIS",
    }),

  amountPaid: Joi.number()
    .integer()
    .min(1)
    .max(99999999)
    .when("method", {
      is: "CASH",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.required": "Jumlah pembayaran harus diisi",
      "number.base": "Jumlah pembayaran harus berupa angka",
      "number.integer": "Jumlah pembayaran harus berupa bilangan bulat",
      "number.min": "Jumlah pembayaran minimal 1",
      "number.max": "Jumlah pembayaran maksimal 99.999.999",
    }),
});

const refundPaymentSchema = Joi.object({
  reason: Joi.string()
    .min(3)
    .max(255)
    .optional()
    .allow("")
    .messages({
      "string.min": "Alasan refund minimal 3 karakter",
      "string.max": "Alasan refund maksimal 255 karakter",
    }),
});

const getPaymentsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(MAX_PAGE)
    .optional()
    .default(1)
    .messages({
      "number.base": "Halaman harus berupa angka",
      "number.integer": "Halaman harus berupa bilangan bulat",
      "number.min": "Halaman minimal 1",
      "number.max": `Halaman maksimal ${MAX_PAGE}`,
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(MAX_LIMIT)
    .optional()
    .default(10)
    .messages({
      "number.base": "Limit harus berupa angka",
      "number.integer": "Limit harus berupa bilangan bulat",
      "number.min": "Limit minimal 1",
      "number.max": `Limit maksimal ${MAX_LIMIT}`,
    }),

  orderId: Joi.string().optional().messages({
    "string.empty": "ID pesanan tidak boleh kosong",
  }),

  status: Joi.string()
    .uppercase()
    .valid("PENDING", "PAID", "REFUNDED")
    .optional()
    .messages({
      "any.only": "Status pembayaran harus PENDING, PAID, atau REFUNDED",
    }),

  method: Joi.string()
    .uppercase()
    .valid("CASH", "QRIS")
    .optional()
    .messages({
      "any.only": "Metode pembayaran harus CASH atau QRIS",
    }),

  startDate: Joi.date().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
  }),

  endDate: Joi.date()
    .min(Joi.ref("startDate"))
    .optional()
    .messages({
      "date.base": "Tanggal akhir harus berupa tanggal yang valid",
      "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
    }),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID pesanan harus diisi",
    "string.empty": "ID pesanan tidak boleh kosong",
  }),
});

const paymentIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID pembayaran harus diisi",
    "string.empty": "ID pembayaran tidak boleh kosong",
  }),
});

export {
  createPaymentSchema,
  refundPaymentSchema,
  getPaymentsQuerySchema,
  orderIdParamSchema,
  paymentIdParamSchema,
};