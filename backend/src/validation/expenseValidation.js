import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const createExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    "any.required": "Judul pengeluaran harus diisi",
    "string.empty": "Judul pengeluaran tidak boleh kosong",
    "string.min": "Judul pengeluaran minimal 1 karakter",
    "string.max": "Judul pengeluaran maksimal 100 karakter",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Deskripsi maksimal 500 karakter",
  }),
  amount: Joi.number().integer().min(1).max(99999999).required().messages({
    "any.required": "Jumlah pengeluaran harus diisi",
    "number.base": "Jumlah pengeluaran harus berupa angka",
    "number.integer": "Jumlah pengeluaran harus berupa bilangan bulat",
    "number.min": "Jumlah pengeluaran minimal 1",
    "number.max": "Jumlah pengeluaran maksimal 99.999.999",
  }),
  category: Joi.string()
    .valid("SUPPLIES", "MAINTENANCE", "UTILITIES", "SALARY", "RENT", "OTHER")
    .optional()
    .default("OTHER")
    .messages({
      "any.only": "Kategori harus SUPPLIES, MAINTENANCE, UTILITIES, SALARY, RENT, atau OTHER",
    }),
  date: Joi.date().optional().messages({
    "date.base": "Tanggal harus berupa tanggal yang valid",
  }),
}).messages({
  "object.unknown": "Field {{#label}} tidak dikenal",
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Judul pengeluaran tidak boleh kosong",
    "string.min": "Judul pengeluaran minimal 1 karakter",
    "string.max": "Judul pengeluaran maksimal 100 karakter",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Deskripsi maksimal 500 karakter",
  }),
  amount: Joi.number().integer().min(1).max(99999999).optional().messages({
    "number.base": "Jumlah pengeluaran harus berupa angka",
    "number.integer": "Jumlah pengeluaran harus berupa bilangan bulat",
    "number.min": "Jumlah pengeluaran minimal 1",
    "number.max": "Jumlah pengeluaran maksimal 99.999.999",
  }),
  category: Joi.string()
    .valid("SUPPLIES", "MAINTENANCE", "UTILITIES", "SALARY", "RENT", "OTHER")
    .optional()
    .messages({
      "any.only": "Kategori harus SUPPLIES, MAINTENANCE, UTILITIES, SALARY, RENT, atau OTHER",
    }),
  date: Joi.date().optional().messages({
    "date.base": "Tanggal harus berupa tanggal yang valid",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diisi untuk update",
    "object.unknown": "Field {{#label}} tidak dikenal",
  });

const getExpensesQuerySchema = Joi.object({
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
  category: Joi.string()
    .valid("SUPPLIES", "MAINTENANCE", "UTILITIES", "SALARY", "RENT", "OTHER")
    .optional()
    .messages({
      "any.only": "Kategori harus SUPPLIES, MAINTENANCE, UTILITIES, SALARY, RENT, atau OTHER",
    }),
  shiftId: Joi.string().optional().messages({
    "string.empty": "ID shift tidak boleh kosong",
  }),
  recordedById: Joi.string().optional().messages({
    "string.empty": "ID user pencatat tidak boleh kosong",
  }),
  startDate: Joi.date().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "Tanggal akhir harus berupa tanggal yang valid",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
}).messages({
  "object.unknown": "Field {{#label}} tidak dikenal",
});

const expenseIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID pengeluaran harus diisi",
    "string.empty": "ID pengeluaran tidak boleh kosong",
  }),
}).messages({
  "object.unknown": "Field {{#label}} tidak dikenal",
});

const shiftIdParamSchema = Joi.object({
  shiftId: Joi.string().required().messages({
    "any.required": "ID shift harus diisi",
    "string.empty": "ID shift tidak boleh kosong",
  }),
}).messages({
  "object.unknown": "Field {{#label}} tidak dikenal",
});

export {
  createExpenseSchema,
  updateExpenseSchema,
  getExpensesQuerySchema,
  expenseIdParamSchema,
  shiftIdParamSchema,
};