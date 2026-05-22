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

import { PaymentMethod, paymentMethodColorMap, paymentStatusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentDetailQuery } from "@views/payments/hooks";
import { CopyButton } from "@components";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
  </Stack>
);

const PaymentDetailDialog = ({ open, paymentId, onClose }) => {
  const theme = useTheme();
  const [itemsExpanded, setItemsExpanded] = useState(true);

  const { data: detailData, isLoading } = usePaymentDetailQuery(paymentId, open);

  const hasItems = detailData?.order?.items?.length > 0;

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
          fontWeight: 400,
        }}
      >
        Detail Pembayaran
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
            {/* Informasi Pembayaran */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Pembayaran
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Metode
                    </Typography>
                    <Chip
                      color={paymentMethodColorMap[detailData.method] || "default"}
                      label={PaymentMethod[detailData.method] || detailData.method}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Status
                    </Typography>
                    <Chip
                      color={paymentStatusColorMap[detailData.status] || "default"}
                      label={detailData.statusLabel}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Jumlah Dibayar
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.amountPaid)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kembalian
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.change)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Bayar
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.paidAt ? formatDateTime(detailData.paidAt) : "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Dibuat
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Detail Pesanan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      No. Order
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {detailData.order?.orderNumber || "—"}
                      </Typography>
                      <CopyButton text={detailData.order?.orderNumber} successMessage="No. Order disalin" />
                    </Stack>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kasir
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.order?.cashier?.fullName || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Pelanggan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.order?.customer?.name || "—"}
                    </Typography>
                  </Stack>
                  {detailData.order?.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Kendaraan
                      </Typography>
                      <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {detailData.order.vehicle.plateNumber}
                        </Typography>
                        <CopyButton text={detailData.order.vehicle.plateNumber} />
                      </Stack>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Pesanan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.order?.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Item Pesanan */}
            {hasItems && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  overflow: "hidden",
                }}
              >
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
                      Item Pesanan
                    </Typography>
                    <Chip
                      label={detailData.order?.items?.length || 0}
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
                      transform: itemsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={itemsExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={0}>
                      {detailData.order.items.map((item, index) => (
                        <Box key={index}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Stack sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" sx={{ gap: 1, alignItems: "center", mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                                  {item.productName}
                                </Typography>
                                {item.type && (
                                  <Chip
                                    label={item.type === "SERVICE" ? "Servis" : "Sparepart"}
                                    size="small"
                                    variant="outlined"
                                    color={item.type === "SERVICE" ? "secondary" : "warning"}
                                    sx={{ fontWeight: 400 }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                  {item.quantity} × {formatToIdr(item.unitPrice)}
                                </Typography>
                                {item.mechanics?.length > 0 && (
                                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                                    {item.mechanics.map((m) => m.name).join(", ")}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                              {formatToIdr(item.subtotal)}
                            </Typography>
                          </Stack>
                          {index < detailData.order.items.length - 1 && <Divider sx={{ my: 1.5 }} />}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Total */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Subtotal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.order?.subtotal)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Pajak
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.order?.tax)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body1" sx={{ fontWeight: 400 }}>
                    Total
                  </Typography>
                  <Typography variant="h6" color="secondary" sx={{ fontWeight: 400 }}>
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
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDetailDialog;