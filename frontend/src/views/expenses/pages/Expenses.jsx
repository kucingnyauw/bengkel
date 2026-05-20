/**
 * Expenses - Komponen halaman untuk mengelola pengeluaran bengkel dengan operasi CRUD dan filter.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen pengeluaran
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, ListFilter, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import { ExpenseCategory, expenseCategoryColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  ExpenseDeleteDialog,
  ExpenseDetailDialog,
  ExpenseFormDialog,
  ExpenseFilterDialog,
} from "@views/expenses/components";
import {
  useCashiersExpenseQuery,
  useExpenseDialog,
  useExpenseFilters,
} from "@views/expenses/hooks";

const Expenses = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    deleteDialog,
    detailDialog,
    dialogMode,
    dialogOpen,
    closeDeleteDialog,
    closeDetailDialog,
    closeFormDialog,
    openCreateDialog,
    openDeleteDialog,
    openDetailDialog,
    openUpdateDialog,
    selectedExpense,
  } = useExpenseDialog();
  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useExpenseFilters();

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => ["Judul", "Jumlah", "Kategori", "Pencatat", "Tanggal", "Aksi"],
    []
  );

  /**
   * Parameter query untuk pengeluaran
   * @type {Object}
   */
  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      category: activeFilters.category || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useCashiersExpenseQuery(params);

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
   * Buka dialog tambah pengeluaran
   */
  const handleOpenCreate = useCallback(
    () => openCreateDialog(),
    [openCreateDialog]
  );

  /**
   * Buka dialog edit pengeluaran
   * @param {Object} row - Data baris pengeluaran
   */
  const handleOpenUpdate = useCallback(
    (row) => openUpdateDialog(row),
    [openUpdateDialog]
  );

  /**
   * Handler klik tombol edit
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris pengeluaran
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleOpenUpdate(row);
    },
    [handleOpenUpdate]
  );

  /**
   * Tutup dialog form
   */
  const handleCloseFormDialog = useCallback(
    () => closeFormDialog(),
    [closeFormDialog]
  );

  /**
   * Handler klik ganda baris untuk membuka dialog detail
   * @param {Object} row - Data baris pengeluaran
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  /**
   * Handler klik tombol hapus
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris pengeluaran
   */
  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Render baris kustom untuk tabel pengeluaran
   * @param {Object} row - Data pengeluaran
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`title-${row.id}`} fontWeight={500} variant="body2">
        {row.title}
      </Typography>,
      <Typography key={`amount-${row.id}`} fontWeight={500} variant="body2">
        {formatToIdr(row.amount)}
      </Typography>,
      <Chip
        key={`category-${row.id}`}
        color={expenseCategoryColorMap[row.category] || "default"}
        label={normalizeEnumText(ExpenseCategory[row.category] || row.category)}
        size="small"
        variant="outlined"
      />,
      <Typography key={`recordedBy-${row.id}`} variant="body2">
        {row.recordedBy?.fullName || "—"}
      </Typography>,
      <Typography key={`date-${row.id}`} variant="body2">
        {formatDateTime(row.date)}
      </Typography>,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip title="Edit">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleEditClick(e, row)}
              size="small"
              aria-label="Edit Pengeluaran"
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
              <FilePenLine size={16} />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="Hapus">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleDeleteClick(e, row)}
              size="small"
              aria-label="Hapus Pengeluaran"
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
              <Trash2 size={16} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleEditClick, handleDeleteClick, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   * @type {Object[]}
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Pengeluaran", onClick: handleOpenCreate },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [handleOpenCreate, openFilter, refetch]
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
        emptyStateMessage="Tidak ada pengeluaran ditemukan"
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
        searchPlaceholder="Cari pengeluaran..."
        searchVal={search}
        subtitle="Kelola pengeluaran bengkel"
        title="Pengeluaran"
      />

      <ExpenseFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ExpenseFormDialog
        mode={dialogMode}
        onClose={handleCloseFormDialog}
        open={dialogOpen}
        selectedExpense={selectedExpense}
      />

      <ExpenseDeleteDialog
        expense={deleteDialog.expense}
        onClose={closeDeleteDialog}
        open={deleteDialog.open}
      />

      <ExpenseDetailDialog
        expense={detailDialog.expense}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default Expenses;