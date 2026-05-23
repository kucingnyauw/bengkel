/**
 * OrderDetailDialog - Dialog detail untuk menampilkan informasi lengkap order termasuk item, customer, dan data kendaraan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.orderId - ID Order untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail order
 */
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

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

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";

import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useOrderDetailQuery } from "@views/orders/hooks";
import { CopyButton } from "@components";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={300} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const SectionHeader = ({ title, count, expanded, onToggle }) => (
  <Box
    onClick={onToggle}
    sx={(theme) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      px: 2,
      py: 2,
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
      {count !== undefined && (
        <Chip label={count} size="small" variant="outlined" />
      )}
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

const DetailRow = ({ label, value, endAction, valueSx }) => {
  const isValueNode = typeof value !== "string" && typeof value !== "number";

  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
        {isValueNode ? (
          value
        ) : (
          <Typography variant="body2" sx={valueSx}>
            {value}
          </Typography>
        )}
        {endAction}
      </Stack>
    </Stack>
  );
};

const OrderDetailDialog = ({ orderId, onClose, open }) => {
  const theme = useTheme();
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const { data, isLoading } = useOrderDetailQuery(orderId, open && !!orderId);

  const hasItems = data?.items?.length > 0;
  const hasCustomer = data?.customer?.name;
  const hasVehicle = data?.vehicle?.plateNumber;
  const hasPayment = !!data?.payment;
  const hasHistories = data?.histories?.length > 0;

  const getPaymentChip = () => {
    const status = data?.paymentStatus;

    if (status === "Lunas") {
      return <Chip label="Lunas" size="small" color="success" variant="soft" />;
    }
    if (status === "Menunggu Pembayaran" || status === "Belum Bayar") {
      return <Chip label={status} size="small" color="warning" variant="soft" />;
    }
    if (status === "Direfund") {
      return <Chip label="Direfund" size="small" color="default" variant="soft" />;
    }
    return <Chip label={status || "—"} size="small" color="error" variant="soft" />;
  };

  const getHistoryDotColor = (status) => {
    const color = statusColorMap[status] || "grey";
    return color === "default" ? "grey" : color;
  };

  const getPaymentMethodLabel = (method) => {
    const map = { CASH: "Tunai", QRIS: "QRIS" };
    return map[method] || method;
  };

  const getProductTypeLabel = (type) => (type === "SERVICE" ? "Servis" : "Sparepart");

  const getProductTypeColor = (type) => (type === "SERVICE" ? "secondary" : "warning");

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      {/* Dialog Title */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Pesanan
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent>
        {isLoading || !data ? (
          <DetailSkeleton />
        ) : (
          <Stack sx={{ gap: 3 }}>
            {/* Informasi Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Informasi Pesanan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  {data?.orderNumber && (
                    <DetailRow
                      label="No. Order"
                      value={
                        <Chip
                          label={data.orderNumber}
                          size="small"
                          variant="outlined"
                        />
                      }
                      endAction={
                        <CopyButton
                          text={data.orderNumber}
                          successMessage="No. Order disalin"
                        />
                      }
                    />
                  )}

                  <DetailRow
                    label="Status"
                    value={
                      <Chip
                        color={statusColorMap[data.status] || "default"}
                        label={normalizeEnumText(
                          OrderStatus[data.status] || data.status
                        )}
                        size="small"
                        variant="soft"
                      />
                    }
                  />

                  <DetailRow label="Pembayaran" value={getPaymentChip()} />

                  <DetailRow
                    label="Tanggal"
                    value={formatDateTime(data.createdAt)}
                  />

                  <DetailRow
                    label="Kasir"
                    value={data.cashier?.fullName || "—"}
                  />

                  {hasPayment && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2">
                        Detail Pembayaran
                      </Typography>
                      <DetailRow
                        label="Metode"
                        value={getPaymentMethodLabel(data.payment.method)}
                      />
                      <DetailRow
                        label="Jumlah Dibayar"
                        value={formatToIdr(data.payment.amountPaid)}
                      />
                      {data.payment.paidAt && (
                        <DetailRow
                          label="Waktu Bayar"
                          value={formatDateTime(data.payment.paidAt)}
                        />
                      )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Data Pelanggan & Kendaraan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Data Pelanggan
                </Typography>
                {hasCustomer || hasVehicle ? (
                  <Stack sx={{ gap: 1.5 }}>
                    {hasCustomer && (
                      <>
                        <DetailRow label="Nama" value={data.customer.name} />
                        {data.customer.phone && (
                          <DetailRow
                            label="Telepon"
                            value={data.customer.phone}
                            endAction={<CopyButton text={data.customer.phone} />}
                          />
                        )}
                      </>
                    )}

                    {hasVehicle && (
                      <>
                        <Divider />
                        <Typography variant="subtitle2">
                          Data Kendaraan
                        </Typography>
                        <DetailRow
                          label="Plat Nomor"
                          value={data.vehicle.plateNumber}
                          endAction={
                            <CopyButton text={data.vehicle.plateNumber} />
                          }
                        />
                        <DetailRow
                          label="Merek / Model"
                          value={`${data.vehicle.brand} ${data.vehicle.model || ""}`}
                        />
                      </>
                    )}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    Tidak ada data pelanggan
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Daftar Item */}
            {hasItems && (
              <Card>
                <SectionHeader
                  title="Daftar Item"
                  count={data.items?.length || 0}
                  expanded={itemsExpanded}
                  onToggle={() => setItemsExpanded(!itemsExpanded)}
                />

                <Collapse in={itemsExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={0}>
                      {data.items.map((item, index) => (
                        <Box key={item.id}>
                          <Stack
                            direction="row"
                            sx={{ gap: 2, alignItems: "flex-start" }}
                          >
                            <Avatar
                              alt={item.productName || item.product?.name}
                              src={item.product?.image?.url || ""}
                              variant="rounded"
                              sx={(theme) => ({
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                bgcolor: !item.product?.image?.url
                                  ? alpha(theme.palette.secondary.main, 0.08)
                                  : "transparent",
                                color: !item.product?.image?.url
                                  ? theme.palette.secondary.main
                                  : "transparent",
                                fontSize: "0.875rem",
                              })}
                            >
                              {!item.product?.image?.url &&
                                (item.productName || item.product?.name)
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                            </Avatar>

                            <Stack sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                sx={{ gap: 1, alignItems: "center" }}
                              >
                                <Typography variant="body2" noWrap>
                                  {item.productName || item.product?.name}
                                </Typography>
                                <Chip
                                  label={getProductTypeLabel(item.product?.type)}
                                  size="small"
                                  variant="outlined"
                                  color={getProductTypeColor(item.product?.type)}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.quantity} × {formatToIdr(item.unitPrice)}
                              </Typography>
                              {item.assignments?.length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  {item.assignments
                                    .map((a) => a.mechanic?.fullName)
                                    .filter(Boolean)
                                    .join(", ")}
                                </Typography>
                              )}
                            </Stack>

                            <Typography variant="body2" noWrap>
                              {formatToIdr(item.subtotal)}
                            </Typography>
                          </Stack>
                          {index < data.items.length - 1 && (
                            <Divider sx={{ my: 1.5 }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Riwayat Status - Timeline */}
            {hasHistories && (
              <Card>
                <SectionHeader
                  title="Riwayat Status"
                  count={data.histories?.length || 0}
                  expanded={historyExpanded}
                  onToggle={() => setHistoryExpanded(!historyExpanded)}
                />

                <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2, pb: 1 }}>
                    <Timeline
                      position="alternate"
                      sx={{
                        p: 0,
                        m: 0,
                        [`& .MuiTimelineItem-root`]: {
                          minHeight: 80,
                        },
                        [`& .MuiTimelineContent-root`]: {
                          py: 0.5,
                        },
                      }}
                    >
                      {data.histories.map((history, index) => (
                        <TimelineItem key={history.id}>
                          <TimelineSeparator>
                            <TimelineDot
                              color={getHistoryDotColor(history.status)}
                              variant="outlined"
                              sx={{
                                boxShadow: "none",
                                borderWidth: 2,
                                p: 0.5,
                                m: 0,
                              }}
                            />
                            {index < data.histories.length - 1 && (
                              <TimelineConnector
                                sx={(theme) => ({
                                  bgcolor: alpha(theme.palette.divider, 0.8),
                                  width: 1.5,
                                })}
                              />
                            )}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Box
                              sx={(theme) => ({
                                p: 2,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: alpha(
                                  theme.palette.background.paper,
                                  0.6
                                ),
                                border: `1px solid ${theme.palette.divider}`,
                                transition: theme.transitions.create(
                                  ["background-color", "box-shadow"],
                                  {
                                    duration:
                                      theme.transitions.duration.shorter,
                                  }
                                ),
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.secondary.main,
                                    0.02
                                  ),
                                  boxShadow: `0 0 0 1px ${alpha(
                                    theme.palette.secondary.main,
                                    0.1
                                  )}`,
                                },
                              })}
                            >
                              <Stack sx={{ gap: 1 }}>
                                <Stack
                                  direction="row"
                                  sx={{
                                    gap: 1,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Chip
                                    color={
                                      statusColorMap[history.status] ||
                                      "default"
                                    }
                                    label={normalizeEnumText(
                                      OrderStatus[history.status] ||
                                        history.status
                                    )}
                                    size="small"
                                    variant="soft"
                                  />
                                </Stack>

                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  {formatDateTime(history.createdAt)}
                                </Typography>

                                {history.changedBy?.fullName && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Oleh: {history.changedBy.fullName}
                                  </Typography>
                                )}

                                {history.note && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={(theme) => ({
                                      fontStyle: "italic",
                                      display: "block",
                                      mt: 0.5,
                                      pt: 1,
                                      borderTop: `1px solid ${theme.palette.divider}`,
                                    })}
                                  >
                                    "{history.note}"
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Total */}
            <Card>
              <CardContent>
                <Stack sx={{ gap: 1.5 }}>
                  <DetailRow
                    label="Subtotal"
                    value={formatToIdr(data.subtotal)}
                  />
                  <DetailRow label="Pajak" value={formatToIdr(data.tax)} />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body1">Total Keseluruhan</Typography>
                  <Typography variant="h6" color="secondary">
                    {formatToIdr(data.total)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </DialogContent>

      <Divider />

      {/* Dialog Actions */}
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailDialog;