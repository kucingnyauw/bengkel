/**
 * K6 CHAOS & DESTRUCTION TEST - Bengkel Vespa API
 * Skrip ini dirancang untuk membuat server crash, memicu OOM, 
 * menghabiskan koneksi database, dan menguji batas Rate Limiter.
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
  scenarios: {
    /**
     * Skenario 1: Serangan DDoS pada Endpoint Berat (Reports)
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
     */
    db_choke_orders: {
      executor: "constant-vus",
      vus: 100,
      duration: "45s",
      exec: "spamOrders",
    },
    /**
     * Skenario 3: Fuzzing / Payload Destruction
     */
    payload_fuzzing: {
      executor: "shared-iterations",
      vus: 50,
      iterations: 500,
      exec: "fuzzingAttack",
    }
  }
};

/**
 * Menghasilkan header berbahaya dengan timeout maksimal 
 * agar K6 menahan koneksi dan menyiksa server
 * @returns {Object} Objek parameter HTTP request
 */
function getMaliciousHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer mock-admin-token`,
      "x-bypass-auth": "true",
      "x-bypass-role": "ADMIN",
      "User-Agent": "K6-Chaos-Monkey"
    },
    timeout: 60000
  };
}

/**
 * Pengecekan respons server untuk mencatat metrik kehancuran
 * @param {Object} res - Objek respons dari HTTP request
 */
function recordChaosMetrics(res) {
  if (res.status === 500) {
    serverCrashes.add(1);
  }
  if (res.status === 429) {
    rateLimited.add(1);
  }
  if (res.error || res.status === 504 || res.status === 408) {
    timeoutErrors.add(1);
  }
}

/**
 * SKENARIO 1: Menghantam endpoint Reports (Paling berat untuk Database)
 * Menguji apakah reportLimiter dan timeout berfungsi dengan baik.
 */
export function attackReports() {
  /**
   * Daftar endpoint dengan beban agregasi database terberat
   * @type {Array<string>}
   */
  const endpoints = [
    `${PREFIX}/reports/dashboard`,
    `${PREFIX}/reports/sales?startDate=2024-01-01&endDate=2026-12-31`,
    `${PREFIX}/reports/profit-loss`,
    `${PREFIX}/reports/products/top`
  ];

  /**
   * Endpoint acak yang akan ditembak
   * @type {string}
   */
  const target = randomItem(endpoints);

  /**
   * Eksekusi request GET
   * @type {Object}
   */
  const res = http.get(`${BASE_URL}${target}`, getMaliciousHeaders());
  
  recordChaosMetrics(res);
  
  check(res, {
    "is rate limited (429)": (r) => r.status === 429,
    "did server crash (500)": (r) => r.status === 500,
  });
}

/**
 * SKENARIO 2: DB Choke pada Endpoint Orders
 * Memaksa server membuka banyak transaksi Prisma secara konkuren.
 */
export function spamOrders() {
  /**
   * Payload pemesanan yang valid namun diserang secara masif
   * @type {Object}
   */
  const payload = {
    customerId: "cust-dummy",
    vehicleId: "veh-dummy",
    items: [
      { productId: "prod-1", quantity: randomIntBetween(1, 100) },
      { productId: "prod-2", quantity: randomIntBetween(1, 100) }
    ]
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
}

/**
 * SKENARIO 3: Payload Fuzzing Attack
 * Mengirimkan data untuk merusak parser JSON atau memicu OOM.
 */
export function fuzzingAttack() {
  /**
   * Daftar payload destruktif
   * @type {Array<Object>}
   */
  const fuzzPayloads = [
    { name: "'; DROP TABLE users; CASCADE; --", phone: "08123456789" },
    { name: "<script>alert('Pwned')</script><img src=x onerror=alert(1)>", phone: "08123456789" },
    { name: randomString(500000), phone: "08123456789" },
    { name: { nested: { deep: "object" } }, phone: true },
    { name: "Budi", phone: "0812", items: Array(10000).fill({ productId: "x", quantity: 1 }) }
  ];

  /**
   * Payload acak yang dipilih untuk dikirim
   * @type {Object}
   */
  const payload = randomItem(fuzzPayloads);
  
  /**
   * Eksekusi request POST dengan data cacat
   * @type {Object}
   */
  const res = http.post(
    `${BASE_URL}${PREFIX}/customers`, 
    JSON.stringify(payload), 
    getMaliciousHeaders()
  );

  recordChaosMetrics(res);
  
  check(res, {
    "server safely rejected (4xx)": (r) => r.status >= 400 && r.status < 500,
    "SERVER CRASHED (500)": (r) => r.status === 500,
  });
}

/**
 * TEARDOWN (Laporan Kehancuran)
 * Dipanggil otomatis oleh K6 di akhir eksekusi untuk mencetak hasil.
 */
export function teardown() {
  console.log("\n========================================================");
  console.log(" HASIL CHAOS TEST ");
  console.log("========================================================");
  console.log("Tujuan tes ini adalah mencari 500 Internal Server Error.");
  console.log("Jika ada metrik 500 > 0, aplikasi memiliki celah kritis:");
  console.log("");
  console.log(`Server Crashes (500)      : ${serverCrashes.name} requests`);
  console.log(`Timeouts / Hangs          : ${timeoutErrors.name} requests`);
  console.log(`Blocked by Rate Limiter   : ${rateLimited.name} requests`);
  console.log("========================================================");
}