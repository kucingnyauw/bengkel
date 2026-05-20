import { useQuery } from "@tanstack/react-query";
import { getSalesSummary } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useSalesSummaryReport = (params) => {
  return useQuery({
    queryKey: ["report-sales-summary", params],
    queryFn: () => getSalesSummary(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};