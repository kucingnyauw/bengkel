import CatchAsync from "#shared/utils/response.js";
import ShiftService from "#service/shiftService.js";

import {
  openShiftSchema,
  closeShiftSchema,
  recordCashInSchema,
  recordCashOutSchema,
  getShiftsQuerySchema,
  shiftIdParamSchema,
} from "#validation/shiftValidation.js";

import validate from "#validation/validation.js";

import {
  ShiftOpenedDto,
  ShiftClosedDto,
  ActiveShiftDto,
  ShiftDetailDto,
  ShiftListDto,
  ShiftCashFlowDto,
  StartingCashSuggestionDto,
  ExpectedCashDto,
} from "#dtos/shiftDto.js";

/**
 * Controller untuk mengelola endpoint shift
 * @class ShiftController
 */
class ShiftController {
  constructor() {
    this.shiftService = new ShiftService();
  }

  /**
   * Membuka shift baru untuk kasir
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  openShift = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;
    const { startingCash } = validate(openShiftSchema, req.body);

    const shift = await this.shiftService.openShift(cashierId, startingCash);

    res.status(201).json({
      success: true,
      message: "Shift berhasil dibuka",
      data: new ShiftOpenedDto(shift),
    });
  });

  /**
   * Menutup shift
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  closeShift = CatchAsync.run(async (req, res) => {
    const { id } = validate(shiftIdParamSchema, req.params);
    const { endingCash } = validate(closeShiftSchema, req.body);

    const shift = await this.shiftService.closeShift(id, endingCash);

    res.status(200).json({
      success: true,
      message: "Shift berhasil ditutup",
      data: new ShiftClosedDto(shift),
    });
  });

  /**
   * Mendapatkan shift aktif kasir yang sedang login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getActiveShift = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;

    const shift = await this.shiftService.getActiveShift(cashierId);

    res.status(200).json({
      success: true,
      message: "Shift aktif berhasil diambil",
      data: shift ? new ActiveShiftDto(shift) : null,
    });
  });

  /**
   * Mendapatkan daftar shift berdasarkan ID kasir
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getShiftListByCashierId = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;
    const query = validate(getShiftsQuerySchema, req.query);

    const result = await this.shiftService.getShiftListByCashierId(cashierId, query);

    res.status(200).json({
      success: true,
      message: "Daftar shift kasir berhasil diambil",
      data: result.data.map((shift) => new ShiftListDto(shift)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan shift berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getShiftById = CatchAsync.run(async (req, res) => {
    const { id } = validate(shiftIdParamSchema, req.params);

    const shift = await this.shiftService.getShiftById(id);

    res.status(200).json({
      success: true,
      message: "Detail shift berhasil diambil",
      data: new ShiftDetailDto(shift),
    });
  });

  /**
   * Mendapatkan daftar shift dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getShifts = CatchAsync.run(async (req, res) => {
    const query = validate(getShiftsQuerySchema, req.query);

    const result = await this.shiftService.getShifts(query);

    res.status(200).json({
      success: true,
      message: "Daftar shift berhasil diambil",
      data: result.data.map((shift) => new ShiftListDto(shift)),
      metadata: result.metadata,
    });
  });

  /**
   * Mencatat kas masuk
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordCashIn = CatchAsync.run(async (req, res) => {
    const { id } = validate(shiftIdParamSchema, req.params);
    const { amount, note } = validate(recordCashInSchema, req.body);

    const shift = await this.shiftService.recordCashIn(id, amount, note);

    res.status(200).json({
      success: true,
      message: "Kas masuk berhasil dicatat",
      data: new ShiftCashFlowDto(shift),
    });
  });

  /**
   * Mencatat kas keluar
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordCashOut = CatchAsync.run(async (req, res) => {
    const { id } = validate(shiftIdParamSchema, req.params);
    const { amount, note } = validate(recordCashOutSchema, req.body);

    const shift = await this.shiftService.recordCashOut(id, amount, note);

    res.status(200).json({
      success: true,
      message: "Kas keluar berhasil dicatat",
      data: new ShiftCashFlowDto(shift),
    });
  });

  /**
   * Mengecek apakah kasir memiliki shift aktif
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkActiveShift = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;

    const hasActiveShift = await this.shiftService.hasActiveShift(cashierId);

    res.status(200).json({
      success: true,
      message: "Status shift aktif berhasil diambil",
      data: { hasActiveShift },
    });
  });

  /**
   * Mendapatkan saran starting cash berdasarkan shift sebelumnya
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getStartingCashSuggestion = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;

    const result = await this.shiftService.getStartingCashSuggestion(cashierId);

    res.status(200).json({
      success: true,
      message: "Saran starting cash berhasil diambil",
      data: new StartingCashSuggestionDto(result),
    });
  });

  /**
   * Menghitung expected cash shift berdasarkan data sistem
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpectedCash = CatchAsync.run(async (req, res) => {
    const { id } = validate(shiftIdParamSchema, req.params);

    const result = await this.shiftService.getExpectedCash(id);

    res.status(200).json({
      success: true,
      message: "Perhitungan expected cash berhasil",
      data: new ExpectedCashDto(result),
    });
  });
}

export default new ShiftController();