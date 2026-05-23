/**
 * StockDeleteDialog - Dialog konfirmasi untuk menghapus mutasi stok.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.movement - Data mutasi stok yang akan dihapus
 * @param {string|number} props.movement.id - ID mutasi stok
 * @param {Object} [props.movement.product] - Data produk
 * @param {string} [props.movement.product.name] - Nama produk
 * @param {string} [props.movement.type] - Tipe mutasi
 * @param {number} [props.movement.quantity] - Jumlah
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog konfirmasi hapus mutasi stok
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useDeleteStockMovementMutation } from "@views/stock/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockDeleteDialog = ({ open, movement, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const deleteMutation = useDeleteStockMovementMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Mutasi stok berhasil dihapus",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal menghapus mutasi stok",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = deleteMutation.isPending;
  const isIn = movement?.type === "IN";

  const handleConfirm = () => {
    if (!movement) return;
    deleteMutation.mutate(movement.id);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isPending ? undefined : onClose}
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
        Hapus Mutasi Stok
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Apakah Anda yakin ingin menghapus mutasi stok berikut? Tindakan ini tidak dapat dibatalkan.
          </Typography>

          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Stack sx={{ gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Produk
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.3 }}>
                    {movement?.product?.name || "—"}
                  </Typography>
                </Box>

                <Stack direction="row" sx={{ gap: 1 }}>
                  <Chip
                    label={isIn ? "Masuk" : movement?.type === "OUT" ? "Keluar" : "Penyesuaian"}
                    color={isIn ? "success" : movement?.type === "OUT" ? "error" : "warning"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 400 }}
                  />
                  <Chip
                    label={`Qty: ${movement?.quantity || 0}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 400 }}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isPending}
          onClick={onClose}
          sx={{ fontWeight: 400 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{ fontWeight: 400 }}
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockDeleteDialog;