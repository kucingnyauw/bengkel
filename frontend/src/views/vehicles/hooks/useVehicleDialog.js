import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul kendaraan.
 *
 * Menyediakan state dan handler untuk empat jenis dialog:
 * - **Create Dialog**: Form untuk mendaftarkan kendaraan baru.
 * - **Update Dialog**: Form untuk mengupdate data kendaraan.
 * - **Delete Dialog**: Konfirmasi hapus kendaraan.
 * - **Detail Dialog**: Menampilkan detail kendaraan.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} createDialog - Status dialog create.
 * @returns {Object} updateDialog - State update dialog `{ open: boolean, vehicle: Object|null }`.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, vehicle: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, vehicleId: string|number|null }`.
 * @returns {function} openCreateDialog - Membuka dialog create.
 * @returns {function} closeCreateDialog - Menutup dialog create.
 * @returns {function} openUpdateDialog - Membuka dialog update dengan data kendaraan.
 * @returns {function} closeUpdateDialog - Menutup dialog update.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openDetailDialog - Membuka dialog detail kendaraan.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 *
 * @example
 * const {
 *   createDialog,
 *   updateDialog,
 *   deleteDialog,
 *   detailDialog,
 *   openCreateDialog,
 *   closeCreateDialog,
 *   openUpdateDialog,
 *   closeUpdateDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useVehicleDialog();
 *
 * return (
 *   <>
 *     <Button onClick={openCreateDialog}>Tambah Kendaraan</Button>
 *
 *     <VehicleFormDialog open={createDialog} onClose={closeCreateDialog} />
 *
 *     <VehicleFormDialog
 *       open={updateDialog.open}
 *       vehicle={updateDialog.vehicle}
 *       onClose={closeUpdateDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       vehicle={deleteDialog.vehicle}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <VehicleDetailDialog
 *       open={detailDialog.open}
 *       vehicleId={detailDialog.vehicleId}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
export const useVehicleDialog = () => {
  const [createDialog, setCreateDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState({
    open: false,
    vehicle: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    vehicle: null,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    vehicleId: null,
    customer: null,
  });

  const openCreateDialog = useCallback(() => setCreateDialog(true), []);
  const closeCreateDialog = useCallback(() => setCreateDialog(false), []);

  const openUpdateDialog = useCallback(
    (vehicle) => setUpdateDialog({ open: true, vehicle }),
    []
  );
  const closeUpdateDialog = useCallback(
    () => setUpdateDialog({ open: false, vehicle: null }),
    []
  );

  const openDeleteDialog = useCallback(
    (vehicle) => setDeleteDialog({ open: true, vehicle }),
    []
  );
  const closeDeleteDialog = useCallback(
    () => setDeleteDialog({ open: false, vehicle: null }),
    []
  );

  const openDetailDialog = useCallback((vehicleId, customer = null) => {
    setDetailDialog({ open: true, vehicleId, customer });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, vehicleId: null, customer: null });
  }, []);

  return {
    createDialog,
    updateDialog,
    deleteDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    openUpdateDialog,
    closeUpdateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailDialog,
    closeDetailDialog,
  };
};
