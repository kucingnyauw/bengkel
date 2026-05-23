/**
 * ShiftCashDialog - Dialog form untuk mencatat transaksi kas masuk/keluar selama shift.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {string|number} props.shiftId - ID Shift untuk transaksi kas
 * @param {string} props.type - Tipe transaksi ("in" untuk kas masuk, "out" untuk kas keluar)
 *
 * @returns {JSX.Element} Dialog transaksi kas shift
 */
import { useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";

import { formatToIdr } from "@shared/utils";
import { useCashInMutation, useCashOutMutation } from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ShiftCashDialog = ({ onClose, open, shiftId, type }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { cashAmount: "", cashNote: "" },
  });
  const watchCashAmount = watch("cashAmount");

  const cashInMutation = useCashInMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Kas masuk berhasil dicatat",
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
          message: error.message || "Gagal mencatat kas masuk",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const cashOutMutation = useCashOutMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Kas keluar berhasil dicatat",
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
          message: error.message || "Gagal mencatat kas keluar",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = cashInMutation.isPending || cashOutMutation.isPending;
  const isCashIn = type === "in";

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
    const payload = {
      amount: Number(formData.cashAmount),
      note: formData.cashNote,
    };
    if (isCashIn) {
      cashInMutation.mutate({ id: shiftId, payload });
    } else {
      cashOutMutation.mutate({ id: shiftId, payload });
    }
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
        {isCashIn ? "Kas Masuk" : "Kas Keluar"}
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
        <Stack sx={{ gap: theme.spacing(2.5) }}>
          {/* Jumlah */}
          <Controller
            control={control}
            name="cashAmount"
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                autoFocus
                label="Jumlah"
                placeholder="Rp 0"
                error={!!fieldState.error}
                helperText={fieldState.error ? "Jumlah wajib diisi" : ""}
                value={field.value ? formatToIdr(field.value) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  field.onChange(raw ? Number(raw) : "");
                }}
                disabled={isPending}
              />
            )}
          />

          {/* Catatan */}
          <Controller
            control={control}
            name="cashNote"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Catatan"
                placeholder="Tambahkan catatan (opsional)"
                multiline
                rows={3}
                disabled={isPending}
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
          disabled={!watchCashAmount || isPending}
          onClick={handleSubmit(onSubmit)}
          startIcon={
            isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftCashDialog;