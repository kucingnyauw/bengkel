import { useQuery } from "@tanstack/react-query";
import { getExpenses, getCashierExpenses } from "@api/expenseApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil riwayat semua pengeluaran.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.category] - Filter berdasarkan kategori.
 * @param {string} [params.startDate] - Filter tanggal mulai.
 * @param {string} [params.endDate] - Filter tanggal akhir.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useExpensesHistoryQuery({ page: 1, limit: 10 });
 */
export const useExpensesHistoryQuery = (params) => {
  return useQuery({
    queryKey: ["expenses-history", params],
    queryFn: () => getExpenses(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil daftar pengeluaran kasir.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.cashierId] - Filter berdasarkan ID kasir.
 * @param {string} [params.status] - Filter berdasarkan status.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useCashiersExpenseQuery({ page: 1, limit: 10 });
 */
export const useCashiersExpenseQuery = (params) => {
  return useQuery({
    queryKey: ["cashier-expenses", params],
    queryFn: () => getCashierExpenses(params),
    staleTime: STALE_TIME,
  });
};