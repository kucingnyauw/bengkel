import { useQuery } from "@tanstack/react-query";
import { getCustomerById } from "@api/customerApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil detail customer berdasarkan ID.
 *
 * Mengambil data detail customer dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `customerId` tersedia.
 *
 * @param {string|number} customerId - ID customer yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: customer, isLoading } = useCustomerDetailQuery(customerId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: customer, isLoading } = useCustomerDetailQuery(customerId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: customer, isLoading, isError, error } = useCustomerDetailQuery(customerId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useCustomerDetailQuery = (customerId, enabled = true) => {
  return useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: !!enabled && !!customerId,
    staleTime: STALE_TIME,
  });
};