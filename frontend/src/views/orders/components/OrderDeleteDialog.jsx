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

import { useDeleteOrderMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

/**
 * OrderDeleteDialog - Dialog konfirmasi untuk menghapus data riwayat pesanan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.order - Data order yang akan dihapus
 * @param {string} [props.order.id] - ID Order
 * @param {string} [props.order.orderNumber] - Nomor order untuk ditampilkan
 * @param {Object} [props.order.customer] - Informasi customer
 * @param {string} [props.order.customer.name] - Nama customer
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus order
 */
const OrderDeleteDialog = ({ onClose, open, order }) => {
  const dispatch = useDispatch();

  const deleteOrder = useDeleteOrderMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || order?.orderNumber} berhasil dihapus`,
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
          message: error.message || "Gagal menghapus pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isDeleting = deleteOrder.isPending;

  const handleConfirm = () => {
    if (!order) return;
    deleteOrder.mutate(order.id);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isDeleting ? undefined : onClose}
      open={open}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Hapus Pesanan
        <IconButton
          onClick={onClose}
          disabled={isDeleting}
          size="small"
          sx={{ mr: -0.5 }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText>
          Apakah Anda yakin ingin menghapus pesanan{" "}
          <strong>{order?.orderNumber}</strong>?
          {order?.customer?.name && (
            <>
              <br />
              Pelanggan: {order.customer.name}
            </>
          )}
        </DialogContentText>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isDeleting}
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isDeleting}
          onClick={handleConfirm}
          startIcon={
            isDeleting ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isDeleting ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDeleteDialog;