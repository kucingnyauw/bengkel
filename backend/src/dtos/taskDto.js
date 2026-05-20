/**
 * Data Transfer Object untuk response Task
 * @module dtos/taskDto
 */

/**
 * DTO untuk data mekanik di task
 * @class TaskMechanicDto
 */
class TaskMechanicDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.fullName
   * @param {string} [data.email]
   * @param {string} [data.phone]
   */
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phone = data.phone;
  }
}

/**
 * DTO untuk data produk di task
 * @class TaskProductDto
 */
class TaskProductDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.type
   * @param {string} [data.description]
   * @param {Object} [data.image]
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.image = data.image?.url || data.image?.path || null;
  }
}

/**
 * DTO untuk data order di task (detail)
 * @class TaskOrderDto
 */
class TaskOrderDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.orderNumber
   * @param {string} data.status
   * @param {number} data.total
   * @param {string} data.createdAt
   * @param {Object|null} data.customer
   * @param {Object|null} data.vehicle
   */
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.total = data.total;
    this.createdAt = data.createdAt;
    this.customer = data.customer
      ? {
          id: data.customer.id,
          name: data.customer.name,
          phone: data.customer.phone,
        }
      : null;
    this.vehicle = data.vehicle
      ? {
          id: data.vehicle.id,
          plateNumber: data.vehicle.plateNumber,
          brand: data.vehicle.brand,
          model: data.vehicle.model,
        }
      : null;
  }
}

/**
 * DTO untuk order item di task detail
 * @class TaskOrderItemDto
 */
class TaskOrderItemDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {number} data.quantity
   * @param {number} data.unitPrice
   * @param {number} data.subtotal
   * @param {string} data.productNameSnapshot
   * @param {Object} [data.product]
   * @param {Object} [data.order]
   */
  constructor(data) {
    this.id = data.id;
    this.quantity = data.quantity;
    this.unitPrice = data.unitPrice;
    this.subtotal = data.subtotal;
    this.productName = data.productNameSnapshot;
    this.product = data.product ? new TaskProductDto(data.product) : null;
    this.order = data.order ? new TaskOrderDto(data.order) : null;
  }
}

/**
 * DTO untuk detail task (get by ID)
 * @class TaskDetailDto
 */
class TaskDetailDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string|null} data.startAt
   * @param {string|null} data.endAt
   * @param {string} data.createdAt
   * @param {Object} data.mechanic
   * @param {Object} data.orderItem
   */
  constructor(data) {
    this.id = data.id;
    this.startAt = data.startAt;
    this.endAt = data.endAt;
    this.createdAt = data.createdAt;
    this.mechanic = new TaskMechanicDto(data.mechanic);
    this.orderItem = new TaskOrderItemDto(data.orderItem);

    if (data.endAt) {
      this.taskStatus = "COMPLETED";
      this.taskStatusLabel = "Selesai";
    } else if (data.startAt) {
      this.taskStatus = "IN_PROGRESS";
      this.taskStatusLabel = "Dikerjakan";
    } else {
      this.taskStatus = "PENDING";
      this.taskStatusLabel = "Menunggu";
    }
  }
}

/**
 * DTO untuk response setelah start/complete task
 * @class TaskTimeUpdatedDto
 */
class TaskTimeUpdatedDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string|null} data.startAt
   * @param {string|null} data.endAt
   */
  constructor(data) {
    this.id = data.id;
    this.startAt = data.startAt;
    this.endAt = data.endAt;

    if (data.endAt) {
      this.taskStatus = "COMPLETED";
      this.taskStatusLabel = "Selesai";
    } else if (data.startAt) {
      this.taskStatus = "IN_PROGRESS";
      this.taskStatusLabel = "Dikerjakan";
    } else {
      this.taskStatus = "PENDING";
      this.taskStatusLabel = "Menunggu";
    }
  }
}

/**
 * DTO untuk task service yang belum ditugaskan (unassigned)
 * @class UnassignedTaskDto
 */
class UnassignedTaskDto {
  /**
   * @param {Object} data
   * @param {string} data.orderId
   * @param {string} data.orderNumber
   * @param {string} data.status
   * @param {string} data.createdAt
   * @param {Object|null} data.customer
   * @param {Object|null} data.vehicle
   * @param {Array} data.services
   */
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.customer = data.customer ? { name: data.customer.name } : null;
    this.vehicle = data.vehicle
      ? {
          plateNumber: data.vehicle.plateNumber,
          brand: data.vehicle.brand,
          model: data.vehicle.model,
        }
      : null;
    this.services = data.services.map((s) => ({
      name: s.name,
      quantity: s.quantity,
      price: s.price,
      image: s.image || null,
    }));
  }
}

/**
 * DTO untuk task list yang dikelompokkan per order (digunakan untuk semua list)
 * @class TaskListDto
 */
class TaskListDto {
  /**
   * @param {Object} data
   * @param {string} data.orderId
   * @param {string} data.orderNumber
   * @param {string} data.status
   * @param {string} data.createdAt
   * @param {Object} data.customer
   * @param {Object} data.vehicle
   * @param {Array} data.services
   */
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.customer = data.customer?.name ? { name: data.customer.name } : null;
    this.vehicle = data.vehicle?.plateNumber
      ? {
          plateNumber: data.vehicle.plateNumber,
          brand: data.vehicle.brand,
          model: data.vehicle.model,
        }
      : null;

    this.services = (data.services || []).map((s) => {
      if (typeof s === "string") return { name: s };
      return {
        assignmentId: s.assignmentId,
        mechanicId: s.mechanicId || null,
        mechanicName: s.mechanicName || null,
        name: s.name || s.serviceName,
        startAt: s.startAt || null,
        endAt: s.endAt || null,
        taskStatus: s.endAt ? "COMPLETED" : s.startAt ? "IN_PROGRESS" : "PENDING",
      };
    });
  }
}

/**
 * DTO untuk riwayat task mekanik (history)
 * @class MyTaskHistoryDto
 */
class MyTaskHistoryDto {
  /**
   * @param {Object} data
   * @param {string} data.orderId
   * @param {string} data.orderNumber
   * @param {string} data.status
   * @param {string} data.orderCreatedAt
   * @param {Object} data.customer
   * @param {Object} data.vehicle
   * @param {string} data.startedAt
   * @param {string} data.completedAt
   * @param {string} data.duration
   * @param {number} data.totalEarnings
   * @param {Array} data.services
   */
  constructor(data) {
    this.orderId = data.orderId;
    this.orderNumber = data.orderNumber;
    this.status = data.status;
    this.orderCreatedAt = data.orderCreatedAt;
    this.customer = data.customer?.name ? { name: data.customer.name } : null;
    this.vehicle = data.vehicle?.plateNumber
      ? {
          plateNumber: data.vehicle.plateNumber,
          brand: data.vehicle.brand,
          model: data.vehicle.model,
        }
      : null;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.duration = data.duration;
    this.totalEarnings = data.totalEarnings;
    this.services = (data.services || []).map((s) => ({
      assignmentId: s.assignmentId,
      name: s.name || s.serviceName,
      startAt: s.startAt,
      endAt: s.endAt,
    }));
  }
}

/**
 * DTO untuk mekanik yang tersedia
 * @class AvailableMechanicDto
 */
class AvailableMechanicDto {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.fullName
   * @param {string} [data.email]
   * @param {string} [data.phone]
   * @param {number} data.activeTaskCount
   * @param {boolean} data.isAvailable
   */
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phone = data.phone;
    this.activeTaskCount = data.activeTaskCount;
    this.isAvailable = data.isAvailable;
  }
}

export {
  TaskMechanicDto,
  TaskProductDto,
  TaskOrderDto,
  TaskOrderItemDto,
  TaskDetailDto,
  TaskListDto,
  TaskTimeUpdatedDto,
  UnassignedTaskDto,
  MyTaskHistoryDto,
  AvailableMechanicDto,
};