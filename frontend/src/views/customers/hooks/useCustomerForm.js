import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form pembuatan customer baru beserta kendaraannya.
 *
 * Menyediakan form instance react-hook-form dengan default values kosong
 * untuk field customer (nama, telepon) dan kendaraan (plat nomor, merek, model).
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * const form = useCustomerCreateForm();
 *
 * const onSubmit = (data) => {
 *   createCustomerAndVehicle(data);
 * };
 *
 * return (
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <input {...form.register("name")} placeholder="Nama Customer" />
 *     <input {...form.register("phone")} placeholder="Telepon" />
 *     <input {...form.register("plateNumber")} placeholder="Plat Nomor" />
 *     <input {...form.register("brand")} placeholder="Merek (opsional)" />
 *     <input {...form.register("model")} placeholder="Model (opsional)" />
 *   </form>
 * );
 */
export const useCustomerCreateForm = () => {
  return useForm({
    defaultValues: {
      name: "",
      phone: "",
      plateNumber: "",
      brand: "",
      model: "",
    },
  });
};

/**
 * Custom hook untuk mengelola form update data customer.
 *
 * Menyediakan form instance react-hook-form dengan default values kosong
 * untuk field customer (nama, telepon). Dapat di-reset dengan data existing
 * saat mode edit.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (digunakan saat edit customer).
 * @param {string} [defaultValues.name] - Nama customer.
 * @param {string} [defaultValues.phone] - Nomor telepon customer.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Update customer dengan data existing
 * const CustomerEditForm = ({ customer }) => {
 *   const form = useCustomerUpdateForm({
 *     name: customer.name,
 *     phone: customer.phone,
 *   });
 *
 *   const onSubmit = (data) => {
 *     updateCustomer({ id: customer.id, ...data });
 *   };
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register("name")} />
 *       <input {...form.register("phone")} />
 *     </form>
 *   );
 * };
 */
export const useCustomerUpdateForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      name: "",
      phone: "",
      ...defaultValues,
    },
  });
};