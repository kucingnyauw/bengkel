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
import { X } from "lucide-react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
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
        <IconButton edge="end" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <Select
              displayEmpty
              value={tempFilters.status}
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

          <FormControl fullWidth>
            <Select
              displayEmpty
              value={tempFilters.method}
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

          <MobileDatePicker
            onChange={(val) =>
              onFilterChange({ ...tempFilters, startDate: val })
            }
            slotProps={{ textField: { fullWidth: true, placeholder: "Dari" } }}
            value={tempFilters.startDate}
          />

          <MobileDatePicker
            onChange={(val) => onFilterChange({ ...tempFilters, endDate: val })}
            slotProps={{
              textField: { fullWidth: true, placeholder: "Sampai" },
            }}
            value={tempFilters.endDate}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button color="inherit" variant="outlined" onClick={onReset}>
          Reset
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button color="inherit" variant="outlined" onClick={onClose}>
          Batal
        </Button>
        <Button variant="contained" onClick={onApply}>
          Terapkan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentFilterDialog;
