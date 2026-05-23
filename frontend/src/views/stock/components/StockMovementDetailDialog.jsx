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
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const DetailRow = ({ label, value, endAction }) => {
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
          <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "60%" }}>
            {value}
          </Typography>
        )}
        {endAction}
      </Stack>
    </Stack>
  );
};

const StockMovementDetailDialog = ({ open, movementId, onClose }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useStockMovementDetailQuery(
    movementId,
    open
  );

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

  const getMovementLabel = () => {
    if (isIn) return "Masuk";
    if (isOut) return "Keluar";
    return "Penyesuaian";
  };

  const getMovementColor = () => {
    if (isIn) return "success";
    if (isOut) return "error";
    return "warning";
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Mutasi Stok
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
            {/* Movement Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(movementColor, 0.2)}`,
                bgcolor: alpha(movementColor, 0.03),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: theme.spacing(3) }}>
                <Stack sx={{ alignItems: "center", gap: theme.spacing(1) }}>
                  <Chip
                    label={getMovementLabel()}
                    color={getMovementColor()}
                    size="small"
                    variant="soft"
                  />
                  <Typography variant="h4" color={movementColor}>
                    {isIn ? "+" : ""}{detailData.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(detailData.createdAt)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Mutasi */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Mutasi
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Tipe"
                    value={
                      <Chip
                        label={getMovementLabel()}
                        color={getMovementColor()}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Sumber"
                    value={getSourceLabel(detailData.sourceType)}
                  />
                  <DetailRow label="Jumlah" value={detailData.quantity} />
                  {detailData.note && (
                    <DetailRow label="Catatan" value={detailData.note} />
                  )}
                  <DetailRow
                    label="Tanggal"
                    value={formatDateTime(detailData.createdAt)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Produk */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Produk
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Nama"
                    value={detailData.product?.name || "—"}
                  />
                  <DetailRow
                    label="SKU"
                    value={detailData.product?.sku || "—"}
                  />
                  <DetailRow
                    label="Stok Saat Ini"
                    value={detailData.product?.stock ?? 0}
                  />
                  <DetailRow
                    label="Harga"
                    value={formatToIdr(detailData.product?.price || 0)}
                  />
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
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                    Pesanan Terkait
                  </Typography>
                  <Stack sx={{ gap: theme.spacing(1.5) }}>
                    <DetailRow
                      label="No. Order"
                      value={detailData.orderItem.order.orderNumber}
                    />
                    <DetailRow
                      label="Produk"
                      value={detailData.orderItem.productName}
                    />
                    <DetailRow
                      label="Qty × Harga"
                      value={`${detailData.orderItem.quantity} × ${formatToIdr(detailData.orderItem.unitPrice)}`}
                    />
                    <DetailRow
                      label="Subtotal"
                      value={formatToIdr(detailData.orderItem.subtotal)}
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Dicatat Oleh */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Dicatat Oleh
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="Nama"
                    value={detailData.recordedBy?.fullName || "—"}
                  />
                  <DetailRow
                    label="Role"
                    value={
                      <Chip
                        label={detailData.recordedBy?.role || "—"}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
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

export default StockMovementDetailDialog;