import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOrder } from "@api/taskApi.js";

/**
 * Custom hook untuk menyelesaikan semua tugas dalam satu order.
 *
 * Setelah order berhasil diselesaikan, cache daftar tugas mekanik dan semua tugas
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah tugas berhasil diselesaikan.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika menyelesaikan tugas gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCompleteTaskMutation({
 *   onSuccess: () => {
 *     toast.success("Tugas berhasil diselesaikan!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleComplete = (orderId) => {
 *   mutate(orderId);
 * };
 */
export const useCompleteTaskMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => completeOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-by-order"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};