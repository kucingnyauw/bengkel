/**
 * ProductFormDialog - Form dialog untuk membuat dan mengupdate produk dengan upload gambar.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} props.mode - Mode form ("create" atau "update")
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} [props.selectedProduct] - Data produk untuk mode update
 * @param {string|number} [props.selectedProduct.id] - ID Produk
 * @param {string} [props.selectedProduct.name] - Nama produk
 * @param {string} [props.selectedProduct.type] - Tipe produk
 * @param {string} [props.selectedProduct.description] - Deskripsi produk
 * @param {number} [props.selectedProduct.price] - Harga jual produk
 * @param {number} [props.selectedProduct.cost] - Harga modal produk
 * @param {Object} [props.selectedProduct.image] - Objek gambar produk
 * @param {string} [props.selectedProduct.image.url] - URL gambar produk
 * @param {boolean} [props.selectedProduct.isActive] - Status aktif produk
 *
 * @returns {JSX.Element} Dialog form produk
 */
import { useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { ImageIcon, X } from "lucide-react";
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
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ProductType } from "@shared/constant";
import { formatToIdr } from "@shared/utils";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useProductForm,
} from "@views/products/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ProductFormDialog = ({ mode, onClose, open, selectedProduct }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useProductForm();

  const createMutation = useCreateProductMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Produk "${data.name}" berhasil ditambahkan`,
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
          message: error.message || "Gagal menambahkan produk",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const updateMutation = useUpdateProductMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Produk "${data.name}" berhasil diperbarui`,
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
          message: error.message || "Gagal memperbarui produk",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const productType = watch("type");
  const image = watch("image");
  const imagePreview =
    image instanceof File ? URL.createObjectURL(image) : image;

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        typeof imagePreview === "string" &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (open && !isSubmitting) {
      if (mode === "update" && selectedProduct) {
        reset({
          name: selectedProduct.name || "",
          type: selectedProduct.type || "SPAREPART",
          description: selectedProduct.description || "",
          price: selectedProduct.price || "",
          cost: selectedProduct.cost || "",
          image: selectedProduct.image?.url || null,
          isActive: selectedProduct.isActive ?? true,
        });
      } else if (mode === "create") {
        reset({
          name: "",
          type: "SPAREPART",
          description: "",
          price: "",
          cost: "",
          image: null,
          stock: "",
          isActive: true,
        });
      }
    }
  }, [open, mode, selectedProduct, reset, isSubmitting]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose?.();
  }, [reset, onClose, isSubmitting]);

  /**
   * Handle submit form
   */
  const onSubmit = useCallback(
    (formData) => {
      if (isSubmitting) return;

      if (mode === "create") {
        createMutation.mutate(formData);
      } else if (selectedProduct?.id) {
        updateMutation.mutate({ formData, id: selectedProduct.id });
      }
    },
    [mode, selectedProduct, createMutation, updateMutation, isSubmitting]
  );

  /**
   * Handle perubahan input file
   */
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) setValue("image", file, { shouldDirty: true });
    },
    [setValue]
  );

  const handleRemoveImage = useCallback(() => {
    setValue("image", null, { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setValue]);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
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
        {mode === "create" ? "Tambah Produk" : "Edit Produk"}
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <Controller
              control={control}
              name="image"
              render={({ fieldState }) => (
                <>
                  <Box
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    sx={{
                      width: "100%",
                      height: 280,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      border: "2px dashed",
                      borderColor: fieldState.error
                        ? "error.main"
                        : alpha(theme.palette.divider, 0.6),
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      overflow: "hidden",
                      position: "relative",
                      bgcolor: fieldState.error
                        ? alpha(theme.palette.error.main, 0.04)
                        : alpha(theme.palette.secondary.main, 0.03),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: isSubmitting
                          ? fieldState.error
                            ? "error.main"
                            : alpha(theme.palette.divider, 0.6)
                          : theme.palette.secondary.main,
                        bgcolor: isSubmitting
                          ? fieldState.error
                            ? alpha(theme.palette.error.main, 0.04)
                            : alpha(theme.palette.secondary.main, 0.03)
                          : alpha(theme.palette.secondary.main, 0.06),
                      },
                    }}
                  >
                    {imagePreview ? (
                      <>
                        <Box
                          component="img"
                          alt="Preview"
                          src={imagePreview}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {!isSubmitting && (
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "error.main",
                              color: "error.contrastText",
                              borderRadius: `${theme.shape.borderRadius}px`,
                              px: 1.5,
                              py: 0.5,
                              fontSize: "0.75rem",
                              fontWeight: 400,
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: "error.dark",
                              },
                            }}
                          >
                            Hapus Gambar
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "background.paper",
                            border: `1px solid ${theme.palette.divider}`,
                            mb: 0.5,
                          }}
                        >
                          <ImageIcon size={22} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          Unggah Gambar Produk
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                          JPG, PNG, WEBP (Max. 5MB)
                        </Typography>
                      </>
                    )}
                  </Box>
                  {fieldState.error && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: "block", fontWeight: 400 }}>
                      {fieldState.error.message}
                    </Typography>
                  )}
                </>
              )}
            />

            <input
              accept="image/*"
              hidden
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
              disabled={isSubmitting}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Nama produk wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Nama Produk"
                  placeholder="Masukkan nama produk"
                  disabled={isSubmitting}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                    formHelperText: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
          </Grid>

          <Grid size={8}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <FormControl fullWidth disabled={isSubmitting}>
                  <InputLabel sx={{ fontWeight: 400 }}>Tipe</InputLabel>
                  <Select {...field} label="Tipe" sx={{ fontWeight: 400 }}>
                    {Object.entries(ProductType).map(([key, value]) => (
                      <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                        {key === "SPAREPART" ? "Sparepart" : "Servis"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={4}>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {field.value ? "Aktif" : "Nonaktif"}
                    </Typography>
                  }
                  sx={{ m: 0, height: "100%" }}
                />
              )}
            />
          </Grid>

          <Grid size={6}>
            <Controller
              control={control}
              name="price"
              rules={{ required: "Harga jual wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Harga Jual"
                  placeholder="Rp 0"
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
          </Grid>

          <Grid size={6}>
            <Controller
              control={control}
              name="cost"
              rules={{ required: "Harga modal wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  label="Harga Modal"
                  placeholder="Rp 0"
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
          </Grid>

          {productType !== ProductType.SERVICE && mode === "create" && (
            <Grid size={6}>
              <Controller
                control={control}
                name="stock"
                rules={{
                  required: "Stok wajib diisi",
                  min: { value: 0, message: "Stok minimal 0" },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="Stok"
                    type="number"
                    disabled={isSubmitting}
                    slotProps={{
                      htmlInput: { min: 0 },
                      input: { sx: { fontWeight: 400 } },
                      inputLabel: { sx: { fontWeight: 400 } },
                      formHelperText: { sx: { fontWeight: 400 } },
                    }}
                  />
                )}
              />
            </Grid>
          )}

          <Grid size={12}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Deskripsi"
                  placeholder="Deskripsi produk (opsional)"
                  multiline
                  rows={4}
                  disabled={isSubmitting}
                  slotProps={{
                    input: { sx: { fontWeight: 400 } },
                    inputLabel: { sx: { fontWeight: 400 } },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
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
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
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
    </Dialog>
  );
};

export default ProductFormDialog;