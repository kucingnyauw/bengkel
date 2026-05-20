import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExpense } from "@api/expenseApi.js";

/**
 * Custom hook untuk menghapus pengeluaran.
 *
 * Setelah pengeluaran berhasil dihapus, cache daftar pengeluaran kasir
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah pengeluaran berhasil dihapus.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteExpenseMutation({
 *   onSuccess: () => {
 *     toast.success("Pengeluaran berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (expenseId) => {
 *   mutate(expenseId);
 * };
 */
export const useDeleteExpenseMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["cashier-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-history"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};