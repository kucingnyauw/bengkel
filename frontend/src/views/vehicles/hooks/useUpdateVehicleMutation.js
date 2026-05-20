import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVehicle } from "@api/vehicleApi.js";

/**
 * Custom hook untuk memperbarui data kendaraan.
 *
 * Setelah kendaraan berhasil diupdate, cache daftar kendaraan akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah kendaraan berhasil diupdate.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateVehicleMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Kendaraan ${data.plateNumber} berhasil diperbarui!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUpdate = (vehicleId, formData) => {
 *   mutate({ id: vehicleId, ...formData });
 * };
 */
export const useUpdateVehicleMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }) => updateVehicle(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-detail", data.id] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};