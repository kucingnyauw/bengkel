import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant";

export const useDashboardQuery = (params) => {
  return useQuery({
    queryKey: ["dashboard-summary", params],
    queryFn: () => getDashboardSummary(params),
    staleTime: STALE_TIME,
  });
};