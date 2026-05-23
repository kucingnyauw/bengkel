/**
 * ShiftFilterDialog - Dialog filter untuk shift dengan filter rentang tanggal dan status.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onReset - Handler reset filter
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.status] - Filter status shift (OPEN/CLOSED)
 * @param {Date} [props.tempFilters.startDate] - Filter tanggal mulai
 * @param {Date} [props.tempFilters.endDate] - Filter tanggal akhir
 *
 * @returns {JSX.Element} Dialog filter shift
 */
import { Calendar, X } from "lucide-react";

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
  useTheme,
} from "@mui/material";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

const ShiftFilterDialog = ({
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
        Filter Shift
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: theme.spacing(2.5) }}>
          {/* Filter Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={tempFilters.status || ""}
              onChange={(e) =>
                onFilterChange({ ...tempFilters, status: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="OPEN">Aktif</MenuItem>
              <MenuItem value="CLOSED">Tutup</MenuItem>
            </Select>
          </FormControl>

          {/* Rentang Tanggal */}
          <MobileDatePicker
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

          <MobileDatePicker
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

export default ShiftFilterDialog;