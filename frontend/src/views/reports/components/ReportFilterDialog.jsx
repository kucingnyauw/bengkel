/**
 * ReportFilterDialog - Dialog filter periode untuk laporan dengan DatePicker.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Date} props.startDate - Nilai tanggal mulai
 * @param {Date} props.endDate - Nilai tanggal akhir
 * @param {Function} props.onStartDateChange - Handler perubahan tanggal mulai
 * @param {Function} props.onEndDateChange - Handler perubahan tanggal akhir
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog filter periode
 */
import { Calendar, X } from "lucide-react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

const ReportFilterDialog = ({
  open,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      open={open}
      onClose={onClose}
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
        Filter Periode
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
          <MobileDatePicker
            label="Dari Tanggal"
            value={startDate}
            onChange={onStartDateChange}
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
            value={endDate}
            onChange={onEndDateChange}
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
      <DialogActions sx={{ justifyContent: "space-between" }}>
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

export default ReportFilterDialog;