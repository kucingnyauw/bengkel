import Pagination from "#shared/utils/pagination.js";
import ApiError from "#shared/utils/error.js";

/**
 * Unit test untuk Pagination Utility
 * @describe Pagination
 */
describe("Pagination", () => {
  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Mengembalikan object pagination dengan default params
     */
    it("should return correct pagination object with default params", () => {
      const result = Pagination.create();
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.metadata.currentPage).toBe(1);
      expect(result.metadata.itemsPerPage).toBe(10);
    });

    /**
     * @test Mengembalikan object dengan custom valid params
     */
    it("should return correct object with custom valid params", () => {
      const result = Pagination.create({ page: 2, limit: 20 });
      expect(result.skip).toBe(20);
      expect(result.limit).toBe(20);
      expect(result.metadata.currentPage).toBe(2);
    });

    /**
     * @test Menangani input string yang valid
     */
    it("should handle valid string inputs", () => {
      const result = Pagination.create({ page: "3", limit: "15" });
      expect(result.skip).toBe(30);
      expect(result.limit).toBe(15);
    });

    /**
     * @test Melempar error untuk page tidak valid
     */
    it("should throw error for invalid page", () => {
      expect(() => Pagination.create({ page: 0 })).toThrow(ApiError);
      expect(() => Pagination.create({ page: "abc" })).toThrow(ApiError);
    });

    /**
     * @test Melempar error untuk limit tidak valid
     */
    it("should throw error for invalid limit", () => {
      expect(() => Pagination.create({ limit: 0 })).toThrow(ApiError);
      expect(() => Pagination.create({ limit: 150 })).toThrow(ApiError);
    });
  });

  /**
   * @describe calculateTotalPages
   */
  describe("calculateTotalPages", () => {
    /**
     * @test Menghitung total halaman dengan benar
     */
    it("should calculate correct total pages", () => {
      expect(Pagination.calculateTotalPages(25, 10)).toBe(3);
      expect(Pagination.calculateTotalPages(10, 10)).toBe(1);
      expect(Pagination.calculateTotalPages(1, 10)).toBe(1);
      expect(Pagination.calculateTotalPages(100, 20)).toBe(5);
      expect(Pagination.calculateTotalPages(21, 10)).toBe(3);
    });

    /**
     * @test Mengembalikan 1 untuk totalItems invalid
     */
    it("should return 1 if totalItems is invalid", () => {
      expect(Pagination.calculateTotalPages(0, 10)).toBe(1);
      expect(Pagination.calculateTotalPages(-5, 10)).toBe(1);
      expect(Pagination.calculateTotalPages(null, 10)).toBe(1);
    });

    /**
     * @test Mengembalikan 1 untuk itemsPerPage invalid
     */
    it("should return 1 if itemsPerPage is invalid", () => {
      expect(Pagination.calculateTotalPages(50, 0)).toBe(1);
      expect(Pagination.calculateTotalPages(50, -5)).toBe(1);
    });
  });

  /**
   * @describe generateMetadata
   */
  describe("generateMetadata", () => {
    /**
     * @test Generate metadata untuk halaman pertama
     */
    it("should generate correct metadata for first page", () => {
      const meta = Pagination.generateMetadata(25, 1, 10);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);
      expect(meta.currentPage).toBe(1);
    });

    /**
     * @test Generate metadata untuk halaman tengah
     */
    it("should generate correct metadata for middle page", () => {
      const meta = Pagination.generateMetadata(25, 2, 10);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
    });

    /**
     * @test Generate metadata untuk halaman terakhir
     */
    it("should generate correct metadata for last page", () => {
      const meta = Pagination.generateMetadata(25, 3, 10);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(true);
    });

    /**
     * @test Generate metadata untuk data kosong
     */
    it("should generate metadata for empty data", () => {
      const meta = Pagination.generateMetadata(0, 1, 10);
      expect(meta.totalPages).toBe(1);
      expect(meta.totalItems).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(false);
    });

    /**
     * @test Menangani string input
     */
    it("should handle string inputs", () => {
      const meta = Pagination.generateMetadata("25", "2", "10");
      expect(meta.totalPages).toBe(3);
      expect(meta.currentPage).toBe(2);
    });
  });

  /**
   * @describe validate
   */
  describe("validate", () => {
    /**
     * @test Mengembalikan angka valid
     */
    it("should return valid numbers", () => {
      const { validPage, validLimit } = Pagination.validate(2, 20);
      expect(validPage).toBe(2);
      expect(validLimit).toBe(20);
    });

    /**
     * @test Mengkonversi string ke number
     */
    it("should convert string to number", () => {
      const { validPage, validLimit } = Pagination.validate("3", "15");
      expect(validPage).toBe(3);
      expect(validLimit).toBe(15);
    });

    /**
     * @test Melempar error jika page tidak valid
     */
    it("should throw ApiError if page is invalid", () => {
      expect(() => Pagination.validate(0, 10)).toThrow(ApiError);
      expect(() => Pagination.validate(-1, 10)).toThrow(ApiError);
      expect(() => Pagination.validate("abc", 10)).toThrow(ApiError);
    });

    /**
     * @test Melempar error jika limit tidak valid
     */
    it("should throw ApiError if limit is invalid", () => {
      expect(() => Pagination.validate(1, 0)).toThrow(ApiError);
      expect(() => Pagination.validate(1, -5)).toThrow(ApiError);
      expect(() => Pagination.validate(1, "abc")).toThrow(ApiError);
    });

    /**
     * @test Melempar error jika limit terlalu besar
     */
    it("should throw ApiError if limit is too large", () => {
      expect(() => Pagination.validate(1, 101)).toThrow(ApiError);
      expect(() => Pagination.validate(1, 150)).toThrow(ApiError);
      expect(() => Pagination.validate(1, 100)).not.toThrow();
    });
  });
});