import {
  LayoutDashboard,
  Users,
  Package,
  Store,
  DollarSign,
  TrendingUp,
  ClipboardList,
  History,
  CreditCard,
  Receipt,
  Clock,
  Car,
  Wrench,
  UserCog,
  UserCheck,
  ListOrdered,
  Banknote,
  FileText,
  Activity,
  UserPlus,
  ArrowLeftRight,
  Cog,
} from "lucide-react";

import { Role } from "@shared/constant/enum.js";

const menuItems = {
  items: [
    {
      id: "dashboard-group",
      title: "Dashboard",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
      children: [
        {
          id: "dashboard-overview",
          title: "Beranda",
          type: "item",
          url: "/dashboard",
          icon: LayoutDashboard,
          roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
        },
      ],
    },
    // ===== KASIR ONLY =====
    {
      id: "sales-group",
      title: "Penjualan",
      type: "group",
      roles: [Role.CASHIER],
      children: [
        {
          id: "sales-pos",
          title: "Point of Sale",
          type: "item",
          url: "/pos",
          icon: Store,
          roles: [Role.CASHIER],
        },
        {
          id: "sales-orders",
          title: "Pesanan Aktif",
          type: "item",
          url: "/orders",
          icon: ListOrdered,
          roles: [Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "orders-group",
      title: "Pesanan",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "orders-history",
          title: "Riwayat Pesanan",
          type: "item",
          url: "/orders/history",
          icon: History,
          roles: [Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "customers-group",
      title: "Pelanggan",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "customers-list",
          title: "Data Pelanggan",
          type: "item",
          url: "/customers",
          icon: Users,
          roles: [Role.ADMIN, Role.CASHIER],
        },
        {
          id: "customers-vehicles",
          title: "Data Kendaraan",
          type: "item",
          url: "/vehicles",
          icon: Car,
          roles: [Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    // ===== MEKANIK ONLY (+ ADMIN lihat) =====
    {
      id: "operations-group",
      title: "Operasional",
      type: "group",
      roles: [Role.ADMIN, Role.MECHANIC],
      children: [
        {
          id: "operations-my-tasks",
          title: "Tugas Saya",
          type: "item",
          url: "/tasks/mechanic",
          icon: Wrench,
          roles: [Role.MECHANIC],
        },
        {
          id: "operations-my-task-history",
          title: "Riwayat Tugas",
          type: "item",
          url: "/tasks/history",
          icon: History,
          roles: [Role.MECHANIC],
        },
        {
          id: "operations-all-tasks",
          title: "Semua Tugas",
          type: "item",
          url: "/tasks",
          icon: ClipboardList,
          roles: [Role.ADMIN],
        },
        {
          id: "operations-unassigned-tasks",
          title: "Tugas Belum Ditugaskan",
          type: "item",
          url: "/tasks/unassigned",
          icon: UserPlus,
          roles: [Role.ADMIN, Role.CASHIER],
        },
        {
          id: "operations-available-mechanics",
          title: "Mekanik Tersedia",
          type: "item",
          url: "/tasks/mechanics/available",
          icon: UserCheck,
          roles: [Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "inventory-group",
      title: "Inventaris",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "inventory-products",
          title: "Daftar Produk",
          type: "item",
          url: "/products",
          icon: Package,
          roles: [Role.ADMIN],
        },
        {
          id: "inventory-stock",
          title: "Mutasi Stok",
          type: "item",
          url: "/stock/movements",
          icon: ArrowLeftRight,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "finance-group",
      title: "Keuangan",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "finance-payments",
          title: "Pembayaran",
          type: "item",
          url: "/payments",
          icon: Banknote,
          roles: [Role.ADMIN, Role.CASHIER],
        },
        {
          id: "finance-expenses",
          title: "Pengeluaran",
          type: "item",
          url: "/expenses",
          icon: Receipt,
          roles: [Role.CASHIER],
        },
        {
          id: "finance-expenses-history",
          title: "Riwayat Pengeluaran",
          type: "item",
          url: "/expenses/history",
          icon: History,
          roles: [Role.ADMIN],
        },
        {
          id: "finance-shifts",
          title: "Shift Saya",
          type: "item",
          url: "/shifts",
          icon: Clock,
          roles: [Role.CASHIER],
        },
        {
          id: "finance-all-shifts",
          title: "Semua Shift",
          type: "item",
          url: "/shifts/all",
          icon: Activity,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "reports-group",
      title: "Laporan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "reports-sales",
          title: "Laporan Penjualan",
          type: "item",
          url: "/reports/sales",
          icon: TrendingUp,
          roles: [Role.ADMIN],
        },
        {
          id: "reports-profit-loss",
          title: "Laba & Rugi",
          type: "item",
          url: "/reports/profitloss",
          icon: DollarSign,
          roles: [Role.ADMIN],
        },
        {
          id: "reports-inventory",
          title: "Laporan Inventaris",
          type: "item",
          url: "/reports/inventory",
          icon: Package,
          roles: [Role.ADMIN],
        },
        {
          id: "reports-mechanics",
          title: "Laporan Mekanik",
          type: "item",
          url: "/reports/mechanics",
          icon: UserCog,
          roles: [Role.ADMIN],
        },
        {
          id: "reports-expenses",
          title: "Laporan Pengeluaran",
          type: "item",
          url: "/reports/expenses",
          icon: FileText,
          roles: [Role.ADMIN],
        },
        {
          id: "reports-payments",
          title: "Laporan Pembayaran",
          type: "item",
          url: "/reports/payments",
          icon: CreditCard,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "users-group",
      title: "Karyawan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "users-all",
          title: "Semua Karyawan",
          type: "item",
          url: "/users",
          icon: Users,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "settings-group",
      title: "Pengaturan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "settings-system",
          title: "Pengaturan Sistem",
          type: "item",
          url: "/settings",
          icon: Cog,
          roles: [Role.ADMIN],
        },
      ],
    },
  ],
};

const filterMenuByRole = (items, userRole) => {
  if (!userRole) return [];

  const normalize = (role) => (typeof role === "string" ? role : Role[role]);
  const normalizedUserRole = normalize(userRole).toLowerCase();

  return items
    .map((item) => {
      const allowedRoles = (item.roles || []).map((r) => normalize(r).toLowerCase());
      if (!allowedRoles.includes(normalizedUserRole)) return null;

      const children = (item.children || [])
        .filter((child) => {
          const childRoles = (child.roles || []).map((r) => normalize(r).toLowerCase());
          return childRoles.includes(normalizedUserRole);
        })
        .map(({ roles, ...rest }) => rest);

      if (item.children && children.length === 0) return null;

      const { roles, ...cleanItem } = item;
      return { ...cleanItem, children };
    })
    .filter(Boolean);
};

export { filterMenuByRole, menuItems };