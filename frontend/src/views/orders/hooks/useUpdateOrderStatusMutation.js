import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "@api/orderApi.js";

/**
 * Custom hook untuk memperbarui status order.
 *
 * Setelah status order berhasil diupdate, cache riwayat order akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah status berhasil diupdate.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update status gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateOrderStatusMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Status order #${data.orderNumber} berhasil diupdate!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleStatusChange = (orderId, newStatus) => {
 *   mutate({ id: orderId, status: newStatus });
 * };
 */
export const useUpdateOrderStatusMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};