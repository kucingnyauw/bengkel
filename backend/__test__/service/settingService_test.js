import SettingService from "#service/settingService.js";

jest.mock("#repository/settingRepository.js");

/**
 * Unit test untuk SettingService
 * @describe SettingService
 */
describe("SettingService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SettingService();
    service.clearCache();
  });

  /**
   * @describe get
   */
  describe("get", () => {
    /**
     * @test Mengembalikan nilai dari database ketika tidak ada cache
     */
    it("should return value from database when not cached", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.get("tax_rate");
      expect(result).toBe("11");
    });

    /**
     * @test Mengembalikan default value ketika setting tidak ditemukan
     */
    it("should return default value when not found", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.get("unknown", "default");
      expect(result).toBe("default");
    });

    /**
     * @test Menggunakan cache pada pemanggilan berikutnya
     */
    it("should use cache on subsequent calls", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.get("tax_rate");
      const result = await service.get("tax_rate");

      expect(result).toBe("11");
      expect(SettingRepository.mock.instances[0].findByKey).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Mengembalikan null ketika tidak ada default
     */
    it("should return null when no default provided", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.get("missing");
      expect(result).toBeNull();
    });
  });

  /**
   * @describe getNumber
   */
  describe("getNumber", () => {
    /**
     * @test Mengembalikan nilai number
     */
    it("should return number value", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.getNumber("tax_rate");
      expect(result).toBe(11);
    });

    /**
     * @test Mengembalikan default number
     */
    it("should return default number when not found", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown", 5);
      expect(result).toBe(5);
    });

    /**
     * @test Mengembalikan 0 sebagai default
     */
    it("should return 0 as default", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown");
      expect(result).toBe(0);
    });
  });

  /**
   * @describe getBoolean
   */
  describe("getBoolean", () => {
    /**
     * @test Mengembalikan true untuk string "true"
     */
    it("should return true for string true", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "feature", value: "true" });

      const result = await service.getBoolean("feature");
      expect(result).toBe(true);
    });

    /**
     * @test Mengembalikan false untuk string "false"
     */
    it("should return false for string false", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "feature", value: "false" });

      const result = await service.getBoolean("feature");
      expect(result).toBe(false);
    });

    /**
     * @test Mengembalikan default ketika tidak ditemukan
     */
    it("should return default when not found", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.getBoolean("unknown", true);
      expect(result).toBe(true);
    });
  });

  /**
   * @describe getString
   */
  describe("getString", () => {
    /**
     * @test Mengkonversi nilai ke string
     */
    it("should convert value to string", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "shop", value: 12345 });

      const result = await service.getString("shop");
      expect(result).toBe("12345");
    });

    /**
     * @test Mengembalikan string kosong sebagai default
     */
    it("should return empty string as default", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue(null);

      const result = await service.getString("unknown");
      expect(result).toBe("");
    });
  });

  /**
   * @describe set
   */
  describe("set", () => {
    /**
     * @test Upsert setting dan konversi nilai ke string
     */
    it("should upsert setting and convert value to string", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].upsert.mockResolvedValue({ key: "tax_rate", value: "12" });

      await service.set("tax_rate", 12);
      expect(SettingRepository.mock.instances[0].upsert).toHaveBeenCalledWith("tax_rate", "12");
    });

    /**
     * @test Invalidasi cache setelah update
     */
    it("should invalidate cache after update", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.get("tax_rate");
      expect(SettingRepository.mock.instances[0].findByKey).toHaveBeenCalledTimes(1);

      SettingRepository.mock.instances[0].upsert.mockResolvedValue({ key: "tax_rate", value: "12" });
      await service.set("tax_rate", "12");

      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "12" });
      const result = await service.get("tax_rate");

      expect(result).toBe("12");
      expect(SettingRepository.mock.instances[0].findByKey).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @describe getAll
   */
  describe("getAll", () => {
    /**
     * @test Mengembalikan semua settings
     */
    it("should return all settings", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findAll.mockResolvedValue([
        { key: "tax_rate", value: "11" },
        { key: "max_tasks", value: "5" },
      ]);

      const result = await service.getAll();
      expect(result).toHaveLength(2);
    });

    /**
     * @test Mengembalikan array kosong
     */
    it("should return empty array", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findAll.mockResolvedValue([]);

      const result = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  /**
   * @describe clearCache
   */
  describe("clearCache", () => {
    /**
     * @test Menghapus cache sehingga get berikutnya fetch dari DB
     */
    it("should clear cache so next get hits repository", async () => {
      const { SettingRepository } = require("#repository/settingRepository.js");
      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.get("tax_rate");
      expect(SettingRepository.mock.instances[0].findByKey).toHaveBeenCalledTimes(1);

      service.clearCache();

      SettingRepository.mock.instances[0].findByKey.mockResolvedValue({ key: "tax_rate", value: "15" });
      const result = await service.get("tax_rate");

      expect(result).toBe("15");
      expect(SettingRepository.mock.instances[0].findByKey).toHaveBeenCalledTimes(2);
    });
  });
});