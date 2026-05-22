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
    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
  </Stack>
);

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
      return (
        <Chip
          label="Lunas"
          size="small"
          color="success"
          variant="soft"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Menunggu Pembayaran" || status === "Belum Bayar") {
      return (
        <Chip
          label={status}
          size="small"
          color="warning"
          variant="soft"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Direfund") {
      return (
        <Chip
          label="Direfund"
          size="small"
          color="default"
          variant="soft"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    return (
      <Chip
        label={status || "—"}
        size="small"
        color="error"
        variant="soft"
        sx={{ fontWeight: 400 }}
      />
    );
  };

  const getHistoryDotColor = (status) => {
    const color = statusColorMap[status] || "grey";
    return color === "default" ? "grey" : color;
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
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
          fontWeight : 500
        }}
      >
        Detail Pesanan
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading || !data ? (
          <DetailSkeleton />
        ) : (
          <Stack sx={{ gap: 3 }}>
            {/* Informasi Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Pesanan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  {data?.orderNumber && (
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 400 }}
                      >
                        No. Order
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{ gap: 0.5, alignItems: "center" }}
                      >
                        <Chip
                          label={data.orderNumber}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 400 }}
                        />
                        <CopyButton
                          text={data.orderNumber}
                          successMessage="No. Order disalin"
                        />
                      </Stack>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Status
                    </Typography>
                    <Chip
                      color={statusColorMap[data.status] || "default"}
                      label={normalizeEnumText(
                        OrderStatus[data.status] || data.status
                      )}
                      size="small"
                      variant="soft"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Pembayaran
                    </Typography>
                    {getPaymentChip()}
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Tanggal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(data.createdAt)}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Kasir
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {data.cashier?.fullName || "—"}
                    </Typography>
                  </Stack>

                  {hasPayment && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                        Detail Pembayaran
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 400 }}
                        >
                          Metode
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {data.payment.method === "CASH"
                            ? "Tunai"
                            : data.payment.method === "QRIS"
                            ? "QRIS"
                            : data.payment.method}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 400 }}
                        >
                          Jumlah Dibayar
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {formatToIdr(data.payment.amountPaid)}
                        </Typography>
                      </Stack>
                      {data.payment.paidAt && (
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 400 }}
                          >
                            Waktu Bayar
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400 }}>
                            {formatDateTime(data.payment.paidAt)}
                          </Typography>
                        </Stack>
                      )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Data Pelanggan & Kendaraan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Data Pelanggan
                </Typography>
                {hasCustomer || hasVehicle ? (
                  <Stack sx={{ gap: 1.5 }}>
                    {hasCustomer && (
                      <>
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 400 }}
                          >
                            Nama
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400 }}>
                            {data.customer.name}
                          </Typography>
                        </Stack>
                        {data.customer.phone && (
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontWeight: 400 }}
                            >
                              Telepon
                            </Typography>
                            <Stack
                              direction="row"
                              sx={{ gap: 0.5, alignItems: "center" }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 400 }}
                              >
                                {data.customer.phone}
                              </Typography>
                              <CopyButton text={data.customer.phone} />
                            </Stack>
                          </Stack>
                        )}
                      </>
                    )}

                    {hasVehicle && (
                      <>
                        <Divider />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 400 }}
                        >
                          Data Kendaraan
                        </Typography>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 400 }}
                          >
                            Plat Nomor
                          </Typography>
                          <Stack
                            direction="row"
                            sx={{ gap: 0.5, alignItems: "center" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 400 }}
                            >
                              {data.vehicle.plateNumber}
                            </Typography>
                            <CopyButton text={data.vehicle.plateNumber} />
                          </Stack>
                        </Stack>
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 400 }}
                          >
                            Merek / Model
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400 }}>
                            {data.vehicle.brand} {data.vehicle.model || ""}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2, fontWeight: 400 }}
                  >
                    Tidak ada data pelanggan
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Daftar Item */}
            {hasItems && (
              <Card>
                <Box
                  onClick={() => setItemsExpanded(!itemsExpanded)}
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
                      Daftar Item
                    </Typography>
                    <Chip
                      label={data.items?.length || 0}
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
                      transform: itemsExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

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
                              sx={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: !item.product?.image?.url
                                  ? alpha(theme.palette.secondary.main, 0.08)
                                  : "transparent",
                                color: !item.product?.image?.url
                                  ? theme.palette.secondary.main
                                  : "transparent",
                                fontSize: "0.875rem",
                                fontWeight: 400,
                              }}
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
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 400 }}
                                  noWrap
                                >
                                  {item.productName || item.product?.name}
                                </Typography>
                                <Chip
                                  label={
                                    item.product?.type === "SERVICE"
                                      ? "Servis"
                                      : "Sparepart"
                                  }
                                  size="small"
                                  variant="outlined"
                                  color={
                                    item.product?.type === "SERVICE"
                                      ? "secondary"
                                      : "warning"
                                  }
                                  sx={{ fontWeight: 400 }}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 400 }}
                              >
                                {item.quantity} × {formatToIdr(item.unitPrice)}
                              </Typography>
                              {item.assignments?.length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{ fontWeight: 400 }}
                                >
                                  {item.assignments
                                    .map((a) => a.mechanic?.fullName)
                                    .filter(Boolean)
                                    .join(", ")}
                                </Typography>
                              )}
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 400 }}
                              noWrap
                            >
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

            {/* Riwayat Status - Alternate Timeline */}
            {hasHistories && (
              <Card>
                <Box
                  onClick={() => setHistoryExpanded(!historyExpanded)}
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
                      Riwayat Status
                    </Typography>
                    <Chip
                      label={data.histories?.length || 0}
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
                      transform: historyExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Timeline position="alternate" sx={{ p: 0, m: 0 }}>
                      {data.histories.map((history, index) => (
                        <TimelineItem key={history.id}>
                          <TimelineSeparator>
                            <TimelineDot
                              color={getHistoryDotColor(history.status)}
                              sx={{
                                boxShadow: "none",
                              }}
                            />
                            {index < data.histories.length - 1 && (
                              <TimelineConnector
                                sx={{
                                  bgcolor: alpha(
                                    theme.palette.secondary.main,
                                    0.2
                                  ),
                                  width: 2,
                                }}
                              />
                            )}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                border: `1px solid ${alpha(
                                  theme.palette.divider,
                                  0.6
                                )}`,
                                transition:
                                  theme.transitions.create("background-color"),
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.secondary.main,
                                    0.03
                                  ),
                                },
                              }}
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
                                    sx={{ fontWeight: 400 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    sx={{ fontWeight: 400 }}
                                  >
                                    {formatDateTime(history.createdAt)}
                                  </Typography>
                                </Stack>
                                {history.changedBy?.fullName && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 400 }}
                                  >
                                    Diubah oleh: {history.changedBy.fullName}
                                  </Typography>
                                )}
                                {history.note && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      fontStyle: "italic",
                                      fontWeight: 400,
                                      p: 1,
                                      bgcolor: alpha(
                                        theme.palette.secondary.main,
                                        0.04
                                      ),
                                      borderRadius: `${theme.shape.borderRadius}px`,
                                      borderLeft: `3px solid ${alpha(
                                        theme.palette.secondary.main,
                                        0.3
                                      )}`,
                                    }}
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
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Subtotal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(data.subtotal)}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      Pajak
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(data.tax)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 400 }}>
                    Total Keseluruhan
                  </Typography>
                  <Typography
                    variant="h6"
                    color="secondary"
                    sx={{ fontWeight: 400 }}
                  >
                    {formatToIdr(data.total)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
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

export default OrderDetailDialog;
