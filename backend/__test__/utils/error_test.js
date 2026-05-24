import ApiError from "#shared/utils/error.js";

describe("ApiError Utility", () => {
  it("should create standard error object", () => {
    const err = new ApiError({ message: "Test error" });
    expect(err.message).toBe("Test error");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("should serialize toJSON correctly", () => {
    const err = new ApiError({ message: "Error", details: { field: "name" } });
    const json = err.toJSON();
    expect(json.success).toBe(false);
    expect(json.message).toBe("Error");
    expect(json.details).toEqual({ field: "name" });
  });

  describe("Static Error Methods", () => {
    it("should create badRequest (400)", () => {
      const err = ApiError.badRequest({ message: "Bad" });
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Bad");
    });

    it("should create unauthorized (401)", () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
    });

    it("should create forbidden (403)", () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
    });

    it("should create notFound (404)", () => {
      const err = ApiError.notFound();
      expect(err.statusCode).toBe(404);
    });

    it("should create requestTimeout (408)", () => {
      const err = ApiError.requestTimeout();
      expect(err.statusCode).toBe(408);
    });

    it("should create conflict (409)", () => {
      const err = ApiError.conflict();
      expect(err.statusCode).toBe(409);
    });

    it("should create unprocessableEntity (422)", () => {
      const err = ApiError.unprocessableEntity();
      expect(err.statusCode).toBe(422);
    });

    it("should create tooManyRequests (429) with retry details", () => {
      const err = ApiError.tooManyRequests({ retryAfter: 120 });
      expect(err.statusCode).toBe(429);
      expect(err.details.retryAfter).toBe(120);
    });

    it("should create internal (500)", () => {
      const err = ApiError.internal();
      expect(err.statusCode).toBe(500);
    });

    it("should create serviceUnavailable (503)", () => {
      const err = ApiError.serviceUnavailable();
      expect(err.statusCode).toBe(503);
    });

    it("should create gatewayTimeout (504)", () => {
      const err = ApiError.gatewayTimeout();
      expect(err.statusCode).toBe(504);
    });
  });
});