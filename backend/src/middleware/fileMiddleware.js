import ApiError from "#shared/utils/error.js";
import FileRepository from "#repository/fileRepository.js";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { MAX_FILE_SIZE, FILE_MIME } from "#shared/constant/constants.js";

const storage = multer.memoryStorage();
const fileRepo = new FileRepository();

/**
 * Generate checksum SHA-256 dari buffer file
 * @param {Buffer} buffer - Buffer file
 * @returns {string} Checksum hash
 */
const generateChecksum = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Memproses file berdasarkan tipe MIME
 * @param {Object} file - File dari multer
 * @param {string} file.mimetype - Tipe MIME file
 * @param {number} file.size - Ukuran file dalam bytes
 * @param {Buffer} file.buffer - Buffer file
 * @param {string} file.originalname - Nama asli file
 * @returns {Promise<Object>} File yang sudah diproses dengan checksum
 * @throws {ApiError} Jika format file tidak didukung atau ukuran melebihi batas
 */
const processFile = async (file) => {
  const { mimetype, size, originalname } = file;
  const safeName = originalname || `file-${Date.now()}.jpg`;

  if (FILE_MIME.IMAGE.includes(mimetype)) {
    const maxSize = MAX_FILE_SIZE.IMAGE;

    if (size > maxSize) {
      throw ApiError.badRequest({
        message: `Ukuran file gambar maksimal ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const buffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const checksum = generateChecksum(buffer);

    return {
      ...file,
      buffer,
      checksum,
      mimetype: "image/webp",
      originalname: safeName.replace(/\.\w+$/, ".webp"),
    };
  }

  if (FILE_MIME.VIDEO.includes(mimetype)) {
    const maxSize = MAX_FILE_SIZE.VIDEO;

    if (size > maxSize) {
      throw ApiError.badRequest({
        message: `Ukuran file video maksimal ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const checksum = generateChecksum(file.buffer);

    return {
      ...file,
      checksum,
    };
  }

  if (FILE_MIME.DOCUMENT.includes(mimetype)) {
    const maxSize = MAX_FILE_SIZE.DOCUMENT;

    if (size > maxSize) {
      throw ApiError.badRequest({
        message: `Ukuran file dokumen maksimal ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const checksum = generateChecksum(file.buffer);

    return {
      ...file,
      checksum,
    };
  }

  throw ApiError.badRequest({
    message: "Format file tidak didukung",
  });
};

/**
 * Memeriksa apakah file dengan checksum yang sama sudah ada di database
 * @param {string} checksum - Checksum file
 * @returns {Promise<boolean>} False jika file belum ada
 * @throws {ApiError} Jika file sudah ada
 */
const checkDuplicateByChecksum = async (checksum) => {
  const existingFile = await fileRepo.findByChecksum(checksum);

  if (existingFile) {
    throw ApiError.conflict({
      message: "File sudah pernah diunggah sebelumnya",
    });
  }

  return false;
};

/**
 * Middleware untuk upload file (single atau multiple)
 * @param {Object} options - Opsi middleware
 * @param {string} [options.field="file"] - Nama field form untuk file
 * @param {boolean} [options.multiple=false] - Apakah multiple file
 * @param {number} [options.maxCount=5] - Jumlah maksimal file untuk multiple
 * @param {boolean} [options.skipDuplicateCheck=false] - Skip pengecekan duplikasi
 * @returns {Array} Array middleware [multer, handler]
 */
export const fileMiddleware = ({
  field = "file",
  multiple = false,
  maxCount = 5,
  skipDuplicateCheck = false,
} = {}) => {
  const upload = multiple
    ? multer({ storage }).array(field, maxCount)
    : multer({ storage }).single(field);

  return [
    upload,
    async (req, res, next) => {
      try {
        if (multiple) {
          const files = req.files;

          if (!files || files.length === 0) {
            throw ApiError.badRequest({ message: "File tidak boleh kosong" });
          }

          const processed = [];
          const checksums = new Set();

          for (const file of files) {
            const processedFile = await processFile(file);

            if (checksums.has(processedFile.checksum)) {
              throw ApiError.badRequest({
                message: "Terdapat file duplikat dalam satu request",
              });
            }

            checksums.add(processedFile.checksum);

            if (!skipDuplicateCheck) {
              await checkDuplicateByChecksum(processedFile.checksum);
            }

            processed.push(processedFile);
          }

          req.assets = processed;
        } else {
          const file = req.file;

          if (!file) {
            throw ApiError.badRequest({ message: "File tidak boleh kosong" });
          }

          const processedFile = await processFile(file);

          if (!skipDuplicateCheck) {
            await checkDuplicateByChecksum(processedFile.checksum);
          }

          req.asset = processedFile;
        }

        next();
      } catch (err) {
        next(err);
      }
    },
  ];
};

/**
 * Middleware untuk upload single file (required)
 * @param {string} [field="file"] - Nama field form untuk file
 * @returns {Array} Array middleware [multer, handler]
 */
export const fileUploadSingle = (field = "file") => {
  return fileMiddleware({ field, multiple: false });
};

/**
 * Middleware untuk upload multiple files (required)
 * @param {string} [field="files"] - Nama field form untuk files
 * @param {number} [maxCount=5] - Jumlah maksimal file
 * @returns {Array} Array middleware [multer, handler]
 */
export const fileUploadMultiple = (field = "files", maxCount = 5) => {
  return fileMiddleware({ field, multiple: true, maxCount });
};

/**
 * Middleware untuk upload single file (optional)
 * @param {string} [field="file"] - Nama field form untuk file
 * @returns {Array} Array middleware [multer, handler]
 */
export const fileUploadOptional = (field = "file") => {
  const upload = multer({ storage }).single(field);

  return [
    upload,
    async (req, res, next) => {
      try {
        const file = req.file;

        if (file) {
          const processedFile = await processFile(file);
          await checkDuplicateByChecksum(processedFile.checksum);
          req.asset = processedFile;
        } else {
          req.asset = null;
        }

        next();
      } catch (err) {
        next(err);
      }
    },
  ];
};