import CatchAsync from "#shared/utils/response.js";
import TaskService from "#service/taskService.js";

import {
  assignMechanicSchema,
  bulkAssignMechanicsSchema,
  getTasksQuerySchema,
  assignmentIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
} from "#validation/taskValidation.js";

import validate from "#validation/validation.js";

import {
  TaskDetailDto,
  TaskListDto,
  TaskTimeUpdatedDto,
  UnassignedTaskDto,
  MyTaskHistoryDto,
  AvailableMechanicDto,
} from "#dtos/taskDto.js";

/**
 * Controller untuk mengelola endpoint penugasan mekanik
 * @class TaskController
 */
class TaskController {
  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Assign mekanik ke order (QUEUED)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  assignMechanic = CatchAsync.run(async (req, res) => {
    const { orderId, mechanicId } = validate(assignMechanicSchema, req.body);

    const assignments = await this.taskService.assignMechanicToOrder(orderId, mechanicId);

    res.status(201).json({
      success: true,
      message: "Mekanik berhasil ditugaskan",
      data: assignments.map((a) => new TaskDetailDto(a)),
    });
  });

  /**
   * Unassign mekanik dari order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  unassignMechanicFromOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);
    const userId = req.user.id;

    await this.taskService.unassignMechanicFromOrder(orderId, userId);

    res.status(200).json({
      success: true,
      message: "Semua mekanik berhasil dilepas dari order",
      data: null,
    });
  });

  /**
   * Get task by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTaskById = CatchAsync.run(async (req, res) => {
    const { id } = validate(assignmentIdParamSchema, req.params);

    const task = await this.taskService.getTaskById(id);

    res.status(200).json({
      success: true,
      message: "Detail task berhasil diambil",
      data: new TaskDetailDto(task),
    });
  });

  /**
   * Get tasks by order ID (grouped dengan detail)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTasksByOrderId = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const result = await this.taskService.getTasksByOrderId(orderId);

    res.status(200).json({
      success: true,
      message: "Detail task order berhasil diambil",
      data: result,
    });
  });

  /**
   * Get all tasks (grouped by order)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTasks = CatchAsync.run(async (req, res) => {
    const query = validate(getTasksQuerySchema, req.query);

    const result = await this.taskService.getTasks(query);

    res.status(200).json({
      success: true,
      message: "Daftar task berhasil diambil",
      data: result.data.map((task) => new TaskListDto(task)),
      metadata: result.metadata,
    });
  });

  /**
   * Get tasks by mechanic (grouped by order)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTasksByMechanic = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);

    const tasks = await this.taskService.getTasksByMechanic(mechanicId);

    res.status(200).json({
      success: true,
      message: "Daftar task mekanik berhasil diambil",
      data: tasks.map((task) => new TaskListDto(task)),
    });
  });

  /**
   * Get unassigned tasks
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUnassignedTasks = CatchAsync.run(async (req, res) => {
    const query = validate(getTasksQuerySchema, req.query);

    const result = await this.taskService.getUnassignedTasks(query);

    res.status(200).json({
      success: true,
      message: "Daftar task yang belum ditugaskan berhasil diambil",
      data: result.data.map((task) => new UnassignedTaskDto(task)),
      metadata: result.metadata,
    });
  });

  /**
   * Start order (QUEUED → IN_PROGRESS)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  startOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);
    const mechanicId = req.user.id;

    const tasks = await this.taskService.startOrder(orderId, mechanicId);

    res.status(200).json({
      success: true,
      message: "Semua task berhasil dimulai",
      data: tasks.map((task) => new TaskTimeUpdatedDto(task)),
    });
  });

  /**
   * Complete order (IN_PROGRESS → COMPLETED)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  completeOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);
    const mechanicId = req.user.id;

    const tasks = await this.taskService.completeOrder(orderId, mechanicId);

    res.status(200).json({
      success: true,
      message: "Semua task berhasil diselesaikan",
      data: tasks.map((task) => new TaskTimeUpdatedDto(task)),
    });
  });

  /**
   * Get available mechanics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getAvailableMechanics = CatchAsync.run(async (req, res) => {
    const query = validate(getTasksQuerySchema, req.query);

    const result = await this.taskService.getAvailableMechanics(query);

    res.status(200).json({
      success: true,
      message: "Daftar mekanik tersedia berhasil diambil",
      data: result.data.map((mechanic) => new AvailableMechanicDto(mechanic)),
      metadata: result.metadata,
    });
  });

  /**
   * Get mechanic availability status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicAvailability = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);

    const status = await this.taskService.getMechanicAvailabilityStatus(mechanicId);

    res.status(200).json({
      success: true,
      message: "Status ketersediaan mekanik berhasil diambil",
      data: status,
    });
  });

  /**
   * Check if mechanic assigned to order item
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkMechanicAssigned = CatchAsync.run(async (req, res) => {
    const { orderItemId } = validate(orderIdParamSchema, req.params);

    const hasAssigned = await this.taskService.hasMechanicAssigned(orderItemId);

    res.status(200).json({
      success: true,
      message: "Status penugasan mekanik berhasil diambil",
      data: { hasMechanicAssigned: hasAssigned },
    });
  });

  /**
   * Bulk assign mechanics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  bulkAssignMechanics = CatchAsync.run(async (req, res) => {
    const { assignments } = validate(bulkAssignMechanicsSchema, req.body);

    const result = await this.taskService.bulkAssignMechanics(assignments);

    res.status(200).json({
      success: true,
      message: `Bulk assign selesai. ${result.success.length} berhasil, ${result.failed.length} gagal.`,
      data: {
        success: result.success.map((item) => new TaskDetailDto(item)),
        failed: result.failed,
      },
    });
  });

  /**
   * Get my tasks (mechanic) - grouped by order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMyTasks = CatchAsync.run(async (req, res) => {
    const query = validate(getTasksQuerySchema, req.query);

    const result = await this.taskService.getMyTasks(req.user.id, query);

    res.status(200).json({
      success: true,
      message: "Daftar task saya berhasil diambil",
      data: result.data.map((task) => new TaskListDto(task)),
      metadata: result.metadata,
    });
  });

  /**
   * Get my task history (mechanic) - grouped by order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMyTaskHistory = CatchAsync.run(async (req, res) => {
    const query = validate(getTasksQuerySchema, req.query);

    const result = await this.taskService.getMyTaskHistory(req.user.id, query);

    res.status(200).json({
      success: true,
      message: "Riwayat task berhasil diambil",
      data: result.data.map((task) => new MyTaskHistoryDto(task)),
      metadata: result.metadata,
    });
  });
}

export default new TaskController();