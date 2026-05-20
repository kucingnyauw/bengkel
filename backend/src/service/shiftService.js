import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
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
  }

  /**
   * Mendapatkan nilai setting
   * @param {string} key - Key setting
   * @param {*} defaultValue - Nilai default
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
   * Membuka shift baru untuk kasir
   * @param {string} cashierId - ID kasir
   * @param {number} startingCash - Saldo awal kas
   * @returns {Promise<Object>} Shift yang berhasil dibuka
   * @throws {ApiError} 409 - Kasir sudah memiliki shift aktif
   * @throws {ApiError} 400 - Saldo awal kurang dari minimal
   */
  async openShift(cashierId, startingCash) {
    const minStartingCash = await this.#getMinStartingCash();

    if (startingCash < minStartingCash) {
      throw ApiError.badRequest({
        message: `Gagal membuka shift. Saldo awal minimal Rp ${minStartingCash.toLocaleString()}.`,
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

    logger.info("Shift berhasil dibuka", {
      shiftId: shift.id,
      cashierId,
      startingCash,
      openedAt: shift.openedAt,
    });

    return shift;
  }

  /**
   * Menutup shift.
   * Hanya blokir jika masih ada order DRAFT (belum dibayar).
   * Order QUEUED/IN_PROGRESS (sudah bayar, sedang/tunggu pengerjaan) tidak menghalangi
   * karena pengerjaan service bisa berlanjut di shift berikutnya.
   *
   * @param {string} shiftId - ID shift
   * @param {number} endingCash - Jumlah kas aktual di akhir shift
   * @returns {Promise<Object>} Shift yang sudah ditutup
   * @throws {ApiError} 404 - Shift tidak ditemukan
   * @throws {ApiError} 409 - Shift sudah ditutup atau masih ada order DRAFT
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
   * Mendapatkan shift aktif kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object|null>} Shift aktif atau null
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
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object>} Detail shift
   * @throws {ApiError} 404 - Shift tidak ditemukan
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
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page]
   * @param {number} [query.limit]
   * @param {string} [query.status]
   * @param {string} [query.cashierId]
   * @param {string|Date} [query.startDate]
   * @param {string|Date} [query.endDate]
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar shift
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
   * @param {string} shiftId - ID shift
   * @param {number} amount - Jumlah penjualan
   * @returns {Promise<Object>} Shift yang sudah diupdate
   * @throws {ApiError} 404 | 409
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
   * @param {string} cashierId - ID kasir
   * @param {Object} [query={}] - Parameter query tambahan
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar shift kasir
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
   * @param {string} shiftId - ID shift
   * @param {number} amount - Jumlah kas masuk
   * @param {string} [note] - Catatan
   * @returns {Promise<Object>} Shift yang sudah diupdate
   * @throws {ApiError} 404 | 409
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
   * @param {string} shiftId - ID shift
   * @param {number} amount - Jumlah kas keluar
   * @param {string} [note] - Catatan
   * @returns {Promise<Object>} Shift yang sudah diupdate
   * @throws {ApiError} 404 | 409
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
   * @param {string} shiftId - ID shift
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>} Shift yang valid
   * @throws {ApiError} 404 | 409 | 403
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
   * @param {string} cashierId - ID kasir
   * @returns {Promise<boolean>} Status shift aktif
   */
  async hasActiveShift(cashierId) {
    return this.shiftRepo.hasActiveShift(cashierId);
  }

  /**
   * Mendapatkan saran starting cash berdasarkan settings atau shift sebelumnya
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>} Saran starting cash
   */
  async getStartingCashSuggestion(cashierId) {
    const minStartingCash = await this.#getMinStartingCash();
    const lastShift = await this.shiftRepo.findLastShiftByCashier(cashierId);

    if (!lastShift) {
      return {
        suggestedStartingCash: minStartingCash,
        source: "settings",
        message: `Tidak ada shift sebelumnya. Menggunakan default dari pengaturan: Rp ${minStartingCash.toLocaleString()}`,
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
   * Menghitung expected cash shift berdasarkan data aktual sistem
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object>} Detail kalkulasi expected cash
   * @throws {ApiError} 404 - Shift tidak ditemukan
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
