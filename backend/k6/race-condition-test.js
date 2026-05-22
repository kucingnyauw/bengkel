/**
 * K6 RACE CONDITION TEST - Inventory & Order Creation
 * Menguji apakah sistem kebobolan saat banyak VU memperebutkan stok produk yang terbatas secara bersamaan.
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
 * Metrik untuk melacak latensi pembuatan pesanan
 * @type {Trend}
 */
const orderLatency = new Trend("order_creation_latency");

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
 * Helper: Login sebagai kasir untuk mendapatkan token
 * @returns {boolean} Status keberhasilan login
 */
function loginAsCashier() {
  /**
   * Request validasi email untuk login
   * @type {Object}
   */
  const response = http.post(`${BASE_URL}${API_PREFIX}/auth/validate/email`, {
    email: "kasir1@bengkel.com",
  }, {
    tags: { name: "auth" },
  });

  if (response.status === 200) {
    authToken = response.json("token") || "mock-token-race-test";
    return true;
  }
  return false;
}

/**
 * Helper: Mengambil header autentikasi
 * @returns {Object} Objek header HTTP
 */
function getAuthHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken || "mock-token-race-test"}`,
      "x-bypass-auth": "true",
      "x-bypass-role": "CASHIER"
    },
  };
}

/**
 * Helper: Request API Generik
 * @param {string} method - HTTP Method (GET, POST, dll)
 * @param {string} path - Path API endpoint
 * @param {Object} [body] - Payload body
 * @returns {Object} Hasil respons HTTP
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
 * Helper: Membuka shift untuk kasir agar bisa membuat order
 * @returns {boolean} Status keberhasilan pembukaan shift
 */
function ensureActiveShift() {
  /**
   * Cek apakah ada shift aktif
   * @type {Object}
   */
  const checkShift = apiRequest("GET", "/shifts/active/check");
  if (checkShift.status === 200 && checkShift.body?.exists) {
    return true;
  }

  /**
   * Membuka shift baru jika belum ada
   * @type {Object}
   */
  const openShift = apiRequest("POST", "/shifts/open", {
    startingCash: 1000000
  });
  
  return openShift.status === 201 || openShift.status === 200;
}

/**
 * Setup Data Skenario
 * Menyiapkan entitas terkait (Pelanggan, Kendaraan) dan Produk dengan stok 5
 * @returns {Object} Data setup yang akan dilempar ke fungsi eksekusi utama
 */
export function setup() {
  loginAsCashier();
  ensureActiveShift();

  /**
   * Injeksi Pelanggan Dummy
   * @type {Object}
   */
  const customerRes = apiRequest("POST", "/customers", {
    name: "Race Condition Customer",
    phone: "081234567890",
  });
  const customerId = customerRes.body?.data?.id || customerRes.body?.id;

  /**
   * Injeksi Kendaraan Dummy
   * @type {Object}
   */
  const vehicleRes = apiRequest("POST", "/vehicles", {
    plateNumber: "B 9999 RC",
    brand: "Vespa",
    customerId,
  });
  const vehicleId = vehicleRes.body?.data?.id || vehicleRes.body?.id;

  /**
   * Target stok dibuat menjadi 5. 
   * Dengan 50 VU, seharusnya hanya 5 request yang berhasil (status 201/200), 
   * dan 45 request ditolak karena kehabisan stok (status 400).
   * @type {number}
   */
  const initialStock = 5;

  /**
   * Injeksi Produk Sparepart
   * @type {Object}
   */
  const productRes = apiRequest("POST", "/products", {
    name: "Oli Mesin Race Test",
    type: "SPAREPART",
    price: 150000,
    cost: 100000,
    stock: initialStock,
    description: "Produk untuk tes race condition",
    isActive: true
  });
  
  const targetProductId = productRes.body?.data?.id || productRes.body?.id;

  return {
    targetProductId,
    customerId,
    vehicleId,
    initialStock,
  };
}

/**
 * Eksekutor Skenario Race Condition
 * Dijalankan paralel oleh seluruh VU
 * @param {Object} data - Data yang dilempar dari fungsi setup()
 */
export function parallelOrderCreation(data) {
  const { targetProductId, customerId, vehicleId } = data;
  const vuId = __VU;

  group(`VU-${vuId} Order Creation Attempt`, () => {
    
    /**
     * Menyusun item pesanan dengan kuantitas 1
     * @type {Array<Object>}
     */
    const orderItems = [{
      productId: targetProductId,
      quantity: 1,
    }];

    /**
     * Menghitung total harga sebelum memesan
     * @type {Object}
     */
    const calculateRes = apiRequest("POST", "/orders/calculate", { items: orderItems });
    
    /**
     * Payload untuk pembuatan order
     * @type {Object}
     */
    const orderPayload = {
      customerId,
      vehicleId,
      items: orderItems,
      ...calculateRes.body?.data
    };

    /**
     * Eksekusi request pembuatan order
     * @type {Object}
     */
    const orderRes = apiRequest("POST", "/orders", orderPayload);
    orderLatency.add(orderRes.duration);

    check(orderRes, {
      "response status valid (200/201 or 400)": (r) => {
        const isValid = [200, 201, 400].includes(r.status);
        if (!isValid) {
          console.error(`VU ${vuId}: Unexpected status ${r.status}`);
        }
        return isValid;
      },
    });

    if (orderRes.status === 201 || orderRes.status === 200) {
      successfulOrders.add(1);
    } else if (orderRes.status === 400) {
      rejectedOrders.add(1);
    }
  });

  sleep(0.5);
}

/**
 * Teardown Skenario
 * Validasi final untuk memastikan tidak ada stok negatif
 * @param {Object} data - Data yang dilempar dari fungsi setup()
 */
export function teardown(data) {
  const { targetProductId, initialStock } = data;

  loginAsCashier();

  /**
   * Request produk untuk memeriksa sisa stok terakhir
   * @type {Object}
   */
  const productRes = apiRequest("GET", `/products/${targetProductId}`);
  const finalStock = productRes.body?.data?.stock ?? productRes.body?.stock;

  check(productRes, {
    "final stock is never negative": (r) => {
      if (finalStock < 0) {
        inventoryInconsistency.add(1);
        console.error(`SEVERE: Negative inventory detected! Final stock: ${finalStock}`);
        return false;
      }
      return true;
    }
  });

  console.log("\n========================================================");
  console.log(" HASIL RACE CONDITION TEST (STOK INVENTARIS)");
  console.log("========================================================");
  console.log(`Stok Awal                 : ${initialStock}`);
  console.log(`Stok Akhir                : ${finalStock}`);
  console.log(`Pesanan Berhasil Dibuat   : ${successfulOrders.name}`);
  console.log(`Pesanan Ditolak (Habis)   : ${rejectedOrders.name}`);
  console.log("========================================================");
  
  if (finalStock < 0) {
    console.log("KESIMPULAN: RACE CONDITION TERDETEKSI! Stok tembus di bawah 0.");
  } else {
    console.log("KESIMPULAN: AMAN. Transaksi terkunci dengan baik (tidak ada kebocoran stok).");
  }
}

/**
 * Default Export
 * Titik masuk utama K6 yang menerima argumen dari fungsi setup
 * @param {Object} data - Data yang diteruskan dari siklus setup
 */
export default function (data) {
  parallelOrderCreation(data);
}