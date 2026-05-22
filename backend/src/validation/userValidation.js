import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const phonePattern = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
const namePattern = /^[a-zA-Z\s]+$/;

const createUserSchema = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "any.required": "Email harus diisi",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
  }),
  fullName: Joi.string()
    .min(1)
    .max(100)
    .pattern(namePattern)
    .required()
    .messages({
      "any.required": "Nama lengkap harus diisi",
      "string.empty": "Nama lengkap tidak boleh kosong",
      "string.min": "Nama lengkap minimal 1 karakter",
      "string.max": "Nama lengkap maksimal 100 karakter",
      "string.pattern.base": "Nama lengkap hanya boleh berisi huruf dan spasi",
    }),
  phone: Joi.string()
    .pattern(phonePattern)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base":
        "Format nomor telepon tidak valid. Gunakan format 08xx, 62xx, atau +62xx",
    }),
  role: Joi.string()
    .valid("CASHIER", "MECHANIC")
    .optional()
    .default("CASHIER")
    .messages({
      "any.only": "Role harus CASHIER atau MECHANIC",
    }),
});

const resendMagicLinkSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID user harus diisi",
    "string.empty": "ID user tidak boleh kosong",
  }),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string()
    .min(1)
    .max(100)
    .pattern(namePattern)
    .optional()
    .messages({
      "string.empty": "Nama lengkap tidak boleh kosong",
      "string.min": "Nama lengkap minimal 1 karakter",
      "string.max": "Nama lengkap maksimal 100 karakter",
      "string.pattern.base": "Nama lengkap hanya boleh berisi huruf dan spasi",
    }),
  phone: Joi.string()
    .pattern(phonePattern)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base":
        "Format nomor telepon tidak valid. Gunakan format 08xx, 62xx, atau +62xx",
    }),
  role: Joi.string()
    .valid("ADMIN", "CASHIER", "MECHANIC")
    .optional()
    .messages({
      "any.only": "Role harus ADMIN, CASHIER, atau MECHANIC",
    }),
  isActive: Joi.boolean().optional().messages({
    "boolean.base": "Status aktif harus berupa boolean",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diisi untuk update",
  });

const getUsersQuerySchema = Joi.object({
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
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  role: Joi.string()
    .valid("ADMIN", "CASHIER", "MECHANIC")
    .optional()
    .messages({
      "any.only": "Role harus ADMIN, CASHIER, atau MECHANIC",
    }),
  isActive: Joi.boolean().optional().messages({
    "boolean.base": "Status aktif harus berupa boolean",
  }),
});

const getEmployeesQuerySchema = Joi.object({
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
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  role: Joi.string().valid("CASHIER", "MECHANIC").optional().messages({
    "any.only": "Role harus CASHIER atau MECHANIC",
  }),
  isActive: Joi.boolean().optional().messages({
    "boolean.base": "Status aktif harus berupa boolean",
  }),
});

const checkEmailExistsSchema = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "any.required": "Email harus diisi",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
  }),
  excludeId: Joi.string().optional().messages({
    "string.empty": "ID pengecualian tidak boleh kosong",
  }),
});

const checkPhoneExistsSchema = Joi.object({
  phone: Joi.string()
    .pattern(phonePattern)
    .required()
    .messages({
      "any.required": "Nomor telepon harus diisi",
      "string.empty": "Nomor telepon tidak boleh kosong",
      "string.pattern.base":
        "Format nomor telepon tidak valid. Gunakan format 08xx, 62xx, atau +62xx",
    }),
  excludeId: Joi.string().optional().messages({
    "string.empty": "ID pengecualian tidak boleh kosong",
  }),
});

const userIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID user harus diisi",
    "string.empty": "ID user tidak boleh kosong",
  }),
});

const userEmailParamSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email harus diisi",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
  }),
});

const userPhoneParamSchema = Joi.object({
  phone: Joi.string()
    .pattern(phonePattern)
    .required()
    .messages({
      "any.required": "Nomor telepon harus diisi",
      "string.empty": "Nomor telepon tidak boleh kosong",
      "string.pattern.base":
        "Format nomor telepon tidak valid. Gunakan format 08xx, 62xx, atau +62xx",
    }),
});

const userRoleParamSchema = Joi.object({
  role: Joi.string()
    .valid("ADMIN", "CASHIER", "MECHANIC")
    .required()
    .messages({
      "any.required": "Role harus diisi",
      "any.only": "Role harus ADMIN, CASHIER, atau MECHANIC",
    }),
});

const validateEmailSchema = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "any.required": "Email harus diisi",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
  }),
});

export {
  createUserSchema,
  resendMagicLinkSchema,
  updateUserSchema,
  getUsersQuerySchema,
  getEmployeesQuerySchema,
  checkEmailExistsSchema,
  checkPhoneExistsSchema,
  userIdParamSchema,
  userEmailParamSchema,
  userPhoneParamSchema,
  userRoleParamSchema,
  validateEmailSchema,
};