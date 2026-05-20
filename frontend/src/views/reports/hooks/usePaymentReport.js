import { useQuery } from "@tanstack/react-query";
import { getPaymentReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const usePaymentReport = (params) => {
  return useQuery({
    queryKey: ["report-payments", params],
    queryFn: () => getPaymentReport(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};