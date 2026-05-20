import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordCashIn } from "@api/shiftApi.js";

/**
 * Custom hook untuk mencatat cash-in (modal awal) pada shift.
 *
 * Setelah cash-in berhasil dicatat, cache daftar shift akan otomatis di-refresh.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah cash-in berhasil.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika cash-in gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCashInMutation({
 *   onSuccess: () => {
 *     toast.success("Cash-in berhasil dicatat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCashIn = (shiftId, amount) => {
 *   mutate({ id: shiftId, payload: { amount } });
 * };
 */
export const useCashInMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => recordCashIn(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["cashiers-shifts"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};