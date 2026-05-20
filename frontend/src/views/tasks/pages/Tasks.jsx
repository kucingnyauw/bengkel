/**
 * Tasks - Komponen halaman untuk memantau semua tugas mekanik dengan filter dan pencarian.
 *
 * @component
 * @returns {JSX.Element} Halaman semua tugas
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import { Chip, Typography } from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { normalizeEnumText, formatDateTime } from "@shared/utils";
import { TaskDetailDialog, TaskFilterDialog } from "@views/tasks/components";
import {
  useTaskDialog,
  useTaskFilters,
  useTasksQuery,
} from "@views/tasks/hooks";

const Tasks = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const { closeDetailDialog, detailDialog, openDetailDialog } = useTaskDialog();

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useTaskFilters();

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => ["No. Order", "Status", "Customer", "Kendaraan", "Layanan", "Mekanik", "Progress", "Dibuat"],
    []
  );

  /**
   * Parameter query
   * @type {Object}
   */
  const params = useMemo(
    () => ({
      limit,
      page,
      search: debouncedSearch,
      orderId: activeFilters.orderId || undefined,
      orderStatus: activeFilters.orderStatus || undefined,
      mechanicId: activeFilters.mechanicId || undefined,
    }),
    [limit, page, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useTasksQuery(params);

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
   * Handler klik ganda baris
   * @param {Object} row - Data baris
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row.orderId),
    [openDetailDialog]
  );

  /**
   * Render baris kustom
   * @param {Object} row - Data tugas
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback((row) => {
    const serviceNames = row.services?.map((s) => s.name).join(", ") || "—";
    const mechanicNames = [
      ...new Set(row.services?.map((s) => s.mechanicName).filter(Boolean)),
    ].join(", ") || "—";

    return [
      <Typography key={`order-${row.orderId}`} fontWeight={500} variant="body2">
        {row.orderNumber}
      </Typography>,
      <Chip
        key={`status-${row.orderId}`}
        color={statusColorMap[row.status] || "default"}
        label={normalizeEnumText(OrderStatus[row.status] || row.status)}
        size="small"
        variant="outlined"
      />,
      <Typography key={`customer-${row.orderId}`} variant="body2">
        {row.customer?.name || "—"}
      </Typography>,
      <Typography key={`vehicle-${row.orderId}`} variant="body2">
        {row.vehicle?.plateNumber || "—"}
      </Typography>,
      <Typography key={`service-${row.orderId}`} variant="body2" noWrap sx={{ maxWidth: 200 }}>
        {serviceNames}
      </Typography>,
      <Typography key={`mechanic-${row.orderId}`} variant="body2">
        {mechanicNames}
      </Typography>,
      <Chip
        key={`progress-${row.orderId}`}
        color={row.status === "COMPLETED" || row.status === "CLOSED" ? "success" : row.status === "IN_PROGRESS" ? "info" : "warning"}
        label={
          row.status === "COMPLETED" || row.status === "CLOSED"
            ? "Selesai"
            : row.status === "IN_PROGRESS"
              ? "Dikerjakan"
              : "Menunggu"
        }
        size="small"
        variant="outlined"
      />,
      <Typography key={`created-${row.orderId}`} variant="body2">
        {row.createdAt ? formatDateTime(row.createdAt) : "—"}
      </Typography>,
    ];
  }, []);

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
  const handlePageChange = useCallback((event, newPage) => setPage(newPage), []);

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
        emptyStateMessage="Tidak ada tugas ditemukan"
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
        searchPlaceholder="Cari tugas"
        searchVal={search}
        subtitle="Pantau semua tugas mekanik yang sedang dan telah dikerjakan"
        title="Semua Tugas"
      />

      <TaskFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <TaskDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        orderId={detailDialog.orderId}
      />
    </>
  );
};

export default Tasks;