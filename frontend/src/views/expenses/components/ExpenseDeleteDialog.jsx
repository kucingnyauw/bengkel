/**
 * ExpenseDeleteDialog - Dialog konfirmasi untuk menghapus pengeluaran.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.expense - Data pengeluaran yang akan dihapus
 * @param {string|number} props.expense.id - ID pengeluaran
 * @param {string} props.expense.title - Judul pengeluaran
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus pengeluaran
 */
import { X } from "lucide-react";
import { useDispatch } from "react-redux";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
} from "@mui/material";

import { useDeleteExpenseMutation } from "@views/expenses/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ExpenseDeleteDialog = ({ expense, onClose, open }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteExpenseMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Pengeluaran "${expense?.title}" berhasil dihapus`,
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
          message: error.message || "Gagal menghapus pengeluaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleConfirm = () => {
    if (expense?.id) deleteMutation.mutate(expense.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={deleteMutation.isPending ? undefined : onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Hapus Pengeluaran
        <IconButton onClick={onClose} disabled={deleteMutation.isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText>
          Apakah Anda yakin ingin menghapus pengeluaran{" "}
          <strong>{expense?.title}</strong>?
        </DialogContentText>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={deleteMutation.isPending}
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={deleteMutation.isPending}
          startIcon={
            deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDeleteDialog;