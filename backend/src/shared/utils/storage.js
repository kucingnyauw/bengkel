import supabase from "#lib/supabase.js";
import ApiError from "#shared/utils/error.js";

/**
 * Class untuk mengelola operasi file storage menggunakan Supabase
 * @class Storage
 */
class Storage {
  /**
   * Upload file ke storage dan return path saja (tanpa public URL)
   * @param {Object} file - File dari middleware (req.asset)
   * @param {Buffer} file.buffer - Buffer file
   * @param {string} file.checksum - Checksum SHA-256
   * @param {string} file.mimetype - Tipe MIME
   * @param {string} file.originalname - Nama file asli
   * @param {string} [directory="uploads"] - Direktori tujuan dalam bucket
   * @returns {Promise<string>} Path file (bukan public URL)
   * @throws {ApiError} 400 - Jika buffer file kosong
   * @throws {ApiError} 500 - Jika upload gagal
   */
  static async uploadFile(file, directory = "uploads") {
    if (!file?.buffer) {
      throw ApiError.badRequest("File buffer tidak boleh kosong.");
    }

    const bucket = process.env.APP_BUCKET;

    const extension =
      file.originalname.split(".").pop()?.toLowerCase() || "bin";
    const filePath = `${directory}/${file.checksum}.${extension}`;

    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list(directory, { search: file.checksum });

    if (existingFiles && existingFiles.length > 0) {
      return `${directory}/${existingFiles[0].name}`;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw ApiError.internal(
        "Gagal mengunggah file ke storage. Silakan coba lagi."
      );
    }

    return filePath;
  }

  /**
   * Generate signed URL untuk mengakses file private
   * @param {string} path - Path file dalam bucket
   * @param {number} [expiresIn=3600] - Masa berlaku URL dalam detik (default: 1 jam)
   * @returns {Promise<string>} Signed URL yang dapat diakses sementara
   * @throws {ApiError} 400 - Jika path kosong
   * @throws {ApiError} 404 - Jika file tidak ditemukan
   */
  static async getSignedUrl(path, expiresIn = 3600) {
    if (!path) {
      throw ApiError.badRequest("Path file tidak boleh kosong.");
    }

    const bucket = process.env.APP_BUCKET;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      if (error.message.includes("not found")) {
        throw ApiError.notFound("File tidak ditemukan di storage.");
      }
      throw ApiError.internal("Gagal membuat signed URL.");
    }

    return data.signedUrl;
  }

  /**
   * Generate signed URL untuk multiple files
   * @param {string[]} paths - Array path file dalam bucket
   * @param {number} [expiresIn=3600] - Masa berlaku URL dalam detik
   * @returns {Promise<Object[]>} Array object berisi path dan signedUrl
   */
  static async getSignedUrls(paths, expiresIn = 3600) {
    if (!paths || paths.length === 0) {
      throw ApiError.badRequest("Path file tidak boleh kosong.");
    }

    const bucket = process.env.APP_BUCKET;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) {
      throw ApiError.internal("Gagal membuat signed URLs.");
    }

    return data;
  }

  /**
   * Hapus file dari storage
   * @param {string} path - Path file
   * @returns {Promise<boolean>} Status keberhasilan
   * @throws {ApiError} 400 - Jika path kosong
   * @throws {ApiError} 500 - Jika penghapusan gagal
   */
  static async deleteFile(path) {
    if (!path) {
      throw ApiError.badRequest("Path file tidak boleh kosong.");
    }

    const bucket = process.env.APP_BUCKET;

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw ApiError.internal(
        "Gagal menghapus file dari storage. Silakan coba lagi."
      );
    }

    return true;
  }

  /**
   * Hapus banyak file dari storage sekaligus
   * @param {string[]} paths - Array path file
   * @returns {Promise<boolean>} Status keberhasilan
   * @throws {ApiError} 400 - Jika array paths kosong
   * @throws {ApiError} 500 - Jika penghapusan gagal
   */
  static async deleteMultipleFiles(paths) {
    if (!paths || paths.length === 0) {
      throw ApiError.badRequest("Path file tidak boleh kosong.");
    }

    const bucket = process.env.PRIVATE_BUCKET;

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw ApiError.internal(
        "Gagal menghapus file dari storage. Silakan coba lagi."
      );
    }

    return true;
  }
}

export default Storage;
