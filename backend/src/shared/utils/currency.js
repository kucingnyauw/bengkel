class Currency {
  static toIDR(amount) {
    if (amount === null || amount === undefined) {
      return "Rp 0";
    }

    const value = Number(amount);

    if (Number.isNaN(value)) {
      throw new Error(
        "Jumlah yang dimasukkan tidak valid untuk format mata uang."
      );
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static toNumber(formatted) {
    if (typeof formatted === "number") return formatted;

    if (!formatted || typeof formatted !== "string") {
      throw new Error(
        "Format mata uang tidak valid. Pastikan input berupa teks yang benar."
      );
    }

    const parsed = Number(
      formatted.replace(/[^0-9,-]+/g, "").replace(",", ".")
    );

    if (Number.isNaN(parsed)) {
      throw new Error("Gagal mengonversi mata uang. Format tidak dikenali.");
    }

    return parsed;
  }

  static formatPlain(amount) {
    if (amount === null || amount === undefined) return 0;

    const value = Number(amount);

    if (Number.isNaN(value)) {
      throw new Error("Nilai angka tidak valid untuk diformat.");
    }

    return new Intl.NumberFormat("id-ID").format(value);
  }
}

export default Currency;
