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
import { alpha } from "@mui/material/styles";

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
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      slotProps={{
        paper : {
          sx: {
            borderRadius: `${theme.shape.borderRadius}px`,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          },
        }
      }}
   
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight : 500
        }}
      >
        Filter Pesanan
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Status</InputLabel>
            <Select
              value={tempFilters.status || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value })}
              label="Status"
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua Status
              </MenuItem>
              {Object.entries(OrderStatus).map(([key, value]) => (
                <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
            onChange={(val) => onFilterChange({ ...tempFilters, customer: val })}
            placeholder="Cari pelanggan..."
            queryKey={["customers-filter", debouncedCustomerSearch]}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {option.name}
                    </Typography>
                    <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 400 }}>
                      {option.phone}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            value={tempFilters.customer}
          />

          <MobileDatePicker
            label="Dari Tanggal"
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{
              openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} />,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { fontWeight: 400 },
              },
            }}
            value={tempFilters.startDate}
          />

          <MobileDatePicker
            label="Sampai Tanggal"
            onChange={(val) => onFilterChange({ ...tempFilters, endDate: val })}
            slots={{
              openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} />,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { fontWeight: 400 },
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

export default OrderFilterDialog;