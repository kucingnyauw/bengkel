/**
 * ExpenseFormDialog - Dialog form untuk membuat dan mengupdate pengeluaran dengan upload bukti.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} props.mode - Mode form ("create" atau "update")
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} [props.selectedExpense] - Data pengeluaran untuk mode update
 * @param {string|number} [props.selectedExpense.id] - ID pengeluaran
 * @param {string} [props.selectedExpense.title] - Judul pengeluaran
 * @param {number} [props.selectedExpense.amount] - Jumlah pengeluaran
 * @param {string} [props.selectedExpense.category] - Kategori pengeluaran
 * @param {string} [props.selectedExpense.description] - Deskripsi pengeluaran
 * @param {Object} [props.selectedExpense.receipt] - Bukti pembayaran
 * @param {string} [props.selectedExpense.receipt.fileUrl] - URL bukti
 *
 * @returns {JSX.Element} Dialog form pengeluaran
 */
import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Upload, X } from "lucide-react";
import { Controller } from "react-hook-form";
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

import { ExpenseCategory } from "@shared/constant";
import { formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useExpenseForm,
} from "@views/expenses/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ExpenseFormDialog = ({ mode, onClose, open, selectedExpense }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useExpenseForm();

  const receipt = watch("receipt");

  const createMutation = useCreateExpenseMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Pengeluaran berhasil dicatat",
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
          message: error.message || "Gagal mencatat pengeluaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const updateMutation = useUpdateExpenseMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Pengeluaran berhasil diperbarui",
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
          message: error.message || "Gagal memperbarui pengeluaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleClose = useCallback(() => {
    reset();
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose?.();
  }, [reset, receiptPreview, onClose]);

  useEffect(() => {
    if (open) {
      if (mode === "update" && selectedExpense) {
        reset({
          title: selectedExpense.title || "",
          amount: selectedExpense.amount || "",
          category: selectedExpense.category || "OTHER",
          description: selectedExpense.description || "",
          receipt: null,
        });
        if (selectedExpense.receipt?.fileUrl) {
          setReceiptPreview(selectedExpense.receipt.fileUrl);
        } else {
          setReceiptPreview(null);
        }
      } else {
        reset({
          title: "",
          amount: "",
          category: "OTHER",
          description: "",
          receipt: null,
        });
        setReceiptPreview(null);
      }
    }
  }, [open, mode, selectedExpense, reset]);

  const onSubmit = useCallback(
    (formData) => {
      if (mode === "create") {
        createMutation.mutate(formData);
      } else if (selectedExpense?.id) {
        updateMutation.mutate({ id: selectedExpense.id, formData });
      }
    },
    [mode, selectedExpense, createMutation, updateMutation]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (receiptPreview) {
          URL.revokeObjectURL(receiptPreview);
        }
        setReceiptPreview(URL.createObjectURL(file));
        setValue("receipt", file, { shouldDirty: true });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [receiptPreview, setValue]
  );

  const handleClearReceipt = useCallback(() => {
    if (receiptPreview && !selectedExpense?.receipt?.fileUrl) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptPreview(null);
    setValue("receipt", null, { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [receiptPreview, selectedExpense, setValue]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={handleClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {mode === "create" ? "Catat Pengeluaran" : "Edit Pengeluaran"}
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <Controller
            control={control}
            name="title"
            rules={{ required: "Judul wajib diisi" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                autoFocus
                label="Judul"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                placeholder="Masukkan judul pengeluaran"
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            rules={{
              required: "Jumlah wajib diisi",
              min: { value: 1, message: "Minimal Rp 1" },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Jumlah"
                placeholder="Rp 0"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                value={field.value ? formatToIdr(field.value) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  field.onChange(raw ? Number(raw) : "");
                }}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <FormControl disabled={isSubmitting}>
                <InputLabel>Kategori</InputLabel>
                <Select {...field} label="Kategori">
                  {Object.entries(ExpenseCategory).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {normalizeEnumText(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                {...field}
                label="Deskripsi"
                placeholder="Deskripsi (opsional)"
                multiline
                rows={2}
                disabled={isSubmitting}
              />
            )}
          />

          {/* Receipt Upload */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Bukti Pembayaran (Opsional)
            </Typography>

            {receiptPreview ? (
              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                  position: "relative",
                }}
              >
                <IconButton
                  onClick={handleClearReceipt}
                  size="small"
                  disabled={isSubmitting}
                  sx={{
                    position: "absolute",
                    right: 4,
                    top: 4,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                  }}
                >
                  <X size={14} />
                </IconButton>
                <Box
                  component="img"
                  alt="Preview"
                  src={receiptPreview}
                  sx={{
                    display: "block",
                    maxHeight: 160,
                    objectFit: "contain",
                    width: "100%",
                    borderRadius: 0.5,
                  }}
                />
              </Box>
            ) : (
              <Box
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                sx={{
                  p: 3,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  bgcolor: "action.hover",
                  transition: (theme) =>
                    theme.transitions.create(["border-color", "background-color"]),
                  "&:hover": {
                    borderColor: isSubmitting ? "divider" : "text.primary",
                    bgcolor: isSubmitting ? "action.hover" : "action.selected",
                  },
                }}
              >
                <Upload size={24} style={{ opacity: 0.3 }} />
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Klik untuk unggah bukti
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    JPG, PNG, atau WEBP
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
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
          disabled={isSubmitting || (mode === "update" && !isDirty)}
          startIcon={
            isSubmitting ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {isSubmitting
            ? "Menyimpan..."
            : mode === "create"
            ? "Simpan"
            : "Update"}
        </Button>
      </DialogActions>

      <input
        accept="image/*"
        hidden
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
        disabled={isSubmitting}
      />
    </Dialog>
  );
};

export default ExpenseFormDialog;