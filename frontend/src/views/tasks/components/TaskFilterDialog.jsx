/**
 * TaskFilterDialog - Dialog filter untuk tugas dengan filter ID order dan status order.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onReset - Handler reset filter
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.orderId] - Filter ID order
 * @param {string} [props.tempFilters.orderStatus] - Filter status order
 *
 * @returns {JSX.Element} Dialog filter tugas
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
} from "@mui/material";

import { OrderStatus } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";

const TaskFilterDialog = ({
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
        Filter Tugas
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <TextField
            label="Order ID"
            value={tempFilters.orderId}
            onChange={(e) =>
              onFilterChange({ ...tempFilters, orderId: e.target.value })
            }
            placeholder="Masukkan ID Order"
          />

          <FormControl>
            <InputLabel>Status Order</InputLabel>
            <Select
              value={tempFilters.orderStatus}
              label="Status Order"
              onChange={(e) =>
                onFilterChange({ ...tempFilters, orderStatus: e.target.value })
              }
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(OrderStatus).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
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

export default TaskFilterDialog;