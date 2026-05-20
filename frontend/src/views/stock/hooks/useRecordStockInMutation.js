import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordStockIn } from "@api/stockApi.js";

/**
 * Custom hook untuk mencatat stok masuk.
 *
 * Setelah stok masuk berhasil dicatat, cache daftar pergerakan stok dan
 * daftar produk akan otomatis di-refresh agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah stok masuk berhasil dicatat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pencatatan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useRecordStockInMutation({
 *   onSuccess: () => {
 *     toast.success("Stok masuk berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleStockIn = (payload) => {
 *   mutate({ productId: "xxx", quantity: 10, note: "Restock" });
 * };
 */
export const useRecordStockInMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => recordStockIn(payload),
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