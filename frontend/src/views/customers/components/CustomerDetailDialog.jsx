/**
 * CustomerDetailDialog - Dialog detail untuk menampilkan informasi lengkap customer,
 * termasuk kendaraan dan riwayat order.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.customerId - ID customer untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail customer
 */
import { useState } from "react";
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
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime } from "@shared/utils";
import { useCustomerDetailQuery } from "@views/customers/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={60} />
    <Skeleton variant="rounded" height={60} />
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

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const theme = useTheme();
  const [vehiclesExpanded, setVehiclesExpanded] = useState(true);
  const [ordersExpanded, setOrdersExpanded] = useState(true);

  const { data: detailData, isLoading } = useCustomerDetailQuery(
    customerId,
    open
  );

  const hasVehicles = detailData?.vehicles?.length > 0;
  const hasOrders = detailData?.orders?.length > 0;

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Pelanggan
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Info Utama */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent
                sx={{
                  py: theme.spacing(2.5),
                  "&:last-child": { pb: theme.spacing(2.5) },
                }}
              >
                <Stack sx={{ gap: theme.spacing(2) }}>
                  <Typography variant="h6">{detailData.name}</Typography>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Telepon
                    </Typography>
                    <Typography variant="body2">
                      {detailData.phone || "—"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tanggal Daftar
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Statistik */}
            <Grid container spacing={theme.spacing(2)}>
              <Grid size={6}>
                <Card>
                  <CardContent
                    sx={{
                      textAlign: "center",
                      py: theme.spacing(2.5),
                      "&:last-child": { pb: theme.spacing(2.5) },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Kendaraan
                    </Typography>
                    <Typography variant="h6" sx={{ mt: theme.spacing(1) }}>
                      {detailData.totalVehicles}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={6}>
                <Card>
                  <CardContent
                    sx={{
                      textAlign: "center",
                      py: theme.spacing(2.5),
                      "&:last-child": { pb: theme.spacing(2.5) },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Order
                    </Typography>
                    <Typography variant="h6" sx={{ mt: theme.spacing(1) }}>
                      {detailData.totalOrders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Kendaraan */}
            {hasVehicles && (
              <Card>
                <SectionHeader
                  title="Kendaraan"
                  count={detailData.vehicles.length}
                  expanded={vehiclesExpanded}
                  onToggle={() => setVehiclesExpanded(!vehiclesExpanded)}
                />

                <Collapse in={vehiclesExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack sx={{ gap: theme.spacing(1.5) }}>
                      {detailData.vehicles.map((v) => (
                        <Card key={v.id}>
                          <CardContent
                            sx={{
                              py: theme.spacing(2),
                              "&:last-child": { pb: theme.spacing(2) },
                            }}
                          >
                            <Typography variant="body2">
                              {v.plateNumber}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {v.brand} {v.model}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Riwayat Order */}
            {hasOrders && (
              <Card>
                <SectionHeader
                  title="Riwayat Order"
                  count={detailData.orders.length}
                  expanded={ordersExpanded}
                  onToggle={() => setOrdersExpanded(!ordersExpanded)}
                />

                <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack spacing={0}>
                      {detailData.orders.map((o, index) => (
                        <Box key={o.id}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: theme.spacing(1.5),
                            }}
                          >
                            <Typography variant="body2">
                              {o.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(o.createdAt)}
                            </Typography>
                          </Stack>
                          {index < detailData.orders.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog;