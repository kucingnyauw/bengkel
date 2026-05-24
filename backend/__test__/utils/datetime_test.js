import DateTime from "#shared/utils/datetime.js";

/**
 * Unit test untuk DateTime Utility
 * @describe DateTime
 */
describe("DateTime", () => {
  const fixedDate = new Date("2026-05-24T14:30:00");

  /**
   * @describe Formatters
   */
  describe("Formatters", () => {
    /**
     * @test Menangani null/undefined input dengan graceful
     */
    it("should handle null/undefined input gracefully", () => {
      expect(DateTime.toFullID(null)).toBe("-");
      expect(DateTime.toDateID(null)).toBe("-");
      expect(DateTime.toTimeID(null)).toBe("-");
      expect(DateTime.toShortDate(null)).toBe("-");
      expect(DateTime.toISODate(null)).toBe("-");
      expect(DateTime.toISODateTime(null)).toBe("-");
      expect(DateTime.getDayName(null)).toBe("-");
      expect(DateTime.getMonthName(null)).toBe("-");
      expect(DateTime.toFileName(null)).toBe("-");
      expect(DateTime.toSmartDate(null)).toBe("-");
      expect(DateTime.toRelative(null)).toBe("-");
    });

    /**
     * @test Format toFullID dengan benar
     */
    it("should format toFullID correctly", () => {
      const result = DateTime.toFullID(fixedDate);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * @test Format toDateID
     */
    it("should format toDateID correctly", () => {
      const result = DateTime.toDateID(fixedDate);
      expect(result).toContain("Mei");
      expect(result).toContain("2026");
    });

    /**
     * @test Format toTimeID menampilkan waktu dalam format lokal
     */
    it("should format toTimeID in local format", () => {
      const result = DateTime.toTimeID(fixedDate);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * @test Format toShortDate
     */
    it("should format toShortDate correctly", () => {
      expect(DateTime.toShortDate(fixedDate)).toBe("24/05/2026");
    });

    /**
     * @test Format toISODate
     */
    it("should format toISODate correctly", () => {
      expect(DateTime.toISODate(fixedDate)).toBe("2026-05-24");
    });

    /**
     * @test Format toISODateTime
     */
    it("should format toISODateTime correctly", () => {
      const result = DateTime.toISODateTime(fixedDate);
      expect(result).toMatch(/2026-05-24 \d{2}:\d{2}:\d{2}/);
    });

    /**
     * @test Mengembalikan nama hari yang benar
     */
    it("should return correct day name", () => {
      expect(DateTime.getDayName(new Date("2026-05-24"))).toBe("Minggu");
      expect(DateTime.getDayName(new Date("2026-05-25"))).toBe("Senin");
      expect(DateTime.getDayName(new Date("2026-05-26"))).toBe("Selasa");
      expect(DateTime.getDayName(new Date("2026-05-27"))).toBe("Rabu");
      expect(DateTime.getDayName(new Date("2026-05-28"))).toBe("Kamis");
      expect(DateTime.getDayName(new Date("2026-05-29"))).toBe("Jumat");
      expect(DateTime.getDayName(new Date("2026-05-30"))).toBe("Sabtu");
    });

    /**
     * @test Mengembalikan nama bulan yang benar
     */
    it("should return correct month name", () => {
      expect(DateTime.getMonthName(new Date("2026-01-15"))).toBe("Januari");
      expect(DateTime.getMonthName(fixedDate)).toBe("Mei");
      expect(DateTime.getMonthName(new Date("2026-12-25"))).toBe("Desember");
    });

    /**
     * @test Format toFileName
     */
    it("should format toFileName correctly", () => {
      const result = DateTime.toFileName(fixedDate);
      expect(result).toMatch(/20260524_\d{6}/);
    });
  });

  /**
   * @describe Relative & Duration
   */
  describe("Relative & Duration", () => {
    /**
     * @test Menangani null inputs
     */
    it("should return '-' for null inputs", () => {
      expect(DateTime.toRelative(null)).toBe("-");
      expect(DateTime.toDuration(null, new Date())).toBe("-");
      expect(DateTime.toShortDuration(null, new Date())).toBe("-");
      expect(DateTime.toDuration(new Date(), null)).toBe("-");
    });

    /**
     * @test Menghitung toRelative dengan benar
     */
    it("should calculate toRelative correctly", () => {
      const now = new Date();

      expect(DateTime.toRelative(new Date(now.getTime() - 30 * 1000))).toBe("Baru saja");
      expect(DateTime.toRelative(new Date(now.getTime() - 5 * 60000))).toBe("5 menit yang lalu");
      expect(DateTime.toRelative(new Date(now.getTime() - 2 * 3600000))).toBe("2 jam yang lalu");
      expect(DateTime.toRelative(new Date(now.getTime() - 3 * 86400000))).toBe("3 hari yang lalu");
      expect(DateTime.toRelative(new Date(now.getTime() - 10 * 86400000))).toBe("1 minggu yang lalu");
      expect(DateTime.toRelative(new Date(now.getTime() - 40 * 86400000))).toBe("1 bulan yang lalu");
      expect(DateTime.toRelative(new Date(now.getTime() - 400 * 86400000))).toBe("1 tahun yang lalu");
    });

    /**
     * @test Menghitung durasi jam dan menit
     */
    it("should calculate toDuration with hours and minutes", () => {
      const start = new Date();
      const end = new Date(start.getTime() + (2 * 3600000) + (30 * 60000));

      expect(DateTime.toDuration(start, end)).toBe("2 jam 30 menit");
    });

    /**
     * @test Menghitung durasi hanya jam
     */
    it("should calculate toDuration hours only", () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3 * 3600000);

      expect(DateTime.toDuration(start, end)).toBe("3 jam");
    });

    /**
     * @test Menghitung durasi hanya menit
     */
    it("should calculate toDuration minutes only", () => {
      const start = new Date();
      const end = new Date(start.getTime() + 45 * 60000);

      expect(DateTime.toDuration(start, end)).toBe("45 menit");
    });

    /**
     * @test Menghitung durasi hanya detik
     */
    it("should calculate toDuration seconds only", () => {
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 1000);

      expect(DateTime.toDuration(start, end)).toBe("30 detik");
    });

    /**
     * @test Negative duration
     */
    it("should handle negative duration", () => {
      const start = new Date();
      const end = new Date(start.getTime() - 3600000);

      expect(DateTime.toDuration(start, end)).toBe("-");
    });

    /**
     * @test Format toShortDuration
     */
    it("should format toShortDuration correctly", () => {
      const start = new Date();
      const end2h30m = new Date(start.getTime() + (2 * 3600000) + (30 * 60000));
      const end45m = new Date(start.getTime() + 45 * 60000);
      const end10s = new Date(start.getTime() + 10 * 1000);

      expect(DateTime.toShortDuration(start, end2h30m)).toBe("2j 30m");
      expect(DateTime.toShortDuration(start, end45m)).toBe("45m");
      expect(DateTime.toShortDuration(start, end10s)).toBe("0m");
    });
  });

  /**
   * @describe Smart Date Helpers
   */
  describe("Smart Date Helpers", () => {
    /**
     * @test Mendeteksi isToday dan isYesterday
     */
    it("should detect isToday and isYesterday correctly", () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const randomDate = new Date("2020-01-01");

      expect(DateTime.isToday(today)).toBe(true);
      expect(DateTime.isToday(yesterday)).toBe(false);
      expect(DateTime.isToday(null)).toBe(false);

      expect(DateTime.isYesterday(yesterday)).toBe(true);
      expect(DateTime.isYesterday(today)).toBe(false);
      expect(DateTime.isYesterday(null)).toBe(false);
    });

    /**
     * @test Format toSmartDate
     */
    it("should format toSmartDate correctly", () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const randomDate = new Date("2020-01-01");

      expect(DateTime.toSmartDate(today)).toMatch(/^Hari ini, /);
      expect(DateTime.toSmartDate(yesterday)).toMatch(/^Kemarin, /);
      expect(DateTime.toSmartDate(randomDate)).not.toMatch(/^Hari ini|^Kemarin/);
      expect(DateTime.toSmartDate(null)).toBe("-");
    });
  });
});