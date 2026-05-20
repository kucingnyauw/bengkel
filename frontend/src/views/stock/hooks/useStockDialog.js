import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul pergerakan stok.
 *
 * Menyediakan state dan handler untuk tiga jenis dialog:
 * - **Create Dialog**: Form untuk mencatat stok masuk/keluar.
 * - **Detail Dialog**: Menampilkan detail pergerakan stok.
 * - **Delete Dialog**: Konfirmasi hapus pergerakan stok.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} dialogOpen - Status apakah dialog create sedang terbuka.
 * @returns {string} dialogType - Tipe dialog create ("in" atau "out").
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, movementId: string|number|null }`.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, movement: Object|null }`.
 * @returns {function} openCreateDialog - Membuka dialog create dengan tipe tertentu (default "in").
 * @returns {function} closeCreateDialog - Menutup dialog create.
 * @returns {function} openDetailDialog - Membuka dialog detail untuk pergerakan tertentu.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus untuk pergerakan tertentu.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 *
 * @example
 * const {
 *   dialogOpen,
 *   dialogType,
 *   detailDialog,
 *   deleteDialog,
 *   openCreateDialog,
 *   closeCreateDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 * } = useStockDialog();
 *
 * return (
 *   <>
 *     <Button onClick={() => openCreateDialog("in")}>Stok Masuk</Button>
 *     <Button onClick={() => openCreateDialog("out")}>Stok Keluar</Button>
 *
 *     <StockFormDialog
 *       open={dialogOpen}
 *       type={dialogType}
 *       onClose={closeCreateDialog}
 *     />
 *
 *     <StockDetailDialog
 *       open={detailDialog.open}
 *       movementId={detailDialog.movementId}
 *       onClose={closeDetailDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       movement={deleteDialog.movement}
 *       onClose={closeDeleteDialog}
 *     />
 *   </>
 * );
 */
export const useStockDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("in");
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    movementId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    movement: null,
  });

  const openCreateDialog = useCallback((type = "in") => {
    setDialogType(type);
    setDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const openDetailDialog = useCallback((movementId) => {
    setDetailDialog({ open: true, movementId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, movementId: null });
  }, []);

  const openDeleteDialog = useCallback((movement) => {
    setDeleteDialog({ open: true, movement });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, movement: null });
  }, []);

  return {
    dialogOpen,
    dialogType,
    detailDialog,
    deleteDialog,
    openCreateDialog,
    closeCreateDialog,
    openDetailDialog,
    closeDetailDialog,
    openDeleteDialog,
    closeDeleteDialog,
  };
};