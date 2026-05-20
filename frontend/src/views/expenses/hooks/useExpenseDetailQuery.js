import { useQuery } from "@tanstack/react-query";
import { getExpenseById } from "@api/expenseApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail pengeluaran berdasarkan ID.
 *
 * Mengambil data detail pengeluaran dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `expenseId` tersedia.
 *
 * @param {string|number} expenseId - ID pengeluaran yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: expense, isLoading } = useExpenseDetailQuery(expenseId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: expense, isLoading } = useExpenseDetailQuery(expenseId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: expense, isLoading, isError, error } = useExpenseDetailQuery(expenseId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useExpenseDetailQuery = (expenseId, enabled = true) => {
  return useQuery({
    queryKey: ["expense-detail", expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!enabled && !!expenseId,
    staleTime: STALE_TIME,
  });
};