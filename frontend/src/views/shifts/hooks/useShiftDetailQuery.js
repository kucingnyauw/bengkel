import { useQuery } from "@tanstack/react-query";
import { getShiftById } from "@api/shiftApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail shift berdasarkan ID.
 *
 * Mengambil data detail shift dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `shiftId` tersedia.
 *
 * @param {string|number} shiftId - ID shift yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: shift, isLoading } = useShiftDetailQuery(shiftId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: shift, isLoading } = useShiftDetailQuery(shiftId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: shift, isLoading, isError, error } = useShiftDetailQuery(shiftId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useShiftDetailQuery = (shiftId, enabled = true) => {
  return useQuery({
    queryKey: ["shift-detail", shiftId],
    queryFn: () => getShiftById(shiftId),
    enabled: !!enabled && !!shiftId,
    staleTime: STALE_TIME,
  });
};