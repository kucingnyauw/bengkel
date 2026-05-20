import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPayment } from "@api/paymentApi.js";

/**
 * Custom hook untuk membuat pembayaran baru.
 *
 * Setelah pembayaran berhasil dibuat, cache daftar order aktif dan detail order
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah pembayaran berhasil dibuat.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembuatan pembayaran gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCreatePaymentMutation({
 *   onSuccess: (data) => {
 *     toast.success("Pembayaran berhasil!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handlePayment = (paymentData) => {
 *   mutate({ orderId: "xxx", amountPaid: 150000, method: "CASH" });
 * };
 */
export const useCreatePaymentMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};