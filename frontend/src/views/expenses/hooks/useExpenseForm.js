import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form pengeluaran.
 *
 * Menyediakan form instance react-hook-form dengan default values
 * untuk mencatat pengeluaran baru.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (digunakan saat edit).
 * @param {string} [defaultValues.title] - Judul pengeluaran.
 * @param {string|number} [defaultValues.amount] - Jumlah pengeluaran.
 * @param {string} [defaultValues.category="OTHER"] - Kategori pengeluaran.
 * @param {string} [defaultValues.description] - Deskripsi pengeluaran.
 * @param {File|null} [defaultValues.receipt] - File bukti pengeluaran.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Basic usage - form kosong
 * const form = useExpenseForm();
 *
 * const onSubmit = (data) => {
 *   createExpense(data);
 * };
 *
 * @example
 * // Dengan nilai default untuk edit
 * const form = useExpenseForm({
 *   title: "Listrik",
 *   amount: 500000,
 *   category: "UTILITIES",
 * });
 */
export const useExpenseForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      title: "",
      amount: "",
      category: "OTHER",
      description: "",
      receipt: null,
      ...defaultValues,
    },
  });
};