import crypto from "crypto";

/**
 * Utility untuk generate kode unik
 * @class CodeGenerator
 */
class CodeGenerator {
  /**
   * Generate nomor order
   * Format: ORD-YYYYMMDD-XXXX
   * @returns {Promise<string>} Nomor order
   */
  static async orderNumber() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const rand = crypto.randomBytes(2).toString("hex").toUpperCase();

    return `ORD-${yyyy}${mm}${dd}-${rand}`;
  }

  /**
   * Generate SKU produk berdasarkan tipe
   * @param {"SPAREPART"|"SERVICE"} type - Tipe produk
   * @param {string} [lastSku] - SKU terakhir untuk increment
   * @returns {Promise<string>} SKU produk
   */
  static async productSku(type, lastSku) {
    const prefix = type === "SPAREPART" ? "SP" : "SV";

    if (!lastSku) {
      return `${prefix}-001`;
    }

    const match = lastSku.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) {
      return `${prefix}-001`;
    }

    const nextNumber = parseInt(match[1]) + 1;
    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }
}

export default CodeGenerator;
