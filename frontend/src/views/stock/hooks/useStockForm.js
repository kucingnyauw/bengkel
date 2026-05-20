import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form pergerakan stok (stock in/out).
 *
 * Menyediakan form instance react-hook-form dengan default values
 * untuk mencatat pergerakan stok produk.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form.
 * @param {Object} [defaultValues.product] - Objek produk yang dipilih.
 * @param {string} [defaultValues.productId] - ID produk.
 * @param {string|number} [defaultValues.quantity] - Jumlah stok.
 * @param {string} [defaultValues.sourceType="MANUAL"] - Tipe sumber pergerakan.
 * @param {string} [defaultValues.note] - Catatan pergerakan stok.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Basic usage - form kosong
 * const form = useStockForm();
 *
 * const onSubmit = (data) => {
 *   createStockMovement(data);
 * };
 *
 * @example
 * // Dengan nilai default
 * const form = useStockForm({
 *   product: selectedProduct,
 *   productId: selectedProduct.id,
 *   sourceType: "PURCHASE",
 * });
 */
export const useStockForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      product: null,
      productId: "",
      quantity: "",
      sourceType: "MANUAL",
      note: "",
      ...defaultValues,
    },
  });
};