/**
 * MechanicTasks - Komponen halaman untuk menampilkan tugas mekanik yang sedang login.
 *
 * @component
 * @returns {JSX.Element} Halaman tugas saya
 */
import { useCallback, useMemo, useState } from "react";
import { CheckCircle, ListFilter, Play, RotateCcw } from "lucide-react";
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
import { formatDateTime, normalizeEnumText } from "@shared/utils";
import {
  TaskActionDialog,
  TaskDetailDialog,
  TaskFilterDialog,
} from "@views/tasks/components";
import {
  useCompleteTaskMutation,
  useMyTasksQuery,
  useStartTaskMutation,
  useTaskDialog,
  useTaskFilters,
} from "@views/tasks/hooks";

const MechanicTasks = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    closeDetailDialog,
    closeDialog,
    detailDialog,
    dialog,
    openDetailDialog,
    openEndDialog,
    openStartDialog,
  } = useTaskDialog();

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

  const startMutation = useStartTaskMutation();
  const endMutation = useCompleteTaskMutation();
  const isSubmitting = startMutation.isPending || endMutation.isPending;

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => ["No. Order", "Status", "Customer", "Kendaraan", "Layanan", "Progress", "Dibuat", "Aksi"],
    []
  );

  /**
   * Parameter query
   * @type {Object}
   */
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      orderId: activeFilters.orderId || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useMyTasksQuery(queryParams);

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
   * Handler konfirmasi aksi (mulai/selesai)
   * @param {Object} task - Data tugas
   */
  const handleConfirmAction = useCallback(
    (task) => {
      if (dialog.type === "start") {
        startMutation.mutate(task.orderId, { onSuccess: () => closeDialog() });
      } else if (dialog.type === "end") {
        endMutation.mutate(task.orderId, { onSuccess: () => closeDialog() });
      }
    },
    [dialog.type, startMutation, endMutation, closeDialog]
  );

  /**
   * Handler klik ganda baris
   * @param {Object} row - Data baris
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row.orderId),
    [openDetailDialog]
  );

  /**
   * Handler klik tombol mulai
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris
   */
  const handleStartClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openStartDialog(row);
    },
    [openStartDialog]
  );

  /**
   * Handler klik tombol selesai
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris
   */
  const handleEndClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openEndDialog(row);
    },
    [openEndDialog]
  );

  /**
   * Render baris kustom
   * @param {Object} row - Data tugas
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => {
      const serviceNames = row.services?.map((s) => s.name).join(", ") || "—";
      const canStart = row.status === "QUEUED";
      const canEnd = row.status === "IN_PROGRESS";

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
        <Stack key={`action-${row.orderId}`} direction="row" spacing={0.5}>
          {canStart && (
            <Tooltip title="Mulai Tugas">
              <Box component="span" sx={{ display: "inline-flex" }}>
                <IconButton
                  onClick={(e) => handleStartClick(e, row)}
                  size="small"
                  aria-label="Mulai Tugas"
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
                  <Play size={16} />
                </IconButton>
              </Box>
            </Tooltip>
          )}

          {canEnd && (
            <Tooltip title="Selesaikan Tugas">
              <Box component="span" sx={{ display: "inline-flex" }}>
                <IconButton
                  onClick={(e) => handleEndClick(e, row)}
                  size="small"
                  aria-label="Selesaikan Tugas"
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
                  <CheckCircle size={16} />
                </IconButton>
              </Box>
            </Tooltip>
          )}
        </Stack>,
      ];
    },
    [handleStartClick, handleEndClick, theme]
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
        searchPlaceholder="Cari order, customer, atau kendaraan..."
        searchVal={search}
        subtitle="Daftar tugas yang ditugaskan kepada Anda"
        title="Tugas Saya"
      />

      <TaskFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <TaskActionDialog
        dialog={dialog}
        isLoading={isSubmitting}
        onClose={closeDialog}
        onConfirm={handleConfirmAction}
      />

      <TaskDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        orderId={detailDialog.orderId}
      />
    </>
  );
};

export default MechanicTasks;