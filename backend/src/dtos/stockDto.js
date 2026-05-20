/**
 * Data Transfer Object untuk response Stock Movement
 * @module dtos/stockDto
 */

/**
 * DTO untuk data produk di stock movement
 * @class StockProductDto
 */
class StockProductDto {
  /**
   * @param {Object} data - Data produk dari database
   * @param {string} data.id - ID produk
   * @param {string} data.name - Nama produk
   * @param {string} data.sku - SKU produk
   * @param {ProductType} [data.type] - Tipe produk (SPAREPART, SERVICE)
   * @param {number} data.stock - Stok saat ini
   * @param {number} [data.price] - Harga jual
   * @param {number} [data.cost] - Harga modal
   * @returns {StockProductDto}
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id;
    /** @type {string} */
    this.name = data.name;
    /** @type {string} */
    this.sku = data.sku;
    /** @type {string|undefined} */
    this.type = data.type;
    /** @type {number} */
    this.stock = data.stock;
    /** @type {number|undefined} */
    this.price = data.price;
    /** @type {number|undefined} */
    this.cost = data.cost;
  }
}

/**
 * DTO untuk data order item di stock movement
 * @class StockOrderItemDto
 */
class StockOrderItemDto {
  /**
   * @param {Object} data - Data order item dari database
   * @param {string} data.id - ID order item
   * @param {number} data.quantity - Quantity
   * @param {number} data.unitPrice - Harga satuan
   * @param {number} data.subtotal - Subtotal
   * @param {string} data.productNameSnapshot - Nama produk (snapshot)
   * @param {Object} [data.order] - Data order terkait
   * @param {string} data.order.id - ID order
   * @param {string} data.order.orderNumber - Nomor order
   * @param {OrderStatus} [data.order.status] - Status order
   * @param {string} [data.order.createdAt] - Waktu pembuatan order
   * @returns {StockOrderItemDto}
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id;
    /** @type {number} */
    this.quantity = data.quantity;
    /** @type {number} */
    this.unitPrice = data.unitPrice;
    /** @type {number} */
    this.subtotal = data.subtotal;
    /** @type {string} */
    this.productName = data.productNameSnapshot;
    /** @type {{id: string, orderNumber: string, status?: string, createdAt?: string}|null} */
    this.order = data.order
      ? {
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          status: data.order.status,
          createdAt: data.order.createdAt,
        }
      : null;
  }
}

/**
 * DTO untuk data user pencatat di stock movement
 * @class StockRecordedByDto
 */
class StockRecordedByDto {
  /**
   * @param {Object} data - Data user dari database
   * @param {string} data.id - ID user
   * @param {string} data.fullName - Nama lengkap user
   * @param {Role} [data.role] - Role user (SUPERADMIN, ADMIN, CASHIER, MECHANIC)
   * @returns {StockRecordedByDto}
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id;
    /** @type {string} */
    this.fullName = data.fullName;
    /** @type {string|undefined} */
    this.role = data.role;
  }
}

/**
 * DTO untuk response detail stock movement
 * Digunakan pada endpoint: GET /stock/movements/:id, POST /stock/in, POST /stock/out, dll
 * @class StockMovementDetailDto
 */
class StockMovementDetailDto {
  /**
   * @param {Object} data - Data stock movement dari database (hasil select #fullSelect)
   * @param {string} data.id - ID movement
   * @param {StockMovementType} data.type - Tipe movement (IN, OUT, ADJUSTMENT)
   * @param {StockSourceType} data.sourceType - Sumber movement (MANUAL, PURCHASE, SALE, RETURN, ADJUSTMENT)
   * @param {number} data.quantity - Jumlah perubahan
   * @param {string|null} data.note - Catatan
   * @param {string} data.createdAt - Waktu dibuat
   * @param {Object} data.product - Data produk lengkap
   * @param {Object} [data.orderItem] - Data order item (null jika tidak terkait order)
   * @param {Object} data.recordedBy - Data user pencatat
   * @returns {StockMovementDetailDto}
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id;
    /** @type {string} */
    this.type = data.type;
    /** @type {string} */
    this.sourceType = data.sourceType;
    /** @type {number} */
    this.quantity = data.quantity;
    /** @type {string|null} */
    this.note = data.note;
    /** @type {string} */
    this.createdAt = data.createdAt;
    /** @type {StockProductDto} */
    this.product = new StockProductDto(data.product);
    /** @type {StockOrderItemDto|null} */
    this.orderItem = data.orderItem ? new StockOrderItemDto(data.orderItem) : null;
    /** @type {StockRecordedByDto} */
    this.recordedBy = new StockRecordedByDto(data.recordedBy);
  }
}

/**
 * DTO untuk stock movement dalam list/summary
 * Digunakan pada endpoint: GET /stock/movements, GET /stock/products/:productId/movements
 * @class StockMovementListDto
 */
class StockMovementListDto {
  /**
   * @param {Object} data - Data stock movement dari database (hasil select #listSelect)
   * @param {string} data.id - ID movement
   * @param {StockMovementType} data.type - Tipe movement (IN, OUT, ADJUSTMENT)
   * @param {StockSourceType} data.sourceType - Sumber movement (MANUAL, PURCHASE, SALE, RETURN, ADJUSTMENT)
   * @param {number} data.quantity - Jumlah perubahan
   * @param {string|null} data.note - Catatan
   * @param {string} data.createdAt - Waktu dibuat
   * @param {Object} data.product - Data produk (summary)
   * @param {string} data.product.id - ID produk
   * @param {string} data.product.name - Nama produk
   * @param {string} data.product.sku - SKU produk
   * @param {number} data.product.stock - Stok saat ini
   * @param {Object} data.recordedBy - Data user pencatat (summary)
   * @param {string} data.recordedBy.id - ID user
   * @param {string} data.recordedBy.fullName - Nama user
   * @param {Object} [data.orderItem] - Data order item (null jika tidak terkait order)
   * @param {string} data.orderItem.id - ID order item
   * @param {string} data.orderItem.productNameSnapshot - Nama produk
   * @param {Object} [data.orderItem.order] - Data order
   * @param {string} data.orderItem.order.id - ID order
   * @param {string} data.orderItem.order.orderNumber - Nomor order
   * @returns {StockMovementListDto}
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id;
    /** @type {string} */
    this.type = data.type;
    /** @type {string} */
    this.sourceType = data.sourceType;
    /** @type {number} */
    this.quantity = data.quantity;
    /** @type {string|null} */
    this.note = data.note;
    /** @type {string} */
    this.createdAt = data.createdAt;
    /** @type {{id: string, name: string, sku: string, stock: number}} */
    this.product = {
      id: data.product.id,
      name: data.product.name,
      sku: data.product.sku,
      stock: data.product.stock,
    };
    /** @type {{id: string, fullName: string}} */
    this.recordedBy = {
      id: data.recordedBy.id,
      fullName: data.recordedBy.fullName,
    };
    /** @type {{id: string, productName: string, order: {id: string, orderNumber: string}|null}|null} */
    this.orderItem = data.orderItem
      ? {
          id: data.orderItem.id,
          productName: data.orderItem.productNameSnapshot,
          order: data.orderItem.order
            ? {
                id: data.orderItem.order.id,
                orderNumber: data.orderItem.order.orderNumber,
              }
            : null,
        }
      : null;
  }
}

export {
  StockProductDto,
  StockOrderItemDto,
  StockRecordedByDto,
  StockMovementDetailDto,
  StockMovementListDto,
};