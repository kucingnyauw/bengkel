import { useQuery } from "@tanstack/react-query";
import { getPaymentById } from "@api/paymentApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail pembayaran berdasarkan ID.
 *
 * Mengambil data detail pembayaran dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `paymentId` tersedia.
 *
 * @param {string|number} paymentId - ID pembayaran yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: payment, isLoading } = usePaymentDetailQuery(paymentId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: payment, isLoading } = usePaymentDetailQuery(paymentId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: payment, isLoading, isError, error } = usePaymentDetailQuery(paymentId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const usePaymentDetailQuery = (paymentId, enabled = true) => {
  return useQuery({
    queryKey: ["payment-detail", paymentId],
    queryFn: () => getPaymentById(paymentId),
    enabled: !!paymentId && enabled,
    staleTime: STALE_TIME,
  });
};