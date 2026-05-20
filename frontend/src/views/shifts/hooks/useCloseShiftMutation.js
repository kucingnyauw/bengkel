import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeShift } from "@api/shiftApi.js";

/**
 * Custom hook untuk menutup shift.
 *
 * Setelah shift berhasil ditutup, cache daftar shift akan otomatis di-refresh
 * agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah shift berhasil ditutup.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penutupan shift gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCloseShiftMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Shift #${data.shiftNumber} berhasil ditutup!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCloseShift = (shiftId, payload) => {
 *   mutate({ id: shiftId, payload });
 * };
 */
export const useCloseShiftMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => closeShift(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["cashiers-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all-shifts"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};