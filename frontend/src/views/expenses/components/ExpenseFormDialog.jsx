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
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { ExpenseCategory } from "@shared/constant";
import { formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useExpenseForm,
} from "@views/expenses/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ExpenseFormDialog = ({ mode, onClose, open, selectedExpense }) => {
  const theme = useTheme();
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

  const createMutation = useCreateExpenseMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pengeluaran "${data?.title || "baru"}" berhasil dicatat`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose?.();
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal mencatat pengeluaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const updateMutation = useUpdateExpenseMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pengeluaran "${data?.title || "baru"}" berhasil diperbarui`,
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
          message: error?.message || "Gagal memperbarui pengeluaran",
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
    if (receiptPreview && !selectedExpense?.receipt?.fileUrl) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose?.();
  }, [reset, receiptPreview, selectedExpense, onClose]);

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
        if (receiptPreview && !selectedExpense?.receipt?.fileUrl) {
          URL.revokeObjectURL(receiptPreview);
        }
        setReceiptPreview(URL.createObjectURL(file));
        setValue("receipt", file, { shouldDirty: true });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [receiptPreview, selectedExpense, setValue]
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
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={isSubmitting ? undefined : handleClose}
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
          fontWeight : 500
        }}
      >
        {mode === "create" ? "Catat Pengeluaran" : "Edit Pengeluaran"}
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          {/* Judul - Full Width */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Controller
              control={control}
              name="title"
              rules={{ required: "Judul wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  label="Judul"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Masukkan judul pengeluaran"
                  disabled={isSubmitting}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                    formHelperText: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
          </Box>

          {/* Jumlah */}
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
                fullWidth
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
                slotProps={{
                  input: { sx: { fontWeight: 400 } },
                  inputLabel: { sx: { fontWeight: 400 } },
                  formHelperText: { sx: { fontWeight: 400 } },
                }}
              />
            )}
          />

          {/* Kategori */}
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <FormControl fullWidth disabled={isSubmitting}>
                <InputLabel sx={{ fontWeight: 400 }}>Kategori</InputLabel>
                <Select {...field} label="Kategori" sx={{ fontWeight: 400 }}>
                  {Object.entries(ExpenseCategory).map(([key, value]) => (
                    <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                      {normalizeEnumText(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          {/* Deskripsi - Full Width */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Deskripsi"
                  placeholder="Deskripsi (opsional)"
                  multiline
                  rows={2}
                  disabled={isSubmitting}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
          </Box>

          {/* Receipt Upload - Full Width */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            {receiptPreview ? (
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  borderRadius: `${theme.shape.borderRadius}px`,
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
                    borderRadius: `${theme.shape.borderRadius}px`,
                    boxShadow: `0 1px 4px ${alpha(
                      theme.palette.common.black,
                      0.1
                    )}`,
                  }}
                >
                  <X size={14} strokeWidth={1.5} />
                </IconButton>
                <Box
                  component="img"
                  alt="Preview"
                  src={receiptPreview}
                  sx={{
                    display: "block",
                    height: 300,
                    objectFit: "cover",
                    width: "100%",
                    borderRadius: `${theme.shape.borderRadius}px`,
                  }}
                />
              </Box>
            ) : (
              <Box
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                sx={{
                  p: 2.5,
                  height: 300,
                  border: "2px dashed",
                  borderColor: alpha(theme.palette.divider, 0.6),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  bgcolor: alpha(theme.palette.secondary.main, 0.03),
                  transition: theme.transitions.create([
                    "border-color",
                    "background-color",
                  ]),
                  "&:hover": {
                    borderColor: isSubmitting
                      ? alpha(theme.palette.divider, 0.6)
                      : theme.palette.secondary.main,
                    bgcolor: isSubmitting
                      ? alpha(theme.palette.secondary.main, 0.03)
                      : alpha(theme.palette.secondary.main, 0.06),
                  },
                }}
              >
                <Upload size={20} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                <Box textAlign="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 400 }}
                  >
                    Klik untuk unggah bukti
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontWeight: 400 }}
                  >
                    JPG, PNG, atau WEBP
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isSubmitting}
          onClick={handleClose}
          sx={{ fontWeight: 400 }}
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
          sx={{
            fontWeight: 400,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(
                theme.palette.secondary.main,
                0.3
              )}`,
            },
          }}
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
