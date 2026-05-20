import { useQuery } from "@tanstack/react-query";
import { getTasksByOrderId } from "@api/taskApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil semua tugas dalam satu order (grouped dengan detail).
 *
 * Mengambil data tugas berdasarkan ID order dari API. Query hanya akan dijalankan
 * jika `enabled` bernilai `true` dan `orderId` tersedia.
 *
 * @param {string|number} orderId - ID order yang akan diambil tugasnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: tasks, isLoading } = useTasksByOrderQuery(orderId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: tasks, isLoading } = useTasksByOrderQuery(orderId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: tasks, isLoading, isError, error } = useTasksByOrderQuery(orderId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useTasksByOrderQuery = (orderId, enabled = true) => {
  return useQuery({
    queryKey: ["tasks-by-order", orderId],
    queryFn: () => getTasksByOrderId(orderId),
    enabled: !!enabled && !!orderId,
    staleTime: STALE_TIME,
  });
};