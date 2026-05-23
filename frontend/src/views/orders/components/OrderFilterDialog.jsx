/**
 * OrderFilterDialog - Dialog filter untuk riwayat order dengan pencarian customer, rentang tanggal, dan filter status.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onReset - Handler reset filter
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.status] - Status order yang dipilih
 * @param {Object} [props.tempFilters.customer] - Objek customer yang dipilih
 * @param {Date} [props.tempFilters.startDate] - Filter tanggal mulai
 * @param {Date} [props.tempFilters.endDate] - Filter tanggal akhir
 *
 * @returns {JSX.Element} Dialog filter order
 */
import { useState } from "react";
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

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { getCustomers } from "@api/customerApi.js";
import { AsyncAutocomplete } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils/utils.js";

const OrderFilterDialog = ({
  onApply,
  onClose,
  onFilterChange,
  onReset,
  open,
  tempFilters,
}) => {
  const theme = useTheme();
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Filter Pesanan
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
              onChange={(e) =>
                onFilterChange({ ...tempFilters, status: e.target.value })
              }
              label="Status"
            >
              <MenuItem value="">Semua Status</MenuItem>
              {Object.entries(OrderStatus).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Pencarian Customer */}
          <AsyncAutocomplete
            fetchOptions={async () => {
              const res = await getCustomers({
                limit: 10,
                page: 1,
                search: debouncedCustomerSearch,
              });
              return res?.data || [];
            }}
            getOptionLabel={(o) => o?.name || ""}
            inputValue={customerSearch}
            onInputChange={(val) => setCustomerSearch(val)}
            onChange={(val) =>
              onFilterChange({ ...tempFilters, customer: val })
            }
            placeholder="Cari pelanggan..."
            queryKey={["customers-filter", debouncedCustomerSearch]}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest}>
                  <Box>
                    <Typography variant="body2">
                      {option.name}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {option.phone}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            value={tempFilters.customer}
          />

          {/* Rentang Tanggal */}
          <MobileDatePicker
            label="Dari Tanggal"
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
            value={tempFilters.startDate}
          />

          <MobileDatePicker
            label="Sampai Tanggal"
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
            value={tempFilters.endDate}
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

export default OrderFilterDialog;