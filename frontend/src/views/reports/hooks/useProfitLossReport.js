import { useQuery } from "@tanstack/react-query";
import { getProfitLossReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useProfitLossReport = (params) => {
  return useQuery({
    queryKey: ["report-profit-loss", params],
    queryFn: () => getProfitLossReport(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};