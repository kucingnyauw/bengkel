import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "any.required": "Nama produk harus diisi",
    "string.empty": "Nama produk tidak boleh kosong",
    "string.min": "Nama produk minimal 1 karakter",
    "string.max": "Nama produk maksimal 100 karakter",
  }),
  type: Joi.string()
    .valid("SPAREPART", "SERVICE")
    .optional()
    .default("SPAREPART")
    .messages({
      "any.only": "Tipe produk harus SPAREPART atau SERVICE",
    }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Deskripsi maksimal 500 karakter",
  }),
  price: Joi.number().integer().min(0).max(99999999).required().messages({
    "any.required": "Harga jual harus diisi",
    "number.base": "Harga jual harus berupa angka",
    "number.integer": "Harga jual harus berupa bilangan bulat",
    "number.min": "Harga jual tidak boleh negatif",
    "number.max": "Harga jual maksimal 99.999.999",
  }),
  cost: Joi.number()
    .integer()
    .min(0)
    .max(99999999)
    .optional()
    .default(0)
    .messages({
      "number.base": "Harga modal harus berupa angka",
      "number.integer": "Harga modal harus berupa bilangan bulat",
      "number.min": "Harga modal tidak boleh negatif",
      "number.max": "Harga modal maksimal 99.999.999",
    }),
  stock: Joi.number()
    .integer()
    .min(0)
    .max(999999)
    .optional()
    .default(0)
    .messages({
      "number.base": "Stok harus berupa angka",
      "number.integer": "Stok harus berupa bilangan bulat",
      "number.min": "Stok tidak boleh negatif",
      "number.max": "Stok maksimal 999.999",
    }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Nama produk tidak boleh kosong",
    "string.min": "Nama produk minimal 1 karakter",
    "string.max": "Nama produk maksimal 100 karakter",
  }),
  type: Joi.string().valid("SPAREPART", "SERVICE").optional().messages({
    "any.only": "Tipe produk harus SPAREPART atau SERVICE",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Deskripsi maksimal 500 karakter",
  }),
  price: Joi.number().integer().min(0).max(99999999).optional().messages({
    "number.base": "Harga jual harus berupa angka",
    "number.integer": "Harga jual harus berupa bilangan bulat",
    "number.min": "Harga jual tidak boleh negatif",
    "number.max": "Harga jual maksimal 99.999.999",
  }),
  cost: Joi.number().integer().min(0).max(99999999).optional().messages({
    "number.base": "Harga modal harus berupa angka",
    "number.integer": "Harga modal harus berupa bilangan bulat",
    "number.min": "Harga modal tidak boleh negatif",
    "number.max": "Harga modal maksimal 99.999.999",
  }),
  isActive: Joi.boolean().truthy("true").falsy("false").optional(),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diisi untuk update",
  });

const getProductsQuerySchema = Joi.object({
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
  type: Joi.string().valid("SPAREPART", "SERVICE").optional().messages({
    "any.only": "Tipe produk harus SPAREPART atau SERVICE",
  }),
  isActive: Joi.boolean().optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional().messages({
    "number.base": "Threshold stok rendah harus berupa angka",
    "number.integer": "Threshold stok rendah harus berupa bilangan bulat",
    "number.min": "Threshold stok rendah tidak boleh negatif",
  }),
  minPrice: Joi.number().integer().min(0).optional().messages({
    "number.base": "Harga minimum harus berupa angka",
    "number.integer": "Harga minimum harus berupa bilangan bulat",
    "number.min": "Harga minimum tidak boleh negatif",
  }),
  maxPrice: Joi.number().integer().min(0).optional().messages({
    "number.base": "Harga maksimum harus berupa angka",
    "number.integer": "Harga maksimum harus berupa bilangan bulat",
    "number.min": "Harga maksimum tidak boleh negatif",
  }),
  sortBy: Joi.string()
    .valid("name", "price", "stock", "createdAt")
    .optional()
    .messages({
      "any.only": "Sort by harus name, price, stock, atau createdAt",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc")
    .messages({
      "any.only": "Sort order harus asc atau desc",
    }),
});

const checkSkuAvailabilitySchema = Joi.object({
  sku: Joi.string().min(1).max(50).required().messages({
    "any.required": "SKU harus diisi",
    "string.empty": "SKU tidak boleh kosong",
    "string.min": "SKU minimal 1 karakter",
    "string.max": "SKU maksimal 50 karakter",
  }),
  excludeId: Joi.string().optional().allow("").messages({
    "string.empty": "ID pengecualian tidak boleh kosong",
  }),
});

const productIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
});

const productSkuParamSchema = Joi.object({
  sku: Joi.string().min(1).max(50).required().messages({
    "any.required": "SKU produk harus diisi",
    "string.empty": "SKU produk tidak boleh kosong",
    "string.min": "SKU produk minimal 1 karakter",
    "string.max": "SKU produk maksimal 50 karakter",
  }),
});

export {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  checkSkuAvailabilitySchema,
  productIdParamSchema,
  productSkuParamSchema,
};
