import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form user/karyawan.
 *
 * Menyediakan form instance react-hook-form dengan default values
 * untuk membuat atau mengupdate data user.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (digunakan saat edit).
 * @param {string} [defaultValues.email] - Email user.
 * @param {string} [defaultValues.fullName] - Nama lengkap user.
 * @param {string} [defaultValues.phone] - Nomor telepon user.
 * @param {string} [defaultValues.role="CASHIER"] - Role user (CASHIER/MECHANIC/ADMIN).
 * @param {boolean} [defaultValues.isActive=true] - Status aktif user.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Basic usage - form kosong
 * const form = useUserForm();
 *
 * const onSubmit = (data) => {
 *   createUser(data);
 * };
 *
 * @example
 * // Dengan nilai default untuk edit
 * const form = useUserForm({
 *   email: "budi@example.com",
 *   fullName: "Budi Santoso",
 *   role: "MECHANIC",
 * });
 */
export const useUserForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      role: "CASHIER",
      isActive: true,
      ...defaultValues,
    },
  });
};