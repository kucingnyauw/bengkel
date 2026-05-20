/**
 * Pos - Komponen halaman Point of Sale untuk menelusuri dan menambahkan produk ke keranjang.
 *
 * @component
 * @returns {JSX.Element} Halaman produk POS
 */
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ListFilter, RotateCcw, ShoppingCart } from "lucide-react";
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
import { addItem } from "@store/cart/cartSlices.js";
import { formatToIdr } from "@shared/utils";
import { PosProductFilterDialog } from "@views/pos/components";
import {
  usePosProductsQuery,
  usePosProductFilters,
} from "@views/pos/hooks";

const Pos = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
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
  } = usePosProductFilters();

  /**
   * Handle tambah produk ke cart
   */
  const handleAddToCart = useCallback(
    (row) => {
      dispatch(
        addItem({
          productId: row.id,
          productName: row.name,
          quantity: 1,
          maxQuantity: row.stock ?? 99,
          unitPrice: row.price,
          type: row.type,
          productStock: row.stock ?? 0,
          image: row.image || null,
          sku: row.sku || null,
        })
      );
    },
    [dispatch]
  );

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

  const { data, isLoading, refetch } = usePosProductsQuery(params);

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
   * Handler klik baris untuk menambah produk ke cart
   */
  const handleRowClick = useCallback(
    (row) => {
      handleAddToCart(row);
    },
    [handleAddToCart]
  );

  /**
   * Handler klik tombol tambah ke cart
   */
  const handleAddToCartClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleAddToCart(row);
    },
    [handleAddToCart]
  );

  /**
   * Render baris kustom untuk tabel produk POS
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

      <Typography key={`desc-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {row.description || "—"}
      </Typography>,

      <Typography key={`sku-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.sku || "—"}
      </Typography>,

      <Typography key={`price-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.price)}
      </Typography>,

      <Typography key={`cost-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.cost > 0 ? formatToIdr(row.cost) : "—"}
      </Typography>,

      <Typography
        key={`stock-${row.id}`}
        variant="body2"
        color={row.type === "SERVICE" ? "text.disabled" : row.stock > 0 ? "text.primary" : "error.main"}
        sx={{ fontWeight: 400 }}
      >
        {row.type === "SERVICE" ? "—" : row.stock ?? 0}
      </Typography>,

      <Chip
        key={`type-${row.id}`}
        color={row.type === "SERVICE" ? "secondary" : "warning"}
        label={row.type === "SERVICE" ? "Servis" : "Sparepart"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Chip
        key={`status-${row.id}`}
        color={row.isActive ? "success" : "default"}
        label={row.isActive ? "Aktif" : "Nonaktif"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Tambah ke Keranjang">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleAddToCartClick(e, row)}
              size="small"
              aria-label="Tambah ke Keranjang"
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
              <ShoppingCart size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleAddToCartClick, theme]
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
        emptyStateMessage="Tidak ada produk tersedia"
        headers={[
          "Gambar",
          "Nama Produk",
          "Deskripsi",
          "SKU",
          "Harga",
          "HPP",
          "Stok",
          "Tipe",
          "Status",
          "Aksi",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowClick={handleRowClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari produk..."
        searchVal={search}
        subtitle="Pilih produk untuk ditambahkan ke keranjang"
        title="Daftar Produk"
      />

      <PosProductFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />
    </>
  );
};

export default Pos;