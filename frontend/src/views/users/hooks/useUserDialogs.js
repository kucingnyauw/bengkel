import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul user/karyawan.
 *
 * Menyediakan state dan handler untuk lima jenis dialog:
 * - **Create Dialog**: Form untuk membuat user baru.
 * - **Edit Dialog**: Form untuk mengupdate data user.
 * - **Delete Dialog**: Konfirmasi hapus user.
 * - **Resend Dialog**: Konfirmasi kirim ulang magic link.
 * - **Detail Dialog**: Menampilkan detail user.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {boolean} createDialog - Status dialog create.
 * @returns {Object} editDialog - State edit dialog `{ open: boolean, user: Object|null }`.
 * @returns {Object} deleteDialog - State delete dialog `{ open: boolean, user: Object|null }`.
 * @returns {Object} resendDialog - State resend dialog `{ open: boolean, user: Object|null }`.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, userId: string|number|null }`.
 * @returns {function} openCreateDialog - Membuka dialog create.
 * @returns {function} closeCreateDialog - Menutup dialog create.
 * @returns {function} openEditDialog - Membuka dialog edit dengan data user.
 * @returns {function} closeEditDialog - Menutup dialog edit.
 * @returns {function} openDeleteDialog - Membuka dialog konfirmasi hapus.
 * @returns {function} closeDeleteDialog - Menutup dialog konfirmasi hapus.
 * @returns {function} openResendDialog - Membuka dialog konfirmasi kirim ulang magic link.
 * @returns {function} closeResendDialog - Menutup dialog kirim ulang magic link.
 * @returns {function} openDetailDialog - Membuka dialog detail user.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 *
 * @example
 * const {
 *   createDialog,
 *   editDialog,
 *   deleteDialog,
 *   resendDialog,
 *   detailDialog,
 *   openCreateDialog,
 *   closeCreateDialog,
 *   openEditDialog,
 *   closeEditDialog,
 *   openDeleteDialog,
 *   closeDeleteDialog,
 *   openResendDialog,
 *   closeResendDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 * } = useUserDialogs();
 *
 * return (
 *   <>
 *     <Button onClick={openCreateDialog}>Tambah User</Button>
 *
 *     <UserFormDialog open={createDialog} onClose={closeCreateDialog} />
 *
 *     <UserFormDialog
 *       open={editDialog.open}
 *       user={editDialog.user}
 *       onClose={closeEditDialog}
 *     />
 *
 *     <DeleteConfirmDialog
 *       open={deleteDialog.open}
 *       user={deleteDialog.user}
 *       onClose={closeDeleteDialog}
 *     />
 *
 *     <ResendDialog
 *       open={resendDialog.open}
 *       user={resendDialog.user}
 *       onClose={closeResendDialog}
 *     />
 *
 *     <UserDetailDialog
 *       open={detailDialog.open}
 *       userId={detailDialog.userId}
 *       onClose={closeDetailDialog}
 *     />
 *   </>
 * );
 */
export const useUserDialogs = () => {
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [resendDialog, setResendDialog] = useState({ open: false, user: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, userId: null });

  const openCreateDialog = useCallback(() => setCreateDialog(true), []);
  const closeCreateDialog = useCallback(() => setCreateDialog(false), []);

  const openEditDialog = useCallback((user) => {
    setEditDialog({ open: true, user });
  }, []);
  const closeEditDialog = useCallback(() => {
    setEditDialog({ open: false, user: null });
  }, []);

  const openDeleteDialog = useCallback((user) => {
    setDeleteDialog({ open: true, user });
  }, []);
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, user: null });
  }, []);

  const openResendDialog = useCallback((user) => {
    setResendDialog({ open: true, user });
  }, []);
  const closeResendDialog = useCallback(() => {
    setResendDialog({ open: false, user: null });
  }, []);

  const openDetailDialog = useCallback((user) => {
    setDetailDialog({ open: true, userId: user.id });
  }, []);
  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, userId: null });
  }, []);

  return {
    createDialog,
    editDialog,
    deleteDialog,
    resendDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openResendDialog,
    closeResendDialog,
    openDetailDialog,
    closeDetailDialog,
  };
};