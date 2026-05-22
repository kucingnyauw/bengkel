/**
 * OrderExportDialog - Dialog export untuk mengunduh data order sebagai CSV dengan filter rentang tanggal dan status.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog export order
 */
import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  useTheme,

} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { getOrders } from "@api/orderApi.js";
import {
  exportToCsv,
  formatToIdr,
  formatDateTime,
  normalizeEnumText,
} from "@shared/utils";
import { OrderStatus } from "@shared/constant";

const csvHeaders = [
  "No. Order",
  "Total",
  "Status",
  "Pembayaran",
  "Item",
  "Tipe",
  "Pelanggan",
  "Kasir",
  "Tanggal",
];

const OrderExportDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState("");

  const { refetch, isFetching } = useQuery({
    queryKey: ["orders-export", startDate, endDate, status],
    queryFn: () =>
      getOrders({
        limit: 100,
        page: 1,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        status: status || undefined,
      }),
    enabled: false,
  });

  /**
   * Handle export ke CSV
   */
  const handleExport = async () => {
    const result = await refetch();
    const orders = result?.data?.data || [];
    const fileName = `Riwayat-Pesanan-${
      startDate ? startDate.toISOString().split("T")[0] : "all"
    }-${endDate ? endDate.toISOString().split("T")[0] : "all"}.csv`;

    exportToCsv({
      data: orders,
      fileName,
      headers: csvHeaders,
      mapRow: (row) => {
        const getItemType = (row) => {
          const hasService = row.items?.some((item) => item.product?.type === "SERVICE");
          const hasSparepart = row.items?.some((item) => item.product?.type === "SPAREPART");

          if (hasService && hasSparepart) return "Campuran";
          if (hasService) return "Servis";
          if (hasSparepart) return "Sparepart";
          return "—";
        };

        return [
          row.orderNumber,
          formatToIdr(row.total),
          normalizeEnumText(OrderStatus[row.status] || row.status),
          row.paymentStatus,
          `${row.totalItems || row.items?.length || 0} item`,
          getItemType(row),
          row.customer?.name || "—",
          row.cashier?.fullName || "—",
          formatDateTime(row.createdAt),
        ];
      },
    });

    onClose();
  };

  /**
   * Handle reset filter
   */
  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setStatus("");
  };

  return (
    <Dialog
      open={open}
      onClose={isFetching ? undefined : onClose}
      maxWidth="xs"
      fullWidth
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
          fontWeight: 400,
        }}
      >
        Export CSV
        <IconButton onClick={onClose} disabled={isFetching} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2.5}>
   

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
              {Object.entries(OrderStatus).map(([key, value]) => (
                <MenuItem key={key} value={value} sx={{ fontWeight: 400 }}>
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
          px: 3,
          py: 2,
        }}
      >
        <Button
          color="inherit"
          variant="outlined"
          onClick={handleReset}
          disabled={isFetching}
          sx={{ fontWeight: 400 }}
        >
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            disabled={isFetching}
            onClick={onClose}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isFetching}
            startIcon={
              isFetching ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            {isFetching ? "Mengexport..." : "Export"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default OrderExportDialog;