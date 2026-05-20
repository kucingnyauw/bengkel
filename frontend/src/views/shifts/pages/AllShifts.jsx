/**
 * ShiftsHistory - Komponen halaman untuk menampilkan riwayat semua shift dengan filter dan detail.
 *
 * @component
 * @returns {JSX.Element} Halaman riwayat shift
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import {
  Box,
  Chip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { ShiftDetailDialog, ShiftFilterDialog } from "@views/shifts/components";
import {
  useShiftsHistoryQuery,
  useShiftDialog,
  useShiftFilters,
} from "@views/shifts/hooks";

const ShiftsHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { closeDetailDialog, detailDialog, openDetailDialog } =
    useShiftDialog();

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useShiftFilters();

  const params = useMemo(
    () => ({
      limit,
      page,
      status: activeFilters.status || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
    }),
    [limit, page, activeFilters]
  );

  const { data, isLoading, refetch } = useShiftsHistoryQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

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
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Render baris kustom untuk tabel riwayat shift
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`cashier-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.cashier?.fullName || "—"}
      </Typography>,

      <Chip
        key={`status-${row.id}`}
        color={row.status === "OPEN" ? "success" : "default"}
        label={row.status === "OPEN" ? "Aktif" : "Tutup"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography key={`open-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.openedAt)}
      </Typography>,

      <Typography key={`close-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.closedAt ? formatDateTime(row.closedAt) : "—"}
      </Typography>,

      <Typography key={`start-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.startingCash)}
      </Typography>,

      <Typography key={`end-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.endingCash !== null && row.endingCash !== undefined ? formatToIdr(row.endingCash) : "—"}
      </Typography>,

      <Box key={`sales-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {formatToIdr(row.cashSales ?? 0)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
          {row.totalOrders} order
        </Typography>
      </Box>,

      <Box key={`diff-${row.id}`}>
        <Typography
          variant="body2"
          color={row.discrepancy !== 0 ? "error.main" : "text.primary"}
          sx={{ fontWeight: 400 }}
        >
          {formatToIdr(row.discrepancy ?? 0)}
        </Typography>
        {row.status === "CLOSED" && row.expectedCash !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            Ekspektasi: {formatToIdr(row.expectedCash)}
          </Typography>
        )}
      </Box>,
    ],
    []
  );

  /**
   * Konfigurasi tombol aksi tabel
   */
  const tableActions = useMemo(
    () => [
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openFilter, refetch]
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

  return (
    <>
      <AppTable
        actions={tableActions}
        count={metadata.totalPages || 0}
        data={tableData}
        emptyStateMessage="Tidak ada shift ditemukan"
        headers={[
          "Kasir",
          "Status",
          "Waktu Buka",
          "Waktu Tutup",
          "Saldo Awal",
          "Saldo Akhir",
          "Penjualan",
          "Selisih",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        subtitle="Riwayat seluruh shift kasir"
        title="Semua Shift"
      />

      <ShiftFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ShiftDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        shiftId={detailDialog.shiftId}
        showExpectedCash
      />
    </>
  );
};

export default ShiftsHistory;