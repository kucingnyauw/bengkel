/**
 * Data Transfer Object untuk response Product
 * @module dtos/productDto
 */

/**
 * DTO untuk data gambar produk (detail)
 * @class ProductImageDto
 */
class ProductImageDto {
  constructor(data) {
    this.id = data.id;
    this.fileName = data.fileName;
    this.url = data.url || null;
    this.mimeType = data.mimeType;
    this.size = data.size;
  }
}

/**
 * DTO untuk ringkasan gambar produk dalam list
 * @class ProductImageSummaryDto
 */
class ProductImageSummaryDto {
  constructor(data) {
    this.id = data.id;
    this.url = data.url || null;
  }
}

/**
 * DTO untuk riwayat harga produk
 * @class ProductPriceHistoryDto
 */
class ProductPriceHistoryDto {
  constructor(data) {
    this.id = data.id;
    this.price = data.price;
    this.cost = data.cost;
    this.effectiveFrom = data.effectiveFrom;
  }
}

/**
 * DTO untuk response detail produk (get by ID / SKU / setelah create / update)
 * @class ProductDetailDto
 */
class ProductDetailDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.type = data.type;
    this.description = data.description;
    this.price = data.price;
    this.cost = data.cost;
    this.stock = data.stock;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.image = data.image
      ? new ProductImageDto(data.image)
      : null;
    this.priceHistory = data.priceHistory?.map(
      (h) => new ProductPriceHistoryDto(h)
    ) ?? [];
  }
}

/**
 * DTO untuk produk dalam list (get products dengan paginasi)
 * @class ProductListDto
 */
class ProductListDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.type = data.type;
    this.price = data.price;
    this.cost = data.cost;
    this.stock = data.stock;
    this.description = data.description;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.image = data.image
      ? new ProductImageSummaryDto(data.image)
      : null;
  }
}

/**
 * DTO untuk response setelah update status produk
 * @class ProductStatusDto
 */
class ProductStatusDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.isActive = data.isActive;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO untuk response setelah update stok produk (adjustment)
 * @class ProductStockDto
 */
class ProductStockDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.stock = data.stock;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO untuk produk stok rendah
 * @class LowStockProductDto
 */
class LowStockProductDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.stock = data.stock;
    this.price = data.price;
    this.cost = data.cost;
  }
}

/**
 * DTO untuk daftar produk service
 * @class ServiceProductDto
 */
class ServiceProductDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.cost = data.cost;
  }
}

/**
 * DTO untuk daftar produk sparepart
 * @class SparepartProductDto
 */
class SparepartProductDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sku = data.sku;
    this.price = data.price;
    this.cost = data.cost;
    this.stock = data.stock;
    this.image = data.image
      ? { url: data.image.url || null }
      : null;
  }
}

/**
 * DTO untuk ringkasan produk (digunakan di dashboard/report)
 * @class ProductSummaryDto
 */
class ProductSummaryDto {
  constructor(data) {
    this.totalProducts = data.totalProducts;
    this.activeProducts = data.activeProducts;
    this.inactiveProducts = data.inactiveProducts;
    this.lowStockCount = data.lowStockCount;
    this.totalStockValue = data.totalStockValue;
    this.totalStockQuantity = data.totalStockQuantity;
    this.byType = data.byType?.map((item) => ({
      type: item.type,
      count: item.count,
      totalStock: item.totalStock,
    })) ?? [];
  }
}

export {
  ProductImageDto,
  ProductImageSummaryDto,
  ProductPriceHistoryDto,
  ProductDetailDto,
  ProductListDto,
  ProductStatusDto,
  ProductStockDto,
  LowStockProductDto,
  ServiceProductDto,
  SparepartProductDto,
  ProductSummaryDto,
};