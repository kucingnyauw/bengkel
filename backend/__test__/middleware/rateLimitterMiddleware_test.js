import rateLimiterMiddleware from "#middleware/rateLimiterMiddleware.js";
import rateLimit from "express-rate-limit";
import ApiError from "#shared/utils/error.js";

jest.mock("express-rate-limit", () => {
  return jest.fn();
});

jest.mock("#shared/utils/error.js", () => {
  const actual = jest.requireActual("#shared/utils/error.js");
  return {
    ...actual,
    tooManyRequests: jest.fn(({ message }) => ({
      statusCode: 429,
      message,
    })),
  };
});

/**
 * Unit test untuk Rate Limiter Middleware
 * @describe rateLimiterMiddleware
 */
describe("rateLimiterMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @describe Default Configuration
   */
  describe("Default Configuration", () => {
    /**
     * @test Membuat rate limiter dengan nilai default
     */
    it("should create rate limiter with default values", () => {
      rateLimiterMiddleware();

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60000,
          max: 100,
          standardHeaders: true,
          legacyHeaders: false,
        })
      );
    });
  });

  /**
   * @describe Custom Options
   */
  describe("Custom Options", () => {
    /**
     * @test Membuat rate limiter dengan custom windowMs dan max
     */
    it("should create rate limiter with custom windowMs and max", () => {
      rateLimiterMiddleware({ windowMs: 30000, max: 50 });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 30000,
          max: 50,
        })
      );
    });

    /**
     * @test Membuat rate limiter dengan custom message
     */
    it("should create rate limiter with custom message", () => {
      rateLimiterMiddleware({ message: "Custom rate limit message" });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 100,
        })
      );
    });

    /**
     * @test Membuat rate limiter dengan skipFailedRequests
     */
    it("should create rate limiter with skipFailedRequests", () => {
      rateLimiterMiddleware({ skipFailedRequests: true });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          skipFailedRequests: true,
        })
      );
    });

    /**
     * @test Membuat rate limiter dengan skipSuccessfulRequests
     */
    it("should create rate limiter with skipSuccessfulRequests", () => {
      rateLimiterMiddleware({ skipSuccessfulRequests: true });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          skipSuccessfulRequests: true,
        })
      );
    });
  });

  /**
   * @describe Key Generator
   */
  describe("Key Generator", () => {
    /**
     * @test Menggunakan custom keyGenerator jika disediakan
     */
    it("should use custom keyGenerator when provided", () => {
      const customKeyGen = jest.fn().mockReturnValue("custom-key");

      rateLimiterMiddleware({ keyGenerator: customKeyGen });

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { user: { id: "user-1" }, ip: "192.168.1.1" };

      const result = callArgs.keyGenerator(req);

      expect(result).toBe("custom-key");
      expect(customKeyGen).toHaveBeenCalledWith(req);
    });

    /**
     * @test Menggunakan user.id sebagai key ketika user terautentikasi
     */
    it("should use user.id as key when authenticated", () => {
      rateLimiterMiddleware();

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { user: { id: "user-1" }, ip: "192.168.1.1" };

      const result = callArgs.keyGenerator(req);

      expect(result).toBe("user-1");
    });

    /**
     * @test Menggunakan IP sebagai key ketika user tidak terautentikasi
     */
    it("should use IP as key when not authenticated", () => {
      rateLimiterMiddleware();

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { user: null, ip: "192.168.1.1" };

      const result = callArgs.keyGenerator(req);

      expect(result).toBeDefined();
    });
  });

  /**
   * @describe Skip Function
   */
  describe("Skip Function", () => {
    /**
     * @test Meneruskan skip function jika disediakan
     */
    it("should pass skip function when provided", () => {
      const skipFn = jest.fn().mockReturnValue(true);

      rateLimiterMiddleware({ skip: skipFn });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: skipFn,
        })
      );
    });

    /**
     * @test Tidak menyertakan skip jika tidak disediakan
     */
    it("should not include skip when not provided", () => {
      rateLimiterMiddleware();

      expect(rateLimit).toHaveBeenCalledWith(
        expect.not.objectContaining({
          skip: expect.any(Function),
        })
      );
    });
  });

  /**
   * @describe Handler
   */
  describe("Handler", () => {
    /**
     * @test Handler mengembalikan ApiError.tooManyRequests dengan pesan default
     */
    it("should return tooManyRequests with default message", () => {
      rateLimiterMiddleware();

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { ip: "192.168.1.1" };
      const res = { set: jest.fn() };
      const next = jest.fn();
      const limiterOptions = { windowMs: 60000 };

      callArgs.handler(req, res, next, limiterOptions);

      expect(res.set).toHaveBeenCalledWith("Retry-After", "60");
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: expect.stringContaining("60 detik"),
        })
      );
    });

    /**
     * @test Handler mengembalikan ApiError.tooManyRequests dengan custom message
     */
    it("should return tooManyRequests with custom message", () => {
      rateLimiterMiddleware({ message: "Custom limit reached" });

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { ip: "192.168.1.1" };
      const res = { set: jest.fn() };
      const next = jest.fn();
      const limiterOptions = { windowMs: 30000 };

      callArgs.handler(req, res, next, limiterOptions);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: "Custom limit reached",
        })
      );
    });

    /**
     * @test Handler menghitung retryAfter dengan benar untuk windowMs ganjil
     */
    it("should calculate retryAfter correctly for odd windowMs", () => {
      rateLimiterMiddleware();

      const callArgs = rateLimit.mock.calls[0][0];
      const req = { ip: "192.168.1.1" };
      const res = { set: jest.fn() };
      const next = jest.fn();
      const limiterOptions = { windowMs: 45000 };

      callArgs.handler(req, res, next, limiterOptions);

      expect(res.set).toHaveBeenCalledWith("Retry-After", "45");
    });
  });
});