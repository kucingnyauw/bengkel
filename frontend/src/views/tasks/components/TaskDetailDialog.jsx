/**
 * TaskDetailDialog - Dialog detail untuk menampilkan informasi lengkap tugas yang dikelompokkan per order.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} props.orderId - ID Order untuk mengambil detail tugas
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail tugas
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import {
  Avatar,
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
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatToIdr, formatDateTime, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { useTasksByOrderQuery } from "@views/tasks/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
  </Stack>
);

const TaskDetailDialog = ({ open, orderId, onClose }) => {
  const theme = useTheme();
  const { data, isLoading } = useTasksByOrderQuery(orderId, open);
  const [expandedServices, setExpandedServices] = useState({});

  const toggleService = (orderItemId) => {
    setExpandedServices((prev) => ({ ...prev, [orderItemId]: !prev[orderItemId] }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          fontWeight: 400,
        }}
      >
        Detail Tugas
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : data ? (
          <Stack sx={{ gap: 3 }}>
            {/* Informasi Pesanan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Pesanan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      No. Order
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.orderNumber}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Status
                    </Typography>
                    <Chip
                      label={normalizeEnumText(OrderStatus[data.status] || data.status)}
                      color={statusColorMap[data.status] || "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Total
                    </Typography>
                    <Typography variant="body2" color="secondary" sx={{ fontWeight: 400 }}>
                      {formatToIdr(data.total || 0)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Pelanggan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.customer?.name || "—"}
                    </Typography>
                  </Stack>
                  {data.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Kendaraan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {data.vehicle.plateNumber} · {data.vehicle.brand} {data.vehicle.model || ""}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Dibuat
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.createdAt ? formatDateTime(data.createdAt) : "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Dimulai
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.startedAt ? formatDateTime(data.startedAt) : "Belum dimulai"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Selesai
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.completedAt ? formatDateTime(data.completedAt) : "Belum selesai"}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Layanan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                  Layanan ({data.services?.length || 0})
                </Typography>
              </Box>

              <Divider />

              <CardContent sx={{ pt: 2 }}>
                <Stack sx={{ gap: 1.5 }}>
                  {data.services?.map((service) => {
                    const isExpanded = expandedServices[service.orderItemId];
                    const assignments = service.assignments || [];

                    return (
                      <Card
                        key={service.orderItemId}
                        sx={{
                          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                          boxShadow: "none",
                        }}
                      >
                        <Box
                          onClick={() => toggleService(service.orderItemId)}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            px: 2,
                            py: 1.5,
                            transition: "background-color 0.15s ease",
                            "&:hover": {
                              bgcolor: alpha(theme.palette.secondary.main, 0.04),
                            },
                          }}
                        >
                          <Stack direction="row" sx={{ gap: 1.5, flex: 1 }}>
                            <Avatar
                              src={service.product?.image || ""}
                              variant="rounded"
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: !service.product?.image
                                  ? alpha(theme.palette.secondary.main, 0.08)
                                  : "transparent",
                                color: !service.product?.image
                                  ? theme.palette.secondary.main
                                  : "transparent",
                                fontSize: "0.875rem",
                                fontWeight: 400,
                              }}
                            >
                              {!service.product?.image &&
                                service.serviceName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Stack sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                {service.serviceName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                Qty: {service.quantity} · {formatToIdr(service.subtotal)}
                              </Typography>
                            </Stack>
                          </Stack>
                          {isExpanded ? (
                            <ChevronUp size={16} strokeWidth={1.5} />
                          ) : (
                            <ChevronDown size={16} strokeWidth={1.5} />
                          )}
                        </Box>

                        <Collapse in={isExpanded}>
                          <Divider />
                          <CardContent sx={{ py: 1.5 }}>
                            <Stack sx={{ gap: 1 }}>
                              {assignments.map((a) => (
                                <Stack
                                  key={a.id}
                                  direction="row"
                                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                    {a.mechanic?.fullName || "—"}
                                  </Typography>
                                  <Chip
                                    label={normalizeEnumText(a.statusLabel || a.status || "Menunggu")}
                                    color={
                                      a.status === "COMPLETED"
                                        ? "success"
                                        : a.status === "IN_PROGRESS"
                                        ? "secondary"
                                        : "warning"
                                    }
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 400 }}
                                  />
                                </Stack>
                              ))}
                              {assignments.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                                  Belum ada mekanik ditugaskan
                                </Typography>
                              )}
                            </Stack>
                          </CardContent>
                        </Collapse>
                      </Card>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
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

export default TaskDetailDialog;