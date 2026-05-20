import { useQuery } from "@tanstack/react-query";
import { getTasksByMechanic } from "@api/taskApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil tugas berdasarkan mekanik tertentu.
 *
 * Mengambil data tugas mekanik dari API. Query hanya akan dijalankan
 * jika `enabled` bernilai `true` dan `mechanicId` tersedia.
 *
 * @param {string|number} mechanicId - ID mekanik.
 * @param {boolean} [enabled=true] - Mengontrol apakah query akan dijalankan.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useMechanicTasks(mechanicId, dialogOpen);
 */
export const useMechanicTasks = (mechanicId, enabled = true) => {
  return useQuery({
    queryKey: ["mechanic-tasks", mechanicId],
    queryFn: () => getTasksByMechanic(mechanicId),
    enabled: !!enabled && !!mechanicId,
    staleTime: STALE_TIME,
  });
};