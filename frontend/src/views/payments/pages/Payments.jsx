/**
 * Payments - Komponen halaman untuk melihat riwayat pembayaran dengan filter, export, cetak invoice, dan refund.
 *
 * @component
 * @returns {JSX.Element} Halaman data pembayaran
 */
import { useCallback, useMemo, useState } from "react";
import { Download, ListFilter, Printer, RotateCcw, Undo2 } from "lucide-react";
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

import { AppTable, Invoice } from "@components";
import { useDebounce } from "@hooks";
import { PaymentMethod, paymentStatusColorMap } from "@shared/constant";
import { downloadPdf, formatDateTime, formatToIdr } from "@shared/utils";
import {
  PaymentDetailDialog,
  PaymentExportDialog,
  PaymentFilterDialog,
  RefundPaymentDialog,
} from "@views/payments/components";
import {
  usePaymentDialog,
  usePaymentFilters,
  usePaymentsQuery,
} from "@views/payments/hooks";

const Payments = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = usePaymentFilters();

  const {
    detailDialog,
    refundDialog,
    openDetailDialog,
    closeDetailDialog,
    openRefundDialog,
    closeRefundDialog,
    setRefundReason,
  } = usePaymentDialog();

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "No. Order",
      "Metode",
      "Dibayar",
      "Kembalian",
      "Status",
      "Kasir",
      "Customer",
      "Tanggal",
      "Aksi",
    ],
    []
  );

  /**
   * Parameter query untuk pembayaran
   * @type {Object}
   */
  const params = useMemo(
    () => ({
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      limit,
      method: activeFilters.method || undefined,
      page,
      search: debouncedSearch,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      status: activeFilters.status || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = usePaymentsQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handle cetak invoice
   * @param {Object} row - Data baris pembayaran
   */
  const handlePrintInvoice = useCallback((row) => {
    downloadPdf({
      component: <Invoice data={row} />,
      fileName: `Invoice-${row.order?.orderNumber || "payment"}.pdf`,
    });
  }, []);

  /**
   * Terapkan filter dan reset ke halaman pertama
   */
  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  /**
   * Reset filter dan kembali ke halaman pertama
   */
  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  /**
   * Handler klik ganda baris untuk membuka dialog detail
   * @param {Object} row - Data baris pembayaran
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Render baris kustom untuk tabel pembayaran
   * @param {Object} row - Data pembayaran
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`order-${row.id}`} fontWeight={500} variant="body2">
        {row.order?.orderNumber || "—"}
      </Typography>,
      <Typography key={`method-${row.id}`} variant="body2">
        {PaymentMethod[row.method] || row.method}
      </Typography>,
      <Typography key={`paid-${row.id}`} fontWeight={500} variant="body2">
        {formatToIdr(row.amountPaid)}
      </Typography>,
      <Typography key={`change-${row.id}`} variant="body2">
        {formatToIdr(row.change)}
      </Typography>,
      <Chip
        key={`status-${row.id}`}
        color={paymentStatusColorMap[row.status] || "default"}
        label={row.statusLabel}
        size="small"
        variant="outlined"
      />,
      <Typography key={`cashier-${row.id}`} variant="body2">
        {row.order?.cashier?.fullName || "—"}
      </Typography>,
      <Typography key={`customer-${row.id}`} variant="body2">
        {row.order?.customer?.name || "—"}
      </Typography>,
      <Typography key={`date-${row.id}`} variant="body2">
        {formatDateTime(row.createdAt)}
      </Typography>,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip
          title={
            row.status === "PAID" ? "Cetak Invoice" : "Invoice belum tersedia"
          }
        >
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrintInvoice(row);
              }}
              disabled={row.status !== "PAID"}
              size="small"
              aria-label="Cetak Invoice"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                bgcolor: row.status === "PAID"
                  ? alpha(theme.palette.background.paper, 0.6)
                  : "transparent",
                backdropFilter: "blur(4px)",
                color: row.status === "PAID"
                  ? theme.palette.text.secondary
                  : theme.palette.action.disabled,
                transition: theme.transitions.create(["background-color", "border-color", "color"], {
                  duration: theme.transitions.duration.shorter,
                }),
                "&:hover": row.status === "PAID"
                  ? {
                      bgcolor: alpha(theme.palette.text.primary, 0.06),
                      borderColor: theme.palette.text.primary,
                      color: theme.palette.text.primary,
                    }
                  : {},
              }}
            >
              <Printer size={16} />
            </IconButton>
          </Box>
        </Tooltip>
        {row.status === "PAID" && (
          <Tooltip title="Refund Pembayaran">
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  openRefundDialog(row);
                }}
                size="small"
                aria-label="Refund Pembayaran"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(4px)",
                  color: theme.palette.text.secondary,
                  transition: theme.transitions.create(["background-color", "border-color", "color"], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    borderColor: theme.palette.text.primary,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <Undo2 size={16} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Stack>,
    ],
    [handlePrintInvoice, openRefundDialog, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   * @type {Object[]}
   */
  const tableActions = useMemo(
    () => [
      { icon: Download, label: "Export CSV", onClick: () => setExportOpen(true) },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openFilter, refetch]
  );

  /**
   * Handler perubahan halaman
   * @param {Event} event - Event perubahan
   * @param {number} newPage - Nomor halaman baru
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handler perubahan jumlah baris per halaman
   * @param {number} newLimit - Nilai jumlah baris per halaman baru
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handler perubahan input pencarian
   * @param {Event} e - Event perubahan input
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
        emptyStateMessage="Tidak ada data pembayaran"
        headers={headers}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari pembayaran..."
        searchVal={search}
        subtitle="Riwayat pembayaran pesanan"
        title="Data Pembayaran"
      />

      <PaymentExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      <PaymentFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <RefundPaymentDialog
        onClose={closeRefundDialog}
        onReasonChange={setRefundReason}
        open={refundDialog.open}
        payment={refundDialog.payment}
        reason={refundDialog.reason}
      />

      <PaymentDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        paymentId={detailDialog.paymentId}
      />
    </>
  );
};

export default Payments;