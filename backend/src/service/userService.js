import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";
import supabase from "#lib/supabase.js";



/**
 * Service untuk mengelola logika bisnis user
 * @class UserService
 */
class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.shiftRepo = new ShiftRepository();
  }

  /**
   * Mengirim Magic Link ke email user
   * @param {string} email - Email tujuan
   * @returns {Promise<void>}
   * @private
   */
  async #sendMagicLink(email) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.BASE_URL}/auth/callback`,
        },
      });

      if (error) {
        logger.warn("Gagal mengirim Magic Link", {
          email,
          error: error.message,
        });
      } else {
        logger.info("Magic Link dikirim", { email });
      }
    } catch (err) {
      logger.error("Error saat mengirim Magic Link", {
        email,
        error: err.message,
      });
    }
  }

  /**
   * Membuat user baru (hanya CASHIER & MECHANIC) + kirim Magic Link
   * @param {Object} payload - Data user
   * @param {string} payload.fullName - Nama lengkap
   * @param {string} payload.email - Email
   * @param {string} payload.phone - Nomor telepon
   * @param {string} payload.role - Role user (CASHIER/MECHANIC)
   * @returns {Promise<Object>} User yang berhasil dibuat
   */
  async createUser(payload) {
    const { fullName, email, phone, role } = payload;

    if (role === "ADMIN" || role === "SUPERADMIN") {
      throw ApiError.forbidden({
        message: "Tidak dapat membuat user dengan role Admin atau Superadmin.",
      });
    }

    if (email) {
      const emailExists = await this.userRepo.isEmailExists(email);
      if (emailExists) {
        throw ApiError.conflict({
          message: `Email ${email} sudah digunakan oleh user lain`,
        });
      }
    }

    if (phone) {
      const phoneExists = await this.userRepo.isPhoneExists(phone);
      if (phoneExists) {
        throw ApiError.conflict({
          message: `Nomor telepon ${phone} sudah digunakan oleh user lain`,
        });
      }
    }

    const user = await this.userRepo.create({
      fullName,
      email,
      phone,
      role,
      isAuthenticated: false,
    });

    if (email) {
      await this.#sendMagicLink(email);
    }

    logger.info(`User dibuat: ${user.fullName}`, {
      userId: user.id,
      role: user.role,
    });
    return user;
  }

  /**
   * Generate ulang Magic Link untuk user yang belum terautentikasi
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Info pengiriman Magic Link
   */
  async resendMagicLink(userId) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw ApiError.notFound({
        message: `User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (!user.email) {
      throw ApiError.badRequest({
        message: "User tidak memiliki email. Tidak dapat mengirim Magic Link.",
      });
    }

    if (user.isAuthenticated) {
      throw ApiError.conflict({
        message: `User '${user.fullName}' sudah terautentikasi. Tidak perlu mengirim ulang Magic Link.`,
      });
    }

    await this.#sendMagicLink(user.email);

    logger.info("Magic Link dikirim ulang", { userId, email: user.email });

    return {
      userId: user.id,
      email: user.email,
      message: "Magic Link telah dikirim ulang ke email user.",
    };
  }

  /**
   * Mendapatkan user berdasarkan ID
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Data user
   */
  async getUserById(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `User dengan ID '${userId}' tidak ditemukan.`,
      });
    }
    return user;
  }

  /**
   * Mendapatkan user berdasarkan email
   * @param {string} email - Email user
   * @returns {Promise<Object>} Data user
   */
  async getUserByEmail(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw ApiError.notFound({
        message: `User dengan email '${email}' tidak ditemukan.`,
      });
    }
    return user;
  }

  /**
   * Mendapatkan user berdasarkan nomor telepon
   * @param {string} phone - Nomor telepon
   * @returns {Promise<Object>} Data user
   */
  async getUserByPhone(phone) {
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      throw ApiError.notFound({
        message: `User dengan nomor telepon '${phone}' tidak ditemukan.`,
      });
    }
    return user;
  }

  /**
   * Mendapatkan daftar user dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar user
   */
  async getUsers(query = {}) {
    const result = await this.userRepo.findMany(query);
    logger.info("Mengambil daftar user", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: {
        role: query.role,
        search: query.search,
        isActive: query.isActive,
      },
    });
    return result;
  }

  /**
   * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar karyawan
   */
  async getEmployees(query = {}) {
    const result = await this.userRepo.findEmployees(query);
    logger.info("Mengambil daftar karyawan", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      role: query.role || "CASHIER & MECHANIC",
      filters: { search: query.search, isActive: query.isActive },
    });
    return result;
  }

  /**
   * Mendapatkan daftar admin
   * @returns {Promise<Array>} Daftar admin
   */
  async getAdmins() {
    const admins = await this.userRepo.findByRole("ADMIN");
    logger.info("Mengambil daftar admin", { count: admins.length });
    return admins;
  }

  /**
   * Mendapatkan user berdasarkan role
   * @param {string} role - Role user
   * @returns {Promise<Array>} Daftar user
   */
  async getUsersByRole(role) {
    return this.userRepo.findByRole(role);
  }

  /**
   * Memperbarui data user
   * @param {string} userId - ID user
   * @param {Object} payload - Data yang akan diupdate
   * @returns {Promise<Object>} User yang sudah diupdate
   */
  async updateUser(userId, payload) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal memperbarui. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existingPhone = await this.userRepo.isPhoneExists(
        payload.phone,
        userId
      );
      if (existingPhone) {
        throw ApiError.conflict({
          message: `Gagal memperbarui. Nomor telepon '${payload.phone}' sudah digunakan oleh user lain.`,
        });
      }
    }

    if (payload.isActive === false && user.isActive === true) {
      const hasActiveShift = await this.shiftRepo.hasActiveShift(userId);
      if (hasActiveShift) {
        throw ApiError.conflict({
          message: `Gagal menonaktifkan. User '${user.fullName}' masih memiliki shift aktif. Tutup shift terlebih dahulu.`,
        });
      }
    }

    const updateData = {};
    if (payload.fullName !== undefined) updateData.fullName = payload.fullName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    const updated = await this.userRepo.update(userId, updateData);

    const changes = [];
    if (payload.fullName !== undefined && payload.fullName !== user.fullName)
      changes.push("fullName");
    if (payload.phone !== undefined && payload.phone !== user.phone)
      changes.push("phone");
    if (payload.role !== undefined && payload.role !== user.role)
      changes.push("role");
    if (payload.isActive !== undefined && payload.isActive !== user.isActive)
      changes.push("isActive");

    logger.info("User berhasil diperbarui", {
      userId,
      changes,
      previous: {
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      current: {
        fullName: updated.fullName,
        role: updated.role,
        isActive: updated.isActive,
      },
    });

    return updated;
  }

  /**
   * Menghapus user
   * @param {string} userId - ID user
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal menghapus. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    const hasActiveShift = await this.shiftRepo.hasActiveShift(userId);
    if (hasActiveShift) {
      throw ApiError.conflict({
        message: `Gagal menghapus. User '${user.fullName}' masih memiliki shift aktif.`,
      });
    }

    const hasRelations = await this.userRepo.hasRelations(userId);
    if (hasRelations) {
      throw ApiError.conflict({
        message: `Gagal menghapus. User '${user.fullName}' masih memiliki data terkait (order, expense, atau stock movement).`,
      });
    }

    await this.userRepo.delete(userId);

    logger.info("User berhasil dihapus", {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

  /**
   * Validasi email user untuk autentikasi (guard Supabase)
   * @param {string} email - Email user
   * @returns {Promise<Object>} Data user
   */
  async validateUserEmail(email) {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw ApiError.notFound({
        message: `Akun dengan email '${email}' tidak terdaftar. Hubungi admin untuk pendaftaran.`,
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden({
        message: `Akun dengan email '${email}' telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.`,
      });
    }

    if (!user.isAuthenticated) {
      throw ApiError.forbidden({
        message: `Akun kamu belum diaktifkan. Silakan cek email '${email}' dan klik link verifikasi yang telah dikirim.`,
      });
    }

    return user;
  }

  /**
   * Mengecek ketersediaan email
   * @param {string} email - Email yang dicek
   * @param {string} [excludeId] - ID user yang dikecualikan
   * @returns {Promise<Object>} Status ketersediaan email
   */
  async checkEmailExists(email, excludeId = null) {
    const user = await this.userRepo.isEmailExists(email, excludeId);

    if (!user) {
      return {
        exists: false,
        isActive: false,
        message: `Email '${email}' tersedia.`,
      };
    }

    return {
      exists: true,
      isActive: user.isActive,
      message: user.isActive
        ? `Email '${email}' sudah terdaftar dan aktif.`
        : `Email '${email}' sudah terdaftar tetapi sedang dinonaktifkan.`,
    };
  }

  /**
   * Mengecek ketersediaan nomor telepon
   * @param {string} phone - Nomor telepon yang dicek
   * @param {string} [excludeId] - ID user yang dikecualikan
   * @returns {Promise<Object>} Status ketersediaan nomor telepon
   */
  async checkPhoneExists(phone, excludeId = null) {
    const user = await this.userRepo.isPhoneExists(phone, excludeId);

    if (!user) {
      return {
        exists: false,
        isActive: false,
        message: `Nomor telepon '${phone}' tersedia.`,
      };
    }

    return {
      exists: true,
      isActive: user.isActive,
      message: user.isActive
        ? `Nomor telepon '${phone}' sudah digunakan oleh user aktif.`
        : `Nomor telepon '${phone}' sudah digunakan oleh user yang dinonaktifkan.`,
    };
  }
}

export default UserService;
