/**
 * StockMovementDetailDialog - Dialog detail untuk menampilkan informasi lengkap mutasi stok.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.movementId - ID Mutasi stok untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail mutasi stok
 */
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

import { formatToIdr, formatDateTime } from "@shared/utils";
import { useStockMovementDetailQuery } from "@views/stock/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
  </Stack>
);

const StockMovementDetailDialog = ({ open, movementId, onClose }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useStockMovementDetailQuery(movementId, open);

  const isIn = detailData?.type === "IN";
  const isOut = detailData?.type === "OUT";
  const hasOrder = !!detailData?.orderItem?.order;

  const movementColor = isIn
    ? theme.palette.success.main
    : isOut
    ? theme.palette.error.main
    : theme.palette.warning.main;

  const getSourceLabel = (sourceType) => {
    const labels = {
      SALE: "Penjualan",
      PURCHASE: "Pembelian",
      MANUAL: "Manual",
      RETURN: "Retur",
      ADJUSTMENT: "Penyesuaian",
    };
    return labels[sourceType] || sourceType || "—";
  };

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
        Detail Mutasi Stok
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
            {/* Movement Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(movementColor, 0.2)}`,
                bgcolor: alpha(movementColor, 0.03),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Stack sx={{ alignItems: "center", gap: 1 }}>
                  <Chip
                    label={isIn ? "Masuk" : isOut ? "Keluar" : "Penyesuaian"}
                    color={isIn ? "success" : isOut ? "error" : "warning"}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 400 }}
                  />
                  <Typography variant="h4" color={movementColor} sx={{ fontWeight: 400 }}>
                    {isIn ? "+" : ""}{detailData.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                    {formatDateTime(detailData.createdAt)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Mutasi */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Mutasi
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tipe
                    </Typography>
                    <Chip
                      label={isIn ? "Masuk" : isOut ? "Keluar" : "Penyesuaian"}
                      color={isIn ? "success" : isOut ? "error" : "warning"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Sumber
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {getSourceLabel(detailData.sourceType)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Jumlah
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.quantity}
                    </Typography>
                  </Stack>
                  {detailData.note && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Catatan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, textAlign: "right", maxWidth: "60%" }}>
                        {detailData.note}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Produk */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Produk
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Nama
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, textAlign: "right", maxWidth: "60%" }}>
                      {detailData.product?.name || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      SKU
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.product?.sku || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Stok Saat Ini
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.product?.stock ?? 0}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Harga
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.product?.price || 0)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Order Info */}
            {hasOrder && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.02),
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                    Pesanan Terkait
                  </Typography>
                  <Stack sx={{ gap: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        No. Order
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {detailData.orderItem.order.orderNumber}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Produk
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, textAlign: "right", maxWidth: "60%" }}>
                        {detailData.orderItem.productName}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Qty × Harga
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {detailData.orderItem.quantity} × {formatToIdr(detailData.orderItem.unitPrice)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Subtotal
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {formatToIdr(detailData.orderItem.subtotal)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Dicatat Oleh */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Dicatat Oleh
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Nama
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.recordedBy?.fullName || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Role
                    </Typography>
                    <Chip
                      label={detailData.recordedBy?.role || "—"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
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

export default StockMovementDetailDialog;