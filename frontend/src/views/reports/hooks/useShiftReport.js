import { useQuery } from "@tanstack/react-query";
import { getShiftReport } from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

export const useShiftReport = (shiftId) => {
  return useQuery({
    queryKey: ["report-shift", shiftId],
    queryFn: () => getShiftReport(shiftId),
    staleTime: STALE_TIME,
    enabled: !!shiftId,
  });
};