import ApiError from "#shared/utils/error.js";

 const roleMiddleware = ({ allowedRoles = [] } = {}) => {
  return async (req, _, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized({
          message: "Anda harus login terlebih dahulu",
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw ApiError.forbidden({
          message: "Anda tidak memiliki akses untuk melakukan aksi ini",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};


export default roleMiddleware;