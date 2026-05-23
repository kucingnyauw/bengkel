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
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useDeleteUserMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const DeleteUserDialog = ({ open, user, onClose }) => {
  const theme = useTheme();
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.shape.borderRadius}px`,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 500,
        }}
      >
        Hapus Karyawan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          Apakah Anda yakin ingin menghapus karyawan{" "}
          <strong>{user?.fullName || "ini"}</strong>?
        </Typography>
        <Typography
          variant="caption"
          color="error.main"
          sx={{ display: "block", mt: 1.5, fontWeight: 400 }}
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
          sx={{ fontWeight: 400 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{ fontWeight: 400 }}
        >
          {isPending ? "Menghapus..." : "Ya, Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;