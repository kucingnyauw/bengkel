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
    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={60} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={60} sx={{ borderRadius: 2 }} />
  </Stack>
);

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const theme = useTheme();
  const [vehiclesExpanded, setVehiclesExpanded] = useState(true);
  const [ordersExpanded, setOrdersExpanded] = useState(true);

  const { data: detailData, isLoading } = useCustomerDetailQuery(customerId, open);

  const hasVehicles = detailData?.vehicles?.length > 0;
  const hasOrders = detailData?.orders?.length > 0;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
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
        Detail Pelanggan
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 3 }}>
            {/* Info Utama */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack sx={{ gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 400 }}>
                    {detailData.name}
                  </Typography>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Telepon
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.phone || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Daftar
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Statistik */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Kendaraan
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 400 }}>
                      {detailData.totalVehicles}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Order
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 400 }}>
                      {detailData.totalOrders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Kendaraan */}
            {hasVehicles && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  overflow: "hidden",
                }}
              >
                <Box
                  onClick={() => setVehiclesExpanded(!vehiclesExpanded)}
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
                      Kendaraan
                    </Typography>
                    <Chip
                      label={detailData.vehicles.length}
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
                      transform: vehiclesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={vehiclesExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack sx={{ gap: 1.5 }}>
                      {detailData.vehicles.map((v) => (
                        <Card
                          key={v.id}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            boxShadow: "none",
                          }}
                        >
                          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {v.plateNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
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
                      label={detailData.orders.length}
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
                    <Stack spacing={0}>
                      {detailData.orders.map((o, index) => (
                        <Box key={o.id}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 1.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {o.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
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
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog;