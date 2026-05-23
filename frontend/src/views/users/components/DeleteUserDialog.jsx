/**
 * DeleteUserDialog - Dialog konfirmasi untuk menghapus karyawan/user.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.user - Data user yang akan dihapus
 * @param {string} [props.user.fullName] - Nama lengkap user
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus user
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

import { useDeleteUserMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const DeleteUserDialog = ({ open, user, onClose }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteUserMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Karyawan "${user?.fullName}" berhasil dihapus`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal menghapus karyawan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = deleteMutation.isPending;

  const handleConfirm = () => {
    if (!user) return;
    deleteMutation.mutate(user.id);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isPending ? undefined : onClose}
      open={open}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Hapus Karyawan
        <IconButton
          onClick={onClose}
          disabled={isPending}
          size="small"
          sx={{ mr: -0.5 }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Apakah Anda yakin ingin menghapus karyawan{" "}
          <strong>{user?.fullName || "ini"}</strong>?
        </Typography>
        <Typography
          variant="caption"
          color="error.main"
          sx={{ display: "block", mt: 1.5 }}
        >
          Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isPending}
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={
            isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isPending ? "Menghapus..." : "Ya, Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;