import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "@api/customerApi.js";
import { registerVehicle } from "@api/vehicleApi.js";

/**
 * Custom hook untuk membuat customer baru beserta kendaraannya.
 *
 * Melakukan dua mutasi berurutan:
 * 1. Membuat customer dengan nama & nomor telepon
 * 2. Jika berhasil, mendaftarkan kendaraan dengan plat nomor dan mengaitkannya ke customer
 *
 * Setelah kendaraan berhasil didaftarkan, cache daftar customer akan di-refresh
 * dan callback `onSuccess` dipanggil.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah customer & kendaraan berhasil dibuat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation` kendaraan.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika proses gagal.
 *   Menerima parameter error dari mutation yang gagal.
 *
 * @returns {Object} Objek yang berisi fungsi mutasi dan status loading.
 * @returns {function} createCustomerAndVehicle - Fungsi untuk membuat customer dan kendaraan sekaligus.
 *   Menerima `formData` dengan properti: `name`, `phone`, `plateNumber`, `brand?`, `model?`.
 * @returns {boolean} isPending - Status loading gabungan dari kedua mutasi.
 *
 * @example
 * const { createCustomerAndVehicle, isPending } = useCreateCustomerMutation({
 *   onSuccess: (data) => {
 *     toast.success("Customer berhasil ditambahkan!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleSubmit = (formData) => {
 *   createCustomerAndVehicle({
 *     name: "Budi Santoso",
 *     phone: "081234567890",
 *     plateNumber: "B 1234 XYZ",
 *     brand: "Vespa",
 *     model: "Sprint 150",
 *   });
 * };
 */
export const useCreateCustomerMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onError: (error) => {
      onFailed?.(error);
    },
  });

  const vehicleMutation = useMutation({
    mutationFn: registerVehicle,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess?.(...args);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });

  /**
   * Membuat customer baru, lalu mendaftarkan kendaraannya.
   * Jika pembuatan customer gagal, proses akan berhenti dan error diteruskan ke `onFailed`.
   *
   * @param {Object} formData - Data form customer & kendaraan.
   * @param {string} formData.name - Nama customer.
   * @param {string} formData.phone - Nomor telepon customer.
   * @param {string} formData.plateNumber - Nomor plat kendaraan.
   * @param {string} [formData.brand] - Merek kendaraan (opsional).
   * @param {string} [formData.model] - Model kendaraan (opsional).
   * @returns {Promise<void>}
   */
  const createCustomerAndVehicle = async (formData) => {
    const customer = await createMutation.mutateAsync({
      name: formData.name,
      phone: formData.phone,
    });

    if (customer) {
      await vehicleMutation.mutateAsync({
        plateNumber: formData.plateNumber,
        brand: formData.brand || null,
        model: formData.model || null,
        customerId: customer.id,
      });
    }
  };

  return {
    createCustomerAndVehicle,
    isPending: createMutation.isPending || vehicleMutation.isPending,
  };
};