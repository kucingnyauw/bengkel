import { useDashboardQuery } from "@views/dashboard/hooks";
import {
  AdminDashboard,
  CashierDashboard,
  MechanicDashboard,
} from "@views/dashboard/components";
import { usePermission } from "@hooks";

const Dashboard = () => {
  const isCashier = usePermission({ role: "CASHIER" });
  const isMechanic = usePermission({ role: "MECHANIC" });

  const { data, isLoading, refetch } = useDashboardQuery({});

  if (isCashier) {
    return <CashierDashboard data={data} isLoading={isLoading} refetch={refetch} />;
  }

  if (isMechanic) {
    return <MechanicDashboard data={data} isLoading={isLoading} refetch={refetch} />;
  }

  return <AdminDashboard data={data} isLoading={isLoading} refetch={refetch} />;
};

export default Dashboard;