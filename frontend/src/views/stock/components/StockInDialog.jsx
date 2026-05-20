/**
 * StockInDialog - Dialog form untuk mencatat stok masuk.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog stok masuk
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getProducts } from "@api/productApi.js";
import { StockSourceType, ProductType } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";
import { useRecordStockInMutation, useStockForm } from "@views/stock/hooks";
import { AsyncAutocomplete } from "@components";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockInDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, setValue, reset } = useStockForm();

  const recordMutation = useRecordStockInMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Stok masuk berhasil dicatat",
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
          message: error.message || "Gagal mencatat stok masuk",
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
        note: formData.note || undefined,
        sourceType: formData.sourceType,
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
        Stok Masuk
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
                queryKey={["products-stock-in"]}
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
            rules={{
              required: "Jumlah wajib diisi",
              min: { value: 1, message: "Minimal 1" },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Jumlah"
                type="number"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={isSubmitting}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            )}
          />

          <Controller
            name="sourceType"
            control={control}
            render={({ field }) => (
              <FormControl disabled={isSubmitting}>
                <InputLabel>Sumber</InputLabel>
                <Select {...field} label="Sumber">
                  {Object.entries(StockSourceType).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {normalizeEnumText(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Catatan"
                placeholder="Catatan (opsional)"
                multiline
                rows={2}
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

export default StockInDialog;