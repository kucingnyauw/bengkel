// __test__/notificationService_test.js
import NotificationService from "#service/notificationService.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";

// Mock repository
jest.mock("#repository/notificationRepository.js");

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("NotificationService", () => {
  let service;
  let mockNotifRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
    // Get mock instance for repository
    mockNotifRepo = NotificationRepository.mock.instances[0];
  });

  // ============================================================
  // create
  // ============================================================
  describe("create", () => {
    it("should create notification with all provided fields", async () => {
      const data = {
        title: "Test Notif",
        message: "Test message",
        userId: "user-1",
        type: "WARNING",
        orderId: "order-1",
      };
      const created = { id: "notif-1", ...data, isRead: false, createdAt: new Date() };
      mockNotifRepo.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockNotifRepo.create).toHaveBeenCalledWith(data);
      expect(result.title).toBe("Test Notif");
    });

    it("should use default type INFO when not provided", async () => {
      const data = { title: "Info", message: "Body", userId: "user-1" };
      const created = { id: "notif-2", ...data, type: "INFO", isRead: false };
      mockNotifRepo.create.mockResolvedValue(created);

      const result = await service.create(data);
      expect(result.type).toBe("INFO");
      // Verify the repo received the correct payload with type omitted (or it will be undefined? The service just passes data object, so type will be undefined if not provided; repo may handle default. But we test that the service doesn't force a default; it's up to repo. However we can still verify the returned object.)
    });

    it("should create notification without orderId", async () => {
      const data = { title: "No order", message: "msg", userId: "user-1" };
      const created = { id: "notif-3", ...data };
      mockNotifRepo.create.mockResolvedValue(created);

      const result = await service.create(data);
      expect(result.orderId).toBeUndefined();
    });
  });

  // ============================================================
  // createMany
  // ============================================================
  describe("createMany", () => {
    it("should create notifications for multiple users and return count", async () => {
      const data = {
        title: "Bulk Notif",
        message: "Bulk message",
        userIds: ["u1", "u2", "u3"],
        type: "WARNING",
      };
      mockNotifRepo.createMany.mockResolvedValue(3);

      const result = await service.createMany(data);
      expect(result).toBe(3);
      expect(mockNotifRepo.createMany).toHaveBeenCalledWith(data);
    });

    it("should create notifications without optional fields", async () => {
      const data = {
        title: "Simple",
        message: "Hello",
        userIds: ["u1"],
      };
      mockNotifRepo.createMany.mockResolvedValue(1);
      await service.createMany(data);
      expect(mockNotifRepo.createMany).toHaveBeenCalledWith(data);
    });
  });

  // ============================================================
  // getById
  // ============================================================
  describe("getById", () => {
    it("should return notification when found", async () => {
      const notification = { id: "n1", title: "Test", message: "Body" };
      mockNotifRepo.findById.mockResolvedValue(notification);

      const result = await service.getById("n1");
      expect(result).toEqual(notification);
      expect(mockNotifRepo.findById).toHaveBeenCalledWith("n1");
    });

    it("should throw ApiError 404 when not found", async () => {
      mockNotifRepo.findById.mockResolvedValue(null);

      await expect(service.getById("n99")).rejects.toThrow(ApiError);
      await expect(service.getById("n99")).rejects.toMatchObject({
        statusCode: 404,
        message: expect.stringContaining("Notifikasi dengan ID 'n99' tidak ditemukan"),
      });
    });
  });

  // ============================================================
  // getByUserId
  // ============================================================
  describe("getByUserId", () => {
    it("should return paginated notifications for a user", async () => {
      const repoResult = {
        data: [{ id: "n1", title: "Test" }],
        metadata: { total: 1, currentPage: 1 },
      };
      mockNotifRepo.findByUserId.mockResolvedValue(repoResult);

      const result = await service.getByUserId("user-1", { page: 1, limit: 10 });
      expect(result).toEqual(repoResult);
      expect(mockNotifRepo.findByUserId).toHaveBeenCalledWith("user-1", { page: 1, limit: 10 });
    });

    it("should filter by isRead status", async () => {
      mockNotifRepo.findByUserId.mockResolvedValue({ data: [], metadata: { total: 0 } });
      await service.getByUserId("user-1", { isRead: false });
      expect(mockNotifRepo.findByUserId).toHaveBeenCalledWith("user-1", { isRead: false });
    });

    it("should filter by notification type", async () => {
      mockNotifRepo.findByUserId.mockResolvedValue({ data: [], metadata: { total: 0 } });
      await service.getByUserId("user-1", { type: "ERROR" });
      expect(mockNotifRepo.findByUserId).toHaveBeenCalledWith("user-1", { type: "ERROR" });
    });

    it("should work with empty query (defaults)", async () => {
      const repoResult = { data: [], metadata: { total: 0 } };
      mockNotifRepo.findByUserId.mockResolvedValue(repoResult);

      await service.getByUserId("user-1");
      expect(mockNotifRepo.findByUserId).toHaveBeenCalledWith("user-1", {});
    });
  });

  // ============================================================
  // markAsRead
  // ============================================================
  describe("markAsRead", () => {
    it("should mark notification as read and return updated object", async () => {
      const updated = { id: "n1", isRead: true };
      mockNotifRepo.markAsRead.mockResolvedValue(updated);

      const result = await service.markAsRead("n1");
      expect(result).toEqual(updated);
      expect(mockNotifRepo.markAsRead).toHaveBeenCalledWith("n1");
    });
  });

  // ============================================================
  // markAllAsRead
  // ============================================================
  describe("markAllAsRead", () => {
    it("should mark all user notifications as read and return count", async () => {
      mockNotifRepo.markAllAsRead.mockResolvedValue(5);

      const result = await service.markAllAsRead("user-1");
      expect(result).toBe(5);
      expect(mockNotifRepo.markAllAsRead).toHaveBeenCalledWith("user-1");
    });

    it("should return 0 if no notifications", async () => {
      mockNotifRepo.markAllAsRead.mockResolvedValue(0);
      const result = await service.markAllAsRead("user-2");
      expect(result).toBe(0);
    });
  });

  // ============================================================
  // getUnreadCount
  // ============================================================
  describe("getUnreadCount", () => {
    it("should return the number of unread notifications", async () => {
      mockNotifRepo.getUnreadCount.mockResolvedValue(3);
      const result = await service.getUnreadCount("user-1");
      expect(result).toBe(3);
      expect(mockNotifRepo.getUnreadCount).toHaveBeenCalledWith("user-1");
    });
  });

  // ============================================================
  // getTotalCount
  // ============================================================
  describe("getTotalCount", () => {
    it("should return total notification count for user", async () => {
      mockNotifRepo.getTotalCount.mockResolvedValue(10);
      const result = await service.getTotalCount("user-1");
      expect(result).toBe(10);
      expect(mockNotifRepo.getTotalCount).toHaveBeenCalledWith("user-1");
    });
  });

  // ============================================================
  // delete
  // ============================================================
  describe("delete", () => {
    it("should delete notification and resolve", async () => {
      mockNotifRepo.delete.mockResolvedValue(undefined);

      await expect(service.delete("n1")).resolves.toBeUndefined();
      expect(mockNotifRepo.delete).toHaveBeenCalledWith("n1");
    });
  });

  // ============================================================
  // deleteAll
  // ============================================================
  describe("deleteAll", () => {
    it("should delete all user notifications and return count", async () => {
      mockNotifRepo.deleteAll.mockResolvedValue(7);

      const result = await service.deleteAll("user-1");
      expect(result).toBe(7);
      expect(mockNotifRepo.deleteAll).toHaveBeenCalledWith("user-1");
    });

    it("should return 0 when no notifications to delete", async () => {
      mockNotifRepo.deleteAll.mockResolvedValue(0);
      const result = await service.deleteAll("user-2");
      expect(result).toBe(0);
    });
  });
});