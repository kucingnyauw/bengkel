/**
 * ShiftCloseDialog - Dialog form untuk menutup shift dengan perhitungan saldo diharapkan dan input saldo akhir aktual.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {string|number} props.shiftId - ID Shift yang akan ditutup
 *
 * @returns {JSX.Element} Dialog tutup shift
 */
import { useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
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
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatToIdr } from "@shared/utils";
import { useCloseShiftMutation, useExpectedCash } from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CashRow = ({ label, value, valueColor }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: "space-between", py: 0.5 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" color={valueColor}>
      {value}
    </Typography>
  </Stack>
);

const ShiftCloseDialog = ({ onClose, open, shiftId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { endingCash: "" },
  });
  const watchEndingCash = watch("endingCash");

  const { data: expectedCash, isLoading } = useExpectedCash(
    shiftId,
    open && !!shiftId
  );

  const closeShiftMutation = useCloseShiftMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Shift berhasil ditutup",
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
          message: error.message || "Gagal menutup shift",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = closeShiftMutation.isPending;

  /**
   * Handle tutup dialog dan reset form
   */
  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  /**
   * Handle submit form
   */
  const onSubmit = (formData) => {
    if (!shiftId) return;
    closeShiftMutation.mutate({
      id: shiftId,
      payload: { endingCash: Number(formData.endingCash) },
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isPending ? undefined : handleClose}
      open={open}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Tutup Shift
        <IconButton
          onClick={handleClose}
          disabled={isPending}
          size="small"
          sx={{ mr: -0.5 }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: theme.spacing(3) }}>
          {isLoading ? (
            <Card>
              <CardContent>
                <Skeleton width="50%" height={16} />
                <Skeleton width="100%" height={14} sx={{ mt: 1.5 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 1 }} />
                <Skeleton width="60%" height={14} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ) : expectedCash ? (
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mb: theme.spacing(2),
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Perhitungan Sistem
                </Typography>

                <Stack sx={{ gap: 0.5 }}>
                  <CashRow
                    label="Saldo Awal"
                    value={formatToIdr(expectedCash.startingCash)}
                  />
                  <CashRow
                    label="Penjualan Tunai"
                    value={`+${formatToIdr(expectedCash.cashSales)}`}
                    valueColor="success.main"
                  />
                  <CashRow
                    label="Kas Masuk"
                    value={`+${formatToIdr(expectedCash.cashIn)}`}
                    valueColor="success.main"
                  />
                  <CashRow
                    label="Kas Keluar"
                    value={`-${formatToIdr(expectedCash.cashOut)}`}
                    valueColor="error.main"
                  />
                  <CashRow
                    label="Pengeluaran"
                    value={`-${formatToIdr(expectedCash.totalExpenses)}`}
                    valueColor="error.main"
                  />
                </Stack>

                <Divider sx={{ my: theme.spacing(2) }} />

                <Stack
                  direction="row"
                  sx={(theme) => ({
                    justifyContent: "space-between",
                    py: theme.spacing(1),
                    px: theme.spacing(2),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  })}
                >
                  <Typography variant="body2">
                    Saldo Diharapkan
                  </Typography>
                  <Typography variant="body2" color="secondary">
                    {formatToIdr(expectedCash.expectedCash)}
                  </Typography>
                </Stack>

                {expectedCash.paymentBreakdown && (
                  <>
                    <Divider sx={{ my: theme.spacing(2) }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mb: theme.spacing(1.5),
                        display: "block",
                        letterSpacing: 0.5,
                      }}
                    >
                      Rincian Pembayaran
                    </Typography>
                    <Stack sx={{ gap: 0.5 }}>
                      <CashRow
                        label="Tunai"
                        value={`${formatToIdr(expectedCash.paymentBreakdown.cash?.total || 0)} (${expectedCash.paymentBreakdown.cash?.count || 0}x)`}
                      />
                      <CashRow
                        label="QRIS"
                        value={`${formatToIdr(expectedCash.paymentBreakdown.qris?.total || 0)} (${expectedCash.paymentBreakdown.qris?.count || 0}x)`}
                      />
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Tidak dapat memuat perhitungan
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Masukkan saldo akhir secara manual
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Input Saldo Akhir */}
          <Controller
            control={control}
            name="endingCash"
            rules={{ required: true, min: 0 }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                autoFocus
                label="Saldo Akhir Aktual"
                placeholder="Rp 0"
                error={!!fieldState.error}
                helperText={fieldState.error ? "Saldo akhir wajib diisi" : ""}
                disabled={isPending}
                value={field.value ? formatToIdr(field.value) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  field.onChange(raw ? Number(raw) : "");
                }}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isPending}
          onClick={handleClose}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={!watchEndingCash || isPending}
          onClick={handleSubmit(onSubmit)}
          startIcon={
            isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isPending ? "Menutup Shift..." : "Tutup Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftCloseDialog;