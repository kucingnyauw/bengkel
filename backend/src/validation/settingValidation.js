import Joi from "joi";

export const updateSettingSchema = Joi.object({
  value: Joi.string().required().messages({
    "any.required": "Value wajib diisi",
    "string.empty": "Value tidak boleh kosong",
  }),
});

export const bulkUpdateSettingSchema = Joi.object({
  settings: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Minimal 1 setting",
      "any.required": "Settings wajib diisi",
    }),
});
