import prisma from "#app/database.js";
import SettingRepository from "#repository/settingRepository.js";

jest.mock("#app/database.js", () => ({
  setting: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((operations) => Promise.resolve(operations.map(() => ({})))),
}));

/**
 * Unit test untuk SettingRepository
 * @describe SettingRepository
 */
describe("SettingRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SettingRepository();
  });

  /**
   * @describe findByKey
   */
  describe("findByKey", () => {
    /**
     * @test Mengembalikan setting ketika ditemukan
     */
    it("should return setting when found by key", async () => {
      const mockSetting = {
        id: "set-1",
        key: "tax_rate",
        value: "11",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      prisma.setting.findUnique.mockResolvedValue(mockSetting);

      const result = await repo.findByKey("tax_rate");

      expect(result).toEqual(mockSetting);
      expect(prisma.setting.findUnique).toHaveBeenCalledWith({
        where: { key: "tax_rate" },
        select: {
          id: true,
          key: true,
          value: true,
          updatedAt: true,
          createdAt: true,
        },
      });
    });

    /**
     * @test Mengembalikan null ketika key tidak ditemukan
     */
    it("should return null when key not found", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.findByKey("nonexistent_key");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findAll
   */
  describe("findAll", () => {
    /**
     * @test Mengembalikan semua settings terurut berdasarkan key
     */
    it("should return all settings ordered by key", async () => {
      const mockSettings = [
        { id: "set-1", key: "mechanic_max_tasks", value: "5", updatedAt: new Date(), createdAt: new Date() },
        { id: "set-2", key: "shift_min_starting_cash", value: "1000000", updatedAt: new Date(), createdAt: new Date() },
        { id: "set-3", key: "tax_rate", value: "11", updatedAt: new Date(), createdAt: new Date() },
      ];

      prisma.setting.findMany.mockResolvedValue(mockSettings);

      const result = await repo.findAll();

      expect(result).toEqual(mockSettings);
      expect(result).toHaveLength(3);
      expect(prisma.setting.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { key: "asc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada settings
     */
    it("should return empty array when no settings", async () => {
      prisma.setting.findMany.mockResolvedValue([]);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe findByKeys
   */
  describe("findByKeys", () => {
    /**
     * @test Mengembalikan settings berdasarkan array key
     */
    it("should return settings by array of keys", async () => {
      const mockSettings = [
        { key: "tax_rate", value: "11" },
        { key: "shift_min_starting_cash", value: "1000000" },
      ];

      prisma.setting.findMany.mockResolvedValue(mockSettings);

      const result = await repo.findByKeys(["tax_rate", "shift_min_starting_cash"]);

      expect(result).toEqual(mockSettings);
      expect(prisma.setting.findMany).toHaveBeenCalledWith({
        where: { key: { in: ["tax_rate", "shift_min_starting_cash"] } },
        select: { key: true, value: true },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika keys tidak ditemukan
     */
    it("should return empty array when keys not found", async () => {
      prisma.setting.findMany.mockResolvedValue([]);

      const result = await repo.findByKeys(["key1", "key2"]);

      expect(result).toEqual([]);
    });
  });

  /**
   * @describe findAllAsObject
   */
  describe("findAllAsObject", () => {
    /**
     * @test Mengembalikan settings dalam format key-value object
     */
    it("should return settings as key-value object", async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: "tax_rate", value: "11" },
        { key: "store_name", value: "Bengkel Vespa" },
        { key: "stock_low_threshold", value: "5" },
      ]);

      const result = await repo.findAllAsObject();

      expect(result).toEqual({
        tax_rate: "11",
        store_name: "Bengkel Vespa",
        stock_low_threshold: "5",
      });
    });

    /**
     * @test Mengembalikan object kosong ketika tidak ada settings
     */
    it("should return empty object when no settings", async () => {
      prisma.setting.findMany.mockResolvedValue([]);

      const result = await repo.findAllAsObject();

      expect(result).toEqual({});
    });
  });

  /**
   * @describe upsert
   */
  describe("upsert", () => {
    /**
     * @test Membuat setting baru jika belum ada
     */
    it("should create a new setting if not exists", async () => {
      const expected = {
        id: "set-1",
        key: "tax_rate",
        value: "12",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      prisma.setting.upsert.mockResolvedValue(expected);

      const result = await repo.upsert("tax_rate", "12");

      expect(result).toEqual(expected);
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: "tax_rate" },
        update: { value: "12" },
        create: { key: "tax_rate", value: "12" },
        select: expect.any(Object),
      });
    });

    /**
     * @test Mengupdate setting jika sudah ada
     */
    it("should update existing setting", async () => {
      const expected = {
        id: "set-1",
        key: "tax_rate",
        value: "15",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      prisma.setting.upsert.mockResolvedValue(expected);

      const result = await repo.upsert("tax_rate", "15");

      expect(result.value).toBe("15");
    });
  });

  /**
   * @describe upsertMany
   */
  describe("upsertMany", () => {
    /**
     * @test Batch upsert multiple settings
     */
    it("should batch upsert multiple settings", async () => {
      const data = {
        tax_rate: "11",
        store_name: "Bengkel Jaya",
        stock_low_threshold: "5",
      };

      const result = await repo.upsertMany(data);

      expect(result).toBe(3);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Promise),
          expect.any(Promise),
          expect.any(Promise),
        ])
      );
    });

    /**
     * @test Mengembalikan 0 ketika data kosong
     */
    it("should return 0 when data is empty", async () => {
      prisma.$transaction.mockResolvedValue([]);

      const result = await repo.upsertMany({});

      expect(result).toBe(0);
    });
  });

  /**
   * @describe update
   */
  describe("update", () => {
    /**
     * @test Mengupdate value setting berdasarkan key
     */
    it("should update setting value by key", async () => {
      const expected = {
        id: "set-1",
        key: "tax_rate",
        value: "12",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      prisma.setting.update.mockResolvedValue(expected);

      const result = await repo.update("tax_rate", "12");

      expect(result).toEqual(expected);
      expect(prisma.setting.update).toHaveBeenCalledWith({
        where: { key: "tax_rate" },
        data: { value: "12" },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus setting berdasarkan key
     */
    it("should delete a setting by key", async () => {
      prisma.setting.delete.mockResolvedValue({});

      await repo.delete("tax_rate");

      expect(prisma.setting.delete).toHaveBeenCalledWith({
        where: { key: "tax_rate" },
      });
    });
  });

  /**
   * @describe exists
   */
  describe("exists", () => {
    /**
     * @test Mengembalikan true ketika key exists
     */
    it("should return true when key exists", async () => {
      prisma.setting.findUnique.mockResolvedValue({ id: "set-1" });

      const result = await repo.exists("tax_rate");

      expect(result).toBe(true);
      expect(prisma.setting.findUnique).toHaveBeenCalledWith({
        where: { key: "tax_rate" },
        select: { id: true },
      });
    });

    /**
     * @test Mengembalikan false ketika key tidak exists
     */
    it("should return false when key does not exist", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.exists("nonexistent");

      expect(result).toBe(false);
    });
  });

  /**
   * @describe getValue
   */
  describe("getValue", () => {
    /**
     * @test Mengembalikan value setting
     */
    it("should return setting value", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "11" });

      const result = await repo.getValue("tax_rate");

      expect(result).toBe("11");
    });

    /**
     * @test Mengembalikan default value ketika key tidak ditemukan
     */
    it("should return default value when key not found", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getValue("tax_rate", "10");

      expect(result).toBe("10");
    });

    /**
     * @test Mengembalikan null ketika tidak ada default
     */
    it("should return null when no default provided", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getValue("nonexistent");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe getIntValue
   */
  describe("getIntValue", () => {
    /**
     * @test Mengembalikan nilai integer
     */
    it("should return integer value", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "5" });

      const result = await repo.getIntValue("mechanic_max_tasks");

      expect(result).toBe(5);
    });

    /**
     * @test Mengembalikan default ketika value tidak valid
     */
    it("should return default when value is invalid", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "not_a_number" });

      const result = await repo.getIntValue("key", 10);

      expect(result).toBe(10);
    });

    /**
     * @test Mengembalikan default ketika key tidak ditemukan
     */
    it("should return default when key not found", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getIntValue("key", 3);

      expect(result).toBe(3);
    });

    /**
     * @test Mengembalikan 0 sebagai default bawaan
     */
    it("should return 0 as default", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getIntValue("key");

      expect(result).toBe(0);
    });
  });

  /**
   * @describe getBoolValue
   */
  describe("getBoolValue", () => {
    /**
     * @test Mengembalikan true untuk string "true"
     */
    it("should return true for string true", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "true" });

      const result = await repo.getBoolValue("feature_enabled");

      expect(result).toBe(true);
    });

    /**
     * @test Mengembalikan true untuk string "1"
     */
    it("should return true for string 1", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "1" });

      const result = await repo.getBoolValue("feature_enabled");

      expect(result).toBe(true);
    });

    /**
     * @test Mengembalikan false untuk string "false"
     */
    it("should return false for string false", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "false" });

      const result = await repo.getBoolValue("feature_enabled");

      expect(result).toBe(false);
    });

    /**
     * @test Mengembalikan false untuk string "0"
     */
    it("should return false for string 0", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "0" });

      const result = await repo.getBoolValue("feature_enabled");

      expect(result).toBe(false);
    });

    /**
     * @test Mengembalikan default ketika key tidak ditemukan
     */
    it("should return default when key not found", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getBoolValue("key", true);

      expect(result).toBe(true);
    });
  });

  /**
   * @describe getJsonValue
   */
  describe("getJsonValue", () => {
    /**
     * @test Mengembalikan parsed JSON object
     */
    it("should return parsed JSON object", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: '{"theme":"dark","lang":"id"}' });

      const result = await repo.getJsonValue("ui_config");

      expect(result).toEqual({ theme: "dark", lang: "id" });
    });

    /**
     * @test Mengembalikan parsed JSON array
     */
    it("should return parsed JSON array", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: '["admin","kasir"]' });

      const result = await repo.getJsonValue("roles");

      expect(result).toEqual(["admin", "kasir"]);
    });

    /**
     * @test Mengembalikan default ketika JSON tidak valid
     */
    it("should return default when JSON is invalid", async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: "invalid json" });

      const result = await repo.getJsonValue("key", { fallback: true });

      expect(result).toEqual({ fallback: true });
    });

    /**
     * @test Mengembalikan null default ketika key tidak ditemukan
     */
    it("should return null default when key not found", async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      const result = await repo.getJsonValue("key");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe setIntValue
   */
  describe("setIntValue", () => {
    /**
     * @test Menyimpan nilai integer sebagai string
     */
    it("should store integer value as string", async () => {
      prisma.setting.upsert.mockResolvedValue({});

      await repo.setIntValue("max_items", 25);

      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { key: "max_items", value: "25" },
          update: { value: "25" },
        })
      );
    });
  });

  /**
   * @describe setBoolValue
   */
  describe("setBoolValue", () => {
    /**
     * @test Menyimpan nilai boolean sebagai string
     */
    it("should store boolean value as string", async () => {
      prisma.setting.upsert.mockResolvedValue({});

      await repo.setBoolValue("feature_enabled", true);

      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { key: "feature_enabled", value: "true" },
          update: { value: "true" },
        })
      );
    });
  });

  /**
   * @describe setJsonValue
   */
  describe("setJsonValue", () => {
    /**
     * @test Menyimpan object sebagai JSON string
     */
    it("should store object as JSON string", async () => {
      prisma.setting.upsert.mockResolvedValue({});

      await repo.setJsonValue("ui_config", { theme: "dark" });

      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { key: "ui_config", value: '{"theme":"dark"}' },
          update: { value: '{"theme":"dark"}' },
        })
      );
    });
  });
});