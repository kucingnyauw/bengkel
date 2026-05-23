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
import { useDispatch } from "react-redux";

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
import { showNotification } from "@store/notifications/notificationsSlice.js";

const MechanicTasks = () => {
  const dispatch = useDispatch();
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

  const startMutation = useStartTaskMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Tugas berhasil dimulai",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      closeDialog();
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal memulai tugas",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const endMutation = useCompleteTaskMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Tugas berhasil diselesaikan",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      closeDialog();
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal menyelesaikan tugas",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = startMutation.isPending || endMutation.isPending;

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      orderId: activeFilters.orderId || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useMyTasksQuery(queryParams);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  const handleConfirmAction = useCallback(
    (task) => {
      if (dialog.type === "start") {
        startMutation.mutate(task.orderId);
      } else if (dialog.type === "end") {
        endMutation.mutate(task.orderId);
      }
    },
    [dialog.type, startMutation, endMutation]
  );

  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row.orderId),
    [openDetailDialog]
  );

  const handleStartClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openStartDialog(row);
    },
    [openStartDialog]
  );

  const handleEndClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openEndDialog(row);
    },
    [openEndDialog]
  );

  const renderRow = useCallback(
    (row) => {
      const serviceNames = row.services?.map((s) => s.name).join(", ") || "—";
      const canStart = row.status === "QUEUED";
      const canEnd = row.status === "IN_PROGRESS";
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

        <Typography key={`customer-${row.orderId}`} variant="body2" sx={{ fontWeight: 400 }}>
          {row.customer?.name || "—"}
        </Typography>,

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

        <Typography key={`created-${row.orderId}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          {row.createdAt ? formatDateTime(row.createdAt) : "—"}
        </Typography>,

        <Stack key={`action-${row.orderId}`} direction="row" sx={{ gap: 0.5 }}>
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
                  <Play size={16} strokeWidth={1.5} />
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
                  <CheckCircle size={16} strokeWidth={1.5} />
                </IconButton>
              </Box>
            </Tooltip>
          )}
        </Stack>,
      ];
    },
    [handleStartClick, handleEndClick, theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openFilter, refetch]
  );

  const handlePageChange = useCallback((event, newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

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
        headers={["No. Order", "Status", "Customer", "Kendaraan", "Layanan", "Dibuat", "Aksi"]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari tugas..."
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