import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "rifkyf589@gmail.com";

const generateOrderNumber = (date, counter) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(counter).padStart(4, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${seq}-${rand}`;
};

const sparepartNames = [
  "Kampas Rem Depan Vespa Sprint",
  "Oli Mesin Motul 2T",
  "Busi NGK Racing Vespa",
  "Filter Udara Malossi",
  "Rantai Keteng Vespa PX",
  "Gear Set Rasio 4.0",
  "Ban Luar Pirelli Angel Scooter 110/70",
  "Ban Dalam Vespa 10 Inch",
  "Aki Kering MotoBatt",
  "Lampu Depan LED Proyektor Vespa",
  "Kampas Kopling Malossi Fly Clutch",
  "Shockbreaker Depan Bitubo Vespa GTS",
  "Bearing Roda Depan SKF",
  "Kabel Gas Domino",
  "Piston Kit Polini 200cc",
  "Spion Oval Chrome Vespa",
  "Knalpot Racing Akrapovic Vespa",
  "CDI Racing BRT",
  "Paking Mesin Set Vespa PX",
  "Busi Racing Denso Iridium",
];

const serviceNames = [
  "Service Ringan Vespa Matic",
  "Tune Up Mesin 2-Tak",
  "Ganti Oli Mesin & Gardan",
  "Cuci Motor Detailing",
  "Balancing & Spooring Roda",
  "Overhaul Mesin 2-Tak",
  "Overhaul Mesin 4-Tak",
  "Tambal Ban Tubeless",
  "Ganti Ban Baru + Balancing",
  "Service CVT & Pulley",
  "Ganti Kampas Rem Depan & Belakang",
  "Bore Up Mesin 175cc",
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
];

const userData = [
  {
    email: ADMIN_EMAIL,
    fullName: "Admin Utama",
    phone: "081234567890",
    role: "ADMIN",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "kasir1@bengkel.com",
    fullName: "Budi Santoso",
    phone: "081234567891",
    role: "CASHIER",
    isActive: true,
  },
  {
    email: "kasir2@bengkel.com",
    fullName: "Siti Rahayu",
    phone: "081234567892",
    role: "CASHIER",
    isActive: true,
  },
  {
    email: "kasir3@bengkel.com",
    fullName: "Agus Wijaya",
    phone: "081234567893",
    role: "CASHIER",
    isActive: true,
  },
  {
    email: "mekanik1@bengkel.com",
    fullName: "Andi Pratama",
    phone: "081234567894",
    role: "MECHANIC",
    isActive: true,
  },
  {
    email: "mekanik2@bengkel.com",
    fullName: "Rudi Hartono",
    phone: "081234567895",
    role: "MECHANIC",
    isActive: true,
  },
  {
    email: "mekanik3@bengkel.com",
    fullName: "Dodi Permana",
    phone: "081234567896",
    role: "MECHANIC",
    isActive: true,
  },
];

async function cleanDatabase() {
  console.log("🧹 Membersihkan database...\n");

  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.mechanicAssignment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.productPriceHistory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Database berhasil dibersihkan\n");
}

async function seed() {
  await cleanDatabase();
  console.log(
    "🌱 Mulai seeding database (STRICT BUSINESS LOGIC - PRODUCTION VOLUME)...\n"
  );

  console.log("⚙️ [1/7] Membuat Settings & Users...");

  for (const setting of defaultSettings) {
    await prisma.setting.create({ data: setting });
  }

  const createdUsers = [];
  for (const user of userData) {
    createdUsers.push(await prisma.user.create({ data: user }));
  }

  const admin = createdUsers.find((u) => u.role === "ADMIN");
  const cashiers = createdUsers.filter((u) => u.role === "CASHIER");
  const mechanics = createdUsers.filter((u) => u.role === "MECHANIC");

  console.log(`   ✅ ${createdUsers.length} users created`);

  console.log("👥 [2/7] Membuat 100 Customers & Vehicles...");

  const dbCustomers = [];
  for (let i = 0; i < 100; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number("08##########"),
      },
    });
    dbCustomers.push(customer);

    const vehicleCount = faker.number.int({ min: 1, max: 3 });
    for (let v = 0; v < vehicleCount; v++) {
      await prisma.vehicle.create({
        data: {
          plateNumber: `B ${faker.number.int({
            min: 1000,
            max: 9999,
          })} ${faker.string.alpha({ length: 3, casing: "upper" })}`,
          brand: "Vespa",
          model: faker.helpers.arrayElement([
            "Sprint 150",
            "Primavera 150",
            "GTS Super 300",
            "PX 150",
            "S 125",
            "LX 125",
          ]),
          customerId: customer.id,
        },
      });
    }
  }

  console.log(`   ✅ ${dbCustomers.length} customers created`);

  console.log("🏍️ [3/7] Membuat Products & Initial Stock...");

  const spareparts = [];
  const services = [];

  for (const name of sparepartNames) {
    const price = faker.number.int({ min: 15000, max: 500000 });
    const p = await prisma.product.create({
      data: {
        name,
        sku: `SP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        type: "SPAREPART",
        price,
        cost: Math.floor(price * 0.6),
        stock: faker.number.int({ min: 100, max: 500 }),
      },
    });
    spareparts.push(p);

    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2025-01-01"),
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        sourceType: "PURCHASE",
        quantity: p.stock,
        recordedById: admin.id,
        note: "Stok awal",
        createdAt: new Date("2025-01-01"),
      },
    });
  }

  for (const name of serviceNames) {
    const price = faker.number.int({ min: 50000, max: 500000 });
    const p = await prisma.product.create({
      data: {
        name,
        sku: `SV-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        type: "SERVICE",
        price,
        cost: Math.floor(price * 0.4),
        stock: 0,
      },
    });
    services.push(p);

    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2025-01-01"),
      },
    });
  }

  console.log(
    `   ✅ ${spareparts.length} spareparts & ${services.length} services created`
  );

  console.log(
    "🕐 [4/7] Membuat Shifts & Expenses (Jan 2025 - May 2026) - ALL CLOSED..."
  );

  const shifts = [];
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2026-05-23");
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

  for (let day = 0; day <= daysDiff; day++) {
    const shiftDate = new Date(startDate);
    shiftDate.setDate(shiftDate.getDate() + day);

    if (shiftDate.getDay() === 0 && Math.random() < 0.3) continue;

    const cashier = faker.helpers.arrayElement(cashiers);

    const openedAt = new Date(shiftDate);
    openedAt.setHours(8, 0, 0, 0);

    const closedAt = new Date(shiftDate);
    closedAt.setHours(20, 0, 0, 0);

    const cashSales = faker.number.int({ min: 500000, max: 10000000 });
    const endingCash = 1000000 + cashSales;

    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id,
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: endingCash,
        expectedCash: endingCash,
        cashSales: cashSales,
        cashIn: 0,
        cashOut: 0,
        discrepancy: 0,
        openedAt,
        closedAt: closedAt,
      },
    });
    shifts.push(shift);

    const numExpenses = faker.number.int({ min: 1, max: 5 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement([
            "Beli ATK",
            "Beli Kopi & Snack",
            "Beli Air Mineral",
            "Bensin Test Ride",
            "Biaya Kebersihan",
            "Peralatan Kebersihan",
            "Parkir",
            "Lain-lain",
          ]),
          amount: faker.number.int({ min: 15000, max: 200000 }),
          category: faker.helpers.arrayElement([
            "SUPPLIES",
            "MAINTENANCE",
            "UTILITIES",
            "OTHER",
          ]),
          shiftId: shift.id,
          recordedById: shift.cashierId,
          date: openedAt,
        },
      });
    }
  }

  console.log(`   ✅ ${shifts.length} shifts created (ALL CLOSED)`);

  console.log("📋 [5/7] Membuat Orders dengan STRICT BUSINESS LOGIC...");

  let orderCount = 0;
  let globalCounter = 0;
  const mechanicDailyTasks = {};
  mechanics.forEach((m) => {
    mechanicDailyTasks[m.id] = {};
  });

  for (const shift of shifts) {
    const shiftDay = shift.openedAt.toISOString().split("T")[0];

    mechanics.forEach((m) => {
      if (!mechanicDailyTasks[m.id][shiftDay]) {
        mechanicDailyTasks[m.id][shiftDay] = 0;
      }
    });

    const totalOrders = faker.number.int({ min: 8, max: 20 });

    const draftCount = Math.floor(totalOrders * 0.15);
    const queuedCount = Math.floor(totalOrders * 0.1);
    const inProgressCount = Math.floor(totalOrders * 0.1);
    const completedCount = Math.floor(totalOrders * 0.2);
    const closedCount = Math.floor(totalOrders * 0.4);
    const cancelledCount =
      totalOrders -
      draftCount -
      queuedCount -
      inProgressCount -
      completedCount -
      closedCount;

    const orderStatuses = [
      ...Array(Math.max(0, draftCount)).fill("DRAFT"),
      ...Array(Math.max(0, queuedCount)).fill("QUEUED"),
      ...Array(Math.max(0, inProgressCount)).fill("IN_PROGRESS"),
      ...Array(Math.max(0, completedCount)).fill("COMPLETED"),
      ...Array(Math.max(0, closedCount)).fill("CLOSED"),
      ...Array(Math.max(0, cancelledCount)).fill("CANCELLED"),
    ];

    for (let i = orderStatuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderStatuses[i], orderStatuses[j]] = [
        orderStatuses[j],
        orderStatuses[i],
      ];
    }

    for (const status of orderStatuses) {
      globalCounter++;
      const customer = faker.helpers.arrayElement(dbCustomers);
      const vehicles = await prisma.vehicle.findMany({
        where: { customerId: customer.id },
      });

      if (vehicles.length === 0) continue;

      const vehicle = faker.helpers.arrayElement(vehicles);

      let subtotal = 0;
      const selectedItems = [];
      const numItems = faker.number.int({ min: 1, max: 6 });
      const usedMechanicsInOrder = new Set();

      for (let j = 0; j < numItems; j++) {
        const isService = faker.datatype.boolean({ probability: 0.4 });
        const product = faker.helpers.arrayElement(
          isService ? services : spareparts
        );
        const qty = isService ? 1 : faker.number.int({ min: 1, max: 3 });
        const itemSubtotal = product.price * qty;
        subtotal += itemSubtotal;

        let assignedMechanicId = null;

        if (isService && !["DRAFT", "CANCELLED"].includes(status)) {
          const availableMechanics = mechanics.filter(
            (m) =>
              !usedMechanicsInOrder.has(m.id) &&
              (mechanicDailyTasks[m.id][shiftDay] || 0) < 5
          );

          if (availableMechanics.length > 0) {
            assignedMechanicId =
              faker.helpers.arrayElement(availableMechanics).id;
            usedMechanicsInOrder.add(assignedMechanicId);
            mechanicDailyTasks[assignedMechanicId][shiftDay] =
              (mechanicDailyTasks[assignedMechanicId][shiftDay] || 0) + 1;
          }
        }

        selectedItems.push({
          product,
          qty,
          subtotal: itemSubtotal,
          isService,
          assignedMechanicId,
        });
      }

      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + tax;

      const baseDate = new Date(shift.openedAt);
      baseDate.setMinutes(
        baseDate.getMinutes() + faker.number.int({ min: 30, max: 600 })
      );

      let diagnosedAt = null;
      let startedAt = null;
      let completedAt = null;
      let closedAt = null;
      let paymentMethod = null;
      let paymentStatus = "PENDING";
      let amountPaid = 0;
      let changeAmount = 0;

      switch (status) {
        case "DRAFT":
          break;

        case "QUEUED":
          diagnosedAt = new Date(baseDate);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PENDING";
          amountPaid = 0;
          break;

        case "IN_PROGRESS":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PENDING";
          amountPaid = 0;
          break;

        case "COMPLETED":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          completedAt = new Date(
            baseDate.getTime() + faker.number.int({ min: 30, max: 120 }) * 60000
          );
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PAID";
          amountPaid =
            paymentMethod === "CASH"
              ? total + faker.number.int({ min: 0, max: 100000 })
              : total;
          changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
          break;

        case "CLOSED":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          completedAt = new Date(
            baseDate.getTime() + faker.number.int({ min: 30, max: 120 }) * 60000
          );
          closedAt = new Date(
            baseDate.getTime() + faker.number.int({ min: 70, max: 150 }) * 60000
          );
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PAID";
          amountPaid =
            paymentMethod === "CASH"
              ? total + faker.number.int({ min: 0, max: 100000 })
              : total;
          changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
          break;

        case "CANCELLED":
          break;
      }

      const orderNumber = generateOrderNumber(baseDate, globalCounter);

      const order = await prisma.order.create({
        data: {
          orderNumber,
          status: status,
          subtotal,
          tax,
          total,
          diagnosedAt,
          startedAt,
          completedAt,
          closedAt,
          cashierId: shift.cashierId,
          shiftId: shift.id,
          customerId: customer.id,
          vehicleId: vehicle.id,
          createdAt: baseDate,
          updatedAt:
            closedAt || completedAt || startedAt || diagnosedAt || baseDate,
        },
      });
      orderCount++;

      for (const item of selectedItems) {
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            productNameSnapshot: item.product.name,
            quantity: item.qty,
            unitPrice: item.product.price,
            unitCostSnapshot: item.product.cost,
            subtotal: item.subtotal,
          },
        });

        if (
          item.isService &&
          item.assignedMechanicId &&
          !["DRAFT", "CANCELLED"].includes(status)
        ) {
          await prisma.mechanicAssignment.create({
            data: {
              orderItemId: orderItem.id,
              mechanicId: item.assignedMechanicId,
              startAt: ["QUEUED"].includes(status) ? null : startedAt,
              endAt: ["QUEUED", "IN_PROGRESS"].includes(status)
                ? null
                : completedAt,
            },
          });
        }

        if (
          item.product.type === "SPAREPART" &&
          ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)
        ) {
          await prisma.stockMovement.create({
            data: {
              productId: item.product.id,
              type: "OUT",
              sourceType: "SALE",
              quantity: item.qty,
              orderItemId: orderItem.id,
              recordedById: shift.cashierId,
              createdAt: startedAt,
            },
          });

          await prisma.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.qty } },
          });
        }
      }

      if (!["DRAFT", "CANCELLED"].includes(status)) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: paymentMethod,
            amountPaid: amountPaid,
            change: changeAmount,
            status: paymentStatus,
            paidAt: paymentStatus === "PAID" ? closedAt || completedAt : null,
          },
        });
      }

      const statusFlow = [];
      statusFlow.push({
        status: "DRAFT",
        note: "Pesanan dibuat",
        by: shift.cashierId,
        time: baseDate,
      });

      if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "QUEUED",
          note: "Pembayaran berhasil, masuk antrian pengerjaan",
          by: shift.cashierId,
          time: new Date(baseDate.getTime() + 5 * 60000),
        });
      }

      if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        const assignedMech =
          selectedItems.find((si) => si.assignedMechanicId)
            ?.assignedMechanicId || shift.cashierId;
        statusFlow.push({
          status: "IN_PROGRESS",
          note: "Mekanik mulai pengerjaan",
          by: assignedMech,
          time: startedAt,
        });
      }

      if (["COMPLETED", "CLOSED"].includes(status)) {
        const assignedMech =
          selectedItems.find((si) => si.assignedMechanicId)
            ?.assignedMechanicId || shift.cashierId;
        statusFlow.push({
          status: "COMPLETED",
          note: "Pengerjaan selesai, menunggu penutupan",
          by: assignedMech,
          time: completedAt,
        });
      }

      if (status === "CLOSED") {
        statusFlow.push({
          status: "CLOSED",
          note: "Pembayaran lunas, motor diambil pelanggan",
          by: shift.cashierId,
          time: closedAt,
        });
      }

      if (status === "CANCELLED") {
        statusFlow.push({
          status: "CANCELLED",
          note: "Pesanan dibatalkan",
          by: shift.cashierId,
          time: new Date(baseDate.getTime() + 10 * 60000),
        });
      }

      for (const flow of statusFlow) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: flow.status,
            note: flow.note,
            changedById: flow.by,
            createdAt: flow.time,
          },
        });
      }
    }
  }

  console.log(`   ✅ ${orderCount} orders created successfully`);

  console.log("📊 [6/7] Membuat Stock Adjustments & Restock...");

  for (const sparepart of spareparts) {
    const currentStock = await prisma.product.findUnique({
      where: { id: sparepart.id },
      select: { stock: true },
    });

    if (currentStock.stock < 50) {
      const restockQty = faker.number.int({ min: 50, max: 200 });
      await prisma.stockMovement.create({
        data: {
          productId: sparepart.id,
          type: "IN",
          sourceType: "PURCHASE",
          quantity: restockQty,
          recordedById: admin.id,
          note: "Restock berkala",
          createdAt: new Date("2026-04-15"),
        },
      });

      await prisma.product.update({
        where: { id: sparepart.id },
        data: { stock: { increment: restockQty } },
      });
    }
  }

  console.log("   ✅ Stock adjustments completed");

  console.log("🔔 [7/7] Membuat Notifications...");

  await prisma.notification.create({
    data: {
      title: "Seeding Selesai",
      message: `Database berhasil di-seed dengan volume production.\n\nOrders: ${orderCount}\nShifts: ${
        shifts.length
      }\nCustomers: ${dbCustomers.length}\nProducts: ${
        spareparts.length + services.length
      }\nRange: Jan 2025 - May 2026`,
      type: "SUCCESS",
      userId: admin.id,
    },
  });

  for (const mechanic of mechanics) {
    await prisma.notification.create({
      data: {
        title: "Selamat Bekerja",
        message: `Halo ${mechanic.fullName}, sistem siap digunakan dengan data production. Silakan cek task yang tersedia.`,
        type: "INFO",
        userId: mechanic.id,
      },
    });
  }

  console.log("   ✅ Notifications created");

  console.log("\n==================================================");
  console.log("✅ SEEDING BERHASIL (PRODUCTION VOLUME)");
  console.log("==================================================");
  console.log(`📅 Range Data     : Jan 2025 - 23 May 2026`);
  console.log(
    `👥 Users          : ${createdUsers.length} (1 Admin, 3 Kasir, 3 Mekanik)`
  );
  console.log(`👤 Customers      : ${dbCustomers.length}`);
  console.log(
    `🏍️  Products       : ${spareparts.length + services.length} (${
      spareparts.length
    } Spareparts, ${services.length} Services)`
  );
  console.log(`🕐 Shifts         : ${shifts.length} (ALL CLOSED)`);
  console.log(`📋 Orders         : ${orderCount}`);
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
