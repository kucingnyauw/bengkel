/**
 * CustomerCreateDialog - Dialog multi-step untuk membuat customer baru beserta kendaraannya.
 *
 * Step 0: Input nama & telepon customer.
 * Step 1: Input plat nomor, merek, & model kendaraan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {number} props.activeStep - Step aktif saat ini (0 atau 1)
 * @param {Object} props.control - Control dari react-hook-form
 * @param {Function} props.handleSubmit - Fungsi handleSubmit dari react-hook-form
 * @param {Function} props.onBack - Handler kembali ke step sebelumnya
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onNext - Handler lanjut ke step berikutnya
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Function} props.trigger - Fungsi trigger validasi dari react-hook-form
 * @param {Object} props.formState - State form dari react-hook-form
 *
 * @returns {JSX.Element} Dialog multi-step customer baru
 */
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
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

import { useCreateCustomerMutation } from "@views/customers/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CustomerCreateDialog = ({
  activeStep,
  control,
  handleSubmit,
  onBack,
  onClose,
  onNext,
  open,
  trigger,
  formState,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { createCustomerAndVehicle, isPending } = useCreateCustomerMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pelanggan "${data?.name || "baru"}" berhasil ditambahkan`,
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
          message: error?.message || "Gagal menambahkan pelanggan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isDirty = formState?.isDirty;

  const onSubmit = useCallback(
    (formData) => createCustomerAndVehicle(formData),
    [createCustomerAndVehicle]
  );

  const handleNext = async () => {
    const valid = await trigger(["name", "phone"]);
    if (valid) onNext();
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
        Pelanggan Baru
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box
          component="form"
          id="customer-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          {activeStep === 0 && (
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
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Nama Pelanggan"
                    placeholder="Masukkan nama lengkap"
                    disabled={isPending}
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
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Telepon"
                    placeholder="Contoh: 08123456789"
                    disabled={isPending}
                    slotProps={{
                      input: { sx: { fontWeight: 400 } },
                      inputLabel: { sx: { fontWeight: 400 } },
                      formHelperText: { sx: { fontWeight: 400 } },
                    }}
                  />
                )}
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack sx={{ gap: 2.5 }}>
              <Controller
                control={control}
                name="plateNumber"
                rules={{ required: "Plat nomor wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    autoFocus
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Plat Nomor"
                    placeholder="Contoh: B 1234 ABC"
                    disabled={isPending}
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
                name="brand"
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Merek"
                    placeholder="Contoh: Honda, Yamaha (opsional)"
                    disabled={isPending}
                    slotProps={{
                      input: { sx: { fontWeight: 400 } },
                      inputLabel: { sx: { fontWeight: 400 } },
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="model"
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Model"
                    placeholder="Contoh: Vario, Beat (opsional)"
                    disabled={isPending}
                    slotProps={{
                      input: { sx: { fontWeight: 400 } },
                      inputLabel: { sx: { fontWeight: 400 } },
                    }}
                  />
                )}
              />
            </Stack>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions>
        {activeStep === 1 && (
          <Button
            color="inherit"
            variant="outlined"
            onClick={onBack}
            disabled={isPending}
            sx={{ fontWeight: 400 }}
          >
            Kembali
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            Lanjut
          </Button>
        ) : (
          <Button
            variant="contained"
            type="submit"
            form="customer-form"
            disabled={isPending || !isDirty}
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
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCreateDialog;