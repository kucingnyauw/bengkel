import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul tugas.
 *
 * Menyediakan state dan handler untuk lima jenis dialog:
 * - **Start Dialog**: Konfirmasi memulai pengerjaan tugas.
 * - **End Dialog**: Konfirmasi menyelesaikan tugas.
 * - **Detail Dialog**: Menampilkan detail order terkait tugas.
 * - **Assign Dialog**: Multi-step dialog untuk menugaskan mekanik ke order.
 * - **Task Dialog**: Dialog untuk melihat tugas mekanik tertentu.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {Object} dialog - State dialog konfirmasi `{ open: boolean, type: "start"|"end"|null, task: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, orderId: string|number|null }`.
 * @returns {Object} assignDialog - State assign dialog `{ open: boolean, step: string|null, data: Object|null }`.
 * @returns {string} orderIdentifier - ID/nomor order untuk assign dialog.
 * @returns {Object|null} selectedMechanic - Mekanik yang dipilih untuk assign.
 * @returns {Object} taskDialog - State task dialog `{ open: boolean, mechanic: Object|null }`.
 * @returns {function} openStartDialog - Membuka dialog konfirmasi mulai tugas.
 * @returns {function} openEndDialog - Membuka dialog konfirmasi selesai tugas.
 * @returns {function} closeDialog - Menutup dialog konfirmasi.
 * @returns {function} openDetailDialog - Membuka dialog detail order.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 * @returns {function} openAssignDialog - Membuka dialog assign mekanik.
 * @returns {function} closeAssignDialog - Menutup dialog assign.
 * @returns {function} setOrderIdentifier - Setter untuk order identifier.
 * @returns {function} setDialogData - Setter untuk data dialog assign.
 * @returns {function} goToConfirmStep - Melanjutkan ke step konfirmasi assign.
 * @returns {function} openTaskDialog - Membuka dialog tugas mekanik.
 * @returns {function} closeTaskDialog - Menutup dialog tugas mekanik.
 *
 * @example
 * const {
 *   dialog,
 *   detailDialog,
 *   assignDialog,
 *   orderIdentifier,
 *   selectedMechanic,
 *   taskDialog,
 *   openStartDialog,
 *   openEndDialog,
 *   closeDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 *   openAssignDialog,
 *   closeAssignDialog,
 *   setOrderIdentifier,
 *   setDialogData,
 *   goToConfirmStep,
 *   openTaskDialog,
 *   closeTaskDialog,
 * } = useTaskDialog();
 */
export const useTaskDialog = () => {
  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    task: null,
  });

  const [detailDialog, setDetailDialog] = useState({
    open: false,
    orderId: null,
  });

  const [assignDialog, setAssignDialog] = useState({ open: false, step: null, data: null });
  const [orderIdentifier, setOrderIdentifier] = useState("");
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const [taskDialog, setTaskDialog] = useState({ open: false, mechanic: null });

  // Start / End dialog
  const openStartDialog = useCallback((task) => {
    setDialog({ open: true, type: "start", task });
  }, []);

  const openEndDialog = useCallback((task) => {
    setDialog({ open: true, type: "end", task });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, type: null, task: null });
  }, []);

  // Detail dialog
  const openDetailDialog = useCallback((orderId) => {
    setDetailDialog({ open: true, orderId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, orderId: null });
  }, []);

  // Assign dialog
  const openAssignDialog = useCallback((mechanic) => {
    setSelectedMechanic(mechanic);
    setOrderIdentifier("");
    setAssignDialog({ open: true, step: "input-order", data: null });
  }, []);

  const closeAssignDialog = useCallback(() => {
    setAssignDialog({ open: false, step: null, data: null });
    setOrderIdentifier("");
    setSelectedMechanic(null);
  }, []);

  const setDialogData = useCallback((data) => {
    setAssignDialog((prev) => ({ ...prev, data }));
  }, []);

  const goToConfirmStep = useCallback(() => {
    setAssignDialog((prev) => ({ ...prev, step: "confirm" }));
  }, []);

  // Task dialog
  const openTaskDialog = useCallback((mechanic) => {
    setTaskDialog({ open: true, mechanic });
  }, []);

  const closeTaskDialog = useCallback(() => {
    setTaskDialog({ open: false, mechanic: null });
  }, []);

  return {
    dialog,
    detailDialog,
    assignDialog,
    orderIdentifier,
    selectedMechanic,
    taskDialog,
    openStartDialog,
    openEndDialog,
    closeDialog,
    openDetailDialog,
    closeDetailDialog,
    openAssignDialog,
    closeAssignDialog,
    setOrderIdentifier,
    setDialogData,
    goToConfirmStep,
    openTaskDialog,
    closeTaskDialog,
  };
};