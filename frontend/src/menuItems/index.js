import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Store,
  DollarSign,
  BarChart3,
  TrendingUp,
  ClipboardList,
  Settings,
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
  Tags,
  Activity,
  UserPlus,
  Truck,
  ArrowLeftRight,
  ShieldCheck,
  Cog,
} from "lucide-react";

import { Role } from "@shared/constant/enum.js";

const menuItems = {
  items: [
    {
      id: "dashboard-group",
      title: "Dashboard",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER, Role.MECHANIC],
      children: [
        {
          id: "dashboard-overview",
          title: "Beranda",
          type: "item",
          url: "/dashboard",
          icon: LayoutDashboard,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER, Role.MECHANIC],
        },
      ],
    },
    {
      id: "sales-group",
      title: "Penjualan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.CASHIER],
      children: [
        {
          id: "sales-pos",
          title: "Point of Sale",
          type: "item",
          url: "/pos",
          icon: Store,
          roles: [Role.SUPERADMIN, Role.CASHIER],
        },
        {
          id: "sales-orders",
          title: "Pesanan Aktif",
          type: "item",
          url: "/orders",
          icon: ListOrdered, // lebih cocok untuk daftar pesanan
          roles: [Role.SUPERADMIN, Role.CASHIER],
        },
      ],
    },
    {
      id: "orders-group",
      title: "Pesanan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "orders-history",
          title: "Riwayat Pesanan",
          type: "item",
          url: "/orders/history",
          icon: History,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    {
      id: "customers-group",
      title: "Pelanggan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "customers-list",
          title: "Data Pelanggan",
          type: "item",
          url: "/customers",
          icon: Users,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
        {
          id: "customers-vehicles",
          title: "Data Kendaraan",
          type: "item",
          url: "/vehicles",
          icon: Car,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    {
      id: "operations-group",
      title: "Operasional",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER, Role.MECHANIC],
      children: [
        {
          id: "operations-my-tasks",
          title: "Tugas Saya",
          type: "item",
          url: "/tasks/mechanic",
          icon: Wrench,
          roles: [Role.SUPERADMIN, Role.MECHANIC],
        },
        {
          id: "operations-my-task-history",
          title: "Riwayat Tugas",
          type: "item",
          url: "/tasks/history",
          icon: History,
          roles: [Role.SUPERADMIN, Role.MECHANIC],
        },
        {
          id: "operations-all-tasks",
          title: "Semua Tugas",
          type: "item",
          url: "/tasks",
          icon: ClipboardList,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "operations-unassigned-tasks",
          title: "Tugas Belum Ditugaskan",
          type: "item",
          url: "/tasks/unassigned",
          icon: UserPlus, // icon assign/orang
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
        {
          id: "operations-available-mechanics",
          title: "Mekanik Tersedia",
          type: "item",
          url: "/tasks/mechanics/available",
          icon: UserCheck,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    {
      id: "inventory-group",
      title: "Inventaris",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN],
      children: [
        {
          id: "inventory-products",
          title: "Daftar Produk",
          type: "item",
          url: "/products",
          icon: Package,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "inventory-stock",
          title: "Mutasi Stok",
          type: "item",
          url: "/stock/movements",
          icon: ArrowLeftRight, // lebih pas untuk mutasi/perpindahan
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
      ],
    },
    {
      id: "finance-group",
      title: "Keuangan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "finance-payments",
          title: "Pembayaran",
          type: "item",
          url: "/payments",
          icon: Banknote, // lebih natural untuk uang
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.CASHIER],
        },
        {
          id: "finance-expenses",
          title: "Pengeluaran",
          type: "item",
          url: "/expenses",
          icon: Receipt,
          roles: [Role.SUPERADMIN, Role.CASHIER],
        },
        {
          id: "finance-expenses-history",
          title: "Riwayat Pengeluaran",
          type: "item",
          url: "/expenses/history",
          icon: History,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "finance-shifts",
          title: "Shift Saya",
          type: "item",
          url: "/shifts",
          icon: Clock,
          roles: [Role.SUPERADMIN, Role.CASHIER],
        },
        {
          id: "finance-all-shifts",
          title: "Semua Shift",
          type: "item",
          url: "/shifts/all",
          icon: Activity, // bedakan dari shift saya
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
      ],
    },
    {
      id: "reports-group",
      title: "Laporan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN],
      children: [
        {
          id: "reports-sales",
          title: "Laporan Penjualan",
          type: "item",
          url: "/reports/sales",
          icon: TrendingUp,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "reports-profit-loss",
          title: "Laba & Rugi",
          type: "item",
          url: "/reports/profitloss",
          icon: DollarSign,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "reports-inventory",
          title: "Laporan Inventaris",
          type: "item",
          url: "/reports/inventory",
          icon: Package,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "reports-mechanics",
          title: "Laporan Mekanik",
          type: "item",
          url: "/reports/mechanics",
          icon: UserCog,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "reports-expenses",
          title: "Laporan Pengeluaran",
          type: "item",
          url: "/reports/expenses",
          icon: FileText, // bedakan dari Receipt
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          id: "reports-payments",
          title: "Laporan Pembayaran",
          type: "item",
          url: "/reports/payments",
          icon: CreditCard,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
      ],
    },
    {
      id: "users-group",
      title: "Karyawan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN],
      children: [
        {
          id: "users-all",
          title: "Semua Karyawan",
          type: "item",
          url: "/users",
          icon: Users,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
      ],
    },
    {
      id: "settings-group",
      title: "Pengaturan",
      type: "group",
      roles: [Role.SUPERADMIN, Role.ADMIN],
      children: [
        {
          id: "settings-system",
          title: "Pengaturan Sistem",
          type: "item",
          url: "/settings",
          icon: Cog, // bedakan dari Settings (gear umum), Cog lebih teknisi
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
      ],
    },
  ],
};

/**
 * Filter menu items based on user role.
 *
 * @param {Array} items - Menu items array
 * @param {string} userRole - Current user role
 * @returns {Array} Filtered menu items
 */
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