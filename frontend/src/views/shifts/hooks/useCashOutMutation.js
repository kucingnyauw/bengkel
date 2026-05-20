import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordCashOut } from "@api/shiftApi.js";

/**
 * Custom hook untuk mencatat cash-out (penarikan kas) pada shift.
 *
 * Setelah cash-out berhasil dicatat, cache daftar shift akan otomatis di-refresh.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah cash-out berhasil.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika cash-out gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCashOutMutation({
 *   onSuccess: () => {
 *     toast.success("Cash-out berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCashOut = (shiftId, amount, reason) => {
 *   mutate({ id: shiftId, payload: { amount, reason } });
 * };
 */
export const useCashOutMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => recordCashOut(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["cashiers-shifts"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};