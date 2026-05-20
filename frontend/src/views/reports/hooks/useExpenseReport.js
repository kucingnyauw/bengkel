import { useQuery } from "@tanstack/react-query";
import { getExpenseReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useExpenseReport = (params) => {
  return useQuery({
    queryKey: ["report-expenses", params],
    queryFn: () => getExpenseReport(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};