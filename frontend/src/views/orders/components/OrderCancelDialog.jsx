/**
 * OrderCancelDialog - Dialog konfirmasi untuk membatalkan pesanan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.order - Data order yang akan dibatalkan
 * @param {string} [props.order.id] - ID Order
 * @param {string} [props.order.orderNumber] - Nomor order untuk ditampilkan
 * @param {Object} [props.order.customer] - Informasi customer
 * @param {string} [props.order.customer.name] - Nama customer
 *
 * @returns {JSX.Element} Dialog konfirmasi pembatalan order
 */
import { X } from "lucide-react";
import { useDispatch } from "react-redux";

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

import { useCancelOrderMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderCancelDialog = ({ onClose, open, order }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const cancelOrder = useCancelOrderMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || order?.orderNumber} berhasil dibatalkan`,
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
          message: error?.message || "Gagal membatalkan pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = cancelOrder.isPending;

  const handleConfirm = () => {
    console.log("order" , order);
    if (!order) return;
    cancelOrder.mutate({
      id: order.id,
      reason: "Dibatalkan oleh kasir",
    });
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
          fontWeight: 400,
        }}
      >
        Batalkan Pesanan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          Apakah Anda yakin ingin membatalkan pesanan{" "}
          <strong>{order?.orderNumber}</strong>?
          {order?.customer?.name && (
            <>
              <br />
              Pelanggan: {order.customer.name}
            </>
          )}
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
          {isPending ? "Membatalkan..." : "Ya, Batalkan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCancelDialog;