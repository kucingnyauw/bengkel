import NotificationService from "#service/notificationService.js";

jest.mock("#repository/notificationRepository.js");

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk NotificationService
 * @describe NotificationService
 */
describe("NotificationService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat notifikasi dengan semua field
     */
    it("should create notification with all fields", async () => {
      const data = { title: "Test", message: "Body", userId: "u1", type: "WARNING" };
      const created = { id: "n1", ...data, isRead: false };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].create.mockResolvedValue(created);

      const result = await service.create(data);
      expect(result).toEqual(created);
    });

    /**
     * @test Menggunakan tipe default INFO
     */
    it("should use default type INFO", async () => {
      const data = { title: "Info", message: "Body", userId: "u1" };
      const created = { id: "n2", ...data, type: "INFO" };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].create.mockResolvedValue(created);

      const result = await service.create(data);
      expect(result.type).toBe("INFO");
    });
  });

  /**
   * @describe createMany
   */
  describe("createMany", () => {
    /**
     * @test Membuat notifikasi untuk multiple users
     */
    it("should create notifications for multiple users", async () => {
      const data = { title: "Bulk", message: "Body", userIds: ["u1", "u2", "u3"], type: "WARNING" };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].createMany.mockResolvedValue(3);

      const result = await service.createMany(data);
      expect(result).toBe(3);
    });
  });

  /**
   * @describe getById
   */
  describe("getById", () => {
    /**
     * @test Mengembalikan notifikasi ketika ditemukan
     */
    it("should return notification when found", async () => {
      const notification = { id: "n1", title: "Test", message: "Body" };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].findById.mockResolvedValue(notification);

      const result = await service.getById("n1");
      expect(result).toEqual(notification);
    });

    /**
     * @test Melempar 404 ketika tidak ditemukan
     */
    it("should throw 404 when not found", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getById("n99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  /**
   * @describe getByUserId
   */
  describe("getByUserId", () => {
    /**
     * @test Mengembalikan notifikasi user dengan paginasi
     */
    it("should return user notifications with pagination", async () => {
      const mockResult = {
        data: [{ id: "n1", title: "Test" }],
        metadata: { total: 1 },
      };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].findByUserId.mockResolvedValue(mockResult);

      const result = await service.getByUserId("u1", { page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });

    /**
     * @test Menggunakan query default kosong
     */
    it("should use default empty query", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].findByUserId.mockResolvedValue({ data: [], metadata: { total: 0 } });

      await service.getByUserId("u1");
      expect(NotificationRepository.mock.instances[0].findByUserId).toHaveBeenCalledWith("u1", {});
    });
  });

  /**
   * @describe markAsRead
   */
  describe("markAsRead", () => {
    /**
     * @test Menandai notifikasi sudah dibaca
     */
    it("should mark notification as read", async () => {
      const updated = { id: "n1", isRead: true };

      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].markAsRead.mockResolvedValue(updated);

      const result = await service.markAsRead("n1");
      expect(result).toEqual(updated);
    });
  });

  /**
   * @describe markAllAsRead
   */
  describe("markAllAsRead", () => {
    /**
     * @test Menandai semua notifikasi user sudah dibaca
     */
    it("should mark all user notifications as read", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].markAllAsRead.mockResolvedValue(5);

      const result = await service.markAllAsRead("u1");
      expect(result).toBe(5);
    });

    /**
     * @test Mengembalikan 0 ketika tidak ada notifikasi
     */
    it("should return 0 when no notifications", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].markAllAsRead.mockResolvedValue(0);

      const result = await service.markAllAsRead("u1");
      expect(result).toBe(0);
    });
  });

  /**
   * @describe getUnreadCount
   */
  describe("getUnreadCount", () => {
    /**
     * @test Mengembalikan jumlah notifikasi belum dibaca
     */
    it("should return unread count", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].getUnreadCount.mockResolvedValue(3);

      const result = await service.getUnreadCount("u1");
      expect(result).toBe(3);
    });
  });

  /**
   * @describe getTotalCount
   */
  describe("getTotalCount", () => {
    /**
     * @test Mengembalikan total notifikasi user
     */
    it("should return total count", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].getTotalCount.mockResolvedValue(10);

      const result = await service.getTotalCount("u1");
      expect(result).toBe(10);
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus notifikasi
     */
    it("should delete notification", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].delete.mockResolvedValue();

      await expect(service.delete("n1")).resolves.toBeUndefined();
    });
  });

  /**
   * @describe deleteAll
   */
  describe("deleteAll", () => {
    /**
     * @test Menghapus semua notifikasi user
     */
    it("should delete all user notifications", async () => {
      const { NotificationRepository } = require("#repository/notificationRepository.js");
      NotificationRepository.mock.instances[0].deleteAll.mockResolvedValue(7);

      const result = await service.deleteAll("u1");
      expect(result).toBe(7);
    });
  });
});