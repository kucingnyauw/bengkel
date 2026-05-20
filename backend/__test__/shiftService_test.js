// __test__/shiftService_test.js
import ShiftService from "#service/shiftService.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";

// Mock repositories
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");

// Mock Storage utility
jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/receipt.jpg"),
}));

// Mock prisma client
jest.mock("#app/database.js", () => ({
  order: { count: jest.fn() },
  // expense and payment groupBy are used in getExpectedCash
  expense: { aggregate: jest.fn() },
  payment: { groupBy: jest.fn() },
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ShiftService", () => {
  let service;
  let mockShiftRepo;
  let mockSettingRepo;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ShiftService();

    // Get mock instances
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];

    // Default setting for min starting cash (1000000)
    mockSettingRepo.findByKey.mockImplementation((key) => {
      if (key === "shift_min_starting_cash") return Promise.resolve({ value: "1000000" });
      return Promise.resolve(null);
    });

    mockStorage = require("#shared/utils/storage.js");
  });

  // ============================================================
  // openShift
  // ============================================================
  describe("openShift", () => {
    const cashierId = "cashier-1";
    const startingCash = 1000000;

    it("should open a new shift successfully", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        cashierId,
        openedAt: new Date(),
      };
      mockShiftRepo.create.mockResolvedValue(mockShift);

      const result = await service.openShift(cashierId, startingCash);

      expect(result).toEqual(mockShift);
      expect(result.status).toBe("OPEN");
      expect(result.startingCash).toBe(startingCash);
      expect(mockShiftRepo.hasActiveShift).toHaveBeenCalledWith(cashierId);
      expect(mockShiftRepo.create).toHaveBeenCalledWith({ cashierId, startingCash });
    });

    it("should throw ApiError 400 when starting cash is below minimum", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ value: "1500000" }); // min = 1.5M
      const lowCash = 1000000;

      await expect(service.openShift(cashierId, lowCash))
        .rejects.toThrow(ApiError);
      await expect(service.openShift(cashierId, lowCash))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw ApiError 409 when cashier already has an active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      mockShiftRepo.findActiveByCashier.mockResolvedValue({
        id: "shift-existing",
        openedAt: new Date(),
      });

      await expect(service.openShift(cashierId, startingCash))
        .rejects.toThrow(ApiError);
      await expect(service.openShift(cashierId, startingCash))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // closeShift
  // ============================================================
  describe("closeShift", () => {
    const shiftId = "shift-1";
    const endingCash = 5500000;

    const openShift = {
      id: shiftId,
      status: "OPEN",
      startingCash: 1000000,
      cashSales: 5000000,
      cashIn: 200000,
      cashOut: 100000,
      cashierId: "cashier-1",
      closedAt: null,
    };

    beforeEach(() => {
      // Default successful path
      mockShiftRepo.findById.mockResolvedValue(openShift);
      prisma.order.count.mockResolvedValue(0); // no draft orders
      mockShiftRepo.close.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        endingCash,
        expectedCash: 6100000,
        discrepancy: -600000,
        closedAt: new Date(),
      });
    });

    it("should close shift successfully and calculate discrepancy", async () => {
      const result = await service.closeShift(shiftId, endingCash);

      expect(result.status).toBe("CLOSED");
      expect(result.endingCash).toBe(endingCash);
      expect(mockShiftRepo.close).toHaveBeenCalledWith(shiftId, {
        endingCash,
        expectedCash: 6100000,
        discrepancy: -600000,
      });
    });

    it("should throw ApiError 404 when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toThrow(ApiError);
      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw ApiError 409 when shift is already closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({ ...openShift, status: "CLOSED", closedAt: new Date() });

      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toThrow(ApiError);
      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it("should throw ApiError 409 when there are pending DRAFT orders", async () => {
      prisma.order.count.mockResolvedValue(3); // 3 draft orders

      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toThrow(ApiError);
      await expect(service.closeShift(shiftId, endingCash))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // getActiveShift
  // ============================================================
  describe("getActiveShift", () => {
    it("should return the active shift when it exists", async () => {
      const mockShift = { id: "shift-1", status: "OPEN", startingCash: 1000000 };
      mockShiftRepo.findActiveByCashier.mockResolvedValue(mockShift);

      const result = await service.getActiveShift("cashier-1");

      expect(result).toEqual(mockShift);
    });

    it("should return null when there is no active shift", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue(null);

      const result = await service.getActiveShift("cashier-1");

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // getShiftById
  // ============================================================
  describe("getShiftById", () => {
    it("should return shift and add signed URLs for expense receipts", async () => {
      const shift = {
        id: "shift-1",
        status: "OPEN",
        expenses: [
          { id: "exp1", receipt: { path: "receipts/r1.jpg" } },
          { id: "exp2", receipt: null },
        ],
      };
      mockShiftRepo.findById.mockResolvedValue(shift);

      const result = await service.getShiftById("shift-1");

      expect(result.expenses[0].receipt.url).toBe("https://signed-url.com/receipt.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("receipts/r1.jpg");
      // second expense has no receipt, should not call getSignedUrl again
      expect(mockStorage.getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it("should throw 404 when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.getShiftById("shift-99")).rejects.toThrow(ApiError);
      await expect(service.getShiftById("shift-99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getShifts
  // ============================================================
  describe("getShifts", () => {
    it("should return paginated shifts", async () => {
      const mockResult = {
        data: [{ id: "shift-1", status: "CLOSED" }],
        metadata: { total: 1, currentPage: 1 },
      };
      mockShiftRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getShifts({ page: 1, limit: 10, status: "CLOSED" });

      expect(result).toEqual(mockResult);
      expect(mockShiftRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10, status: "CLOSED" });
    });
  });

  // ============================================================
  // getShiftListByCashierId
  // ============================================================
  describe("getShiftListByCashierId", () => {
    it("should return shifts for a specific cashier with filters", async () => {
      const mockResult = {
        data: [{ id: "shift-1" }],
        metadata: { total: 5 },
      };
      mockShiftRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getShiftListByCashierId("cashier-1", { page: 2, limit: 5 });

      expect(result).toEqual(mockResult);
      expect(mockShiftRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cashierId: "cashier-1", page: 2, limit: 5 })
      );
    });
  });

  // ============================================================
  // recordCashSale
  // ============================================================
  describe("recordCashSale", () => {
    const shiftId = "shift-1";
    const amount = 500000;

    it("should record a cash sale on an open shift", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "OPEN" });
      const updatedShift = { id: shiftId, cashSales: 500000 };
      mockShiftRepo.updateCashFlow.mockResolvedValue(updatedShift);

      const result = await service.recordCashSale(shiftId, amount);

      expect(result).toEqual(updatedShift);
      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith(shiftId, { cashSales: amount });
    });

    it("should throw 404 when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.recordCashSale(shiftId, amount)).rejects.toThrow(ApiError);
      await expect(service.recordCashSale(shiftId, amount)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 409 when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "CLOSED" });

      await expect(service.recordCashSale(shiftId, amount)).rejects.toThrow(ApiError);
      await expect(service.recordCashSale(shiftId, amount)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // recordCashIn
  // ============================================================
  describe("recordCashIn", () => {
    const shiftId = "shift-1";
    const amount = 200000;
    const note = "Setoran tambahan";

    it("should record cash in on an open shift", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "OPEN" });
      const updatedShift = { id: shiftId, cashIn: 200000 };
      mockShiftRepo.updateCashFlow.mockResolvedValue(updatedShift);

      const result = await service.recordCashIn(shiftId, amount, note);

      expect(result).toEqual(updatedShift);
      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith(shiftId, { cashIn: amount });
    });

    it("should throw 409 when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "CLOSED" });

      await expect(service.recordCashIn(shiftId, amount, note))
        .rejects.toThrow(ApiError);
      await expect(service.recordCashIn(shiftId, amount, note))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // recordCashOut
  // ============================================================
  describe("recordCashOut", () => {
    const shiftId = "shift-1";
    const amount = 100000;
    const note = "Pengeluaran operasional";

    it("should record cash out on an open shift", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "OPEN" });
      const updatedShift = { id: shiftId, cashOut: 100000 };
      mockShiftRepo.updateCashFlow.mockResolvedValue(updatedShift);

      const result = await service.recordCashOut(shiftId, amount, note);

      expect(result).toEqual(updatedShift);
      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith(shiftId, { cashOut: amount });
    });

    it("should throw 409 when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "CLOSED" });

      await expect(service.recordCashOut(shiftId, amount, note))
        .rejects.toThrow(ApiError);
      await expect(service.recordCashOut(shiftId, amount, note))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // validateShiftForOrder
  // ============================================================
  describe("validateShiftForOrder", () => {
    const shiftId = "shift-1";
    const cashierId = "cashier-1";

    it("should return shift if it is open and belongs to the cashier", async () => {
      const shift = { id: shiftId, status: "OPEN", cashierId };
      mockShiftRepo.findById.mockResolvedValue(shift);

      const result = await service.validateShiftForOrder(shiftId, cashierId);
      expect(result).toEqual(shift);
    });

    it("should throw 404 if shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toThrow(ApiError);
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 409 if shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "CLOSED", closedAt: new Date() });
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toThrow(ApiError);
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it("should throw 403 if cashierId does not match", async () => {
      mockShiftRepo.findById.mockResolvedValue({ id: shiftId, status: "OPEN", cashierId: "other-cashier" });
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toThrow(ApiError);
      await expect(service.validateShiftForOrder(shiftId, cashierId))
        .rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ============================================================
  // hasActiveShift
  // ============================================================
  describe("hasActiveShift", () => {
    it("should return true if cashier has active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      const result = await service.hasActiveShift("cashier-1");
      expect(result).toBe(true);
    });

    it("should return false if no active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      const result = await service.hasActiveShift("cashier-1");
      expect(result).toBe(false);
    });
  });

  // ============================================================
  // getStartingCashSuggestion
  // ============================================================
  describe("getStartingCashSuggestion", () => {
    it("should return ending cash from last shift", async () => {
      const lastShift = {
        id: "shift-0",
        endingCash: 2500000,
        closedAt: new Date(),
      };
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue(lastShift);

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result).toEqual({
        suggestedStartingCash: 2500000,
        source: "previous_shift",
        message: "Mengacu pada ending cash shift sebelumnya",
        lastShift: {
          id: "shift-0",
          endingCash: 2500000,
          closedAt: lastShift.closedAt,
        },
      });
    });

    it("should return default from settings when no previous shift", async () => {
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue(null);

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result.suggestedStartingCash).toBe(1000000);
      expect(result.source).toBe("settings");
      expect(result.lastShift).toBeNull();
    });
  });

  // ============================================================
  // getExpectedCash
  // ============================================================
  describe("getExpectedCash", () => {
    it("should calculate expected cash based on shift data", async () => {
      // The service calls shiftRepo.calculateExpectedCash(shiftId) which is a custom repo method.
      // We'll mock that directly; the test doesn't need to mock internal prisma calls.
      const mockResult = {
        expectedCash: 5600000,
        paymentBreakdown: {
          cash: { total: 3000000, count: 10 },
          qris: { total: 2000000, count: 5 },
        },
      };
      mockShiftRepo.calculateExpectedCash.mockResolvedValue(mockResult);

      const result = await service.getExpectedCash("shift-1");

      expect(result).toEqual(mockResult);
      expect(mockShiftRepo.calculateExpectedCash).toHaveBeenCalledWith("shift-1");
    });

    it("should throw 404 when shift not found", async () => {
      mockShiftRepo.calculateExpectedCash.mockResolvedValue(null);

      await expect(service.getExpectedCash("shift-99")).rejects.toThrow(ApiError);
      await expect(service.getExpectedCash("shift-99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});