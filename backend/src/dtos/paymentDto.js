/**
 * Data Transfer Object untuk response Payment
 * @module dtos/paymentDto
 */

class PaymentInvoiceItemDto {
  constructor(data) {
    this.productName = data.productNameSnapshot;
    this.quantity = data.quantity;
    this.unitPrice = data.unitPrice;
    this.subtotal = data.subtotal;
    this.type = data.product?.type ?? null;
    this.mechanics =
      data.assignments?.map((a) => ({
        id: a.id,
        name: a.mechanic?.fullName ?? null,
      })) ?? [];
  }
}

class PaymentInvoiceDto {
  constructor(data) {
    this.id = data.id;
    this.method = data.method;
    this.amountPaid = data.amountPaid;
    this.change = data.change;
    this.status = data.status;
    this.paidAt = data.paidAt;
    this.createdAt = data.createdAt;
    this.statusLabel =
      data.status === "PAID"
        ? "Lunas"
        : data.status === "PENDING"
        ? "Menunggu"
        : data.status === "REFUNDED"
        ? "Direfund"
        : data.status;
    this.order = {
      id: data.order.id,
      orderNumber: data.order.orderNumber,
      subtotal: data.order.subtotal,
      tax: data.order.tax,
      taxRate: data.order.taxRate ?? null,
      total: data.order.total,
      createdAt: data.order.createdAt,
      cashier: {
        id: data.order.cashier.id,
        fullName: data.order.cashier.fullName,
      },
      customer: data.order.customer
        ? {
            id: data.order.customer.id,
            name: data.order.customer.name,
            phone: data.order.customer.phone,
          }
        : null,
      vehicle: data.order.vehicle
        ? {
            id: data.order.vehicle.id,
            plateNumber: data.order.vehicle.plateNumber,
            brand: data.order.vehicle.brand,
            model: data.order.vehicle.model,
          }
        : null,
      items:
        data.order.items?.map((item) => new PaymentInvoiceItemDto(item)) ?? [],
    };
  }
}

class PaymentListDto {
  constructor(data) {
    this.id = data.id;
    this.method = data.method;
    this.amountPaid = data.amountPaid;
    this.change = data.change;
    this.status = data.status;
    this.paidAt = data.paidAt;
    this.createdAt = data.createdAt;
    this.statusLabel = this.#getStatusLabel(data.status);
    this.order = data.order
      ? {
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          total: data.order.total,
          subtotal: data.order.subtotal,
          tax: data.order.tax,
          taxRate: data.order.taxRate ?? null,
          status: data.order.status,
          createdAt: data.order.createdAt,
          cashier: data.order.cashier
            ? {
                id: data.order.cashier.id,
                fullName: data.order.cashier.fullName,
              }
            : null,
          customer: data.order.customer
            ? {
                id: data.order.customer.id,
                name: data.order.customer.name,
                phone: data.order.customer.phone,
              }
            : null,
          vehicle: data.order.vehicle
            ? {
                id: data.order.vehicle.id,
                plateNumber: data.order.vehicle.plateNumber,
                brand: data.order.vehicle.brand,
                model: data.order.vehicle.model,
              }
            : null,
          items:
            data.order.items?.map(
              (item) => new PaymentInvoiceItemDto(item)
            ) ?? [],
        }
      : null;
  }

  #getStatusLabel(status) {
    const labels = {
      PAID: "Lunas",
      PENDING: "Menunggu",
      REFUNDED: "Direfund",
    };
    return labels[status] || status;
  }
}

class PaymentStatusDto {
  constructor(data) {
    this.id = data.id;
    this.method = data.method;
    this.amountPaid = data.amountPaid;
    this.change = data.change;
    this.status = data.status;
    this.paidAt = data.paidAt;
    this.createdAt = data.createdAt;
  }
}

class PaymentQrisDto {
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.transactionId = data.transactionId;
    this.qrCodeUrl = data.qrCodeUrl;
    this.amount = data.amount;
    this.status = data.status;
  }
}

class PaymentQrisStatusDto {
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.method = data.method;
    this.status = data.status;
    this.amountPaid = data.amountPaid;
    this.change = data.change;
    this.paidAt = data.paidAt;
    this.midtransTransactionId = data.midtransTransactionId;
    this.midtransStatus = data.midtransStatus;
    this.fraudStatus = data.fraudStatus;
    this.paymentType = data.paymentType;
    this.grossAmount = data.grossAmount;
    this.currency = data.currency;
    this.transactionTime = data.transactionTime;
    this.settlementTime = data.settlementTime;
    this.expiryTime = data.expiryTime;
    this.dbStatus = data.dbStatus;
    this.note = data.note;
  }
}

export {
  PaymentInvoiceItemDto,
  PaymentInvoiceDto,
  PaymentListDto,
  PaymentStatusDto,
  PaymentQrisDto,
  PaymentQrisStatusDto,
};