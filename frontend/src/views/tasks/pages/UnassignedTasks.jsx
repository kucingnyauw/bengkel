/**
 * UnassignedTasks - Komponen halaman untuk melihat pesanan yang membutuhkan penugasan mekanik.
 *
 * @component
 * @returns {JSX.Element} Halaman tugas belum ditugaskan
 */
import { useCallback, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Box, Chip, Typography, useTheme } from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { useUnassignedTasksQuery } from "@views/tasks/hooks";

const UnassignedTasks = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ limit, page, search: debouncedSearch }),
    [limit, page, debouncedSearch]
  );

  const { data, isLoading, refetch } = useUnassignedTasksQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Render baris kustom
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`order-${row.orderId}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.orderNumber}
      </Typography>,

      <Box key={`services-${row.orderId}`}>
        {row.services?.slice(0, 2).map((s, i) => (
          <Typography
            key={i}
            variant="body2"
            sx={{
              fontWeight: 400,
              maxWidth: 250,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {s.name}
          </Typography>
        ))}
        {row.services?.length > 2 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            +{row.services.length - 2} layanan lainnya
          </Typography>
        )}
        {(!row.services || row.services.length === 0) && (
          <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 400 }}>
            —
          </Typography>
        )}
      </Box>,

      <Typography key={`count-${row.orderId}`} variant="body2" sx={{ fontWeight: 400, textAlign: "center" }}>
        {row.services?.length || 0}
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

      <Typography key={`date-${row.orderId}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.createdAt)}
      </Typography>,
    ],
    []
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
    <AppTable
      actions={tableActions}
      count={metadata.totalPages || 0}
      data={tableData}
      emptyStateMessage="Tidak ada tugas yang belum ditugaskan"
      headers={[
        "No. Order",
        "Layanan",
        "Jumlah",
        "Status",
        "Customer",
        "Kendaraan",
        "Tanggal",
      ]}
      isLoading={isLoading}
      onChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onSearchChange={onSearchChange}
      page={metadata.currentPage || page}
      renderRow={renderRow}
      rowsPerPage={limit}
      rowsPerPageOptions={[5, 10, 25, 50]}
      searchPlaceholder="Cari pesanan..."
      searchVal={search}
      subtitle="Pesanan yang membutuhkan mekanik"
      title="Tugas Yang Belum Ditugaskan"
    />
  );
};

export default UnassignedTasks;