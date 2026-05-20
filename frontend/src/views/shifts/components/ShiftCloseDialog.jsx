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
} from "@mui/material";

import { formatToIdr } from "@shared/utils";
import { useCloseShiftMutation, useExpectedCash } from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ShiftCloseDialog = ({ onClose, open, shiftId }) => {
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { endingCash: "" },
  });
  const watchEndingCash = watch("endingCash");

  const { data: expectedCash, isLoading } = useExpectedCash(shiftId, open && !!shiftId);

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
   * @param {Object} formData - Data form
   */
  const onSubmit = (formData) => {
    if (!shiftId) return;
    closeShiftMutation.mutate({
      id: shiftId,
      payload: { endingCash: Number(formData.endingCash) },
    });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : handleClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Tutup Shift
        <IconButton onClick={handleClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          {isLoading ? (
            <Card>
              <CardContent>
                <Skeleton width="50%" height={16} />
                <Skeleton width="100%" height={14} sx={{ mt: 1 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
                <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
              </CardContent>
            </Card>
          ) : expectedCash ? (
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={0.5} sx={{ mb: 1.5, display: "block" }}>
                  Perhitungan Sistem
                </Typography>

                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Saldo Awal</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatToIdr(expectedCash.startingCash)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Penjualan Tunai</Typography>
                    <Typography variant="body2" fontWeight={500}>+ {formatToIdr(expectedCash.cashSales)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Kas Masuk</Typography>
                    <Typography variant="body2" fontWeight={500}>+ {formatToIdr(expectedCash.cashIn)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Kas Keluar</Typography>
                    <Typography variant="body2" fontWeight={500}>− {formatToIdr(expectedCash.cashOut)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Pengeluaran</Typography>
                    <Typography variant="body2" fontWeight={500}>− {formatToIdr(expectedCash.totalExpenses)}</Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>Saldo Diharapkan</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {formatToIdr(expectedCash.expectedCash)}
                  </Typography>
                </Stack>

                {expectedCash.paymentBreakdown && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={500} letterSpacing={0.5} sx={{ mb: 1, display: "block" }}>
                      Rincian Pembayaran
                    </Typography>
                    <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Tunai</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatToIdr(expectedCash.paymentBreakdown.cash?.total || 0)} ({expectedCash.paymentBreakdown.cash?.count || 0}x)
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">QRIS</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatToIdr(expectedCash.paymentBreakdown.qris?.total || 0)} ({expectedCash.paymentBreakdown.qris?.count || 0}x)
                      </Typography>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Controller
            control={control}
            name="endingCash"
            rules={{ required: true, min: 0 }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
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
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isPending ? "Menutup Shift..." : "Tutup Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftCloseDialog;