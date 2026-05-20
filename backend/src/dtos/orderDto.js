/**
 * Data Transfer Object untuk response Order
 * @module dtos/orderDto
 */

/**
 * DTO untuk data kasir di order
 * @class OrderCashierDto
 */
class OrderCashierDto {
  /**
   * @param {Object} data - Data kasir dari database
   * @param {string} data.id - ID kasir
   * @param {string} data.fullName - Nama lengkap kasir
   */
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
  }
}

/**
 * DTO untuk data customer di order
 * @class OrderCustomerDto
 */
class OrderCustomerDto {
  /**
   * @param {Object} data - Data customer dari database
   * @param {string} data.id - ID customer
   * @param {string} data.name - Nama customer
   * @param {string|null} data.phone - Nomor telepon customer
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
  }
}

/**
 * DTO untuk data kendaraan di order
 * @class OrderVehicleDto
 */
class OrderVehicleDto {
  /**
   * @param {Object} data - Data kendaraan dari database
   * @param {string} data.id - ID kendaraan
   * @param {string} data.plateNumber - Nomor plat kendaraan
   * @param {string|null} data.brand - Merek kendaraan
   * @param {string|null} data.model - Model kendaraan
   */
  constructor(data) {
    this.id = data.id;
    this.plateNumber = data.plateNumber;
    this.brand = data.brand;
    this.model = data.model;
  }
}

/**
 * DTO untuk data produk di item order
 * @class OrderItemProductDto
 */
class OrderItemProductDto {
  /**
   * @param {Object} data - Data produk dari database
   * @param {string} data.id - ID produk
   * @param {string} data.name - Nama produk
   * @param {string} data.type - Tipe produk (SPAREPART/SERVICE)
   * @param {Object} [data.image] - Data gambar produk
   * @param {string} data.image.id - ID gambar
   * @param {string} data.image.url - URL gambar
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.image = data.image
      ? {
          id: data.image.id,
          url: data.image.url,
        }
      : null;
  }
}

/**
 * DTO untuk data penugasan mekanik di item order
 * @class OrderItemAssignmentDto
 */
class OrderItemAssignmentDto {
  /**
   * @param {Object} data - Data assignment dari database
   * @param {string} data.id - ID assignment
   * @param {string|null} data.startAt - Waktu mulai pengerjaan
   * @param {string|null} data.endAt - Waktu selesai pengerjaan
   * @param {Object} [data.mechanic] - Data mekanik yang ditugaskan
   * @param {string} data.mechanic.id - ID mekanik
   * @param {string} data.mechanic.fullName - Nama lengkap mekanik
   */
  constructor(data) {
    this.id = data.id;
    this.startAt = data.startAt;
    this.endAt = data.endAt;
    this.mechanic = data.mechanic
      ? {
          id: data.mechanic.id,
          fullName: data.mechanic.fullName,
        }
      : null;
  }
}

/**
 * DTO untuk item di dalam order
 * @class OrderItemDto
 */
class OrderItemDto {
  /**
   * @param {Object} data - Data order item dari database
   * @param {string} data.id - ID order item
   * @param {number} data.quantity - Jumlah item
   * @param {number} data.unitPrice - Harga satuan
   * @param {number} data.subtotal - Subtotal item
   * @param {string} data.productNameSnapshot - Nama produk saat transaksi
   * @param {Object} [data.product] - Data produk terkait
   * @param {Object[]} [data.assignments] - Daftar penugasan mekanik
   */
  constructor(data) {
    this.id = data.id;
    this.quantity = data.quantity;
    this.unitPrice = data.unitPrice;
    this.subtotal = data.subtotal;
    this.productName = data.productNameSnapshot;
    this.product = data.product
      ? new OrderItemProductDto(data.product)
      : null;
    this.assignments =
      data.assignments?.map((a) => new OrderItemAssignmentDto(a)) ?? [];
  }
}

/**
 * DTO untuk data pembayaran di order
 * @class OrderPaymentDto
 */
class OrderPaymentDto {
  /**
   * @param {Object} data - Data payment dari database
   * @param {string} data.id - ID payment
   * @param {string} data.method - Metode pembayaran
   * @param {number} data.amountPaid - Jumlah yang dibayarkan
   * @param {string} data.status - Status pembayaran
   * @param {string|null} data.paidAt - Waktu pembayaran
   */
  constructor(data) {
    this.id = data.id;
    this.method = data.method;
    this.amountPaid = data.amountPaid;
    this.status = data.status;
    this.paidAt = data.paidAt;
  }
}

/**
 * DTO untuk riwayat status order
 * @class OrderHistoryDto
 */
class OrderHistoryDto {
  /**
   * @param {Object} data - Data history dari database
   * @param {string} data.id - ID history
   * @param {string} data.status - Status order saat itu
   * @param {string|null} data.note - Keterangan perubahan status
   * @param {string} data.createdAt - Waktu perubahan status
   * @param {Object} [data.changedBy] - User yang mengubah status
   * @param {string} data.changedBy.id - ID user
   * @param {string} data.changedBy.fullName - Nama user
   */
  constructor(data) {
    this.id = data.id;
    this.status = data.status;
    this.note = data.note || null;
    this.createdAt = data.createdAt;
    this.changedBy = data.changedBy
      ? {
          id: data.changedBy.id,
          fullName: data.changedBy.fullName,
        }
      : null;
  }
}

/**
 * DTO untuk detail order (get by ID / after create)
 * @class OrderDetailDto
 */
class OrderDetailDto {
  /**
   * @param {Object} data - Data order lengkap dari database
   */
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.subtotal = data.subtotal;
    this.tax = data.tax;
    this.total = data.total;
    this.diagnosedAt = data.diagnosedAt;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.closedAt = data.closedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.cashier = new OrderCashierDto(data.cashier);
    this.paymentStatus = data.payment
      ? data.payment.status === "PAID"
        ? "Lunas"
        : data.payment.status === "PENDING"
        ? "Menunggu Pembayaran"
        : data.payment.status === "REFUNDED"
        ? "Direfund"
        : "Belum Bayar"
      : "Belum Bayar";
    this.customer = data.customer
      ? new OrderCustomerDto(data.customer)
      : null;
    this.vehicle = data.vehicle
      ? new OrderVehicleDto(data.vehicle)
      : null;
    this.items = data.items?.map((i) => new OrderItemDto(i)) ?? [];
    this.payment = data.payment
      ? new OrderPaymentDto(data.payment)
      : null;
    this.histories =
      data.histories?.map((h) => new OrderHistoryDto(h)) ?? [];
  }
}

/**
 * DTO untuk order dalam list (pagination)
 * @class OrderListDto
 */
class OrderListDto {
  /**
   * @param {Object} data - Data order dari database
   */
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.subtotal = data.subtotal;
    this.tax = data.tax;
    this.total = data.total;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.cashier = new OrderCashierDto(data.cashier);
    this.customer = data.customer
      ? new OrderCustomerDto(data.customer)
      : null;
    this.vehicle = data.vehicle
      ? new OrderVehicleDto(data.vehicle)
      : null;
    this.payment = data.payment
      ? new OrderPaymentDto(data.payment)
      : null;
    this.items = data.items?.map((i) => new OrderItemDto(i)) ?? [];
    this.totalItems = data._count?.items ?? 0;
    this.paymentStatus = data.payment
      ? data.payment.status === "PAID"
        ? "Lunas"
        : data.payment.status === "PENDING"
        ? "Menunggu Pembayaran"
        : data.payment.status === "REFUNDED"
        ? "Direfund"
        : "Belum Bayar"
      : "Belum Bayar";
  }
}

/**
 * DTO untuk response setelah update status
 * @class OrderStatusUpdatedDto
 */
class OrderStatusUpdatedDto {
  /**
   * @param {Object} data - Data order setelah update status
   */
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.diagnosedAt = data.diagnosedAt;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.closedAt = data.closedAt;
    this.updatedAt = data.updatedAt;
  }
}

// ============================================================
// Order History Tracking DTOs
// ============================================================

/**
 * DTO untuk satu entry timeline di track order history
 * @class OrderHistoryTimelineDto
 */
class OrderHistoryTimelineDto {
  /**
   * @param {Object} data - Data timeline dari service
   * @param {string} data.status - Status
   * @param {string|null} data.note - Keterangan perubahan
   * @param {string} data.changedAt - Waktu perubahan
   * @param {string} data.changedBy - Nama user yang mengubah
   */
  constructor(data) {
    this.status = data.status;
    this.note = data.note || null;
    this.changedAt = data.changedAt;
    this.changedBy = data.changedBy;
  }
}

/**
 * DTO untuk response track order history (lengkap dengan timeline)
 * @class OrderHistoryDetailDto
 */
class OrderHistoryDetailDto {
  /**
   * @param {Object} data - Data dari OrderService.trackOrderHistory()
   * @param {string} data.orderNumber - Nomor pesanan
   * @param {string} data.currentStatus - Status saat ini
   * @param {number} data.total - Total pembayaran
   * @param {string} data.createdAt - Waktu pembuatan
   * @param {string|null} data.completedAt - Waktu selesai
   * @param {string|null} data.closedAt - Waktu ditutup
   * @param {Object} data.cashier - Data kasir
   * @param {Object|null} data.customer - Data customer
   * @param {Object|null} data.vehicle - Data kendaraan
   * @param {Object|null} data.payment - Data pembayaran
   * @param {Array} data.items - Item pesanan
   * @param {Array} data.timeline - Timeline perubahan status
   */
  constructor(data) {
    this.orderNumber = data.orderNumber;
    this.currentStatus = data.currentStatus;
    this.total = data.total;
    this.createdAt = data.createdAt;
    this.completedAt = data.completedAt;
    this.closedAt = data.closedAt;
    this.cashier = data.cashier
      ? new OrderCashierDto(data.cashier)
      : null;
    this.customer = data.customer
      ? new OrderCustomerDto(data.customer)
      : null;
    this.vehicle = data.vehicle
      ? new OrderVehicleDto(data.vehicle)
      : null;
    this.payment = data.payment
      ? new OrderPaymentDto(data.payment)
      : null;
    this.items = data.items?.map((i) => new OrderItemDto(i)) ?? [];
    this.timeline = data.timeline?.map(
      (t) => new OrderHistoryTimelineDto(t)
    ) ?? [];
  }
}

export {
  OrderCashierDto,
  OrderCustomerDto,
  OrderVehicleDto,
  OrderItemProductDto,
  OrderItemAssignmentDto,
  OrderItemDto,
  OrderPaymentDto,
  OrderHistoryDto,
  OrderDetailDto,
  OrderListDto,
  OrderStatusUpdatedDto,
  OrderHistoryTimelineDto,
  OrderHistoryDetailDto,
};