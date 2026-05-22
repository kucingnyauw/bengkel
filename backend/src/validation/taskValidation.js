import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const assignMechanicSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID pesanan harus diisi",
    "string.empty": "ID pesanan tidak boleh kosong",
  }),
  mechanicId: Joi.string().required().messages({
    "any.required": "ID mekanik harus diisi",
    "string.empty": "ID mekanik tidak boleh kosong",
  }),
});

const bulkAssignMechanicsSchema = Joi.object({
  assignments: Joi.array()
    .items(
      Joi.object({
        orderId: Joi.string().required().messages({
          "any.required": "ID pesanan harus diisi",
          "string.empty": "ID pesanan tidak boleh kosong",
        }),
        mechanicId: Joi.string().required().messages({
          "any.required": "ID mekanik harus diisi",
          "string.empty": "ID mekanik tidak boleh kosong",
        }),
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      "any.required": "Assignments harus diisi",
      "array.base": "Assignments harus berupa array",
      "array.min": "Minimal 1 assignment",
      "array.max": "Maksimal 50 assignment",
    }),
});

const getTasksQuerySchema = Joi.object({
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
  mechanicId: Joi.string().optional().messages({
    "string.empty": "ID mekanik tidak boleh kosong",
  }),
  orderItemId: Joi.string().optional().messages({
    "string.empty": "ID order item tidak boleh kosong",
  }),
  orderId: Joi.string().optional().messages({
    "string.empty": "ID order tidak boleh kosong",
  }),
  orderStatus: Joi.string()
    .valid("DRAFT", "QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED")
    .optional()
    .messages({
      "any.only": "Status order tidak valid",
    }),
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Format tanggal mulai tidak valid",
    "date.format": "Format tanggal mulai harus ISO (YYYY-MM-DD)",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.base": "Format tanggal akhir tidak valid",
    "date.format": "Format tanggal akhir harus ISO (YYYY-MM-DD)",
  }),
});

const assignmentIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID assignment harus diisi",
    "string.empty": "ID assignment tidak boleh kosong",
  }),
});

const orderItemIdParamSchema = Joi.object({
  orderItemId: Joi.string().required().messages({
    "any.required": "ID order item harus diisi",
    "string.empty": "ID order item tidak boleh kosong",
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
  assignMechanicSchema,
  bulkAssignMechanicsSchema,
  getTasksQuerySchema,
  assignmentIdParamSchema,
  orderItemIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
};