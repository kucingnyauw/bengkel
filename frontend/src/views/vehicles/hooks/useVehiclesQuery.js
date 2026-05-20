import { useQuery } from "@tanstack/react-query";
import { getVehicles } from "@api/vehicleApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil daftar kendaraan dengan parameter filter opsional.
 *
 * Mengambil data kendaraan dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination kendaraan.
 * @param {string} [params.search] - Kata kunci pencarian (plat nomor/merek/model).
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.customerId] - Filter berdasarkan ID customer.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua kendaraan
 * const { data, isLoading } = useVehiclesQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = useVehiclesQuery({
 *   page: 1,
 *   limit: 10,
 *   search: "B 1234",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: vehicles, isLoading, isError, error } = useVehiclesQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */
export const useVehiclesQuery = (params) => {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: () => getVehicles(params),
    staleTime: STALE_TIME,
  });
};