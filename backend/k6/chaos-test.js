/**
 * K6 CHAOS & DESTRUCTION TEST - Bengkel Vespa API
 * 
 * Skrip ini dirancang untuk menguji ketahanan server dengan:
 * - Simulasi serangan DDoS pada endpoint berat (reports)
 * - Simulasi concurrency tinggi pada transaksi database (orders)
 * - Fuzzing payload untuk menguji validasi input
 * - Menguji efektivitas Rate Limiter
 * - Mendeteksi celah keamanan dan stabilitas server
 * 
 * @version 1.0.0
 * @requires k6
 */

import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { randomString, randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

/**
 * Konfigurasi Base URL Server
 * @type {string}
 */
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * Konfigurasi Versi API
 * @type {string}
 */
const API_VERSION = __ENV.API_VERSION || "v1";

/**
 * Awalan Path API
 * @type {string}
 */
const PREFIX = `/api/${API_VERSION}`;

/**
 * Daftar endpoint dengan beban agregasi database terberat
 * @type {Array<string>}
 */
const HEAVY_ENDPOINTS = [
  `${PREFIX}/reports/dashboard`,
  `${PREFIX}/reports/sales?startDate=2024-01-01&endDate=2026-12-31`,
  `${PREFIX}/reports/profit-loss?startDate=2024-01-01&endDate=2026-12-31`,
  `${PREFIX}/reports/products/top?startDate=2024-01-01&endDate=2026-12-31&limit=50`,
  `${PREFIX}/reports/mechanic-performance?startDate=2024-01-01&endDate=2026-12-31`,
  `${PREFIX}/reports/inventory`,
  `${PREFIX}/reports/expenses?startDate=2024-01-01&endDate=2026-12-31`,
  `${PREFIX}/reports/payments?startDate=2024-01-01&endDate=2026-12-31`,
];

/**
 * Daftar payload destruktif untuk fuzzing attack
 * @type {Array<Object>}
 */
const FUZZ_PAYLOADS = [
  { name: "'; DROP TABLE users; CASCADE; --", phone: "08123456789" },
  { name: "<script>alert('Pwned')</script><img src=x onerror=alert(1)>", phone: "08123456789" },
  { name: randomString(500000), phone: "08123456789" },
  { name: { nested: { deep: "object" } }, phone: true },
  { name: null, phone: undefined },
  { name: "", phone: "" },
  { name: "Budi", phone: "0812", items: Array(10000).fill({ productId: "x", quantity: 1 }) },
  { name: "🤖".repeat(10000), phone: "☎️".repeat(10000) },
  { name: "../../../etc/passwd", phone: "%00%00%00" },
];

/**
 * Metrik khusus untuk melacak kegagalan kritikal server (Crash)
 * @type {Counter}
 */
const serverCrashes = new Counter("server_crashes_500");

/**
 * Metrik khusus untuk melacak respons Rate Limiter yang berhasil memblokir
 * @type {Counter}
 */
const rateLimited = new Counter("rate_limited_429");

/**
 * Metrik khusus untuk melacak request yang menggantung atau timeout
 * @type {Counter}
 */
const timeoutErrors = new Counter("timeout_errors");

/**
 * Opsi eksekusi skenario K6
 * @type {Object}
 */
export const options = {
  /**
   * Batas maksimal kegagalan sebelum tes dihentikan
   * @type {number}
   */
  thresholds: {
    "server_crashes_500": ["count < 1"],
  },
  
  scenarios: {
    /**
     * Skenario 1: Serangan DDoS pada Endpoint Berat (Reports)
     * Menggunakan ramping-vus untuk simulasi traffic yang meningkat drastis
     */
    ddos_reports: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 200 },
        { duration: "30s", target: 500 },
        { duration: "10s", target: 0 },
      ],
      exec: "attackReports",
    },
    
    /**
     * Skenario 2: Serangan Concurrency Transaksi (Deadlock trigger)
     * Menggunakan constant-vus untuk mempertahankan tekanan konstan
     */
    db_choke_orders: {
      executor: "constant-vus",
      vus: 100,
      duration: "45s",
      exec: "spamOrders",
    },
    
    /**
     * Skenario 3: Fuzzing / Payload Destruction
     * Menggunakan shared-iterations untuk mendistribusikan payload berbahaya
     */
    payload_fuzzing: {
      executor: "shared-iterations",
      vus: 50,
      iterations: 500,
      exec: "fuzzingAttack",
    },
  },
};

/**
 * Menghasilkan header berbahaya dengan timeout maksimal
 * agar K6 menahan koneksi dan menyiksa server
 * 
 * @returns {Object} Objek parameter HTTP request
 */
function getMaliciousHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-admin-token",
      "x-bypass-auth": "true",
      "x-bypass-role": "ADMIN",
      "User-Agent": "K6-Chaos-Monkey",
    },
    timeout: 60000,
  };
}

/**
 * Pengecekan respons server untuk mencatat metrik kehancuran
 * 
 * @param {Object} res - Objek respons dari HTTP request
 * @returns {void}
 */
function recordChaosMetrics(res) {
  if (res.status === 500 || res.status === 502 || res.status === 503) {
    serverCrashes.add(1);
    console.error(`[CRASH] ${res.request.method} ${res.request.url} -> ${res.status}`);
  }
  
  if (res.status === 429) {
    rateLimited.add(1);
    console.warn(`[RATE-LIMITED] ${res.request.method} ${res.request.url}`);
  }
  
  if (res.error || res.status === 504 || res.status === 408 || res.status === 0) {
    timeoutErrors.add(1);
    console.error(`[TIMEOUT] ${res.request.method} ${res.request.url} -> ${res.error || res.status}`);
  }
}

/**
 * SKENARIO 1: Menghantam endpoint Reports (Paling berat untuk Database)
 * 
 * Menguji apakah reportLimiter dan timeout berfungsi dengan baik.
 * Endpoint reports melakukan agregasi database berat yang bisa
 * menyebabkan query lambat dan koneksi database menumpuk.
 * 
 * @returns {void}
 */
export function attackReports() {
  /**
   * Endpoint acak yang akan ditembak
   * @type {string}
   */
  const target = randomItem(HEAVY_ENDPOINTS);

  /**
   * Eksekusi request GET
   * @type {Object}
   */
  const res = http.get(`${BASE_URL}${target}`, getMaliciousHeaders());

  recordChaosMetrics(res);

  check(res, {
    "request processed": (r) => r.status === 200 || r.status === 429,
    "rate limited (429)": (r) => r.status === 429,
    "server error (500)": (r) => r.status >= 500,
  });
}

/**
 * SKENARIO 2: DB Choke pada Endpoint Orders
 * 
 * Memaksa server membuka banyak transaksi Prisma secara konkuren.
 * Ini dapat memicu:
 * - Database connection pool exhaustion
 * - Deadlock pada transaksi bersamaan
 * - Antrian request yang menumpuk
 * 
 * @returns {void}
 */
export function spamOrders() {
  /**
   * Payload pemesanan yang valid namun diserang secara masif
   * @type {Object}
   */
  const payload = {
    customerId: `cust-dummy-${randomIntBetween(1, 1000)}`,
    vehicleId: `veh-dummy-${randomIntBetween(1, 1000)}`,
    items: [
      { productId: `prod-${randomIntBetween(1, 20)}`, quantity: randomIntBetween(1, 100) },
      { productId: `prod-${randomIntBetween(1, 20)}`, quantity: randomIntBetween(1, 100) },
    ],
  };

  /**
   * Eksekusi request POST
   * @type {Object}
   */
  const res = http.post(
    `${BASE_URL}${PREFIX}/orders`,
    JSON.stringify(payload),
    getMaliciousHeaders()
  );

  recordChaosMetrics(res);

  check(res, {
    "request processed": (r) => r.status === 200 || r.status === 201 || r.status === 400 || r.status === 429,
    "rate limited (429)": (r) => r.status === 429,
    "server error (500)": (r) => r.status >= 500,
  });
}

/**
 * SKENARIO 3: Payload Fuzzing Attack
 * 
 * Mengirimkan data untuk merusak parser JSON atau memicu OOM.
 * Menguji:
 * - SQL Injection attempts
 * - XSS payloads
 * - Extremely large payloads (OOM)
 * - Type confusion (object instead of string)
 * - Null/undefined values
 * - Unicode bombs
 * - Path traversal attempts
 * 
 * @returns {void}
 */
export function fuzzingAttack() {
  /**
   * Payload acak yang dipilih untuk dikirim
   * @type {Object}
   */
  const payload = randomItem(FUZZ_PAYLOADS);

  /**
   * Endpoint acak untuk fuzzing
   * @type {string}
   */
  const targets = [
    `${PREFIX}/customers`,
    `${PREFIX}/vehicles`,
    `${PREFIX}/products`,
    `${PREFIX}/orders`,
    `${PREFIX}/shifts/open`,
    `${PREFIX}/shifts/close`,
  ];

  /**
   * Endpoint target yang dipilih secara acak
   * @type {string}
   */
  const target = randomItem(targets);

  /**
   * Metode HTTP yang digunakan (POST untuk create, PUT untuk update)
   * @type {string}
   */
  const method = randomItem(["POST", "PUT"]);

  /**
   * Eksekusi request dengan data cacat
   * @type {Object}
   */
  let res;
  if (method === "POST") {
    res = http.post(
      `${BASE_URL}${target}`,
      JSON.stringify(payload),
      getMaliciousHeaders()
    );
  } else {
    res = http.put(
      `${BASE_URL}${target}/${randomString(8)}`,
      JSON.stringify(payload),
      getMaliciousHeaders()
    );
  }

  recordChaosMetrics(res);

  check(res, {
    "request handled safely (4xx)": (r) => r.status >= 400 && r.status < 500,
    "server crashed (5xx)": (r) => r.status >= 500,
    "no timeout": (r) => r.status !== 0 && r.status !== 504 && r.status !== 408,
  });
}

/**
 * TEARDOWN: Laporan Kehancuran
 * 
 * Dipanggil otomatis oleh K6 di akhir eksekusi untuk mencetak hasil.
 * Menampilkan ringkasan metrik kehancuran server.
 * 
 * @param {Object} data - Data hasil eksekusi dari K6
 * @returns {void}
 */
export function teardown(data) {
  console.log("\n========================================================");
  console.log("           HASIL CHAOS & DESTRUCTION TEST                ");
  console.log("========================================================");
  console.log("");
  console.log("Target Server:", BASE_URL);
  console.log("API Version  :", API_VERSION);
  console.log("");
  console.log("--- METRIK KEHANCURAN ---");
  console.log("");
  
  if (serverCrashes.value > 0) {
    console.log(`[KRITIS] Server Crashes (5xx)   : ${serverCrashes.value} requests`);
    console.log("   -> Server memiliki celah stabilitas yang serius!");
    console.log("   -> Periksa error log dan perbaiki handling exception.");
  } else {
    console.log(`[AMAN] Server Crashes (5xx)     : 0 requests`);
  }
  
  console.log("");
  
  if (timeoutErrors.value > 0) {
    console.log(`[WARNING] Timeouts / Hangs      : ${timeoutErrors.value} requests`);
    console.log("   -> Server mungkin mengalami bottleneck database atau memory.");
    console.log("   -> Pertimbangkan menambah timeout atau optimasi query.");
  } else {
    console.log(`[AMAN] Timeouts / Hangs         : 0 requests`);
  }
  
  console.log("");
  
  if (rateLimited.value > 0) {
    console.log(`[INFO] Blocked by Rate Limiter  : ${rateLimited.value} requests`);
    console.log("   -> Rate limiter berfungsi dengan baik.");
  } else {
    console.log(`[WARNING] Rate Limited          : 0 requests`);
    console.log("   -> Rate limiter mungkin tidak aktif atau threshold terlalu tinggi.");
  }
  
  console.log("");
  console.log("--- REKOMENDASI ---");
  console.log("");
  
  if (serverCrashes.value > 0) {
    console.log("1. Perbaiki error handling di endpoint yang crash.");
    console.log("2. Tambahkan circuit breaker untuk mencegah cascading failure.");
    console.log("3. Implementasikan graceful degradation untuk endpoint berat.");
  }
  
  if (timeoutErrors.value > 0) {
    console.log("1. Optimasi query database yang lambat (tambahkan index).");
    console.log("2. Implementasikan caching (Redis) untuk endpoint reports.");
    console.log("3. Pertimbangkan connection pooling yang lebih besar.");
  }
  
  if (rateLimited.value === 0) {
    console.log("1. Pastikan rate limiter terkonfigurasi dengan benar.");
    console.log("2. Set threshold yang sesuai untuk production environment.");
  }
  
  console.log("");
  console.log("========================================================");
  console.log("             TES SELESAI                                ");
  console.log("========================================================");
}