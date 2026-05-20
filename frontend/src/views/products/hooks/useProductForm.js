import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form produk menggunakan react-hook-form.
 *
 * Menyediakan form instance dengan default values yang sudah ditentukan.
 * Dapat menerima `defaultValues` kustom untuk mode edit atau pre-fill data.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (biasanya digunakan saat edit produk).
 * @param {string} [defaultValues.name] - Nama produk.
 * @param {string} [defaultValues.type] - Tipe produk (default: "SPAREPART").
 * @param {string} [defaultValues.description] - Deskripsi produk.
 * @param {number|string} [defaultValues.price] - Harga jual produk.
 * @param {number|string} [defaultValues.cost] - Harga modal produk.
 * @param {number|string} [defaultValues.stock] - Jumlah stok produk.
 * @param {File|null} [defaultValues.image] - File gambar produk.
 * @param {boolean} [defaultValues.isActive] - Status aktif produk (default: true).
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *   Objek form dari react-hook-form, berisi `register`, `handleSubmit`, `control`,
 *   `formState`, `reset`, `setValue`, `watch`, dll.
 *
 * @example
 * // Membuat produk baru (form kosong)
 * const ProductCreateForm = () => {
 *   const form = useProductForm();
 *   const { mutate, isPending } = useCreateProductMutation();
 *
 *   const onSubmit = (data) => {
 *     mutate(data);
 *   };
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register("name")} />
 *       <button type="submit" disabled={isPending}>Simpan</button>
 *     </form>
 *   );
 * };
 *
 * @example
 * // Edit produk (pre-fill dengan data existing)
 * const ProductEditForm = ({ product }) => {
 *   const form = useProductForm({
 *     name: product.name,
 *     type: product.type,
 *     price: product.price,
 *     cost: product.cost,
 *     stock: product.stock,
 *     description: product.description,
 *     isActive: product.isActive,
 *   });
 *   const { mutate, isPending } = useUpdateProductMutation();
 *
 *   const onSubmit = (data) => {
 *     mutate({ id: product.id, formData: data });
 *   };
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register("name")} />
 *       <button type="submit" disabled={isPending}>Update</button>
 *     </form>
 *   );
 * };
 *
 * @example
 * // Mengakses form state & metode lain
 * const form = useProductForm();
 * const { errors, isDirty, isValid } = form.formState;
 * const imageFile = form.watch("image");
 *
 * console.log(errors.name?.message); // Error validasi field name
 * console.log(isDirty); // true jika ada perubahan
 */
export const useProductForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      name: "",
      type: "SPAREPART",
      description: "",
      price: "",
      cost: "",
      stock: "",
      image: null,
      isActive: true,
      ...defaultValues,
    },
  });
};