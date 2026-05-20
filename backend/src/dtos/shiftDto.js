/**
 * Data Transfer Object untuk response Shift
 * @module dtos/shiftDto
 */

/**
 * DTO untuk ringkasan kasir dalam shift
 * @class ShiftCashierDto
 */
class ShiftCashierDto {
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
  }
}

/**
 * DTO untuk data order dalam shift
 * @class ShiftOrderDto
 */
class ShiftOrderDto {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.total = data.total;
    this.createdAt = data.createdAt;
    this.customer = data.customer
      ? { id: data.customer.id, name: data.customer.name }
      : null;
    this.paymentStatus = data.payment?.status ?? null;
    this.totalItems = data.items?.length ?? 0;
  }
}

/**
 * DTO untuk data pengeluaran dalam shift
 * @class ShiftExpenseDto
 */
class ShiftExpenseDto {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.amount = data.amount;
    this.category = data.category;
    this.date = data.date;
    this.receipt = data.receipt
      ? { id: data.receipt.id, url: data.receipt.url || null }
      : null;
  }
}

/**
 * DTO untuk response setelah membuka shift
 * @class ShiftOpenedDto
 */
class ShiftOpenedDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash;
    this.openedAt = data.openedAt;
    this.cashier = new ShiftCashierDto(data.cashier);
  }
}

/**
 * DTO untuk response detail shift
 * @class ShiftDetailDto
 */
class ShiftDetailDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash;
    this.endingCash = data.endingCash;
    this.expectedCash = data.expectedCash;
    this.cashSales = data.cashSales;
    this.cashIn = data.cashIn;
    this.cashOut = data.cashOut;
    this.discrepancy = data.discrepancy;
    this.totalOrders = data.orders?.length ?? 0;
    this.totalExpenses = data.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
    this.cashier = new ShiftCashierDto(data.cashier);
    this.orders = data.orders?.map((o) => new ShiftOrderDto(o)) ?? [];
    this.expenses = data.expenses?.map((e) => new ShiftExpenseDto(e)) ?? [];
  }
}

/**
 * DTO untuk shift dalam list
 * @class ShiftListDto
 */
class ShiftListDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash;
    this.endingCash = data.endingCash;
    this.expectedCash = data.expectedCash;
    this.cashSales = data.cashSales;
    this.discrepancy = data.discrepancy;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
    this.cashier = new ShiftCashierDto(data.cashier);
    this.totalOrders = data._count?.orders ?? 0;
    this.totalExpenses = data._count?.expenses ?? 0;
  }
}

/**
 * DTO untuk response setelah menutup shift
 * @class ShiftClosedDto
 */
class ShiftClosedDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash;
    this.endingCash = data.endingCash;
    this.expectedCash = data.expectedCash;
    this.cashSales = data.cashSales;
    this.cashIn = data.cashIn;
    this.cashOut = data.cashOut;
    this.discrepancy = data.discrepancy;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
    this.cashier = new ShiftCashierDto(data.cashier);
  }
}

/**
 * DTO untuk response update cash flow
 * @class ShiftCashFlowDto
 */
class ShiftCashFlowDto {
  constructor(data) {
    this.id = data.id;
    this.cashSales = data.cashSales;
    this.cashIn = data.cashIn;
    this.cashOut = data.cashOut;
  }
}

/**
 * DTO untuk response shift aktif
 * @class ActiveShiftDto
 */
class ActiveShiftDto {
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash;
    this.endingCash = data.endingCash;
    this.expectedCash = data.expectedCash;
    this.cashSales = data.cashSales;
    this.cashIn = data.cashIn;
    this.cashOut = data.cashOut;
    this.discrepancy = data.discrepancy;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt;
    this.cashier = new ShiftCashierDto(data.cashier);
  }
}

/**
 * DTO untuk saran starting cash
 * @class StartingCashSuggestionDto
 */
class StartingCashSuggestionDto {
  constructor(data) {
    this.suggestedStartingCash = data.suggestedStartingCash;
    this.source = data.source;
    this.message = data.message;
    this.lastShift = data.lastShift
      ? {
          id: data.lastShift.id,
          endingCash: data.lastShift.endingCash,
          closedAt: data.lastShift.closedAt,
        }
      : null;
  }
}

/**
 * DTO untuk perhitungan expected cash
 * @class ExpectedCashDto
 */
class ExpectedCashDto {
  constructor(data) {
    this.shiftId = data.shiftId;
    this.startingCash = data.startingCash;
    this.cashSales = data.cashSales;
    this.cashIn = data.cashIn;
    this.cashOut = data.cashOut;
    this.totalExpenses = data.totalExpenses;
    this.expectedCash = data.expectedCash;
    this.paymentBreakdown = data.paymentBreakdown;
    this.formula = data.formula;
  }
}

export {
  ShiftCashierDto,
  ShiftOrderDto,
  ShiftExpenseDto,
  ShiftOpenedDto,
  ShiftDetailDto,
  ShiftListDto,
  ShiftClosedDto,
  ShiftCashFlowDto,
  ActiveShiftDto,
  StartingCashSuggestionDto,
  ExpectedCashDto,
};