/**
 * ExpenseDetailDialog - Dialog detail untuk menampilkan informasi lengkap pengeluaran termasuk bukti pembayaran.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.expense - Data pengeluaran
 * @param {string|number} props.expense.id - ID pengeluaran
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail pengeluaran
 */
import { Receipt, X } from "lucide-react";

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

import { expenseCategoryColorMap, ExpenseCategory } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useExpenseDetailQuery } from "@views/expenses/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useExpenseDetailQuery(expense?.id, open);

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
        Detail Pengeluaran
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
            {/* Informasi Pengeluaran */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Pengeluaran
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Judul
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.title}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Jumlah
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 400 }}>
                      -{formatToIdr(detailData.amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kategori
                    </Typography>
                    <Chip
                      color={expenseCategoryColorMap[detailData.category] || "default"}
                      label={normalizeEnumText(
                        ExpenseCategory[detailData.category] || detailData.category
                      )}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(detailData.date)}
                    </Typography>
                  </Stack>
                  {detailData.description && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Deskripsi
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {detailData.description}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Bukti Pembayaran */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                  Bukti Pembayaran
                </Typography>
              </Box>
              <Divider />
              {detailData.receipt?.url ? (
                <Box sx={{ p: 2 }}>
                  <Box
                    component="img"
                    alt="Bukti Pembayaran"
                    src={detailData.receipt.url}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: 300,
                      objectFit: "cover",
                      borderRadius: `${theme.shape.borderRadius}px`,
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    gap: 1.5,
                    bgcolor: alpha(theme.palette.secondary.main, 0.02),
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Receipt size={24} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Tidak ada bukti pembayaran
                  </Typography>
                </Box>
              )}
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

export default ExpenseDetailDialog;