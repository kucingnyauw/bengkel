import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refundPayment } from "@api/paymentApi.js";

/**
 * Custom hook untuk merefund pembayaran.
 *
 * Setelah refund berhasil, cache daftar pembayaran dan riwayat order
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah refund berhasil.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika refund gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useRefundPaymentMutation({
 *   onSuccess: () => {
 *     toast.success("Pembayaran berhasil direfund!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleRefund = (paymentId, reason) => {
 *   mutate({ id: paymentId, reason: "Kesalahan input" });
 * };
 */
export const useRefundPaymentMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => refundPayment(id, { reason }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};