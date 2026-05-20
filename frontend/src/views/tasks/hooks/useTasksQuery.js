import { useQuery } from "@tanstack/react-query";
import { getTasks, getMyTaskHistory, getMyTasks, getUnassignedTasks, getAvailableMechanics } from "@api/taskApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil semua tugas (tasks).
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah per halaman.
 * @param {string} [params.search] - Pencarian.
 * @param {string} [params.status] - Filter status.
 * @param {string} [params.mechanicId] - Filter berdasarkan mekanik.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useTasksQuery({ page: 1, limit: 10 });
 */
export const useTasksQuery = (params) => {
  return useQuery({
    queryKey: ["all-tasks", params],
    queryFn: () => getTasks(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil riwayat tugas mekanik yang sedang login.
 *
 * @param {Object} [params] - Parameter query.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah per halaman.
 * @param {string} [params.search] - Pencarian.
 * @param {string} [params.status] - Filter status.
 * @param {string} [params.orderId] - Filter berdasarkan order.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useMechanicTaskHistory({ page: 1, limit: 10 });
 */
export const useMechanicTaskHistory = (params) => {
  return useQuery({
    queryKey: ["mechanic-task-history", params],
    queryFn: () => getMyTaskHistory(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil tugas mekanik yang sedang login (my tasks).
 *
 * @param {Object} [params] - Parameter query.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah per halaman.
 * @param {string} [params.search] - Pencarian.
 * @param {string} [params.status] - Filter status.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useMyTasksQuery({ page: 1, limit: 10 });
 */
export const useMyTasksQuery = (params) => {
  return useQuery({
    queryKey: ["my-tasks", params],
    queryFn: () => getMyTasks(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil tugas yang belum ditugaskan (unassigned).
 *
 * @param {Object} [params] - Parameter query.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah per halaman.
 * @param {string} [params.search] - Pencarian.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useUnassignedTasksQuery({ page: 1, limit: 10 });
 */
export const useUnassignedTasksQuery = (params) => {
  return useQuery({
    queryKey: ["unassigned-tasks", params],
    queryFn: () => getUnassignedTasks(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil daftar mekanik yang tersedia.
 *
 * @param {Object} [params] - Parameter query.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah per halaman.
 * @param {string} [params.search] - Pencarian.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useAvailableMechanicsQuery({ page: 1, limit: 10 });
 */
export const useAvailableMechanicsQuery = (params) => {
  return useQuery({
    queryKey: ["available-mechanics", params],
    queryFn: () => getAvailableMechanics(params),
    staleTime: STALE_TIME,
  });
};