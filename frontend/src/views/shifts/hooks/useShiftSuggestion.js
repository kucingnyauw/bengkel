import { useQuery } from "@tanstack/react-query";
import { getStartingCashSuggestion, getExpectedCash } from "@api/shiftApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil saran modal awal (starting cash) berdasarkan riwayat shift sebelumnya.
 *
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * const { data: suggestion, isLoading } = useStartingCashSuggestion();
 *
 * if (suggestion) {
 *   setValue("startingCash", suggestion.amount);
 * }
 */
export const useStartingCashSuggestion = (enabled = true) => {
  return useQuery({
    queryKey: ["shifts", "starting-cash-suggestion"],
    queryFn: getStartingCashSuggestion,
    enabled,
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil estimasi kas yang diharapkan (expected cash) pada shift tertentu.
 *
 * @param {string|number} shiftId - ID shift untuk menghitung estimasi kas.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * const { data: expectedCash } = useExpectedCash(shiftId);
 *
 * console.log(expectedCash?.amount); // Estimasi kas yang seharusnya ada
 */
export const useExpectedCash = (shiftId, enabled = true) => {
  return useQuery({
    queryKey: ["shifts", "expected-cash", shiftId],
    queryFn: () => getExpectedCash(shiftId),
    enabled: !!shiftId && enabled,
    staleTime: STALE_TIME,
  });
};