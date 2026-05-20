import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unassignMechanicFromOrder } from "@api/taskApi.js";

/**
 * Custom hook untuk membatalkan penugasan mekanik dari order.
 *
 * Setelah mekanik berhasil di-unassign, cache daftar tugas mekanik,
 * mekanik tersedia, dan semua tugas akan otomatis di-refresh.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah unassign berhasil.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika unassign gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUnassignMechanicMutation({
 *   onSuccess: () => {
 *     toast.success("Mekanik berhasil di-unassign!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUnassign = (orderId) => {
 *   mutate(orderId);
 * };
 */
export const useUnassignMechanicMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => unassignMechanicFromOrder(orderId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["mechanic-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["available-mechanics"] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};