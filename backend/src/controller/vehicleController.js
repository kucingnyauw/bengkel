import CatchAsync from "#shared/utils/response.js";
import VehicleService from "#service/vehicleService.js";

import {
  registerVehicleSchema,
  updateVehicleSchema,
  getVehiclesQuerySchema,
  checkPlateNumberExistsSchema,
  vehicleIdParamSchema,
  plateNumberParamSchema,
  customerIdParamSchema,
} from "#validation/vehicleValidation.js";

import validate from "#validation/validation.js";

import {
  VehicleDetailDto,
  VehicleListDto,
  CustomerVehicleDto,
  VehicleSearchDto,
} from "#dtos/vehicleDto.js";

/**
 * Controller untuk mengelola endpoint kendaraan
 * @class VehicleController
 */
class VehicleController {
  constructor() {
    this.vehicleService = new VehicleService();
  }

  /**
   * Mendaftarkan kendaraan baru
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  registerVehicle = CatchAsync.run(async (req, res) => {
    const payload = validate(registerVehicleSchema, req.body);

    const vehicle = await this.vehicleService.registerVehicle(payload);

    res.status(201).json({
      success: true,
      message: "Kendaraan berhasil didaftarkan",
      data: new VehicleDetailDto(vehicle),
    });
  });

  /**
   * Mendapatkan kendaraan berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getVehicleById = CatchAsync.run(async (req, res) => {
    const { id } = validate(vehicleIdParamSchema, req.params);

    const vehicle = await this.vehicleService.getVehicleById(id);

    res.status(200).json({
      success: true,
      message: "Detail kendaraan berhasil diambil",
      data: new VehicleDetailDto(vehicle),
    });
  });

  /**
   * Mendapatkan kendaraan berdasarkan plat nomor
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getVehicleByPlateNumber = CatchAsync.run(async (req, res) => {
    const { plateNumber } = validate(plateNumberParamSchema, req.params);

    const vehicle = await this.vehicleService.getVehicleByPlateNumber(plateNumber);

    res.status(200).json({
      success: true,
      message: "Detail kendaraan berhasil diambil",
      data: new VehicleDetailDto(vehicle),
    });
  });

  /**
   * Mendapatkan daftar kendaraan (grouped by customer)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getVehicles = CatchAsync.run(async (req, res) => {
    const query = validate(getVehiclesQuerySchema, req.query);

    const result = await this.vehicleService.getVehicles(query);

    res.status(200).json({
      success: true,
      message: "Daftar kendaraan berhasil diambil",
      data: result.data.map((item) => new VehicleListDto(item)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan kendaraan berdasarkan pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getVehiclesByCustomer = CatchAsync.run(async (req, res) => {
    const { customerId } = validate(customerIdParamSchema, req.params);

    const vehicles = await this.vehicleService.getVehiclesByCustomer(customerId);

    res.status(200).json({
      success: true,
      message: "Daftar kendaraan pelanggan berhasil diambil",
      data: vehicles.map((vehicle) => new CustomerVehicleDto(vehicle)),
    });
  });

  /**
   * Memperbarui data kendaraan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateVehicle = CatchAsync.run(async (req, res) => {
    const { id } = validate(vehicleIdParamSchema, req.params);
    const payload = validate(updateVehicleSchema, req.body);

    const vehicle = await this.vehicleService.updateVehicle(id, payload);

    res.status(200).json({
      success: true,
      message: "Data kendaraan berhasil diperbarui",
      data: new VehicleDetailDto(vehicle),
    });
  });

  /**
   * Menghapus kendaraan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteVehicle = CatchAsync.run(async (req, res) => {
    const { id } = validate(vehicleIdParamSchema, req.params);

    await this.vehicleService.deleteVehicle(id);

    res.status(200).json({
      success: true,
      message: "Kendaraan berhasil dihapus",
      data: null,
    });
  });

  /**
   * Mengecek ketersediaan plat nomor
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkPlateNumberExists = CatchAsync.run(async (req, res) => {
    const { plateNumber, excludeId } = validate(checkPlateNumberExistsSchema, req.query);

    const result = await this.vehicleService.checkPlateNumberExists(plateNumber, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mencari kendaraan berdasarkan plat nomor
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  searchByPlateNumber = CatchAsync.run(async (req, res) => {
    const { plateNumber } = validate(plateNumberParamSchema, req.query);

    const vehicles = await this.vehicleService.searchByPlateNumber(plateNumber);

    res.status(200).json({
      success: true,
      message: "Hasil pencarian kendaraan berhasil diambil",
      data: vehicles.map((vehicle) => new VehicleSearchDto(vehicle)),
    });
  });
}

export default new VehicleController();