import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeleteOrder } from "@api/orderApi.js";

/**
 * Custom hook untuk menghapus order (soft delete).
 *
 * Melakukan soft delete pada order, kemudian otomatis me-refresh cache
 * riwayat order agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah order berhasil dihapus.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteOrderMutation({
 *   onSuccess: () => {
 *     toast.success("Order berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (orderId) => {
 *   mutate(orderId);
 * };
 */
export const useDeleteOrderMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeleteOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};