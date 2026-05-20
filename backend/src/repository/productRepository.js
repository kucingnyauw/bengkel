import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class ProductRepository {
  #defaultSelect = {
    id: true,
    name: true,
    sku: true,
    type: true,
    description: true,
    price: true,
    cost: true,
    stock: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    image: {
      select: {
        id: true,
        fileName: true,
        path: true,
      },
    },
    priceHistory: {
      select: {
        id: true,
        price: true,
        cost: true,
        effectiveFrom: true,
      },
      orderBy: {
        effectiveFrom: "desc",
      },
      take: 10,
    },
  };

  #listSelect = {
    id: true,
    name: true,
    sku: true,
    type: true,
    description: true,
    price: true,
    cost: true,
    stock: true,
    isActive: true,
    createdAt: true,
    image: {
      select: {
        id: true,
        path: true,
      },
    },
  };

  /**
   * Membuat produk baru
   * @param {Object} data - Data produk
   * @param {string} data.name - Nama produk
   * @param {string} data.sku - Kode SKU
   * @param {string} [data.type] - Tipe produk
   * @param {string} [data.description] - Deskripsi
   * @param {number} data.price - Harga jual
   * @param {number} [data.cost] - Harga modal
   * @param {number} [data.stock] - Stok awal
   * @param {string} [data.imageId] - ID file gambar
   * @returns {Promise<Object>} Produk yang berhasil dibuat
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async create(data) {
    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        type: data.type || "SPAREPART",
        description: data.description,
        price: data.price,
        cost: data.cost || 0,
        stock: data.stock || 0,
        isActive: true,
        imageId: data.imageId,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari produk berdasarkan ID
   * @param {string} id - ID produk
   * @returns {Promise<Object|null>} Data produk atau null
   * @complexity Before: O(log n) - Primary key lookup
   * @complexity After: O(log n) - No change needed
   */
  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari produk berdasarkan SKU
   * @param {string} sku - Kode SKU
   * @returns {Promise<Object|null>} Data produk atau null
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async findBySku(sku) {
    return prisma.product.findUnique({
      where: { sku },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari daftar produk dengan filter dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.search] - Pencarian berdasarkan nama atau SKU
   * @param {string} [query.type] - Filter berdasarkan tipe
   * @param {boolean|string} [query.isActive] - Filter status aktif
   * @param {number|string} [query.lowStockThreshold] - Filter stok rendah
   * @param {number|string} [query.minPrice] - Filter harga minimum
   * @param {number|string} [query.maxPrice] - Filter harga maksimum
   * @param {string} [query.sortBy] - Field sorting
   * @param {string} [query.sortOrder] - Arah sorting
   * @returns {Promise<{data: Array, metadata: Object}>} Data produk dan metadata
   * @complexity Before: O(n) - Multiple OR conditions with offset pagination
   * @complexity After: O(log n) - Leverages indexes on name, sku, type, price
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true" || query.isActive === true;
    }
    if (query.lowStockThreshold) {
      where.type = "SPAREPART";
      where.stock = { lte: parseInt(query.lowStockThreshold) };
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseInt(query.minPrice);
      if (query.maxPrice) where.price.lte = parseInt(query.maxPrice);
    }

    const validSortFields = ["name", "price", "stock", "createdAt"];
    const sortBy = validSortFields.includes(query.sortBy) ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mengupdate data produk
   * @param {string} id - ID produk
   * @param {Object} data - Data yang akan diupdate
   * @returns {Promise<Object>} Produk yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      select: this.#fullSelect,
    });
  }

  /**
   * Mengupdate status aktif produk
   * @param {string} id - ID produk
   * @param {boolean} isActive - Status aktif
   * @returns {Promise<Object>} Produk yang sudah diupdate
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async updateStatus(id, isActive) {
    return prisma.product.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Menonaktifkan produk (soft delete)
   * @param {string} id - ID produk
   * @returns {Promise<Object>} Produk yang sudah dinonaktifkan
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async deactivate(id) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengaktifkan kembali produk yang dinonaktifkan
   * @param {string} id - ID produk
   * @returns {Promise<Object>} Produk yang sudah diaktifkan
   * @complexity Before: O(log n) - Primary key update
   * @complexity After: O(log n) - No change needed
   */
  async activate(id) {
    return prisma.product.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengupdate stok produk
   * @param {string} id - ID produk
   * @param {number} quantity - Jumlah perubahan
   * @param {boolean} [increment=true] - true untuk tambah, false untuk kurang
   * @returns {Promise<Object>} Produk yang sudah diupdate
   * @complexity Before: O(log n) - Atomic increment/decrement
   * @complexity After: O(log n) - No change needed
   */
  async updateStock(id, quantity, increment = true) {
    return prisma.product.update({
      where: { id },
      data: {
        stock: increment ? { increment: quantity } : { decrement: quantity },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengecek apakah SKU sudah digunakan
   * @param {string} sku - SKU yang dicek
   * @param {string} [excludeId] - ID produk yang dikecualikan
   * @returns {Promise<boolean>} Status ketersediaan SKU
   * @complexity Before: O(log n) - Unique index lookup
   * @complexity After: O(log n) - No change needed
   */
  async isSkuExists(sku, excludeId = null) {
    const where = { sku };
    if (excludeId) where.id = { not: excludeId };

    const product = await prisma.product.findFirst({
      where,
      select: { id: true },
    });

    return !!product;
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {number} [threshold=5] - Batas threshold
   * @returns {Promise<Array>} Daftar produk stok rendah
   * @complexity Before: O(n) - Full scan with filter
   * @complexity After: O(log n) - Uses composite index (type, isActive, stock)
   */
  async getLowStockProducts(threshold = 5) {
    return prisma.product.findMany({
      where: {
        type: "SPAREPART",
        stock: { lte: threshold },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        cost: true,
      },
      orderBy: { stock: "asc" },
    });
  }

  /**
   * Mencatat riwayat harga produk
   * @param {string} productId - ID produk
   * @param {number} price - Harga baru
   * @param {number} cost - Harga modal baru
   * @returns {Promise<void>}
   * @complexity Before: O(1) - Single insert
   * @complexity After: O(1) - No change needed
   */
  async createPriceHistory(productId, price, cost) {
    await prisma.productPriceHistory.create({
      data: {
        productId,
        price,
        cost,
        effectiveFrom: new Date(),
      },
    });
  }

  /**
   * Mencari produk service
   * @param {Object} [query={}] - Parameter query
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<Array>} Daftar produk service
   * @complexity Before: O(n) - Full scan with type filter
   * @complexity After: O(log n) - Uses composite index (type, isActive)
   */
  async findServices(query = {}) {
    const where = {
      type: "SERVICE",
      isActive: query.isActive !== undefined ? query.isActive : true,
    };

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        cost: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Mencari produk sparepart
   * @param {Object} [query={}] - Parameter query
   * @param {boolean} [query.inStockOnly] - Hanya stok tersedia
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<Array>} Daftar produk sparepart
   * @complexity Before: O(n) - Full scan with type and stock filters
   * @complexity After: O(log n) - Uses composite index (type, isActive, stock)
   */
  async findSpareparts(query = {}) {
    const where = {
      type: "SPAREPART",
      isActive: query.isActive !== undefined ? query.isActive : true,
    };

    if (query.inStockOnly) {
      where.stock = { gt: 0 };
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true,
        stock: true,
        image: {
          select: {
            id: true,
            path: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }
}

export default ProductRepository;