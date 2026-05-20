import { useQuery } from "@tanstack/react-query";
import { getProductById } from "@api/productApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail produk berdasarkan ID.
 *
 * Mengambil data detail produk dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `productId` tersedia.
 *
 * @param {string|number} productId - ID produk yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: modal terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: product, isLoading } = useProductDetailQuery(productId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat modal terbuka
 * const [isOpen, setIsOpen] = useState(false);
 * const { data: product, isLoading } = useProductDetailQuery(productId, isOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: product, isLoading, isError, error } = useProductDetailQuery(productId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useProductDetailQuery = (productId, enabled = true) => {
  return useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => getProductById(productId),
    enabled: !!enabled && !!productId,
    staleTime: STALE_TIME,
  });
};