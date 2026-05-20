import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "@api/productApi.js";

/**
 * Custom hook untuk memperbarui produk yang sudah ada.
 *
 * Mengirim data produk yang diperbarui (termasuk file gambar opsional) dalam format
 * `FormData` ke API, lalu otomatis me-refresh cache daftar produk dan detail produk
 * yang diupdate setelah berhasil.
 *
 * Hanya field yang memiliki nilai yang akan dikirim ke API (partial update).
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah produk berhasil diupdate.
 *   Menerima parameter `data` (response dari API yang berisi data produk terupdate).
 * @param {function} [options.onFailed] - Callback yang dipanggil jika update produk gagal.
 *   Menerima parameter `error` dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useUpdateProductMutation({
 *   onSuccess: (data) => {
 *     toast.success(`Produk "${data.name}" berhasil diupdate!`);
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleUpdate = (productId, formData) => {
 *   mutate({
 *     id: productId,
 *     formData: {
 *       name: "Produk A Updated",
 *       price: 20000,
 *       // field lain opsional
 *     },
 *   });
 * };
 */
export const useUpdateProductMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }) => {
      const fd = new FormData();

      if (formData.name) fd.append("name", formData.name);
      if (formData.type) fd.append("type", formData.type);
      if (formData.description) fd.append("description", formData.description);
      if (formData.price) fd.append("price", Number(formData.price));
      if (formData.cost) fd.append("cost", Number(formData.cost));
      if (formData.stock !== undefined && formData.stock !== "") {
        fd.append("stock", Number(formData.stock));
      }
      if (formData.image) fd.append("image", formData.image);
      if (formData.isActive !== undefined) {
        fd.append("isActive", formData.isActive ? "true" : "false");
      }

      return updateProduct(id, fd);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", data.id] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};