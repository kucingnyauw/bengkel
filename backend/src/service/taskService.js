import TaskRepository from "#repository/taskRepository.js";
import UserRepository from "#repository/userRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis penugasan mekanik.
 *
 * Alur SERVICE:
 *   DRAFT → (payment) → QUEUED → (assign mechanic) → (start order) → IN_PROGRESS → (complete order) → COMPLETED → (close) → CLOSED
 *
 * Mekanik di-assign setelah pembayaran (QUEUED).
 * Start order mengubah status order ke IN_PROGRESS dan memulai semua task sekaligus.
 * Complete order menyelesaikan semua task dan mengubah status ke COMPLETED.
 *
 * @class TaskService
 */
class TaskService {
  constructor() {
    this.taskRepo = new TaskRepository();
    this.userRepo = new UserRepository();
    this.orderRepo = new OrderRepository();
    this.notifRepo = new NotificationRepository();
    this.settingRepo = new SettingRepository();
  }

  /**
   * Mendapatkan nilai setting dari database
   * @param {string} key - Key setting
   * @param {*} defaultValue - Nilai default
   * @returns {Promise<*>}
   * @private
   */
  async #getSetting(key, defaultValue) {
    const setting = await this.settingRepo.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Mendapatkan order item service yang belum di-assign dari order
   * @param {string} orderId - ID order
   * @returns {Promise<Array>} Array order item service unassigned
   * @throws {ApiError} 404 | 400
   * @private
   */
  async #getUnassignedServiceItems(orderId) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    const serviceItems = order.items?.filter(
      (item) => item.product?.type === "SERVICE"
    );

    if (!serviceItems || serviceItems.length === 0) {
      throw ApiError.badRequest({
        message: "Pesanan ini tidak memiliki item service.",
      });
    }

    const unassignedItems = serviceItems.filter(
      (item) => !item.assignments || item.assignments.length === 0
    );

    if (unassignedItems.length === 0) {
      throw ApiError.badRequest({
        message: "Semua item service dalam pesanan ini sudah memiliki mekanik.",
      });
    }

    return unassignedItems;
  }

  /**
   * Validasi kapasitas mekanik sebelum assign
   * @param {string} mechanicId - ID mekanik
   * @throws {ApiError} 400
   * @private
   */
  async #validateMechanicCapacity(mechanicId) {
    const maxTasks = Number(await this.#getSetting("mechanic_max_tasks", 5));
    const activeTaskCount = await this.taskRepo.getActiveTaskCount(mechanicId);

    if (activeTaskCount >= maxTasks) {
      throw ApiError.badRequest({
        message: `Gagal assign mekanik. Mekanik sudah mencapai batas maksimal ${maxTasks} tugas aktif.`,
      });
    }
  }

  /**
   * Cek apakah mekanik tersedia
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<boolean>}
   * @private
   */
  async #isMechanicAvailable(mechanicId) {
    const activeTasks = await this.taskRepo.getActiveTaskCount(mechanicId);
    const maxTasks = Number(await this.#getSetting("mechanic_max_tasks", 5));
    return activeTasks < maxTasks;
  }

  /**
   * Cek apakah semua task di order sudah selesai
   * @param {string} orderId - ID order
   * @returns {Promise<boolean>}
   * @private
   */
  async #areAllTasksCompleted(orderId) {
    const tasks = await prisma.mechanicAssignment.findMany({
      where: { orderItem: { orderId } },
      select: { endAt: true },
    });

    if (tasks.length === 0) return true;
    return tasks.every((task) => task.endAt !== null);
  }

  /**
   * Mendapatkan semua assignment aktif untuk order dan mekanik tertentu
   * @param {string} orderId - ID order
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Array assignment
   * @private
   */
  async #getActiveAssignments(orderId, mechanicId) {
    return prisma.mechanicAssignment.findMany({
      where: {
        mechanicId,
        endAt: null,
        orderItem: { orderId },
      },
      select: {
        id: true,
        startAt: true,
        orderItem: {
          select: {
            id: true,
            productNameSnapshot: true,
            product: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * Mengirim notifikasi
   * @param {string} userId - ID user penerima
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi
   * @param {string} [type="INFO"] - Tipe notifikasi
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    await this.notifRepo.create({ title, message, type, userId });
  }

  /**
   * Menghitung durasi kerja dalam format readable
   * @param {Date} startAt - Waktu mulai
   * @param {Date} endAt - Waktu selesai
   * @returns {string} Durasi terformat
   * @private
   */
  #formatDuration(startAt, endAt) {
    const diff = new Date(endAt) - new Date(startAt);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`;
  }

  /**
   * Generate signed URL untuk gambar produk
   * @param {Object} product - Data produk
   * @returns {Promise<Object>} Produk dengan signed URL
   * @private
   */
  async #addSignedUrlToProduct(product) {
    if (!product) return product;
    if (product.image?.path) {
      product.image.url = await Storage.getSignedUrl(product.image.path);
    }
    return product;
  }

  // ============================================================
  // Public Methods
  // ============================================================

  /**
   * Menugaskan mekanik ke semua item service unassigned dalam order.
   * Hanya bisa dilakukan saat status QUEUED.
   *
   * @param {string} orderId - ID order
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Data assignments
   * @throws {ApiError} 400 | 404
   */
  async assignMechanicToOrder(orderId, mechanicId) {
    const mechanic = await this.userRepo.findById(mechanicId);
    if (!mechanic || mechanic.role !== "MECHANIC") {
      throw ApiError.badRequest({
        message: "Gagal assign mekanik. User yang dipilih bukan mekanik.",
      });
    }

    const isAvailable = await this.#isMechanicAvailable(mechanicId);
    if (!isAvailable) {
      throw ApiError.badRequest({
        message: "Gagal assign mekanik. Mekanik sedang tidak tersedia.",
      });
    }

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    if (order.status !== "QUEUED") {
      throw ApiError.badRequest({
        message: `Gagal assign mekanik. Hanya pesanan dengan status QUEUED yang dapat di-assign. Status saat ini: ${order.status}`,
      });
    }

    await this.#validateMechanicCapacity(mechanicId);

    const unassignedItems = await this.#getUnassignedServiceItems(orderId);

    const assignments = [];
    const serviceNames = [];
    for (const item of unassignedItems) {
      const assignment = await this.taskRepo.assignMechanic(item.id, mechanicId);
      assignments.push(assignment);
      serviceNames.push(item.productNameSnapshot || item.product?.name);
    }

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "QUEUED",
        changedById: mechanicId,
        note: `Mekanik ${mechanic.fullName} ditugaskan ke ${assignments.length} item service: ${serviceNames.join(", ")}.`,
      },
    });

    await this.#sendNotification(
      mechanicId,
      "Tugas Baru Diterima",
      `Anda ditugaskan ke pesanan #${order.orderNumber}\n\n` +
      `${assignments.length} service menunggu:\n` +
      serviceNames.map((name) => `- ${name}`).join("\n") +
      `\n\nPelanggan: ${order.customer?.name || "-"}\n` +
      `Kendaraan: ${order.vehicle?.plateNumber || "-"}`
    );

    logger.info("Mekanik berhasil di-assign ke order", {
      orderId,
      mechanicId,
      taskCount: assignments.length,
    });

    return assignments;
  }

  /**
   * Melepas semua mekanik dari order.
   * Hanya bisa saat status QUEUED.
   *
   * @param {string} orderId - ID order
   * @param {string} [userId] - ID user yang melakukan unassign
   * @returns {Promise<void>}
   * @throws {ApiError} 400 | 404
   */
  async unassignMechanicFromOrder(orderId, userId) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    if (order.status === "COMPLETED" || order.status === "CLOSED" || order.status === "CANCELLED") {
      throw ApiError.badRequest({
        message: "Tidak dapat unassign dari pesanan yang sudah selesai, ditutup, atau dibatalkan.",
      });
    }

    if (order.status === "IN_PROGRESS") {
      throw ApiError.badRequest({
        message: "Tidak dapat unassign. Pesanan sedang dalam pengerjaan.",
      });
    }

    if (order.status === "DRAFT") {
      throw ApiError.badRequest({
        message: "Pesanan belum dibayar. Mekanik belum ditugaskan.",
      });
    }

    const serviceItems = order.items?.filter(
      (item) =>
        item.product?.type === "SERVICE" &&
        item.assignments &&
        item.assignments.length > 0
    );

    if (!serviceItems || serviceItems.length === 0) {
      throw ApiError.badRequest({
        message: "Pesanan ini tidak memiliki mekanik yang ditugaskan.",
      });
    }

    const mechanicIds = new Set();
    const mechanicNames = [];
    for (const item of serviceItems) {
      for (const assignment of item.assignments) {
        mechanicIds.add(assignment.mechanicId);
        if (assignment.mechanic?.fullName) {
          mechanicNames.push(assignment.mechanic.fullName);
        }
        await this.taskRepo.unassignMechanic(assignment.id);
      }
    }

    const changedById = userId || order.cashierId;
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        changedById,
        note: `Mekanik ${[...new Set(mechanicNames)].join(", ")} dilepas dari pesanan. Status tetap ${order.status}.`,
      },
    });

    for (const mId of mechanicIds) {
      await this.#sendNotification(
        mId,
        "Penugasan Dilepas",
        `Anda dilepas dari pesanan #${order.orderNumber}\n\n` +
        `Pelanggan: ${order.customer?.name || "-"}\n` +
        `Kendaraan: ${order.vehicle?.plateNumber || "-"}`,
        "WARNING"
      );
    }

    logger.info("Semua mekanik berhasil di-unassign dari order", { orderId });
  }

  /**
   * Mendapatkan task berdasarkan ID
   * @param {string} assignmentId - ID assignment
   * @returns {Promise<Object>}
   * @throws {ApiError} 404
   */
  async getTaskById(assignmentId) {
    const assignment = await this.taskRepo.findById(assignmentId);
    if (!assignment) throw ApiError.notFound({ message: "Task tidak ditemukan." });
    
    if (assignment.orderItem?.product) {
      assignment.orderItem.product = await this.#addSignedUrlToProduct(assignment.orderItem.product);
    }
    
    return assignment;
  }

  /**
   * Mendapatkan semua task dalam satu order (grouped dengan detail)
   * @param {string} orderId - ID order
   * @returns {Promise<Object>} Data order dengan tasks
   * @throws {ApiError} 404
   */
  async getTasksByOrderId(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    const tasks = await this.taskRepo.findByOrderId(orderId);

    const serviceItems = order.items?.filter(
      (item) => item.product?.type === "SERVICE"
    ) || [];

    const services = await Promise.all(serviceItems.map(async (item) => {
      const itemAssignments = tasks.filter(
        (t) => t.orderItem?.id === item.id
      );

      const assignments = itemAssignments.map((a) => ({
        id: a.id,
        mechanic: a.mechanic ? {
          id: a.mechanic.id,
          fullName: a.mechanic.fullName,
        } : null,
        startAt: a.startAt,
        endAt: a.endAt,
        status: a.endAt ? "COMPLETED" : a.startAt ? "IN_PROGRESS" : "PENDING",
        statusLabel: a.endAt ? "Selesai" : a.startAt ? "Dikerjakan" : "Menunggu",
      }));

      let imageUrl = null;
      if (item.product?.image?.path) {
        imageUrl = await Storage.getSignedUrl(item.product.image.path);
      }

      return {
        orderItemId: item.id,
        serviceName: item.productNameSnapshot || item.product?.name,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          type: item.product.type,
          image: imageUrl,
        } : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        assignments,
      };
    }));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
      } : null,
      vehicle: order.vehicle ? {
        id: order.vehicle.id,
        plateNumber: order.vehicle.plateNumber,
        brand: order.vehicle.brand,
        model: order.vehicle.model,
      } : null,
      services,
    };
  }

  /**
   * Mendapatkan daftar task dengan filter dan paginasi (grouped by order)
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getTasks(query = {}) {
    return this.taskRepo.findMany(query);
  }

  /**
   * Mendapatkan task aktif berdasarkan mekanik (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>}
   */
  async getTasksByMechanic(mechanicId) {
    const assignments = await this.taskRepo.findByMechanicId(mechanicId);

    const groupedMap = new Map();

    for (const assignment of assignments) {
      const orderId = assignment.orderItem?.order?.id;
      if (!orderId) continue;

      if (!groupedMap.has(orderId)) {
        groupedMap.set(orderId, {
          orderId,
          orderNumber: assignment.orderItem.order.orderNumber,
          status: assignment.orderItem.order.status,
          createdAt: assignment.orderItem.order.createdAt,
          customer: assignment.orderItem.order.customer,
          vehicle: assignment.orderItem.order.vehicle,
          services: [],
        });
      }

      groupedMap.get(orderId).services.push({
        assignmentId: assignment.id,
        name: assignment.orderItem.productNameSnapshot || assignment.orderItem.product?.name,
        startAt: assignment.startAt,
        endAt: assignment.endAt,
      });
    }

    return Array.from(groupedMap.values());
  }

  /**
   * Mendapatkan task berdasarkan order item
   * @param {string} orderItemId - ID order item
   * @returns {Promise<Array>}
   */
  async getTasksByOrderItem(orderItemId) {
    return this.taskRepo.findByOrderItemId(orderItemId);
  }

  /**
   * Mendapatkan task pribadi mekanik yang sedang login (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getMyTasks(mechanicId, query = {}) {
    return this.taskRepo.findMyTasks(mechanicId, query);
  }

  /**
   * Mendapatkan task service yang belum ditugaskan ke mekanik manapun
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getUnassignedTasks(query = {}) {
    return this.taskRepo.findUnassignedServiceTasks(query);
  }

  /**
   * Memulai pengerjaan semua task dalam order oleh mekanik.
   * Status order QUEUED → IN_PROGRESS.
   *
   * @param {string} orderId - ID order
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Semua task yang sudah distart
   * @throws {ApiError} 404 | 409 | 400
   */
  async startOrder(orderId, mechanicId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    if (order.status !== "QUEUED") {
      throw ApiError.badRequest({
        message: `Hanya pesanan QUEUED yang dapat dimulai. Status saat ini: ${order.status}`,
      });
    }

    const assignments = await this.#getActiveAssignments(orderId, mechanicId);

    if (assignments.length === 0) {
      throw ApiError.badRequest({
        message: "Tidak ada task aktif untuk pesanan ini.",
      });
    }

    const pendingAssignments = assignments.filter((a) => !a.startAt);

    if (pendingAssignments.length === 0) {
      throw ApiError.conflict({ message: "Semua task sudah dimulai." });
    }

    const startedAssignments = [];
    const serviceNames = [];

    for (const assignment of pendingAssignments) {
      const updated = await this.taskRepo.startTask(assignment.id);
      startedAssignments.push(updated);
      serviceNames.push(
        updated.orderItem?.productNameSnapshot || updated.orderItem?.product?.name
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "IN_PROGRESS",
          changedById: mechanicId,
          note: `Pengerjaan dimulai untuk ${startedAssignments.length} service: ${serviceNames.join(", ")}.`,
        },
      });
    });

    if (order.cashierId) {
      await this.#sendNotification(
        order.cashierId,
        "Pengerjaan Dimulai",
        `Pesanan #${order.orderNumber} mulai dikerjakan\n\n` +
        `Service: ${serviceNames.join(", ")}\n` +
        `Pelanggan: ${order.customer?.name || "-"}\n` +
        `Kendaraan: ${order.vehicle?.plateNumber || "-"}`
      );
    }

    logger.info("Order dimulai", {
      orderId,
      mechanicId,
      taskCount: startedAssignments.length,
    });

    return startedAssignments;
  }

  /**
   * Menyelesaikan semua task dalam order oleh mekanik.
   * Status order IN_PROGRESS → COMPLETED.
   *
   * @param {string} orderId - ID order
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Semua task yang sudah selesai
   * @throws {ApiError} 404 | 409 | 400
   */
  async completeOrder(orderId, mechanicId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    }

    if (order.status !== "IN_PROGRESS") {
      throw ApiError.badRequest({
        message: `Hanya pesanan IN_PROGRESS yang dapat diselesaikan. Status saat ini: ${order.status}`,
      });
    }

    const assignments = await this.#getActiveAssignments(orderId, mechanicId);

    if (assignments.length === 0) {
      throw ApiError.badRequest({
        message: "Tidak ada task aktif untuk pesanan ini.",
      });
    }

    const pendingAssignments = assignments.filter((a) => !a.endAt && a.startAt);

    if (pendingAssignments.length === 0) {
      throw ApiError.conflict({ message: "Semua task sudah selesai." });
    }

    const completedAssignments = [];
    const serviceNames = [];

    for (const assignment of pendingAssignments) {
      const updated = await this.taskRepo.completeTask(assignment.id);
      completedAssignments.push(updated);
      serviceNames.push(
        updated.orderItem?.productNameSnapshot || updated.orderItem?.product?.name
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "COMPLETED",
          changedById: mechanicId,
          note: `Semua service selesai: ${serviceNames.join(", ")}. ` +
            `Durasi pengerjaan: ${this.#formatDuration(order.startedAt, new Date())}.`,
        },
      });
    });

    if (order.cashierId) {
      await this.#sendNotification(
        order.cashierId,
        "Pengerjaan Selesai",
        `Pesanan #${order.orderNumber} selesai dikerjakan\n\n` +
        `Service: ${serviceNames.join(", ")}\n` +
        `Pelanggan: ${order.customer?.name || "-"}\n` +
        `Kendaraan: ${order.vehicle?.plateNumber || "-"}`,
        "SUCCESS"
      );
    }

    logger.info("Order selesai", {
      orderId,
      mechanicId,
      taskCount: completedAssignments.length,
      duration: this.#formatDuration(order.startedAt, new Date()),
    });

    return completedAssignments;
  }

  /**
   * Mendapatkan daftar mekanik yang tersedia
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getAvailableMechanics(query = {}) {
    const mechanics = await this.taskRepo.getAvailableMechanics(query);

    if (mechanics.data && mechanics.data.length > 0) {
      for (const mechanic of mechanics.data) {
        mechanic.isAvailable = await this.#isMechanicAvailable(mechanic.id);
      }
    }

    return mechanics;
  }

  /**
   * Mendapatkan status ketersediaan seorang mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   * @throws {ApiError} 400
   */
  async getMechanicAvailabilityStatus(mechanicId) {
    const mechanic = await this.userRepo.findById(mechanicId);
    if (!mechanic || mechanic.role !== "MECHANIC") {
      throw ApiError.badRequest({ message: "User yang dipilih bukan mekanik." });
    }

    const activeTaskCount = await this.taskRepo.getActiveTaskCount(mechanicId);
    const maxTasks = Number(await this.#getSetting("mechanic_max_tasks", 5));
    const isAvailable = activeTaskCount < maxTasks;

    return {
      isAvailable,
      activeTaskCount,
      maxTasks,
      remainingCapacity: maxTasks - activeTaskCount,
    };
  }

  /**
   * Mengecek apakah order item sudah memiliki mekanik yang ditugaskan
   * @param {string} orderItemId - ID order item
   * @returns {Promise<boolean>}
   */
  async hasMechanicAssigned(orderItemId) {
    return this.taskRepo.hasMechanicAssigned(orderItemId);
  }

  /**
   * Assign banyak mekanik ke banyak order sekaligus (bulk operation)
   * @param {Array<{orderId: string, mechanicId: string}>} assignments
   * @returns {Promise<{success: Array, failed: Array}>}
   */
  async bulkAssignMechanics(assignments) {
    const results = [];
    const errors = [];

    for (const item of assignments) {
      try {
        const assigned = await this.assignMechanicToOrder(item.orderId, item.mechanicId);
        results.push(...assigned);
      } catch (error) {
        errors.push({ orderId: item.orderId, error: error.message });
      }
    }

    logger.info("Bulk assign mekanik selesai", {
      total: assignments.length,
      success: results.length,
      failed: errors.length,
    });

    return { success: results, failed: errors };
  }

  /**
   * Mendapatkan riwayat task mekanik yang sudah selesai (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}]
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah data per halaman
   * @param {string} [query.search] - Search by product name atau order number
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getMyTaskHistory(mechanicId, query = {}) {
    return this.taskRepo.findHistoryByMechanic(mechanicId, query);
  }
}

export default TaskService;