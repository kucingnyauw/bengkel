import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "@api/userApi.js";

/**
 * Custom hook untuk menghapus user/karyawan.
 *
 * Setelah user berhasil dihapus, cache daftar karyawan akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah user berhasil dihapus.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteUserMutation({
 *   onSuccess: () => {
 *     toast.success("User berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (userId) => {
 *   mutate(userId);
 * };
 */
export const useDeleteUserMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};