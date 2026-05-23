/**
 * StockFilterDialog - Dialog filter untuk mutasi stok dengan filter tipe, sumber, produk, dan rentang tanggal.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.type] - Tipe mutasi (IN/OUT)
 * @param {string} [props.tempFilters.sourceType] - Sumber mutasi
 * @param {Object} [props.tempFilters.product] - Produk yang dipilih
 * @param {Date} [props.tempFilters.startDate] - Tanggal mulai
 * @param {Date} [props.tempFilters.endDate] - Tanggal akhir
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 *
 * @returns {JSX.Element} Dialog filter mutasi stok
 */
import { Calendar, X } from "lucide-react";

import {
  Box,
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
  Typography,
  useTheme,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { StockMovementType, StockSourceType } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";
import { AsyncAutocomplete } from "@components";
import { getProducts } from "@api/productApi.js";

const StockFilterDialog = ({
  open,
  tempFilters,
  onClose,
  onFilterChange,
  onApply,
  onReset,
}) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Filter Mutasi Stok
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
              value={tempFilters.type || ""}
              label="Tipe"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, type: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockMovementType).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filter Sumber */}
          <FormControl fullWidth>
            <InputLabel>Sumber</InputLabel>
            <Select
              value={tempFilters.sourceType || ""}
              label="Sumber"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, sourceType: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockSourceType).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Pencarian Produk */}
          <AsyncAutocomplete
            value={tempFilters.product}
            onChange={(val) =>
              onFilterChange({
                ...tempFilters,
                product: val,
                productId: val?.id || "",
              })
            }
            queryKey={["products-filter-stock"]}
            fetchOptions={async (searchValue) => {
              const res = await getProducts({
                page: 1,
                limit: 10,
                search: searchValue,
              });
              return res?.data || [];
            }}
            getOptionLabel={(o) => o?.name || ""}
            placeholder="Cari produk..."
            minSearch={2}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box key={key} component="li" {...rest}>
                  <Box>
                    <Typography variant="body2">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.sku || "—"} • Stok: {option.stock ?? 0}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          {/* Rentang Tanggal */}
          <DatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate}
            onChange={(val) =>
              onFilterChange({ ...tempFilters, startDate: val })
            }
            slots={{
              openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} />,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />

          <DatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate}
            onChange={(val) =>
              onFilterChange({ ...tempFilters, endDate: val })
            }
            slots={{
              openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} />,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
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

export default StockFilterDialog;