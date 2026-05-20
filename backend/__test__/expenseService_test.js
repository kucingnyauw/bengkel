// __test__/expenseService_test.js
import ExpenseService from "#service/expenseService.js";
import ExpenseRepository from "#repository/expenseRepository.js";
import FileRepository from "#repository/fileRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";

// ---------- Mocks ----------
jest.mock("#repository/expenseRepository.js");
jest.mock("#repository/fileRepository.js");
jest.mock("#repository/shiftRepository.js");

jest.mock("#shared/utils/storage.js", () => ({
  uploadFile: jest.fn().mockResolvedValue("expenses/file-123.jpg"),
  deleteFile: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/expenses/file-123.jpg"),
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
          Promise.resolve({
            id: args.where.id,
            ...args.data,
            amount: args.data.amount ?? 50000,
          })
        ),
      },
      shift: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ status: "OPEN" }),
      },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ExpenseService", () => {
  let service;
  let mockExpenseRepo;
  let mockFileRepo;
  let mockShiftRepo;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExpenseService();

    // Get mock instances
    mockExpenseRepo = ExpenseRepository.mock.instances[0];
    mockFileRepo = FileRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockStorage = require("#shared/utils/storage.js");
  });

  // ============================================================
  // createExpense
  // ============================================================
  describe("createExpense", () => {
    const cashierId = "c1";
    const payload = {
      title: "Beli ATK",
      amount: 50000,
      category: "SUPPLIES",
    };

    it("should create expense successfully without receipt", async () => {
      const activeShift = { id: "s1", status: "OPEN" };
      mockShiftRepo.findActiveByCashier.mockResolvedValue(activeShift);

      // After creation, service calls expenseRepo.findById
      const fullExpense = {
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        shiftId: "s1",
        recordedById: "c1",
        receipt: null,
      };
      mockExpenseRepo.findById.mockResolvedValue(fullExpense);

      const result = await service.createExpense(cashierId, payload);

      expect(result).toEqual(fullExpense);
      expect(result.title).toBe("Beli ATK");
      expect(mockShiftRepo.findActiveByCashier).toHaveBeenCalledWith(cashierId);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockExpenseRepo.findById).toHaveBeenCalledWith("e1");
    });

    it("should create expense with receipt file", async () => {
      const activeShift = { id: "s1", status: "OPEN" };
      mockShiftRepo.findActiveByCashier.mockResolvedValue(activeShift);

      const receiptFile = {
        originalname: "receipt.jpg",
        mimetype: "image/jpeg",
        size: 1024,
        checksum: "abc123",
      };

      mockFileRepo.create.mockResolvedValue({ id: "f1", path: "expenses/file-123.jpg" });

      const fullExpense = {
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        receipt: { path: "expenses/file-123.jpg" },
      };
      mockExpenseRepo.findById.mockResolvedValue(fullExpense);

      await service.createExpense(cashierId, payload, receiptFile);

      expect(mockStorage.uploadFile).toHaveBeenCalledWith(receiptFile, "expenses");
      expect(mockFileRepo.create).toHaveBeenCalledWith({
        path: "expenses/file-123.jpg",
        fileName: "receipt.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        checksum: "abc123",
        uploadedById: cashierId,
      });
    });

    it("should throw 404 when cashier has no active shift", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue(null);

      await expect(service.createExpense(cashierId, payload)).rejects.toThrow(ApiError);
      await expect(service.createExpense(cashierId, payload)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 409 when shift is closed", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue({ id: "s1", status: "CLOSED" });

      await expect(service.createExpense(cashierId, payload)).rejects.toThrow(ApiError);
      await expect(service.createExpense(cashierId, payload)).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should use default category OTHER when not provided", async () => {
      const activeShift = { id: "s1", status: "OPEN" };
      mockShiftRepo.findActiveByCashier.mockResolvedValue(activeShift);
      const payloadNoCat = { title: "Beli ATK", amount: 50000 };

      const fullExpense = { id: "e1", category: "OTHER" };
      mockExpenseRepo.findById.mockResolvedValue(fullExpense);

      const result = await service.createExpense(cashierId, payloadNoCat);
      expect(result.category).toBe("OTHER");
    });
  });

  // ============================================================
  // getExpenseById
  // ============================================================
  describe("getExpenseById", () => {
    it("should return expense with signed receipt URL", async () => {
      const expense = {
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        receipt: { path: "expenses/file-123.jpg" },
      };
      mockExpenseRepo.findById.mockResolvedValue(expense);

      const result = await service.getExpenseById("e1");
      expect(result.receipt.url).toBe("https://signed-url.com/expenses/file-123.jpg");
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith("expenses/file-123.jpg");
    });

    it("should return expense without receipt as null", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        receipt: null,
      });
      const result = await service.getExpenseById("e1");
      expect(result.receipt).toBeNull();
    });

    it("should throw 404 when not found", async () => {
      mockExpenseRepo.findById.mockResolvedValue(null);
      await expect(service.getExpenseById("e99")).rejects.toThrow(ApiError);
      await expect(service.getExpenseById("e99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // updateExpense
  // ============================================================
  describe("updateExpense", () => {
    const expenseId = "e1";
    const userId = "u1";
    const existing = {
      id: expenseId,
      title: "Old Title",
      amount: 50000,
      shiftId: "s1",
      receiptId: null,
    };

    beforeEach(() => {
      mockExpenseRepo.findById.mockResolvedValueOnce(existing); // for initial check
      // after update, service calls findById again
      mockExpenseRepo.findById.mockResolvedValueOnce({
        ...existing,
        title: "New Title",
        amount: 75000,
      });
    });

    it("should update expense without receipt", async () => {
      const payload = { title: "New Title", amount: 75000 };
      const result = await service.updateExpense(expenseId, payload, null, userId);

      expect(result.title).toBe("New Title");
      expect(result.amount).toBe(75000);
    });

    it("should replace receipt when new file uploaded", async () => {
      const receiptFile = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 2048,
        checksum: "def",
      };
      const oldFile = { id: "f1", path: "expenses/old.jpg" };

      // Simulate old receipt exists
      mockExpenseRepo.findById.mockReset();
      mockExpenseRepo.findById.mockResolvedValueOnce({
        ...existing,
        receiptId: "f1",
      });
      mockFileRepo.create.mockResolvedValue({ id: "f2", path: "expenses/new.jpg" });
      mockFileRepo.findById.mockResolvedValue(oldFile); // for deletion

      const updatedExpense = {
        id: expenseId,
        title: "Updated",
        amount: 50000,
        receiptId: "f2",
      };
      mockExpenseRepo.findById.mockResolvedValueOnce(updatedExpense); // final return

      await service.updateExpense(expenseId, { title: "Updated" }, receiptFile, userId);

      expect(mockStorage.uploadFile).toHaveBeenCalled();
      expect(mockFileRepo.create).toHaveBeenCalled();
      expect(mockStorage.deleteFile).toHaveBeenCalledWith("expenses/old.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("f1");
    });

    it("should throw 404 when expense not found", async () => {
      mockExpenseRepo.findById.mockReset();
      mockExpenseRepo.findById.mockResolvedValue(null);

      await expect(service.updateExpense(expenseId, {}, null, userId)).rejects.toThrow(ApiError);
      await expect(service.updateExpense(expenseId, {}, null, userId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getExpenses
  // ============================================================
  describe("getExpenses", () => {
    it("should return expenses with signed URLs", async () => {
      const mockResult = {
        data: [
          { id: "e1", title: "Beli ATK", receipt: { path: "expenses/file-123.jpg" } },
          { id: "e2", title: "Bayar Listrik", receipt: null },
        ],
        metadata: { total: 2, currentPage: 1 },
      };
      mockExpenseRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getExpenses({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].receipt.url).toBe("https://signed-url.com/expenses/file-123.jpg");
      expect(result.data[1].receipt).toBeNull();
    });
  });

  // ============================================================
  // getExpensesByShift
  // ============================================================
  describe("getExpensesByShift", () => {
    it("should return shift info and expenses", async () => {
      const shift = {
        id: "s1",
        cashier: { id: "c1", fullName: "Kasir 1" },
        openedAt: new Date(),
        closedAt: null,
        status: "OPEN",
      };
      mockShiftRepo.findById.mockResolvedValue(shift);

      const expensesData = {
        data: [{ id: "e1", title: "Beli ATK", receipt: { path: "expenses/file.jpg" } }],
        metadata: { total: 1 },
      };
      mockExpenseRepo.findMany.mockResolvedValue(expensesData);

      const result = await service.getExpensesByShift("s1");

      expect(result.shift.id).toBe("s1");
      expect(result.expenses).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockShiftRepo.findById).toHaveBeenCalledWith("s1");
      expect(mockExpenseRepo.findMany).toHaveBeenCalledWith({ shiftId: "s1" });
    });

    it("should throw 404 when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);
      await expect(service.getExpensesByShift("s99")).rejects.toThrow(ApiError);
      await expect(service.getExpensesByShift("s99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getExpensesByCashier
  // ============================================================
  describe("getExpensesByCashier", () => {
    it("should return expenses for cashier with signed URLs", async () => {
      const mockResult = {
        data: [{ id: "e1", title: "Beli ATK", receipt: { path: "file.jpg" } }],
        metadata: { total: 1 },
      };
      mockExpenseRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getExpensesByCashier("c1", { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].receipt.url).toBe("https://signed-url.com/expenses/file-123.jpg");
      expect(mockExpenseRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ recordedById: "c1", page: 1, limit: 10 })
      );
    });
  });

  // ============================================================
  // deleteExpense
  // ============================================================
  describe("deleteExpense", () => {
    it("should delete expense without receipt", async () => {
      const expense = { id: "e1", title: "Test", amount: 50000, receiptId: null };
      mockExpenseRepo.findById.mockResolvedValue(expense);
      mockExpenseRepo.delete.mockResolvedValue();

      await expect(service.deleteExpense("e1")).resolves.toBeUndefined();
      expect(mockExpenseRepo.delete).toHaveBeenCalledWith("e1");
    });

    it("should delete receipt file if exists", async () => {
      const expense = { id: "e1", title: "Test", amount: 50000, receiptId: "f1" };
      mockExpenseRepo.findById.mockResolvedValue(expense);
      mockFileRepo.findById.mockResolvedValue({ id: "f1", path: "expenses/file.jpg" });
      mockExpenseRepo.delete.mockResolvedValue();

      await service.deleteExpense("e1");

      expect(mockStorage.deleteFile).toHaveBeenCalledWith("expenses/file.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("f1");
      expect(mockExpenseRepo.delete).toHaveBeenCalledWith("e1");
    });

    it("should throw 404 when expense not found", async () => {
      mockExpenseRepo.findById.mockResolvedValue(null);
      await expect(service.deleteExpense("e99")).rejects.toThrow(ApiError);
      await expect(service.deleteExpense("e99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});