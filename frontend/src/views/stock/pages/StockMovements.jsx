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
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

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

  /**
   * Table headers configuration
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "Produk",
      "Tipe",
      "Sumber",
      "Jumlah",
      "Catatan",
      "Dicatat Oleh",
      "Tanggal",
      "Aksi",
    ],
    []
  );

  /**
   * Query parameters for stock movements
   * @type {Object}
   */
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
   * @type {Function}
   */
  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  /**
   * Handle reset filter and reset to first page
   * @type {Function}
   */
  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  /**
   * Handle open create dialog for stock movement
   * @type {Function}
   * @param {string} type - Movement type ("in", "out", or "adjustment")
   */
  const handleOpenCreate = useCallback(
    (type) => {
      openCreateDialog(type);
    },
    [openCreateDialog]
  );

  /**
   * Handle close create dialog
   * @type {Function}
   */
  const handleCloseCreate = useCallback(() => {
    closeCreateDialog();
  }, [closeCreateDialog]);

  /**
   * Handle row double click to open detail dialog
   * @type {Function}
   * @param {Object} row - Stock movement row data
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Handle delete button click
   * @type {Function}
   * @param {Object} row - Stock movement row data
   */
  const handleDeleteClick = useCallback(
    (row) => {
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Custom row renderer for stock movements table
   * @type {Function}
   * @param {Object} row - Stock movement data
   * @returns {JSX.Element[]} Array of cell components
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`product-${row.id}`} fontWeight={500} variant="body2">
        {row.product?.name || "-"}
      </Typography>,
      <Chip
        key={`type-${row.id}`}
        color={stockMovementTypeColorMap[row.type] || "default"}
        label={row.type}
        size="small"
        variant="outlined"
      />,
      <Typography key={`source-${row.id}`} variant="body2">
        {row.sourceType}
      </Typography>,
      <Typography
        key={`qty-${row.id}`}
        fontWeight={500}
        variant="body2"
        color={row.quantity > 0 ? "success.main" : "error.main"}
      >
        {row.quantity > 0 ? "+" : ""}
        {row.quantity}
      </Typography>,
      <Typography
        key={`note-${row.id}`}
        variant="body2"
        sx={{
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.note || "-"}
      </Typography>,
      <Typography key={`user-${row.id}`} variant="body2">
        {row.recordedBy?.fullName || "-"}
      </Typography>,
      <Typography key={`date-${row.id}`} variant="body2">
        {formatDateTime(row.createdAt)}
      </Typography>,
      <Stack key={`action-${row.id}`} direction="row" spacing={0.5}>
        <Tooltip title="Hapus">
          <span>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              size="small"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: theme.palette.error.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  borderColor: theme.palette.error.main,
                },
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>,
    ],
    [handleDeleteClick, theme]
  );

  /**
   * Table action buttons configuration
   * @type {Object[]}
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
   * @type {Function}
   * @param {Event} event - Change event
   * @param {number} newPage - New page number
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handle rows per page change
   * @type {Function}
   * @param {number} newLimit - New rows per page value
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handle search input change
   * @type {Function}
   * @param {Event} e - Input change event
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
        emptyStateIcon={SlidersHorizontal}
        emptyStateMessage="Tidak ada mutasi stok ditemukan"
        headers={headers}
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