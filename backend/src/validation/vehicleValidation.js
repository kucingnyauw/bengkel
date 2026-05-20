import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const registerVehicleSchema = Joi.object({
  plateNumber: Joi.string().min(1).max(20).required().messages({
    "any.required": "Nomor plat kendaraan harus diisi",
    "string.empty": "Nomor plat kendaraan tidak boleh kosong",
    "string.min": "Nomor plat kendaraan minimal 1 karakter",
    "string.max": "Nomor plat kendaraan maksimal 20 karakter",
  }),
  customerId: Joi.string().required().messages({
    "any.required": "ID pelanggan harus diisi",
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
  brand: Joi.string().max(50).optional().allow("").messages({
    "string.max": "Merek kendaraan maksimal 50 karakter",
  }),
  model: Joi.string().max(50).optional().allow("").messages({
    "string.max": "Model kendaraan maksimal 50 karakter",
  }),
});

const updateVehicleSchema = Joi.object({
  plateNumber: Joi.string().min(1).max(20).optional().messages({
    "string.empty": "Nomor plat kendaraan tidak boleh kosong",
    "string.min": "Nomor plat kendaraan minimal 1 karakter",
    "string.max": "Nomor plat kendaraan maksimal 20 karakter",
  }),
  brand: Joi.string().max(50).optional().allow("").messages({
    "string.max": "Merek kendaraan maksimal 50 karakter",
  }),
  model: Joi.string().max(50).optional().allow("").messages({
    "string.max": "Model kendaraan maksimal 50 karakter",
  }),
}).min(1).messages({
  "object.min": "Minimal satu field harus diisi untuk update",
});

const getVehiclesQuerySchema = Joi.object({
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
  customerId: Joi.string().optional().messages({
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
});

const checkPlateNumberExistsSchema = Joi.object({
  plateNumber: Joi.string().min(1).max(20).required().messages({
    "any.required": "Nomor plat harus diisi",
    "string.empty": "Nomor plat tidak boleh kosong",
    "string.min": "Nomor plat minimal 1 karakter",
    "string.max": "Nomor plat maksimal 20 karakter",
  }),
  excludeId: Joi.string().optional().messages({
    "string.empty": "ID pengecualian tidak boleh kosong",
  }),
});

const vehicleIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID kendaraan harus diisi",
    "string.empty": "ID kendaraan tidak boleh kosong",
  }),
});

const plateNumberParamSchema = Joi.object({
  plateNumber: Joi.string().min(1).max(20).required().messages({
    "any.required": "Nomor plat kendaraan harus diisi",
    "string.empty": "Nomor plat kendaraan tidak boleh kosong",
    "string.min": "Nomor plat kendaraan minimal 1 karakter",
    "string.max": "Nomor plat kendaraan maksimal 20 karakter",
  }),
});

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    "any.required": "ID pelanggan harus diisi",
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
});

export {
  registerVehicleSchema,
  updateVehicleSchema,
  getVehiclesQuerySchema,
  checkPlateNumberExistsSchema,
  vehicleIdParamSchema,
  plateNumberParamSchema,
  customerIdParamSchema,
};