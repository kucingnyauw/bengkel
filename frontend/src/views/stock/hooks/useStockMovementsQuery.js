import { useQuery } from "@tanstack/react-query";
import { getStockMovements } from "@api/stockApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil daftar pergerakan stok (stock movements).
 *
 * Mengambil data pergerakan stok dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {string} [params.search] - Kata kunci pencarian.
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.type] - Filter berdasarkan tipe pergerakan (IN/OUT).
 * @param {string} [params.productId] - Filter berdasarkan ID produk.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua pergerakan stok
 * const { data, isLoading } = useStockMovementsQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = useStockMovementsQuery({
 *   page: 1,
 *   limit: 10,
 *   type: "IN",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: movements, isLoading, isError, error } = useStockMovementsQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */
export const useStockMovementsQuery = (params) => {
  return useQuery({
    queryKey: ["stock-movements", params],
    queryFn: () => getStockMovements(params),
    staleTime: STALE_TIME,
  });
};