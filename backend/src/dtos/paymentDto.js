/**
 * Data Transfer Object untuk response Payment
 * @module dtos/paymentDto
 */

/**
 * DTO untuk item pesanan dalam invoice
 * @class PaymentInvoiceItemDto
 */
class PaymentInvoiceItemDto {
  /**
   * @param {Object} data - Data order item dari database
   * @param {string} data.productNameSnapshot - Nama produk saat transaksi
   * @param {number} data.quantity - Jumlah item
   * @param {number} data.unitPrice - Harga satuan
   * @param {number} data.subtotal - Subtotal item
   * @param {Object} [data.product] - Data produk terkait
   * @param {ProductType} [data.product.type] - Tipe produk (SPAREPART/SERVICE)
   * @param {Object[]} [data.assignments] - Daftar mekanik yang ditugaskan
   */
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

/**
 * DTO untuk response invoice (create/findById/findByOrderId)
 * @class PaymentInvoiceDto
 */
class PaymentInvoiceDto {
  /**
   * @param {Object} data - Data payment dari database
   * @param {string} data.id - ID payment
   * @param {PaymentMethod} data.method - Metode pembayaran
   * @param {number} data.amountPaid - Jumlah yang dibayarkan
   * @param {number} data.change - Kembalian
   * @param {PaymentStatus} data.status - Status pembayaran
   * @param {string|null} data.paidAt - Waktu pembayaran
   * @param {string} data.createdAt - Waktu record dibuat
   * @param {Object} data.order - Data order terkait
   */
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

/**
 * DTO untuk payment dalam list (pagination)
 * @class PaymentListDto
 */

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

/**
 * DTO untuk response setelah update status (refund)
 * @class PaymentStatusDto
 */
class PaymentStatusDto {
  /**
   * @param {Object} data - Data payment dari database
   * @param {string} data.id - ID payment
   * @param {PaymentMethod} data.method - Metode pembayaran
   * @param {number} data.amountPaid - Jumlah yang dibayarkan
   * @param {number} data.change - Kembalian
   * @param {PaymentStatus} data.status - Status pembayaran
   * @param {string|null} data.paidAt - Waktu pembayaran
   * @param {string} data.createdAt - Waktu record dibuat
   */
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

/**
 * DTO untuk response pembayaran QRIS
 * @class PaymentQrisDto
 */
class PaymentQrisDto {
  /**
   * @param {Object} data - Data response QRIS dari service
   * @param {string} data.orderId - ID pesanan
   * @param {string} data.orderNumber - Nomor pesanan
   * @param {string} data.transactionId - Transaction ID dari Midtrans
   * @param {string} data.qrCodeUrl - URL QR code untuk pembayaran
   * @param {number} data.amount - Jumlah pembayaran
   * @param {string} data.status - Status pembayaran
   */
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.transactionId = data.transactionId;
    this.qrCodeUrl = data.qrCodeUrl;
    this.amount = data.amount;
    this.status = data.status;
  }
}

/**
 * DTO untuk response status pembayaran QRIS dari Midtrans
 * @class PaymentQrisStatusDto
 */
class PaymentQrisStatusDto {
  /**
   * @param {Object} data - Data status dari service
   */
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
