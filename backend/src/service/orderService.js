import OrderRepository from "#repository/orderRepository.js";
import ProductRepository from "#repository/productRepository.js";
import StockRepository from "#repository/stockRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import OrderHistoryRepository from "#repository/orderHistoryRepository.js";
import CacheManager from "#shared/utils/cache.js";
import CodeGenerator from "#shared/utils/code.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import axios from "axios";

import { isProd } from "#config/env.js";

class OrderService {
  constructor() {
    this.orderRepo = new OrderRepository();
    this.productRepo = new ProductRepository();
    this.stockRepo = new StockRepository();
    this.shiftRepo = new ShiftRepository();
    this.settingRepo = new SettingRepository();
    this.orderHistoryRepo = new OrderHistoryRepository();
    this.cache = new CacheManager("order");
  }

  /**
   * Cek apakah items memiliki tipe SERVICE
   * @param {Array} items
   * @returns {boolean}
   * @private
   */
  #hasServiceItem(items) {
    return (
      items?.some((item) => {
        const type = item.productType || item.product?.type;
        return type === "SERVICE";
      }) ?? false
    );
  }

  /**
   * Mendapatkan nilai setting dari database
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   * @private
   */
  async #getSetting(key, defaultValue) {
    const setting = await this.settingRepo.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Mendapatkan tarif pajak dari settings
   * @returns {Promise<number>}
   * @private
   */
  async #getTaxRate() {
    return Number(await this.#getSetting("tax_rate", 11));
  }

  /**
   * Mendapatkan timestamp berdasarkan status
   * @param {string} status
   * @returns {Object}
   * @private
   */
  #getStatusTimestamps(status) {
    const timestampMap = {
      IN_PROGRESS: "startedAt",
      COMPLETED: "completedAt",
      CLOSED: "closedAt",
    };
    return timestampMap[status] ? { [timestampMap[status]]: new Date() } : {};
  }

  /**
   * Invalidasi cache terkait order
   * @param {string} orderNumber
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateOrderCache(orderNumber) {
    await this.cache.invalidate(`history:${orderNumber}`);
  }

  /**
   * Membatalkan transaksi di Midtrans
   * @param {string} orderNumber
   * @returns {Promise<Object|null>}
   * @throws {ApiError}
   * @private
   */
  async #cancelMidtransTransaction(orderNumber) {
    const baseUrl = isProd
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
    const apiUrl = `${baseUrl}/${orderNumber}/cancel`;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    try {
      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${authString}`,
          },
        }
      );
      logger.info("Midtrans transaction cancelled", {
        orderNumber,
        response: response.data,
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to cancel Midtrans transaction", {
        orderNumber,
        error: error.response?.data || error.message,
      });
      if (error.response?.status === 404) return null;
      throw ApiError.internal({
        message: "Gagal membatalkan transaksi di Midtrans",
      });
    }
  }

  /**
   * Validasi apakah pesanan dapat diedit
   * @param {Object} order
   * @param {string} action
   * @throws {ApiError}
   * @private
   */
  #validateOrderEditable(order, action = "diubah") {
    if (!order)
      throw ApiError.notFound({
        message: `Gagal ${action}. Pesanan tidak ditemukan.`,
      });
    if (order.status === "COMPLETED" || order.status === "CLOSED") {
      throw ApiError.conflict({
        message: `Gagal ${action}. Pesanan '${order.orderNumber}' sudah selesai atau ditutup.`,
      });
    }
    if (order.status === "CANCELLED") {
      throw ApiError.conflict({
        message: `Gagal ${action}. Pesanan '${order.orderNumber}' sudah dibatalkan.`,
      });
    }
  }

  /**
   * Validasi produk dan stok
   * @param {Object} product
   * @param {number} quantity
   * @throws {ApiError}
   * @private
   */
  #validateProduct(product, quantity) {
    if (!product)
      throw ApiError.notFound({
        message: "Gagal. Produk dengan ID tersebut tidak ditemukan.",
      });
    if (!product.isActive)
      throw ApiError.badRequest({
        message: `Gagal. Produk '${product.name}' tidak aktif.`,
      });
    if (product.type === "SPAREPART" && product.stock < quantity) {
      throw ApiError.badRequest({
        message: `Gagal. Stok produk '${product.name}' tidak mencukupi. Tersedia: ${product.stock}, Diminta: ${quantity}.`,
      });
    }
  }

  /**
   * Menghitung subtotal dan memproses item pesanan
   * @param {Array} items
   * @returns {Promise<{subtotal: number, processedItems: Array}>}
   * @private
   */
  async #calculateItems(items) {
    const productIds = items.map((item) => item.productId);
    const products = await Promise.all(
      productIds.map((id) => this.productRepo.findById(id))
    );

    const productMap = new Map(products.map((p) => [p?.id, p]));
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      this.#validateProduct(product, item.quantity);
      const unitPrice = product.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      processedItems.push({
        productId: item.productId,
        productNameSnapshot: product.name,
        productType: product.type,
        quantity: item.quantity,
        unitPrice,
        unitCostSnapshot: product.cost,
        subtotal: itemSubtotal,
      });
    }
    return { subtotal, processedItems };
  }

  /**
   * Mendapatkan shift aktif kasir
   * @param {string} cashierId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   * @private
   */
  async #getActiveShift(cashierId) {
    const hasActiveShift = await this.shiftRepo.hasActiveShift(cashierId);
    if (!hasActiveShift)
      throw ApiError.badRequest({
        message: "Gagal membuat pesanan. Kasir tidak memiliki shift aktif.",
      });
    return this.shiftRepo.findActiveByCashier(cashierId);
  }

  /**
   * Generate nomor pesanan unik
   * @returns {Promise<string>}
   * @private
   */
  async #generateUniqueOrderNumber() {
    let orderNumber;
    let exists = true;
    while (exists) {
      orderNumber = await CodeGenerator.orderNumber();
      exists = await this.orderRepo.isOrderNumberExists(orderNumber);
    }
    return orderNumber;
  }

  /**
   * Membuat pesanan dalam transaksi database
   * @param {Object} tx
   * @param {Object} data
   * @returns {Promise<Object>}
   * @private
   */
  async #createOrderInTx(tx, data) {
    return tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        cashierId: data.cashierId,
        shiftId: data.shiftId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        items: {
          create: data.processedItems.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCostSnapshot: item.unitCostSnapshot,
            subtotal: item.subtotal,
          })),
        },
        ...(data.hasService && {
          histories: {
            create: {
              status: "DRAFT",
              changedById: data.cashierId,
              note: "Pesanan baru dibuat sebagai draft",
            },
          },
        }),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            productNameSnapshot: true,
            quantity: true,
            unitPrice: true,
            unitCostSnapshot: true,
            subtotal: true,
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });
  }

  /**
   * Mengurangi stok produk sparepart secara batch
   * @param {Array} items
   * @param {Object} tx
   * @returns {Promise<void>}
   * @private
   */
  async #decrementStock(items, tx) {
    const updatePromises = items.map((item) =>
      tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    );
    await Promise.all(updatePromises);
  }

  /**
   * Menambah penjualan shift
   * @param {Object} tx
   * @param {string} shiftId
   * @param {number} amount
   * @returns {Promise<void>}
   * @private
   */
  async #incrementShiftSales(tx, shiftId, amount) {
    await tx.shift.update({
      where: { id: shiftId },
      data: { cashSales: { increment: amount } },
    });
  }

  /**
   * Mencatat stok keluar untuk item sparepart secara batch
   * @param {Array} sparepartItems
   * @param {Object} order
   * @param {string} cashierId
   * @returns {Promise<void>}
   * @private
   */
  async #processSparePartItems(sparepartItems, order, cashierId) {
    const stockOutPromises = sparepartItems.map((item) => {
      const orderItem = order.items.find(
        (oi) => oi.productId === item.productId
      );
      if (orderItem) {
        return this.stockRepo.recordStockOut(
          item.productId,
          item.quantity,
          cashierId,
          orderItem.id,
          `Stok keluar otomatis dari pesanan ${order.orderNumber}`,
          "SALE"
        );
      }
    });
    await Promise.all(stockOutPromises.filter(Boolean));
  }

  /**
   * Mendapatkan item sparepart dari pesanan
   * @param {string} orderId
   * @returns {Promise<Array>}
   * @private
   */
  async #getSparePartItems(orderId) {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: { select: { type: true } } },
    });
    return items.filter((item) => item.product?.type === "SPAREPART");
  }

  /**
   * Mengembalikan stok sparepart yang dibatalkan secara batch
   * @param {Array} sparepartItems
   * @param {Object} tx
   * @returns {Promise<void>}
   * @private
   */
  async #restoreSparePartStock(sparepartItems, tx) {
    const restorePromises = sparepartItems.map((item) =>
      tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    );
    await Promise.all(restorePromises);
  }

  /**
   * Menambahkan signed URL ke gambar produk dalam satu pesanan
   * @param {Object} order
   * @returns {Promise<Object>}
   * @private
   */
  async #addSignedUrlsToOrder(order) {
    if (!order) return order;
    const urlPromises = [];
    for (const item of order.items || []) {
      if (item.product?.image?.path) {
        urlPromises.push(
          Storage.getSignedUrl(item.product.image.path).then((url) => {
            item.product.image.url = url;
          })
        );
      }
    }
    await Promise.all(urlPromises);
    return order;
  }

  /**
   * Menambahkan signed URL ke multiple pesanan
   * @param {Array} orders
   * @returns {Promise<Array>}
   * @private
   */
  async #addSignedUrlsToOrders(orders) {
    await Promise.all(orders.map((order) => this.#addSignedUrlsToOrder(order)));
    return orders;
  }

  /**
   * Menghitung estimasi total pesanan
   * @param {Array} items
   * @returns {Promise<Object>}
   */
  async calculateTotal(items) {
    const productIds = items.map((item) => item.productId);
    const products = await Promise.all(
      productIds.map((id) => this.productRepo.findById(id))
    );
    const productMap = new Map(products.map((p) => [p?.id, p]));

    let subtotal = 0;
    const calculatedItems = [];
    const taxRate = await this.#getTaxRate();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product)
        throw ApiError.notFound({ message: "Produk tidak ditemukan." });
      if (!product.isActive)
        throw ApiError.badRequest({ message: "Produk tidak aktif." });
      const unitPrice = product.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      calculatedItems.push({
        productId: item.productId,
        productName: product.name,
        productType: product.type,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        stock: product.type === "SPAREPART" ? product.stock : null,
        needMechanic: product.type === "SERVICE",
      });
    }

    const taxAmount = Math.round(subtotal * (taxRate / 100));
    return {
      subtotal,
      tax: taxAmount,
      total: subtotal + taxAmount,
      items: calculatedItems,
    };
  }

  /**
   * Membuat pesanan baru (DRAFT)
   * @param {string} cashierId
   * @param {Object} payload
   * @param {string} [payload.customerId]
   * @param {string} [payload.vehicleId]
   * @param {Array} payload.items
   * @returns {Promise<Object>}
   */
  async createOrder(cashierId, payload) {
    const { customerId, vehicleId, items } = payload;
    const activeShift = await this.#getActiveShift(cashierId);
    const { subtotal, processedItems } = await this.#calculateItems(items);

    const hasService = this.#hasServiceItem(processedItems);

    if (hasService && !customerId) {
      throw ApiError.badRequest({
        message: "Pesanan service memerlukan customer.",
      });
    }
    if (hasService && !vehicleId) {
      throw ApiError.badRequest({
        message: "Pesanan service memerlukan kendaraan.",
      });
    }

    const orderNumber = await this.#generateUniqueOrderNumber();
    const taxRate = await this.#getTaxRate();
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;

    const sparepartItems = processedItems.filter(
      (i) => i.productType === "SPAREPART"
    );
    const hasSparepart = sparepartItems.length > 0;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await this.#createOrderInTx(tx, {
        orderNumber,
        cashierId,
        shiftId: activeShift.id,
        customerId: hasService ? customerId : customerId || null,
        vehicleId: hasService ? vehicleId : vehicleId || null,
        subtotal,
        tax: taxAmount,
        total,
        processedItems,
        hasService,
      });

      if (hasSparepart) {
        await this.#decrementStock(sparepartItems, tx);
      }
      await this.#incrementShiftSales(tx, activeShift.id, total);
      return newOrder;
    });

    if (hasSparepart) {
      await this.#processSparePartItems(sparepartItems, order, cashierId);
    }

    logger.info("Pesanan berhasil dibuat", {
      orderId: order.id,
      orderNumber,
      total,
      itemCount: items.length,
      type: hasService ? "SERVICE" : "SPAREPART",
      cashierId,
    });

    return this.#addSignedUrlsToOrder(await this.orderRepo.findById(order.id));
  }

  /**
   * Mendapatkan pesanan berdasarkan ID atau nomor pesanan
   * @param {string} identifier
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async getOrder(identifier) {
    const order =
      (await this.orderRepo.findByOrderNumber(identifier)) ||
      (await this.orderRepo.findById(identifier));
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    return this.#addSignedUrlsToOrder(order);
  }

  /**
   * Mendapatkan daftar pesanan dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getOrders(query = {}) {
    const result = await this.orderRepo.findMany(query);
    result.data = await this.#addSignedUrlsToOrders(result.data);
    logger.info("Mengambil daftar pesanan", { total: result.metadata.total });
    return result;
  }

  /**
   * Mendapatkan pesanan aktif untuk kasir tertentu
   * @param {string} cashierId
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getActiveOrders(cashierId, query = {}) {
    const result = await this.orderRepo.findActiveByCashier(cashierId, query);
    result.data = await this.#addSignedUrlsToOrders(result.data);
    return result;
  }

  /**
   * Memperbarui status pesanan
   * @param {string} orderId
   * @param {string} status
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async updateOrderStatus(orderId, status, userId) {
    const order = await this.orderRepo.findById(orderId);
    this.#validateOrderEditable(order, "memperbarui status");

    const changedById = userId || order.cashierId;
    const hasService = this.#hasServiceItem(order.items);

    if (status === "CANCELLED") {
      const result = await this.#handleCancellation(
        order,
        changedById,
        hasService
      );
      await this.#invalidateOrderCache(order.orderNumber);
      return result;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date(),
          ...this.#getStatusTimestamps(status),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          startedAt: true,
          completedAt: true,
          closedAt: true,
          updatedAt: true,
        },
      });

      if (hasService) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status,
            changedById,
            note: `Status diubah dari "${order.status}" ke "${status}"`,
          },
        });
      }

      return result;
    });

    await this.#invalidateOrderCache(order.orderNumber);

    logger.info("Status pesanan diperbarui", { orderId, newStatus: status });
    return updated;
  }

  /**
   * Menangani pembatalan pesanan
   * @param {Object} order
   * @param {string} changedById
   * @param {boolean} hasService
   * @returns {Promise<Object>}
   * @private
   */
  async #handleCancellation(order, changedById, hasService) {
    const sparepartItems = await this.#getSparePartItems(order.id);
    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id, method: "QRIS", status: "PENDING" },
    });
    if (payment) await this.#cancelMidtransTransaction(order.orderNumber);

    await prisma.$transaction(async (tx) => {
      if (sparepartItems.length > 0) {
        await this.#restoreSparePartStock(sparepartItems, tx);
        const stockMovementPromises = sparepartItems.map((item) =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "IN",
              sourceType: "RETURN",
              quantity: item.quantity,
              orderItemId: item.id,
              note: `Stok dikembalikan dari pembatalan pesanan ${order.orderNumber}.`,
              recordedById: order.cashierId,
            },
          })
        );
        await Promise.all(stockMovementPromises);
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      if (hasService) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "CANCELLED",
            changedById,
            note: "Pesanan dibatalkan. Stok sparepart dikembalikan, shift disesuaikan.",
          },
        });
      }

      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: { cashSales: { decrement: order.total } },
        });
      }
      await tx.payment.deleteMany({ where: { orderId: order.id } });
    });

    logger.warn("Pesanan dibatalkan via update status", {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    return this.orderRepo.findByOrderNumber(order.orderNumber);
  }

  /**
   * Membatalkan pesanan
   * @param {string} orderId
   * @param {Object} payload
   * @param {string} payload.reason
   * @param {string} userId
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async cancelOrder(orderId, payload, userId) {
    const { reason } = payload;
    const order = await this.orderRepo.findById(orderId);
    this.#validateOrderEditable(order, "dibatalkan");

    const changedById = userId || order.cashierId;
    const hasService = this.#hasServiceItem(order.items);
    const sparepartItems = await this.#getSparePartItems(orderId);
    const payment = await prisma.payment.findFirst({
      where: { orderId, method: "QRIS", status: "PENDING" },
    });
    if (payment) await this.#cancelMidtransTransaction(order.orderNumber);

    await prisma.$transaction(async (tx) => {
      if (sparepartItems.length > 0) {
        await this.#restoreSparePartStock(sparepartItems, tx);
        const stockMovementPromises = sparepartItems.map((item) =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "IN",
              sourceType: "RETURN",
              quantity: item.quantity,
              orderItemId: item.id,
              note: `Stok dikembalikan dari pembatalan pesanan ${order.orderNumber}. Alasan: ${reason}`,
              recordedById: order.cashierId,
            },
          })
        );
        await Promise.all(stockMovementPromises);
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      if (hasService) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: "CANCELLED",
            changedById,
            note: `Pesanan dibatalkan. Alasan: ${reason}`,
          },
        });
      }

      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: { cashSales: { decrement: order.total } },
        });
      }
      await tx.payment.deleteMany({ where: { orderId } });
    });

    await this.#invalidateOrderCache(order.orderNumber);

    logger.warn("Pesanan dibatalkan", {
      orderId,
      orderNumber: order.orderNumber,
      reason,
    });
  }

  /**
   * Menutup pesanan (COMPLETED → CLOSED)
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async closeOrder(orderId, userId) {
    const order = await this.orderRepo.findById(orderId);

    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (order.status === "CLOSED")
      throw ApiError.conflict({ message: "Pesanan sudah ditutup." });
    if (order.status === "CANCELLED")
      throw ApiError.conflict({ message: "Pesanan sudah dibatalkan." });
    if (order.status !== "COMPLETED") {
      throw ApiError.conflict({
        message: `Hanya pesanan dengan status COMPLETED yang dapat ditutup. Status saat ini: ${order.status}`,
      });
    }

    const hasService = this.#hasServiceItem(order.items);
    const changedById = userId || order.cashierId;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: "CLOSED", closedAt: new Date(), updatedAt: new Date() },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          closedAt: true,
          updatedAt: true,
        },
      });

      if (hasService) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: "CLOSED",
            changedById,
            note: "Pesanan ditutup.",
          },
        });
      }

      return result;
    });

    await this.#invalidateOrderCache(order.orderNumber);

    logger.info("Pesanan ditutup", { orderId, orderNumber: order.orderNumber });
    return updated;
  }

  /**
   * Melacak riwayat lengkap pesanan dengan caching
   * @param {string} orderNumber
   * @returns {Promise<Object>}
   * @throws {ApiError}
   */
  async trackOrderHistory(orderNumber) {
    const cacheKey = `history:${orderNumber}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      logger.info("Cache hit untuk order history", { orderNumber });
      return cached;
    }

    const order = await this.orderHistoryRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw ApiError.notFound({
        message: `Pesanan dengan nomor '${orderNumber}' tidak ditemukan.`,
      });
    }

    await this.#addSignedUrlsToOrder(order);

    const result = {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      total: order.total,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      closedAt: order.closedAt,
      cashier: order.cashier,
      customer: order.customer,
      vehicle: order.vehicle,
      payment: order.payment,
      items: order.items,
      timeline: order.histories.map((h) => ({
        status: h.status,
        note: h.note || null,
        changedAt: h.createdAt,
        changedBy: h.changedBy?.fullName || "System",
      })),
    };

    await this.cache.set(cacheKey, result, 300);

    logger.info("Melacak riwayat pesanan (cached)", {
      orderNumber,
      status: order.status,
      historyCount: order.histories?.length || 0,
    });

    return result;
  }

  /**
   * Soft delete pesanan
   * @param {string} orderId
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async softDeleteOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    await this.orderRepo.softDelete(orderId);
    await this.#invalidateOrderCache(order.orderNumber);
    logger.info("Pesanan di-soft delete", {
      orderId,
      orderNumber: order.orderNumber,
    });
  }

  /**
   * Restore pesanan
   * @param {string} orderId
   * @returns {Promise<void>}
   * @throws {ApiError}
   */
  async restoreOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    await this.orderRepo.restore(orderId);
    await this.#invalidateOrderCache(order.orderNumber);
    logger.info("Pesanan direstore", {
      orderId,
      orderNumber: order.orderNumber,
    });
  }
}

export default OrderService;
