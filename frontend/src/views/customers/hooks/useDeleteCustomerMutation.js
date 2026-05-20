import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomer } from "@api/customerApi.js";

/**
 * Custom hook untuk menghapus customer.
 *
 * Setelah customer berhasil dihapus, cache daftar customer akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah customer berhasil dihapus.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteCustomerMutation({
 *   onSuccess: () => {
 *     toast.success("Customer berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (customerId) => {
 *   mutate(customerId);
 * };
 */
export const useDeleteCustomerMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};