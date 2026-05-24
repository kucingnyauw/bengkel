import ExpenseService from "#service/expenseService.js";

jest.mock("#repository/expenseRepository.js");
jest.mock("#repository/fileRepository.js");
jest.mock("#repository/shiftRepository.js");

jest.mock("#shared/utils/storage.js", () => ({
  uploadFile: jest.fn().mockResolvedValue("expenses/file-123.jpg"),
  deleteFile: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/file.jpg"),
}));

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      expense: {
        create: jest.fn().mockResolvedValue({
          id: "e1",
          title: "Beli ATK",
          amount: 50000,
          shiftId: "s1",
          recordedById: "c1",
          receiptId: null,
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, ...args.data })
        ),
      },
      shift: {
        update: jest.fn().mockResolvedValue({}),
      },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk ExpenseService
 * @describe ExpenseService
 */
describe("ExpenseService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExpenseService();
  });

  /**
   * @describe createExpense
   */
  describe("createExpense", () => {
    const cashierId = "c1";
    const payload = { title: "Beli ATK", amount: 50000, category: "SUPPLIES" };

    /**
     * @test Membuat pengeluaran tanpa receipt
     */
    it("should create expense without receipt", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { ExpenseRepository } = require("#repository/expenseRepository.js");

      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "s1", status: "OPEN",
      });
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", title: "Beli ATK", amount: 50000, receipt: null,
      });

      const result = await service.createExpense(cashierId, payload);

      expect(result.title).toBe("Beli ATK");
    });

    /**
     * @test Melempar 404 ketika kasir tidak memiliki shift aktif
     */
    it("should throw 404 when cashier has no active shift", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue(null);

      await expect(service.createExpense(cashierId, payload)).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Melempar 409 ketika shift sudah ditutup
     */
    it("should throw 409 when shift is closed", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "s1", status: "CLOSED",
      });

      await expect(service.createExpense(cashierId, payload)).rejects.toMatchObject({ statusCode: 409 });
    });

    /**
     * @test Menggunakan kategori default OTHER
     */
    it("should use default category OTHER", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { ExpenseRepository } = require("#repository/expenseRepository.js");

      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "s1", status: "OPEN",
      });
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", category: "OTHER",
      });

      const result = await service.createExpense(cashierId, { title: "Test", amount: 10000 });
      expect(result.category).toBe("OTHER");
    });

    /**
     * @test Membuat pengeluaran dengan file receipt
     */
    it("should create expense with receipt file", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      const { FileRepository } = require("#repository/fileRepository.js");
      const { uploadFile } = require("#shared/utils/storage.js");

      ShiftRepository.mock.instances[0].findActiveByCashier.mockResolvedValue({
        id: "s1", status: "OPEN",
      });
      FileRepository.mock.instances[0].create.mockResolvedValue({
        id: "f1", path: "expenses/file-123.jpg",
      });
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", receipt: { path: "expenses/file-123.jpg" },
      });

      const receiptFile = {
        originalname: "receipt.jpg",
        mimetype: "image/jpeg",
        size: 1024,
        checksum: "abc123",
      };

      await service.createExpense(cashierId, { title: "Test", amount: 50000 }, receiptFile);

      expect(uploadFile).toHaveBeenCalledWith(receiptFile, "expenses");
      expect(FileRepository.mock.instances[0].create).toHaveBeenCalled();
    });
  });

  /**
   * @describe getExpenseById
   */
  describe("getExpenseById", () => {
    /**
     * @test Mengembalikan pengeluaran dengan signed receipt URL
     */
    it("should return expense with signed receipt URL", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", receipt: { path: "expenses/file.jpg" },
      });

      const result = await service.getExpenseById("e1");
      expect(result.receipt.url).toBe("https://signed-url.com/file.jpg");
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getExpenseById("e99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe updateExpense
   */
  describe("updateExpense", () => {
    /**
     * @test Mengupdate pengeluaran tanpa receipt
     */
    it("should update expense without receipt", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById
        .mockResolvedValueOnce({ id: "e1", title: "Old", amount: 50000, shiftId: "s1", receiptId: null })
        .mockResolvedValueOnce({ id: "e1", title: "New", amount: 75000 });

      const result = await service.updateExpense("e1", { title: "New", amount: 75000 }, null, "u1");

      expect(result.title).toBe("New");
    });

    /**
     * @test Melempar 404 ketika pengeluaran tidak ditemukan
     */
    it("should throw 404 when expense not found", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.updateExpense("e1", {}, null, "u1")).rejects.toMatchObject({ statusCode: 404 });
    });

    /**
     * @test Mengganti receipt ketika file baru diupload
     */
    it("should replace receipt when new file uploaded", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      const { FileRepository } = require("#repository/fileRepository.js");
      const { uploadFile, deleteFile } = require("#shared/utils/storage.js");

      ExpenseRepository.mock.instances[0].findById
        .mockResolvedValueOnce({ id: "e1", title: "Old", amount: 50000, shiftId: "s1", receiptId: "f1" })
        .mockResolvedValueOnce({ id: "e1", title: "Updated", receiptId: "f2" });

      FileRepository.mock.instances[0].create.mockResolvedValue({ id: "f2", path: "expenses/new.jpg" });
      FileRepository.mock.instances[0].findById.mockResolvedValue({ id: "f1", path: "expenses/old.jpg" });

      const receiptFile = { originalname: "new.jpg", mimetype: "image/jpeg", size: 2048, checksum: "def" };

      await service.updateExpense("e1", { title: "Updated" }, receiptFile, "u1");

      expect(uploadFile).toHaveBeenCalled();
      expect(FileRepository.mock.instances[0].create).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith("expenses/old.jpg");
    });
  });

  /**
   * @describe getExpenses
   */
  describe("getExpenses", () => {
    /**
     * @test Mengembalikan pengeluaran dengan signed URLs
     */
    it("should return expenses with signed URLs", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [
          { id: "e1", receipt: { path: "file1.jpg" } },
          { id: "e2", receipt: null },
        ],
        metadata: { total: 2 },
      });

      const result = await service.getExpenses({ page: 1 });

      expect(result.data[0].receipt.url).toBe("https://signed-url.com/file.jpg");
      expect(result.data[1].receipt).toBeNull();
    });
  });

  /**
   * @describe getExpensesByShift
   */
  describe("getExpensesByShift", () => {
    /**
     * @test Mengembalikan info shift dan pengeluaran
     */
    it("should return shift info and expenses", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      const { ExpenseRepository } = require("#repository/expenseRepository.js");

      ShiftRepository.mock.instances[0].findById.mockResolvedValue({
        id: "s1", cashier: { id: "c1", fullName: "Kasir" }, openedAt: new Date(), closedAt: null, status: "OPEN",
      });
      ExpenseRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [{ id: "e1", receipt: { path: "file.jpg" } }],
        metadata: { total: 1 },
      });

      const result = await service.getExpensesByShift("s1");

      expect(result.shift.id).toBe("s1");
      expect(result.total).toBe(1);
    });

    /**
     * @test Melempar 404 ketika shift tidak ditemukan
     */
    it("should throw 404 when shift not found", async () => {
      const { ShiftRepository } = require("#repository/shiftRepository.js");
      ShiftRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getExpensesByShift("s99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getExpensesByCashier
   */
  describe("getExpensesByCashier", () => {
    /**
     * @test Mengembalikan pengeluaran kasir dengan signed URLs
     */
    it("should return cashier expenses with signed URLs", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findMany.mockResolvedValue({
        data: [{ id: "e1", receipt: { path: "file.jpg" } }],
        metadata: { total: 1 },
      });

      const result = await service.getExpensesByCashier("c1", { page: 1 });

      expect(result.data[0].receipt.url).toBe("https://signed-url.com/file.jpg");
    });
  });

  /**
   * @describe deleteExpense
   */
  describe("deleteExpense", () => {
    /**
     * @test Menghapus pengeluaran tanpa receipt
     */
    it("should delete expense without receipt", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", title: "Test", amount: 50000, receiptId: null,
      });
      ExpenseRepository.mock.instances[0].delete.mockResolvedValue();

      await expect(service.deleteExpense("e1")).resolves.toBeUndefined();
    });

    /**
     * @test Menghapus pengeluaran beserta file receipt
     */
    it("should delete expense with receipt file", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      const { FileRepository } = require("#repository/fileRepository.js");
      const { deleteFile } = require("#shared/utils/storage.js");

      ExpenseRepository.mock.instances[0].findById.mockResolvedValue({
        id: "e1", title: "Test", amount: 50000, receiptId: "f1",
      });
      FileRepository.mock.instances[0].findById.mockResolvedValue({
        id: "f1", path: "expenses/file.jpg",
      });
      ExpenseRepository.mock.instances[0].delete.mockResolvedValue();

      await service.deleteExpense("e1");

      expect(deleteFile).toHaveBeenCalledWith("expenses/file.jpg");
      expect(FileRepository.mock.instances[0].delete).toHaveBeenCalledWith("f1");
    });

    /**
     * @test Melempar 404 ketika pengeluaran tidak ditemukan
     */
    it("should throw 404 when expense not found", async () => {
      const { ExpenseRepository } = require("#repository/expenseRepository.js");
      ExpenseRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.deleteExpense("e99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});