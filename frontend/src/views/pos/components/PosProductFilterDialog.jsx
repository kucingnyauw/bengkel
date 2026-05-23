/**
 * PosProductFilterDialog - Dialog filter untuk produk di halaman POS berdasarkan tipe, status, harga, stok, dan sorting.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.type] - Tipe produk (SPAREPART/SERVICE)
 * @param {string} [props.tempFilters.isActive] - Status aktif (true/false)
 * @param {string} [props.tempFilters.minPrice] - Harga minimal
 * @param {string} [props.tempFilters.maxPrice] - Harga maksimal
 * @param {string} [props.tempFilters.lowStockThreshold] - Ambang stok rendah
 * @param {string} [props.tempFilters.sortBy] - Field sorting
 * @param {string} [props.tempFilters.sortOrder] - Arah sorting (asc/desc)
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan nilai filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 *
 * @returns {JSX.Element} Dialog filter produk POS
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

const PosProductFilterDialog = ({
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, type: e.target.value })
              }
              value={tempFilters.type || ""}
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, isActive: e.target.value })
              }
              value={tempFilters.isActive || ""}
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
            onChange={(e) =>
              onFilterChange({ ...tempFilters, minPrice: e.target.value })
            }
            type="number"
            value={tempFilters.minPrice || ""}
            slotProps={{
              htmlInput: { min: 0 },
            }}
          />

          {/* Harga Maksimal */}
          <TextField
            fullWidth
            label="Harga Maksimal"
            onChange={(e) =>
              onFilterChange({ ...tempFilters, maxPrice: e.target.value })
            }
            type="number"
            value={tempFilters.maxPrice || ""}
            slotProps={{
              htmlInput: { min: 0 },
            }}
          />

          {/* Stok di Bawah */}
          <TextField
            fullWidth
            label="Stok di Bawah"
            onChange={(e) =>
              onFilterChange({
                ...tempFilters,
                lowStockThreshold: e.target.value,
              })
            }
            type="number"
            value={tempFilters.lowStockThreshold || ""}
            slotProps={{
              htmlInput: { min: 0 },
            }}
          />

          {/* Urutkan */}
          <FormControl fullWidth>
            <InputLabel>Urutkan</InputLabel>
            <Select
              label="Urutkan"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortBy: e.target.value })
              }
              value={tempFilters.sortBy || ""}
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortOrder: e.target.value })
              }
              value={tempFilters.sortOrder || ""}
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

export default PosProductFilterDialog;