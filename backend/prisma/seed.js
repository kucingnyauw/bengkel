// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = "rifkyf589@gmail.com";

/**
 * Menghasilkan nomor pesanan unik berdasarkan tanggal
 * Format: ORD-YYYYMMDD-XXXX
 * @param {Date} date - Tanggal pesanan
 * @returns {string} Nomor pesanan
 */
const generateOrderNumber = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
};

const sparepartNames = [
  "Kampas Rem Depan Vespa Sprint", "Oli Mesin Motul 2T", "Busi NGK Racing Vespa",
  "Filter Udara Malossi", "Rantai Keteng Vespa PX", "Gear Set Rasio 4.0",
  "Ban Luar Pirelli Angel Scooter 110/70", "Ban Dalam Vespa 10 Inch", "Aki Kering MotoBatt",
  "Lampu Depan LED Proyektor Vespa", "Kampas Kopling Malossi Fly Clutch", "Shockbreaker Depan Bitubo Vespa GTS",
  "Bearing Roda Depan SKF", "Kabel Gas Domino", "Piston Kit Polini 200cc",
  "Spion Oval Chrome Vespa", "Jok Custom Tepi Vespa", "Knalpot Racing Akrapovic Vespa",
  "CDI Racing BRT", "Koil Pengapian Mallory", "Seal Oli Crankshaft Corteco",
  "Paking Mesin Set Vespa PX", "Busi Racing Denso Iridium", "Kabel Rem Depan Helix Racing",
  "Handle Rem Radial CNC", "Master Rem Brembo PS13", "Disc Brake Floating Vespa GTS",
  "Kaliper Brembo 4 Piston", "Velg Jari Alumunium TK Racing", "Handle Gas Cepat Domino",
];

const serviceNames = [
  "Service Ringan Vespa Matic", "Tune Up Mesin 2-Tak", "Ganti Oli Mesin & Gardan",
  "Cuci Motor Detailing", "Balancing & Spooring Roda", "Overhaul Mesin 2-Tak",
  "Overhaul Mesin 4-Tak", "Pasang Aksesoris & Modifikasi Ringan", "Cek & Perbaiki Kelistrikan",
  "Tambal Ban Tubeless", "Ganti Ban Baru + Balancing", "Service CVT & Pulley",
  "Bore Up Mesin 175cc", "Bore Up Mesin 200cc", "Setting & Sinkronisasi Karburator",
  "Ganti Kampas Rem Depan & Belakang", "Service & Isi Ulang Oli Suspensi", "Detailing & Coating Body",
  "Ganti Aki Baru", "Turun Mesin Full Restorasi",
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
];

const userData = [
  { email: SUPERADMIN_EMAIL, fullName: "Super Admin", phone: "081234567890", role: "SUPERADMIN", isActive: true },
  { email: "admin@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "ADMIN", isActive: true },
  { email: "kasir1@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: true },
  { email: "kasir2@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: true },
  { email: "kasir3@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: false },
  { email: "mekanik1@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik2@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik3@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik4@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik5@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: false },
];

/**
 * Membersihkan semua data di tabel database
 * @returns {Promise<void>}
 */
async function cleanDatabase() {
  console.log("🧹 Membersihkan database...\n");
  const modelNames = [
    "orderStatusHistory", "mechanicAssignment", "stockMovement", "payment",
    "orderItem", "order", "expense", "shift", "productPriceHistory",
    "product", "vehicle", "customer", "notification", "setting", "user",
  ];
  for (const model of modelNames) {
    if (prisma[model]) {
      await prisma[model].deleteMany();
    }
  }
  console.log("✅ Database bersih!\n");
}

/**
 * Membuat order beserta items, payment, dan history
 */
const createOrderWithItems = async (
  status, orderDate, itemsOptions, extraFields = {}, historyOverrides, assignedCashier, assignedCustomer, activeShift
) => {
  const orderNumber = generateOrderNumber(orderDate);
  let subtotal = 0;
  const itemsData = [];

  for (let j = 0; j < itemsOptions.count; j++) {
    const product = faker.helpers.arrayElement(itemsOptions.pool);
    const qty = product.type === "SERVICE" ? 1 : faker.number.int({ min: 1, max: 2 });
    const itemSubtotal = product.price * qty;
    subtotal += itemSubtotal;

    itemsData.push({
      productId: product.id,
      productNameSnapshot: product.name,
      quantity: qty,
      unitPrice: product.price,
      unitCostSnapshot: product.cost,
      subtotal: itemSubtotal,
    });
  }

  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const order = await prisma.order.create({
    data: {
      orderNumber, status, subtotal, tax, total,
      cashierId: assignedCashier.id,
      shiftId: activeShift.id,
      customerId: assignedCustomer.id,
      createdAt: orderDate,
      ...extraFields,
    },
  });

  for (const item of itemsData) {
    await prisma.orderItem.create({ data: { orderId: order.id, ...item } });
  }

  if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: faker.helpers.arrayElement(["CASH", "QRIS"]),
        amountPaid: total,
        change: 0,
        status: "PAID",
        paidAt: orderDate,
      },
    });
  }

  for (const h of historyOverrides) {
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: h.status, changedById: h.changedById, note: h.note },
    });
  }
  return order;
};

/**
 * Fungsi utama seeding database
 * @returns {Promise<void>}
 */
async function seed() {
  await cleanDatabase();
  console.log("🌱 Mulai seeding database Bengkel Vespa dengan Faker...\n");

  // ==========================================
  // 0. Settings
  // ==========================================
  console.log("⚙️ [0/10] Membuat Default Settings...");
  for (const setting of defaultSettings) {
    await prisma.setting.create({ data: setting });
  }
  console.log(`   ✅ ${defaultSettings.length} settings\n`);

  // ==========================================
  // 1. Users
  // ==========================================
  console.log("👤 [1/10] Membuat Users...");
  const createdUsers = [];
  for (const user of userData) {
    const created = await prisma.user.create({ data: user });
    createdUsers.push(created);
  }
  const superAdmin = createdUsers.find((u) => u.role === "SUPERADMIN");
  const admin = createdUsers.find((u) => u.role === "ADMIN");
  const cashiers = createdUsers.filter((u) => u.role === "CASHIER" && u.isActive);
  const mechanics = createdUsers.filter((u) => u.role === "MECHANIC" && u.isActive);
  const inactiveCashier = createdUsers.find((u) => u.role === "CASHIER" && !u.isActive);
  console.log(`   ✅ ${createdUsers.length} users\n`);

  // ==========================================
  // 2. Customers & Vehicles
  // ==========================================
  console.log("👥 [2/10] Membuat Customers & Vehicles...");
  const dbCustomers = [];
  let vehicleTotal = 0;

  for (let i = 0; i < 30; i++) {
    const customer = await prisma.customer.create({
      data: { name: faker.person.fullName(), phone: faker.phone.number() },
    });
    dbCustomers.push(customer);

    const vehicleCount = faker.number.int({ min: 1, max: 2 });
    for (let v = 0; v < vehicleCount; v++) {
      await prisma.vehicle.create({
        data: {
          plateNumber: `B ${faker.number.int({ min: 1000, max: 9999 })} ${faker.string.alpha({ length: { min: 2, max: 3 }, casing: "upper" })}`,
          brand: "Vespa",
          model: faker.helpers.arrayElement(["Sprint 150", "Primavera 150", "GTS Super 300", "PX 150", "S 125", "LX 125"]),
          customerId: customer.id,
        },
      });
      vehicleTotal++;
    }
  }
  console.log(`   ✅ 30 customers, ${vehicleTotal} vehicles\n`);

  // ==========================================
  // 3. Products
  // ==========================================
  console.log("🏍️ [3/10] Membuat Products...");
  const products = [];

  for (const name of sparepartNames) {
    const price = faker.number.int({ min: 15, max: 500 }) * 1000;
    const cost = Math.floor(price * 0.6);
    const stock = faker.number.int({ min: 20, max: 70 });

    const p = await prisma.product.create({
      data: {
        name,
        sku: `SP-${String(products.length + 1).padStart(3, "0")}`,
        type: "SPAREPART",
        description: `Sparepart asli Vespa: ${name}.`,
        price,
        cost,
        stock,
        isActive: true,
      },
    });
    products.push(p);

    // Price history
    await prisma.productPriceHistory.create({
      data: { productId: p.id, price: p.price, cost: p.cost, effectiveFrom: faker.date.recent({ days: 30 }) },
    });

    // Stock movement initial
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        sourceType: "PURCHASE",
        quantity: stock,
        recordedById: superAdmin.id,
        note: "Stok awal",
        createdAt: faker.date.recent({ days: 30 }),
      },
    });
  }

  for (const name of serviceNames) {
    const price = faker.number.int({ min: 50, max: 500 }) * 1000;
    const cost = Math.floor(price * 0.4);

    const p = await prisma.product.create({
      data: {
        name,
        sku: `SV-${String(products.length + 1).padStart(3, "0")}`,
        type: "SERVICE",
        description: `Jasa servis & modifikasi Vespa: ${name}.`,
        price,
        cost,
        stock: 0,
        isActive: true,
      },
    });
    products.push(p);

    // Price history
    await prisma.productPriceHistory.create({
      data: { productId: p.id, price: p.price, cost: p.cost, effectiveFrom: faker.date.recent({ days: 30 }) },
    });
  }

  const activeProducts = products.filter((p) => p.isActive);
  const spareparts = activeProducts.filter((p) => p.type === "SPAREPART");
  const services = activeProducts.filter((p) => p.type === "SERVICE");
  console.log(`   ✅ ${products.length} products (${spareparts.length} spareparts, ${services.length} services)\n`);

  // ==========================================
  // 4. Products (Low Stock)
  // ==========================================
  console.log("📉 [4/10] Membuat produk stok rendah...");
  const lowStockProducts = spareparts.slice(0, 8);
  for (let i = 0; i < lowStockProducts.length; i++) {
    const newStock = i < 2 ? 0 : i < 5 ? faker.number.int({ min: 1, max: 3 }) : faker.number.int({ min: 4, max: 5 });
    await prisma.product.update({ 
      where: { id: lowStockProducts[i].id }, 
      data: { stock: newStock } 
    });
  }
  console.log(`   ✅ ${lowStockProducts.length} produk stok rendah\n`);

  // ==========================================
  // 5. Shifts
  // ==========================================
  console.log("🕐 [5/10] Membuat Shifts...");
  const shifts = [];
  const now = new Date();
  
  // Shift aktif untuk hari ini (OPEN)
  const activeShift = await prisma.shift.create({
    data: {
      cashierId: cashiers[0].id,
      status: "OPEN",
      startingCash: 1000000,
      openedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
      cashSales: 0,
      cashIn: 0,
      cashOut: 0,
    },
  });
  shifts.push(activeShift);

  // Shift tertutup untuk hari-hari sebelumnya (7 hari)
  for (let i = 1; i <= 7; i++) {
    const shiftDate = new Date(now);
    shiftDate.setDate(shiftDate.getDate() - i);
    
    const startingCash = faker.number.int({ min: 800000, max: 1500000 });
    const cashSales = faker.number.int({ min: 2000000, max: 8000000 });
    const cashIn = cashSales;
    const cashOut = faker.number.int({ min: 100000, max: 500000 });
    const expectedCash = startingCash + cashIn - cashOut;
    const endingCash = expectedCash + faker.number.int({ min: -50000, max: 50000 });
    const discrepancy = endingCash - expectedCash;

    const shift = await prisma.shift.create({
      data: {
        cashierId: faker.helpers.arrayElement(cashiers).id,
        status: "CLOSED",
        startingCash,
        endingCash,
        expectedCash,
        cashSales,
        cashIn,
        cashOut,
        discrepancy,
        openedAt: new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 8, 0, 0),
        closedAt: new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 20, 0, 0),
      },
    });
    shifts.push(shift);
  }
  console.log(`   ✅ ${shifts.length} shifts (1 open, ${shifts.length - 1} closed)\n`);

  // ==========================================
  // 6. Expenses
  // ==========================================
  console.log("💰 [6/10] Membuat Expenses...");
  let expenseCount = 0;
  
  // Expenses untuk shift aktif (hari ini)
  const todayExpenses = [
    { title: "Beli Air Mineral Galon", amount: 25000, category: "SUPPLIES" },
    { title: "Bensin untuk test ride", amount: 50000, category: "OTHER" },
  ];
  
  for (const exp of todayExpenses) {
    await prisma.expense.create({
      data: {
        ...exp,
        description: faker.lorem.sentence(),
        shiftId: activeShift.id,
        recordedById: cashiers[0].id,
        date: new Date(),
      },
    });
    expenseCount++;
  }

  // Expenses untuk shift tertutup (7 hari terakhir)
  for (let i = 1; i < shifts.length; i++) {
    const numExpenses = faker.number.int({ min: 2, max: 5 });
    for (let j = 0; j < numExpenses; j++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement([
            "Beli ATK", "Beli Kopi dan Snack", "Biaya Kebersihan", 
            "Beli Sparepart Mendesak", "Listrik Bulanan", "Sewa Tempat",
            "Perbaikan Alat", "Biaya Transport", "Beli Oli Sample",
          ]),
          description: faker.lorem.sentence(),
          amount: faker.number.int({ min: 10000, max: 500000 }),
          category: faker.helpers.arrayElement(["SUPPLIES", "MAINTENANCE", "UTILITIES", "RENT", "OTHER"]),
          shiftId: shifts[i].id,
          recordedById: shifts[i].cashierId,
          date: shifts[i].openedAt,
        },
      });
      expenseCount++;
    }
  }
  console.log(`   ✅ ${expenseCount} expenses\n`);

  // ==========================================
  // 7-9. Orders dengan berbagai status
  // ==========================================
  console.log("📋 [7/10] Membuat Orders (DRAFT)...");
  let totalOrders = 0;
  let totalItems = 0;
  let totalPayments = 0;
  let totalHistories = 0;

  const closedShifts = shifts.filter(s => s.status === "CLOSED");
  const statuses = [
    { name: "DRAFT", orderCount: { min: 3, max: 5 }, itemCount: { min: 1, max: 3 } },
    { name: "QUEUED", orderCount: { min: 8, max: 12 }, itemCount: { min: 1, max: 4 } },
    { name: "IN_PROGRESS", orderCount: { min: 5, max: 8 }, itemCount: { min: 2, max: 5 } },
    { name: "COMPLETED", orderCount: { min: 6, max: 10 }, itemCount: { min: 2, max: 6 } },
    { name: "CLOSED", orderCount: { min: 10, max: 15 }, itemCount: { min: 1, max: 5 } },
    { name: "CANCELLED", orderCount: { min: 1, max: 3 }, itemCount: { min: 1, max: 2 } },
  ];

  // Orders untuk shift tertutup
  for (const statusConfig of statuses) {
    const count = faker.number.int(statusConfig.orderCount);
    
    for (let i = 0; i < count; i++) {
      const shift = faker.helpers.arrayElement(closedShifts);
      const customer = faker.helpers.arrayElement(dbCustomers);
      const customerVehicles = await prisma.vehicle.findMany({ where: { customerId: customer.id } });
      const vehicle = customerVehicles.length > 0 ? faker.helpers.arrayElement(customerVehicles) : null;
      
      const itemCount = faker.number.int(statusConfig.itemCount);
      const items = [];
      let orderSubtotal = 0;

      // Pilih kombinasi sparepart dan service
      const serviceCount = faker.number.int({ min: 0, max: 2 });
      const sparepartCount = itemCount - serviceCount;

      for (let j = 0; j < itemCount; j++) {
        const isService = j < serviceCount;
        const pool = isService ? services : spareparts;
        const product = faker.helpers.arrayElement(pool);
        const qty = isService ? 1 : faker.number.int({ min: 1, max: 3 });
        const itemSubtotal = product.price * qty;
        orderSubtotal += itemSubtotal;

        items.push({
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: qty,
          unitPrice: product.price,
          unitCostSnapshot: product.cost,
          subtotal: itemSubtotal,
        });
      }

      const tax = Math.round(orderSubtotal * 0.11);
      const total = orderSubtotal + tax;
      const orderDate = faker.date.between({ from: shift.openedAt, to: shift.closedAt || shift.openedAt });
      
      // Tentukan timestamps berdasarkan status
      let diagnosedAt = null;
      let startedAt = null;
      let completedAt = null;
      let closedAt = null;

      if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(statusConfig.name)) {
        diagnosedAt = new Date(orderDate.getTime() + faker.number.int({ min: 5, max: 30 }) * 60000);
      }
      if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(statusConfig.name)) {
        startedAt = new Date(diagnosedAt.getTime() + faker.number.int({ min: 15, max: 60 }) * 60000);
      }
      if (["COMPLETED", "CLOSED"].includes(statusConfig.name)) {
        completedAt = new Date(startedAt.getTime() + faker.number.int({ min: 30, max: 180 }) * 60000);
      }
      if (statusConfig.name === "CLOSED") {
        closedAt = new Date(completedAt.getTime() + faker.number.int({ min: 5, max: 30 }) * 60000);
      }

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(orderDate),
          status: statusConfig.name,
          subtotal: orderSubtotal,
          tax,
          total,
          diagnosedAt,
          startedAt,
          completedAt,
          closedAt,
          cashierId: shift.cashierId,
          shiftId: shift.id,
          customerId: customer.id,
          vehicleId: vehicle?.id || null,
          createdAt: orderDate,
          updatedAt: closedAt || completedAt || startedAt || diagnosedAt || orderDate,
        },
      });

      // Create order items
      for (const item of items) {
        const orderItem = await prisma.orderItem.create({ 
          data: { 
            orderId: order.id, 
            ...item 
          } 
        });
        totalItems++;

        // Stock movement untuk sparepart
        const product = products.find(p => p.id === item.productId);
        if (product && product.type === "SPAREPART" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(statusConfig.name)) {
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              type: "OUT",
              sourceType: "SALE",
              quantity: -item.quantity,
              orderItemId: orderItem.id,
              recordedById: shift.cashierId,
              note: `Penjualan dari order ${order.orderNumber}`,
              createdAt: startedAt || orderDate,
            },
          });

          // Update stock
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Mechanic assignment untuk service
        if (product && product.type === "SERVICE" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(statusConfig.name)) {
          const mechanic = faker.helpers.arrayElement(mechanics);
          await prisma.mechanicAssignment.create({
            data: {
              orderItemId: orderItem.id,
              mechanicId: mechanic.id,
              startAt: startedAt || orderDate,
              endAt: completedAt || null,
            },
          });
        }
      }

      totalOrders++;

      // Payment
      if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(statusConfig.name)) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: faker.helpers.arrayElement(["CASH", "QRIS"]),
            amountPaid: total,
            change: 0,
            status: "PAID",
            paidAt: diagnosedAt || orderDate,
          },
        });
        totalPayments++;
      }

      // Order status history
      const statusFlow = {
        DRAFT: [{ status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" }],
        QUEUED: [
          { status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" },
          { status: "QUEUED", changedById: shift.cashierId, note: "Order masuk antrian" },
        ],
        IN_PROGRESS: [
          { status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" },
          { status: "QUEUED", changedById: shift.cashierId, note: "Order masuk antrian" },
          { status: "IN_PROGRESS", changedById: faker.helpers.arrayElement(mechanics).id, note: "Pengerjaan dimulai" },
        ],
        COMPLETED: [
          { status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" },
          { status: "QUEUED", changedById: shift.cashierId, note: "Order masuk antrian" },
          { status: "IN_PROGRESS", changedById: faker.helpers.arrayElement(mechanics).id, note: "Pengerjaan dimulai" },
          { status: "COMPLETED", changedById: faker.helpers.arrayElement(mechanics).id, note: "Pengerjaan selesai" },
        ],
        CLOSED: [
          { status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" },
          { status: "QUEUED", changedById: shift.cashierId, note: "Order masuk antrian" },
          { status: "IN_PROGRESS", changedById: faker.helpers.arrayElement(mechanics).id, note: "Pengerjaan dimulai" },
          { status: "COMPLETED", changedById: faker.helpers.arrayElement(mechanics).id, note: "Pengerjaan selesai" },
          { status: "CLOSED", changedById: shift.cashierId, note: "Order ditutup" },
        ],
        CANCELLED: [
          { status: "DRAFT", changedById: shift.cashierId, note: "Order dibuat" },
          { status: "CANCELLED", changedById: shift.cashierId, note: "Order dibatalkan" },
        ],
      };

      const histories = statusFlow[statusConfig.name] || statusFlow.DRAFT;
      for (const h of histories) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: h.status,
            changedById: h.changedById,
            note: h.note,
            createdAt: orderDate,
          },
        });
        totalHistories++;
      }
    }
  }

  // Orders untuk shift aktif (hari ini)
  console.log("📋 [8/10] Membuat Orders untuk shift aktif...");
  const todayStatuses = ["DRAFT", "QUEUED", "IN_PROGRESS", "COMPLETED"];
  
  for (const status of todayStatuses) {
    const count = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < count; i++) {
      const customer = faker.helpers.arrayElement(dbCustomers);
      const itemCount = faker.number.int({ min: 1, max: 4 });
      const items = [];
      let orderSubtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const isService = faker.datatype.boolean();
        const pool = isService ? services : spareparts;
        const product = faker.helpers.arrayElement(pool);
        const qty = isService ? 1 : faker.number.int({ min: 1, max: 2 });
        const itemSubtotal = product.price * qty;
        orderSubtotal += itemSubtotal;

        items.push({
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: qty,
          unitPrice: product.price,
          unitCostSnapshot: product.cost,
          subtotal: itemSubtotal,
        });
      }

      const tax = Math.round(orderSubtotal * 0.11);
      const total = orderSubtotal + tax;
      const orderDate = faker.date.between({ 
        from: activeShift.openedAt, 
        to: new Date() 
      });
      
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(orderDate),
          status,
          subtotal: orderSubtotal,
          tax,
          total,
          cashierId: activeShift.cashierId,
          shiftId: activeShift.id,
          customerId: customer.id,
          createdAt: orderDate,
        },
      });

      for (const item of items) {
        await prisma.orderItem.create({ 
          data: { 
            orderId: order.id, 
            ...item 
          } 
        });
        totalItems++;
      }
      totalOrders++;

      // Status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          changedById: activeShift.cashierId,
          note: `Order ${status.toLowerCase()}`,
          createdAt: orderDate,
        },
      });
      totalHistories++;
    }
  }
  
  console.log(`   ✅ ${totalOrders} orders, ${totalItems} items`);
  console.log(`   ✅ ${totalPayments} payments, ${totalHistories} histories\n`);

  // ==========================================
  // 9. Notifications
  // ==========================================
  console.log("🔔 [9/10] Membuat Notifications...");
  let notificationCount = 0;

  // Notifikasi stok rendah untuk admin dan superadmin
  const adminUsers = [superAdmin, admin];
  for (const product of lowStockProducts.slice(0, 5)) {
    for (const user of adminUsers) {
      await prisma.notification.create({
        data: {
          title: "Stok Rendah",
          message: `Produk ${product.name} stok tinggal ${product.stock} unit`,
          type: product.stock === 0 ? "ERROR" : "WARNING",
          userId: user.id,
          isRead: faker.datatype.boolean(),
          createdAt: faker.date.recent({ days: 2 }),
        },
      });
      notificationCount++;
    }
  }

  // Notifikasi umum untuk semua user
  const notificationMessages = [
    { title: "Selamat Datang", message: "Selamat datang di sistem bengkel Vespa", type: "INFO" },
    { title: "Target Tercapai", message: "Target servis harian tercapai", type: "SUCCESS" },
    { title: "Shift Dibuka", message: "Shift baru telah dibuka", type: "INFO" },
    { title: "Maintenance", message: "Sistem akan maintenance malam ini", type: "WARNING" },
  ];

  for (const user of createdUsers.filter(u => u.isActive)) {
    const notif = faker.helpers.arrayElement(notificationMessages);
    await prisma.notification.create({
      data: {
        ...notif,
        userId: user.id,
        isRead: faker.datatype.boolean(),
        createdAt: faker.date.recent({ days: 7 }),
      },
    });
    notificationCount++;
  }
  console.log(`   ✅ ${notificationCount} notifications\n`);

  // ==========================================
  // Summary
  // ==========================================
  console.log("========================================");
  console.log("✅ SEED BENGKEL VESPA BERHASIL!\n");
  console.log("📊 Ringkasan:");
  console.log(`   • Settings: ${await prisma.setting.count()}`);
  console.log(`   • Users: ${await prisma.user.count()}`);
  console.log(`   • Customers: ${await prisma.customer.count()}`);
  console.log(`   • Vehicles: ${await prisma.vehicle.count()}`);
  console.log(`   • Products: ${await prisma.product.count()}`);
  console.log(`   • Shifts: ${await prisma.shift.count()}`);
  console.log(`   • Expenses: ${await prisma.expense.count()}`);
  console.log(`   • Orders: ${await prisma.order.count()}`);
  console.log(`   • Order Items: ${await prisma.orderItem.count()}`);
  console.log(`   • Payments: ${await prisma.payment.count()}`);
  console.log(`   • Order Histories: ${await prisma.orderStatusHistory.count()}`);
  console.log(`   • Stock Movements: ${await prisma.stockMovement.count()}`);
  console.log(`   • Mechanic Assignments: ${await prisma.mechanicAssignment.count()}`);
  console.log(`   • Notifications: ${await prisma.notification.count()}`);
  console.log(`   • Price Histories: ${await prisma.productPriceHistory.count()}`);

  console.log("\n📋 Data siap digunakan!");
  console.log(`   • Shift aktif: Kasir ${cashiers[0].fullName}`);
  console.log(`   • Login Super Admin: ${SUPERADMIN_EMAIL}`);
  console.log("\n🎉 Selesai!\n");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });