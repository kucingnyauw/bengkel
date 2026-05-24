import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";
import supabase from "#lib/supabase.js";
import CacheManager from "#shared/utils/cache.js";

class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.shiftRepo = new ShiftRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("auth:user");
  }

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
            message:
              "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
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
          message:
            "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
        });
      }
      logger.error("Error saat mengirim Magic Link", {
        email,
        error: err.message,
      });
      throw ApiError.internal({ message: "Gagal mengirim email verifikasi." });
    }
  }

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

  async #notifyAdmins(title, message, type = "INFO") {
    try {
      const admins = await this.userRepo.findByRole("ADMIN");
      const activeAdmins = admins.filter((a) => a.isActive);
      if (activeAdmins.length > 0) {
        await Promise.all(
          activeAdmins.map((admin) =>
            this.notifRepo.create({ title, message, type, userId: admin.id })
          )
        );
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi ke admin", { error: err.message });
    }
  }

  #getRoleLabel(role) {
    const labels = { ADMIN: "Admin", CASHIER: "Kasir", MECHANIC: "Mekanik" };
    return labels[role] || role;
  }

  #validateCreatableRole(role) {
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (!allowedRoles.includes(role)) {
      throw ApiError.forbidden({
        message: `Tidak dapat membuat user dengan role ${role}. Role yang diizinkan: ${allowedRoles.join(
          ", "
        )}.`,
      });
    }
  }

  #validateUpdatableRole(currentRole, newRole) {
    if (currentRole === "ADMIN" && newRole !== "ADMIN") {
      throw ApiError.forbidden({ message: "Tidak dapat mengubah role Admin." });
    }
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (newRole && !allowedRoles.includes(newRole) && newRole !== "ADMIN") {
      throw ApiError.forbidden({
        message: `Role '${newRole}' tidak valid. Role yang diizinkan: ${allowedRoles.join(
          ", "
        )}.`,
      });
    }
  }

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
        message: `Email ${email} sudah digunakan oleh user lain.`,
      });
    }

    if (phone) {
      const phoneExists = await this.userRepo.isPhoneExists(phone);
      if (phoneExists) {
        throw ApiError.conflict({
          message: `Nomor telepon ${phone} sudah digunakan oleh user lain.`,
        });
      }
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { fullName, phone, role },
      });

    if (authError) {
      logger.error("Gagal membuat user di Supabase Auth", {
        error: authError.message,
      });
      throw ApiError.internal({
        message: `Gagal membuat user. Supabase Error: ${authError.message}`,
      });
    }

    const userId = authData.user.id;
    let user = await this.userRepo.findById(userId);

    if (!user) {
      user = {
        id: userId,
        email,
        fullName,
        phone,
        role,
        isActive: true,
        isAuthenticated: false,
      };
    }

    const roleLabel = this.#getRoleLabel(role);

    await this.#sendNotification(
      userId,
      "Selamat Datang",
      `Halo ${fullName},\n\nAkun Anda telah berhasil dibuat sebagai ${roleLabel}. Selamat bergabung di Bengkel POS.`,
      "SUCCESS"
    );

    await this.#notifyAdmins(
      "User Baru Dibuat",
      `User baru telah ditambahkan.\n\nNama: ${fullName}\nEmail: ${email}\nRole: ${roleLabel}`,
      "INFO"
    );

    logger.info(`User dibuat: ${fullName}`, { userId, role, email });
    return user;
  }

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

  async getUserById(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan ID '${userId}' tidak ditemukan.`,
      });
    return user;
  }

  async getUserByEmail(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan email '${email}' tidak ditemukan.`,
      });
    return user;
  }

  async getUserByPhone(phone) {
    const user = await this.userRepo.findByPhone(phone);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan nomor telepon '${phone}' tidak ditemukan.`,
      });
    return user;
  }

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

  async getAdmins() {
    const admins = await this.userRepo.findByRole("ADMIN");
    logger.info("Mengambil daftar admin", { count: admins.length });
    return admins;
  }

  async getUsersByRole(role) {
    return this.userRepo.findByRole(role);
  }

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
      changes.push(`Nama: "${user.fullName}" -> "${payload.fullName}"`);
    if (payload.phone !== undefined && payload.phone !== user.phone)
      changes.push(
        `Telepon: "${user.phone || "-"}" -> "${payload.phone || "-"}"`
      );
    if (payload.role !== undefined && payload.role !== user.role)
      changes.push(
        `Role: "${this.#getRoleLabel(user.role)}" -> "${this.#getRoleLabel(
          payload.role
        )}"`
      );
    if (payload.isActive !== undefined && payload.isActive !== user.isActive)
      changes.push(
        `Status: "${user.isActive ? "Aktif" : "Nonaktif"}" -> "${
          payload.isActive ? "Aktif" : "Nonaktif"
        }"`
      );

    if (changes.length > 0) {
      await this.#sendNotification(
        userId,
        "Profil Diperbarui",
        `Data akun Anda telah diperbarui.\n\n${changes.join("\n")}`,
        "INFO"
      );
    }

    logger.info("User berhasil diperbarui", { userId, changes });
    return updated;
  }

  async deleteUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal menghapus. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (user.role === "ADMIN") {
      throw ApiError.forbidden({
        message: "Tidak dapat menghapus user dengan role Admin.",
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

    const roleLabel = this.#getRoleLabel(user.role);

    await this.userRepo.delete(userId);

    await this.#notifyAdmins(
      "User Dihapus",
      `User telah dihapus dari sistem.\n\nNama: ${user.fullName}\nEmail: ${user.email}\nRole: ${roleLabel}`,
      "WARNING"
    );

    logger.info("User berhasil dihapus", {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

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

  async checkEmailExists(email, excludeId = null) {
    const exists = await this.userRepo.isEmailExists(email, excludeId);
    return {
      exists,
      message: exists
        ? `Email '${email}' sudah terdaftar.`
        : `Email '${email}' tersedia.`,
    };
  }

  async checkPhoneExists(phone, excludeId = null) {
    const exists = await this.userRepo.isPhoneExists(phone, excludeId);
    return {
      exists,
      message: exists
        ? `Nomor telepon '${phone}' sudah digunakan.`
        : `Nomor telepon '${phone}' tersedia.`,
    };
  }
}

export default UserService;
