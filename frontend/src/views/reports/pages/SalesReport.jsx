/**
 * SalesReport - Sales report page with charts, summary cards, and daily breakdown table.
 *
 * @component
 * @returns {JSX.Element} Rendered sales report page
 */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Filter,
  Percent,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  X,
} from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, LineChart, SummaryCard } from "@components";
import { useSalesSummaryReport } from "@views/reports/hooks";

const SalesReport = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = useSalesSummaryReport(params);

  const handleOpenFilter = () => setFilterOpen(true);
  const handleCloseFilter = () => setFilterOpen(false);

  const handleApplyFilter = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    handleCloseFilter();
  };

  const handleResetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setAppliedStartDate(null);
    setAppliedEndDate(null);
    handleCloseFilter();
  };

  const isFilterActive = appliedStartDate || appliedEndDate;

  const dailySalesChartData = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.dailyBreakdown.map((d) => d.totalSales),
          label: "Total Penjualan",
          backgroundColor: alpha(theme.palette.text.primary, 0.8),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: data.dailyBreakdown.map((d) =>
        formatDate(d.date, { dateStyle: "medium" })
      ),
    };
  }, [data, theme]);

  const orderCountChartData = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.dailyBreakdown.map((d) => d.orderCount),
          label: "Jumlah Pesanan",
          borderColor: theme.palette.text.primary,
          backgroundColor: alpha(theme.palette.text.primary, 0.08),
          pointBackgroundColor: theme.palette.text.primary,
          pointBorderColor: theme.palette.background.paper,
          fill: true,
        },
      ],
      labels: data.dailyBreakdown.map((d) =>
        formatDate(d.date, { dateStyle: "medium" })
      ),
    };
  }, [data, theme]);

  const aovChartData = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.dailyBreakdown.map((d) => d.averageOrderValue),
          label: "Rata-rata Nilai Pesanan",
          borderColor: alpha(theme.palette.text.primary, 0.6),
          backgroundColor: alpha(theme.palette.text.primary, 0.04),
          pointBackgroundColor: alpha(theme.palette.text.primary, 0.6),
          pointBorderColor: theme.palette.background.paper,
          fill: true,
        },
      ],
      labels: data.dailyBreakdown.map((d) =>
        formatDate(d.date, { dateStyle: "medium" })
      ),
    };
  }, [data, theme]);

  const averageOrderValue = useMemo(() => {
    if (!data?.summary?.totalOrders || !data?.summary?.totalSales) return 0;
    return data.summary.totalSales / data.summary.totalOrders;
  }, [data]);

  const bestDay = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return null;
    return data.dailyBreakdown.reduce((prev, current) =>
      prev.totalSales > current.totalSales ? prev : current
    );
  }, [data]);

  const worstDay = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return null;
    return data.dailyBreakdown.reduce((prev, current) =>
      prev.totalSales < current.totalSales ? prev : current
    );
  }, [data]);

  const periodText = useMemo(() => {
    if (appliedStartDate && appliedEndDate)
      return `${formatDate(appliedStartDate)} - ${formatDate(appliedEndDate)}`;
    if (appliedStartDate) return `Dari ${formatDate(appliedStartDate)}`;
    if (appliedEndDate) return `Sampai ${formatDate(appliedEndDate)}`;
    return "Semua periode";
  }, [appliedStartDate, appliedEndDate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: 3,
        }}
      >
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Skeleton width={280} height={36} />
                <Skeleton width={180} height={20} sx={{ mt: 1 }} />
              </Box>
              <Stack direction="row" sx={{ gap: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Stack>
            </Stack>
          </Card>
        </Box>
        {[1, 2, 3, 4].map((item) => (
          <Box
            key={item}
            sx={{ gridColumn: { lg: "span 3", md: "span 6", xs: "span 12" } }}
          >
            <Card sx={{ p: 2.5 }}>
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={32} />
                <Skeleton width="50%" height={14} />
              </Stack>
            </Card>
          </Box>
        ))}
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant="rounded" width="100%" height={360} />
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ gridColumn: "span 12" }}>
        <Card sx={{ overflow: "hidden", position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              right: theme.spacing(-6),
              top: theme.spacing(-6),
              width: theme.spacing(20),
              height: theme.spacing(20),
              borderRadius: "50%",
              backgroundColor: alpha(theme.palette.text.primary, 0.03),
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: theme.spacing(-3),
              bottom: theme.spacing(-3),
              width: theme.spacing(14),
              height: theme.spacing(14),
              borderRadius: "50%",
              backgroundColor: alpha(theme.palette.text.primary, 0.04),
              zIndex: 0,
            }}
          />
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2.5,
              p: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Stack sx={{ gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Laporan Penjualan
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Pantau performa penjualan harian
                </Typography>
              </Box>
              <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={periodText}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: alpha(theme.palette.divider, 0.8),
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    px: 0.5,
                    py: 0.5,
                    height: 28,
                    "& .MuiChip-label": { px: 1, fontSize: "0.75rem" },
                  }}
                />
                {isFilterActive && (
                  <Chip
                    label="Filter aktif"
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      px: 0.5,
                      py: 0.5,
                      height: 28,
                      "& .MuiChip-label": {
                        px: 1,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      },
                    }}
                  />
                )}
              </Stack>
            </Stack>
            <Stack direction="row" sx={{ gap: 0.5 }}>
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => refetch()}
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    color: theme.palette.text.secondary,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(4px)",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.text.primary, 0.06),
                      borderColor: theme.palette.text.primary,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <RotateCcw size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter periode">
                <IconButton
                  onClick={handleOpenFilter}
                  sx={{
                    border: "1px solid",
                    borderColor: isFilterActive
                      ? alpha(theme.palette.primary.main, 0.4)
                      : alpha(theme.palette.divider, 0.8),
                    color: isFilterActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    bgcolor: isFilterActive
                      ? alpha(theme.palette.primary.main, 0.06)
                      : alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(4px)",
                    "&:hover": {
                      bgcolor: isFilterActive
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.06),
                      borderColor: isFilterActive
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      color: isFilterActive
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    },
                  }}
                >
                  <Filter size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {!data?.dailyBreakdown?.length ? (
        <Box sx={{ gridColumn: "span 12" }}>
          <Card
            sx={{
              minHeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 6,
            }}
          >
            <Stack sx={{ gap: 3, alignItems: "center", textAlign: "center" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Receipt size={32} style={{ opacity: 0.3 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Belum Ada Data Penjualan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tidak ditemukan transaksi pada periode ini.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={handleOpenFilter}>
                Atur Filter
              </Button>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={ShoppingCart}
              subtitle={`${data.summary.totalOrders} transaksi`}
              title="Total Pesanan"
              value={data.summary.totalOrders}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={DollarSign}
              subtitle={`Subtotal: ${formatToIdr(data.summary.totalSubtotal)}`}
              title="Total Penjualan"
              value={formatToIdr(data.summary.totalSales)}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={TrendingUp}
              subtitle="Rata-rata per pesanan"
              title="AOV"
              value={formatToIdr(averageOrderValue)}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={Percent}
              subtitle={`${data.summary.totalOrders} transaksi`}
              title="Total Pajak"
              value={formatToIdr(data.summary.totalTax)}
            />
          </Box>

          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Penjualan Harian
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Total penjualan harian selama periode
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={dailySalesChartData.datasets}
                  height={360}
                  labels={dailySalesChartData.labels}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Tren Pesanan
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Fluktuasi jumlah transaksi harian
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <LineChart
                    area
                    datasets={orderCountChartData.datasets}
                    height={280}
                    labels={orderCountChartData.labels}
                    legend={false}
                  />
                </Box>
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Tren Nilai Pesanan
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Fluktuasi rata-rata nilai transaksi
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <LineChart
                    area
                    datasets={aovChartData.datasets}
                    height={280}
                    labels={aovChartData.labels}
                    legend={false}
                    isCurrency
                  />
                </Box>
              </Box>
            </Card>
          </Box>

          {bestDay && worstDay && (
            <>
              <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
                <Card sx={{ overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: 3,
                      bgcolor: alpha(theme.palette.text.primary, 0.8),
                    }}
                  />
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 3,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ gap: 2.5, alignItems: "center" }}
                    >
                      <ArrowUp size={20} />
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Penjualan Tertinggi
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {formatDate(bestDay.date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h6" fontWeight={700}>
                        {formatToIdr(bestDay.totalSales)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bestDay.orderCount} pesanan
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Box>
              <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
                <Card sx={{ overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: 3,
                      bgcolor: alpha(theme.palette.text.primary, 0.25),
                    }}
                  />
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 3,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ gap: 2.5, alignItems: "center" }}
                    >
                      <ArrowDown size={20} />
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Penjualan Terendah
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {formatDate(worstDay.date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        {formatToIdr(worstDay.totalSales)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {worstDay.orderCount} pesanan
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Box>
            </>
          )}

          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Detail Harian
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Breakdown performa penjualan harian
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {[
                        "Tanggal",
                        "Pesanan",
                        "Total Penjualan",
                        "Rata-rata",
                        "Performa",
                      ].map((item) => (
                        <TableCell key={item}>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.secondary"
                            sx={{
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {item}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.dailyBreakdown.map((day, index) => {
                      const dayOfWeek = new Intl.DateTimeFormat("id-ID", {
                        weekday: "long",
                      }).format(new Date(day.date));
                      const isBest = bestDay?.date === day.date;
                      const isWorst = worstDay?.date === day.date;
                      const isLast = index === data.dailyBreakdown.length - 1;

                      return (
                        <TableRow
                          key={day.date}
                          hover
                          sx={{
                            "& td": {
                              borderBottom: isLast
                                ? 0
                                : `1px solid ${alpha(
                                    theme.palette.divider,
                                    0.5
                                  )}`,
                              py: 2,
                            },
                          }}
                        >
                          <TableCell>
                            <Stack
                              direction="row"
                              sx={{ gap: 2, alignItems: "center" }}
                            >
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: `${theme.shape.borderRadius}px`,
                                  bgcolor: alpha(
                                    theme.palette.text.primary,
                                    0.06
                                  ),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: theme.palette.text.secondary,
                                  flexShrink: 0,
                                }}
                              >
                                {new Date(day.date).getDate()}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatDate(day.date)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {dayOfWeek}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {day.orderCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {formatToIdr(day.totalSales)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatToIdr(day.averageOrderValue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isBest ? (
                              <Chip
                                label="Tertinggi"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: alpha(
                                    theme.palette.text.primary,
                                    0.4
                                  ),
                                  color: theme.palette.text.primary,
                                  bgcolor: alpha(
                                    theme.palette.text.primary,
                                    0.06
                                  ),
                                  height: 24,
                                  "& .MuiChip-label": {
                                    px: 1,
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                            ) : isWorst ? (
                              <Chip
                                label="Terendah"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: alpha(
                                    theme.palette.text.primary,
                                    0.2
                                  ),
                                  color: alpha(theme.palette.text.primary, 0.5),
                                  bgcolor: alpha(
                                    theme.palette.text.primary,
                                    0.03
                                  ),
                                  height: 24,
                                  "& .MuiChip-label": {
                                    px: 1,
                                    fontSize: "0.6875rem",
                                  },
                                }}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </>
      )}

      <Dialog
        maxWidth="xs"
        fullWidth
        open={filterOpen}
        onClose={handleCloseFilter}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            pt: 2.5,
            pb: 2,
          }}
        >
          Filter Periode
          <IconButton onClick={handleCloseFilter}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Stack sx={{ gap: 2.5 }}>
            <MobileDatePicker
              label="Dari Tanggal"
              value={startDate}
              onChange={(val) => setStartDate(val)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <MobileDatePicker
              label="Sampai Tanggal"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleResetFilter}
          >
            Reset
          </Button>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleCloseFilter}
            >
              Batal
            </Button>
            <Button variant="contained" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesReport;
