/**
 * VehicleDetailDialog - Dialog detail untuk menampilkan informasi lengkap kendaraan.
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
import { ChevronDown, X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
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
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime } from "@shared/utils";
import { useVehicleDetailQuery } from "@views/vehicles/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
  </Stack>
);

const VehicleDetailDialog = ({ open, vehicleId, customer, onClose }) => {
  const theme = useTheme();
  const vehicles = customer?.vehicles || [];
  const [selectedId, setSelectedId] = useState(vehicleId || vehicles[0]?.id || "");
  const [ordersExpanded, setOrdersExpanded] = useState(false);

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
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
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
        Detail Kendaraan
        <IconButton onClick={handleClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {vehicles.length > 1 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ fontWeight: 400 }}>Pilih Kendaraan</InputLabel>
            <Select
              value={selectedId}
              label="Pilih Kendaraan"
              onChange={(e) => setSelectedId(e.target.value)}
              sx={{ fontWeight: 400 }}
            >
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id} sx={{ fontWeight: 400 }}>
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {v.plateNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                      {v.brand} {v.model}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {isLoading ? (
          <DetailSkeleton />
        ) : vehicle ? (
          <Stack sx={{ gap: 3 }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Kendaraan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Plat Nomor
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {vehicle.plateNumber}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Merek
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {vehicle.brand || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Model
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {vehicle.model || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Terdaftar
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(vehicle.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {vehicle.customer && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                    Pemilik
                  </Typography>
                  <Stack sx={{ gap: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Nama
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {vehicle.customer.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Telepon
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {vehicle.customer.phone || "—"}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <Box
                onClick={() => setOrdersExpanded(!ordersExpanded)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 2,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  },
                }}
              >
                <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                    Riwayat Order
                  </Typography>
                  <Chip
                    label={vehicle.orders?.length || 0}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 400 }}
                  />
                </Stack>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  style={{
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: ordersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    opacity: 0.5,
                  }}
                />
              </Box>

              <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  {vehicle.orders?.length > 0 ? (
                    <Stack spacing={0}>
                      {vehicle.orders.map((order, index) => (
                        <Box key={order.id}>
                          <Stack
                            direction="row"
                            sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {order.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                              {formatDateTime(order.createdAt)}
                            </Typography>
                          </Stack>
                          {index < vehicle.orders.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, textAlign: "center", py: 2 }}>
                      Belum ada riwayat order
                    </Typography>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4, fontWeight: 400 }}>
            Data tidak ditemukan
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button variant="outlined" onClick={handleClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleDetailDialog;