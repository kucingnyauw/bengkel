import CacheManager from "#shared/utils/cache.js";
import redis from "#lib/redis.js";


jest.mock("#lib/redis.js", () => ({
  get: jest.fn(),
  set: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  del: jest.fn(),
  srem: jest.fn(),
}));

/**
 * Unit test untuk CacheManager Utility
 * @describe CacheManager
 */
describe("CacheManager", () => {
  let cache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new CacheManager("testns");
  });

  /**
   * @describe Constructor & buildKey
   */
  describe("Constructor & buildKey", () => {
    it("should throw error if prefix is missing", () => {
      expect(() => new CacheManager()).toThrow("Prefix cache wajib diisi");
    });

    it("should build key correctly with prefix", () => {
      expect(cache.buildKey("mykey")).toBe("testns:mykey");
    });

    it("should throw error if key is empty", () => {
      expect(() => cache.buildKey("")).toThrow("Cache key tidak boleh kosong");
    });

    it("should build key with different prefix", () => {
      const otherCache = new CacheManager("order");
      expect(otherCache.buildKey("123")).toBe("order:123");
    });
  });

  /**
   * @describe get
   */
  describe("get", () => {
    it("should return null if key is not found", async () => {
      redis.get.mockResolvedValue(null);
      const result = await cache.get("missing");
      expect(result).toBeNull();
    });

    it("should return parsed JSON object", async () => {
      redis.get.mockResolvedValue('{"name":"John","age":30}');
      const result = await cache.get("user1");
      expect(result).toEqual({ name: "John", age: 30 });
    });

    it("should return parsed JSON array", async () => {
      redis.get.mockResolvedValue("[1,2,3]");
      const result = await cache.get("numbers");
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return raw string if JSON parsing fails", async () => {
      redis.get.mockResolvedValue("plain-string-value");
      const result = await cache.get("token");
      expect(result).toBe("plain-string-value");
    });

    it("should return null for empty string", async () => {
      redis.get.mockResolvedValue("");
      const result = await cache.get("empty");
      expect(result).toBeNull();
    });
  });

  /**
   * @describe set
   */
  describe("set", () => {
    it("should store string value directly", async () => {
      await cache.set("key1", "stringval", 120);
      expect(redis.set).toHaveBeenCalledWith("testns:key1", "stringval", { ex: 120 });
      expect(redis.sadd).toHaveBeenCalledWith("testns:__index__", "testns:key1");
    });

    it("should stringify object value before storing", async () => {
      const obj = { id: 1, name: "Test" };
      await cache.set("key2", obj);
      expect(redis.set).toHaveBeenCalledWith("testns:key2", JSON.stringify(obj), { ex: 60 });
    });

    it("should stringify number value before storing", async () => {
      await cache.set("key3", 42, 300);
      expect(redis.set).toHaveBeenCalledWith("testns:key3", "42", { ex: 300 });
    });

    it("should stringify boolean value before storing", async () => {
      await cache.set("key4", true);
      expect(redis.set).toHaveBeenCalledWith("testns:key4", "true", { ex: 60 });
    });

    it("should use default TTL of 60 seconds", async () => {
      await cache.set("key5", "value");
      expect(redis.set).toHaveBeenCalledWith("testns:key5", "value", { ex: 60 });
    });
  });

  /**
   * @describe invalidate
   */
  describe("invalidate", () => {
    it("should do nothing if index is empty", async () => {
      redis.smembers.mockResolvedValue([]);
      await cache.invalidate("pattern");
      expect(redis.del).not.toHaveBeenCalled();
    });

    it("should do nothing if index is null", async () => {
      redis.smembers.mockResolvedValue(null);
      await cache.invalidate("pattern");
      expect(redis.del).not.toHaveBeenCalled();
    });

    it("should delete keys matching pattern", async () => {
      redis.smembers.mockResolvedValue(["testns:user:1", "testns:user:2", "testns:order:1"]);
      await cache.invalidate("user:");
      expect(redis.del).toHaveBeenCalledWith(["testns:user:1", "testns:user:2"]);
    });

    it("should do nothing if no keys match pattern", async () => {
      redis.smembers.mockResolvedValue(["testns:order:1"]);
      await cache.invalidate("user:");
      expect(redis.del).not.toHaveBeenCalled();
    });

    it("should delete all keys when pattern matches all", async () => {
      redis.smembers.mockResolvedValue(["testns:a", "testns:b"]);
      await cache.invalidate("testns");
      expect(redis.del).toHaveBeenCalledWith(["testns:a", "testns:b"]);
    });
  });

  /**
   * @describe invalidateAll
   */
  describe("invalidateAll", () => {
    it("should delete all keys and reset index", async () => {
      redis.smembers.mockResolvedValue(["testns:k1", "testns:k2"]);
      await cache.invalidateAll();
      expect(redis.del).toHaveBeenCalledWith(["testns:k1", "testns:k2"]);
      expect(redis.del).toHaveBeenCalledWith("testns:__index__");
    });

    it("should do nothing if index is empty", async () => {
      redis.smembers.mockResolvedValue([]);
      await cache.invalidateAll();
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  /**
   * @describe Distributed Lock
   */
  describe("Distributed Lock", () => {
    describe("acquireLock", () => {
      it("should return lock object if successful", async () => {
        redis.set.mockResolvedValue("OK");

        const result = await cache.acquireLock("process", 30);

        expect(result).toMatchObject({
          lockKey: "testns:lock:process",
          token: expect.any(String),
        });
        expect(redis.set).toHaveBeenCalledWith(
          "testns:lock:process",
          expect.any(String),
          { nx: true, ex: 30 }
        );
      });

      it("should return null if lock is already taken", async () => {
        redis.set.mockResolvedValue(null);
        const result = await cache.acquireLock("process");
        expect(result).toBeNull();
      });

      it("should use default TTL of 10 seconds", async () => {
        redis.set.mockResolvedValue("OK");

        await cache.acquireLock("task");

        expect(redis.set).toHaveBeenCalledWith(
          "testns:lock:task",
          expect.any(String),
          { nx: true, ex: 10 }
        );
      });
    });

    describe("releaseLock", () => {
      it("should do nothing if lock object is null", async () => {
        await cache.releaseLock(null);
        expect(redis.get).not.toHaveBeenCalled();
      });

      it("should delete lock if token matches", async () => {
        redis.get.mockResolvedValue("mock-uuid");

        await cache.releaseLock({
          lockKey: "testns:lock:process",
          token: "mock-uuid",
        });

        expect(redis.get).toHaveBeenCalledWith("testns:lock:process");
        expect(redis.del).toHaveBeenCalledWith("testns:lock:process");
      });

      it("should NOT delete lock if token mismatches", async () => {
        redis.get.mockResolvedValue("another-uuid");

        await cache.releaseLock({
          lockKey: "testns:lock:process",
          token: "mock-uuid",
        });

        expect(redis.del).not.toHaveBeenCalled();
      });

      it("should not delete if lock key no longer exists", async () => {
        redis.get.mockResolvedValue(null);

        await cache.releaseLock({
          lockKey: "testns:lock:process",
          token: "mock-uuid",
        });

        expect(redis.del).not.toHaveBeenCalled();
      });
    });
  });

  /**
   * @describe indexKey
   */
  describe("indexKey", () => {
    it("should have correct index key format", () => {
      expect(cache.indexKey).toBe("testns:__index__");
    });
  });
});