/**
 * ProductDetailDialog - Dialog detail untuk menampilkan informasi lengkap produk termasuk riwayat harga.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.productId - ID Produk untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail produk
 */
import { useState } from "react";
import { ChevronDown, Package, X } from "lucide-react";

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
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { productTypeColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { useProductDetailQuery } from "@views/products/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" width="100%" height={240} />
    <Stack sx={{ gap: 2 }}>
      <Skeleton width="60%" height={28} />
      <Skeleton width="30%" height={20} />
    </Stack>
    <Grid container spacing={2}>
      {[...Array(4)].map((_, i) => (
        <Grid key={i} size={6}>
          <Skeleton variant="rounded" height={80} />
        </Grid>
      ))}
    </Grid>
  </Stack>
);

const MetricCard = ({ label, value, valueColor }) => (
  <Card>
    <CardContent
      sx={(theme) => ({
        textAlign: "center",
        py: theme.spacing(2.5),
        "&:last-child": { pb: theme.spacing(2.5) },
      })}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        color={valueColor || "text.primary"}
        sx={{ mt: 1 }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const ProductDetailDialog = ({ onClose, open, productId }) => {
  const theme = useTheme();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const { data: detailData, isLoading } = useProductDetailQuery(
    productId,
    open
  );

  const hasPriceHistory = detailData?.priceHistory?.length > 0;
  const margin = (detailData?.price || 0) - (detailData?.cost || 0);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Produk
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
            {/* Gambar Produk */}
            <Box
              sx={(theme) => ({
                width: "100%",
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.secondary.main, 0.04),
                borderRadius: `${theme.shape.borderRadius}px`,
                overflow: "hidden",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              })}
            >
              {detailData.image?.url ? (
                <Box
                  component="img"
                  src={detailData.image.url}
                  alt={detailData.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Package
                  size={48}
                  strokeWidth={1.5}
                  style={{ opacity: 0.2 }}
                />
              )}
            </Box>

            {/* Nama & Badges */}
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {detailData.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: theme.spacing(1) }}
              >
                SKU: {detailData.sku || "—"}
              </Typography>
              <Stack direction="row" sx={{ gap: theme.spacing(1) }}>
                <Chip
                  color={productTypeColorMap[detailData.type] || "default"}
                  label={
                    detailData.type === "SERVICE" ? "Servis" : "Sparepart"
                  }
                  size="small"
                  variant="outlined"
                />
                <Chip
                  color={detailData.isActive ? "success" : "default"}
                  label={detailData.isActive ? "Aktif" : "Nonaktif"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>

            {/* Metrics Cards */}
            <Grid container spacing={theme.spacing(2)}>
              <Grid size={6}>
                <MetricCard
                  label="Harga Jual"
                  value={formatToIdr(detailData.price)}
                  valueColor="secondary"
                />
              </Grid>
              <Grid size={6}>
                <MetricCard
                  label="Harga Modal"
                  value={formatToIdr(detailData.cost)}
                />
              </Grid>
              <Grid size={6}>
                <MetricCard
                  label="Margin"
                  value={formatToIdr(margin)}
                  valueColor="success.main"
                />
              </Grid>
              <Grid size={6}>
                <MetricCard
                  label={
                    detailData.type !== "SERVICE" ? "Stok" : "Tipe"
                  }
                  value={
                    detailData.type === "SERVICE"
                      ? "Layanan"
                      : detailData.stock
                  }
                  valueColor={
                    detailData.type === "SERVICE"
                      ? "text.primary"
                      : detailData.stock > 0
                      ? "text.primary"
                      : "error.main"
                  }
                />
              </Grid>
            </Grid>

            {/* Deskripsi */}
            {detailData.description && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(1) }}>
                    Deskripsi
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {detailData.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Informasi Tambahan */}
            <Card>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: theme.spacing(1.5) }}
                >
                  Informasi
                </Typography>
                <Stack sx={{ gap: theme.spacing(0.5) }}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      py: theme.spacing(0.5),
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tanggal Dibuat
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      py: theme.spacing(0.5),
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Terakhir Diupdate
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailData.updatedAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Riwayat Harga */}
            {hasPriceHistory && (
              <Card>
                <Box
                  onClick={() => setHistoryExpanded(!historyExpanded)}
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
                  <Stack
                    direction="row"
                    sx={{ gap: theme.spacing(1.5), alignItems: "center" }}
                  >
                    <Typography variant="subtitle1">
                      Riwayat Harga
                    </Typography>
                    <Chip
                      label={detailData.priceHistory.length}
                      size="small"
                      variant="outlined"
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
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack spacing={0}>
                      {detailData.priceHistory.map((history, index) => (
                        <Box key={history.id}>
                          <Box
                            sx={(theme) => ({
                              pl: theme.spacing(2.5),
                              borderLeft: 2,
                              borderColor: alpha(
                                theme.palette.secondary.main,
                                0.4
                              ),
                              py: theme.spacing(1.5),
                            })}
                          >
                            <Typography variant="body2">
                              {formatToIdr(history.price)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Modal: {formatToIdr(history.cost)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                            >
                              {formatDateTime(history.effectiveFrom)}
                            </Typography>
                          </Box>
                          {index < detailData.priceHistory.length - 1 && (
                            <Divider />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}
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

export default ProductDetailDialog;