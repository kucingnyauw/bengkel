import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul produk.
 *
 * Menyediakan state dan handler untuk tiga jenis dialog:
 * - **Form Dialog**: Untuk create/update produk.
 * - **Delete Dialog**: Untuk konfirmasi hapus produk.
 * - **Detail Dialog**: Untuk menampilkan detail produk.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} dialogOpen - Status apakah form dialog (create/update) sedang terbuka.
 * @returns {string} dialogMode - Mode form dialog ("create" atau "update").
 * @returns {Object|null} selectedProduct - Data produk yang dipilih untuk diupdate.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, product: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, productId: string|number|null }`.
 * @returns {function} openCreateDialog - Membuka form dialog dalam mode create.
 * @returns {function} openUpdateDialog - Membuka form dialog dalam mode update dengan data produk.
 * @returns {function} closeFormDialog - Menutup form dialog dan mereset selectedProduct.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus untuk produk tertentu.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openDetailDialog - Membuka dialog detail untuk produk tertentu.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 *
 * @example
 * // Basic usage di halaman produk
 * const {
 *   dialogOpen,
 *   dialogMode,
 *   selectedProduct,
 *   deleteDialog,
 *   detailDialog,
 *   openCreateDialog,
 *   openUpdateDialog,
 *   closeFormDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useProductDialog();
 *
 * return (
 *   <>
 *     <Button onClick={openCreateDialog}>Tambah Produk</Button>
 *
 *     <ProductFormDialog
 *       open={dialogOpen}
 *       mode={dialogMode}
 *       product={selectedProduct}
 *       onClose={closeFormDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       product={deleteDialog.product}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <ProductDetailDialog
 *       open={detailDialog.open}
 *       productId={detailDialog.productId}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
export const useProductDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    product: null,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    productId: null,
  });

  const openCreateDialog = useCallback(() => {
    setDialogMode("create");
    setSelectedProduct(null);
    setDialogOpen(true);
  }, []);

  const openUpdateDialog = useCallback((product) => {
    setDialogMode("update");
    setSelectedProduct(product);
    setDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  const openDeleteDialog = useCallback((product) => {
    setDeleteDialog({ open: true, product });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, product: null });
  }, []);

  const openDetailDialog = useCallback((productId) => {
    setDetailDialog({ open: true, productId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, productId: null });
  }, []);

  return {
    dialogOpen,
    dialogMode,
    selectedProduct,
    deleteDialog,
    detailDialog,
    openCreateDialog,
    openUpdateDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailDialog,
    closeDetailDialog,
  };
};