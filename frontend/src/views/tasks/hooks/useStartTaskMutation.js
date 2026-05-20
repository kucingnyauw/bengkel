import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startOrder } from "@api/taskApi.js";

/**
 * Custom hook untuk memulai pengerjaan semua tugas dalam satu order.
 *
 * Setelah order berhasil dimulai, cache daftar tugas mekanik dan semua tugas
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah tugas berhasil dimulai.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika memulai tugas gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useStartTaskMutation({
 *   onSuccess: () => {
 *     toast.success("Tugas berhasil dimulai!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleStart = (orderId) => {
 *   mutate(orderId);
 * };
 */
export const useStartTaskMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => startOrder(orderId),
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