import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordStockOut } from "@api/stockApi.js";

/**
 * Custom hook untuk mencatat stok keluar.
 *
 * Setelah stok keluar berhasil dicatat, cache daftar pergerakan stok dan
 * daftar produk akan otomatis di-refresh agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah stok keluar berhasil dicatat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pencatatan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useRecordStockOutMutation({
 *   onSuccess: () => {
 *     toast.success("Stok keluar berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleStockOut = (payload) => {
 *   mutate({ productId: "xxx", quantity: 5, note: "Rusak" });
 * };
 */
export const useRecordStockOutMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => recordStockOut(payload),
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