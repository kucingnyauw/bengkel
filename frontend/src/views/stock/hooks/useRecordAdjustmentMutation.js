import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordAdjustment } from "@api/stockApi.js";

/**
 * Custom hook untuk mencatat penyesuaian stok (adjustment).
 *
 * Setelah penyesuaian stok berhasil dicatat, cache daftar pergerakan stok dan
 * daftar produk akan otomatis di-refresh agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah adjustment berhasil dicatat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pencatatan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useRecordAdjustmentMutation({
 *   onSuccess: () => {
 *     toast.success("Penyesuaian stok berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleAdjustment = (payload) => {
 *   mutate({ productId: "xxx", quantity: 5, type: "IN", note: "Stok opname" });
 * };
 */
export const useRecordAdjustmentMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => recordAdjustment(payload),
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