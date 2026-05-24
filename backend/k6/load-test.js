/**
 * K6 LOAD TEST SCRIPT - Bengkel Vespa API
 * 
 * Skenario pengujian beban umum (Load Testing) untuk mengukur performa
 * dan throughput dari endpoint utama aplikasi.
 * 
 * Fitur:
 * - Baseline test untuk mengukur performa normal
 * - Ramp-up test untuk melihat batas kapasitas
 * - Spike test untuk ketahanan terhadap lonjakan
 * - Sustained test untuk ketahanan jangka panjang
 * - Concurrent write test untuk integritas data
 * - Malformed payload test untuk validasi input
 * 
 * @version 1.0.0
 * @requires k6
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { randomString, randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

/**
 * Metrik Kustom K6
 * @type {Rate}
 */
const errorRate = new Rate("errors");

/**
 * Metrik tingkat timeout
 * @type {Rate}
 */
const timeoutRate = new Rate("timeouts");

/**
 * Metrik tingkat keberhasilan
 * @type {Rate}
 */
const successRate = new Rate("success");

/**
 * Metrik latensi persentil ke-95
 * @type {Trend}
 */
const p95Trend = new Trend("p95_latency");

/**
 * Metrik latensi persentil ke-99
 * @type {Trend}
 */
const p99Trend = new Trend("p99_latency");

/**
 * Metrik latensi rata-rata
 * @type {Trend}
 */
const avgLatency = new Trend("avg_latency");

/**
 * Metrik keberhasilan pembuatan pesanan
 * @type {Rate}
 */
const orderCreationRate = new Rate("order_creation_success");

/**
 * Metrik keberhasilan pembayaran
 * @type {Rate}
 */
const paymentSuccessRate = new Rate("payment_success");

/**
 * Metrik durasi per endpoint
 * @type {Trend}
 */
const endpointTiming = new Trend("endpoint_timing");

/**
 * Konfigurasi URL dan Environment
 * @type {string}
 */
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * Versi API yang digunakan
 * @type {string}
 */
const API_VERSION = __ENV.API_VERSION || "v1";

/**
 * Prefix path API
 * @type {string}
 */
const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Flag untuk bypass autentikasi
 * @type {boolean}
 */
const BYPASS_AUTH = __ENV.BYPASS_AUTH !== "false";

/**
 * Role untuk bypass autentikasi
 * @type {string}
 */
const BYPASS_ROLE = __ENV.BYPASS_ROLE || "CASHIER";

/**
 * Daftar nama pelanggan untuk data acak
 * @type {Array<string>}
 */
const CUSTOMER_NAMES = [
  "Budi Santoso", "Siti Nurhaliza", "Ahmad Dhani", 
  "Dewi Lestari", "Rudi Hermawan", "Ani Rahayu",
  "Joko Widodo", "Mega Wati", "Susilo Bambang",
];

/**
 * Daftar merek kendaraan untuk data acak
 * @type {Array<string>}
 */
const VEHICLE_BRANDS = ["Vespa", "Honda", "Yamaha", "Suzuki", "Kawasaki"];

/**
 * Daftar model kendaraan untuk data acak
 * @type {Array<string>}
 */
const VEHICLE_MODELS = [
  "Sprint 150", "Primavera 150", "GTS Super 300", 
  "PX 150", "NMax 155", "PCX 160", "Aerox 155",
];

/**
 * Thresholds - Batas kelulusan untuk Load Test
 * @type {Object}
 */
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    http_req_failed: ["rate<0.80"],
    errors: ["rate<0.80"],
    timeouts: ["rate<0.05"],
  },
};

/**
 * Menghasilkan data pelanggan acak
 * 
 * @returns {Object} Data pelanggan dengan nama dan nomor telepon acak
 */
function generateCustomerData() {
  return {
    name: randomItem(CUSTOMER_NAMES),
    phone: `08${randomIntBetween(100000000, 999999999)}`,
  };
}

/**
 * Menghasilkan data kendaraan acak
 * 
 * @returns {Object} Data kendaraan dengan plat nomor, merek, dan model acak
 */
function generateVehicleData() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  return {
    plateNumber: `B ${randomIntBetween(1000, 9999)} ${randomString(2, letters)}`,
    brand: randomItem(VEHICLE_BRANDS),
    model: randomItem(VEHICLE_MODELS),
  };
}

/**
 * Menghasilkan daftar item pesanan dari ID produk yang tersedia
 * 
 * @param {Array<string>} productIds - Array ID produk yang tersedia
 * @returns {Array<Object>} Daftar item pesanan
 */
function generateOrderItems(productIds) {
  const itemCount = randomIntBetween(1, 3);
  const items = [];

  for (let i = 0; i < itemCount; i++) {
    items.push({
      productId: randomItem(productIds),
      quantity: randomIntBetween(1, 2),
    });
  }

  return items;
}

/**
 * Menghasilkan payload malformasi untuk negative testing
 * 
 * @param {string} type - Jenis payload cacat
 * @returns {Object} Payload dengan data cacat sesuai tipe
 */
function generateMalformedPayload(type) {
  /**
   * Koleksi payload malformasi berdasarkan tipe
   * @type {Object<string, Object>}
   */
  const payloads = {
    missing_fields: { name: "Test" },
    invalid_types: { name: 123, phone: true, email: "invalid" },
    empty_body: {},
    xss_attempt: { name: "<script>alert('xss')</script>", phone: "081234567890" },
    sql_injection: { name: "'; DROP TABLE customers; --", phone: "081234567890" },
    oversized_payload: { name: randomString(10000), phone: "081234567890" },
    negative_price: { productId: "p1", quantity: -5 },
    invalid_status: { status: "INVALID_STATUS" },
    null_fields: { name: null, phone: null },
    unicode_bomb: { name: "🤖".repeat(1000), phone: "☎️".repeat(1000) },
    array_instead_of_object: [{ name: "Test" }],
    nested_deep: { a: { b: { c: { d: { e: "deep" } } } } },
  };

  return payloads[type] || payloads.empty_body;
}

/**
 * Mengambil header request termasuk bypass auth jika diaktifkan
 * 
 * @returns {Object} Parameter headers untuk HTTP request
 */
function getHeaders() {
  /**
   * Header dasar untuk request
   * @type {Object}
   */
  const headers = {
    "Content-Type": "application/json",
  };

  if (BYPASS_AUTH) {
    headers["x-bypass-auth"] = "true";
    headers["x-bypass-role"] = BYPASS_ROLE;
  }

  return { headers };
}

/**
 * Request API generik dengan penangkapan metrik error dan durasi
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} path - Endpoint path (tanpa prefix)
 * @param {Object} [body=null] - Body request untuk POST/PUT
 * @param {Object} [options={}] - Opsi tambahan k6 (timeout, dll)
 * @returns {{status: number, body: Object|null, duration: number, error: string|null}} Hasil respons
 */
function apiRequest(method, path, body = null, options = {}) {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const requestOptions = { ...getHeaders(), ...options };

  /**
   * Objek respons dari HTTP request
   * @type {Object}
   */
  let response;
  
  try {
    response = http.request(method, url, body ? JSON.stringify(body) : null, {
      ...requestOptions,
      timeout: options.timeout || 30000,
    });
  } catch (error) {
    errorRate.add(1);
    return { status: 0, body: null, error: error.message, duration: 0 };
  }

  const duration = response.timings.duration;
  endpointTiming.add(duration, { endpoint: path });
  p95Trend.add(duration);
  p99Trend.add(duration);
  avgLatency.add(duration);

  if (response.status >= 400 && response.status !== 404) {
    errorRate.add(1);
    if (response.status === 504 || response.status === 408) {
      timeoutRate.add(1);
    }
  } else if (response.status >= 200 && response.status < 400) {
    successRate.add(1);
  }

  /**
   * Body yang sudah diparse dari JSON
   * @type {Object|null}
   */
  let parsedBody = null;
  try {
    parsedBody = response.body ? JSON.parse(response.body) : null;
  } catch (e) {
    parsedBody = null;
  }

  return {
    status: response.status,
    body: parsedBody,
    duration,
  };
}

/**
 * Memastikan kasir memiliki shift aktif sebelum memproses pesanan
 * Jika belum ada shift aktif, akan membuka shift baru
 * 
 * @returns {boolean} Status keberhasilan (true jika shift aktif)
 */
function ensureActiveShift() {
  const checkRes = apiRequest("GET", "/shifts/active");
  
  if (checkRes.status === 200 && checkRes.body?.data) {
    return true;
  }

  const openRes = apiRequest("POST", "/shifts/open", { startingCash: 1000000 });
  return openRes.status === 201 || openRes.status === 200;
}

/**
 * SKENARIO BISNIS: Menjelajahi produk publik
 * 
 * Menguji endpoint read-only untuk katalog produk.
 * Mencakup list produk, detail, filter by SKU, services, dan spareparts.
 * 
 * @returns {void}
 */
function browseProductsFlow() {
  group("Browse Products", () => {
    const productsRes = apiRequest("GET", "/products");

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
      "has data array": (r) => r.body?.data?.length >= 0,
      "has metadata": (r) => r.body?.metadata !== undefined,
    });

    if (productsRes.body?.data?.length > 0) {
      const products = productsRes.body.data;
      const product = randomItem(products);

      const detailRes = apiRequest("GET", `/products/${product.id}`);
      check(detailRes, {
        "product detail retrieved": (r) => r.status === 200,
      });

      const skuRes = apiRequest("GET", `/products/sku/${product.sku}`);
      check(skuRes, {
        "product by SKU retrieved": (r) => r.status === 200,
      });
    }

    const servicesRes = apiRequest("GET", "/products/services");
    check(servicesRes, {
      "services retrieved": (r) => r.status === 200,
    });

    const sparepartsRes = apiRequest("GET", "/products/spareparts");
    check(sparepartsRes, {
      "spareparts retrieved": (r) => r.status === 200,
    });
  });
}

/**
 * SKENARIO BISNIS: Siklus pemesanan lengkap (Read/Write Heavy)
 * 
 * Mensimulasikan alur bisnis lengkap:
 * 1. Membuat customer baru
 * 2. Mendaftarkan kendaraan
 * 3. Mengkalkulasi pesanan
 * 4. Membuat pesanan
 * 5. Melakukan pembayaran
 * 6. Melacak riwayat pesanan
 * 
 * @returns {void}
 */
function completeOrderFlow() {
  group("Complete Order Flow", () => {
    ensureActiveShift();

    const customerData = generateCustomerData();
    const customerRes = apiRequest("POST", "/customers", customerData);

    check(customerRes, {
      "customer created": (r) => r.status === 201 || r.status === 200,
    });

    const customerId = customerRes.body?.data?.id || customerRes.body?.id;
    if (!customerId) return;

    const vehicleData = generateVehicleData();
    const vehicleRes = apiRequest("POST", "/vehicles", {
      ...vehicleData,
      customerId,
    });

    check(vehicleRes, {
      "vehicle registered": (r) => r.status === 201 || r.status === 200,
    });

    const vehicleId = vehicleRes.body?.data?.id || vehicleRes.body?.id;

    const productsRes = apiRequest("GET", "/products");
    const products = productsRes.body?.data || [];

    const availableProducts = products.filter(
      p => p.type === "SERVICE" || (p.type === "SPAREPART" && p.stock > 0)
    );
    const productIds = availableProducts.slice(0, 5).map(p => p.id);

    if (productIds.length === 0) return;

    const items = generateOrderItems(productIds);
    const calculateRes = apiRequest("POST", "/orders/calculate", { items });

    check(calculateRes, {
      "order calculated": (r) => r.status === 200,
    });

    const total = calculateRes.body?.data?.total || calculateRes.body?.total || 100000;

    const orderPayload = { customerId, vehicleId, items };
    const orderRes = apiRequest("POST", "/orders", orderPayload, { timeout: 45000 });

    check(orderRes, {
      "order created": (r) => r.status === 201 || r.status === 200,
    });

    orderCreationRate.add(orderRes.status === 201 || orderRes.status === 200 ? 1 : 0);

    const orderId = orderRes.body?.data?.id || orderRes.body?.id;
    const orderNumber = orderRes.body?.data?.orderNumber || orderRes.body?.orderNumber;

    if (orderId) {
      const paymentRes = apiRequest("POST", "/payments", {
        orderId,
        method: "CASH",
        amountPaid: total + 10000,
      }, { timeout: 45000 });

      check(paymentRes, {
        "payment created": (r) => r.status === 200 || r.status === 201,
      });

      paymentSuccessRate.add(paymentRes.status === 200 || paymentRes.status === 201 ? 1 : 0);
    }

    if (orderNumber) {
      const trackRes = apiRequest("GET", `/orders/${orderNumber}/history`);
      check(trackRes, {
        "order tracking accessible": (r) => r.status === 200,
      });
    }
  });
}

/**
 * Eksekutor: Baseline Load Test
 * 
 * Beban normal untuk mengukur performa dasar.
 * 50% browse produk, 35% complete order, 15% kombinasi.
 * 
 * @returns {void}
 */
export function baselineTest() {
  const action = randomIntBetween(1, 100);

  if (action <= 50) {
    browseProductsFlow();
  } else if (action <= 85) {
    completeOrderFlow();
  } else {
    browseProductsFlow();
    sleep(1);
    completeOrderFlow();
  }

  sleep(randomIntBetween(1, 3));
}

/**
 * Eksekutor: Ramp-up Test (Bertahap)
 * 
 * Beban meningkat bertahap untuk menemukan titik jenuh.
 * Lebih banyak read dibanding baseline.
 * 
 * @returns {void}
 */
export function rampUpTest() {
  const action = randomIntBetween(1, 100);

  if (action <= 40) {
    browseProductsFlow();
  } else if (action <= 80) {
    completeOrderFlow();
  } else {
    browseProductsFlow();
    sleep(1);
    completeOrderFlow();
  }

  sleep(randomIntBetween(1, 5));
}

/**
 * Eksekutor: Spike Test (Mendadak)
 * 
 * Lonjakan beban tiba-tiba untuk menguji ketahanan.
 * Interval sleep lebih pendek untuk tekanan lebih tinggi.
 * 
 * @returns {void}
 */
export function spikeTest() {
  const action = randomIntBetween(1, 100);

  if (action <= 30) {
    browseProductsFlow();
  } else if (action <= 70) {
    completeOrderFlow();
  } else {
    browseProductsFlow();
    sleep(0.5);
    completeOrderFlow();
  }

  sleep(randomIntBetween(0.5, 2));
}

/**
 * Eksekutor: Sustained Load Test
 * 
 * Beban berkelanjutan dengan variasi berdasarkan waktu.
 * Pola: 3 menit browse, 4 menit order, 3 menit campuran.
 * 
 * @returns {void}
 */
export function sustainedTest() {
  const minute = Math.floor(Date.now() / 60000) % 10;

  if (minute < 3) {
    browseProductsFlow();
  } else if (minute < 7) {
    completeOrderFlow();
  } else {
    browseProductsFlow();
    sleep(1);
    completeOrderFlow();
  }

  sleep(randomIntBetween(1, 4));
}

/**
 * Eksekutor: Concurrent Write Test
 * 
 * Pengujian konkurensi tinggi pada operasi write.
 * Membuat customer dan 3 pesanan sekaligus.
 * 
 * @returns {void}
 */
export function concurrentWriteTest() {
  group("Concurrent Write Operations", () => {
    ensureActiveShift();

    const productsRes = apiRequest("GET", "/products");
    const availableProducts = (productsRes.body?.data || []).filter(
      p => p.type === "SERVICE" || (p.type === "SPAREPART" && p.stock > 0)
    );
    const productIds = availableProducts.slice(0, 5).map(p => p.id);

    if (productIds.length === 0) return;

    const customerData = generateCustomerData();
    const customerRes = apiRequest("POST", "/customers", customerData);
    const customerId = customerRes.body?.data?.id || customerRes.body?.id;

    if (!customerId) return;

    for (let i = 0; i < 3; i++) {
      const items = generateOrderItems(productIds);
      apiRequest("POST", "/orders", { customerId, items }, { timeout: 45000 });
    }
  });

  sleep(1);
}

/**
 * Eksekutor: Malformed Payload Test
 * 
 * Pengujian ketahanan terhadap input tidak valid.
 * Mengirim berbagai tipe payload cacat ke berbagai endpoint.
 * 
 * @returns {void}
 */
export function malformedPayloadTest() {
  group("Malformed Payload Tests", () => {
    /**
     * Daftar tipe payload malformasi
     * @type {Array<string>}
     */
    const payloadTypes = [
      "missing_fields", "invalid_types", "empty_body",
      "xss_attempt", "sql_injection", "oversized_payload",
      "negative_price", "invalid_status", "null_fields",
      "unicode_bomb", "array_instead_of_object", "nested_deep",
    ];

    const testType = randomItem(payloadTypes);
    const malformedData = generateMalformedPayload(testType);

    /**
     * Daftar endpoint target untuk pengujian malformasi
     * @type {Array<{method: string, path: string}>}
     */
    const endpoints = [
      { method: "POST", path: "/customers" },
      { method: "POST", path: "/vehicles" },
      { method: "POST", path: "/products" },
      { method: "POST", path: "/orders" },
      { method: "POST", path: "/payments" },
      { method: "PUT", path: "/customers/upsert" },
    ];

    const endpoint = randomItem(endpoints);
    const response = apiRequest(endpoint.method, endpoint.path, malformedData);

    check(response, {
      "returns error for malformed payload": (r) => r.status >= 400,
      "no 500 internal server error": (r) => r.status !== 500,
      "response time acceptable": (r) => r.duration < 5000,
    });
  });

  sleep(0.5);
}

/**
 * Setup Data Skenario
 * Dipanggil sekali sebelum tes dimulai untuk menyiapkan data awal
 * 
 * @returns {Object} Data konfigurasi awal (kosong)
 */
export function setup() {
  console.log("=== LOAD TEST SETUP ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Version: ${API_VERSION}`);
  console.log(`Bypass Auth: ${BYPASS_AUTH}`);
  console.log(`Bypass Role: ${BYPASS_ROLE}`);
  console.log("=======================\n");
  
  return {};
}

/**
 * Teardown Skenario
 * Dipanggil sekali setelah tes selesai
 * 
 * @param {Object} data - Data dari fungsi setup
 * @returns {void}
 */
export function teardown(data) {
  console.log("\n=== LOAD TEST COMPLETED ===");
  console.log("Check K6 output above for detailed metrics.");
  console.log("Key metrics to watch:");
  console.log("  - http_req_duration: p95 < 2000ms, p99 < 5000ms");
  console.log("  - http_req_failed: rate < 80%");
  console.log("  - errors: rate < 80%");
  console.log("  - timeouts: rate < 5%");
  console.log("===========================\n");
}

/**
 * Titik masuk utama (Default Export)
 * Menentukan skenario yang dijalankan berdasarkan variabel environment SCENARIO
 * 
 * @returns {void}
 */
export default function () {
  const scenario = __ENV.SCENARIO || "baseline";

  switch (scenario) {
    case "baseline":
      baselineTest();
      break;
    case "ramp_up":
      rampUpTest();
      break;
    case "spike":
      spikeTest();
      break;
    case "sustained":
      sustainedTest();
      break;
    case "concurrent_write":
      concurrentWriteTest();
      break;
    case "malformed_payload":
      malformedPayloadTest();
      break;
    default:
      baselineTest();
  }
}