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
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const DetailRow = ({ label, value, valueColor }) => {
  const isValueNode = typeof value !== "string" && typeof value !== "number";

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center" }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {isValueNode ? (
        value
      ) : (
        <Typography variant="body2" color={valueColor}>
          {value}
        </Typography>
      )}
    </Stack>
  );
};

const TaskDetailDialog = ({ open, orderId, onClose }) => {
  const theme = useTheme();
  const { data, isLoading } = useTasksByOrderQuery(orderId, open);
  const [expandedServices, setExpandedServices] = useState({});

  const toggleService = (orderItemId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [orderItemId]: !prev[orderItemId],
    }));
  };

  const getAssignmentStatusColor = (status) => {
    if (status === "COMPLETED") return "success";
    if (status === "IN_PROGRESS") return "secondary";
    return "warning";
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
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : data ? (
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Informasi Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Pesanan
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow label="No. Order" value={data.orderNumber} />
                  <DetailRow
                    label="Status"
                    value={
                      <Chip
                        label={normalizeEnumText(
                          OrderStatus[data.status] || data.status
                        )}
                        color={statusColorMap[data.status] || "default"}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Total"
                    value={formatToIdr(data.total || 0)}
                    valueColor="secondary"
                  />
                  <DetailRow
                    label="Pelanggan"
                    value={data.customer?.name || "—"}
                  />
                  {data.vehicle && (
                    <DetailRow
                      label="Kendaraan"
                      value={`${data.vehicle.plateNumber} · ${data.vehicle.brand} ${data.vehicle.model || ""}`}
                    />
                  )}
                  <DetailRow
                    label="Dibuat"
                    value={
                      data.createdAt
                        ? formatDateTime(data.createdAt)
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Dimulai"
                    value={
                      data.startedAt
                        ? formatDateTime(data.startedAt)
                        : "Belum dimulai"
                    }
                  />
                  <DetailRow
                    label="Selesai"
                    value={
                      data.completedAt
                        ? formatDateTime(data.completedAt)
                        : "Belum selesai"
                    }
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Layanan */}
            <Card>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: theme.spacing(2),
                  py: theme.spacing(2),
                }}
              >
                <Typography variant="subtitle2">
                  Layanan ({data.services?.length || 0})
                </Typography>
              </Box>

              <Divider />

              <CardContent sx={{ pt: theme.spacing(2) }}>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  {data.services?.map((service) => {
                    const isExpanded = expandedServices[service.orderItemId];
                    const assignments = service.assignments || [];

                    return (
                      <Card key={service.orderItemId}>
                        <Box
                          onClick={() => toggleService(service.orderItemId)}
                          sx={(theme) => ({
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            px: theme.spacing(2),
                            py: theme.spacing(1.5),
                            transition: theme.transitions.create(
                              "background-color",
                              {
                                duration:
                                  theme.transitions.duration.shorter,
                              }
                            ),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.secondary.main,
                                0.04
                              ),
                            },
                          })}
                        >
                          <Stack
                            direction="row"
                            sx={{ gap: theme.spacing(1.5), flex: 1 }}
                          >
                            <Avatar
                              src={service.product?.image || ""}
                              variant="rounded"
                              sx={(theme) => ({
                                width: 40,
                                height: 40,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: !service.product?.image
                                  ? alpha(
                                      theme.palette.secondary.main,
                                      0.08
                                    )
                                  : "transparent",
                                color: !service.product?.image
                                  ? theme.palette.secondary.main
                                  : "transparent",
                                fontSize: "0.875rem",
                              })}
                            >
                              {!service.product?.image &&
                                service.serviceName
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                            </Avatar>
                            <Stack sx={{ flex: 1 }}>
                              <Typography variant="body2">
                                {service.serviceName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Qty: {service.quantity} ·{" "}
                                {formatToIdr(service.subtotal)}
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
                          <CardContent
                            sx={{ py: theme.spacing(1.5) }}
                          >
                            <Stack sx={{ gap: theme.spacing(1) }}>
                              {assignments.map((a) => (
                                <Stack
                                  key={a.id}
                                  direction="row"
                                  sx={{
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography variant="body2">
                                    {a.mechanic?.fullName || "—"}
                                  </Typography>
                                  <Chip
                                    label={normalizeEnumText(
                                      a.statusLabel ||
                                        a.status ||
                                        "Menunggu"
                                    )}
                                    color={getAssignmentStatusColor(
                                      a.status
                                    )}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              ))}
                              {assignments.length === 0 && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;