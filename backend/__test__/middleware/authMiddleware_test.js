import authMiddleware from "#middleware/authMiddleware.js";
import supabase from "#lib/supabase.js";
import ApiError from "#shared/utils/error.js";

jest.mock("#lib/supabase.js", () => ({
  auth: {
    getUser: jest.fn(),
  },
}));

jest.mock("#repository/userRepository.js", () => {
  return jest.fn().mockImplementation(() => ({
    findByEmail: jest.fn(),
    updateAuthStatus: jest.fn(),
  }));
});

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
});

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

/**
 * Unit test untuk Auth Middleware
 * @describe authMiddleware
 */
describe("authMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      method: "GET",
      originalUrl: "/api/v1/products",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  /**
   * @describe Authorization Header
   */
  describe("Authorization Header", () => {
    /**
     * @test Melempar error ketika tidak ada authorization header
     */
    it("should throw unauthorized when no authorization header", async () => {
      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("login"),
        })
      );
    });

    /**
     * @test Melempar error ketika format token tidak valid
     */
    it("should throw unauthorized when token format is invalid", async () => {
      req.headers.authorization = "InvalidFormat token123";

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Format token"),
        })
      );
    });
  });

  /**
   * @describe Supabase Verification
   */
  describe("Supabase Verification", () => {
    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
    });

    /**
     * @test Melempar error ketika sesi expired
     */
    it("should throw unauthorized when session expired", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "JWT expired" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login Anda sudah berakhir"),
        })
      );
    });

    /**
     * @test Melempar error ketika JWT invalid
     */
    it("should throw unauthorized when JWT is invalid", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "invalid JWT" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login Anda sudah berakhir"),
        })
      );
    });

    /**
     * @test Melempar error ketika layanan auth tidak tersedia
     */
    it("should throw service unavailable when auth service error", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Internal server error" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringContaining("Layanan autentikasi sedang mengalami gangguan"),
        })
      );
    });

    /**
     * @test Melempar error ketika user tidak ditemukan di Supabase
     */
    it("should throw unauthorized when no user in Supabase response", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login tidak valid"),
        })
      );
    });

    /**
     * @test Melempar error ketika Supabase throw unexpected error
     */
    it("should handle unexpected Supabase errors", async () => {
      supabase.auth.getUser.mockRejectedValue(new Error("Network error"));

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringContaining("Tidak dapat terhubung ke layanan autentikasi"),
        })
      );
    });
  });

  /**
   * @describe User Validation
   */
  describe("User Validation", () => {
    const mockSupabaseUser = { email: "kasir@bengkel.com" };

    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });
    });

    /**
     * @test Melempar error ketika user tidak ditemukan di database
     */
    it("should throw unauthorized when user not found in database", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      UserRepository.mock.instances[0].findByEmail.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Akun tidak ditemukan"),
        })
      );
    });

    /**
     * @test Melempar error ketika akun tidak aktif
     */
    it("should throw forbidden when account is inactive", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      UserRepository.mock.instances[0].findByEmail.mockResolvedValue({
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: false,
        isAuthenticated: false,
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining("tidak aktif"),
        })
      );
    });

    /**
     * @test Update status autentikasi jika belum terautentikasi
     */
    it("should update auth status when not authenticated", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: true,
        isAuthenticated: false,
        role: "CASHIER",
      };

      UserRepository.mock.instances[0].findByEmail.mockResolvedValue(mockUser);
      UserRepository.mock.instances[0].updateAuthStatus.mockResolvedValue();

      await authMiddleware(req, res, next);

      expect(UserRepository.mock.instances[0].updateAuthStatus).toHaveBeenCalledWith("user-1");
      expect(req.user.isAuthenticated).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });

    /**
     * @test Melewati update jika sudah terautentikasi
     */
    it("should skip update when already authenticated", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: true,
        isAuthenticated: true,
        role: "CASHIER",
      };

      UserRepository.mock.instances[0].findByEmail.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(UserRepository.mock.instances[0].updateAuthStatus).not.toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  /**
   * @describe Cache
   */
  describe("Cache", () => {
    const mockSupabaseUser = { email: "kasir@bengkel.com" };
    const mockUser = {
      id: "user-1",
      email: "kasir@bengkel.com",
      isActive: true,
      isAuthenticated: true,
      role: "CASHIER",
    };

    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });
    });

    /**
     * @test Menggunakan cache ketika user sudah di-cache
     */
    it("should use cached user when available", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { default: CacheManager } = require("#shared/utils/cache.js");

      CacheManager.mock.instances[0].get.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(CacheManager.mock.instances[0].get).toHaveBeenCalledWith("email:kasir@bengkel.com");
      expect(UserRepository.mock.instances[0].findByEmail).not.toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    /**
     * @test Fetch dari database dan cache ketika tidak ada di cache
     */
    it("should fetch from database and cache when not cached", async () => {
      const { UserRepository } = require("#repository/userRepository.js");
      const { default: CacheManager } = require("#shared/utils/cache.js");

      CacheManager.mock.instances[0].get.mockResolvedValue(null);
      UserRepository.mock.instances[0].findByEmail.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(CacheManager.mock.instances[0].set).toHaveBeenCalledWith(
        "email:kasir@bengkel.com",
        mockUser,
        3600
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });
});