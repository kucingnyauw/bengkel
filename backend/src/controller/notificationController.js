import CatchAsync from "#shared/utils/response.js";
import NotificationService from "#service/notificationService.js";
import validate from "#validation/validation.js";
import {
  createNotificationSchema,
  createBulkNotificationSchema,
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from "#validation/notificationValidation.js";
import {
  NotificationDto,
  NotificationUnreadCountDto,
} from "#dtos/notificationDto.js";

/**
 * Controller untuk mengelola endpoint notifikasi
 * @class NotificationController
 */
class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
  }

  createNotification = CatchAsync.run(async (req, res) => {
    const payload = validate(createNotificationSchema, req.body);
    const notification = await this.notificationService.create(payload);

    res.status(201).json({
      success: true,
      message: "Notifikasi berhasil dibuat",
      data: new NotificationDto(notification),
    });
  });

  createBulkNotification = CatchAsync.run(async (req, res) => {
    const payload = validate(createBulkNotificationSchema, req.body);
    const count = await this.notificationService.createMany(payload);

    res.status(201).json({
      success: true,
      message: `${count} notifikasi berhasil dibuat`,
      data: { count },
    });
  });

  getNotificationById = CatchAsync.run(async (req, res) => {
    const { id } = validate(notificationIdParamSchema, req.params);
    const notification = await this.notificationService.getById(id);

    res.status(200).json({
      success: true,
      message: "Detail notifikasi berhasil diambil",
      data: new NotificationDto(notification),
    });
  });

  getMyNotifications = CatchAsync.run(async (req, res) => {
    const userId = req.user.id;
    const query = validate(getNotificationsQuerySchema, req.query);
    const result = await this.notificationService.getByUserId(userId, query);

    res.status(200).json({
      success: true,
      message: "Daftar notifikasi berhasil diambil",
      data: result.data.map((n) => new NotificationDto(n)),
      metadata: result.metadata,
    });
  });

  getUnreadCount = CatchAsync.run(async (req, res) => {
    const userId = req.user.id;
    const count = await this.notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: "Jumlah notifikasi belum dibaca berhasil diambil",
      data: new NotificationUnreadCountDto(count),
    });
  });

  getTotalCount = CatchAsync.run(async (req, res) => {
    const userId = req.user.id;
    const count = await this.notificationService.getTotalCount(userId);

    res.status(200).json({
      success: true,
      message: "Jumlah total notifikasi berhasil diambil",
      data: { total: count },
    });
  });

  markAsRead = CatchAsync.run(async (req, res) => {
    const { id } = validate(notificationIdParamSchema, req.params);
    const notification = await this.notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      message: "Notifikasi ditandai sudah dibaca",
      data: new NotificationDto(notification),
    });
  });

  markAllAsRead = CatchAsync.run(async (req, res) => {
    const userId = req.user.id;
    const count = await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${count} notifikasi ditandai sudah dibaca`,
      data: { count },
    });
  });

  deleteNotification = CatchAsync.run(async (req, res) => {
    const { id } = validate(notificationIdParamSchema, req.params);
    await this.notificationService.delete(id);

    res.status(200).json({
      success: true,
      message: "Notifikasi berhasil dihapus",
      data: null,
    });
  });

  deleteAllNotifications = CatchAsync.run(async (req, res) => {
    const userId = req.user.id;
    const count = await this.notificationService.deleteAll(userId);

    res.status(200).json({
      success: true,
      message: `${count} notifikasi berhasil dihapus`,
      data: { count },
    });
  });
}

export default new NotificationController();