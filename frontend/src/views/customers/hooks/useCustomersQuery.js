import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@api/customerApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil daftar customer dengan parameter filter opsional.
 *
 * Mengambil data customer dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination customer.
 * @param {string} [params.search] - Kata kunci pencarian customer (nama/telepon).
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua customer
 * const { data, isLoading } = useCustomersQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = useCustomersQuery({
 *   page: 1,
 *   limit: 10,
 *   search: "budi",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: customers, isLoading, isError, error } = useCustomersQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */
export const useCustomersQuery = (params) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
    staleTime: STALE_TIME,
  });
};