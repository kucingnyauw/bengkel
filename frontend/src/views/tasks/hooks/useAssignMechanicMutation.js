import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignMechanicToOrder } from "@api/taskApi.js";

/**
 * Custom hook untuk menugaskan mekanik ke order.
 *
 * Setelah mekanik berhasil ditugaskan, cache daftar mekanik tersedia dan semua tugas
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah mekanik berhasil ditugaskan.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penugasan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useAssignMechanicMutation({
 *   onSuccess: () => {
 *     toast.success("Mekanik berhasil ditugaskan!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleAssign = (orderId, mechanicId) => {
 *   mutate({ orderId, mechanicId });
 * };
 */
export const useAssignMechanicMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, mechanicId }) =>
      assignMechanicToOrder(orderId, mechanicId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["available-mechanics"] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-tasks"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};