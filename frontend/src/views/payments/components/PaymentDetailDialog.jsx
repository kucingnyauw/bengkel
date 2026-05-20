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
} from "@mui/material";

import { PaymentMethod, paymentMethodColorMap, paymentStatusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentDetailQuery } from "@views/payments/hooks";
import { CopyButton } from "@components";

/**
 * DetailSkeleton - Skeleton loading untuk dialog detail pembayaran.
 */
const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={100} />
  </Stack>
);

const PaymentDetailDialog = ({ open, paymentId, onClose }) => {
  const [itemsExpanded, setItemsExpanded] = useState(true);

  const { data: detailData, isLoading } = usePaymentDetailQuery(paymentId, open);

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
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack spacing={3}>
            {/* Informasi Pembayaran */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Pembayaran
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Metode</Typography>
                    <Chip
                      color={paymentMethodColorMap[detailData.method] || "default"}
                      label={PaymentMethod[detailData.method] || detailData.method}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      color={paymentStatusColorMap[detailData.status] || "default"}
                      label={detailData.statusLabel}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah Dibayar</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatToIdr(detailData.amountPaid)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kembalian</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatToIdr(detailData.change)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Bayar</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {detailData.paidAt ? formatDateTime(detailData.paidAt) : "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Dibuat</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Detail Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Detail Pesanan
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">No. Order</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {detailData.order?.orderNumber || "—"}
                      </Typography>
                      <CopyButton text={detailData.order?.orderNumber} successMessage="No. Order disalin" />
                    </Stack>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kasir</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailData.order?.cashier?.fullName || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailData.order?.customer?.name || "—"}</Typography>
                  </Stack>
                  {detailData.order?.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Kendaraan</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Typography variant="body2" fontWeight={500}>
                          {detailData.order.vehicle.plateNumber}
                        </Typography>
                        <CopyButton text={detailData.order.vehicle.plateNumber} />
                      </Stack>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Pesanan</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(detailData.order?.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Item Pesanan */}
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
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Item Pesanan
                    </Typography>
                    <Chip label={detailData.order?.items?.length || 0} size="small" variant="outlined" />
                  </Stack>
                  <ChevronDown
                    size={18}
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
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {item.productName}
                                </Typography>
                                {item.type && (
                                  <Chip
                                    label={item.type === "SERVICE" ? "Jasa" : "Sparepart"}
                                    size="small"
                                    variant="outlined"
                                    color={item.type === "SERVICE" ? "info" : "warning"}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                  {item.quantity} × {formatToIdr(item.unitPrice)}
                                </Typography>
                                {item.mechanics?.length > 0 && (
                                  <Typography variant="caption" color="text.disabled">
                                    {item.mechanics.map((m) => m.name).join(", ")}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                            <Typography variant="body2" fontWeight={600} noWrap>
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
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatToIdr(detailData.order?.subtotal)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pajak</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatToIdr(detailData.order?.tax)}</Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body1" fontWeight={600}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
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