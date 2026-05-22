import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import Currency from "#shared/utils/currency.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis shift
 * @class ShiftService
 */
class ShiftService {
  constructor() {
    this.shiftRepo = new ShiftRepository();
    this.settingRepo = new SettingRepository();
    this.notifRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Mendapatkan nilai setting
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   * @private
   */
  async #getSetting(key, defaultValue) {
    const setting = await this.settingRepo.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Mendapatkan minimal starting cash dari settings
   * @returns {Promise<number>}
   * @private
   */
  async #getMinStartingCash() {
    return Number(await this.#getSetting("shift_min_starting_cash", 1000000));
  }

  /**
   * Mengirim notifikasi ke kasir
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
      logger.warn("Gagal mengirim notifikasi shift", {
        userId,
        error: err.message,
      });
    }
  }

  /**
   * Mengirim notifikasi ke semua admin
   * @param {string} title
   * @param {string} message
   * @param {string} [type="WARNING"]
   * @returns {Promise<void>}
   * @private
   */
  async #notifyAdmins(title, message, type = "WARNING") {
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
      logger.warn("Gagal mengirim notifikasi ke admin", {
        error: err.message,
      });
    }
  }

  /**
   * Membuka shift baru untuk kasir
   * @param {string} cashierId
   * @param {number} startingCash
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async openShift(cashierId, startingCash) {
    const minStartingCash = await this.#getMinStartingCash();

    if (startingCash < minStartingCash) {
      throw ApiError.badRequest({
        message: `Gagal membuka shift. Saldo awal minimal ${Currency.toIDR(minStartingCash)}.`,
      });
    }

    const hasActiveShift = await this.shiftRepo.hasActiveShift(cashierId);
    if (hasActiveShift) {
      const activeShift = await this.shiftRepo.findActiveByCashier(cashierId);
      throw ApiError.conflict({
        message: `Gagal membuka shift. Kasir sudah memiliki shift aktif yang dibuka pada ${activeShift.openedAt}.`,
      });
    }

    const shift = await this.shiftRepo.create({ cashierId, startingCash });

    const cashier = await this.userRepo.findById(cashierId);

    await this.#sendNotification(
      cashierId,
      "Shift Dibuka",
      `Shift baru berhasil dibuka.\n\n` +
      `Kasir: ${cashier?.fullName || "-"}\n` +
      `Saldo Awal: ${Currency.toIDR(startingCash)}\n` +
      `Waktu: ${new Date(shift.openedAt).toLocaleString("id-ID")}`,
      "INFO"
    );

    logger.info("Shift berhasil dibuka", {
      shiftId: shift.id,
      cashierId,
      startingCash,
      openedAt: shift.openedAt,
    });

    return shift;
  }

  /**
   * Menutup shift
   * @param {string} shiftId
   * @param {number} endingCash
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async closeShift(shiftId, endingCash) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift) {
      throw ApiError.notFound({
        message: `Gagal menutup shift. Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    }

    if (shift.status === "CLOSED") {
      throw ApiError.conflict({
        message: `Gagal menutup shift. Shift sudah ditutup sebelumnya pada ${shift.closedAt}.`,
      });
    }

    const draftOrders = await prisma.order.count({
      where: {
        shiftId,
        status: "DRAFT",
        deletedAt: null,
      },
    });

    if (draftOrders > 0) {
      throw ApiError.conflict({
        message: `Tidak dapat menutup shift. Masih ada ${draftOrders} pesanan yang belum dibayar. Bayar atau batalkan terlebih dahulu.`,
      });
    }

    const expectedCash =
      shift.startingCash + shift.cashSales + shift.cashIn - shift.cashOut;
    const discrepancy = endingCash - expectedCash;

    const closedShift = await this.shiftRepo.close(shiftId, {
      endingCash,
      expectedCash,
      discrepancy,
    });

    const cashier = await this.userRepo.findById(shift.cashierId);
    const duration = this.#formatShiftDuration(shift.openedAt, closedShift.closedAt);

    await this.#sendNotification(
      shift.cashierId,
      "Shift Ditutup",
      `Shift berhasil ditutup.\n\n` +
      `Kasir: ${cashier?.fullName || "-"}\n` +
      `Durasi: ${duration}\n` +
      `Saldo Awal: ${Currency.toIDR(shift.startingCash)}\n` +
      `Total Penjualan: ${Currency.toIDR(shift.cashSales)}\n` +
      `Kas Masuk: ${Currency.toIDR(shift.cashIn)}\n` +
      `Kas Keluar: ${Currency.toIDR(shift.cashOut)}\n` +
      `Saldo Akhir: ${Currency.toIDR(endingCash)}\n` +
      `Selisih: ${Currency.toIDR(discrepancy)}`,
      discrepancy === 0 ? "SUCCESS" : "WARNING"
    );

    if (Math.abs(discrepancy) >= 50000) {
      await this.#notifyAdmins(
        "Selisih Shift Signifikan",
        `Shift kasir ${cashier?.fullName || "-"} memiliki selisih besar.\n\n` +
        `Shift ID: ${shiftId}\n` +
        `Selisih: ${Currency.toIDR(discrepancy)}\n` +
        `Saldo Awal: ${Currency.toIDR(shift.startingCash)}\n` +
        `Saldo Akhir: ${Currency.toIDR(endingCash)}\n` +
        `Expected: ${Currency.toIDR(expectedCash)}`,
        "WARNING"
      );
    }

    logger.info("Shift berhasil ditutup", {
      shiftId,
      cashierId: shift.cashierId,
      startingCash: shift.startingCash,
      endingCash,
      expectedCash,
      discrepancy,
    });

    return closedShift;
  }

  /**
   * Format durasi shift
   * @param {Date} openedAt
   * @param {Date} closedAt
   * @returns {string}
   * @private
   */
  #formatShiftDuration(openedAt, closedAt) {
    const diff = new Date(closedAt) - new Date(openedAt);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0 && minutes > 0) return `${hours} jam ${minutes} menit`;
    if (hours > 0) return `${hours} jam`;
    return `${minutes} menit`;
  }

  /**
   * Mendapatkan shift aktif kasir
   * @param {string} cashierId
   * @returns {Promise<Object|null>}
   */
  async getActiveShift(cashierId) {
    const shift = await this.shiftRepo.findActiveByCashier(cashierId);

    if (shift) {
      logger.info("Mengambil shift aktif kasir", {
        cashierId,
        shiftId: shift.id,
        openedAt: shift.openedAt,
      });
    }

    return shift;
  }

  /**
   * Mendapatkan shift berdasarkan ID
   * @param {string} shiftId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getShiftById(shiftId) {
    const shift = await this.shiftRepo.findById(shiftId);

    if (!shift) {
      throw ApiError.notFound({
        message: `Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    }

    for (const expense of shift.expenses || []) {
      if (expense.receipt && expense.receipt.path) {
        expense.receipt.url = await Storage.getSignedUrl(expense.receipt.path);
      }
    }

    return shift;
  }

  /**
   * Mendapatkan daftar shift dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getShifts(query = {}) {
    const result = await this.shiftRepo.findMany(query);

    logger.info("Mengambil daftar shift", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: { status: query.status, cashierId: query.cashierId },
    });

    return result;
  }

  /**
   * Mencatat penjualan tunai ke dalam shift
   * @param {string} shiftId
   * @param {number} amount
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordCashSale(shiftId, amount) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift)
      throw ApiError.notFound({
        message: `Gagal mencatat penjualan. Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    if (shift.status !== "OPEN")
      throw ApiError.conflict({
        message: `Gagal mencatat penjualan. Shift sudah ditutup.`,
      });

    const updatedShift = await this.shiftRepo.updateCashFlow(shiftId, {
      cashSales: amount,
    });

    logger.info("Penjualan tunai dicatat", {
      shiftId,
      amount,
      currentCashSales: updatedShift.cashSales,
    });
    return updatedShift;
  }

  /**
   * Mendapatkan daftar shift berdasarkan ID kasir
   * @param {string} cashierId
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getShiftListByCashierId(cashierId, query = {}) {
    const result = await this.shiftRepo.findMany({ ...query, cashierId });

    logger.info("Mengambil daftar shift berdasarkan kasir", {
      cashierId,
      total: result.metadata.total,
      page: result.metadata.currentPage,
    });

    return result;
  }

  /**
   * Mencatat kas masuk ke dalam shift
   * @param {string} shiftId
   * @param {number} amount
   * @param {string} [note]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordCashIn(shiftId, amount, note) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift)
      throw ApiError.notFound({
        message: `Gagal mencatat kas masuk. Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    if (shift.status !== "OPEN")
      throw ApiError.conflict({
        message: `Gagal mencatat kas masuk. Shift sudah ditutup.`,
      });

    const updatedShift = await this.shiftRepo.updateCashFlow(shiftId, {
      cashIn: amount,
    });

    await this.#sendNotification(
      shift.cashierId,
      "Kas Masuk Dicatat",
      `Kas masuk berhasil dicatat.\n\n` +
      `Jumlah: ${Currency.toIDR(amount)}\n` +
      `Total Kas Masuk: ${Currency.toIDR(updatedShift.cashIn)}` +
      (note ? `\nCatatan: ${note}` : ""),
      "INFO"
    );

    logger.info("Kas masuk dicatat", {
      shiftId,
      amount,
      note,
      currentCashIn: updatedShift.cashIn,
    });
    return updatedShift;
  }

  /**
   * Mencatat kas keluar ke dalam shift
   * @param {string} shiftId
   * @param {number} amount
   * @param {string} [note]
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async recordCashOut(shiftId, amount, note) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift)
      throw ApiError.notFound({
        message: `Gagal mencatat kas keluar. Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    if (shift.status !== "OPEN")
      throw ApiError.conflict({
        message: `Gagal mencatat kas keluar. Shift sudah ditutup.`,
      });

    const updatedShift = await this.shiftRepo.updateCashFlow(shiftId, {
      cashOut: amount,
    });

    await this.#sendNotification(
      shift.cashierId,
      "Kas Keluar Dicatat",
      `Kas keluar berhasil dicatat.\n\n` +
      `Jumlah: ${Currency.toIDR(amount)}\n` +
      `Total Kas Keluar: ${Currency.toIDR(updatedShift.cashOut)}` +
      (note ? `\nCatatan: ${note}` : ""),
      "INFO"
    );

    logger.info("Kas keluar dicatat", {
      shiftId,
      amount,
      note,
      currentCashOut: updatedShift.cashOut,
    });
    return updatedShift;
  }

  /**
   * Validasi shift untuk pembuatan order
   * @param {string} shiftId
   * @param {string} cashierId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async validateShiftForOrder(shiftId, cashierId) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift)
      throw ApiError.notFound({
        message: `Gagal membuat pesanan. Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    if (shift.status !== "OPEN")
      throw ApiError.conflict({
        message: `Gagal membuat pesanan. Shift sudah ditutup pada ${shift.closedAt}, tidak dapat membuat pesanan baru.`,
      });
    if (shift.cashierId !== cashierId)
      throw ApiError.forbidden({
        message:
          "Gagal membuat pesanan. Pesanan harus dibuat oleh kasir yang memiliki shift aktif.",
      });

    return shift;
  }

  /**
   * Mengecek apakah kasir memiliki shift aktif
   * @param {string} cashierId
   * @returns {Promise<boolean>}
   */
  async hasActiveShift(cashierId) {
    return this.shiftRepo.hasActiveShift(cashierId);
  }

  /**
   * Mendapatkan saran starting cash
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getStartingCashSuggestion(cashierId) {
    const minStartingCash = await this.#getMinStartingCash();
    const lastShift = await this.shiftRepo.findLastShiftByCashier(cashierId);

    if (!lastShift) {
      return {
        suggestedStartingCash: minStartingCash,
        source: "settings",
        message: `Tidak ada shift sebelumnya. Menggunakan default dari pengaturan: ${Currency.toIDR(minStartingCash)}`,
        lastShift: null,
      };
    }

    const suggestedCash = lastShift.endingCash || minStartingCash;

    return {
      suggestedStartingCash: suggestedCash,
      source: "previous_shift",
      message: "Mengacu pada ending cash shift sebelumnya",
      lastShift: {
        id: lastShift.id,
        endingCash: lastShift.endingCash,
        closedAt: lastShift.closedAt,
      },
    };
  }

  /**
   * Menghitung expected cash shift
   * @param {string} shiftId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getExpectedCash(shiftId) {
    const result = await this.shiftRepo.calculateExpectedCash(shiftId);

    if (!result) {
      throw ApiError.notFound({
        message: `Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    }

    logger.info("Menghitung expected cash", {
      shiftId,
      expectedCash: result.expectedCash,
    });
    return result;
  }
}

export default ShiftService;