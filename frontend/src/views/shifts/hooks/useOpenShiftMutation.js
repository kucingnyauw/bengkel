import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openShift } from "@api/shiftApi.js";

/**
 * Custom hook untuk membuka shift baru.
 *
 * Setelah shift berhasil dibuka, cache daftar shift akan otomatis di-refresh
 * agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah shift berhasil dibuka.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembukaan shift gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useOpenShiftMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Shift #${data.shiftNumber} berhasil dibuka!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleOpenShift = () => {
 *   mutate();
 * };
 */
export const useOpenShiftMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: openShift,
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