import CatchAsync from "#shared/utils/response.js";
import ExpenseService from "#service/expenseService.js";

import {
  createExpenseSchema,
  updateExpenseSchema,
  getExpensesQuerySchema,
  expenseIdParamSchema,
  shiftIdParamSchema,
} from "#validation/expenseValidation.js";

import validate from "#validation/validation.js";

import {
  ExpenseDetailDto,
  ExpenseListDto,
  ExpenseUpdatedDto,
  ExpensesByShiftDto,
} from "#dtos/expenseDto.js";

/**
 * Controller untuk mengelola endpoint pengeluaran
 * @class ExpenseController
 */
class ExpenseController {
  constructor() {
    this.expenseService = new ExpenseService();
  }

  /**
   * Membuat pengeluaran baru
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createExpense = CatchAsync.run(async (req, res) => {
    const payload = validate(createExpenseSchema, req.body);
    const file = req.asset;
    const cashierId = req.user.id;

    const expense = await this.expenseService.createExpense(
      cashierId,
      payload,
      file
    );

    res.status(201).json({
      success: true,
      message: "Pengeluaran berhasil dibuat",
      data: new ExpenseDetailDto(expense),
    });
  });

  /**
   * Mendapatkan pengeluaran berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpenseById = CatchAsync.run(async (req, res) => {
    const { id } = validate(expenseIdParamSchema, req.params);

    const expense = await this.expenseService.getExpenseById(id);

    res.status(200).json({
      success: true,
      message: "Detail pengeluaran berhasil diambil",
      data: new ExpenseDetailDto(expense),
    });
  });

  /**
   * Memperbarui pengeluaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateExpense = CatchAsync.run(async (req, res) => {
    const { id } = validate(expenseIdParamSchema, req.params);
    const payload = validate(updateExpenseSchema, req.body);
    const file = req.asset;
    const userId = req.user.id;

    const expense = await this.expenseService.updateExpense(
      id,
      payload,
      file,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Pengeluaran berhasil diperbarui",
      data: new ExpenseUpdatedDto(expense),
    });
  });

  /**
   * Mendapatkan daftar pengeluaran dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpenses = CatchAsync.run(async (req, res) => {
    const query = validate(getExpensesQuerySchema, req.query);

    const result = await this.expenseService.getExpenses(query);

    res.status(200).json({
      success: true,
      message: "Daftar pengeluaran berhasil diambil",
      data: result.data.map((expense) => new ExpenseListDto(expense)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan pengeluaran berdasarkan kasir yang sedang login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpensesByCashier = CatchAsync.run(async (req, res) => {
    const cashierId = req.user.id;
    const query = validate(getExpensesQuerySchema, req.query);

    const result = await this.expenseService.getExpensesByCashier(
      cashierId,
      query
    );

    res.status(200).json({
      success: true,
      message: "Daftar pengeluaran kasir berhasil diambil",
      data: result.data.map((expense) => new ExpenseListDto(expense)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan pengeluaran berdasarkan shift
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpensesByShift = CatchAsync.run(async (req, res) => {
    const { shiftId } = validate(shiftIdParamSchema, req.params);

    const result = await this.expenseService.getExpensesByShift(shiftId);

    res.status(200).json({
      success: true,
      message: "Daftar pengeluaran berdasarkan shift berhasil diambil",
      data: new ExpensesByShiftDto(result),
    });
  });

  /**
   * Menghapus pengeluaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteExpense = CatchAsync.run(async (req, res) => {
    const { id } = validate(expenseIdParamSchema, req.params);

    await this.expenseService.deleteExpense(id);

    res.status(200).json({
      success: true,
      message: "Pengeluaran berhasil dihapus",
      data: null,
    });
  });
}

export default new ExpenseController();
