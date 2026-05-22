/**
 * K6 LOAD TEST SCRIPT - Bengkel Vespa API
 * Skenario pengujian beban umum (Load Testing) untuk mengukur performa
 * dan throughput dari endpoint utama aplikasi.
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { randomString, randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

/**
 * Metrik Kustom K6
 */
const errorRate = new Rate("errors");
const timeoutRate = new Rate("timeouts");
const successRate = new Rate("success");
const p95Trend = new Trend("p95_latency");
const p99Trend = new Trend("p99_latency");
const avgLatency = new Trend("avg_latency");
const orderCreationRate = new Rate("order_creation_success");
const paymentSuccessRate = new Rate("payment_success");
const endpointTiming = new Trend("endpoint_timing");

/**
 * Konfigurasi URL dan Environment
 */
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = __ENV.API_VERSION || "v1";
const API_PREFIX = `/api/${API_VERSION}`;

const BYPASS_AUTH = __ENV.BYPASS_AUTH !== "false";
const BYPASS_ROLE = __ENV.BYPASS_ROLE || "CASHIER";

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
 * Helper: Menghasilkan data pelanggan acak
 * @returns {Object} Data pelanggan
 */
function generateCustomerData() {
  const names = ["Budi Santoso", "Siti Nurhaliza", "Ahmad Dhani", "Dewi Lestari", "Rudi Hermawan"];
  const phones = Array.from({ length: 5 }, () => `08${randomIntBetween(100000000, 999999999)}`);

  return {
    name: randomItem(names),
    phone: randomItem(phones),
  };
}

/**
 * Helper: Menghasilkan data kendaraan acak
 * @returns {Object} Data kendaraan
 */
function generateVehicleData() {
  const brands = ["Vespa", "Honda", "Yamaha", "Suzuki", "Kawasaki"];
  const models = ["Sprint 150", "Primavera 150", "GTS Super 300", "PX 150", "NMax 155"];

  return {
    plateNumber: `B ${randomIntBetween(1000, 9999)} ${randomString(2, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")}`,
    brand: randomItem(brands),
    model: randomItem(models),
  };
}

/**
 * Helper: Menghasilkan daftar item pesanan dari ID produk
 * @param {Array<string>} productIds - Array ID Produk
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
 * Helper: Menghasilkan payload malformasi untuk negative testing
 * @param {string} type - Jenis payload cacat
 * @returns {Object} Payload cacat
 */
function generateMalformedPayload(type) {
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
  };

  return payloads[type] || payloads.empty_body;
}

/**
 * Helper: Mengambil header request (termasuk bypass auth jika diaktifkan)
 * @returns {Object} Parameter headers
 */
function getHeaders() {
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
 * Helper: Request API Generik dengan penangkapan metrik error dan durasi
 * @param {string} method - HTTP Method
 * @param {string} path - Endpoint Path
 * @param {Object} [body] - Body Request
 * @param {Object} [options] - Opsi tambahan k6
 * @returns {Object} Hasil respons dan status
 */
function apiRequest(method, path, body = null, options = {}) {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const requestOptions = { ...getHeaders(), ...options };

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
  } else {
    successRate.add(1);
  }

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
 * Helper: Memastikan kasir memiliki shift aktif sebelum memproses pesanan
 * @returns {boolean} Status keberhasilan
 */
function ensureActiveShift() {
  const checkRes = apiRequest("GET", "/shifts/active/check");
  if (checkRes.status === 200 && checkRes.body?.exists) {
    return true;
  }

  const openRes = apiRequest("POST", "/shifts/open", { startingCash: 1000000 });
  return openRes.status === 201 || openRes.status === 200;
}

/**
 * SKENARIO BISNIS: Menjelajahi produk publik
 */
function browseProductsFlow() {
  group("Browse Products", () => {
    const productsRes = apiRequest("GET", "/products");

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
      "has data array": (r) => r.body?.data?.length > 0,
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
    
    /** * Filter produk untuk memastikan SPAREPART memiliki stok, 
     * agar order tidak ditolak dengan status 400.
     */
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
 */
export function malformedPayloadTest() {
  group("Malformed Payload Tests", () => {
    const payloadTypes = [
      "missing_fields", "invalid_types", "empty_body",
      "xss_attempt", "sql_injection", "oversized_payload",
      "negative_price", "invalid_status", "null_fields",
    ];

    const testType = randomItem(payloadTypes);
    const malformedData = generateMalformedPayload(testType);

    const endpoints = [
      { method: "POST", path: "/customers" },
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
 * @returns {Object} Data konfigurasi awal
 */
export function setup() {
  return {};
}

/**
 * Teardown Skenario
 * @param {Object} data - Data dari fungsi setup
 */
export function teardown(data) {
  /** Kosong, K6 secara otomatis akan mencetak metrik bawaan */
}

/**
 * Titik masuk utama (Default Export)
 * Menentukan skenario yang dijalankan berdasarkan variabel environment
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