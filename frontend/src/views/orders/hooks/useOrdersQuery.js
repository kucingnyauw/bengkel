import { useQuery } from "@tanstack/react-query";
import { getActiveOrders, getOrders } from "@api/orderApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil daftar order aktif.
 *
 * Mengambil data order yang masih berstatus aktif (bukan completed/cancelled)
 * dari API. Cache akan otomatis di-refresh ketika parameter berubah.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination order aktif.
 * @param {string} [params.search] - Kata kunci pencarian (nomor order/pelanggan).
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.status] - Filter berdasarkan status order.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * const { data, isLoading } = useOrdersQuery({ page: 1, limit: 10 });
 */
export const useOrdersQuery = (params) => {
  return useQuery({
    queryKey: ["orders-active", params],
    queryFn: () => getActiveOrders(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil riwayat order (semua status).
 *
 * Mengambil data seluruh order termasuk yang sudah selesai/dibatalkan
 * dari API. Cache akan otomatis di-refresh ketika parameter berubah.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination riwayat order.
 * @param {string} [params.search] - Kata kunci pencarian (nomor order/pelanggan).
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.status] - Filter berdasarkan status order.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * const { data, isLoading } = useOrderHistoryQuery({ page: 1, limit: 10, status: "COMPLETED" });
 */
export const useOrderHistoryQuery = (params) => {
  return useQuery({
    queryKey: ["orders-history", params],
    queryFn: () => getOrders(params),
    staleTime: STALE_TIME,
  });
};