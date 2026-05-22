/**
 * SalesReport - Sales report page with charts, summary cards, and daily breakdown table.
 *
 * @component
 * @returns {JSX.Element} Rendered sales report page
 */
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, LineChart, SummaryCard } from "@components";
import { useSalesSummaryReport } from "@views/reports/hooks";
import { ReportHeader, ReportFilterDialog } from "@views/reports/components";

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
          backgroundColor: alpha(theme.palette.secondary.main, 0.8),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: data.dailyBreakdown.map((d) => formatDate(d.date, { dateStyle: "medium" })),
    };
  }, [data, theme]);

  const orderCountChartData = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.dailyBreakdown.map((d) => d.orderCount),
          label: "Jumlah Pesanan",
          borderColor: theme.palette.secondary.main,
          backgroundColor: alpha(theme.palette.secondary.main, 0.08),
          pointBackgroundColor: theme.palette.secondary.main,
          pointBorderColor: theme.palette.background.paper,
          fill: true,
        },
      ],
      labels: data.dailyBreakdown.map((d) => formatDate(d.date, { dateStyle: "medium" })),
    };
  }, [data, theme]);

  const aovChartData = useMemo(() => {
    if (!data?.dailyBreakdown?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.dailyBreakdown.map((d) => d.averageOrderValue),
          label: "Rata-rata Nilai Pesanan",
          borderColor: alpha(theme.palette.secondary.main, 0.6),
          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
          pointBackgroundColor: alpha(theme.palette.secondary.main, 0.6),
          pointBorderColor: theme.palette.background.paper,
          fill: true,
        },
      ],
      labels: data.dailyBreakdown.map((d) => formatDate(d.date, { dateStyle: "medium" })),
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
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
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
          <Box key={item} sx={{ gridColumn: { lg: "span 3", md: "span 6", xs: "span 12" } }}>
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
      <Box sx={{ gridColumn: "span 12" }}>
        <ReportHeader
          title="Laporan Penjualan"
          subtitle="Pantau performa penjualan harian"
          periodText={periodText}
          isFilterActive={isFilterActive}
          onRefresh={() => refetch()}
          onOpenFilter={handleOpenFilter}
        />
      </Box>

      {!data?.dailyBreakdown?.length ? (
        <Box sx={{ gridColumn: "span 12" }}>
          <Card
            sx={{
              minHeight: 360,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 6,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
            }}
          >
            <Stack sx={{ gap: 2.5, alignItems: "center", textAlign: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 400 }}>
                  Belum Ada Data Penjualan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ditemukan transaksi pada periode ini.
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={ShoppingCart}
              subtitle={`${data.summary.totalOrders} transaksi`}
              title="Total Pesanan"
              value={data.summary.totalOrders}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={DollarSign}
              subtitle={`Subtotal: ${formatToIdr(data.summary.totalSubtotal)}`}
              title="Total Penjualan"
              value={formatToIdr(data.summary.totalSales)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={TrendingUp}
              subtitle="Rata-rata per pesanan"
              title="AOV"
              value={formatToIdr(averageOrderValue)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={Percent}
              subtitle={`${data.summary.totalOrders} transaksi`}
              title="Total Pajak"
              value={formatToIdr(data.summary.totalTax)}
            />
          </Box>

          <Box sx={{ gridColumn: "span 12" }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Penjualan Harian
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
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
            <Card
              sx={{
                height: "100%",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Tren Pesanan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Fluktuasi jumlah transaksi harian
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <LineChart
                    area
                    datasets={orderCountChartData.datasets}
                    height={300}
                    labels={orderCountChartData.labels}
                    legend={false}
                  />
                </Box>
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card
              sx={{
                height: "100%",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Tren Nilai Pesanan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Fluktuasi rata-rata nilai transaksi
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <LineChart
                    area
                    datasets={aovChartData.datasets}
                    height={300}
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
                <Card
                  sx={{
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <Box sx={{ height: 2, bgcolor: alpha(theme.palette.success.main, 0.6) }} />
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", p: 3 }}>
                    <Stack direction="row" sx={{ gap: 2.5, alignItems: "center" }}>
                      <ArrowUp size={18} strokeWidth={1.5} color={theme.palette.success.main} />
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Penjualan Tertinggi
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                          {formatDate(bestDay.date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h6" sx={{ fontWeight: 400 }}>
                        {formatToIdr(bestDay.totalSales)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {bestDay.orderCount} pesanan
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Box>
              <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
                <Card
                  sx={{
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                  }}
                >
                  <Box sx={{ height: 2, bgcolor: alpha(theme.palette.error.main, 0.3) }} />
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", p: 3 }}>
                    <Stack direction="row" sx={{ gap: 2.5, alignItems: "center" }}>
                      <ArrowDown size={18} strokeWidth={1.5} color={theme.palette.error.main} />
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Penjualan Terendah
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                          {formatDate(worstDay.date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {formatToIdr(worstDay.totalSales)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {worstDay.orderCount} pesanan
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Box>
            </>
          )}

          <Box sx={{ gridColumn: "span 12" }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Detail Harian
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Breakdown performa penjualan harian
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {["Tanggal", "Pesanan", "Total Penjualan", "Rata-rata", "Performa"].map((item) => (
                        <TableCell key={item}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontWeight: 600,
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
                            "&:hover": {
                              bgcolor: alpha(theme.palette.secondary.main, 0.04),
                            },
                            "& td": {
                              borderBottom: isLast
                                ? 0
                                : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              py: 2,
                            },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: `${theme.shape.borderRadius}px`,
                                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 400,
                                  color: theme.palette.secondary.main,
                                  flexShrink: 0,
                                }}
                              >
                                {new Date(day.date).getDate()}
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                  {formatDate(day.date)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                  {dayOfWeek}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {day.orderCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {formatToIdr(day.totalSales)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
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
                                  borderColor: alpha(theme.palette.success.main, 0.4),
                                  color: theme.palette.success.main,
                                  bgcolor: alpha(theme.palette.success.main, 0.06),
                                  height: 24,
                                  fontWeight: 400,
                                  "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                                }}
                              />
                            ) : isWorst ? (
                              <Chip
                                label="Terendah"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: alpha(theme.palette.error.main, 0.2),
                                  color: theme.palette.error.main,
                                  bgcolor: alpha(theme.palette.error.main, 0.03),
                                  height: 24,
                                  fontWeight: 400,
                                  "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
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

      <ReportFilterDialog
        open={filterOpen}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
        onClose={handleCloseFilter}
      />
    </Box>
  );
};

export default SalesReport;