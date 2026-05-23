/**
 * Tasks - Komponen halaman untuk memantau semua tugas mekanik dengan filter dan pencarian.
 *
 * @component
 * @returns {JSX.Element} Halaman semua tugas
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import { Box, Chip, Typography, useTheme } from "@mui/material";

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
  const theme = useTheme();
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

  const params = useMemo(
    () => ({
      limit,
      page,
      search: debouncedSearch,
      orderId: activeFilters.orderId || undefined,
      mechanicId: activeFilters.mechanicId || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
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
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row.orderId),
    [openDetailDialog]
  );

  /**
   * Render baris kustom
   */
  const renderRow = useCallback(
    (row) => {
      const serviceNames =
        row.services?.map((s) => s.name).join(", ") || "—";
      const mechanicNames =
        [
          ...new Set(
            row.services?.map((s) => s.mechanicName).filter(Boolean)
          ),
        ].join(", ") || "—";

      const totalCount = row.services?.length || 0;

      return [
        <Typography key={`order-${row.orderId}`} variant="body2" sx={{ fontWeight: 400 }}>
          {row.orderNumber}
        </Typography>,

        <Chip
          key={`status-${row.orderId}`}
          color={statusColorMap[row.status] || "default"}
          label={normalizeEnumText(OrderStatus[row.status] || row.status)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />,

        <Box key={`customer-${row.orderId}`}>
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
            {row.customer?.name || "—"}
          </Typography>
        </Box>,

        <Box key={`vehicle-${row.orderId}`}>
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
            {row.vehicle?.plateNumber || "—"}
          </Typography>
          {row.vehicle?.brand && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
              {row.vehicle.brand} {row.vehicle.model || ""}
            </Typography>
          )}
        </Box>,

        <Box key={`service-${row.orderId}`}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 400,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {serviceNames}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            {totalCount} layanan
          </Typography>
        </Box>,

        <Typography key={`mechanic-${row.orderId}`} variant="body2" sx={{ fontWeight: 400 }}>
          {mechanicNames}
        </Typography>,

        <Typography key={`created-${row.orderId}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          {row.createdAt ? formatDateTime(row.createdAt) : "—"}
        </Typography>,
      ];
    },
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
  const handlePageChange = useCallback((event, newPage) => setPage(newPage), []);

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
        emptyStateMessage="Tidak ada tugas ditemukan"
        headers={[
          "No. Order",
          "Status",
          "Customer",
          "Kendaraan",
          "Layanan",
          "Mekanik",
          "Dibuat",
        ]}
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