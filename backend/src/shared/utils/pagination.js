import ApiError from "#shared/utils/error.js";

class Pagination {
  static create({ page = 1, limit = 10 } = {}) {
    const { validPage, validLimit } = this.validate(page, limit);
    const skip = (validPage - 1) * validLimit;

    return {
      skip,
      limit: validLimit,
      metadata: {
        currentPage: validPage,
        itemsPerPage: validLimit,
        skip,
      },
    };
  }

  static calculateTotalPages(totalItems, itemsPerPage) {
    const total = Number(totalItems);
    const limit = Number(itemsPerPage);

    if (!total || total <= 0) return 1;
    if (!limit || limit <= 0) return 1;

    return Math.ceil(total / limit);
  }

  static generateMetadata(totalItems, currentPage, itemsPerPage) {
    const totalPages = this.calculateTotalPages(totalItems, itemsPerPage);

    const current = Number(currentPage);
    const limit = Number(itemsPerPage);

    return {
      currentPage: current,
      itemsPerPage: limit,
      totalItems: Number(totalItems) || 0,
      totalPages,
      hasNextPage: current < totalPages,
      hasPrevPage: current > 1,
    };
  }

  static validate(page, limit) {
    const validPage = Number(page);
    const validLimit = Number(limit);

    if (Number.isNaN(validPage) || validPage < 1) {
      throw ApiError.badRequest({
        message: "Parameter 'page' tidak valid. Harus berupa angka mulai dari 1 atau lebih.",
      });
    }

    if (Number.isNaN(validLimit) || validLimit < 1) {
      throw ApiError.badRequest({
        message: "Parameter 'limit' tidak valid. Harus berupa angka lebih dari 0.",
      });
    }

    if (validLimit > 100) {
      throw ApiError.badRequest({
        message: "Parameter 'limit' terlalu besar. Maksimal 100 data per halaman.",
      });
    }

    return { validPage, validLimit };
  }
}

export default Pagination;