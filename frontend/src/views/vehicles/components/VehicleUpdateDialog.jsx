/**
 * VehicleUpdateDialog - Dialog form untuk mengupdate data kendaraan.
 *
 * Jika customer memiliki lebih dari 1 kendaraan, akan muncul dropdown untuk memilih
 * kendaraan mana yang akan diupdate.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.vehicle - Data customer dengan kendaraan
 * @param {Object[]} [props.vehicle.vehicles] - Array kendaraan
 * @param {string} [props.vehicle.vehicles[].id] - ID Kendaraan
 * @param {string} [props.vehicle.vehicles[].plateNumber] - Nomor plat
 * @param {string} [props.vehicle.vehicles[].brand] - Merek
 * @param {string} [props.vehicle.vehicles[].model] - Model
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog update kendaraan
 */
import { useEffect, useCallback } from "react";
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useUpdateVehicleMutation, useVehicleForm } from "@views/vehicles/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const VehicleUpdateDialog = ({ open, vehicle, onClose }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, reset } = useVehicleForm();

  const updateMutation = useUpdateVehicleMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Kendaraan berhasil diperbarui",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      reset();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal memperbarui kendaraan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = updateMutation.isPending;
  const vehicles = vehicle?.vehicles || [];

  useEffect(() => {
    if (open && vehicle) {
      const defaultVehicle = vehicles[0];
      reset({
        plateNumber: defaultVehicle?.plateNumber || "",
        brand: defaultVehicle?.brand || "",
        model: defaultVehicle?.model || "",
        selectedVehicleId: defaultVehicle?.id || "",
      });
    }
  }, [open, vehicle, reset]);

  /**
   * Handle submit form
   * @param {Object} formData - Data form
   */
  const onSubmit = useCallback(
    (formData) => {
      const vehicleId = formData.selectedVehicleId || vehicles[0]?.id;
      if (!vehicleId) return;

      updateMutation.mutate({
        id: vehicleId,
        plateNumber: formData.plateNumber || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
      });
    },
    [vehicles, updateMutation]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Update Kendaraan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box component="form" id="vehicle-update-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            {vehicles.length > 1 && (
              <Controller
                name="selectedVehicleId"
                control={control}
                render={({ field }) => (
                  <FormControl disabled={isPending}>
                    <InputLabel>Pilih Kendaraan</InputLabel>
                    <Select {...field} label="Pilih Kendaraan">
                      {vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          <Stack>
                            <Typography variant="body2" fontWeight={500}>
                              {v.plateNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {v.brand} {v.model}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            )}

            <Controller
              name="plateNumber"
              control={control}
              rules={{ required: "Nomor plat wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Plat Nomor"
                  placeholder="B 1234 XYZ"
                />
              )}
            />

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isPending}
                  label="Merek"
                  placeholder="Contoh: Vespa"
                />
              )}
            />

            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isPending}
                  label="Model"
                  placeholder="Contoh: Sprint 150"
                />
              )}
            />
          </Stack>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          type="submit"
          form="vehicle-update-form"
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleUpdateDialog;