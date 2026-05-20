import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense } from "@api/expenseApi.js";

/**
 * Custom hook untuk membuat pengeluaran baru.
 *
 * Mengirim data pengeluaran (termasuk file bukti opsional) dalam format `FormData`
 * ke API, lalu otomatis me-refresh cache daftar pengeluaran kasir setelah berhasil.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah pengeluaran berhasil dibuat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembuatan pengeluaran gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCreateExpenseMutation({
 *   onSuccess: () => {
 *     toast.success("Pengeluaran berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleSubmit = (formData) => {
 *   mutate({
 *     title: "Listrik",
 *     amount: 500000,
 *     category: "UTILITIES",
 *     description: "Tagihan bulan Mei",
 *     receipt: fileObject, // opsional
 *   });
 * };
 */
export const useCreateExpenseMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("amount", Number(formData.amount));
      fd.append("category", formData.category || "OTHER");

      if (formData.description)
        fd.append("description", formData.description);

      if (formData.receipt)
        fd.append("receipt", formData.receipt);

      return createExpense(fd);
    },
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