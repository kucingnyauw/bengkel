/**
 * CustomerUpdateDialog - Dialog untuk mengupdate data customer (nama & telepon).
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.control - Control dari react-hook-form
 * @param {Object} props.customer - Data customer yang akan diupdate
 * @param {string|number} props.customer.id - ID customer
 * @param {string} props.customer.name - Nama customer
 * @param {string} props.customer.phone - Telepon customer
 * @param {Function} props.handleSubmit - Fungsi handleSubmit dari react-hook-form
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog update customer
 */
import { Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
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
import { alpha } from "@mui/material/styles";

import { useUpdateCustomerMutation } from "@views/customers/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CustomerUpdateDialog = ({
  control,
  customer,
  handleSubmit,
  onClose,
  open,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const updateMutation = useUpdateCustomerMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pelanggan "${data?.name || customer?.name}" berhasil diperbarui`,
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
          message: error?.message || "Gagal memperbarui pelanggan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = updateMutation.isPending;

  const onSubmit = (formData) => {
    if (!customer) return;
    updateMutation.mutate({ id: customer.id, ...formData });
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
        Update Pelanggan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box component="form" id="customer-update-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack sx={{ gap: 2.5 }}>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Nama pelanggan wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Nama Pelanggan"
                  placeholder="Masukkan nama lengkap"
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                    formHelperText: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              rules={{ required: "Telepon wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Telepon"
                  placeholder="Contoh: 08123456789"
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                    formHelperText: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
          </Stack>
        </Box>
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
          disabled={isPending}
          type="submit"
          form="customer-update-form"
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
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerUpdateDialog;