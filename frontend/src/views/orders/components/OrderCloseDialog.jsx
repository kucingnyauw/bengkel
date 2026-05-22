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
  useTheme,
  alpha
} from "@mui/material";

import { useCloseOrderMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

/**
 * OrderCloseDialog - Dialog konfirmasi untuk menutup pesanan yang sudah selesai.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.order - Data order yang akan ditutup
 * @param {string} [props.order.id] - ID Order
 * @param {string} [props.order.orderNumber] - Nomor order untuk ditampilkan
 * @param {Object} [props.order.customer] - Informasi customer
 * @param {string} [props.order.customer.name] - Nama customer
 *
 * @returns {JSX.Element} Dialog konfirmasi tutup order
 */
const OrderCloseDialog = ({ onClose, open, order }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const closeOrder = useCloseOrderMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pesanan #${data.orderNumber || order?.orderNumber} berhasil ditutup`,
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
          message: error.message || "Gagal menutup pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = closeOrder.isPending;

  const handleConfirm = () => {
    if (!order) return;
    closeOrder.mutate(order.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}     slotProps={{
      paper : {
        sx: {
          borderRadius: `${theme.shape.borderRadius}px`,
          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        },
      }
    }}
 >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight : 500
        }}
      >
        Tutup Pesanan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText>
          Apakah Anda yakin ingin menutup pesanan{" "}
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
          {isPending ? "Menutup..." : "Ya, Tutup"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCloseDialog;