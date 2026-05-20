import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVehicle } from "@api/vehicleApi.js";

/**
 * Custom hook untuk menghapus kendaraan.
 *
 * Setelah kendaraan berhasil dihapus, cache daftar kendaraan akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah kendaraan berhasil dihapus.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika penghapusan gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useDeleteVehicleMutation({
 *   onSuccess: () => {
 *     toast.success("Kendaraan berhasil dihapus!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleDelete = (vehicleId) => {
 *   mutate(vehicleId);
 * };
 */
export const useDeleteVehicleMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};