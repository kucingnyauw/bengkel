import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeOrder } from "@api/orderApi.js";

/**
 * Custom hook untuk menutup/menyelesaikan order.
 *
 * Menutup order yang sedang aktif, kemudian otomatis me-refresh cache
 * daftar order aktif dan riwayat order agar data selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah order berhasil ditutup.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penutupan order gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCloseOrderMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Order #${data.orderNumber} berhasil ditutup!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleClose = (orderId) => {
 *   mutate(orderId);
 * };
 */
export const useCloseOrderMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};