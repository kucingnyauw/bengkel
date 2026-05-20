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

import { expenseCategoryColorMap, ExpenseCategory } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useExpenseDetailQuery } from "@views/expenses/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const { data: detailData, isLoading } = useExpenseDetailQuery(expense?.id, open);

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
            {/* Informasi Pengeluaran */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Pengeluaran
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Judul</Typography>
                    <Typography variant="body2" fontWeight={600}>{detailData.title}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatToIdr(detailData.amount)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Kategori</Typography>
                    <Chip
                      color={expenseCategoryColorMap[detailData.category] || "default"}
                      label={normalizeEnumText(
                        ExpenseCategory[detailData.category] || detailData.category
                      )}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(detailData.date)}</Typography>
                  </Stack>
                  {detailData.description && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Deskripsi</Typography>
                      <Typography variant="body2" fontWeight={500}>{detailData.description}</Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Bukti Pembayaran */}
            {detailData.receipt?.url && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Bukti Pembayaran
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      component="img"
                      alt="Bukti Pembayaran"
                      src={detailData.receipt.url}
                      sx={{
                        display: "block",
                        width: "100%",
                        maxHeight: 320,
                        objectFit: "contain",
                        bgcolor: "action.hover",
                      }}
                    />
                  </Box>
                </CardContent>
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

export default ExpenseDetailDialog;