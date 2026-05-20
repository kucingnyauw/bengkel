import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul order.
 *
 * Menyediakan state dan handler untuk lima jenis dialog:
 * - **Form Dialog**: Dialog umum untuk berbagai aksi order (generik berdasarkan type).
 * - **Cancel Dialog**: Konfirmasi pembatalan order.
 * - **Detail Dialog**: Menampilkan detail order.
 * - **Delete Dialog**: Konfirmasi hapus order (soft delete).
 * - **Export Dialog**: Dialog export data order.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {Object} dialog - State form dialog generik `{ open: boolean, type: string|null, data: Object|null }`.
 * @returns {Object} cancelDialog - State cancel dialog `{ open: boolean, order: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, order: Object|null }`.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, order: Object|null }`.
 * @returns {boolean} exportDialog - Status dialog export.
 * @returns {function} openDialog - Membuka form dialog dengan tipe dan data tertentu.
 * @returns {function} closeDialog - Menutup form dialog dan mereset data.
 * @returns {function} openCancelDialog - Membuka dialog konfirmasi pembatalan order.
 * @returns {function} closeCancelDialog - Menutup dialog konfirmasi pembatalan.
 * @returns {function} openDetailDialog - Membuka dialog detail order.
 * @returns {function} closeDetailDialog - Menutup dialog detail order.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus order.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openExportDialog - Membuka dialog export.
 * @returns {function} closeExportDialog - Menutup dialog export.
 *
 * @example
 * const {
 *   dialog,
 *   cancelDialog,
 *   detailDialog,
 *   deleteDialog,
 *   exportDialog,
 *   openDialog,
 *   closeDialog,
 *   openCancelDialog,
 *   closeCancelDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openExportDialog,
 *   closeExportDialog,
 * } = useOrderDialog();
 *
 * return (
 *   <>
 *     <Button onClick={() => openDialog("create")}>Tambah Order</Button>
 *
 *     <OrderFormDialog
 *       open={dialog.open}
 *       type={dialog.type}
 *       data={dialog.data}
 *       onClose={closeDialog}
 *     />
 *
 *     <CancelOrderDialog
 *       open={cancelDialog.open}
 *       order={cancelDialog.order}
 *       onClose={closeCancelDialog}
 *     />
 *
 *     <OrderDetailDialog
 *       open={detailDialog.open}
 *       order={detailDialog.order}
 *       onClose={closeDetailDialog}
 *     />
 *
 *     <DeleteOrderDialog
 *       open={deleteDialog.open}
 *       order={deleteDialog.order}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <ExportDialog
 *       open={exportDialog}
 *       onClose={closeExportDialog}
 *     />
 *   </>
 * );
 */
export const useOrderDialog = () => {
  const [dialog, setDialog] = useState({ open: false, type: null, data: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, order: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, order: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
  const [exportDialog, setExportDialog] = useState(false);

  const openDialog = useCallback((type, data = null) => {
    setDialog({ open: true, type, data });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, type: null, data: null });
  }, []);

  const openCancelDialog = useCallback((order) => {
    setCancelDialog({ open: true, order });
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelDialog({ open: false, order: null });
  }, []);

  const openDetailDialog = useCallback((order) => {
    setDetailDialog({ open: true, order });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, order: null });
  }, []);

  const openDeleteDialog = useCallback((order) => {
    setDeleteDialog({ open: true, order });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, order: null });
  }, []);

  const openExportDialog = useCallback(() => {
    setExportDialog(true);
  }, []);

  const closeExportDialog = useCallback(() => {
    setExportDialog(false);
  }, []);

  return {
    dialog,
    cancelDialog,
    detailDialog,
    deleteDialog,
    exportDialog,
    openDialog,
    closeDialog,
    openCancelDialog,
    closeCancelDialog,
    openDetailDialog,
    closeDetailDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openExportDialog,
    closeExportDialog,
  };
};