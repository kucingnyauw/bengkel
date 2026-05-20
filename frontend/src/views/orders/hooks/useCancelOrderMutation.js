import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@api/orderApi.js";

/**
 * Custom hook untuk membatalkan order dengan alasan.
 *
 * Setelah order berhasil dibatalkan, cache daftar order dan riwayat order
 * akan otomatis di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah order berhasil dibatalkan.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembatalan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCancelOrderMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Order #${data.orderNumber} berhasil dibatalkan!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCancel = (orderId, reason) => {
 *   mutate({ id: orderId, reason: "Stok habis" });
 * };
 */
export const useCancelOrderMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => cancelOrder(id, { reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};