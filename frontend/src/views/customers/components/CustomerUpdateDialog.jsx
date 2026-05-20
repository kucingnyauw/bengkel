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

import { useUpdateCustomerMutation } from "@views/customers/hooks";

const CustomerUpdateDialog = ({
  control,
  customer,
  handleSubmit,
  onClose,
  open,
}) => {
  const updateMutation = useUpdateCustomerMutation({
    onSuccess: () => {
      onClose?.();
    },
  });

  const isPending = updateMutation.isPending;

  const onSubmit = (formData) => {
    if (!customer) return;
    updateMutation.mutate({ id: customer.id, ...formData });
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
        Update Pelanggan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box component="form" id="customer-update-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Nama pelanggan wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  autoFocus
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Nama Pelanggan"
                  placeholder="Masukkan nama lengkap"
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
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Telepon"
                  placeholder="Contoh: 08123456789"
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
          form="customer-update-form"
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

export default CustomerUpdateDialog;