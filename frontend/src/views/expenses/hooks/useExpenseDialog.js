import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul pengeluaran.
 *
 * Menyediakan state dan handler untuk tiga jenis dialog:
 * - **Form Dialog**: Untuk create/update pengeluaran.
 * - **Delete Dialog**: Untuk konfirmasi hapus pengeluaran.
 * - **Detail Dialog**: Untuk menampilkan detail pengeluaran.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} dialogOpen - Status apakah form dialog (create/update) sedang terbuka.
 * @returns {string} dialogMode - Mode form dialog ("create" atau "update").
 * @returns {Object|null} selectedExpense - Data pengeluaran yang dipilih untuk diupdate.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, expense: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, expense: Object|null }`.
 * @returns {function} openCreateDialog - Membuka form dialog dalam mode create.
 * @returns {function} openUpdateDialog - Membuka form dialog dalam mode update dengan data pengeluaran.
 * @returns {function} closeFormDialog - Menutup form dialog dan mereset selectedExpense.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus untuk pengeluaran tertentu.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openDetailDialog - Membuka dialog detail untuk pengeluaran tertentu.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 *
 * @example
 * const {
 *   dialogOpen,
 *   dialogMode,
 *   selectedExpense,
 *   deleteDialog,
 *   detailDialog,
 *   openCreateDialog,
 *   openUpdateDialog,
 *   closeFormDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useExpenseDialog();
 *
 * return (
 *   <>
 *     <Button onClick={openCreateDialog}>Tambah Pengeluaran</Button>
 *
 *     <ExpenseFormDialog
 *       open={dialogOpen}
 *       mode={dialogMode}
 *       expense={selectedExpense}
 *       onClose={closeFormDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       expense={deleteDialog.expense}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <ExpenseDetailDialog
 *       open={detailDialog.open}
 *       expense={detailDialog.expense}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
export const useExpenseDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    expense: null,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    expense: null,
  });

  const openCreateDialog = useCallback(() => {
    setDialogMode("create");
    setSelectedExpense(null);
    setDialogOpen(true);
  }, []);

  const openUpdateDialog = useCallback((expense) => {
    setDialogMode("update");
    setSelectedExpense(expense);
    setDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedExpense(null);
  }, []);

  const openDeleteDialog = useCallback((expense) => {
    setDeleteDialog({ open: true, expense });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, expense: null });
  }, []);

  const openDetailDialog = useCallback((expense) => {
    setDetailDialog({ open: true, expense });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, expense: null });
  }, []);

  return {
    dialogOpen,
    dialogMode,
    selectedExpense,
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