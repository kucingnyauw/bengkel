/**
 * UserFilterDialog - Dialog filter untuk karyawan dengan filter status.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onReset - Handler reset filter
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {string} [props.tempFilters.isActive] - Filter status aktif (true/false)
 *
 * @returns {JSX.Element} Dialog filter user
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

const UserFilterDialog = ({
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
        Filter Karyawan
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={tempFilters.isActive}
              label="Status"
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange({
                  ...tempFilters,
                  isActive: val === "" ? "" : val === "true",
                });
              }}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="true">Aktif</MenuItem>
              <MenuItem value="false">Nonaktif</MenuItem>
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

export default UserFilterDialog;