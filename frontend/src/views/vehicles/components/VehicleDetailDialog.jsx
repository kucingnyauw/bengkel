/**
 * VehicleDetailDialog - Dialog detail untuk menampilkan informasi lengkap kendaraan.
 * Jika customer memiliki lebih dari 1 kendaraan, akan muncul dropdown pilihan terlebih dahulu.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} [props.vehicleId] - ID Kendaraan (jika langsung)
 * @param {Object} [props.customer] - Data customer dengan kendaraan (untuk pilihan)
 * @param {Object[]} [props.customer.vehicles] - Array kendaraan
 * @param {string} [props.customer.name] - Nama customer
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail kendaraan
 */
import { useState, useEffect } from "react";
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { formatDateTime } from "@shared/utils";
import { useVehicleDetailQuery } from "@views/vehicles/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const VehicleDetailDialog = ({ open, vehicleId, customer, onClose }) => {
  const vehicles = customer?.vehicles || [];
  const [selectedId, setSelectedId] = useState(vehicleId || vehicles[0]?.id || "");

  const { data: vehicle, isLoading } = useVehicleDetailQuery(selectedId, open && !!selectedId);

  useEffect(() => {
    if (open) {
      if (vehicleId) {
        setSelectedId(vehicleId);
      } else if (vehicles.length > 0) {
        setSelectedId(vehicles[0].id);
      }
    }
  }, [open, vehicleId]);

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Kendaraan
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {/* Dropdown pilih kendaraan (jika > 1) */}
        {vehicles.length > 1 && (
          <FormControl sx={{ mb: 3 }}>
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
        )}

        {/* Nama Customer */}
        {customer?.name && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Milik: <strong>{customer.name}</strong>
          </Typography>
        )}

        {/* Detail Kendaraan */}
        {isLoading ? (
          <DetailSkeleton />
        ) : vehicle ? (
          <Stack spacing={3}>
            {/* Info Kendaraan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Kendaraan
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Plat Nomor</Typography>
                    <Typography variant="body2" fontWeight={600}>{vehicle.plateNumber}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Merek</Typography>
                    <Typography variant="body2" fontWeight={500}>{vehicle.brand || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Model</Typography>
                    <Typography variant="body2" fontWeight={500}>{vehicle.model || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Terdaftar</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(vehicle.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Info Customer */}
            {vehicle.customer && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Pemilik
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Nama</Typography>
                      <Typography variant="body2" fontWeight={600}>{vehicle.customer.name}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Telepon</Typography>
                      <Typography variant="body2" fontWeight={500}>{vehicle.customer.phone || "—"}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Ringkasan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Ringkasan
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Total Order</Typography>
                    <Chip
                      label={vehicle.totalOrders || 0}
                      size="small"
                      variant="outlined"
                      color={vehicle.totalOrders > 0 ? "primary" : "default"}
                    />
                  </Stack>
                  {vehicle.orders?.length > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Riwayat Order
                      </Typography>
                      {vehicle.orders.map((order) => (
                        <Stack
                          key={order.id}
                          direction="row"
                          sx={{ justifyContent: "space-between", alignItems: "center" }}
                        >
                          <Typography variant="body2">{order.orderNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(order.createdAt)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            Data tidak ditemukan
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleDetailDialog;