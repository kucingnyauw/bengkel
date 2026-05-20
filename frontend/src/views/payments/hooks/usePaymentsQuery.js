import { useQuery } from "@tanstack/react-query";
import { getPayments } from "@api/paymentApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil daftar pembayaran dengan parameter filter opsional.
 *
 * Mengambil data pembayaran dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination pembayaran.
 * @param {string} [params.search] - Kata kunci pencarian.
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.status] - Filter berdasarkan status pembayaran.
 * @param {string} [params.method] - Filter berdasarkan metode pembayaran.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua pembayaran
 * const { data, isLoading } = usePaymentsQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = usePaymentsQuery({
 *   page: 1,
 *   limit: 10,
 *   method: "QRIS",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: payments, isLoading, isError, error } = usePaymentsQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */
export const usePaymentsQuery = (params) => {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => getPayments(params),
    staleTime: STALE_TIME,
  });
};