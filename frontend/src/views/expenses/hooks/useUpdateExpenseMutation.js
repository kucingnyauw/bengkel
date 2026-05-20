import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExpense } from "@api/expenseApi.js";

/**
 * Custom hook untuk memperbarui pengeluaran.
 *
 * Mengirim data pengeluaran yang diperbarui (termasuk file bukti opsional) dalam format
 * `FormData` ke API, lalu otomatis me-refresh cache daftar pengeluaran setelah berhasil.
 *
 * Hanya field yang memiliki nilai yang akan dikirim ke API (partial update).
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah pengeluaran berhasil diupdate.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateExpenseMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Pengeluaran "${data.title}" berhasil diperbarui!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUpdate = (expenseId, formData) => {
 *   mutate({
 *     id: expenseId,
 *     formData: {
 *       title: "Listrik",
 *       amount: 550000,
 *     },
 *   });
 * };
 */
export const useUpdateExpenseMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }) => {
      const fd = new FormData();
      if (formData.title) fd.append("title", formData.title);
      if (formData.amount) fd.append("amount", Number(formData.amount));
      if (formData.category) fd.append("category", formData.category);
      if (formData.description) fd.append("description", formData.description);
      if (formData.receipt) fd.append("receipt", formData.receipt);
      return updateExpense(id, fd);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cashier-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-history"] });
      queryClient.invalidateQueries({ queryKey: ["expense-detail", data.id] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};