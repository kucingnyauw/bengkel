import CatchAsync from "#shared/utils/response.js";
import ReportService from "#service/reportService.js";

import {
  dateRangeQuerySchema,
  topProductsQuerySchema,
  shiftIdParamSchema,
  productIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
} from "#validation/reportValidation.js";

import validate from "#validation/validation.js";

import {
  SalesDataDto,
  DailySalesDto,
  ProfitLossDto,
  InventorySnapshotDto,
  ShiftReportDto,
  ProductSalesDto,
  MechanicPerformanceDto,
  DashboardSummaryDto,
  CashierDashboardDto,
  MechanicDashboardDto,
  PaymentReportDto,
  MovementSummaryDto,
  StockConsistencyDto,
  TaskStatsDto,
  MechanicTaskStatsDto,
  MechanicEarningsDto,
} from "#dtos/reportDto.js";

/**
 * Controller untuk mengelola endpoint laporan
 * @class ReportController
 */
class ReportController {
  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * Mendapatkan ringkasan penjualan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getSalesSummary = CatchAsync.run(async (req, res) => {
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getSalesSummary(range);

    res.status(200).json({
      success: true,
      message: "Ringkasan penjualan berhasil diambil",
      data: {
        period: report.period,
        summary: new SalesDataDto(report.summary),
        dailyBreakdown: report.dailyBreakdown.map((d) => new DailySalesDto(d)),
      },
    });
  });

  /**
   * Mendapatkan laporan laba rugi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getProfitLossReport = CatchAsync.run(async (req, res) => {
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getProfitLossReport(range);

    res.status(200).json({
      success: true,
      message: "Laporan laba rugi berhasil diambil",
      data: {
        period: report.period,
        profitLoss: new ProfitLossDto(report),
      },
    });
  });

  /**
   * Mendapatkan laporan inventaris
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getInventoryReport = CatchAsync.run(async (req, res) => {
    const report = await this.reportService.getInventoryReport();

    res.status(200).json({
      success: true,
      message: "Laporan inventaris berhasil diambil",
      data: new InventorySnapshotDto(report),
    });
  });

  /**
   * Mendapatkan laporan shift
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getShiftReport = CatchAsync.run(async (req, res) => {
    const { shiftId } = validate(shiftIdParamSchema, req.params);

    const report = await this.reportService.getShiftReport(shiftId);

    res.status(200).json({
      success: true,
      message: "Laporan shift berhasil diambil",
      data: report ? new ShiftReportDto(report) : null,
    });
  });

  /**
   * Mendapatkan laporan produk terlaris
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTopProductsReport = CatchAsync.run(async (req, res) => {
    const query = validate(topProductsQuerySchema, req.query);

    const report = await this.reportService.getTopProductsReport({
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
    });

    res.status(200).json({
      success: true,
      message: "Laporan produk terlaris berhasil diambil",
      data: {
        period: report.period,
        summary: report.summary,
        products: report.products.map((p) => new ProductSalesDto(p)),
      },
    });
  });

  /**
   * Mendapatkan laporan performa mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicPerformanceReport = CatchAsync.run(async (req, res) => {
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getMechanicPerformanceReport(range);

    res.status(200).json({
      success: true,
      message: "Laporan performa mekanik berhasil diambil",
      data: {
        period: report.period,
        summary: report.summary,
        mechanics: report.mechanics.map((m) => new MechanicPerformanceDto(m)),
      },
    });
  });

  /**
   * Mendapatkan ringkasan dashboard berdasarkan role user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getDashboardSummary = CatchAsync.run(async (req, res) => {
    const { role, id: userId } = req.user;

    console.log("id user" , userId);

    const report = await this.reportService.getDashboardSummary(role, userId);

    // Pilih DTO yang sesuai berdasarkan role
    let data;
    switch (role) {
      case "CASHIER":
        data = new CashierDashboardDto(report);
        break;
      case "MECHANIC":
        data = new MechanicDashboardDto(report);
        break;
      case "SUPERADMIN":
      case "ADMIN":
      default:
        data = new DashboardSummaryDto(report);
        break;
    }

    res.status(200).json({
      success: true,
      message: "Ringkasan dashboard berhasil diambil",
      data,
    });
  });

  /**
   * Mendapatkan laporan pengeluaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpenseReport = CatchAsync.run(async (req, res) => {
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getExpenseReport(range);

    res.status(200).json({
      success: true,
      message: "Laporan pengeluaran berhasil diambil",
      data: {
        period: report.period,
        totalExpense: report.totalExpense,
        expensesByCategory: report.expensesByCategory,
      },
    });
  });

  /**
   * Mendapatkan laporan pembayaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPaymentReport = CatchAsync.run(async (req, res) => {
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getPaymentReport(range);

    res.status(200).json({
      success: true,
      message: "Laporan pembayaran berhasil diambil",
      data: {
        period: report.period,
        payment: new PaymentReportDto(report),
      },
    });
  });

  /**
   * Mendapatkan laporan pergerakan stok
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getStockMovementReport = CatchAsync.run(async (req, res) => {
    const { productId } = validate(productIdParamSchema, req.params);
    const range = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getStockMovementReport(productId, {
      startDate: range.startDate,
      endDate: range.endDate,
    });

    res.status(200).json({
      success: true,
      message: "Laporan pergerakan stok berhasil diambil",
      data: {
        period: report.period,
        productId: report.productId,
        movement: new MovementSummaryDto(report.movement),
        consistency: report.consistency
          ? new StockConsistencyDto(report.consistency)
          : null,
      },
    });
  });

  /**
   * Mendapatkan statistik task per order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTaskStatsByOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const stats = await this.reportService.getTaskStatsByOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Statistik task per order berhasil diambil",
      data: new TaskStatsDto(stats),
    });
  });

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicTaskStats = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);

    const stats = await this.reportService.getMechanicTaskStats(mechanicId);

    res.status(200).json({
      success: true,
      message: "Statistik tugas mekanik berhasil diambil",
      data: new MechanicTaskStatsDto(stats),
    });
  });

  /**
   * Mendapatkan total pendapatan mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicEarnings = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);
    const range = validate(dateRangeQuerySchema, req.query);

    const earnings = await this.reportService.getMechanicEarnings(
      mechanicId,
      range
    );

    res.status(200).json({
      success: true,
      message: "Total pendapatan mekanik berhasil diambil",
      data: {
        mechanicId: earnings.mechanicId,
        period: earnings.period,
        earnings: new MechanicEarningsDto(earnings),
      },
    });
  });
}

export default new ReportController();