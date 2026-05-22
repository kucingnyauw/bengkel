/**
 * AvailableMechanics - Komponen halaman untuk menampilkan mekanik yang tersedia dan menugaskan ke pesanan.
 *
 * @component
 * @returns {JSX.Element} Halaman mekanik tersedia
 */
import { useCallback, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
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
import {
  AssignMechanicDialog,
  MechanicTaskDialog,
} from "@views/tasks/components";
import {
  useTaskDialog,
  useAvailableMechanicsQuery,
} from "@views/tasks/hooks";

const AvailableMechanics = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    assignDialog,
    closeAssignDialog,
    openAssignDialog,
    setDialogData,
    setOrderIdentifier,
    goToConfirmStep,
    orderIdentifier,
    selectedMechanic,
    taskDialog,
    openTaskDialog,
    closeTaskDialog,
  } = useTaskDialog();

  const params = useMemo(
    () => ({ limit, page, search: debouncedSearch }),
    [limit, page, debouncedSearch]
  );

  const { data, isLoading, refetch } = useAvailableMechanicsQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handler klik tombol assign
   */
  const handleAssignClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      if (!row.isAvailable) return;
      openAssignDialog(row);
    },
    [openAssignDialog]
  );

  /**
   * Handler klik ganda baris
   */
  const handleRowDoubleClick = useCallback(
    (row) => openTaskDialog(row),
    [openTaskDialog]
  );

  /**
   * Render baris kustom
   */
  const renderRow = useCallback(
    (row) => [
      <Box key={`name-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {row.fullName}
        </Typography>
        {!row.isAvailable && (
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 400 }}>
            Kapasitas penuh ({row.activeTaskCount} tugas)
          </Typography>
        )}
      </Box>,

      <Typography key={`email-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.email || "—"}
      </Typography>,

      <Typography key={`phone-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.phone || "—"}
      </Typography>,

      <Typography key={`task-${row.id}`} variant="body2" sx={{ fontWeight: 400, textAlign: "center" }}>
        {row.activeTaskCount}
      </Typography>,

      <Chip
        key={`status-${row.id}`}
        color={row.isAvailable ? "success" : "default"}
        label={row.isAvailable ? "Tersedia" : "Sibuk"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title={row.isAvailable ? "Tugaskan ke Pesanan" : "Mekanik tidak tersedia"}>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              disabled={!row.isAvailable}
              onClick={(e) => handleAssignClick(e, row)}
              size="small"
              aria-label="Tugaskan ke Pesanan"
              sx={{
                border: "1px solid",
                borderColor: row.isAvailable
                  ? alpha(theme.palette.divider, 0.8)
                  : alpha(theme.palette.divider, 0.4),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: row.isAvailable
                  ? alpha(theme.palette.background.paper, 0.6)
                  : "transparent",
                color: row.isAvailable
                  ? theme.palette.text.secondary
                  : theme.palette.action.disabled,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": row.isAvailable
                  ? {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    }
                  : {},
              }}
            >
              <Plus size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleAssignClick, theme]
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
        emptyStateMessage="Tidak ada mekanik tersedia"
        headers={[
          "Nama Mekanik",
          "Email",
          "Telepon",
          "Tugas Aktif",
          "Status",
          "Aksi",
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
        searchPlaceholder="Cari mekanik..."
        searchVal={search}
        subtitle="Daftar mekanik yang siap mengerjakan pesanan"
        title="Mekanik Tersedia"
      />

      <AssignMechanicDialog
        onClose={closeAssignDialog}
        onDataFetched={setDialogData}
        onNextStep={goToConfirmStep}
        onOrderIdentifierChange={setOrderIdentifier}
        open={assignDialog.open}
        orderIdentifier={orderIdentifier}
        selectedMechanic={selectedMechanic}
        step={assignDialog.step}
      />

      <MechanicTaskDialog
        mechanic={taskDialog.mechanic}
        onClose={closeTaskDialog}
        open={taskDialog.open}
      />
    </>
  );
};

export default AvailableMechanics;