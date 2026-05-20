import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@api/productApi.js";

/**
 * Custom hook untuk membuat produk baru.
 *
 * Mengirim data produk (termasuk file gambar opsional) dalam format `FormData`
 * ke API, lalu otomatis me-refresh cache daftar produk setelah berhasil.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback yang dipanggil setelah produk berhasil dibuat.
 *   Menerima parameter yang sama dengan `onSuccess` dari `useMutation`.
 * @param {function} [options.onFailed] - Callback yang dipanggil jika pembuatan produk gagal.
 *   Menerima parameter error dari `useMutation`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *   Objek mutation dari React Query, berisi `mutate`, `isPending`, `isError`, `error`, dll.
 *
 * @example
 * const { mutate, isPending } = useCreateProductMutation({
 *   onSuccess: (data) => {
 *     toast.success("Produk berhasil dibuat!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * // Penggunaan
 * const handleSubmit = (formData) => {
 *   mutate({
 *     name: "Produk A",
 *     type: "makanan",
 *     price: 15000,
 *     cost: 10000,
 *     stock: 50,
 *     isActive: true,
 *     description: "Deskripsi opsional",
 *     image: fileObject, // opsional
 *   });
 * };
 */
export const useCreateProductMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => {
      const fd = new FormData();

      fd.append("name", formData.name);
      fd.append("type", formData.type);

      if (formData.description) {
        fd.append("description", formData.description);
      }

      fd.append("price", Number(formData.price));
      fd.append("cost", Number(formData.cost));
      fd.append("stock", Number(formData.stock));
      fd.append("isActive", formData.isActive ? "true" : "false");

      if (formData.image) {
        fd.append("image", formData.image);
      }

      return createProduct(fd);
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.(...args);
    },
    onError: (err) => {
      onFailed?.(err);
    },
  });
};