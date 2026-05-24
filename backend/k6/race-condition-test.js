/**
 * K6 RACE CONDITION TEST - Inventory & Order Creation
 * 
 * Menguji apakah sistem kebobolan saat banyak VU memperebutkan 
 * stok produk yang terbatas secara bersamaan.
 * 
 * Skenario:
 * - Stok awal produk: 5 unit
 * - 50 Virtual Users mencoba memesan 1 unit secara paralel
 * - Hanya 5 request yang seharusnya berhasil
 * - 45 request seharusnya ditolak karena stok habis
 * - Stok akhir tidak boleh negatif (indikasi race condition)
 * 
 * @version 1.0.0
 * @requires k6
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Trend } from "k6/metrics";

/**
 * Konfigurasi Environment dan Base URL
 * @type {string}
 */
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * Konfigurasi API Version
 * @type {string}
 */
const API_VERSION = __ENV.API_VERSION || "v1";

/**
 * Prefix untuk URL API
 * @type {string}
 */
const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Metrik untuk menghitung inkonsistensi inventaris (stok negatif)
 * Jika nilai > 0, berarti terjadi race condition
 * @type {Counter}
 */
const inventoryInconsistency = new Counter("inventory_inconsistency");

/**
 * Metrik untuk menghitung pesanan yang berhasil (stok mencukupi)
 * @type {Counter}
 */
const successfulOrders = new Counter("successful_orders");

/**
 * Metrik untuk menghitung pesanan yang ditolak (stok habis)
 * @type {Counter}
 */
const rejectedOrders = new Counter("rejected_orders");

/**
 * Metrik untuk menghitung error tak terduga selain 200/201/400
 * @type {Counter}
 */
const unexpectedErrors = new Counter("unexpected_errors");

/**
 * Metrik untuk melacak latensi pembuatan pesanan
 * @type {Trend}
 */
const orderLatency = new Trend("order_creation_latency");

/**
 * Metrik untuk melacak latensi kalkulasi pesanan
 * @type {Trend}
 */
const calculateLatency = new Trend("calculate_latency");

/**
 * Threshold dan Skenario
 * @type {Object}
 */
export const options = {
  thresholds: {
    inventory_inconsistency: ["count===0"],
    order_creation_latency: ["p(95)<5000"],
    http_req_failed: ["rate<0.90"],
  },
  scenarios: {
    /**
     * Skenario eksekusi paralel untuk memicu race condition
     * Setiap VU menjalankan 1 iterasi pembuatan order
     */
    parallel_order: {
      executor: "per-vu-iterations",
      vus: 50,
      iterations: 1,
      maxDuration: "1m",
      exec: "parallelOrderCreation",
    },
  },
};

/**
 * Variabel global untuk token autentikasi
 * @type {string|null}
 */
let authToken = null;

/**
 * Login sebagai kasir untuk mendapatkan token autentikasi
 * 
 * @returns {boolean} Status keberhasilan login
 */
function loginAsCashier() {
  /**
   * Request validasi email untuk login
   * @type {Object}
   */
  const response = http.post(
    `${BASE_URL}${API_PREFIX}/auth/validate/email`,
    JSON.stringify({ email: "kasir1@bengkel.com" }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "auth" },
      timeout: 10000,
    }
  );

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      authToken = body.token || "mock-token-race-test";
      return true;
    } catch (e) {
      authToken = "mock-token-race-test";
      return true;
    }
  }
  
  authToken = "mock-token-race-test";
  return true;
}

/**
 * Mengambil header autentikasi untuk request API
 * 
 * @returns {Object} Objek header HTTP dengan autentikasi
 */
function getAuthHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken || "mock-token-race-test"}`,
      "x-bypass-auth": "true",
      "x-bypass-role": "CASHIER",
    },
  };
}

/**
 * Request API generik dengan penangkapan metrik
 * 
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {string} path - Path API endpoint (tanpa prefix)
 * @param {Object} [body=null] - Payload body untuk request
 * @returns {{status: number, body: Object|null, duration: number, error: string|null}} Hasil respons
 */
function apiRequest(method, path, body = null) {
  /**
   * Opsi tambahan untuk request K6
   * @type {Object}
   */
  const options = {
    ...getAuthHeaders(),
    timeout: 30000,
    tags: { name: path },
  };

  /**
   * Objek respons dari HTTP request
   * @type {Object}
   */
  let response;
  
  try {
    response = http.request(
      method,
      `${BASE_URL}${API_PREFIX}${path}`,
      body ? JSON.stringify(body) : null,
      options
    );
  } catch (error) {
    return { status: 0, body: null, error: error.message, duration: 0 };
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
    duration: response.timings.duration,
  };
}

/**
 * Memastikan kasir memiliki shift aktif sebelum membuat order
 * 
 * @returns {boolean} Status keberhasilan (true jika shift aktif)
 */
function ensureActiveShift() {
  /**
   * Cek apakah ada shift aktif
   * @type {Object}
   */
  const checkShift = apiRequest("GET", "/shifts/active");
  
  if (checkShift.status === 200 && checkShift.body?.data) {
    return true;
  }

  /**
   * Membuka shift baru jika belum ada
   * @type {Object}
   */
  const openShift = apiRequest("POST", "/shifts/open", {
    startingCash: 1000000,
  });

  return openShift.status === 201 || openShift.status === 200;
}

/**
 * Setup Data Skenario
 * 
 * Menyiapkan entitas yang diperlukan untuk pengujian:
 * - Autentikasi kasir
 * - Shift aktif
 * - Customer dummy
 * - Kendaraan dummy
 * - Produk sparepart dengan stok terbatas (5 unit)
 * 
 * @returns {Object} Data setup yang akan diteruskan ke fungsi eksekusi
 */
export function setup() {
  console.log("=== RACE CONDITION TEST SETUP ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Version: ${API_VERSION}`);
  console.log("");

  loginAsCashier();
  ensureActiveShift();

  /**
   * Membuat customer dummy untuk pengujian
   * @type {Object}
   */
  const customerRes = apiRequest("POST", "/customers", {
    name: "Race Condition Customer",
    phone: "081234567890",
  });
  
  const customerId = customerRes.body?.data?.id || customerRes.body?.id;
  
  if (!customerId) {
    console.error("Gagal membuat customer untuk race condition test");
    return {};
  }

  console.log(`Customer ID: ${customerId}`);

  /**
   * Membuat kendaraan dummy untuk pengujian
   * @type {Object}
   */
  const vehicleRes = apiRequest("POST", "/vehicles", {
    plateNumber: "B 9999 RC",
    brand: "Vespa",
    model: "Sprint 150",
    customerId,
  });
  
  const vehicleId = vehicleRes.body?.data?.id || vehicleRes.body?.id;
  
  if (!vehicleId) {
    console.error("Gagal membuat kendaraan untuk race condition test");
    return {};
  }

  console.log(`Vehicle ID: ${vehicleId}`);

  /**
   * Stok awal yang terbatas untuk memicu race condition
   * Dengan 50 VU dan stok 5, seharusnya hanya 5 request berhasil
   * @type {number}
   */
  const initialStock = 5;

  /**
   * Membuat produk sparepart dengan stok terbatas
   * @type {Object}
   */
  const productRes = apiRequest("POST", "/products", {
    name: "Oli Mesin Race Test",
    sku: `RC-${Date.now()}`,
    type: "SPAREPART",
    price: 150000,
    cost: 100000,
    stock: initialStock,
    description: "Produk untuk tes race condition - jangan digunakan untuk transaksi nyata",
    isActive: true,
  });

  const targetProductId = productRes.body?.data?.id || productRes.body?.id;

  if (!targetProductId) {
    console.error("Gagal membuat produk untuk race condition test");
    return {};
  }

  console.log(`Product ID: ${targetProductId}`);
  console.log(`Initial Stock: ${initialStock}`);
  console.log(`Expected: ${initialStock} orders should succeed, ${50 - initialStock} should be rejected`);
  console.log("================================\n");

  return {
    targetProductId,
    customerId,
    vehicleId,
    initialStock,
  };
}

/**
 * Eksekutor Skenario Race Condition
 * 
 * Dijalankan paralel oleh seluruh VU.
 * Setiap VU mencoba membuat pesanan dengan 1 unit produk yang sama.
 * 
 * @param {Object} data - Data yang diteruskan dari fungsi setup()
 * @returns {void}
 */
export function parallelOrderCreation(data) {
  const { targetProductId, customerId, vehicleId } = data;
  
  if (!targetProductId || !customerId || !vehicleId) {
    console.error(`VU ${__VU}: Missing required data, skipping test`);
    return;
  }

  const vuId = __VU;

  group(`VU-${vuId} Order Creation Attempt`, () => {
    /**
     * Item pesanan dengan kuantitas 1 unit
     * @type {Array<Object>}
     */
    const orderItems = [
      {
        productId: targetProductId,
        quantity: 1,
      },
    ];

    /**
     * Menghitung total harga sebelum memesan
     * @type {Object}
     */
    const calculateRes = apiRequest("POST", "/orders/calculate", {
      items: orderItems,
    });
    
    calculateLatency.add(calculateRes.duration);

    if (calculateRes.status !== 200) {
      console.error(`VU ${vuId}: Calculate failed with status ${calculateRes.status}`);
      unexpectedErrors.add(1);
      return;
    }

    /**
     * Payload untuk pembuatan order
     * @type {Object}
     */
    const orderPayload = {
      customerId,
      vehicleId,
      items: orderItems,
    };

    /**
     * Eksekusi request pembuatan order
     * @type {Object}
     */
    const orderRes = apiRequest("POST", "/orders", orderPayload);
    orderLatency.add(orderRes.duration);

    check(orderRes, {
      "response status is 200, 201, or 400": (r) => {
        const isValid = [200, 201, 400].includes(r.status);
        if (!isValid) {
          console.error(
            `VU ${vuId}: Unexpected status ${r.status}, body: ${JSON.stringify(r.body)}`
          );
          unexpectedErrors.add(1);
        }
        return isValid;
      },
    });

    if (orderRes.status === 201 || orderRes.status === 200) {
      successfulOrders.add(1);
      console.log(`VU ${vuId}: Order created successfully`);
    } else if (orderRes.status === 400) {
      rejectedOrders.add(1);
      console.log(`VU ${vuId}: Order rejected (expected - stock depleted)`);
    }
  });

  sleep(0.1);
}

/**
 * Teardown Skenario
 * 
 * Validasi final untuk memastikan tidak ada stok negatif.
 * Memeriksa apakah race condition terjadi.
 * 
 * @param {Object} data - Data yang diteruskan dari fungsi setup()
 * @returns {void}
 */
export function teardown(data) {
  const { targetProductId, initialStock } = data;

  if (!targetProductId) {
    console.log("\n=== RACE CONDITION TEST SKIPPED ===");
    console.log("Setup gagal, tidak ada data untuk divalidasi.");
    console.log("======================================\n");
    return;
  }

  loginAsCashier();

  /**
   * Request produk untuk memeriksa sisa stok terakhir
   * @type {Object}
   */
  const productRes = apiRequest("GET", `/products/${targetProductId}`);
  const finalStock = productRes.body?.data?.stock ?? productRes.body?.stock ?? -999;

  check(productRes, {
    "final stock is never negative": (r) => {
      const stock = r.body?.data?.stock ?? r.body?.stock ?? -999;
      if (stock < 0) {
        inventoryInconsistency.add(1);
        console.error(`SEVERE: Negative inventory detected! Final stock: ${stock}`);
        return false;
      }
      return true;
    },
  });

  /**
   * Request pergerakan stok untuk analisis tambahan
   * @type {Object}
   */
  const movementsRes = apiRequest("GET", `/products/${targetProductId}/movements`);

  console.log("\n========================================================");
  console.log("        HASIL RACE CONDITION TEST (STOK INVENTARIS)       ");
  console.log("========================================================");
  console.log("");
  console.log(`Produk                    : Oli Mesin Race Test`);
  console.log(`Product ID                : ${targetProductId}`);
  console.log(`Stok Awal                 : ${initialStock}`);
  console.log(`Stok Akhir                : ${finalStock}`);
  console.log("");
  console.log("--- Hasil Eksekusi ---");
  console.log(`Pesanan Berhasil Dibuat   : ${successfulOrders.value}`);
  console.log(`Pesanan Ditolak (Habis)   : ${rejectedOrders.value}`);
  console.log(`Error Tak Terduga         : ${unexpectedErrors.value}`);
  console.log("");
  console.log("--- Analisis ---");
  
  const totalProcessed = successfulOrders.value + rejectedOrders.value;
  console.log(`Total Request Diproses    : ${totalProcessed} / 50 VU`);
  
  if (finalStock < 0) {
    console.log("");
    console.log("KESIMPULAN: RACE CONDITION TERDETEKSI!");
    console.log("Stok tembus di bawah 0. Sistem tidak mengunci transaksi dengan benar.");
    console.log("");
    console.log("Rekomendasi perbaikan:");
    console.log("1. Gunakan SELECT ... FOR UPDATE pada query stok.");
    console.log("2. Pastikan transaksi database menggunakan isolation level SERIALIZABLE.");
    console.log("3. Implementasikan distributed locking (Redis Redlock).");
    console.log("4. Gunakan database constraint CHECK (stock >= 0).");
  } else if (successfulOrders.value > initialStock) {
    console.log("");
    console.log("KESIMPULAN: RACE CONDITION TERDETEKSI!");
    console.log(`Pesanan berhasil (${successfulOrders.value}) melebihi stok awal (${initialStock}).`);
    console.log("Stok akhir 0 tetapi lebih banyak pesanan dibuat dari stok tersedia.");
  } else if (successfulOrders.value === initialStock && finalStock === 0) {
    console.log("");
    console.log("KESIMPULAN: AMAN.");
    console.log("Transaksi terkunci dengan baik. Tidak ada kebocoran stok.");
    console.log(`Tepat ${initialStock} pesanan berhasil, ${rejectedOrders.value} ditolak.`);
  } else {
    console.log("");
    console.log("KESIMPULAN: PERLU INVESTIGASI.");
    console.log("Hasil tidak sesuai ekspektasi. Periksa log untuk detail.");
  }
  
  console.log("");
  console.log("========================================================");
}

/**
 * Default Export
 * 
 * Titik masuk utama K6 yang menerima argumen dari fungsi setup.
 * Meneruskan data setup ke fungsi eksekusi paralel.
 * 
 * @param {Object} data - Data yang diteruskan dari siklus setup
 * @returns {void}
 */
export default function (data) {
  parallelOrderCreation(data);
}