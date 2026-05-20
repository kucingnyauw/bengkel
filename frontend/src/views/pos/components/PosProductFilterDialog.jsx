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
import { alpha } from "@mui/material/styles";

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
          fontWeight: 400,
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, type: e.target.value })
              }
              value={tempFilters.type || ""}
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, isActive: e.target.value })
              }
              value={tempFilters.isActive || ""}
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
            onChange={(e) =>
              onFilterChange({ ...tempFilters, minPrice: e.target.value })
            }
            type="number"
            value={tempFilters.minPrice || ""}
            slotProps={{
              htmlInput: { min: 0 },
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

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
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

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
              input: { sx: { fontWeight: 400 } },
              inputLabel: { sx: { fontWeight: 400 } },
            }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Urutkan</InputLabel>
            <Select
              label="Urutkan"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortBy: e.target.value })
              }
              value={tempFilters.sortBy || ""}
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sortOrder: e.target.value })
              }
              value={tempFilters.sortOrder || ""}
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
          px: 3,
          py: 2,
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

export default PosProductFilterDialog;