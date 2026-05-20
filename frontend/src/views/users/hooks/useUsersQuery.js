import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "@api/userApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil daftar user/karyawan.
 *
 * Mengambil data karyawan dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {string} [params.search] - Kata kunci pencarian.
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.isActive] - Filter status aktif.
 * @param {string} [params.role] - Filter berdasarkan role.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua karyawan
 * const { data, isLoading } = useUsersQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = useUsersQuery({
 *   page: 1,
 *   limit: 10,
 *   isActive: "true",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: users, isLoading, isError, error } = useUsersQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */
export const useUsersQuery = (params) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getEmployees(params),
    staleTime: STALE_TIME,
  });
};