import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";
import supabase from "#lib/supabase.js";
import CacheManager from "#shared/utils/cache.js";

/**
 * Service untuk mengelola logika bisnis user
 * @class UserService
 */
class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.shiftRepo = new ShiftRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("auth:user");
  }

  /**
   * Mengirim Magic Link ke email user (Untuk Login / Resend)
   * @param {string} email
   * @returns {Promise<void>}
   * @throws {ApiError}
   * @private
   */
  async #sendMagicLink(email) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.APP_URL}/auth/callback`,
        },
      });

      if (error) {
        if (error.code === "over_email_send_rate_limit") {
          throw ApiError.tooManyRequests({
            message: "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
          });
        }

        logger.warn("Gagal mengirim Magic Link", {
          email,
          error: error.message,
          code: error.code,
        });
        throw ApiError.internal({
          message: "Gagal mengirim email verifikasi. Silakan coba lagi.",
        });
      }

      logger.info("Magic Link dikirim", { email });
    } catch (err) {
      if (err instanceof ApiError) throw err;

      if (err?.code === "over_email_send_rate_limit" || err?.status === 429) {
        throw ApiError.tooManyRequests({
          message: "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
        });
      }

      logger.error("Error saat mengirim Magic Link", {
        email,
        error: err.message,
      });
      throw ApiError.internal({
        message: "Gagal mengirim email verifikasi.",
      });
    }
  }

  /**
   * Mengirim notifikasi ke user
   * @param {string} userId
   * @param {string} title
   * @param {string} message
   * @param {string} [type="INFO"]
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    try {
      await this.notifRepo.create({ title, message, type, userId });
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi user", {
        userId,
        error: err.message,
      });
    }
  }

  /**
   * Validasi role yang diizinkan untuk dibuat
   * @param {string} role
   * @throws {ApiError}
   * @private
   */
  #validateCreatableRole(role) {
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (!allowedRoles.includes(role)) {
      throw ApiError.forbidden({
        message: `Tidak dapat membuat user dengan role ${role}. Role yang diizinkan: ${allowedRoles.join(", ")}.`,
      });
    }
  }

  /**
   * Validasi role yang diizinkan untuk diupdate
   * @param {string} currentRole
   * @param {string} newRole
   * @throws {ApiError}
   * @private
   */
  #validateUpdatableRole(currentRole, newRole) {
    if (currentRole === "ADMIN" && newRole !== "ADMIN") {
      throw ApiError.forbidden({
        message: "Tidak dapat mengubah role Admin.",
      });
    }

    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (newRole && !allowedRoles.includes(newRole) && newRole !== "ADMIN") {
      throw ApiError.forbidden({
        message: `Role '${newRole}' tidak valid. Role yang diizinkan: ${allowedRoles.join(", ")}.`,
      });
    }
  }

  /**
   * Membuat user baru (hanya CASHIER & MECHANIC)
   * Menggunakan Supabase Admin API agar ID Auth dan Public tersinkronisasi.
   * @param {Object} payload
   * @param {string} payload.fullName
   * @param {string} payload.email
   * @param {string} payload.phone
   * @param {string} payload.role
   * @returns {Promise<Object>}
   */
  async createUser(payload) {
    const { fullName, email, phone, role } = payload;

    this.#validateCreatableRole(role);

    if (!email) {
      throw ApiError.badRequest({
        message: "Email wajib diisi untuk membuat user baru.",
      });
    }

    const emailExists = await this.userRepo.isEmailExists(email);
    if (emailExists) {
      throw ApiError.conflict({
        message: `Email ${email} sudah digunakan oleh user lain`,
      });
    }

    if (phone) {
      const phoneExists = await this.userRepo.isPhoneExists(phone);
      if (phoneExists) {
        throw ApiError.conflict({
          message: `Nomor telepon ${phone} sudah digunakan oleh user lain`,
        });
      }
    }

    // 1. Buat user via Supabase Admin API (Ini otomatis mengirim email "Invite")
    // Membutuhkan SUPABASE_SERVICE_ROLE_KEY di inisialisasi #lib/supabase.js
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          fullName: fullName,
          phone: phone,
          role: role,
        },
      }
    );

    if (authError) {
      logger.error("Gagal membuat user di Supabase Auth", { error: authError.message });
      throw ApiError.internal({
        message: `Gagal membuat user. Supabase Error: ${authError.message}`,
      });
    }

    const userId = authData.user.id;

    // 2. Trigger di database akan otomatis memasukkan data ke public."User"
    // Kita lakukan fallback fetching untuk mereturn response yang utuh ke client
    let user = await this.userRepo.findById(userId);
    
    // Jika ada delay mikro-detik dari eksekusi trigger, kita construct manual balasan response-nya
    if (!user) {
      user = {
        id: userId,
        email: email,
        fullName: fullName,
        phone: phone,
        role: role,
        isActive: true,
        isAuthenticated: false,
      };
    }

    const roleLabel = role === "CASHIER" ? "Kasir" : "Mekanik";

    await this.#sendNotification(
      userId,
      "Selamat Datang!",
      `Halo ${fullName}, akun Anda telah berhasil dibuat sebagai ${roleLabel}. Selamat bergabung di Bengkel POS.`,
      "SUCCESS"
    );

    logger.info(`User dibuat: ${fullName}`, {
      userId: userId,
      role: role,
      email: email,
    });

    return user;
  }

  /**
   * Generate ulang Magic Link untuk user yang belum terautentikasi
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError}
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
   * @param {string} userId
   * @returns {Promise<Object>}
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
   * @param {string} email
   * @returns {Promise<Object>}
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
   * @param {string} phone
   * @returns {Promise<Object>}
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
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
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
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
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
   * @returns {Promise<Array>}
   */
  async getAdmins() {
    const admins = await this.userRepo.findByRole("ADMIN");
    logger.info("Mengambil daftar admin", { count: admins.length });
    return admins;
  }

  /**
   * Mendapatkan user berdasarkan role
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role) {
    return this.userRepo.findByRole(role);
  }

  /**
   * Memperbarui data user
   * @param {string} userId
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateUser(userId, payload) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal memperbarui. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (payload.role !== undefined) {
      this.#validateUpdatableRole(user.role, payload.role);
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

    await this.cache.invalidate(`history:${orderNumber}`);

    return updated;
  }

  /**
   * Menghapus user
   * @param {string} userId
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
   * @param {string} email
   * @returns {Promise<Object>}
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
   * @param {string} email
   * @param {string} [excludeId]
   * @returns {Promise<Object>}
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
   * @param {string} phone
   * @param {string} [excludeId]
   * @returns {Promise<Object>}
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