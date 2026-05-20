import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@api/userApi.js";

/**
 * Custom hook untuk memperbarui data user/karyawan.
 *
 * Setelah user berhasil diupdate, cache daftar user dan detail user
 * yang bersangkutan akan otomatis di-refresh agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah user berhasil diupdate.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateUserMutation({
 *   onSuccess: (data) => {
 *     toast.success(`User "${data.fullName}" berhasil diperbarui!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUpdate = (userId, formData) => {
 *   mutate({ id: userId, ...formData });
 * };
 */
export const useUpdateUserMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }) => updateUser(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-detail", data.id] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};