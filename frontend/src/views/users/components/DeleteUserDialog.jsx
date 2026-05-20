/**
 * DeleteUserDialog - Dialog konfirmasi untuk menghapus karyawan/user.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.user - Data user yang akan dihapus
 * @param {string} [props.user.fullName] - Nama lengkap user
 * @param {string} [props.user.email] - Email user
 * @param {string} [props.user.role] - Role user (CASHIER/MECHANIC)
 * @param {boolean} [props.user.isActive] - Status aktif user
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus user
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
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
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Hapus Karyawan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Apakah Anda yakin ingin menghapus karyawan ini?
        </DialogContentText>

        {user && (
          <Card>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  {user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={user.role === "CASHIER" ? "Kasir" : "Mekanik"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={user.isActive ? "Aktif" : "Nonaktif"}
                    color={user.isActive ? "success" : "default"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Typography
          variant="caption"
          color="error.main"
          sx={{ display: "block", mt: 2 }}
        >
          * Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isPending ? "Menghapus..." : "Ya, Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;