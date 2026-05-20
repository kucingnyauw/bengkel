/**
 * StockDeleteDialog - Dialog konfirmasi untuk menghapus mutasi stok.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.movement - Data mutasi stok yang akan dihapus
 * @param {string|number} props.movement.id - ID mutasi stok
 * @param {Object} [props.movement.product] - Data produk
 * @param {string} [props.movement.product.name] - Nama produk
 * @param {string} [props.movement.type] - Tipe mutasi
 * @param {number} [props.movement.quantity] - Jumlah
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus mutasi stok
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

import { useDeleteStockMovementMutation } from "@views/stock/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockDeleteDialog = ({ open, movement, onClose }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteStockMovementMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Mutasi stok berhasil dihapus",
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
          message: error.message || "Gagal menghapus mutasi stok",
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
    if (!movement) return;
    deleteMutation.mutate(movement.id);
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
        Hapus Mutasi Stok
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Apakah Anda yakin ingin menghapus mutasi stok berikut?
        </DialogContentText>

        <Card>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="body2" fontWeight={600}>
              {movement?.product?.name || "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {movement?.type} • Qty: {movement?.quantity}
            </Typography>
          </CardContent>
        </Card>
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
          disabled={isPending}
          onClick={handleConfirm}
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

export default StockDeleteDialog;