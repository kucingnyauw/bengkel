/**
 * UserFormDialog - Dialog form untuk membuat dan mengedit data karyawan/user.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} props.type - Tipe form ("create" atau "edit")
 * @param {Object} [props.user] - Data user untuk mode edit
 * @param {string} [props.user.email] - Email user
 * @param {string} [props.user.fullName] - Nama lengkap user
 * @param {string} [props.user.phone] - Nomor telepon user
 * @param {string} [props.user.role] - Role user (CASHIER/MECHANIC)
 * @param {boolean} [props.user.isActive] - Status aktif user
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog form user
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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useUserForm } from "@views/users/hooks";
import { useCreateUserMutation, useUpdateUserMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const UserFormDialog = ({
  open,
  user,
  onClose,
  type = "create",
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isEdit = type === "edit";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useUserForm();

  const createMutation = useCreateUserMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Undangan telah dikirim ke ${data?.email || "karyawan baru"}`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      handleClose();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal mengirim undangan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const updateMutation = useUpdateUserMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Karyawan "${data?.fullName || user?.fullName}" berhasil diperbarui`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      handleClose();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal memperbarui karyawan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    if (open) {
      if (isEdit && user) {
        reset({
          email: user.email || "",
          fullName: user.fullName || "",
          phone: user.phone || "",
          role: user.role || "CASHIER",
          isActive: user.isActive ?? true,
        });
      } else {
        reset({
          email: "",
          fullName: "",
          phone: "",
          role: "CASHIER",
          isActive: true,
        });
      }
    }
  }, [open, user, isEdit, reset]);

  const onSubmit = (formData) => {
    if (isEdit && user) {
      updateMutation.mutate({
        id: user.id,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
      });
    } else {
      createMutation.mutate({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
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
        {isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
        <IconButton onClick={handleClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack sx={{ gap: 2.5 }}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email wajib diisi",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Format email tidak valid",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus={!isEdit}
                  label="Email"
                  placeholder="Masukkan alamat email"
                  disabled={isEdit}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                    formHelperText: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />

            <Controller
              name="fullName"
              control={control}
              rules={{ required: "Nama lengkap wajib diisi" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus={isEdit}
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
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
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nomor Telepon"
                  placeholder="08123456789"
                  disabled={isPending}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              rules={{ required: "Role wajib dipilih" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role} disabled={isPending}>
                  <InputLabel sx={{ fontWeight: 400 }}>Role</InputLabel>
                  <Select {...field} label="Role" sx={{ fontWeight: 400 }}>
                    <MenuItem value="CASHIER" sx={{ fontWeight: 400 }}>
                      Kasir
                    </MenuItem>
                    <MenuItem value="MECHANIC" sx={{ fontWeight: 400 }}>
                      Mekanik
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {isEdit && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isPending}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {field.value ? "Aktif" : "Nonaktif"}
                      </Typography>
                    }
                  />
                )}
              />
            )}
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
            type="submit"
            disabled={isPending || (isEdit && !isDirty)}
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
            {isPending
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Kirim Undangan"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UserFormDialog;