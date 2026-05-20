/**
 * Data Transfer Object untuk response Expense
 * @module dtos/expenseDto
 */

/**
 * DTO untuk data shift di expense
 * @class ExpenseShiftDto
 */
class ExpenseShiftDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
    this.cashier = {
      id: data.cashier.id,
      fullName: data.cashier.fullName,
    };
  }
}

/**
 * DTO untuk ringkasan shift di list expense
 * @class ExpenseShiftSummaryDto
 */
class ExpenseShiftSummaryDto {
  constructor(data) {
    this.id = data.id;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
  }
}

/**
 * DTO untuk data user pencatat di expense
 * @class ExpenseRecordedByDto
 */
class ExpenseRecordedByDto {
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.role = data.role;
  }
}

/**
 * DTO untuk data bukti pengeluaran
 * @class ExpenseReceiptDto
 */
class ExpenseReceiptDto {
  constructor(data) {
    this.id = data.id;
    this.fileName = data.fileName;
    this.url = data.url || null;
  }
}

/**
 * DTO untuk response detail expense
 * @class ExpenseDetailDto
 */
class ExpenseDetailDto {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.amount = data.amount;
    this.category = data.category;
    this.date = data.date;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.shift = data.shift ? new ExpenseShiftDto(data.shift) : null;
    this.recordedBy = new ExpenseRecordedByDto(data.recordedBy);
    this.receipt = data.receipt ? new ExpenseReceiptDto(data.receipt) : null;
  }
}

/**
 * DTO untuk expense dalam list
 * @class ExpenseListDto
 */
class ExpenseListDto {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.amount = data.amount;
    this.category = data.category;
    this.date = data.date;
    this.createdAt = data.createdAt;
    this.shift = data.shift ? new ExpenseShiftSummaryDto(data.shift) : null;
    this.recordedBy = {
      id: data.recordedBy.id,
      fullName: data.recordedBy.fullName,
    };
    this.receipt = data.receipt
      ? { id: data.receipt.id, url: data.receipt.url || null }
      : null;
  }
}

/**
 * DTO untuk response setelah update expense
 * @class ExpenseUpdatedDto
 */
class ExpenseUpdatedDto {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.amount = data.amount;
    this.category = data.category;
    this.date = data.date;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO untuk response expenses by shift
 * @class ExpensesByShiftDto
 */
class ExpensesByShiftDto {
  constructor(data) {
    this.shift = {
      id: data.shift.id,
      cashier: data.shift.cashier,
      openedAt: data.shift.openedAt,
      closedAt: data.shift.closedAt,
      status: data.shift.status,
    };
    this.expenses = data.expenses?.map((e) => new ExpenseListDto(e)) ?? [];
    this.total = data.total;
  }
}

export {
  ExpenseShiftDto,
  ExpenseShiftSummaryDto,
  ExpenseRecordedByDto,
  ExpenseReceiptDto,
  ExpenseDetailDto,
  ExpenseListDto,
  ExpenseUpdatedDto,
  ExpensesByShiftDto,
};