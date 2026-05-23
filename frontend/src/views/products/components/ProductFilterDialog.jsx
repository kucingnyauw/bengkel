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
import { X } from "lucide-react";

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
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Filter Produk
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: theme.spacing(2.5) }}>
          {/* Filter Tipe */}
          <FormControl fullWidth>
            <InputLabel>Tipe</InputLabel>
            <Select
              label="Tipe"
              value={tempFilters.type || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, type: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="SPAREPART">Sparepart</MenuItem>
              <MenuItem value="SERVICE">Servis</MenuItem>
            </Select>
          </FormControl>

          {/* Filter Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={tempFilters.isActive || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, isActive: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="true">Aktif</MenuItem>
              <MenuItem value="false">Nonaktif</MenuItem>
            </Select>
          </FormControl>

          {/* Harga Minimal */}
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
            }}
          />

          {/* Harga Maksimal */}
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
            }}
          />

          {/* Stok di Bawah */}
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
            }}
          />

          {/* Urutkan */}
          <FormControl fullWidth>
            <InputLabel>Urutkan</InputLabel>
            <Select
              label="Urutkan"
              value={tempFilters.sortBy || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortBy: e.target.value })
              }
            >
              <MenuItem value="createdAt">Terbaru</MenuItem>
              <MenuItem value="name">Nama</MenuItem>
              <MenuItem value="price">Harga</MenuItem>
              <MenuItem value="stock">Stok</MenuItem>
            </Select>
          </FormControl>

          {/* Arah */}
          <FormControl fullWidth>
            <InputLabel>Arah</InputLabel>
            <Select
              label="Arah"
              value={tempFilters.sortOrder || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortOrder: e.target.value })
              }
            >
              <MenuItem value="desc">Turun</MenuItem>
              <MenuItem value="asc">Naik</MenuItem>
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
        <Button color="inherit" variant="outlined" onClick={onReset}>
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: theme.spacing(1.5) }}>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Batal
          </Button>
          <Button variant="contained" onClick={onApply}>
            Terapkan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFilterDialog;