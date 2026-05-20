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
} from "@mui/material";

import { formatToIdr, formatDateTime, normalizeEnumText } from "@shared/utils";
import { useStockMovementDetailQuery } from "@views/stock/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const StockMovementDetailDialog = ({ open, movementId, onClose }) => {
  const { data: detailData, isLoading } = useStockMovementDetailQuery(movementId, open);

  const isIn = detailData?.type === "IN";
  const isOut = detailData?.type === "OUT";

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
            {/* Movement Info */}
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Stack sx={{ alignItems: "center", gap: 1 }}>
                  <Chip
                    label={normalizeEnumText(detailData.type)}
                    color={isIn ? "success" : isOut ? "error" : "warning"}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="h4" fontWeight={700}>
                    {detailData.quantity > 0 ? "+" : ""}
                    {detailData.quantity}
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Mutasi
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Sumber</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {normalizeEnumText(detailData.sourceType)}
                    </Typography>
                  </Stack>
                  {detailData.note && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Catatan</Typography>
                      <Typography variant="body2" fontWeight={500}>{detailData.note}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Produk */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Produk
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Nama</Typography>
                    <Typography variant="body2" fontWeight={600}>{detailData.product?.name || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">SKU</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailData.product?.sku || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Stok Saat Ini</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailData.product?.stock ?? 0}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Harga</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatToIdr(detailData.product?.price || 0)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Dicatat Oleh */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Dicatat Oleh
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Nama</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {detailData.recordedBy?.fullName || "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {detailData.recordedBy?.role || "—"}
                    </Typography>
                  </Stack>
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