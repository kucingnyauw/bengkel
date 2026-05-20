/**
 * CustomerDeleteDialog - Dialog konfirmasi untuk menghapus customer.
 *
 * Menampilkan dialog konfirmasi dengan nama customer yang akan dihapus.
 * Setelah konfirmasi, customer akan dihapus dan cache otomatis di-refresh.
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
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { useDeleteCustomerMutation } from "@views/customers/hooks";

const CustomerDeleteDialog = ({ customer, onClose, open }) => {
  const deleteMutation = useDeleteCustomerMutation({
    onSuccess: () => {
      onClose?.();
    },
  });

  const isPending = deleteMutation.isPending;

  const handleConfirm = () => {
    if (!customer) return;
    deleteMutation.mutate(customer.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Hapus Pelanggan</DialogTitle>

      <DialogContent>
        <DialogContentText>
          Apakah Anda yakin ingin menghapus pelanggan{" "}
          <strong>{customer?.name}</strong>?
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={isPending}>
          Batal
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDeleteDialog;