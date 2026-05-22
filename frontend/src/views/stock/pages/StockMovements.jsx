/**
 * StockMovements - Page component for managing stock movements, adjustments, and inventory tracking.
 *
 * @component
 * @returns {JSX.Element} Rendered stock movements management page
 */
import { useCallback, useMemo, useState } from "react";
import {
  ListFilter,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
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
import { stockMovementTypeColorMap } from "@shared/constant";
import { formatDateTime } from "@shared/utils";
import {
  StockAdjustmentDialog,
  StockDeleteDialog,
  StockFilterDialog,
  StockInDialog,
  StockMovementDetailDialog,
  StockOutDialog,
} from "@views/stock/components";
import {
  useStockDialog,
  useStockFilters,
  useStockMovementsQuery,
} from "@views/stock/hooks";

const StockMovements = () => {
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
  } = useStockFilters();

  const {
    deleteDialog,
    detailDialog,
    dialogOpen,
    dialogType,
    closeCreateDialog,
    closeDeleteDialog,
    closeDetailDialog,
    openCreateDialog,
    openDeleteDialog,
    openDetailDialog,
  } = useStockDialog();

  const params = useMemo(
    () => ({
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      limit,
      page,
      productId: activeFilters.productId || undefined,
      search: debouncedSearch,
      sourceType: activeFilters.sourceType || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      type: activeFilters.type || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useStockMovementsQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Handle apply filter and reset to first page
   */
  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  /**
   * Handle reset filter and reset to first page
   */
  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  /**
   * Handle open create dialog for stock movement
   */
  const handleOpenCreate = useCallback(
    (type) => {
      openCreateDialog(type);
    },
    [openCreateDialog]
  );

  /**
   * Handle close create dialog
   */
  const handleCloseCreate = useCallback(() => {
    closeCreateDialog();
  }, [closeCreateDialog]);

  /**
   * Handle row double click to open detail dialog
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback(
    (row) => {
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Custom row renderer for stock movements table
   */
  const renderRow = useCallback(
    (row) => [
      <Box key={`product-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {row.product?.name || "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
          SKU: {row.product?.sku || "—"} · Stok: {row.product?.stock ?? 0}
        </Typography>
      </Box>,

      <Chip
        key={`type-${row.id}`}
        color={stockMovementTypeColorMap[row.type] || "default"}
        label={row.type === "IN" ? "Masuk" : row.type === "OUT" ? "Keluar" : "Adjustment"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography key={`source-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.sourceType === "SALE" && "Penjualan"}
        {row.sourceType === "PURCHASE" && "Pembelian"}
        {row.sourceType === "MANUAL" && "Manual"}
        {row.sourceType === "RETURN" && "Retur"}
        {row.sourceType === "ADJUSTMENT" && "Penyesuaian"}
        {!["SALE", "PURCHASE", "MANUAL", "RETURN", "ADJUSTMENT"].includes(row.sourceType) && (row.sourceType || "—")}
      </Typography>,

      <Typography
        key={`qty-${row.id}`}
        variant="body2"
        color={row.type === "IN" ? "success.main" : "error.main"}
        sx={{ fontWeight: 400 }}
      >
        {row.type === "IN" ? "+" : ""}
        {row.quantity}
      </Typography>,

      <Box key={`note-${row.id}`}>
        <Typography
          variant="body2"
          sx={{
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 400,
          }}
        >
          {row.note || "—"}
        </Typography>
        {row.orderItem?.order?.orderNumber && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            {row.orderItem.order.orderNumber}
          </Typography>
        )}
      </Box>,

      <Typography key={`user-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.recordedBy?.fullName || "—"}
      </Typography>,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Hapus">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              size="small"
              aria-label="Hapus"
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
                  bgcolor: alpha(theme.palette.error.main, 0.06),
                  borderColor: alpha(theme.palette.error.main, 0.4),
                  color: theme.palette.error.main,
                },
              }}
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleDeleteClick, theme]
  );

  /**
   * Table action buttons configuration
   */
  const tableActions = useMemo(
    () => [
      {
        icon: Plus,
        label: "Stok Masuk",
        onClick: () => handleOpenCreate("in"),
      },
      {
        icon: Minus,
        label: "Stok Keluar",
        onClick: () => handleOpenCreate("out"),
      },
      {
        icon: SlidersHorizontal,
        label: "Penyesuaian",
        onClick: () => handleOpenCreate("adjustment"),
      },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [handleOpenCreate, openFilter, refetch]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handle rows per page change
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handle search input change
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
        emptyStateMessage="Tidak ada mutasi stok ditemukan"
        headers={[
          "Produk",
          "Tipe",
          "Sumber",
          "Jumlah",
          "Catatan",
          "Dicatat Oleh",
          "Tanggal",
          "Aksi",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={page}
        renderRow={renderRow}
        rowsPerPage={limit}
        searchPlaceholder="Cari mutasi stok..."
        searchVal={search}
        subtitle="Catat dan pantau mutasi stok produk"
        title="Mutasi Stok"
      />

      <StockFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <StockMovementDetailDialog
        movementId={detailDialog.movementId}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />

      <StockInDialog
        onClose={handleCloseCreate}
        open={dialogOpen && dialogType === "in"}
      />

      <StockOutDialog
        onClose={handleCloseCreate}
        open={dialogOpen && dialogType === "out"}
      />

      <StockAdjustmentDialog
        onClose={handleCloseCreate}
        open={dialogOpen && dialogType === "adjustment"}
      />

      <StockDeleteDialog
        movement={deleteDialog.movement}
        onClose={closeDeleteDialog}
        open={deleteDialog.open}
      />
    </>
  );
};

export default StockMovements;