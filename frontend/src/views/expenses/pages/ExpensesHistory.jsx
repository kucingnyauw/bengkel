/**
 * ExpenseHistory - Komponen halaman untuk melihat riwayat pengeluaran dengan filter dan pencarian.
 *
 * @component
 * @returns {JSX.Element} Halaman riwayat pengeluaran
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import { Chip, Typography } from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { ExpenseCategory, expenseCategoryColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  ExpenseDetailDialog,
  ExpenseFilterDialog,
} from "@views/expenses/components";
import {
  useExpenseDialog,
  useExpenseFilters,
  useExpensesHistoryQuery,
} from "@views/expenses/hooks";

const ExpenseHistory = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const { detailDialog, openDetailDialog, closeDetailDialog } = useExpenseDialog();
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
    () => ["Judul", "Jumlah", "Kategori", "Pencatat", "Tanggal"],
    []
  );

  /**
   * Parameter query untuk riwayat pengeluaran
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

  const { data, isLoading, refetch } = useExpensesHistoryQuery(params);

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
   * @param {Object} row - Data baris pengeluaran
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  /**
   * Render baris kustom untuk tabel riwayat pengeluaran
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
    ],
    []
  );

  /**
   * Konfigurasi tombol aksi tabel
   * @type {Object[]}
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
        emptyStateMessage="Tidak ada riwayat pengeluaran"
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
        subtitle="Riwayat pengeluaran bengkel"
        title="Riwayat Pengeluaran"
      />

      <ExpenseFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ExpenseDetailDialog
        expense={detailDialog.expense}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default ExpenseHistory;