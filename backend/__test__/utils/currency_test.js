import Currency from "#shared/utils/currency.js";

/**
 * Unit test untuk Currency Utility
 * @describe Currency
 */
describe("Currency", () => {
  /**
   * @describe toIDR
   */
  describe("toIDR", () => {
    it("should return 'Rp 0' for null", () => {
      expect(Currency.toIDR(null)).toBe("Rp 0");
    });

    it("should return 'Rp 0' for undefined", () => {
      expect(Currency.toIDR(undefined)).toBe("Rp 0");
    });

    it("should format number to IDR currency string", () => {
      const result = Currency.toIDR(1500000);
      expect(result).toContain("Rp");
      expect(result).toContain("1.500.000");
    });

    it("should format 0 to IDR", () => {
      const result = Currency.toIDR(0);
      expect(result).toContain("Rp");
      expect(result).toContain("0");
    });

    it("should format large number to IDR", () => {
      const result = Currency.toIDR(100000000);
      expect(result).toContain("100.000.000");
    });

    it("should format numeric string to IDR", () => {
      const result = Currency.toIDR("75000");
      expect(result).toContain("75.000");
    });

    it("should throw error for NaN input", () => {
      expect(() => Currency.toIDR("bukan_angka")).toThrow(
        "Jumlah yang dimasukkan tidak valid"
      );
    });

    it("should throw error for object input", () => {
      expect(() => Currency.toIDR({})).toThrow(
        "Jumlah yang dimasukkan tidak valid"
      );
    });

    it("should format decimal number (rounded)", () => {
      const result = Currency.toIDR(1500000.75);
      expect(result).toContain("1.500.001");
    });
  });

  /**
   * @describe toNumber
   */
  describe("toNumber", () => {
    it("should return number if input is already a number", () => {
      expect(Currency.toNumber(50000)).toBe(50000);
    });

    it("should return 0 for input 0", () => {
      expect(Currency.toNumber(0)).toBe(0);
    });

    it("should parse IDR formatted string to number", () => {
      expect(Currency.toNumber("Rp 1.500.000")).toBe(1500000);
    });

    it("should parse string with comma decimal", () => {
      expect(Currency.toNumber("Rp 1.500.000,00")).toBe(1500000);
    });

    it("should parse plain number string", () => {
      expect(Currency.toNumber("1500000")).toBe(1500000);
    });

    it("should parse string with spaces", () => {
      expect(Currency.toNumber("1 500 000")).toBe(1500000);
    });

    it("should parse string with Rp prefix without space", () => {
      expect(Currency.toNumber("Rp1500000")).toBe(1500000);
    });

    it("should throw error for null input", () => {
      expect(() => Currency.toNumber(null)).toThrow(
        "Format mata uang tidak valid"
      );
    });

    it("should throw error for undefined input", () => {
      expect(() => Currency.toNumber(undefined)).toThrow(
        "Format mata uang tidak valid"
      );
    });

    it("should throw error for boolean input", () => {
      expect(() => Currency.toNumber(true)).toThrow(
        "Format mata uang tidak valid"
      );
    });

    it("should throw error for empty string", () => {
      expect(() => Currency.toNumber("")).toThrow(
        "Format mata uang tidak valid"
      );
    });

    it("should not throw for alphabetic string that becomes 0 after sanitize", () => {
      expect(Currency.toNumber("abc")).toBe(0);
    });
  });

  /**
   * @describe formatPlain
   */
  describe("formatPlain", () => {
    it("should return 0 for null", () => {
      expect(Currency.formatPlain(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(Currency.formatPlain(undefined)).toBe(0);
    });

    it("should format number with thousand separators", () => {
      expect(Currency.formatPlain(1500000)).toBe("1.500.000");
    });

    it("should format 0", () => {
      expect(Currency.formatPlain(0)).toBe("0");
    });

    it("should format numeric string", () => {
      expect(Currency.formatPlain("75000")).toBe("75.000");
    });

    it("should format large number", () => {
      expect(Currency.formatPlain(100000000)).toBe("100.000.000");
    });

    it("should throw error for invalid input", () => {
      expect(() => Currency.formatPlain("abc")).toThrow(
        "Nilai angka tidak valid"
      );
    });

    it("should throw error for object input", () => {
      expect(() => Currency.formatPlain({})).toThrow(
        "Nilai angka tidak valid"
      );
    });
  });
});