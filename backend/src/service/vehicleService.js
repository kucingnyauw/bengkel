import VehicleRepository from "#repository/vehicleRepository.js";
import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis kendaraan
 * @class VehicleService
 */
class VehicleService {
  constructor() {
    this.vehicleRepo = new VehicleRepository();
    this.customerRepo = new CustomerRepository();
  }

  /**
   * Mendaftarkan kendaraan baru
   * @param {Object} payload - Data kendaraan
   * @param {string} payload.plateNumber - Nomor plat
   * @param {string} payload.customerId - ID pelanggan
   * @param {string} [payload.brand] - Merek
   * @param {string} [payload.model] - Model
   * @returns {Promise<Object>} Kendaraan yang berhasil didaftarkan
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   * @throws {ApiError} 409 - Plat nomor sudah terdaftar
   */
  async registerVehicle(payload) {
    const { plateNumber, customerId, brand, model } = payload;

    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw ApiError.notFound({
        message: `Gagal mendaftarkan kendaraan. Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    const normalizedPlate = plateNumber.trim().toUpperCase();

    const isPlateExists = await this.vehicleRepo.isPlateNumberExists(normalizedPlate);
    if (isPlateExists) {
      throw ApiError.conflict({
        message: `Gagal mendaftarkan kendaraan. Plat nomor '${normalizedPlate}' sudah terdaftar.`,
      });
    }

    const vehicle = await this.vehicleRepo.create({
      plateNumber: normalizedPlate,
      customerId,
      brand: brand?.trim() || null,
      model: model?.trim() || null,
    });

    logger.info("Kendaraan berhasil didaftarkan", {
      vehicleId: vehicle.id,
      plateNumber: normalizedPlate,
      customerId,
      customerName: customer.name,
    });

    return vehicle;
  }

  /**
   * Mendapatkan kendaraan berdasarkan ID
   * @param {string} vehicleId - ID kendaraan
   * @returns {Promise<Object>} Data kendaraan
   * @throws {ApiError} 404 - Kendaraan tidak ditemukan
   */
  async getVehicleById(vehicleId) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);

    if (!vehicle) {
      throw ApiError.notFound({
        message: `Kendaraan dengan ID '${vehicleId}' tidak ditemukan.`,
      });
    }

    return vehicle;
  }

  /**
   * Mendapatkan kendaraan berdasarkan plat nomor
   * @param {string} plateNumber - Plat nomor
   * @returns {Promise<Object>} Data kendaraan
   * @throws {ApiError} 404 - Kendaraan tidak ditemukan
   */
  async getVehicleByPlateNumber(plateNumber) {
    const normalizedPlate = plateNumber.trim().toUpperCase();
    const vehicle = await this.vehicleRepo.findByPlateNumber(normalizedPlate);

    if (!vehicle) {
      throw ApiError.notFound({
        message: `Kendaraan dengan plat nomor '${normalizedPlate}' tidak ditemukan.`,
      });
    }

    return vehicle;
  }

  /**
   * Mendapatkan daftar kendaraan dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.search] - Pencarian
   * @param {string} [query.customerId] - Filter pelanggan
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar kendaraan
   */
  async getVehicles(query = {}) {
    const result = await this.vehicleRepo.findMany(query);

    logger.info("Mengambil daftar kendaraan", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: {
        customerId: query.customerId,
        search: query.search,
      },
    });

    return result;
  }

  /**
   * Mendapatkan kendaraan berdasarkan pelanggan
   * @param {string} customerId - ID pelanggan
   * @returns {Promise<Array>} Daftar kendaraan
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   */
  async getVehiclesByCustomer(customerId) {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw ApiError.notFound({
        message: `Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    const vehicles = await this.vehicleRepo.findByCustomerId(customerId);

    logger.info("Mengambil kendaraan pelanggan", {
      customerId,
      customerName: customer.name,
      vehicleCount: vehicles.length,
    });

    return vehicles;
  }

  /**
   * Memperbarui data kendaraan
   * @param {string} vehicleId - ID kendaraan
   * @param {Object} payload - Data yang akan diupdate
   * @param {string} [payload.plateNumber] - Plat nomor
   * @param {string} [payload.brand] - Merek
   * @param {string} [payload.model] - Model
   * @returns {Promise<Object>} Kendaraan yang sudah diupdate
   * @throws {ApiError} 404 - Kendaraan tidak ditemukan
   * @throws {ApiError} 409 - Plat nomor sudah digunakan
   */
  async updateVehicle(vehicleId, payload) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw ApiError.notFound({
        message: `Gagal memperbarui. Kendaraan dengan ID '${vehicleId}' tidak ditemukan.`,
      });
    }

    if (payload.plateNumber) {
      const normalizedPlate = payload.plateNumber.trim().toUpperCase();

      if (normalizedPlate !== vehicle.plateNumber) {
        const isPlateExists = await this.vehicleRepo.isPlateNumberExists(normalizedPlate, vehicleId);
        if (isPlateExists) {
          throw ApiError.conflict({
            message: `Gagal memperbarui. Plat nomor '${normalizedPlate}' sudah digunakan oleh kendaraan lain.`,
          });
        }
      }

      payload.plateNumber = normalizedPlate;
    }

    if (payload.brand) payload.brand = payload.brand.trim();
    if (payload.model) payload.model = payload.model.trim();

    const updated = await this.vehicleRepo.update(vehicleId, payload);

    logger.info("Kendaraan berhasil diperbarui", {
      vehicleId,
      previousPlateNumber: vehicle.plateNumber,
      newPlateNumber: updated.plateNumber,
    });

    return updated;
  }

  /**
   * Menghapus kendaraan
   * @param {string} vehicleId - ID kendaraan
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - Kendaraan tidak ditemukan
   * @throws {ApiError} 409 - Kendaraan masih memiliki riwayat servis
   */
  async deleteVehicle(vehicleId) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw ApiError.notFound({
        message: `Gagal menghapus. Kendaraan dengan ID '${vehicleId}' tidak ditemukan.`,
      });
    }

    const hasOrders = await this.vehicleRepo.hasOrders(vehicleId);
    if (hasOrders) {
      throw ApiError.conflict({
        message: `Gagal menghapus. Kendaraan dengan plat '${vehicle.plateNumber}' masih memiliki riwayat servis.`,
      });
    }

    await this.vehicleRepo.delete(vehicleId);

    logger.info("Kendaraan berhasil dihapus", {
      vehicleId,
      plateNumber: vehicle.plateNumber,
      customerId: vehicle.customerId,
    });
  }

  /**
   * Mengecek apakah plat nomor sudah terdaftar
   * @param {string} plateNumber - Plat nomor
   * @param {string} [excludeId] - ID kendaraan yang dikecualikan
   * @returns {Promise<{exists: boolean, message: string}>} Status ketersediaan
   */
  async checkPlateNumberExists(plateNumber, excludeId = null) {
    const normalizedPlate = plateNumber.trim().toUpperCase();
    const exists = await this.vehicleRepo.isPlateNumberExists(normalizedPlate, excludeId);

    return {
      exists,
      message: exists
        ? `Plat nomor '${normalizedPlate}' sudah terdaftar.`
        : `Plat nomor '${normalizedPlate}' tersedia.`,
    };
  }

  /**
   * Mencari kendaraan berdasarkan plat nomor (partial match)
   * @param {string} plateNumber - Plat nomor
   * @returns {Promise<Array>} Daftar kendaraan
   */
  async searchByPlateNumber(plateNumber) {
    const normalizedPlate = plateNumber.trim().toUpperCase();
    const vehicles = await this.vehicleRepo.searchByPlateNumber(normalizedPlate);

    logger.info("Mencari kendaraan berdasarkan plat", {
      searchTerm: normalizedPlate,
      resultCount: vehicles.length,
    });

    return vehicles;
  }
}

export default VehicleService;