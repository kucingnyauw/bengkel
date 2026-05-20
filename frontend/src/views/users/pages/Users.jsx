/**
 * Users - Komponen halaman untuk mengelola data karyawan dengan operasi CRUD dan manajemen user.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen karyawan
 */
import { useCallback, useMemo, useState } from "react";
import {
  FilePenLine,
  ListFilter,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
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
import { roleColorMap } from "@shared/constant";
import { formatDateTime, normalizeEnumText } from "@shared/utils";
import {
  DeleteUserDialog,
  UserFilterDialog,
  UserResendDialog,
  UserDetailDialog,
  UserFormDialog,
} from "@views/users/components";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
  useUserDialogs,
  useUserFilters,
} from "@views/users/hooks";

const Users = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useUserFilters();
  const {
    createDialog,
    editDialog,
    deleteDialog,
    resendDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openResendDialog,
    closeResendDialog,
    openDetailDialog,
    closeDetailDialog,
  } = useUserDialogs();

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "Nama",
      "Email",
      "Telepon",
      "Role",
      "Status",
      "Verifikasi",
      "Bergabung",
      "Aksi",
    ],
    []
  );

  /**
   * Parameter query
   * @type {Object}
   */
  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      isActive:
        activeFilters.isActive !== ""
          ? activeFilters.isActive === "true"
          : undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useUsersQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();

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
   * Handle create user
   * @param {Object} formData - Data form user
   */
  const handleCreateUser = useCallback(
    (formData) => {
      createUserMutation.mutate(
        {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          role: formData.role,
        },
        { onSuccess: () => closeCreateDialog() }
      );
    },
    [createUserMutation, closeCreateDialog]
  );

  /**
   * Handle update user
   * @param {Object} formData - Data form user
   */
  const handleUpdateUser = useCallback(
    (formData) => {
      if (!editDialog.user) return;
      updateUserMutation.mutate(
        {
          id: editDialog.user.id,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          role: formData.role,
          isActive: formData.isActive,
        },
        { onSuccess: () => closeEditDialog() }
      );
    },
    [updateUserMutation, editDialog.user, closeEditDialog]
  );

  /**
   * Handle kirim ulang magic link
   * @param {Event} e - Event klik
   * @param {Object} user - Data user
   */
  const handleResendClick = useCallback(
    (e, user) => {
      e.stopPropagation();
      openResendDialog(user);
    },
    [openResendDialog]
  );

  /**
   * Handle klik tombol edit
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris user
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openEditDialog(row);
    },
    [openEditDialog]
  );

  /**
   * Handle klik tombol hapus
   * @param {Event} e - Event klik
   * @param {Object} row - Data baris user
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
   * @param {Object} row - Data baris user
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  /**
   * Render baris kustom untuk tabel user
   * @param {Object} row - Data user
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`name-${row.id}`} variant="body2" fontWeight={600}>
        {row.fullName}
      </Typography>,
      <Typography key={`email-${row.id}`} variant="body2" color="text.secondary">
        {row.email}
      </Typography>,
      <Typography key={`phone-${row.id}`} variant="body2">
        {row.phone || "—"}
      </Typography>,
      <Chip
        key={`role-${row.id}`}
        label={normalizeEnumText(row.role)}
        size="small"
        color={roleColorMap[row.role] || "default"}
        variant="outlined"
      />,
      <Chip
        key={`status-${row.id}`}
        label={row.isActive ? "Aktif" : "Nonaktif"}
        color={row.isActive ? "success" : "default"}
        size="small"
        variant="outlined"
      />,
      <Chip
        key={`auth-${row.id}`}
        label={row.isAuthenticated ? "Terverifikasi" : "Pending"}
        color={row.isAuthenticated ? "success" : "warning"}
        size="small"
        variant="outlined"
      />,
      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary">
        {formatDateTime(row.createdAt)}
      </Typography>,
      <Stack key={`actions-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip
          title={
            row.isAuthenticated
              ? "Sudah terverifikasi"
              : "Kirim Ulang Magic Link"
          }
        >
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              disabled={row.isAuthenticated}
              onClick={(e) => handleResendClick(e, row)}
              aria-label="Kirim Ulang Magic Link"
              sx={{
                border: "1px solid",
                borderColor: row.isAuthenticated
                  ? alpha(theme.palette.divider, 0.5)
                  : alpha(theme.palette.divider, 0.8),
                bgcolor: row.isAuthenticated
                  ? "transparent"
                  : alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(4px)",
                color: row.isAuthenticated
                  ? theme.palette.action.disabled
                  : theme.palette.text.secondary,
                transition: theme.transitions.create(["background-color", "border-color", "color"], {
                  duration: theme.transitions.duration.shorter,
                }),
                "&:hover": row.isAuthenticated
                  ? {}
                  : {
                      bgcolor: alpha(theme.palette.text.primary, 0.06),
                      borderColor: theme.palette.text.primary,
                      color: theme.palette.text.primary,
                    },
              }}
            >
              <Send size={16} />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="Edit Karyawan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              onClick={(e) => handleEditClick(e, row)}
              aria-label="Edit Karyawan"
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
        <Tooltip title="Hapus Karyawan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              onClick={(e) => handleDeleteClick(e, row)}
              aria-label="Hapus Karyawan"
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
    [handleEditClick, handleDeleteClick, handleResendClick, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   * @type {Object[]}
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Karyawan", onClick: openCreateDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openCreateDialog, openFilter, refetch]
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
        emptyStateMessage="Tidak ada karyawan ditemukan"
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
        searchPlaceholder="Cari karyawan..."
        searchVal={search}
        subtitle="Kelola data karyawan bengkel"
        title="Daftar Karyawan"
      />

      <UserFilterDialog
        open={filterOpen}
        tempFilters={tempFilters}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      <UserFormDialog
        open={createDialog}
        onClose={closeCreateDialog}
        onSubmit={handleCreateUser}
        isPending={createUserMutation.isPending}
        type="create"
      />

      <UserFormDialog
        open={editDialog.open}
        user={editDialog.user}
        onClose={closeEditDialog}
        onSubmit={handleUpdateUser}
        isPending={updateUserMutation.isPending}
        type="edit"
      />

      <DeleteUserDialog
        open={deleteDialog.open}
        user={deleteDialog.user}
        onClose={closeDeleteDialog}
      />

      <UserResendDialog
        open={resendDialog.open}
        user={resendDialog.user}
        onClose={closeResendDialog}
      />

      <UserDetailDialog
        open={detailDialog.open}
        userId={detailDialog.userId}
        onClose={closeDetailDialog}
      />
    </>
  );
};

export default Users;