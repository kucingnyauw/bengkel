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
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const DetailRow = ({ label, value, endAction }) => (
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
    {endAction ? (
      <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
        <Typography variant="body2">{value}</Typography>
        {endAction}
      </Stack>
    ) : (
      <Typography variant="body2">{value}</Typography>
    )}
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useExpenseDetailQuery(
    expense?.id,
    open
  );

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Pengeluaran
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
            {/* Informasi Pengeluaran */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Pengeluaran
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow label="Judul" value={detailData.title} />
                  <DetailRow
                    label="Jumlah"
                    value={`-${formatToIdr(detailData.amount)}`}
                    valueSx={{ color: "error.main" }}
                  />
                  <DetailRow
                    label="Kategori"
                    value={
                      <Chip
                        color={
                          expenseCategoryColorMap[detailData.category] ||
                          "default"
                        }
                        label={normalizeEnumText(
                          ExpenseCategory[detailData.category] ||
                            detailData.category
                        )}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Tanggal"
                    value={formatDateTime(detailData.date)}
                  />
                  {detailData.description && (
                    <DetailRow
                      label="Deskripsi"
                      value={detailData.description}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Bukti Pembayaran */}
            <Card>
              <Box sx={{ px: theme.spacing(2.5), py: theme.spacing(2) }}>
                <Typography variant="subtitle2">
                  Bukti Pembayaran
                </Typography>
              </Box>
              <Divider />
              {detailData.receipt?.url ? (
                <Box sx={{ p: theme.spacing(2) }}>
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
                    py: theme.spacing(8),
                    gap: theme.spacing(1.5),
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
                    <Receipt
                      size={24}
                      strokeWidth={1.5}
                      style={{ opacity: 0.3 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
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
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDetailDialog;