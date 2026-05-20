import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStockMovement } from "@api/stockApi.js";

/**
 * Custom hook untuk menghapus pergerakan stok.
 *
 * Setelah pergerakan stok berhasil dihapus, cache daftar pergerakan stok dan
 * daftar produk akan otomatis di-refresh agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah pergerakan stok berhasil dihapus.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteStockMovementMutation({
 *   onSuccess: () => {
 *     toast.success("Pergerakan stok berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (movementId) => {
 *   mutate(movementId);
 * };
 */
export const useDeleteStockMovementMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockMovement,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};