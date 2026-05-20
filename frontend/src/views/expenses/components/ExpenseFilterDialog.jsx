/**
 * ExpenseFilterDialog - Dialog filter untuk pengeluaran dengan filter kategori dan rentang tanggal.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.category] - Kategori pengeluaran
 * @param {Date} [props.tempFilters.startDate] - Tanggal mulai
 * @param {Date} [props.tempFilters.endDate] - Tanggal akhir
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 *
 * @returns {JSX.Element} Dialog filter pengeluaran
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { ExpenseCategory } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";

const ExpenseFilterDialog = ({
  open,
  tempFilters,
  onClose,
  onFilterChange,
  onApply,
  onReset,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Filter Pengeluaran
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <FormControl>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={tempFilters.category}
              label="Kategori"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, category: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(ExpenseCategory).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate}
            onChange={(val) =>
              onFilterChange({ ...tempFilters, startDate: val })
            }
            slotProps={{ textField: { fullWidth: true } }}
          />

          <DatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate}
            onChange={(val) =>
              onFilterChange({ ...tempFilters, endDate: val })
            }
            slotProps={{ textField: { fullWidth: true } }}
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
        <Stack direction="row" spacing={1}>
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

export default ExpenseFilterDialog;