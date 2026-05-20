import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form pembayaran.
 *
 * Menyediakan form instance react-hook-form dengan default values
 * untuk metode pembayaran dan jumlah yang dibayarkan.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form.
 * @param {string} [defaultValues.method="QRIS"] - Metode pembayaran default.
 * @param {number} [defaultValues.amountPaid=0] - Jumlah pembayaran default.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Basic usage
 * const form = usePaymentForm();
 *
 * const onSubmit = (data) => {
 *   createPayment(data);
 * };
 *
 * return (
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <select {...form.register("method")}>
 *       <option value="QRIS">QRIS</option>
 *       <option value="CASH">Tunai</option>
 *     </select>
 *     <input {...form.register("amountPaid")} type="number" />
 *   </form>
 * );
 *
 * @example
 * // Dengan nilai default kustom
 * const form = usePaymentForm({ method: "CASH", amountPaid: 50000 });
 */
export const usePaymentForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      method: "QRIS",
      amountPaid: 0,
      ...defaultValues,
    },
  });
};