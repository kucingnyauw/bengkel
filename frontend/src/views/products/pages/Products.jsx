/**
 * Products - Komponen halaman untuk mengelola inventaris produk dan sparepart.
 *
 * @component
 * @returns {JSX.Element} Halaman manajemen produk
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, ListFilter, Plus, RotateCcw } from "lucide-react";
import {
  Avatar,
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
import { formatDateTime, formatToIdr } from "@shared/utils";
import {
  ProductDetailDialog,
  ProductFilterDialog,
  ProductFormDialog,
} from "@views/products/components";
import {
  useProductDialog,
  useProductFilters,
  useProductsQuery,
} from "@views/products/hooks";

const Products = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const {
    detailDialog,
    dialogMode,
    dialogOpen,
    closeDetailDialog,
    closeFormDialog,
    openCreateDialog,
    openDetailDialog,
    openUpdateDialog,
    selectedProduct,
  } = useProductDialog();
  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useProductFilters();

  const params = useMemo(
    () => ({
      isActive: activeFilters.isActive || undefined,
      limit,
      lowStockThreshold: activeFilters.lowStockThreshold || undefined,
      maxPrice: activeFilters.maxPrice || undefined,
      minPrice: activeFilters.minPrice || undefined,
      page,
      search: debouncedSearch,
      sortBy: activeFilters.sortBy,
      sortOrder: activeFilters.sortOrder,
      type: activeFilters.type || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useProductsQuery(params);

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
   * Buka dialog tambah produk
   */
  const handleOpenCreate = useCallback(() => {
    openCreateDialog();
  }, [openCreateDialog]);

  /**
   * Buka dialog edit produk
   */
  const handleOpenUpdate = useCallback(
    (row) => {
      openUpdateDialog(row);
    },
    [openUpdateDialog]
  );

  /**
   * Handler klik tombol edit
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleOpenUpdate(row);
    },
    [handleOpenUpdate]
  );

  /**
   * Tutup dialog form
   */
  const handleCloseFormDialog = useCallback(() => {
    closeFormDialog();
  }, [closeFormDialog]);

  /**
   * Handler klik ganda baris untuk membuka dialog detail
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Render baris kustom untuk tabel produk
   */
  const renderRow = useCallback(
    (row) => [
      <Avatar
        key={`img-${row.id}`}
        alt={row.name}
        src={row.image?.url || ""}
        variant="rounded"
        sx={{
          width: 40,
          height: 40,
          borderRadius: `${theme.shape.borderRadius}px`,
          bgcolor: !row.image?.url
            ? alpha(theme.palette.secondary.main, 0.08)
            : "transparent",
          color: !row.image?.url
            ? theme.palette.secondary.main
            : "transparent",
          fontSize: "0.875rem",
          fontWeight: 400,
        }}
      >
        {!row.image?.url && row.name?.charAt(0)?.toUpperCase()}
      </Avatar>,

      <Typography key={`name-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.name}
      </Typography>,

      <Typography
        key={`sku-${row.id}`}
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 400 }}
      >
        {row.sku || "—"}
      </Typography>,

      <Chip
        key={`type-${row.id}`}
        color={row.type === "SERVICE" ? "secondary" : "warning"}
        label={row.type === "SERVICE" ? "Servis" : "Sparepart"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography key={`price-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.price)}
      </Typography>,

      <Typography key={`cost-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.cost)}
      </Typography>,

      <Typography
        key={`stock-${row.id}`}
        variant="body2"
        color={
          row.type === "SERVICE"
            ? "text.disabled"
            : row.stock === 0
            ? "error.main"
            : row.stock <= 5
            ? "warning.main"
            : "text.primary"
        }
        sx={{ fontWeight: 400 }}
      >
        {row.type === "SERVICE" ? "—" : row.stock}
      </Typography>,

      <Chip
        key={`status-${row.id}`}
        color={row.isActive ? "success" : "default"}
        label={row.isActive ? "Aktif" : "Nonaktif"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Edit Produk">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleEditClick(e, row)}
              size="small"
              aria-label="Edit Produk"
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
              <FilePenLine size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleEditClick, theme]
  );

  /**
   * Konfigurasi tombol aksi tabel
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Produk", onClick: handleOpenCreate },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [handleOpenCreate, openFilter, refetch]
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
        emptyStateMessage="Tidak ada produk ditemukan"
        headers={[
          "Gambar",
          "Nama Produk",
          "SKU",
          "Tipe",
          "Harga",
          "Modal",
          "Stok",
          "Status",
          "Tanggal",
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
        searchPlaceholder="Cari produk..."
        searchVal={search}
        subtitle="Kelola data produk dan sparepart"
        title="Daftar Produk"
      />

      <ProductFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ProductFormDialog
        mode={dialogMode}
        onClose={handleCloseFormDialog}
        open={dialogOpen}
        selectedProduct={selectedProduct}
      />

      <ProductDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        productId={detailDialog.productId}
      />
    </>
  );
};

export default Products;