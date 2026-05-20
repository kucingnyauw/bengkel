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
} from "@mui/material";

import { useCreateCustomerMutation } from "@views/customers/hooks";

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
  const { createCustomerAndVehicle, isPending } = useCreateCustomerMutation({
    onSuccess: () => onClose?.(),
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
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Pelanggan Baru
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
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
            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Nama pelanggan wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    autoFocus
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Nama Pelanggan"
                    placeholder="Masukkan nama lengkap"
                    disabled={isPending}
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
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Telepon"
                    placeholder="Contoh: 08123456789"
                    disabled={isPending}
                  />
                )}
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="plateNumber"
                rules={{ required: "Plat nomor wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    autoFocus
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Plat Nomor"
                    placeholder="Contoh: B 1234 ABC"
                    disabled={isPending}
                  />
                )}
              />
              <Controller
                control={control}
                name="brand"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Merek"
                    placeholder="Contoh: Honda, Yamaha (opsional)"
                    disabled={isPending}
                  />
                )}
              />
              <Controller
                control={control}
                name="model"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Model"
                    placeholder="Contoh: Vario, Beat (opsional)"
                    disabled={isPending}
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
          >
            Kembali
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {activeStep === 0 ? (
          <Button variant="contained" onClick={handleNext}>
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
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCreateDialog;