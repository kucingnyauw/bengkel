import CodeGenerator from "#shared/utils/code.js";
import crypto from "crypto";

describe("CodeGenerator Utility", () => {
  beforeAll(() => {
    // Kunci waktu sistem untuk memastikan output tanggal selalu sama
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-24T10:00:00Z")); 
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("orderNumber()", () => {
    it("should generate order number with correct format (ORD-YYYYMMDD-HEX)", async () => {
      // Spy on crypto untuk mengontrol output random
      jest.spyOn(crypto, "randomBytes").mockImplementation(() => Buffer.from([10, 255])); // 0a ff
      
      const result = await CodeGenerator.orderNumber();
      
      // 2026 -> YYYY, 05 -> MM, 24 -> DD, 0AFF -> uppercase hex
      expect(result).toBe("ORD-20260524-0AFF");
      
      crypto.randomBytes.mockRestore();
    });
  });

  describe("productSku()", () => {
    it("should return base SPAREPART SKU if lastSku is missing", async () => {
      const result = await CodeGenerator.productSku("SPAREPART");
      expect(result).toBe("SP-001");
    });

    it("should return base SERVICE SKU if lastSku is missing", async () => {
      const result = await CodeGenerator.productSku("SERVICE");
      expect(result).toBe("SV-001");
    });

    it("should return base SKU if lastSku format is completely invalid", async () => {
      const result = await CodeGenerator.productSku("SPAREPART", "INVALID_FORMAT");
      expect(result).toBe("SP-001");
    });

    it("should increment SPAREPART SKU correctly", async () => {
      const result = await CodeGenerator.productSku("SPAREPART", "SP-005");
      expect(result).toBe("SP-006");
    });

    it("should increment SERVICE SKU correctly", async () => {
      const result = await CodeGenerator.productSku("SERVICE", "SV-099");
      expect(result).toBe("SV-100");
    });

    it("should return base SKU if prefix mismatched (fails regex)", async () => {
      // Mencoba mencari SV- di pattern SP-
      const result = await CodeGenerator.productSku("SPAREPART", "SV-010");
      expect(result).toBe("SP-001");
    });
  });
});