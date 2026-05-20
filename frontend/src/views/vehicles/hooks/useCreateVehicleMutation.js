import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerVehicle } from "@api/vehicleApi.js";

/**
 * Custom hook untuk mendaftarkan kendaraan baru.
 *
 * Setelah kendaraan berhasil didaftarkan, cache daftar kendaraan akan otomatis
 * di-refresh agar data yang ditampilkan selalu terbaru.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah kendaraan berhasil didaftarkan.
 *   Menerima parameter `data` (response dari API).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pendaftaran gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCreateVehicleMutation({
 *   onSuccess: (data) => {
 *     toast.success("Kendaraan berhasil didaftarkan!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleCreate = (formData) => {
 *   mutate({
 *     plateNumber: "B 1234 XYZ",
 *     brand: "Vespa",
 *     model: "Sprint 150",
 *     customerId: "xxx",
 *   });
 * };
 */
export const useCreateVehicleMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerVehicle,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};