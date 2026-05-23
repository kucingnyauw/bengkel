/**
 * Customers - Komponen halaman untuk mengelola data customer dengan operasi CRUD.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen customer
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
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
  CustomerCreateDialog,
  CustomerDeleteDialog,
  CustomerDetailDialog,
  CustomerUpdateDialog,
} from "@views/customers/components";
import {
  useCustomerCreateForm,
  useCustomerDialog,
  useCustomersQuery,
  useCustomerUpdateForm,
} from "@views/customers/hooks";

const Customers = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    activeStep,
    deleteDialog,
    detailDialog,
    dialogOpen,
    updateDialog,
    closeCreateDialog,
    closeDeleteDialog,
    closeDetailDialog,
    closeUpdateDialog,
    handleBack,
    handleNext,
    openCreateDialog,
    openDeleteDialog,
    openDetailDialog,
    openUpdateDialog,
  } = useCustomerDialog();

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    trigger,
    formState: createFormState,
  } = useCustomerCreateForm();

  const {
    control: updateControl,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    formState: updateFormState,
  } = useCustomerUpdateForm();

  const headers = useMemo(
    () => ["Nama", "Telepon", "Total Kendaraan", "Total Order", "Tanggal Daftar", "Aksi"],
    []
  );

  const params = useMemo(
    () => ({ page, limit, search: debouncedSearch }),
    [page, limit, debouncedSearch]
  );

  const { data, isLoading, refetch } = useCustomersQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  const handleOpenCreate = useCallback(() => {
    resetCreate();
    openCreateDialog();
  }, [resetCreate, openCreateDialog]);

  const handleCloseCreate = useCallback(() => {
    closeCreateDialog();
    resetCreate();
  }, [closeCreateDialog, resetCreate]);

  const handleOpenUpdate = useCallback(
    (row) => {
      resetUpdate({ name: row.name || "", phone: row.phone || "" });
      openUpdateDialog(row);
    },
    [resetUpdate, openUpdateDialog]
  );

  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleOpenUpdate(row);
    },
    [handleOpenUpdate]
  );

  const handleCloseUpdate = useCallback(() => {
    closeUpdateDialog();
    resetUpdate();
  }, [closeUpdateDialog, resetUpdate]);

  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  const renderRow = useCallback(
    (row) => [
      <Typography key={`name-${row.id}`} fontWeight={500} variant="body2">
        {row.name}
      </Typography>,
      <Typography key={`phone-${row.id}`} variant="body2" color="text.secondary">
        {row.phone || "—"}
      </Typography>,
      <Typography key={`vehicles-${row.id}`} variant="body2" fontWeight={500}>
        {row.totalVehicles}
      </Typography>,
      <Typography key={`orders-${row.id}`} variant="body2" fontWeight={500}>
        {row.totalOrders}
      </Typography>,
      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary">
        {formatDateTime(row.createdAt)}
      </Typography>,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip title="Edit Pelanggan">
          <IconButton
            onClick={(e) => handleEditClick(e, row)}
            size="small"
            aria-label="Edit Pelanggan"
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
        </Tooltip>
        <Tooltip title="Hapus Pelanggan">
          <IconButton
            onClick={(e) => handleDeleteClick(e, row)}
            size="small"
            aria-label="Hapus Pelanggan"
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
        </Tooltip>
      </Stack>,
    ],
    [handleEditClick, handleDeleteClick, theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Pelanggan", onClick: handleOpenCreate },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [handleOpenCreate, refetch]
  );

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

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
        emptyStateMessage="Tidak ada pelanggan ditemukan"
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
        searchPlaceholder="Cari pelanggan..."
        searchVal={search}
        subtitle="Kelola data pelanggan terdaftar"
        title="Data Pelanggan"
      />

      <CustomerCreateDialog
        activeStep={activeStep}
        control={createControl}
        handleSubmit={handleCreateSubmit}
        onBack={handleBack}
        onClose={handleCloseCreate}
        onNext={handleNext}
        open={dialogOpen}
        trigger={trigger}
        formState={createFormState}
      />

      <CustomerUpdateDialog
        control={updateControl}
        customer={updateDialog.customer}
        formState={updateFormState}
        handleSubmit={handleUpdateSubmit}
        onClose={handleCloseUpdate}
        open={updateDialog.open}
      />

      <CustomerDeleteDialog
        customer={deleteDialog.customer}
        onClose={closeDeleteDialog}
        open={deleteDialog.open}
      />

      <CustomerDetailDialog
        customerId={detailDialog.customerId}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default Customers;