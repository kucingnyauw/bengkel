import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCustomer } from "@api/customerApi.js";

/**
 * Custom hook untuk memperbarui data customer.
 *
 * Setelah customer berhasil diupdate, cache daftar customer dan detail customer
 * yang bersangkutan akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah customer berhasil diupdate.
 *   Menerima parameter `data` (response dari API yang berisi data customer terupdate).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateCustomerMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Customer "${data.name}" berhasil diperbarui!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUpdate = (customerId, formData) => {
 *   mutate({ id: customerId, ...formData });
 * };
 */
export const useUpdateCustomerMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }) => updateCustomer(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-detail", data.id] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};