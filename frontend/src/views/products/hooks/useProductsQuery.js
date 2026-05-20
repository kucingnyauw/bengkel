import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@api/productApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil daftar produk dengan parameter filter opsional.
 *
 * Mengambil data produk dari API dan menyimpannya dalam cache React Query.
 * Cache akan otomatis di-refresh ketika parameter berubah karena `queryKey`
 * bergantung pada `params`. Data dianggap fresh selama `STALE_TIME`.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination produk.
 * @param {string} [params.search] - Kata kunci pencarian produk.
 * @param {number} [params.page] - Nomor halaman untuk pagination.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.type] - Filter berdasarkan tipe produk.
 * @param {string} [params.sortBy] - Field untuk sorting.
 * @param {string} [params.order] - Arah sorting ("asc" atau "desc").
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Mengambil semua produk
 * const { data, isLoading } = useProductsQuery();
 *
 * @example
 * // Dengan filter dan pagination
 * const { data, isLoading } = useProductsQuery({
 *   page: 1,
 *   limit: 10,
 *   search: "kopi",
 *   type: "minuman",
 * });
 *
 * @example
 * // Dengan handling loading & error
 * const { data: products, isLoading, isError, error } = useProductsQuery();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 *
 * return products?.data.map(product => <ProductCard key={product.id} product={product} />);
 */
export const useProductsQuery = (params) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
    staleTime: STALE_TIME,
  });
};