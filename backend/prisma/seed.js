// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "rifkyf589@gmail.com";

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
  "Spion Oval Chrome Vespa", "Knalpot Racing Akrapovic Vespa", "CDI Racing BRT",
  "Paking Mesin Set Vespa PX", "Busi Racing Denso Iridium"
];

const serviceNames = [
  "Service Ringan Vespa Matic", "Tune Up Mesin 2-Tak", "Ganti Oli Mesin & Gardan",
  "Cuci Motor Detailing", "Balancing & Spooring Roda", "Overhaul Mesin 2-Tak",
  "Overhaul Mesin 4-Tak", "Tambal Ban Tubeless", "Ganti Ban Baru + Balancing", 
  "Service CVT & Pulley", "Ganti Kampas Rem Depan & Belakang", "Bore Up Mesin 175cc"
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
];

const userData = [
  { email: ADMIN_EMAIL, fullName: "Admin Utama", phone: "081234567890", role: "ADMIN", isActive: true, isAuthenticated: true },
  { email: "kasir1@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: true },
  { email: "kasir2@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: true },
  { email: "kasir3@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "CASHIER", isActive: true },
  { email: "mekanik1@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik2@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
  { email: "mekanik3@bengkel.com", fullName: faker.person.fullName(), phone: faker.phone.number(), role: "MECHANIC", isActive: true },
];

async function cleanDatabase() {
  console.log("🧹 Membersihkan database...\n");
  const models = ["Notification", "OrderStatusHistory", "MechanicAssignment", "StockMovement", "Payment", "OrderItem", "Order", "Expense", "Shift", "ProductPriceHistory", "Product", "Vehicle", "Customer", "Setting", "File", "User"];
  for (const model of models) {
    if (prisma[model.charAt(0).toLowerCase() + model.slice(1)]) {
      await prisma[model.charAt(0).toLowerCase() + model.slice(1)].deleteMany();
    }
  }
}

async function seed() {
  await cleanDatabase();
  console.log("🌱 Mulai seeding database (Volume Sedang)...\n");

  console.log("⚙️ [1/6] Membuat Settings & Users...");
  for (const setting of defaultSettings) await prisma.setting.create({ data: setting });
  
  const createdUsers = [];
  for (const user of userData) createdUsers.push(await prisma.user.create({ data: user }));
  
  const admin = createdUsers.find(u => u.role === "ADMIN");
  const cashiers = createdUsers.filter(u => u.role === "CASHIER");
  const mechanics = createdUsers.filter(u => u.role === "MECHANIC");

  console.log("👥 [2/6] Membuat 50 Customers & Vehicles...");
  const dbCustomers = [];
  for (let i = 0; i < 50; i++) {
    const customer = await prisma.customer.create({ data: { name: faker.person.fullName(), phone: faker.phone.number() } });
    dbCustomers.push(customer);
    
    // Setiap customer bisa punya 1 atau 2 motor
    const vehicleCount = faker.number.int({ min: 1, max: 2 });
    for (let v = 0; v < vehicleCount; v++) {
      await prisma.vehicle.create({
        data: {
          plateNumber: `B ${faker.number.int({ min: 1000, max: 9999 })} ${faker.string.alpha({ length: 3, casing: "upper" })}`,
          brand: "Vespa", model: faker.helpers.arrayElement(["Sprint 150", "Primavera 150", "GTS Super 300", "PX 150", "S 125", "LX 125"]),
          customerId: customer.id,
        },
      });
    }
  }

  console.log("🏍️ [3/6] Membuat Products & Initial Stock...");
  const spareparts = [];
  const services = [];

  for (const name of sparepartNames) {
    const price = faker.number.int({ min: 15, max: 500 }) * 1000;
    const p = await prisma.product.create({
      data: { 
        name, sku: `SP-${crypto.randomBytes(2).toString("hex").toUpperCase()}`, type: "SPAREPART", 
        price, cost: Math.floor(price * 0.6), stock: faker.number.int({ min: 50, max: 150 }) // Stok diperbanyak agar tidak cepat habis
      }
    });
    spareparts.push(p);
    await prisma.productPriceHistory.create({ data: { productId: p.id, price: p.price, cost: p.cost } });
    await prisma.stockMovement.create({ data: { productId: p.id, type: "IN", sourceType: "PURCHASE", quantity: p.stock, recordedById: admin.id, note: "Stok awal" } });
  }

  for (const name of serviceNames) {
    const price = faker.number.int({ min: 50, max: 500 }) * 1000;
    const p = await prisma.product.create({
      data: { name, sku: `SV-${crypto.randomBytes(2).toString("hex").toUpperCase()}`, type: "SERVICE", price, cost: Math.floor(price * 0.4), stock: 0 }
    });
    services.push(p);
    await prisma.productPriceHistory.create({ data: { productId: p.id, price: p.price, cost: p.cost } });
  }

  console.log("🕐 [4/6] Membuat Shifts & Expenses (14 Hari Terakhir)...");
  const shifts = [];
  const now = new Date();
  
  // Looping 14 hari ke belakang + hari ini = 15 hari
  for (let i = 0; i <= 14; i++) {
    const shiftDate = new Date(now);
    shiftDate.setDate(shiftDate.getDate() - i);
    const cashier = faker.helpers.arrayElement(cashiers);
    
    // Asumsi shift selesai (semua CLOSED)
    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id, status: "CLOSED", 
        startingCash: 1000000, endingCash: 1500000, expectedCash: 1500000, cashSales: faker.number.int({ min: 1000000, max: 8000000 }),
        openedAt: new Date(shiftDate.setHours(8, 0, 0, 0)), closedAt: new Date(shiftDate.setHours(20, 0, 0, 0)),
      }
    });
    shifts.push(shift);

    // Buat Expenses untuk shift ini
    const numExpenses = faker.number.int({ min: 1, max: 3 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement(["Beli ATK", "Beli Kopi & Snack", "Beli Air Mineral", "Bensin Test Ride", "Lain-lain"]),
          amount: faker.number.int({ min: 15, max: 150 }) * 1000,
          category: faker.helpers.arrayElement(["SUPPLIES", "MAINTENANCE", "OTHER"]),
          shiftId: shift.id, recordedById: shift.cashierId, date: shift.openedAt
        }
      });
    }
  }

  console.log("📋 [5/6] Membuat Orders (STRICT LOGIC - Skala Sedang)...");

  // Rata-rata 33 Order per shift/hari. (Total sekitar ~495 Orders)
  const orderScenarios = [
    { status: "DRAFT", count: 2 },
    { status: "QUEUED", count: 2 },
    { status: "IN_PROGRESS", count: 3 },
    { status: "COMPLETED", count: 4 },
    { status: "CLOSED", count: 20 },
    { status: "CANCELLED", count: 2 },
  ];

  let orderCount = 0;

  for (const shift of shifts) {
    for (const scenario of orderScenarios) {
      const numOrders = scenario.count;

      for (let i = 0; i < numOrders; i++) {
        const customer = faker.helpers.arrayElement(dbCustomers);
        const vehicles = await prisma.vehicle.findMany({ where: { customerId: customer.id } });
        
        let subtotal = 0;
        const selectedItems = [];
        const numItems = faker.number.int({ min: 1, max: 4 }); // Max 4 item per transaksi
        
        // Pilih barang/service
        for (let j = 0; j < numItems; j++) {
          const isService = faker.datatype.boolean();
          const product = faker.helpers.arrayElement(isService ? services : spareparts);
          const qty = isService ? 1 : faker.number.int({ min: 1, max: 2 });
          const itemSubtotal = product.price * qty;
          subtotal += itemSubtotal;
          selectedItems.push({ product, qty, subtotal: itemSubtotal });
        }

        const tax = Math.round(subtotal * 0.11);
        const total = subtotal + tax;
        
        // Setup Timestamps
        const baseDate = new Date(shift.openedAt.getTime() + faker.number.int({ min: 10, max: 600 }) * 60000); // Tersebar di jam kerja
        let diagnosedAt = null, startedAt = null, completedAt = null, closedAt = null;

        if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) {
          diagnosedAt = new Date(baseDate.getTime() + 5 * 60000);
        }
        if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) {
          startedAt = new Date(diagnosedAt.getTime() + 10 * 60000);
        }
        if (["COMPLETED", "CLOSED"].includes(scenario.status)) {
          completedAt = new Date(startedAt.getTime() + 45 * 60000); // Estimasi pengerjaan 45 menit
        }
        if (scenario.status === "CLOSED") {
          closedAt = new Date(completedAt.getTime() + 5 * 60000);
        }

        // 1. Buat Order
        const order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(baseDate),
            status: scenario.status, subtotal, tax, total, diagnosedAt, startedAt, completedAt, closedAt,
            cashierId: shift.cashierId, shiftId: shift.id, customerId: customer.id, vehicleId: vehicles[0]?.id,
            createdAt: baseDate, updatedAt: closedAt || completedAt || startedAt || diagnosedAt || baseDate
          }
        });
        orderCount++;

        // 2. Buat Order Items & Relasinya secara ketat
        for (const item of selectedItems) {
          const orderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id, productId: item.product.id, productNameSnapshot: item.product.name,
              quantity: item.qty, unitPrice: item.product.price, unitCostSnapshot: item.product.cost, subtotal: item.subtotal
            }
          });

          // A. Logika Mechanic Assignment (Hanya jika SERVICE & BUKAN DRAFT/CANCELLED)
          if (item.product.type === "SERVICE" && !["DRAFT", "CANCELLED"].includes(scenario.status)) {
            await prisma.mechanicAssignment.create({
              data: {
                orderItemId: orderItem.id,
                mechanicId: faker.helpers.arrayElement(mechanics).id,
                startAt: ["QUEUED"].includes(scenario.status) ? null : startedAt,
                endAt: ["QUEUED", "IN_PROGRESS"].includes(scenario.status) ? null : completedAt,
              }
            });
          }

          // B. Logika Pengurangan Stok (Hanya jika SPAREPART & Status IN_PROGRESS / COMPLETED / CLOSED)
          if (item.product.type === "SPAREPART" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) {
            await prisma.stockMovement.create({
              data: {
                productId: item.product.id, type: "OUT", sourceType: "SALE", quantity: item.qty,
                orderItemId: orderItem.id, recordedById: shift.cashierId, createdAt: startedAt
              }
            });
            await prisma.product.update({ where: { id: item.product.id }, data: { stock: { decrement: item.qty } } });
          }
        }

        // 3. Logika Payment (TIDAK ADA untuk DRAFT dan CANCELLED)
        if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) {
          await prisma.payment.create({
            data: {
              orderId: order.id, method: faker.helpers.arrayElement(["CASH", "QRIS"]), amountPaid: total,
              status: scenario.status === "QUEUED" ? "PENDING" : "PAID",
              paidAt: scenario.status === "QUEUED" ? null : (closedAt || completedAt || startedAt)
            }
          });
        }

        // 4. History (Lacak runutan flow)
        const histories = [{ status: "DRAFT", note: "Draft dibuat", by: shift.cashierId }];
        if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) histories.push({ status: "QUEUED", note: "Masuk antrian", by: shift.cashierId });
        if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(scenario.status)) histories.push({ status: "IN_PROGRESS", note: "Mekanik mulai kerja", by: mechanics[0].id });
        if (["COMPLETED", "CLOSED"].includes(scenario.status)) histories.push({ status: "COMPLETED", note: "Kerjaan selesai", by: mechanics[0].id });
        if (scenario.status === "CLOSED") histories.push({ status: "CLOSED", note: "Pelanggan sudah bayar & ambil motor", by: shift.cashierId });
        if (scenario.status === "CANCELLED") histories.push({ status: "CANCELLED", note: "Pelanggan batal", by: shift.cashierId });

        for (const history of histories) {
          await prisma.orderStatusHistory.create({
            data: { orderId: order.id, status: history.status, note: history.note, changedById: history.by, createdAt: baseDate }
          });
        }
      }
    }
  }

  console.log(`   ✅ Berhasil membuat total ${orderCount} Orders!\n`);

  console.log("🔔 [6/6] Membuat Notifications...");
  await prisma.notification.create({ data: { title: "Sistem Ready", message: "Proses seeding bervolume sedang selesai.", userId: admin.id } });

  console.log("==================================================");
  console.log("✅ SEEDING BERHASIL! DATA KONSISTEN & CUKUP PADAT");
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });