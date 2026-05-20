import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul shift.
 *
 * Menyediakan state dan handler untuk empat jenis dialog:
 * - **Open Dialog**: Konfirmasi pembukaan shift baru.
 * - **Close Dialog**: Konfirmasi penutupan shift.
 * - **Cash Dialog**: Form cash-in (modal awal) atau cash-out (penarikan).
 * - **Detail Dialog**: Menampilkan detail shift.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} openDialog - Status dialog pembukaan shift.
 * @returns {boolean} closeDialog - Status dialog penutupan shift.
 * @returns {Object} cashDialog - State cash dialog `{ open: boolean, type: "in"|"out" }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, shiftId: string|number|null }`.
 * @returns {string|number|null} selectedShiftId - ID shift yang sedang dipilih/diproses.
 * @returns {function} openOpenDialog - Membuka dialog pembukaan shift.
 * @returns {function} closeOpenDialog - Menutup dialog pembukaan shift.
 * @returns {function} openCloseDialog - Membuka dialog penutupan shift dengan ID tertentu.
 * @returns {function} closeCloseDialog - Menutup dialog penutupan shift.
 * @returns {function} openCashDialog - Membuka dialog cash-in/cash-out dengan ID shift dan tipe.
 * @returns {function} closeCashDialog - Menutup dialog cash dan mereset tipe.
 * @returns {function} openDetailDialog - Membuka dialog detail shift.
 * @returns {function} closeDetailDialog - Menutup dialog detail shift.
 *
 * @example
 * const {
 *   openDialog,
 *   closeDialog,
 *   cashDialog,
 *   detailDialog,
 *   selectedShiftId,
 *   openOpenDialog,
 *   closeOpenDialog,
 *   openCloseDialog,
 *   closeCloseDialog,
 *   openCashDialog,
 *   closeCashDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useShiftDialog();
 *
 * return (
 *   <>
 *     <Button onClick={openOpenDialog}>Buka Shift</Button>
 *
 *     <ShiftOpenDialog open={openDialog} onClose={closeOpenDialog} />
 *
 *     <ShiftCloseDialog
 *       open={closeDialog}
 *       shiftId={selectedShiftId}
 *       onClose={closeCloseDialog}
 *     />
 *
 *     <CashDialog
 *       open={cashDialog.open}
 *       type={cashDialog.type}
 *       shiftId={selectedShiftId}
 *       onClose={closeCashDialog}
 *     />
 *
 *     <ShiftDetailDialog
 *       open={detailDialog.open}
 *       shiftId={detailDialog.shiftId}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
export const useShiftDialog = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [cashDialog, setCashDialog] = useState({ open: false, type: "in" });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    shiftId: null,
  });
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  const openOpenDialog = useCallback(() => setOpenDialog(true), []);
  const closeOpenDialog = useCallback(() => setOpenDialog(false), []);

  const openCloseDialog = useCallback((shiftId) => {
    setSelectedShiftId(shiftId);
    setCloseDialog(true);
  }, []);
  const closeCloseDialog = useCallback(() => {
    setCloseDialog(false);
    setSelectedShiftId(null);
  }, []);

  const openCashDialog = useCallback((shiftId, type) => {
    setSelectedShiftId(shiftId);
    setCashDialog({ open: true, type });
  }, []);
  const closeCashDialog = useCallback(() => {
    setCashDialog({ open: false, type: "in" });
    setSelectedShiftId(null);
  }, []);

  const openDetailDialog = useCallback((shiftId) => {
    setDetailDialog({ open: true, shiftId });
  }, []);
  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, shiftId: null });
  }, []);

  return {
    openDialog,
    closeDialog,
    cashDialog,
    detailDialog,
    selectedShiftId,
    openOpenDialog,
    closeOpenDialog,
    openCloseDialog,
    closeCloseDialog,
    openCashDialog,
    closeCashDialog,
    openDetailDialog,
    closeDetailDialog,
  };
};