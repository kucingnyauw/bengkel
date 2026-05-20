import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form kendaraan.
 *
 * Menyediakan form instance react-hook-form dengan default values
 * untuk mendaftarkan atau mengupdate data kendaraan.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (digunakan saat edit).
 * @param {string} [defaultValues.plateNumber] - Nomor plat kendaraan.
 * @param {string} [defaultValues.brand] - Merek kendaraan.
 * @param {string} [defaultValues.model] - Model kendaraan.
 * @param {string} [defaultValues.customerId] - ID customer pemilik.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Basic usage - form kosong
 * const form = useVehicleForm();
 *
 * const onSubmit = (data) => {
 *   createVehicle(data);
 * };
 *
 * @example
 * // Dengan nilai default untuk edit
 * const form = useVehicleForm({
 *   plateNumber: "B 1234 XYZ",
 *   brand: "Vespa",
 *   model: "Sprint 150",
 *   customerId: "xxx",
 * });
 */
export const useVehicleForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      plateNumber: "",
      brand: "",
      model: "",
      customerId: "",
      ...defaultValues,
    },
  });
};