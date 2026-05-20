import { useDashboardQuery } from "@views/dashboard/hooks";
import {
  AdminDashboard,
  CashierDashboard,
  MechanicDashboard,
} from "@views/dashboard/components";
import { usePermission } from "@/hooks/usePermissions.js";
import { logger } from "@/lib/logger.js";

const Dashboard = () => {
  const isCashier = usePermission({ role: "CASHIER" });
  const isMechanic = usePermission({ role: "MECHANIC" });

  const { data, isLoading } = useDashboardQuery({});

  logger.debug("data" , data)

  if (isCashier) {
    return <CashierDashboard data={data} isLoading={isLoading} />;
  }

  if (isMechanic) {
    return <MechanicDashboard data={data} isLoading={isLoading} />;
  }

  return <AdminDashboard data={data} isLoading={isLoading} />;
};

export default Dashboard;