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
    <Skeleton variant="rounded" width="100%" height={240} sx={{ borderRadius: 2 }} />
    <Stack sx={{ gap: 2 }}>
      <Skeleton width="60%" height={28} />
      <Skeleton width="30%" height={20} />
    </Stack>
    <Grid container spacing={2}>
      {[...Array(4)].map((_, i) => (
        <Grid key={i} size={6}>
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  </Stack>
);

const ProductDetailDialog = ({ onClose, open, productId }) => {
  const theme = useTheme();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const { data: detailData, isLoading } = useProductDetailQuery(productId, open);

  const hasPriceHistory = detailData?.priceHistory?.length > 0;
  const margin = (detailData?.price || 0) - (detailData?.cost || 0);

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
        Detail Produk
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
            {/* Gambar Produk */}
            <Box
              sx={{
                width: "100%",
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.secondary.main, 0.04),
                borderRadius: `${theme.shape.borderRadius}px`,
                overflow: "hidden",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              }}
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
              
                  <Package size={48} strokeWidth={1.5} style={{ opacity: 0.2 }} />
             
             
              )}
            </Box>

            {/* Nama & Badges */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 400, mb: 0.5 }}>
                {detailData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mb: 1 }}>
                SKU: {detailData.sku || "—"}
              </Typography>
              <Stack direction="row" sx={{ gap: 1 }}>
                <Chip
                  color={productTypeColorMap[detailData.type] || "default"}
                  label={detailData.type === "SERVICE" ? "Servis" : "Sparepart"}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 400 }}
                />
                <Chip
                  color={detailData.isActive ? "success" : "default"}
                  label={detailData.isActive ? "Aktif" : "Nonaktif"}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 400 }}
                />
              </Stack>
            </Box>

            {/* Metrics Cards */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Harga Jual
                    </Typography>
                    <Typography variant="h6" color="secondary" sx={{ mt: 1, fontWeight: 400 }}>
                      {formatToIdr(detailData.price)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Harga Modal
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 400 }}>
                      {formatToIdr(detailData.cost)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Margin
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ mt: 1, fontWeight: 400 }}>
                      {formatToIdr(margin)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {detailData.type !== "SERVICE" ? "Stok" : "Tipe"}
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        detailData.type === "SERVICE"
                          ? "text.primary"
                          : detailData.stock > 0
                          ? "text.primary"
                          : "error.main"
                      }
                      sx={{ mt: 1, fontWeight: 400 }}
                    >
                      {detailData.type === "SERVICE" ? "Layanan" : detailData.stock}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Deskripsi */}
            {detailData.description && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 400 }}>
                    Deskripsi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                    {detailData.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Informasi Tambahan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 400 }}>
                  Informasi
                </Typography>
                <Stack sx={{ gap: 0.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Dibuat
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.createdAt)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Terakhir Diupdate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.updatedAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Riwayat Harga */}
            {hasPriceHistory && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  overflow: "hidden",
                }}
              >
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
                  <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                      Riwayat Harga
                    </Typography>
                    <Chip
                      label={detailData.priceHistory.length}
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
                      transform: historyExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={0}>
                      {detailData.priceHistory.map((history, index) => (
                        <Box key={history.id}>
                          <Box
                            sx={{
                              pl: 2.5,
                              borderLeft: 2,
                              borderColor: alpha(theme.palette.secondary.main, 0.4),
                              py: 1.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {formatToIdr(history.price)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                              Modal: {formatToIdr(history.cost)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                              {formatDateTime(history.effectiveFrom)}
                            </Typography>
                          </Box>
                          {index < detailData.priceHistory.length - 1 && <Divider />}
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
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailDialog;