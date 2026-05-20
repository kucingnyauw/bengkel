// k6/load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomIntBetween, randomItem, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================
// Custom Metrics
// ============================================================
const createOrderDuration = new Trend('create_order_duration', true);
const paymentDuration = new Trend('payment_duration', true);
const getOrdersDuration = new Trend('get_orders_duration', true);
const apiDuration = new Trend('api_duration', true);
const errorRate = new Rate('error_rate');
const successCounter = new Counter('success_count');
const errorCounter = new Counter('error_count');

// ============================================================
// Test Configuration
// ============================================================
export const options = {
  // Smoke Test (default)
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],

  // Production Load (uncomment for production testing)
  // stages: [
  //   { duration: '1m', target: 20 },
  //   { duration: '3m', target: 50 },
  //   { duration: '1m', target: 100 },
  //   { duration: '3m', target: 100 },
  //   { duration: '2m', target: 0 },
  // ],

  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
    'create_order_duration': ['p(95)<5000'],
    'payment_duration': ['p(95)<5000'],
    error_rate: ['rate<0.05'],
  },

  noConnectionReuse: false,
  userAgent: 'K6-LoadTest/1.0',
};

// ============================================================
// Environment Configuration
// ============================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_VERSION = __ENV.API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

// Development mode - use x-dev-email header
const IS_DEV = __ENV.IS_DEV === 'true' || true; // Default to dev mode
const DEV_EMAILS = [
  'admin@bengkel.com',
  'cashier@bengkel.com',
  'mechanic@bengkel.com',
];

// Supabase token (for production testing, set via environment)
const SUPABASE_TOKEN = __ENV.SUPABASE_TOKEN || '';

// ============================================================
// Helper Functions
// ============================================================
function getAuthHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (IS_DEV) {
    // Development mode - use x-dev-email header
    const devEmail = __ENV.DEV_EMAIL || randomItem(DEV_EMAILS);
    headers['x-dev-email'] = devEmail;
  } else if (token) {
    // Production mode - use Bearer token
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function makeRequest(method, path, body = null, token = null, timeout = '30s') {
  const headers = getAuthHeaders(token);
  const params = {
    headers,
    timeout,
    tags: { name: `${method} ${path}` },
  };

  let response;
  const url = `${API_URL}${path}`;

  const startTime = Date.now();
  if (body) {
    response = http[method.toLowerCase()](url, JSON.stringify(body), params);
  } else {
    response = http[method.toLowerCase()](url, null, params);
  }
  const duration = Date.now() - startTime;

  apiDuration.add(duration);

  const isSuccess = response.status >= 200 && response.status < 300;
  if (isSuccess) {
    successCounter.add(1);
  } else {
    errorCounter.add(1);
    errorRate.add(1);
    if (response.status !== 404) { // 404 is expected for some endpoints
      console.error(`${method} ${path} FAILED [${response.status}]: ${response.body.substring(0, 200)}`);
    }
  }

  // Parse JSON safely
  let jsonBody = null;
  try {
    jsonBody = response.json();
  } catch (e) {
    // Not JSON response
  }

  return {
    status: response.status,
    body: jsonBody,
    duration,
    response,
  };
}

// Simulate Supabase auth for production (if token provided)
function getProductionToken() {
  if (SUPABASE_TOKEN) return SUPABASE_TOKEN;
  if (IS_DEV) return null;
  console.warn('No SUPABASE_TOKEN set, using dev mode');
  return null;
}

// ============================================================
// Test Data Generators
// ============================================================
function generateOrderPayload() {
  const items = [
    {
      productId: randomItem(['svc-oil-change', 'svc-tune-up', 'svc-brake-service']),
      quantity: randomIntBetween(1, 2),
    },
    {
      productId: randomItem(['sp-oil-filter', 'sp-brake-pad', 'sp-spark-plug']),
      quantity: randomIntBetween(1, 3),
    },
  ];

  return {
    customerId: randomItem(['cust-001', 'cust-002', 'cust-003']),
    vehicleId: randomItem(['veh-001', 'veh-002', 'veh-003']),
    items,
  };
}

function generatePaymentPayload(orderId, total) {
  return {
    orderId,
    method: 'CASH',
    amountPaid: total + randomIntBetween(0, 50000),
  };
}

// ============================================================
// Setup - Pre-load data
// ============================================================
export function setup() {
  console.log('=== Setup: Testing API Connectivity ===');

  const result = {
    products: { services: [], spareparts: [] },
    mechanicId: null,
    customers: [],
    vehicles: [],
  };

  // Test health check / get products
  const productsRes = makeRequest('GET', '/products', null, getProductionToken());
  if (productsRes.status === 200 && productsRes.body?.data) {
    const products = productsRes.body.data;
    result.products.services = products
      .filter(p => p.type === 'SERVICE')
      .map(p => p.id);
    result.products.spareparts = products
      .filter(p => p.type === 'SPAREPART')
      .map(p => p.id);
    console.log(`Loaded ${products.length} products`);
  }

  // Get customers
  const customersRes = makeRequest('GET', '/customers', null, getProductionToken());
  if (customersRes.status === 200 && customersRes.body?.data) {
    result.customers = customersRes.body.data.map(c => c.id);
    console.log(`Loaded ${result.customers.length} customers`);
  }

  // Get vehicles
  const vehiclesRes = makeRequest('GET', '/vehicles', null, getProductionToken());
  if (vehiclesRes.status === 200 && vehiclesRes.body?.data) {
    result.vehicles = vehiclesRes.body.data.map(v => v.id);
    console.log(`Loaded ${result.vehicles.length} vehicles`);
  }

  // Get available mechanics
  const mechRes = makeRequest('GET', '/tasks/mechanics/available', null, getProductionToken());
  if (mechRes.status === 200 && mechRes.body?.data?.length > 0) {
    result.mechanicId = mechRes.body.data[0].id;
    console.log(`Found mechanic: ${result.mechanicId}`);
  }

  console.log('=== Setup Complete ===\n');
  return result;
}

// ============================================================
// Main Test Scenarios
// ============================================================
export default function (data) {
  const token = getProductionToken();
  const { products, customers, vehicles, mechanicId } = data;

  // Fallback IDs if setup didn't return data
  const serviceIds = products?.services?.length > 0
    ? products.services
    : ['svc-oil-change', 'svc-tune-up'];
  const sparepartIds = products?.spareparts?.length > 0
    ? products.spareparts
    : ['sp-oil-filter', 'sp-brake-pad'];
  const customerIds = customers?.length > 0 ? customers : ['cust-001', 'cust-002'];
  const vehicleIds = vehicles?.length > 0 ? vehicles : ['veh-001', 'veh-002'];

  // ============================================================
  // Scenario 1: Cashier Workflow (50% of iterations)
  // ============================================================
  group('Cashier Workflow', () => {
    // 1.1 Check active shift
    group('Check Shift', () => {
      const res = makeRequest('GET', '/shifts/active', null, token);
      check(res, {
        'shift check completed': (r) => r.status === 200 || r.status === 404,
      });
      sleep(0.3);
    });

    // 1.2 Get products
    group('Get Products', () => {
      const res = makeRequest('GET', '/products?page=1&limit=20', null, token);
      check(res, {
        'products loaded': (r) => r.status === 200,
      });
      sleep(0.3);
    });

    // 1.3 Calculate order
    group('Calculate Order', () => {
      const items = [
        { productId: randomItem(serviceIds), quantity: randomIntBetween(1, 2) },
        { productId: randomItem(sparepartIds), quantity: randomIntBetween(1, 3) },
      ];

      const res = makeRequest('POST', '/orders/calculate', { items }, token);

      const calcSuccess = check(res, {
        'calculate success': (r) => r.status === 200,
        'has total': (r) => r.body?.total > 0,
      });

      if (calcSuccess) {
        const orderTotal = res.body.total;

        // 1.4 Create order
        group('Create Order', () => {
          const orderPayload = {
            customerId: randomItem(customerIds),
            vehicleId: randomItem(vehicleIds),
            items,
          };

          const createRes = makeRequest('POST', '/orders', orderPayload, token);
          const orderId = createRes.body?.id;
          const orderNumber = createRes.body?.orderNumber;

          const orderCreated = check(createRes, {
            'order created': (r) => r.status === 200 || r.status === 201,
            'has order id': () => orderId !== undefined,
          });

          if (orderCreated) {
            createOrderDuration.add(createRes.duration);

            // 1.5 Create payment
            group('Create Payment', () => {
              const paymentPayload = {
                orderId,
                method: 'CASH',
                amountPaid: orderTotal + randomIntBetween(0, 50000),
              };

              const payRes = makeRequest('POST', '/payments', paymentPayload, token);
              check(payRes, {
                'payment success': (r) => r.status === 200 || r.status === 201,
              });
              paymentDuration.add(payRes.duration);
              sleep(0.5);
            });

            // 1.6 Get order details
            group('Get Order', () => {
              const res = makeRequest('GET', `/orders/${orderId}`, null, token);
              check(res, {
                'order retrieved': (r) => r.status === 200,
              });
              getOrdersDuration.add(res.duration);
              sleep(0.3);
            });
          }
        });
      }
    });

    // 1.7 Get customers list
    group('Get Customers', () => {
      const res = makeRequest('GET', '/customers?page=1&limit=10', null, token);
      check(res, {
        'customers loaded': (r) => r.status === 200,
      });
      sleep(0.3);
    });

    // 1.8 Get vehicles
    group('Get Vehicles', () => {
      const res = makeRequest('GET', '/vehicles?page=1&limit=10', null, token);
      check(res, {
        'vehicles loaded': (r) => r.status === 200,
      });
      sleep(0.3);
    });
  });

  // ============================================================
  // Scenario 2: Mechanic Workflow (30% of iterations)
  // ============================================================
  if (Math.random() < 0.3) {
    group('Mechanic Workflow', () => {
      // 2.1 Get my tasks
      group('My Tasks', () => {
        const res = makeRequest('GET', '/tasks/me', null, token);
        check(res, {
          'tasks loaded': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 2.2 Get task history
      group('Task History', () => {
        const res = makeRequest('GET', '/tasks/me/history?page=1&limit=10', null, token);
        check(res, {
          'history loaded': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 2.3 Get dashboard
      group('Dashboard', () => {
        const res = makeRequest('GET', '/reports/dashboard', null, token);
        check(res, {
          'dashboard loaded': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 2.4 Get mechanic performance
      group('Performance', () => {
        const res = makeRequest('GET', '/reports/mechanics/me/tasks', null, token);
        // This might 404 if no mechanic ID, that's ok
        check(res, {
          'performance check ok': (r) => r.status === 200 || r.status === 404,
        });
        sleep(0.3);
      });
    });
  }

  // ============================================================
  // Scenario 3: Admin Workflow (20% of iterations)
  // ============================================================
  if (Math.random() < 0.2) {
    group('Admin Workflow', () => {
      // 3.1 Dashboard
      group('Dashboard', () => {
        const res = makeRequest('GET', '/reports/dashboard', null, token);
        check(res, {
          'dashboard ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 3.2 Sales report
      group('Sales Report', () => {
        const res = makeRequest('GET', '/reports/sales?startDate=2024-01-01&endDate=2024-12-31', null, token);
        check(res, {
          'sales report ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 3.3 Profit/Loss report
      group('Profit/Loss', () => {
        const res = makeRequest('GET', '/reports/profit-loss', null, token);
        check(res, {
          'p&l report ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 3.4 All orders
      group('All Orders', () => {
        const res = makeRequest('GET', '/orders?page=1&limit=20', null, token);
        check(res, {
          'orders ok': (r) => r.status === 200,
        });
        getOrdersDuration.add(res.duration);
        sleep(0.3);
      });

      // 3.5 All shifts
      group('All Shifts', () => {
        const res = makeRequest('GET', '/shifts?page=1&limit=10', null, token);
        check(res, {
          'shifts ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 3.6 All users
      group('All Users', () => {
        const res = makeRequest('GET', '/users?page=1&limit=10', null, token);
        check(res, {
          'users ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });

      // 3.7 Stock movements
      group('Stock Movements', () => {
        const res = makeRequest('GET', '/stock/movements?page=1&limit=10', null, token);
        check(res, {
          'stock ok': (r) => r.status === 200,
        });
        sleep(0.3);
      });
    });
  }

  // Random think time
  sleep(randomIntBetween(1, 3));
}

// ============================================================
// Teardown
// ============================================================
export function teardown(data) {
  console.log('\n=== Load Test Complete ===');
  console.log(`Success Count: ${successCounter.value}`);
  console.log(`Error Count: ${errorCounter.value}`);
  console.log(`Error Rate: ${(errorRate.value * 100).toFixed(2)}%`);
  console.log(`Avg API Duration: ${apiDuration.avg?.toFixed(2) || 'N/A'}ms`);
  console.log(`Avg Create Order: ${createOrderDuration.avg?.toFixed(2) || 'N/A'}ms`);
  console.log(`Avg Payment: ${paymentDuration.avg?.toFixed(2) || 'N/A'}ms`);
}