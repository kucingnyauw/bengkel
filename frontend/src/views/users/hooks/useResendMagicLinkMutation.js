import { useMutation } from "@tanstack/react-query";
import { resendMagicLink } from "@api/userApi.js";

/**
 * Custom hook untuk mengirim ulang magic link ke user.
 *
 * Mengirimkan email magic link baru untuk user agar dapat login.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah magic link berhasil dikirim.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pengiriman gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useResendMagicLinkMutation({
 *   onSuccess: () => {
 *     toast.success("Magic link berhasil dikirim!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleResend = (userId) => {
 *   mutate(userId);
 * };
 */
export const useResendMagicLinkMutation = ({ onSuccess, onFailed } = {}) => {
  return useMutation({
    mutationFn: (userId) => resendMagicLink(userId),
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};