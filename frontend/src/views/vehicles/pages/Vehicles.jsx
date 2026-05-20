/**
 * Vehicles - Komponen halaman untuk mengelola data kendaraan customer dengan operasi CRUD.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen kendaraan
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { formatDateTime } from "@shared/utils";
import {
  VehicleCreateDialog,
  VehicleDeleteDialog,
  VehicleUpdateDialog,
  VehicleDetailDialog,
} from "@views/vehicles/components";
import { useVehicleDialog, useVehiclesQuery } from "@views/vehicles/hooks";

const Vehicles = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    createDialog,
    updateDialog,
    deleteDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    openUpdateDialog,
    closeUpdateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailDialog,
    closeDetailDialog,
  } = useVehicleDialog();

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "Plat Nomor",
      "Merek",
      "Model",
      "Customer",
      "Telepon",
      "Tanggal",
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

  const { data, isLoading, refetch } = useVehiclesQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handle klik tombol edit
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openUpdateDialog(row);
    },
    [openUpdateDialog]
  );

  /**
   * Handle klik tombol hapus
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris
   */
  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Handler klik ganda baris untuk membuka dialog detail
   * @param {Object} row - Data baris
   */

  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(null, row);
    },
    [openDetailDialog]
  );

  /**
   * Render baris kustom
   * @param {Object} row - Data kendaraan
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`plate-${row.id}`} fontWeight={500} variant="body2">
        {row.vehicles?.map((v) => v.plateNumber).join(", ") || "—"}
      </Typography>,
      <Typography key={`brand-${row.id}`} variant="body2">
        {row.vehicles?.map((v) => v.brand || "—").join(", ") || "—"}
      </Typography>,
      <Typography key={`model-${row.id}`} variant="body2">
        {row.vehicles?.map((v) => v.model || "—").join(", ") || "—"}
      </Typography>,
      <Typography key={`customer-${row.id}`} fontWeight={500} variant="body2">
        {row.name || "—"}
      </Typography>,
      <Typography key={`phone-${row.id}`} variant="body2">
        {row.phone || "—"}
      </Typography>,
      <Typography key={`date-${row.id}`} variant="body2">
        {formatDateTime(row.createdAt)}
      </Typography>,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip title="Edit Kendaraan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleEditClick(e, row)}
              size="small"
              aria-label="Edit Kendaraan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(4px)",
                color: theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  {
                    duration: theme.transitions.duration.shorter,
                  }
                ),
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
        <Tooltip title="Hapus Kendaraan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleDeleteClick(e, row)}
              size="small"
              aria-label="Hapus Kendaraan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(4px)",
                color: theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  {
                    duration: theme.transitions.duration.shorter,
                  }
                ),
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
      { icon: Plus, label: "Tambah Kendaraan", onClick: openCreateDialog },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openCreateDialog, refetch]
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
        emptyStateMessage="Tidak ada kendaraan ditemukan"
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
        searchPlaceholder="Cari kendaraan..."
        searchVal={search}
        subtitle="Kelola data kendaraan pelanggan"
        title="Data Kendaraan"
      />

      <VehicleCreateDialog open={createDialog} onClose={closeCreateDialog} />

      <VehicleUpdateDialog
        open={updateDialog.open}
        vehicle={updateDialog.vehicle}
        onClose={closeUpdateDialog}
      />

      <VehicleDeleteDialog
        open={deleteDialog.open}
        vehicle={deleteDialog.vehicle}
        onClose={closeDeleteDialog}
      />

      <VehicleDetailDialog
        open={detailDialog.open}
        vehicleId={detailDialog.vehicleId}
        customer={detailDialog.customer}
        onClose={closeDetailDialog}
      />
    </>
  );
};

export default Vehicles;
