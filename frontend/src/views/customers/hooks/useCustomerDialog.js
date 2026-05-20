/**
 * Custom hook untuk mengelola state berbagai dialog di modul customer.
 *
 * Menyediakan state dan handler untuk empat jenis dialog:
 * - **Create Dialog**: Form multi-step untuk membuat customer baru + kendaraan.
 * - **Update Dialog**: Form untuk mengupdate data customer.
 * - **Delete Dialog**: Konfirmasi hapus customer.
 * - **Detail Dialog**: Menampilkan detail customer.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} dialogOpen - Status apakah dialog create sedang terbuka.
 * @returns {number} activeStep - Step aktif dalam dialog create (0: customer, 1: kendaraan).
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, customer: Object|null }`.
 * @returns {Object} updateDialog - State update dialog `{ open: boolean, customer: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, customerId: string|number|null }`.
 * @returns {function} openCreateDialog - Membuka dialog create di step awal.
 * @returns {function} closeCreateDialog - Menutup dialog create dan mereset step.
 * @returns {function} handleNext - Melanjutkan ke step berikutnya (kendaraan).
 * @returns {function} handleBack - Kembali ke step sebelumnya (customer).
 * @returns {function} openUpdateDialog - Membuka dialog update dengan data customer.
 * @returns {function} closeUpdateDialog - Menutup dialog update.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus untuk customer tertentu.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openDetailDialog - Membuka dialog detail untuk customer tertentu.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 *
 * @example
 * const {
 *   dialogOpen,
 *   activeStep,
 *   deleteDialog,
 *   updateDialog,
 *   detailDialog,
 *   openCreateDialog,
 *   closeCreateDialog,
 *   handleNext,
 *   handleBack,
 *   openUpdateDialog,
 *   closeUpdateDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useCustomerDialog();
 *
 * return (
 *   <>
 *     <Button onClick={openCreateDialog}>Tambah Customer</Button>
 *
 *     <CustomerCreateDialog
 *       open={dialogOpen}
 *       activeStep={activeStep}
 *       onClose={closeCreateDialog}
 *       onNext={handleNext}
 *       onBack={handleBack}
 *     />
 *
 *     <CustomerUpdateDialog
 *       open={updateDialog.open}
 *       customer={updateDialog.customer}
 *       onClose={closeUpdateDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       customer={deleteDialog.customer}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <CustomerDetailDialog
 *       open={detailDialog.open}
 *       customerId={detailDialog.customerId}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
import { useState, useCallback } from "react";

export const useCustomerDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customer: null,
  });
  const [updateDialog, setUpdateDialog] = useState({
    open: false,
    customer: null,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    customerId: null,
  });

  const openCreateDialog = useCallback(() => {
    setActiveStep(0);
    setDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setDialogOpen(false);
    setActiveStep(0);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep(1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep(0);
  }, []);

  const openUpdateDialog = useCallback((customer) => {
    setUpdateDialog({ open: true, customer });
  }, []);

  const closeUpdateDialog = useCallback(() => {
    setUpdateDialog({ open: false, customer: null });
  }, []);

  const openDeleteDialog = useCallback((customer) => {
    setDeleteDialog({ open: true, customer });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, customer: null });
  }, []);

  const openDetailDialog = useCallback((customerId) => {
    setDetailDialog({ open: true, customerId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, customerId: null });
  }, []);

  return {
    dialogOpen,
    activeStep,
    deleteDialog,
    updateDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    handleNext,
    handleBack,
    openUpdateDialog,
    closeUpdateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailDialog,
    closeDetailDialog,
  };
};