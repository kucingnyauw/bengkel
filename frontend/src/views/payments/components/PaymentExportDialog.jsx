/**
 * PaymentExportDialog - Dialog export untuk mengunduh data pembayaran sebagai CSV dengan filter rentang tanggal, metode, dan status.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog export pembayaran
 */
import { useState } from "react";
import { Calendar, X } from "lucide-react";

import {
  Button,
  CircularProgress,
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

import { PaymentMethod } from "@shared/constant";
import { exportToCsv, formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentsQuery } from "@views/payments/hooks";

const csvHeaders = [
  "No. Order",
  "Metode",
  "Dibayar",
  "Kembalian",
  "Status",
  "Kasir",
  "Customer",
  "Subtotal",
  "Pajak",
  "Total",
  "Tanggal",
];

const PaymentExportDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { refetch } = usePaymentsQuery({
    limit: 100,
    page: 1,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    method: method || undefined,
    status: status || undefined,
  });

  /**
   * Handle export ke CSV
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await refetch();
      const payments = result?.data?.data || [];
      const fileName = `Data-Pembayaran-${
        startDate ? startDate.toISOString().split("T")[0] : "all"
      }-${endDate ? endDate.toISOString().split("T")[0] : "all"}.csv`;

      exportToCsv({
        data: payments,
        fileName,
        headers: csvHeaders,
        mapRow: (row) => [
          row.order?.orderNumber || "—",
          PaymentMethod[row.method] || row.method,
          formatToIdr(row.amountPaid),
          formatToIdr(row.change),
          row.statusLabel,
          row.order?.cashier?.fullName || "—",
          row.order?.customer?.name || "—",
          formatToIdr(row.order?.subtotal || 0),
          formatToIdr(row.order?.tax || 0),
          formatToIdr(row.order?.total || 0),
          formatDateTime(row.createdAt),
        ],
      });
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle reset filter
   */
  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setMethod("");
    setStatus("");
  };

  return (
    <Dialog
      open={open}
      onClose={isExporting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
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
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 400,
        }}
      >
        Export Pembayaran
        <IconButton onClick={onClose} disabled={isExporting} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack sx={{ gap: 2.5 }}>
     
          <MobileDatePicker
            label="Dari Tanggal"
            value={startDate}
            onChange={setStartDate}
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
            onChange={setEndDate}
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

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Metode</InputLabel>
            <Select
              value={method}
              label="Metode"
              onChange={(e) => setMethod(e.target.value)}
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua
              </MenuItem>
              {Object.entries(PaymentMethod).map(([key, value]) => (
                <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 400 }}>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
              sx={{ fontWeight: 400 }}
            >
              <MenuItem value="" sx={{ fontWeight: 400 }}>
                Semua
              </MenuItem>
              <MenuItem value="PAID" sx={{ fontWeight: 400 }}>
                Lunas
              </MenuItem>
              <MenuItem value="REFUNDED" sx={{ fontWeight: 400 }}>
                Refund
              </MenuItem>
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
        <Button
          color="inherit"
          variant="outlined"
          onClick={handleReset}
          disabled={isExporting}
          sx={{ fontWeight: 400 }}
        >
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            disabled={isExporting}
            onClick={onClose}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isExporting}
            startIcon={
              isExporting ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            {isExporting ? "Mengexport..." : "Export CSV"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentExportDialog;