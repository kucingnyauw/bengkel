import { useQuery } from "@tanstack/react-query";
import { getTopProductsReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useTopProductsReport = (params) => {
  return useQuery({
    queryKey: ["report-top-products", params],
    queryFn: () => getTopProductsReport(params),
    staleTime: STALE_TIME,
    enabled: !!params,
  });
};