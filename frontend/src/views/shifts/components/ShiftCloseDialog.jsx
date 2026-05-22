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

const ShiftCloseDialog = ({ onClose, open, shiftId }) => {
  const theme = useTheme();
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
        Tutup Shift
        <IconButton onClick={handleClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 3 }}>
          {isLoading ? (
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5 }}>
                <Skeleton width="50%" height={16} />
                <Skeleton width="100%" height={14} sx={{ mt: 1.5 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 1 }} />
                <Skeleton width="60%" height={14} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ) : expectedCash ? (
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: "block",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Perhitungan Sistem
                </Typography>

                <Stack sx={{ gap: 0.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Saldo Awal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(expectedCash.startingCash)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Penjualan Tunai
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 400 }}>
                      +{formatToIdr(expectedCash.cashSales)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kas Masuk
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 400 }}>
                      +{formatToIdr(expectedCash.cashIn)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kas Keluar
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 400 }}>
                      -{formatToIdr(expectedCash.cashOut)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Pengeluaran
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 400 }}>
                      -{formatToIdr(expectedCash.totalExpenses)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    py: 1,
                    px: 2,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    Saldo Diharapkan
                  </Typography>
                  <Typography variant="body2" color="secondary" sx={{ fontWeight: 400 }}>
                    {formatToIdr(expectedCash.expectedCash)}
                  </Typography>
                </Stack>

                {expectedCash.paymentBreakdown && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: "block",
                        fontWeight: 400,
                        letterSpacing: 0.5,
                      }}
                    >
                      Rincian Pembayaran
                    </Typography>
                    <Stack sx={{ gap: 0.5 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Tunai
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {formatToIdr(expectedCash.paymentBreakdown.cash?.total || 0)} ({expectedCash.paymentBreakdown.cash?.count || 0}x)
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                          QRIS
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {formatToIdr(expectedCash.paymentBreakdown.qris?.total || 0)} ({expectedCash.paymentBreakdown.qris?.count || 0}x)
                        </Typography>
                      </Stack>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
              }}
            >
              <CardContent sx={{ py: 2.5, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak dapat memuat perhitungan
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                  Masukkan saldo akhir secara manual
                </Typography>
              </CardContent>
            </Card>
          )}

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
                slotProps={{
                  input: { sx: { fontWeight: 400 } },
                  inputLabel: { sx: { fontWeight: 400 } },
                  formHelperText: { sx: { fontWeight: 400 } },
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
          sx={{ fontWeight: 400 }}
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
          sx={{
            fontWeight: 400,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
            },
          }}
        >
          {isPending ? "Menutup Shift..." : "Tutup Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftCloseDialog;