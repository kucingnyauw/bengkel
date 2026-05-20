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
} from "@mui/material";

import { formatToIdr, formatDateTime, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { useTasksByOrderQuery } from "@views/tasks/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const TaskDetailDialog = ({ open, orderId, onClose }) => {
  const { data, isLoading } = useTasksByOrderQuery(orderId, open);
  const [expandedServices, setExpandedServices] = useState({});

  const toggleService = (orderItemId) => {
    setExpandedServices((prev) => ({ ...prev, [orderItemId]: !prev[orderItemId] }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Tugas
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : data ? (
          <Stack spacing={3}>
            {/* Informasi Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Pesanan
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">No. Order</Typography>
                    <Typography variant="body2" fontWeight={500}>{data.orderNumber}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={normalizeEnumText(OrderStatus[data.status] || data.status)}
                      color={statusColorMap[data.status] || "default"}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatToIdr(data.total || 0)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2" fontWeight={500}>{data.customer?.name || "—"}</Typography>
                  </Stack>
                  {data.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Kendaraan</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {data.vehicle.plateNumber} — {data.vehicle.brand} {data.vehicle.model || ""}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Dibuat</Typography>
                    <Typography variant="body2" fontWeight={500}>{data.createdAt ? formatDateTime(data.createdAt) : "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Dimulai</Typography>
                    <Typography variant="body2" fontWeight={500}>{data.startedAt ? formatDateTime(data.startedAt) : "Belum dimulai"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Selesai</Typography>
                    <Typography variant="body2" fontWeight={500}>{data.completedAt ? formatDateTime(data.completedAt) : "Belum selesai"}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Layanan */}
            <Card>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Layanan ({data.services?.length || 0})
                </Typography>
              </Box>

              <Divider />

              <CardContent sx={{ pt: 2 }}>
                <Stack spacing={1.5}>
                  {data.services?.map((service) => {
                    const isExpanded = expandedServices[service.orderItemId];
                    const assignments = service.assignments || [];

                    return (
                      <Card key={service.orderItemId}>
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
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                            {service.product?.image ? (
                              <Avatar
                                src={service.product.image}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            ) : (
                              <Avatar
                                variant="rounded"
                                sx={{ width: 40, height: 40, bgcolor: "action.hover", color: "text.secondary", fontSize: "0.875rem", fontWeight: 600 }}
                              >
                                {service.serviceName?.charAt(0)?.toUpperCase()}
                              </Avatar>
                            )}
                            <Stack sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {service.serviceName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Qty: {service.quantity} | {formatToIdr(service.subtotal)}
                              </Typography>
                            </Stack>
                          </Stack>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Box>

                        <Collapse in={isExpanded}>
                          <Divider />
                          <CardContent sx={{ py: 1.5 }}>
                            <Stack spacing={1}>
                              {assignments.map((a) => (
                                <Stack key={a.id} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                  <Typography variant="body2">{a.mechanic?.fullName || "—"}</Typography>
                                  <Chip
                                    label={a.statusLabel || "Menunggu"}
                                    color={a.status === "COMPLETED" ? "success" : a.status === "IN_PROGRESS" ? "info" : "warning"}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              ))}
                              {assignments.length === 0 && (
                                <Typography variant="body2" color="text.secondary">Belum ada mekanik ditugaskan</Typography>
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
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;