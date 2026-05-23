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
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const SectionHeader = ({ title, count, expanded, onToggle }) => (
  <Box
    onClick={onToggle}
    sx={(theme) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      px: theme.spacing(2),
      py: theme.spacing(2),
      cursor: "pointer",
      userSelect: "none",
      transition: theme.transitions.create("background-color", {
        duration: theme.transitions.duration.shorter,
      }),
      "&:hover": {
        bgcolor: alpha(theme.palette.secondary.main, 0.04),
      },
    })}
  >
    <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Chip label={count} size="small" variant="outlined" />
    </Stack>
    <ChevronDown
      size={16}
      strokeWidth={1.5}
      style={{
        flexShrink: 0,
        transition: "transform 0.2s ease",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        opacity: 0.5,
      }}
    />
  </Box>
);

const DetailRow = ({ label, value }) => (
  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Stack>
);

const VehicleDetailDialog = ({ open, vehicleId, customer, onClose }) => {
  const theme = useTheme();
  const vehicles = customer?.vehicles || [];
  const [selectedId, setSelectedId] = useState(
    vehicleId || vehicles[0]?.id || ""
  );
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  const { data: vehicle, isLoading } = useVehicleDetailQuery(
    selectedId,
    open && !!selectedId
  );

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
        <IconButton onClick={handleClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {/* Pilihan Kendaraan (jika lebih dari 1) */}
        {vehicles.length > 1 && (
          <FormControl fullWidth sx={{ mb: theme.spacing(3) }}>
            <InputLabel>Pilih Kendaraan</InputLabel>
            <Select
              value={selectedId}
              label="Pilih Kendaraan"
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  <Stack>
                    <Typography variant="body2">{v.plateNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">
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
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Informasi Kendaraan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Kendaraan
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Plat Nomor"
                    value={vehicle.plateNumber}
                  />
                  <DetailRow label="Merek" value={vehicle.brand || "—"} />
                  <DetailRow label="Model" value={vehicle.model || "—"} />
                  <DetailRow
                    label="Tanggal Terdaftar"
                    value={formatDateTime(vehicle.createdAt)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Pemilik */}
            {vehicle.customer && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                    Pemilik
                  </Typography>
                  <Stack sx={{ gap: theme.spacing(1.5) }}>
                    <DetailRow label="Nama" value={vehicle.customer.name} />
                    <DetailRow
                      label="Telepon"
                      value={vehicle.customer.phone || "—"}
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Riwayat Order */}
            <Card>
              <SectionHeader
                title="Riwayat Order"
                count={vehicle.orders?.length || 0}
                expanded={ordersExpanded}
                onToggle={() => setOrdersExpanded(!ordersExpanded)}
              />

              <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent sx={{ pt: theme.spacing(2) }}>
                  {vehicle.orders?.length > 0 ? (
                    <Stack spacing={0}>
                      {vehicle.orders.map((order, index) => (
                        <Box key={order.id}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: theme.spacing(1.5),
                            }}
                          >
                            <Typography variant="body2">
                              {order.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(order.createdAt)}
                            </Typography>
                          </Stack>
                          {index < vehicle.orders.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: theme.spacing(4),
                        gap: theme.spacing(1),
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Belum ada riwayat order
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Kendaraan ini belum memiliki pesanan
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: theme.spacing(4),
              gap: theme.spacing(1),
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Data tidak ditemukan
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Kendaraan mungkin telah dihapus atau ID tidak valid
            </Typography>
          </Box>
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