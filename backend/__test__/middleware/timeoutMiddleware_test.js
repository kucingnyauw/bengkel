import timeoutMiddleware from "#middleware/timeoutMiddleware.js";
import ApiError from "#shared/utils/error.js";

jest.mock("#shared/utils/error.js", () => {
  const actual = jest.requireActual("#shared/utils/error.js");
  return {
    ...actual,
    requestTimeout: jest.fn(({ message }) => ({
      statusCode: 408,
      message,
    })),
  };
});

/**
 * Unit test untuk Timeout Middleware
 * @describe timeoutMiddleware
 */
describe("timeoutMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * @describe Default Configuration
   */
  describe("Default Configuration", () => {
    /**
     * @test Menggunakan timeout default 5000ms
     */
    it("should use default timeout of 5000ms", () => {
      const middleware = timeoutMiddleware();
      const req = {};
      const res = { once: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();

      jest.advanceTimersByTime(4999);
      expect(next).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @describe Custom Timeout
   */
  describe("Custom Timeout", () => {
    /**
     * @test Menggunakan custom timeout
     */
    it("should use custom timeout when provided", () => {
      const middleware = timeoutMiddleware({ timeoutMs: 10000 });
      const req = {};
      const res = { once: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      jest.advanceTimersByTime(9999);
      expect(next).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @describe Timeout Triggered
   */
  describe("Timeout Triggered", () => {
    /**
     * @test Memanggil next dengan ApiError.requestTimeout ketika timeout tercapai
     */
    it("should call next with requestTimeout when time runs out", () => {
      const middleware = timeoutMiddleware({ timeoutMs: 3000 });
      const req = {};
      const res = { once: jest.fn(), headersSent: false };
      const next = jest.fn();

      middleware(req, res, next);

      jest.advanceTimersByTime(3000);

      expect(next).toHaveBeenLastCalledWith(
        expect.objectContaining({
          statusCode: 408,
          message: expect.stringContaining("3 detik"),
        })
      );
    });

    /**
     * @test Tidak memanggil timeout jika headers sudah terkirim
     */
    it("should not trigger timeout if headers already sent", () => {
      const middleware = timeoutMiddleware({ timeoutMs: 1000 });
      const req = {};
      const res = { once: jest.fn(), headersSent: true };
      const next = jest.fn();

      middleware(req, res, next);

      jest.advanceTimersByTime(1000);

      expect(next).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Tidak memanggil timeout jika sudah di-handle
     */
    it("should not trigger timeout if already handled", () => {
      const middleware = timeoutMiddleware({ timeoutMs: 1000 });
      const req = {};
      const res = {
        once: jest.fn((event, handler) => {
          if (event === "finish") {
            setImmediate(handler);
          }
        }),
        headersSent: false,
      };
      const next = jest.fn();

      middleware(req, res, next);

      jest.advanceTimersByTime(1000);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * @describe Cleanup
   */
  describe("Cleanup", () => {
    /**
     * @test Membersihkan timer ketika response finish
     */
    it("should clean up timer when response finishes", () => {
      let finishHandler;
      const res = {
        once: jest.fn((event, handler) => {
          if (event === "finish") {
            finishHandler = handler;
          }
        }),
        headersSent: false,
      };
      const req = {};
      const next = jest.fn();

      const middleware = timeoutMiddleware({ timeoutMs: 5000 });
      middleware(req, res, next);

      expect(res.once).toHaveBeenCalledWith("finish", expect.any(Function));
      expect(res.once).toHaveBeenCalledWith("close", expect.any(Function));

      finishHandler();

      jest.advanceTimersByTime(5000);

      expect(next).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Membersihkan timer ketika koneksi ditutup
     */
    it("should clean up timer when connection closes", () => {
      let closeHandler;
      const res = {
        once: jest.fn((event, handler) => {
          if (event === "close") {
            closeHandler = handler;
          }
        }),
        headersSent: false,
      };
      const req = {};
      const next = jest.fn();

      const middleware = timeoutMiddleware({ timeoutMs: 5000 });
      middleware(req, res, next);

      closeHandler();

      jest.advanceTimersByTime(5000);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});