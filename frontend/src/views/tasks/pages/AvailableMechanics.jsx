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

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "Nama Mekanik",
      "Email",
      "Telepon",
      "Tugas Aktif",
      "Status",
      "Aksi",
    ],
    []
  );

  /**
   * Parameter query
   * @type {Object}
   */
  const params = useMemo(
    () => ({ limit, page, search: debouncedSearch }),
    [limit, page, debouncedSearch]
  );

  const { data, isLoading, refetch } = useAvailableMechanicsQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handler klik tombol assign
   * @param {Event} e - Event klik
   * @param {Object} row - Data mekanik
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
   * @param {Object} row - Data mekanik
   */
  const handleRowDoubleClick = useCallback(
    (row) => openTaskDialog(row),
    [openTaskDialog]
  );

  /**
   * Render baris kustom
   * @param {Object} row - Data mekanik
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Stack key={`name-${row.id}`} spacing={0.5}>
        <Typography fontWeight={500} variant="body2">
          {row.fullName}
        </Typography>
        {!row.isAvailable && (
          <Typography variant="caption" color="error.main">
            Kapasitas penuh ({row.activeTaskCount} tugas)
          </Typography>
        )}
      </Stack>,
      <Typography key={`email-${row.id}`} variant="body2">
        {row.email}
      </Typography>,
      <Typography key={`phone-${row.id}`} variant="body2">
        {row.phone || "—"}
      </Typography>,
      <Typography key={`task-${row.id}`} variant="body2" textAlign="center">
        {row.activeTaskCount}
      </Typography>,
      <Chip
        key={`status-${row.id}`}
        color={row.isAvailable ? "success" : "default"}
        label={row.isAvailable ? "Tersedia" : "Sibuk"}
        size="small"
        variant="outlined"
      />,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
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
                  : alpha(theme.palette.divider, 0.5),
                bgcolor: row.isAvailable
                  ? alpha(theme.palette.background.paper, 0.6)
                  : "transparent",
                backdropFilter: "blur(4px)",
                color: row.isAvailable
                  ? theme.palette.text.secondary
                  : theme.palette.action.disabled,
                transition: theme.transitions.create(["background-color", "border-color", "color"], {
                  duration: theme.transitions.duration.shorter,
                }),
                "&:hover": row.isAvailable
                  ? {
                      bgcolor: alpha(theme.palette.text.primary, 0.06),
                      borderColor: theme.palette.text.primary,
                      color: theme.palette.text.primary,
                    }
                  : {},
              }}
            >
              <Plus size={16} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleAssignClick, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   * @type {Object[]}
   */
  const tableActions = useMemo(
    () => [{ icon: RotateCcw, label: "Refresh", onClick: () => refetch() }],
    [refetch]
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
        emptyStateMessage="Tidak ada mekanik tersedia"
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