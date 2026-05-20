import { useQuery } from "@tanstack/react-query";
import { getVehicleById } from "@api/vehicleApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil detail kendaraan berdasarkan ID.
 *
 * Mengambil data detail kendaraan dari API dan menyimpannya dalam cache React Query.
 * Query hanya akan dijalankan jika `enabled` bernilai `true` dan `vehicleId` tersedia.
 *
 * @param {string|number} vehicleId - ID kendaraan yang akan diambil detailnya.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *   Berguna untuk menunda fetch sampai kondisi tertentu terpenuhi (misal: dialog terbuka).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *   Objek query dari React Query, berisi `data`, `isLoading`, `isError`, `error`, dll.
 *
 * @example
 * // Basic usage - langsung fetch
 * const { data: vehicle, isLoading } = useVehicleDetailQuery(vehicleId);
 *
 * @example
 * // Dengan kontrol enabled - hanya fetch saat dialog terbuka
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const { data: vehicle, isLoading } = useVehicleDetailQuery(vehicleId, dialogOpen);
 *
 * @example
 * // Penanganan loading & error
 * const { data: vehicle, isLoading, isError, error } = useVehicleDetailQuery(vehicleId);
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Alert severity="error">{error.message}</Alert>;
 */
export const useVehicleDetailQuery = (vehicleId, enabled = true) => {
  return useQuery({
    queryKey: ["vehicle-detail", vehicleId],
    queryFn: () => getVehicleById(vehicleId),
    enabled: !!enabled && !!vehicleId,
    staleTime: STALE_TIME,
  });
};