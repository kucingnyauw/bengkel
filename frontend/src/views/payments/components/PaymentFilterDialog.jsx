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
import { alpha } from "@mui/material/styles";
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
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 500,
        }}
      >
        Filter Pembayaran
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Status</InputLabel>
            <Select
              value={tempFilters.status || ""}
              label="Status"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, status: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua Status
              </MenuItem>
              {Object.entries(PaymentStatus).map(([key, value]) => (
                <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Metode</InputLabel>
            <Select
              value={tempFilters.method || ""}
              label="Metode"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, method: e.target.value })
              }
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua Metode
              </MenuItem>
              {Object.entries(PaymentMethod).map(([key, value]) => (
                <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
                sx: { fontWeight: 400 },
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
                sx: { fontWeight: 400 },
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

export default PaymentFilterDialog;