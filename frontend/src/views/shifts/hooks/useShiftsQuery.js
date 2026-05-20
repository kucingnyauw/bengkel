import { useQuery } from "@tanstack/react-query";
import { getShifts, getCashiersShifts } from "@api/shiftApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil riwayat semua shift.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.status] - Filter berdasarkan status shift.
 * @param {string} [params.startDate] - Filter tanggal mulai.
 * @param {string} [params.endDate] - Filter tanggal akhir.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useShiftsHistoryQuery({ page: 1, limit: 10 });
 */
export const useShiftsHistoryQuery = (params) => {
  return useQuery({
    queryKey: ["shifts-history", params],
    queryFn: () => getShifts(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil daftar shift kasir.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.cashierId] - Filter berdasarkan ID kasir.
 * @param {string} [params.status] - Filter berdasarkan status shift.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useShiftsQuery({ page: 1, limit: 10, status: "ACTIVE" });
 */
export const useShiftsQuery = (params) => {
  return useQuery({
    queryKey: ["cashiers-shifts", params],
    queryFn: () => getCashiersShifts(params),
    staleTime: STALE_TIME,
  });
};