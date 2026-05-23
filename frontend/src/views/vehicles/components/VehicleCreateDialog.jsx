/**
 * VehicleCreateDialog - Dialog form untuk mendaftarkan kendaraan baru ke customer.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog tambah kendaraan
 */
import { useEffect, useCallback, useState } from "react";
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
  Typography,
} from "@mui/material";

import { getCustomers } from "@api/customerApi.js";
import { AsyncAutocomplete } from "@components";
import { useDebounce } from "@hooks";
import {
  useVehicleForm,
  useCreateVehicleMutation,
} from "@views/vehicles/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const VehicleCreateDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, reset } = useVehicleForm();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debouncedCustomerSearch = useDebounce(customerSearch);

  const createMutation = useCreateVehicleMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Kendaraan berhasil didaftarkan",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      reset();
      setSelectedCustomer(null);
      setCustomerSearch("");
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal mendaftarkan kendaraan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = createMutation.isPending;

  useEffect(() => {
    if (open) {
      reset();
      setSelectedCustomer(null);
      setCustomerSearch("");
    }
  }, [open, reset]);

  /**
   * Handle submit form
   * @param {Object} formData - Data form
   */
  const onSubmit = useCallback(
    (formData) => {
      createMutation.mutate(formData);
    },
    [createMutation]
  );

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isPending ? undefined : onClose}
      open={open}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 500,
        }}
      >
        Tambah Kendaraan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box
          component="form"
          id="vehicle-create-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={2.5}>
            <Controller
              name="customerId"
              control={control}
              rules={{ required: "Pelanggan wajib dipilih" }}
              render={({ field, fieldState }) => (
                <Box>
                  <AsyncAutocomplete
                    value={selectedCustomer}
                    onChange={(val) => {
                      setSelectedCustomer(val);
                      field.onChange(val?.id || "");
                    }}
                    queryKey={["customers-vehicle", debouncedCustomerSearch]}
                    fetchOptions={async () => {
                      const res = await getCustomers({
                        page: 1,
                        limit: 10,
                        search: debouncedCustomerSearch,
                      });
                      return res?.data || [];
                    }}
                    getOptionLabel={(o) => o?.name || ""}
                    isOptionEqualToValue={(option, value) =>
                      option?.id === value?.id
                    }
                    placeholder="Cari pelanggan..."
                    renderOption={(props, option) => {
                      const { key, ...rest } = props;
                      return (
                        <Box key={key} component="li" {...rest}>
                          <Box>
                            <Typography variant="body2">
                              {option.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.phone}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />
                </Box>
              )}
            />

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
                  label="Nomor Plat"
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
                  placeholder="Contoh: Vespa (opsional)"
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
                  placeholder="Contoh: Sprint 150 (opsional)"
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
        >
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          type="submit"
          form="vehicle-create-form"
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

export default VehicleCreateDialog;
