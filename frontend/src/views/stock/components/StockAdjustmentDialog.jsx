/**
 * StockAdjustmentDialog - Dialog form untuk mencatat penyesuaian stok (adjustment).
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog penyesuaian stok
 */
import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getProducts } from "@api/productApi.js";
import { ProductType } from "@shared/constant";
import { useRecordAdjustmentMutation, useStockForm } from "@views/stock/hooks";
import { AsyncAutocomplete } from "@components";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockAdjustmentDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, setValue, reset } = useStockForm();

  const recordMutation = useRecordAdjustmentMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Penyesuaian stok berhasil dicatat",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      reset();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal mencatat penyesuaian stok",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = recordMutation.isPending;

  const onSubmit = useCallback(
    (formData) => {
      recordMutation.mutate({
        productId: formData.product?.id || formData.productId,
        quantity: Number(formData.quantity),
        note: formData.note,
      });
    },
    [recordMutation]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={handleClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Penyesuaian Stok
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <Controller
            name="product"
            control={control}
            rules={{ required: "Produk wajib dipilih" }}
            render={({ field, fieldState }) => (
              <AsyncAutocomplete
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  setValue("productId", val?.id || "");
                }}
                queryKey={["products-stock-adjust"]}
                fetchOptions={async (searchValue) => {
                  const res = await getProducts({
                    page: 1,
                    limit: 10,
                    search: searchValue,
                    type: ProductType.SPAREPART,
                  });
                  return res?.data || [];
                }}
                getOptionLabel={(o) => o?.name || ""}
                placeholder="Cari produk..."
                minSearch={2}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <Box key={key} component="li" {...rest}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {option.sku || "—"} • Stok: {option.stock ?? 0}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                slotProps={{
                  textField: {
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />

          <Controller
            name="quantity"
            control={control}
            rules={{ required: "Jumlah wajib diisi" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Jumlah Penyesuaian"
                type="number"
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  "Gunakan (+) untuk menambah, (−) untuk mengurangi"
                }
                placeholder="Contoh: 10 atau -5"
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="note"
            control={control}
            rules={{ required: "Catatan wajib diisi" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Catatan"
                multiline
                rows={2}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                placeholder="Alasan penyesuaian stok"
                disabled={isSubmitting}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isSubmitting}
          onClick={handleClose}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustmentDialog;