import ShiftService from "#service/shiftService.js";

jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/receipt.jpg"),
}));

jest.mock("#app/database.js", () => ({
  order: { count: jest.fn() },
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk ShiftService
 * @describe ShiftService
 */
describe("ShiftService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShiftService();

    const { SettingRepository } = require("#repository/settingRepository.js");
    SettingRepository.mock.instances[0].findByKey.mockImplementation((key) => {
      if (key === "shift_min_starting_cash") return Promise.resolve({ value: "1000000" });
      return Promise.resolve(null);
    });
  });

  /**
   * @describe openShift
   */
  describe("openShift", () => {
    const cashierId = "cashier-1";
    const startingCash = 1000000;

    /**
     * @test Membuka shift baru berhasil
     */
    it("should open a new shift successfully", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { UserRepository } = require("#repository/userRepository.js");
      const { NotificationRepository } = require("#repository/notificationRepository.js");

      ShiftRepository.mock.instances[0].hasActiveShift.mockResolvedValue(false);
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: cashierId, fullName: "Kasir 1" });
      NotificationRepository.mock.instances[0].create.mockResolvedValue({});
      ShiftRepository.mock.instances[0].create.mockResolvedValue({
        id: "shift-1", status: "OPEN", startingCash: 1000000, cashierId, openedAt: new Date(),
      });

      const result = await service.openShift(cashierId, startingCash);

      expect(result.status).toBe("OPEN");
      expect(ShiftRepository.mock.instances[0].create).toHaveBeenCalledWith({ cashierId, startingCash });
    });

    /**
     * @test Melempar 400 ketika saldo awal di bawah minimum
     */
    it("should throw 400 when starting cash below minimum", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ value: "1500000" });

      await expect(service.openShift(cashierId, 1000000)).rejects.toMatchObject({ statusCode: 400 });
    });

    /**
     * @test Melempar 409 ketika kasir sudah memiliki shift aktif
     */
    it("should throw 409 when cashier has active shift", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].hasActiveShift.mockResolvedValue(true);
      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "shift-existing", openedAt: new Date(),
      });

      await expect(service.openShift(cashierId, startingCash)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe closeShift
   */
  describe("closeShift", () => {
    const shiftId = "shift-1";
    const endingCash = 5500000;
    const openShift = {
      id: shiftId, status: "OPEN", startingCash: 1000000, cashSales: 5000000,
      cashIn: 200000, cashOut: 100000, cashierId: "cashier-1",
      openedAt: new Date("2025-01-01T08:00:00"), closedAt: null,
    };

    beforeEach(() => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { UserRepository } = require("#repository/userRepository.js");
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      const { default: prisma } = require("#app/database.js");

      ShiftRepository.mock.instances[0].findById.mockResolvedValue(openShift);
      prisma.order.count.mockResolvedValue(0);
      ShiftRepository.mock.instances[0].close.mockResolvedValue({
        ...openShift, status: "CLOSED", endingCash, expectedCash: 6100000,
        discrepancy: -600000, closedAt: new Date("2025-01-01T20:00:00"),
      });
      UserRepository.mock.instances[0].findById.mockResolvedValue({ id: "cashier-1", fullName: "Kasir 1" });
      NotificationRepository.mock.instances[0].create.mockResolvedValue({});
      UserRepository.mock.instances[0].findByRole.mockResolvedValue([]);
    });

    /**
     * @test Menutup shift berhasil
     */
    it("should close shift successfully", async () => {
      const result = await service.closeShift(shiftId, endingCash);
      expect(result.status).toBe("CLOSED");
    });

    /**
     * @test Melempar 404 ketika shift tidak ditemukan
     */
    it("should throw 404 when shift not found", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.closeShift(shiftId, endingCash)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 409 ketika shift sudah ditutup
     */
    it("should throw 409 when shift already closed", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({
        ...openShift, status: "CLOSED", closedAt: new Date(),
      });

      await expect(service.closeShift(shiftId, endingCash)).rejects.toMatchObject({ statusCode: 409 });
    });

    /**
     * @test Melempar 409 ketika masih ada pesanan DRAFT
     */
    it("should throw 409 when pending DRAFT orders exist", async () => {
      const { default: prisma } = require("#app/database.js");
      prisma.order.count.mockResolvedValue(3);

      await expect(service.closeShift(shiftId, endingCash)).rejects.toMatchObject({ statusCode: 409 });
    });

    /**
     * @test Notifikasi admin ketika selisih signifikan
     */
    it("should notify admins when discrepancy significant", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      const { ShiftRepository } = require("#repository/shiftRepository.js");

      UserRepository.mock.instances[0].findByRole.mockResolvedValue([
        { id: "admin-1", fullName: "Admin", isActive: true },
      ]);
      ShiftRepository.mock.instances[0].close.mockResolvedValue({
        ...openShift, status: "CLOSED", endingCash: 4000000,
        expectedCash: 6100000, discrepancy: -2100000, closedAt: new Date(),
      });

      await service.closeShift(shiftId, 4000000);
      expect(NotificationRepository.mock.instances[0].create).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @describe getActiveShift
   */
  describe("getActiveShift", () => {
    /**
     * @test Mengembalikan shift aktif
     */
    it("should return active shift", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "shift-1", status: "OPEN", startingCash: 1000000,
      });

      const result = await service.getActiveShift("cashier-1");
      expect(result.id).toBe("shift-1");
    });
  });

  /**
   * @describe getShiftById
   */
  describe("getShiftById", () => {
    /**
     * @test Mengembalikan shift dengan signed URLs
     */
    it("should return shift with signed URLs", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({
        id: "shift-1", status: "OPEN",
        expenses: [{ id: "exp1", receipt: { path: "receipts/r1.jpg" } }, { id: "exp2", receipt: null }],
      });

      const result = await service.getShiftById("shift-1");
      expect(result.expenses[0].receipt.url).toBe("https://signed-url.com/receipt.jpg");
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getShiftById("shift-99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getShifts
   */
  describe("getShifts", () => {
    /**
     * @test Mengembalikan shift dengan paginasi
     */
    it("should return paginated shifts", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [{ id: "shift-1" }], metadata: { total: 1 },
      });

      const result = await service.getShifts({});
      expect(result.data).toHaveLength(1);
    });
  });

  /**
   * @describe recordCashSale
   */
  describe("recordCashSale", () => {
    /**
     * @test Mencatat penjualan tunai
     */
    it("should record cash sale", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({ id: "shift-1", status: "OPEN" });
      ShiftRepository.mock.instances[0].updateCashFlow.mockResolvedValue({ id: "shift-1", cashSales: 500000 });

      const result = await service.recordCashSale("shift-1", 500000);
      expect(result.cashSales).toBe(500000);
    });

    /**
     * @test Melempar 409 ketika shift ditutup
     */
    it("should throw 409 when shift closed", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({ id: "shift-1", status: "CLOSED" });

      await expect(service.recordCashSale("shift-1", 500000)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  /**
   * @describe recordCashIn
   */
  describe("recordCashIn", () => {
    /**
     * @test Mencatat kas masuk
     */
    it("should record cash in", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({ id: "shift-1", status: "OPEN", cashierId: "c1" });
      ShiftRepository.mock.instances[0].updateCashFlow.mockResolvedValue({ id: "shift-1", cashIn: 200000 });

      await service.recordCashIn("shift-1", 200000, "Setoran");
      expect(ShiftRepository.mock.instances[0].updateCashFlow).toHaveBeenCalledWith("shift-1", { cashIn: 200000 });
    });
  });

  /**
   * @describe recordCashOut
   */
  describe("recordCashOut", () => {
    /**
     * @test Mencatat kas keluar
     */
    it("should record cash out", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({ id: "shift-1", status: "OPEN", cashierId: "c1" });
      ShiftRepository.mock.instances[0].updateCashFlow.mockResolvedValue({ id: "shift-1", cashOut: 100000 });

      await service.recordCashOut("shift-1", 100000, "Pengeluaran");
      expect(ShiftRepository.mock.instances[0].updateCashFlow).toHaveBeenCalledWith("shift-1", { cashOut: 100000 });
    });
  });

  /**
   * @describe validateShiftForOrder
   */
  describe("validateShiftForOrder", () => {
    /**
     * @test Mengembalikan shift jika valid
     */
    it("should return shift if valid", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({
        id: "shift-1", status: "OPEN", cashierId: "cashier-1",
      });

      const result = await service.validateShiftForOrder("shift-1", "cashier-1");
      expect(result.id).toBe("shift-1");
    });

    /**
     * @test Melempar 403 jika cashierId tidak cocok
     */
    it("should throw 403 when cashier mismatch", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue({
        id: "shift-1", status: "OPEN", cashierId: "other",
      });

      await expect(
        service.validateShiftForOrder("shift-1", "cashier-1")
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  /**
   * @describe hasActiveShift
   */
  describe("hasActiveShift", () => {
    /**
     * @test Mengembalikan true jika ada shift aktif
     */
    it("should return true when active shift exists", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].hasActiveShift.mockResolvedValue(true);

      const result = await service.hasActiveShift("cashier-1");
      expect(result).toBe(true);
    });
  });

  /**
   * @describe getStartingCashSuggestion
   */
  describe("getStartingCashSuggestion", () => {
    /**
     * @test Mengembalikan ending cash shift sebelumnya
     */
    it("should return previous shift ending cash", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findLastShiftByCashier.mockResolvedValue({
        id: "shift-0", endingCash: 2500000, closedAt: new Date(),
      });

      const result = await service.getStartingCashSuggestion("cashier-1");
      expect(result.suggestedStartingCash).toBe(2500000);
    });

    /**
     * @test Mengembalikan default dari settings
     */
    it("should return default from settings", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findLastShiftByCashier.mockResolvedValue(null);

      const result = await service.getStartingCashSuggestion("cashier-1");
      expect(result.suggestedStartingCash).toBe(1000000);
      expect(result.source).toBe("settings");
    });
  });

  /**
   * @describe getExpectedCash
   */
  describe("getExpectedCash", () => {
    /**
     * @test Menghitung expected cash
     */
    it("should calculate expected cash", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].calculateExpectedCash.mockResolvedValue({
        expectedCash: 5600000,
      });

      const result = await service.getExpectedCash("shift-1");
      expect(result.expectedCash).toBe(5600000);
    });
  });
});