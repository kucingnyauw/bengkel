import { lazy } from "react";
import { RoleRoutes, PrivateRoutes } from "@routes/guard";
import { AppLoadable } from "@components";
import { Role } from "@shared/constant";
import MainLayout from "@layout/MainLayout.jsx";

const Dashboard = AppLoadable(
  lazy(() => import("@views/dashboard/pages/Dashboard.jsx"))
);

const POS = AppLoadable(lazy(() => import("@views/pos/pages/Pos.jsx")));

const Orders = AppLoadable(lazy(() => import("@views/orders/pages/Orders.jsx")));
const OrderHistory = AppLoadable(
  lazy(() => import("@views/orders/pages/OrderHistory.jsx"))
);

const Customers = AppLoadable(
  lazy(() => import("@views/customers/pages/Customers.jsx"))
);
const Vehicles = AppLoadable(
  lazy(() => import("@views/vehicles/pages/Vehicles.jsx"))
);

const Tasks = AppLoadable(lazy(() => import("@views/tasks/pages/Tasks.jsx")));
const MechanicTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/MechanicTasks.jsx"))
);
const UnassignedTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/UnassignedTasks.jsx"))
);
const AvailableMechanics = AppLoadable(
  lazy(() => import("@views/tasks/pages/AvailableMechanics.jsx"))
);

const TaskHistory = AppLoadable(
  lazy(() => import("@views/tasks/pages/TasksHistory.jsx"))
);

const Products = AppLoadable(
  lazy(() => import("@views/products/pages/Products.jsx"))
);
const StockMovements = AppLoadable(
  lazy(() => import("@views/stock/pages/StockMovements.jsx"))
);

const Payments = AppLoadable(
  lazy(() => import("@views/payments/pages/Payments.jsx"))
);
const Expenses = AppLoadable(
  lazy(() => import("@views/expenses/pages/Expenses.jsx"))
);

const ExpensesHistory = AppLoadable(
  lazy(() => import("@views/expenses/pages/ExpensesHistory.jsx"))
);

const Shifts = AppLoadable(lazy(() => import("@views/shifts/pages/Shifts.jsx")));
const AllShifts = AppLoadable(
  lazy(() => import("@views/shifts/pages/AllShifts.jsx"))
);

const SalesReport = AppLoadable(
  lazy(() => import("@views/reports/pages/SalesReport.jsx"))
);
const ProfitLoss = AppLoadable(
  lazy(() => import("@views/reports/pages/ProfitLoss.jsx"))
);
const InventoryReport = AppLoadable(
  lazy(() => import("@views/reports/pages/InventoryReport.jsx"))
);
const MechanicReport = AppLoadable(
  lazy(() => import("@views/reports/pages/MechanicReport.jsx"))
);
const ExpenseReport = AppLoadable(
  lazy(() => import("@views/reports/pages/ExpenseReport.jsx"))
);
const PaymentReport = AppLoadable(
  lazy(() => import("@views/reports/pages/PaymentReport.jsx"))
);

const Users = AppLoadable(lazy(() => import("@views/users/pages/Users.jsx")));
const Settings = AppLoadable(
  lazy(() => import("@views/settings/Settings.jsx"))
);

const MainRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
            <Dashboard />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "dashboard",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
            <Dashboard />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "pos",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.CASHIER]}>
            <POS />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "orders",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.CASHIER]}>
            <Orders />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "orders/history",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <OrderHistory />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "customers",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Customers />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "vehicles",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Vehicles />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "tasks",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <Tasks />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "tasks/mechanic",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.MECHANIC]}>
            <MechanicTasks />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "tasks/history",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.MECHANIC]}>
            <TaskHistory />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "tasks/unassigned",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <UnassignedTasks />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "tasks/mechanics/available",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <AvailableMechanics />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "products",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <Products />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "stock/movements",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <StockMovements />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "payments",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Payments />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "expenses",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Expenses />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "expenses/history",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <ExpensesHistory />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "shifts",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Shifts />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "shifts/all",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <AllShifts />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/sales",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <SalesReport />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/profitloss",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <ProfitLoss />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/inventory",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <InventoryReport />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/mechanics",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <MechanicReport />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/expenses",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <ExpenseReport />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "reports/payments",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <PaymentReport />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "users",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <Users />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
    {
      path: "settings",
      element: (
        <PrivateRoutes>
          <RoleRoutes allowedRoles={[Role.ADMIN]}>
            <Settings />
          </RoleRoutes>
        </PrivateRoutes>
      ),
    },
  ],
};

export default MainRoutes;