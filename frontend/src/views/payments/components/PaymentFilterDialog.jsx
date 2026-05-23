/**
 * PaymentFilterDialog - Filter dialog component for payment history with date range, method, and status filtering.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onApply - Apply filter handler
 * @param {Function} props.onClose - Close dialog handler
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onReset - Reset filter handler
 * @param {boolean} props.open - Dialog open state
 * @param {Object} props.tempFilters - Temporary filter values
 * @param {string} [props.tempFilters.status] - Selected payment status
 * @param {string} [props.tempFilters.method] - Selected payment method
 * @param {Date} [props.tempFilters.startDate] - Start date filter
 * @param {Date} [props.tempFilters.endDate] - End date filter
 *
 * @returns {JSX.Element} Rendered payment filter dialog
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

import { PaymentMethod, PaymentStatus } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";

const PaymentFilterDialog = ({
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
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Filter Pembayaran
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
              value={tempFilters.status || ""}
              label="Status"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, status: e.target.value })
              }
            >
              <MenuItem value="">Semua Status</MenuItem>
              {Object.entries(PaymentStatus).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filter Metode */}
          <FormControl fullWidth>
            <InputLabel>Metode</InputLabel>
            <Select
              value={tempFilters.method || ""}
              label="Metode"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, method: e.target.value })
              }
            >
              <MenuItem value="">Semua Metode</MenuItem>
              {Object.entries(PaymentMethod).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Rentang Tanggal */}
          <MobileDatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate || null}
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
            value={tempFilters.endDate || null}
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

export default PaymentFilterDialog;