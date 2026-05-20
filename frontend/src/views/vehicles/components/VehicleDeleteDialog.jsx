/**
 * VehicleDeleteDialog - Dialog konfirmasi untuk menghapus kendaraan customer.
 *
 * Jika customer memiliki lebih dari 1 kendaraan, akan muncul dropdown untuk memilih
 * kendaraan mana yang akan dihapus.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.vehicle - Data customer dengan kendaraan
 * @param {string} [props.vehicle.name] - Nama customer
 * @param {Object[]} [props.vehicle.vehicles] - Array kendaraan
 * @param {string} [props.vehicle.vehicles[].id] - ID Kendaraan
 * @param {string} [props.vehicle.vehicles[].plateNumber] - Nomor plat
 * @param {string} [props.vehicle.vehicles[].brand] - Merek
 * @param {string} [props.vehicle.vehicles[].model] - Model
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog hapus kendaraan
 */
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { useDeleteVehicleMutation } from "@views/vehicles/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const VehicleDeleteDialog = ({ open, vehicle, onClose }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteVehicleMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Kendaraan berhasil dihapus",
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
          message: error.message || "Gagal menghapus kendaraan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = deleteMutation.isPending;
  const vehicles = vehicle?.vehicles || [];
  const [selectedId, setSelectedId] = useState(
    vehicles.length === 1 ? vehicles[0]?.id : ""
  );

  /**
   * Handle konfirmasi hapus
   */
  const handleConfirm = useCallback(() => {
    if (selectedId) deleteMutation.mutate(selectedId);
  }, [selectedId, deleteMutation]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Hapus Kendaraan
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <DialogContentText sx={{ mb: 2.5 }}>
          Pilih kendaraan milik <strong>{vehicle?.name || "pelanggan"}</strong>{" "}
          yang akan dihapus.
        </DialogContentText>

        <FormControl disabled={isPending}>
          <InputLabel>Pilih Kendaraan</InputLabel>
          <Select
            value={selectedId}
            label="Pilih Kendaraan"
            onChange={(e) => setSelectedId(e.target.value)}
          >
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
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending || !selectedId}
          onClick={handleConfirm}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleDeleteDialog;