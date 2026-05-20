import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@api/userApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Custom hook untuk mengambil detail user/karyawan berdasarkan ID.
 *
 * Mengambil data detail user dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `userId` tersedia.
 *
 * @param {string|number} userId - ID user yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: user, isLoading } = useUserDetailQuery(userId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: user, isLoading } = useUserDetailQuery(userId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: user, isLoading, isError, error } = useUserDetailQuery(userId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useUserDetailQuery = (userId, enabled = true) => {
  return useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => getUserById(userId),
    enabled: !!enabled && !!userId,
    staleTime: STALE_TIME,
  });
};