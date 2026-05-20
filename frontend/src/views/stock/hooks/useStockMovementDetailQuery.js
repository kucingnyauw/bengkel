import { useQuery } from "@tanstack/react-query";
import { getStockMovementById } from "@api/stockApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail pergerakan stok berdasarkan ID.
 *
 * Mengambil data detail pergerakan stok dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `movementId` tersedia.
 *
 * @param {string|number} movementId - ID pergerakan stok yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: movement, isLoading } = useStockMovementDetailQuery(movementId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: movement, isLoading } = useStockMovementDetailQuery(movementId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: movement, isLoading, isError, error } = useStockMovementDetailQuery(movementId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useStockMovementDetailQuery = (movementId, enabled = true) => {
  return useQuery({
    queryKey: ["stock-movement-detail", movementId],
    queryFn: () => getStockMovementById(movementId),
    enabled: !!enabled && !!movementId,
    staleTime: STALE_TIME,
  });
};