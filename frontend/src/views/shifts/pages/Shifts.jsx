/**
 * Shifts - Komponen halaman untuk mengelola shift aktif dengan operasi kas dan kontrol status.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen shift
 */
import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListFilter,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
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
import { formatDateTime, formatToIdr } from "@shared/utils";
import {
  ShiftCashDialog,
  ShiftCloseDialog,
  ShiftOpenDialog,
  ShiftDetailDialog,
  ShiftFilterDialog,
} from "@views/shifts/components";
import {
  useShiftDialog,
  useShiftFilters,
  useShiftsQuery,
} from "@views/shifts/hooks";

const Shifts = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    openDialog,
    cashDialog,
    closeCashDialog,
    closeCloseDialog,
    closeDialog,
    closeOpenDialog,
    closeDetailDialog,
    detailDialog,
    openCashDialog,
    openCloseDialog,
    openDetailDialog,
    openOpenDialog,
    selectedShiftId,
  } = useShiftDialog();

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
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      limit,
      page,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      status: activeFilters.status || undefined,
    }),
    [page, limit, activeFilters]
  );

  const { data, isLoading, refetch } = useShiftsQuery(params);

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
   * Handler aksi kas (masuk/keluar)
   */
  const handleCashAction = useCallback(
    (e, row, type) => {
      e.stopPropagation();
      openCashDialog(row.id, type);
    },
    [openCashDialog]
  );

  /**
   * Handler aksi tutup shift
   */
  const handleCloseAction = useCallback(
    (e, row) => {
      e.stopPropagation();
      openCloseDialog(row.id);
    },
    [openCloseDialog]
  );

  /**
   * Render baris kustom untuk tabel shift
   */
  const renderRow = useCallback(
    (row) => {
      const isOpen = row.status === "OPEN";

      return [
        <Typography key={`cashier-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
          {row.cashier?.fullName ?? "—"}
        </Typography>,

        <Chip
          key={`status-${row.id}`}
          color={isOpen ? "success" : "default"}
          label={isOpen ? "Aktif" : "Tutup"}
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

        <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
          {isOpen && (
            <>
              <Tooltip title="Kas Masuk">
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCashAction(e, row, "in")}
                    aria-label="Kas Masuk"
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
                        bgcolor: alpha(theme.palette.success.main, 0.06),
                        borderColor: alpha(theme.palette.success.main, 0.4),
                        color: theme.palette.success.main,
                      },
                    }}
                  >
                    <ArrowDownCircle size={16} strokeWidth={1.5} />
                  </IconButton>
                </Box>
              </Tooltip>

              <Tooltip title="Kas Keluar">
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCashAction(e, row, "out")}
                    aria-label="Kas Keluar"
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
                    <ArrowUpCircle size={16} strokeWidth={1.5} />
                  </IconButton>
                </Box>
              </Tooltip>

              <Tooltip title="Tutup Shift">
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCloseAction(e, row)}
                    aria-label="Tutup Shift"
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
                    <XCircle size={16} strokeWidth={1.5} />
                  </IconButton>
                </Box>
              </Tooltip>
            </>
          )}
        </Stack>,
      ];
    },
    [handleCashAction, handleCloseAction, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Buka Shift", onClick: openOpenDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openOpenDialog, openFilter, refetch]
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
          "Penjualan Tunai",
          "Selisih",
          "Aksi",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        subtitle="Pilih shift aktif untuk mengelola operasional"
        title="Daftar Shift"
      />

      <ShiftFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ShiftOpenDialog onClose={closeOpenDialog} open={openDialog} />

      <ShiftCloseDialog
        onClose={closeCloseDialog}
        open={closeDialog}
        shiftId={selectedShiftId}
      />

      <ShiftCashDialog
        onClose={closeCashDialog}
        open={cashDialog.open}
        shiftId={selectedShiftId}
        type={cashDialog.type}
      />

      <ShiftDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        shiftId={detailDialog.shiftId}
      />
    </>
  );
};

export default Shifts;