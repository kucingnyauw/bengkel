import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@api/orderApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail order berdasarkan ID.
 *
 * Mengambil data detail order dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `orderId` tersedia.
 *
 * @param {string|number} orderId - ID order yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: order, isLoading } = useOrderDetailQuery(orderId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: order, isLoading } = useOrderDetailQuery(orderId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: order, isLoading, isError, error } = useOrderDetailQuery(orderId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useOrderDetailQuery = (orderId, enabled = true) => {
  return useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!enabled && !!orderId,
    staleTime: STALE_TIME,
  });
};