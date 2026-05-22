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
import { alpha } from "@mui/material/styles";

import { formatToIdr } from "@shared/utils";
import { useRefundPaymentMutation } from "@views/payments/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const RefundPaymentDialog = ({ onClose, onReasonChange, open, payment, reason }) => {
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
        Refund Pembayaran
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Stack sx={{ gap: 1.5 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                    No. Order
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {payment?.order?.orderNumber || "—"}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Jumlah
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {formatToIdr(payment?.amountPaid || 0)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <TextField
            fullWidth
            label="Alasan Refund"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Masukkan alasan refund (opsional)"
            multiline
            rows={3}
            disabled={isPending}
            slotProps={{
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
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
          sx={{ fontWeight: 400 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{ fontWeight: 400 }}
        >
          {isPending ? "Merefund..." : "Refund"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundPaymentDialog;