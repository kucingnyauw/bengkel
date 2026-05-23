/**
 * ProductFilterDialog - Filter dialog component for products with type, status, price range, stock, and sorting options.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onApply - Apply filter handler
 * @param {Function} props.onClose - Close dialog handler
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onReset - Reset filter handler
 * @param {boolean} props.open - Dialog open state
 * @param {Object} props.tempFilters - Temporary filter values
 * @param {string} [props.tempFilters.type] - Product type filter (SPAREPART/SERVICE)
 * @param {string} [props.tempFilters.isActive] - Active status filter (true/false)
 * @param {string|number} [props.tempFilters.minPrice] - Minimum price filter
 * @param {string|number} [props.tempFilters.maxPrice] - Maximum price filter
 * @param {string|number} [props.tempFilters.lowStockThreshold] - Low stock threshold
 * @param {string} [props.tempFilters.sortBy] - Sort field (createdAt/name/price/stock)
 * @param {string} [props.tempFilters.sortOrder] - Sort direction (asc/desc)
 *
 * @returns {JSX.Element} Rendered product filter dialog
 */
import {
  Button,
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
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { X } from "lucide-react";

const ProductFilterDialog = ({
  onApply,
  onClose,
  onFilterChange,
  onReset,
  open,
  tempFilters,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
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
        Filter Produk
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Tipe</InputLabel>
            <Select
              label="Tipe"
              value={tempFilters.type || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, type: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua
              </MenuItem>
              <MenuItem value="SPAREPART" sx={{ fontWeight: 400 }}>
                Sparepart
              </MenuItem>
              <MenuItem value="SERVICE" sx={{ fontWeight: 400 }}>
                Servis
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Status</InputLabel>
            <Select
              label="Status"
              value={tempFilters.isActive || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, isActive: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua
              </MenuItem>
              <MenuItem value="true" sx={{ fontWeight: 400 }}>
                Aktif
              </MenuItem>
              <MenuItem value="false" sx={{ fontWeight: 400 }}>
                Nonaktif
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Harga Minimal"
            type="number"
            value={tempFilters.minPrice || ""}
            onChange={(e) =>
              onFilterChange({ ...tempFilters, minPrice: e.target.value })
            }
            slotProps={{
              htmlInput: { min: 0 },
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

          <TextField
            fullWidth
            label="Harga Maksimal"
            type="number"
            value={tempFilters.maxPrice || ""}
            onChange={(e) =>
              onFilterChange({ ...tempFilters, maxPrice: e.target.value })
            }
            slotProps={{
              htmlInput: { min: 0 },
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

          <TextField
            fullWidth
            label="Stok di Bawah"
            type="number"
            value={tempFilters.lowStockThreshold || ""}
            onChange={(e) =>
              onFilterChange({
                ...tempFilters,
                lowStockThreshold: e.target.value,
              })
            }
            placeholder="Threshold stok rendah"
            slotProps={{
              htmlInput: { min: 0 },
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Urutkan</InputLabel>
            <Select
              label="Urutkan"
              value={tempFilters.sortBy || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortBy: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="createdAt" sx={{ fontWeight: 400 }}>
                Terbaru
              </MenuItem>
              <MenuItem value="name" sx={{ fontWeight: 400 }}>
                Nama
              </MenuItem>
              <MenuItem value="price" sx={{ fontWeight: 400 }}>
                Harga
              </MenuItem>
              <MenuItem value="stock" sx={{ fontWeight: 400 }}>
                Stok
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Arah</InputLabel>
            <Select
              label="Arah"
              value={tempFilters.sortOrder || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortOrder: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="desc" sx={{ fontWeight: 400 }}>
                Turun
              </MenuItem>
              <MenuItem value="asc" sx={{ fontWeight: 400 }}>
                Naik
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Button
          color="inherit"
          variant="outlined"
          onClick={onReset}
          sx={{ fontWeight: 400 }}
        >
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={onClose}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={onApply}
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            Terapkan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFilterDialog;