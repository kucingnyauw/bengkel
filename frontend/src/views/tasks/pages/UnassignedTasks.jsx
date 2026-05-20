/**
 * UnassignedTasks - Komponen halaman untuk melihat pesanan yang membutuhkan penugasan mekanik.
 *
 * @component
 * @returns {JSX.Element} Halaman tugas belum ditugaskan
 */
import { useCallback, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Chip, Typography } from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { useUnassignedTasksQuery } from "@views/tasks/hooks";

const UnassignedTasks = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  /**
   * Konfigurasi header tabel
   * @type {string[]}
   */
  const headers = useMemo(
    () => [
      "No. Order",
      "Layanan",
      "Jumlah",
      "Status",
      "Customer",
      "Kendaraan",
      "Tanggal",
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

  const { data, isLoading, refetch } = useUnassignedTasksQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  /**
   * Render baris kustom
   * @param {Object} row - Data tugas
   * @returns {JSX.Element[]} Array komponen sel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`order-${row.orderId}`} fontWeight={500} variant="body2">
        {row.orderNumber}
      </Typography>,
      <Typography
        key={`services-${row.orderId}`}
        variant="body2"
        noWrap
        sx={{ maxWidth: 250 }}
      >
        {row.services?.map((s) => s.name).join(", ") || "—"}
      </Typography>,
      <Typography
        key={`count-${row.orderId}`}
        variant="body2"
        textAlign="center"
      >
        {row.services?.length || 0}
      </Typography>,
      <Chip
        key={`status-${row.orderId}`}
        color={statusColorMap[row.status] || "default"}
        label={normalizeEnumText(OrderStatus[row.status] || row.status)}
        size="small"
        variant="outlined"
      />,
      <Typography key={`customer-${row.orderId}`} variant="body2">
        {row.customer?.name || "—"}
      </Typography>,
      <Typography key={`vehicle-${row.orderId}`} variant="body2">
        {row.vehicle?.plateNumber || "—"}
      </Typography>,
      <Typography key={`date-${row.orderId}`} variant="body2">
        {formatDateTime(row.createdAt)}
      </Typography>,
    ],
    []
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
    <AppTable
      actions={tableActions}
      count={metadata.totalPages || 0}
      data={tableData}
      emptyStateMessage="Tidak ada tugas yang belum ditugaskan"
      headers={headers}
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