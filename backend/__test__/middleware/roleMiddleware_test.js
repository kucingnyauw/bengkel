import roleMiddleware from "#middleware/roleMiddleware.js";
import ApiError from "#shared/utils/error.js";

jest.mock("#shared/utils/error.js", () => {
  const actual = jest.requireActual("#shared/utils/error.js");
  return {
    ...actual,
    __esModule: true,
    default: actual.default,
  };
});

/**
 * Unit test untuk Role Middleware
 * @describe roleMiddleware
 */
describe("roleMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: null,
    };

    res = {};

    next = jest.fn();
  });

  /**
   * @describe Unauthorized
   */
  describe("Unauthorized", () => {
    /**
     * @test Melempar unauthorized ketika req.user kosong
     */
    it("should throw unauthorized when req.user is null", async () => {
      const middleware = roleMiddleware({ allowedRoles: ["ADMIN"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Anda harus login terlebih dahulu",
        })
      );
    });

    /**
     * @test Melempar unauthorized ketika req.user undefined
     */
    it("should throw unauthorized when req.user is undefined", async () => {
      req.user = undefined;
      const middleware = roleMiddleware({ allowedRoles: ["CASHIER"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  /**
   * @describe Forbidden
   */
  describe("Forbidden", () => {
    /**
     * @test Melempar forbidden ketika role tidak termasuk dalam allowedRoles
     */
    it("should throw forbidden when role not in allowedRoles", async () => {
      req.user = { id: "user-1", role: "CASHIER", fullName: "Kasir 1" };
      const middleware = roleMiddleware({ allowedRoles: ["ADMIN"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Anda tidak memiliki akses untuk melakukan aksi ini",
        })
      );
    });

    /**
     * @test Melempar forbidden ketika role MECHANIC mencoba akses ADMIN
     */
    it("should throw forbidden when MECHANIC tries to access ADMIN route", async () => {
      req.user = { id: "user-2", role: "MECHANIC", fullName: "Joko" };
      const middleware = roleMiddleware({ allowedRoles: ["ADMIN", "CASHIER"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });
  });

  /**
   * @describe Success
   */
  describe("Success", () => {
    /**
     * @test Melanjutkan ketika role termasuk dalam allowedRoles
     */
    it("should call next when role is in allowedRoles", async () => {
      req.user = { id: "user-1", role: "ADMIN", fullName: "Admin" };
      const middleware = roleMiddleware({ allowedRoles: ["ADMIN"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    /**
     * @test Melanjutkan ketika allowedRoles kosong (semua role diizinkan)
     */
    it("should call next when allowedRoles is empty", async () => {
      req.user = { id: "user-1", role: "CASHIER", fullName: "Kasir 1" };
      const middleware = roleMiddleware({ allowedRoles: [] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    /**
     * @test Melanjutkan ketika allowedRoles tidak diberikan (default empty)
     */
    it("should call next when allowedRoles is not provided", async () => {
      req.user = { id: "user-1", role: "MECHANIC", fullName: "Joko" };
      const middleware = roleMiddleware();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    /**
     * @test Melanjutkan ketika role termasuk dalam multiple allowedRoles
     */
    it("should call next when role matches one of multiple allowedRoles", async () => {
      req.user = { id: "user-1", role: "CASHIER", fullName: "Kasir 1" };
      const middleware = roleMiddleware({ allowedRoles: ["ADMIN", "CASHIER", "MECHANIC"] });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});