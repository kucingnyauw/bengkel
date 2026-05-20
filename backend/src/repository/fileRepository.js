import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

/**
 * @typedef {import('@prisma/client').File} File
 */

class FileRepository {
  /**
   * @param {Object} data
   * @param {string} data.path
   * @param {string} data.fileName
   * @param {string} [data.mimeType]
   * @param {number} [data.size]
   * @param {string} [data.checksum]
   * @param {string} [data.uploadedById]
   * @returns {Promise<File>}
   */
  async create(data) {
    return prisma.file.create({
      data: {
        path: data.path,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        checksum: data.checksum,
        uploadedById: data.uploadedById,
      },
      select: {
        id: true,
        path: true,
        fileName: true,
        mimeType: true,
        size: true,
        checksum: true,
        uploadedById: true,
        createdAt: true,
      },
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<File | null>}
   */
  async findById(id) {
    return prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * @param {string} checksum
   * @returns {Promise<File | null>}
   */
  async findByChecksum(checksum) {
    return prisma.file.findFirst({
      where: { checksum },
    });
  }

  /**
   * @param {string} path
   * @returns {Promise<File | null>}
   */
  async findByPath(path) {
    return prisma.file.findFirst({
      where: { path },
    });
  }

  /**
   * @param {Object} query
   * @param {number} [query.page]
   * @param {number} [query.limit]
   * @param {string} [query.uploadedById]
   * @param {Date} [query.startDate]
   * @param {Date} [query.endDate]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async findMany(query = {}) {
    const {
      skip,
      limit,
      metadata: paginationMeta,
    } = Pagination.create({
      page: query.page,
      limit: query.limit,
    });

    const where = {};

    if (query.uploadedById) {
      where.uploadedById = query.uploadedById;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [total, data] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const metadata = Pagination.generateMetadata(
      total,
      paginationMeta.currentPage,
      paginationMeta.itemsPerPage
    );

    return { data, metadata };
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.file.delete({
      where: { id },
    });
  }

  /**
   * @param {string} path
   * @returns {Promise<void>}
   */
  async deleteByPath(path) {
    const file = await prisma.file.findFirst({
      where: { path },
      select: { id: true },
    });

    if (file) {
      await prisma.file.delete({
        where: { id: file.id },
      });
    }
  }
}

export default FileRepository;