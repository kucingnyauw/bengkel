import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@api/productApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil daftar produk untuk halaman POS.
 *
 * Mengambil data produk dari API dengan queryKey khusus "pos-products"
 * untuk membedakan cache dari halaman manajemen produk.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination produk.
 * @param {string} [params.search] - Kata kunci pencarian produk.
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.type] - Filter berdasarkan tipe produk.
 * @param {boolean} [params.isActive] - Filter status aktif produk.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * const { data, isLoading } = usePosProductsQuery({ isActive: true, limit: 20 });
 */
export const usePosProductsQuery = (params) => {
  return useQuery({
    queryKey: ["pos-products", params],
    queryFn: () => getProducts(params),
    staleTime: STALE_TIME,
  });
};