import { useQuery } from "@tanstack/react-query";
import { getMechanicPerformanceReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useMechanicPerformanceReport = (params) => {
  return useQuery({
    queryKey: ["report-mechanic-performance", params],
    queryFn: () => getMechanicPerformanceReport(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};