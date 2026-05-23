/**
 * CustomerDeleteDialog - Dialog konfirmasi untuk menghapus customer.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.customer - Data customer yang akan dihapus
 * @param {string|number} props.customer.id - ID customer
 * @param {string} props.customer.name - Nama customer
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus customer
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

import { useDeleteCustomerMutation } from "@views/customers/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CustomerDeleteDialog = ({ customer, onClose, open }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteCustomerMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Pelanggan "${customer?.name}" berhasil dihapus`,
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
          message: error?.message || "Gagal menghapus pelanggan",
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
    if (!customer) return;
    deleteMutation.mutate(customer.id);
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
        Hapus Pelanggan
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
          Apakah Anda yakin ingin menghapus pelanggan{" "}
          <strong>{customer?.name}</strong>?
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
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDeleteDialog;