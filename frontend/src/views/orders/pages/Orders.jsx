/**
 * Orders - Komponen halaman untuk menampilkan pesanan aktif dengan pemrosesan pembayaran.
 *
 * @component
 * @returns {JSX.Element} Halaman pesanan aktif
 */
import { useCallback, useMemo, useState } from "react";
import { Banknote, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  OrderCancelDialog,
  OrderDetailDialog,
  OrderPaymentDialog,
} from "@views/orders/components";
import { useOrderDialog, useOrdersQuery } from "@views/orders/hooks";

const Orders = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);
  const { closeDialog, dialog, openDialog } = useOrderDialog();

  const params = useMemo(
    () => ({ limit, page, search: debouncedSearch }),
    [limit, page, debouncedSearch]
  );

  const { data, isLoading, refetch } = useOrdersQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handler klik tombol pembayaran
   */
  const handlePayment = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDialog("payment", row);
    },
    [openDialog]
  );

  /**
   * Handler klik tombol pembatalan
   */
  const handleCancel = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDialog("cancel", row);
    },
    [openDialog]
  );

  /**
   * Handler klik tombol tutup order
   */
  const handleCloseOrder = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDialog("close", row);
    },
    [openDialog]
  );

  /**
   * Handler klik ganda baris untuk membuka dialog detail
   */
  const handleDoubleClick = useCallback(
    (row) => openDialog("detail", row),
    [openDialog]
  );

  const canPay = (row) => row.status === "DRAFT" && !row.payment;

  const canCancel = (status) =>
    !["COMPLETED", "CLOSED", "CANCELLED"].includes(status);

  const getItemTypeChip = (row) => {
    const hasService = row.items?.some(
      (item) => item.product?.type === "SERVICE"
    );
    const hasSparepart = row.items?.some(
      (item) => item.product?.type === "SPAREPART"
    );

    if (hasService && hasSparepart) {
      return (
        <Chip
          label="Campuran"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (hasService) {
      return (
        <Chip
          label="Servis"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (hasSparepart) {
      return (
        <Chip
          label="Sparepart"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  };

  const getPaymentChip = (row) => {
    const status = row.paymentStatus;

    if (status === "Lunas") {
      return (
        <Chip
          label="Lunas"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Menunggu Pembayaran" || status === "Belum Bayar") {
      return (
        <Chip
          label={status}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Direfund") {
      return (
        <Chip
          label="Direfund"
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    return (
      <Chip
        label={status || "—"}
        size="small"
        color="error"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />
    );
  };

  /**
   * Render baris kustom untuk tabel pesanan
   */
  const renderRow = useCallback(
    (row) => [
      <Box key={`order-${row.id}`}>
        <Typography variant="body2" fontWeight={400}>
          {row.orderNumber}
        </Typography>
        {row.vehicle && (
          <Typography variant="caption" color="text.secondary" fontWeight={400}>
            {row.vehicle.plateNumber} · {row.vehicle.brand} {row.vehicle.model}
          </Typography>
        )}
      </Box>,

      <Typography key={`total-${row.id}`} variant="body2" fontWeight={400}>
        {formatToIdr(row.total)}
      </Typography>,

      <Chip
        key={`status-${row.id}`}
        color={statusColorMap[row.status] || "default"}
        label={normalizeEnumText(OrderStatus[row.status] || row.status)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Box key={`items-${row.id}`}>
        <Typography
          variant="body2"
          fontWeight={400}
          sx={{
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.items?.[0]?.productName || "—"}
        </Typography>
        {row.totalItems > 1 && (
          <Typography variant="caption" color="text.secondary" fontWeight={400}>
            +{row.totalItems - 1} item lainnya
          </Typography>
        )}
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          fontWeight={400}
        >
          {row.totalItems} item
        </Typography>
      </Box>,

      <Box key={`type-${row.id}`}>{getItemTypeChip(row)}</Box>,

      <Box key={`payment-${row.id}`}>{getPaymentChip(row)}</Box>,

      <Box key={`customer-${row.id}`}>
        <Typography variant="body2" fontWeight={400}>
          {row.customer?.name || "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={400}>
          {row.customer?.phone || ""}
        </Typography>
      </Box>,

      <Typography
        key={`date-${row.id}`}
        variant="body2"
        color="text.secondary"
        fontWeight={400}
      >
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip
          title={
            canPay(row)
              ? "Proses Pembayaran"
              : row.payment
              ? "Sudah dibayar"
              : "Belum bisa bayar"
          }
        >
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => canPay(row) && handlePayment(e, row)}
              disabled={!canPay(row)}
              size="small"
              aria-label="Proses Pembayaran"
              sx={{
                border: "1px solid",
                borderColor: canPay(row)
                  ? alpha(theme.palette.divider, 0.8)
                  : alpha(theme.palette.divider, 0.4),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: canPay(row)
                  ? alpha(theme.palette.background.paper, 0.6)
                  : "transparent",
                color: canPay(row)
                  ? theme.palette.text.secondary
                  : theme.palette.action.disabled,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": canPay(row)
                  ? {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    }
                  : {},
              }}
            >
              <Banknote size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>

        {row.status === "COMPLETED" && (
          <Tooltip title="Tutup Pesanan">
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                onClick={(e) => handleCloseOrder(e, row)}
                size="small"
                aria-label="Tutup Pesanan"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  color: theme.palette.text.secondary,
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "color"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    borderColor: alpha(theme.palette.secondary.main, 0.4),
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <CheckCircle size={16} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>
        )}

        {canCancel(row.status) && (
          <Tooltip title="Batalkan Pesanan">
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                onClick={(e) => handleCancel(e, row)}
                size="small"
                aria-label="Batalkan Pesanan"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  color: theme.palette.text.secondary,
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "color"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                    borderColor: alpha(theme.palette.error.main, 0.4),
                    color: theme.palette.error.main,
                  },
                }}
              >
                <XCircle size={16} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Stack>,
    ],
    [handlePayment, handleCloseOrder, handleCancel, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   */
  const tableActions = useMemo(
    () => [{ icon: RotateCcw, label: "Refresh", onClick: () => refetch() }],
    [refetch]
  );

  /**
   * Handler perubahan halaman
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handler perubahan jumlah baris per halaman
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handler perubahan input pencarian
   */
  const onSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <>
      <AppTable
        actions={tableActions}
        count={metadata.totalPages || 0}
        data={tableData}
        emptyStateMessage="Tidak ada pesanan aktif"
        headers={[
          "No. Order",
          "Total",
          "Status",
          "Item",
          "Tipe",
          "Pembayaran",
          "Pelanggan",
          "Tanggal",
          "Aksi",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari pesanan..."
        searchVal={search}
        subtitle="Kelola pesanan yang sedang berjalan"
        title="Pesanan Aktif"
      />

      <OrderDetailDialog
        orderId={dialog.data?.id}
        onClose={closeDialog}
        open={dialog.open && dialog.type === "detail"}
      />

      <OrderPaymentDialog
        data={dialog.data}
        onClose={closeDialog}
        open={dialog.open && dialog.type === "payment"}
      />

      <OrderCancelDialog
        order={dialog.data}
        onClose={closeDialog}
        open={dialog.open && dialog.type === "cancel"}
      />
    </>
  );
};

export default Orders;
