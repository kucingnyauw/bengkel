import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@api/userApi.js";

/**
 * Custom hook untuk membuat user/karyawan baru.
 *
 * Setelah user berhasil dibuat, cache daftar karyawan akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah user berhasil dibuat.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembuatan user gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCreateUserMutation({
 *   onSuccess: (data) => {
 *     toast.success(`User "${data.fullName}" berhasil dibuat!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCreate = (formData) => {
 *   mutate(formData);
 * };
 */
export const useCreateUserMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};