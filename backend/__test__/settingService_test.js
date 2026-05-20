// __test__/settingService_test.js
import SettingService from "#service/settingService.js";
import SettingRepository from "#repository/settingRepository.js";

jest.mock("#repository/settingRepository.js");

describe("SettingService", () => {
  let service;
  let mockSettingRepo;

  beforeEach(() => {
    // Clear all mocks and create a fresh service instance
    jest.clearAllMocks();
    service = new SettingService();
    mockSettingRepo = SettingRepository.mock.instances[0];
    // Ensure cache is clean for every test
    service.clearCache();
  });

  describe("get", () => {
    it("should return setting value from database when not cached", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.get("tax_rate");

      expect(result).toBe("11");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledWith("tax_rate");
    });

    it("should return default value when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.get("unknown_key", "default");

      expect(result).toBe("default");
    });

    it("should return cached value on subsequent calls without hitting the repository", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      // First call: fetch from repo and cache
      await service.get("tax_rate");
      // Second call: should hit cache
      const result = await service.get("tax_rate");

      expect(result).toBe("11");
      // Repository should have been called only once
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });

    it("should return null as default when no default provided and setting missing", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.get("missing_key");

      expect(result).toBeNull();
    });
  });

  describe("getNumber", () => {
    it("should return setting value converted to a number", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.getNumber("tax_rate");

      expect(result).toBe(11);
    });

    it("should return default number when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown", 5);

      expect(result).toBe(5);
    });

    it("should return 0 as default when no default provided", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown");

      expect(result).toBe(0);
    });

    it("should return NaN when value cannot be parsed as a number", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "name", value: "bengkel" });

      const result = await service.getNumber("name");

      expect(result).toBeNaN();
    });
  });

  describe("getBoolean", () => {
    it("should return true when stored value is string \"true\"", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature_enabled", value: "true" });

      const result = await service.getBoolean("feature_enabled");

      expect(result).toBe(true);
    });

    it("should return true when stored value is boolean true (edge case)", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "flag", value: true });

      const result = await service.getBoolean("flag");

      expect(result).toBe(true);
    });

    it("should return false when stored value is string \"false\"", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature_enabled", value: "false" });

      const result = await service.getBoolean("feature_enabled");

      expect(result).toBe(false);
    });

    it("should return false when stored value is any other non-true value", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "some_key", value: "anything" });

      const result = await service.getBoolean("some_key");

      expect(result).toBe(false);
    });

    it("should return default value when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getBoolean("unknown", true);

      expect(result).toBe(true);
    });

    it("should return false as default when no default provided", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getBoolean("unknown");

      expect(result).toBe(false);
    });
  });

  describe("getString", () => {
    it("should convert any stored value to a string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "shop_name", value: 12345 });

      const result = await service.getString("shop_name");

      expect(result).toBe("12345");
    });

    it("should return default empty string when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getString("unknown");

      expect(result).toBe("");
    });

    it("should return the provided default string when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getString("unknown", "fallback");

      expect(result).toBe("fallback");
    });
  });

  describe("set", () => {
    it("should upsert the setting and convert value to string", async () => {
      mockSettingRepo.upsert.mockResolvedValue({ key: "tax_rate", value: "12" });

      await service.set("tax_rate", 12);

      expect(mockSettingRepo.upsert).toHaveBeenCalledWith("tax_rate", "12");
    });

    it("should invalidate the cache for the updated key", async () => {
      // First load into cache
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });
      await service.get("tax_rate");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);

      // Update the setting
      mockSettingRepo.upsert.mockResolvedValue({ key: "tax_rate", value: "12" });
      await service.set("tax_rate", "12");

      // Next get should fetch from DB again because cache was cleared
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "12" });
      const result = await service.get("tax_rate");

      expect(result).toBe("12");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);
    });
  });

  describe("getAll", () => {
    it("should return all settings from the repository", async () => {
      const mockSettings = [
        { key: "tax_rate", value: "11" },
        { key: "mechanic_max_tasks", value: "5" },
      ];
      mockSettingRepo.findAll.mockResolvedValue(mockSettings);

      const result = await service.getAll();

      expect(result).toEqual(mockSettings);
      expect(result).toHaveLength(2);
      expect(mockSettingRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when no settings exist", async () => {
      mockSettingRepo.findAll.mockResolvedValue([]);
      const result = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached settings so next get hits the repository", async () => {
      // Populate cache
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });
      await service.get("tax_rate");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Next get must call the repository again
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "15" });
      const result = await service.get("tax_rate");

      expect(result).toBe("15");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);
    });
  });
});