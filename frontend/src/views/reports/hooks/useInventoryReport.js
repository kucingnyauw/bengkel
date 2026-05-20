import { useQuery } from "@tanstack/react-query";
import { getInventoryReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useInventoryReport = () => {
  return useQuery({
    queryKey: ["report-inventory"],
    queryFn: () => getInventoryReport(),
    staleTime: STALE_TIME,
  });
};