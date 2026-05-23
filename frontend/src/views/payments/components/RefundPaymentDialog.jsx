/**
 * RefundPaymentDialog - Dialog konfirmasi untuk merefund pembayaran.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onReasonChange - Handler perubahan alasan refund
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.payment - Data pembayaran yang akan direfund
 * @param {string|number} [props.payment.id] - ID Pembayaran
 * @param {number} [props.payment.amountPaid] - Jumlah yang dibayar
 * @param {Object} [props.payment.order] - Informasi order
 * @param {string} [props.payment.order.orderNumber] - Nomor order
 * @param {string} props.reason - Teks alasan refund
 *
 * @returns {JSX.Element} Dialog refund pembayaran
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
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { formatToIdr } from "@shared/utils";
import { useRefundPaymentMutation } from "@views/payments/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const RefundPaymentDialog = ({
  onClose,
  onReasonChange,
  open,
  payment,
  reason,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const refundMutation = useRefundPaymentMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pembayaran untuk #${data?.order?.orderNumber || payment?.order?.orderNumber} berhasil direfund`,
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
          message: error.message || "Gagal merefund pembayaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = refundMutation.isPending;

  /**
   * Handle konfirmasi refund
   */
  const handleConfirm = () => {
    if (!payment) return;
    refundMutation.mutate({
      id: payment.id,
      reason: reason || undefined,
    });
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
        Refund Pembayaran
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
        <Stack sx={{ gap: theme.spacing(2.5) }}>
          {/* Info Pembayaran */}
          <Card>
            <CardContent>
              <Stack sx={{ gap: theme.spacing(1.5) }}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No. Order
                  </Typography>
                  <Typography variant="body2">
                    {payment?.order?.orderNumber || "—"}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Jumlah
                  </Typography>
                  <Typography variant="body2">
                    {formatToIdr(payment?.amountPaid || 0)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Alasan Refund */}
          <TextField
            fullWidth
            label="Alasan Refund"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Masukkan alasan refund (opsional)"
            multiline
            rows={3}
            disabled={isPending}
          />
        </Stack>
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
          {isPending ? "Merefund..." : "Refund"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundPaymentDialog;