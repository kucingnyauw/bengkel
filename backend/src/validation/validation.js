import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

const validate = (schema, request, options = {}) => {
  const { error, value } = schema.validate(request, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
    ...options,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message.replace(/"/g, ""),
    }));

    logger.error(error)

    throw ApiError.badRequest({
      message: "Validasi gagal",
      details,
    });
  }

  return value;
};

export default validate;