/**
 * PaymentDetailDialog - Dialog detail untuk menampilkan informasi lengkap pembayaran termasuk detail pesanan dan item.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.paymentId - ID Pembayaran untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail pembayaran
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
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  PaymentMethod,
  paymentMethodColorMap,
  paymentStatusColorMap,
} from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentDetailQuery } from "@views/payments/hooks";
import { CopyButton } from "@components";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={100} />
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

const PaymentDetailDialog = ({ open, paymentId, onClose }) => {
  const theme = useTheme();
  const [itemsExpanded, setItemsExpanded] = useState(true);

  const { data: detailData, isLoading } = usePaymentDetailQuery(
    paymentId,
    open
  );

  const hasItems = detailData?.order?.items?.length > 0;

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Pembayaran
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
            {/* Informasi Pembayaran */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Pembayaran
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Metode"
                    value={
                      <Chip
                        color={
                          paymentMethodColorMap[detailData.method] || "default"
                        }
                        label={
                          PaymentMethod[detailData.method] || detailData.method
                        }
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <Chip
                        color={
                          paymentStatusColorMap[detailData.status] || "default"
                        }
                        label={detailData.statusLabel}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Jumlah Dibayar"
                    value={formatToIdr(detailData.amountPaid)}
                  />
                  <DetailRow
                    label="Kembalian"
                    value={formatToIdr(detailData.change)}
                  />
                  <DetailRow
                    label="Tanggal Bayar"
                    value={
                      detailData.paidAt
                        ? formatDateTime(detailData.paidAt)
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Tanggal Dibuat"
                    value={formatDateTime(detailData.createdAt)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Detail Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="No. Order"
                    value={detailData.order?.orderNumber || "—"}
                    endAction={
                      <CopyButton
                        text={detailData.order?.orderNumber}
                        successMessage="No. Order disalin"
                      />
                    }
                  />
                  <DetailRow
                    label="Kasir"
                    value={detailData.order?.cashier?.fullName || "—"}
                  />
                  <DetailRow
                    label="Pelanggan"
                    value={detailData.order?.customer?.name || "—"}
                  />
                  {detailData.order?.vehicle && (
                    <DetailRow
                      label="Kendaraan"
                      value={detailData.order.vehicle.plateNumber}
                      endAction={
                        <CopyButton
                          text={detailData.order.vehicle.plateNumber}
                        />
                      }
                    />
                  )}
                  <DetailRow
                    label="Tanggal Pesanan"
                    value={formatDateTime(detailData.order?.createdAt)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Item Pesanan */}
            {hasItems && (
              <Card>
                <SectionHeader
                  title="Item Pesanan"
                  count={detailData.order?.items?.length || 0}
                  expanded={itemsExpanded}
                  onToggle={() => setItemsExpanded(!itemsExpanded)}
                />

                <Collapse in={itemsExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack spacing={0}>
                      {detailData.order.items.map((item, index) => (
                        <Box key={index}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Stack sx={{ minWidth: 0, flex: 1 }}>
                              <Stack
                                direction="row"
                                sx={{
                                  gap: 1,
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Typography variant="body2" noWrap>
                                  {item.productName}
                                </Typography>
                                {item.type && (
                                  <Chip
                                    label={
                                      item.type === "SERVICE"
                                        ? "Servis"
                                        : "Sparepart"
                                    }
                                    size="small"
                                    variant="outlined"
                                    color={
                                      item.type === "SERVICE"
                                        ? "secondary"
                                        : "warning"
                                    }
                                  />
                                )}
                              </Stack>
                              <Stack
                                direction="row"
                                sx={{ gap: theme.spacing(2), alignItems: "center" }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {item.quantity} × {formatToIdr(item.unitPrice)}
                                </Typography>
                                {item.mechanics?.length > 0 && (
                                  <Typography variant="caption" color="text.disabled">
                                    {item.mechanics
                                      .map((m) => m.name)
                                      .join(", ")}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                            <Typography variant="body2" noWrap>
                              {formatToIdr(item.subtotal)}
                            </Typography>
                          </Stack>
                          {index < detailData.order.items.length - 1 && (
                            <Divider sx={{ my: theme.spacing(1.5) }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Total */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Subtotal"
                    value={formatToIdr(detailData.order?.subtotal)}
                  />
                  <DetailRow
                    label="Pajak"
                    value={formatToIdr(detailData.order?.tax)}
                  />
                </Stack>

                <Divider sx={{ my: theme.spacing(2) }} />

                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body1">Total</Typography>
                  <Typography variant="h6" color="secondary">
                    {formatToIdr(detailData.order?.total)}
                  </Typography>
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

export default PaymentDetailDialog;