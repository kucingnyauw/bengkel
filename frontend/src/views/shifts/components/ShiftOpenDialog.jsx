/**
 * ShiftOpenDialog - Dialog form untuk membuka shift baru dengan saran saldo awal.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog buka shift
 */
import { useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Clock, Wallet, X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

import { formatToIdr, formatDateTime } from "@shared/utils";
import { useOpenShiftMutation, useStartingCashSuggestion } from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ShiftOpenDialog = ({ onClose, open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { startingCash: "" },
  });
  const watchStartingCash = watch("startingCash");

  const { data: suggestion, isLoading: isSuggestionLoading } =
    useStartingCashSuggestion(open);

  const openShiftMutation = useOpenShiftMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Shift baru berhasil dibuka",
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
          message: error.message || "Gagal membuka shift",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = openShiftMutation.isPending;

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
    openShiftMutation.mutate({ startingCash: Number(formData.startingCash) });
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
        Buka Shift Baru
        <IconButton onClick={handleClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 3 }}>
          {/* Suggestion Card */}
          {isSuggestionLoading ? (
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5 }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="60%" height={28} sx={{ mt: 1.5 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ) : suggestion ? (
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                    }}
                  >
                    <Wallet size={20} strokeWidth={1.5} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Saran Saldo Awal
                    </Typography>
                    <Typography variant="h5" color="secondary" sx={{ fontWeight: 400 }}>
                      {formatToIdr(suggestion.suggestedStartingCash)}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                  {suggestion.message}
                </Typography>

                {suggestion.lastShift && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: `${theme.shape.borderRadius}px`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(theme.palette.secondary.main, 0.06),
                          color: theme.palette.text.secondary,
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={18} strokeWidth={1.5} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          Shift Sebelumnya
                        </Typography>
                        <Chip
                          label={formatToIdr(suggestion.lastShift.endingCash)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 400, mt: 0.5 }}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400, display: "block", mt: 0.5 }}>
                          Ditutup {formatDateTime(suggestion.lastShift.closedAt)}
                        </Typography>
                      </Box>
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
                <Wallet size={32} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada data shift sebelumnya
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                  Masukkan saldo awal secara manual
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Input Saldo */}
          <Controller
            control={control}
            name="startingCash"
            rules={{ required: true, min: 1000 }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                autoFocus
                label="Saldo Awal"
                placeholder="Rp 0"
                error={!!fieldState.error}
                helperText={fieldState.error ? "Saldo awal wajib diisi (min. Rp 1.000)" : ""}
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
          disabled={!watchStartingCash || isPending}
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
          {isPending ? "Membuka..." : "Buka Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftOpenDialog;