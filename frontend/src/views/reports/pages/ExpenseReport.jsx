/**
 * ExpenseReport - Expense report page with charts, summary cards, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered expense report page
 */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  Chip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Banknote,
  Home,
  MoreHorizontal,
  Package,
  TrendingDown,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { useExpenseReport } from "@views/reports/hooks/useReportQuery.js";
import { SummaryCard, BarChart, DoughnutChart } from "@components";
import { ExpenseCategory } from "@shared/constant";
import { ReportHeader, ReportFilterDialog } from "@views/reports/components";

const categoryConfig = {
  [ExpenseCategory.RENT]: { icon: Home, label: "Sewa Tempat" },
  [ExpenseCategory.SALARY]: { icon: Users, label: "Gaji Karyawan" },
  [ExpenseCategory.MAINTENANCE]: { icon: Wrench, label: "Perawatan" },
  [ExpenseCategory.SUPPLIES]: { icon: Package, label: "Perlengkapan" },
  [ExpenseCategory.UTILITIES]: { icon: Zap, label: "Utilitas" },
  [ExpenseCategory.OTHER]: { icon: MoreHorizontal, label: "Lainnya" },
};

const ExpenseReport = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = useExpenseReport(params);

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

  const colors = useMemo(() => {
    return [
      alpha(theme.palette.secondary.main, 0.85),
      alpha(theme.palette.secondary.main, 0.65),
      alpha(theme.palette.secondary.main, 0.45),
      alpha(theme.palette.secondary.main, 0.3),
      alpha(theme.palette.secondary.main, 0.18),
    ];
  }, [theme]);

  const barChartData = useMemo(() => {
    if (!data?.expensesByCategory?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.expensesByCategory.map((item) => item.total),
          label: "Total Pengeluaran",
          backgroundColor: data.expensesByCategory.map(
            (_, i) => colors[i % colors.length]
          ),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: data.expensesByCategory.map(
        (item) => categoryConfig[item.category]?.label || item.category
      ),
    };
  }, [data, theme, colors]);

  const doughnutData = useMemo(() => {
    if (!data?.expensesByCategory?.length)
      return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    return {
      datasets: [
        {
          data: data.expensesByCategory.map((item) => item.total),
          backgroundColor: data.expensesByCategory.map(
            (_, i) => colors[i % colors.length]
          ),
        },
      ],
      labels: data.expensesByCategory.map(
        (item) => categoryConfig[item.category]?.label || item.category
      ),
    };
  }, [data, colors]);

  const totalTransactions = useMemo(
    () =>
      data?.expensesByCategory?.reduce((acc, item) => acc + item.count, 0) || 0,
    [data]
  );

  const averagePerTransaction = useMemo(
    () =>
      !data?.totalExpense || !totalTransactions
        ? 0
        : data.totalExpense / totalTransactions,
    [data, totalTransactions]
  );

  const topCategory = useMemo(() => {
    if (!data?.expensesByCategory?.length) return null;
    return data.expensesByCategory.reduce((prev, current) =>
      prev.total > current.total ? prev : current
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
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
          </Card>
        </Box>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}
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
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={240} height={28} />
            <Skeleton width={320} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={160} height={28} />
            <Skeleton width={200} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="circular" width={220} height={220} sx={{ mx: "auto", mt: 3 }} />
            <Skeleton variant="rounded" width="100%" height={80} sx={{ mt: 3 }} />
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
          title="Laporan Pengeluaran"
          subtitle="Analitik pengeluaran & biaya operasional"
          periodText={periodText}
          isFilterActive={isFilterActive}
          onRefresh={() => refetch()}
          onOpenFilter={handleOpenFilter}
        />
      </Box>

      {!data?.expensesByCategory?.length ? (
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
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Belum Ada Data Pengeluaran
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada transaksi pengeluaran untuk periode ini.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={handleOpenFilter} sx={{ fontWeight: 400 }}>
                Atur Filter
              </Button>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={TrendingDown}
              subtitle={`${totalTransactions} transaksi tercatat`}
              title="Total Pengeluaran"
              value={formatToIdr(data.totalExpense)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={Banknote}
              subtitle="Rata-rata per transaksi"
              title="Rata-rata Pengeluaran"
              value={formatToIdr(averagePerTransaction)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 12", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={
                topCategory?.category
                  ? categoryConfig[topCategory.category]?.icon || TrendingDown
                  : TrendingDown
              }
              subtitle={
                topCategory
                  ? categoryConfig[topCategory.category]?.label || topCategory.category
                  : "Tidak ada data"
              }
              title="Pengeluaran Tertinggi"
              value={topCategory ? formatToIdr(topCategory.total) : "—"}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Pengeluaran per Kategori
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Distribusi total pengeluaran berdasarkan kategori
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={barChartData.datasets}
                  height={320}
                  labels={barChartData.labels}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
            <Card
              sx={{
                height: "100%",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Proporsi Kategori
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Persentase pengeluaran per kategori
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 4 }}>
                  <DoughnutChart
                    datasets={doughnutData.datasets}
                    height={220}
                    labels={doughnutData.labels}
                    isCurrency
                  />
                </Box>
                <Stack sx={{ gap: 1.5 }}>
                  {data.expensesByCategory.map((item, index) => {
                    const config =
                      categoryConfig[item.category] || categoryConfig[ExpenseCategory.OTHER];
                    const resolvedColor = colors[index % colors.length];
                    const percentage =
                      data.totalExpense > 0
                        ? ((item.total / data.totalExpense) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <Stack
                        key={item.category}
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          border: "1px solid",
                          borderColor: alpha(theme.palette.divider, 0.6),
                          borderRadius: `${theme.shape.borderRadius}px`,
                          transition: theme.transitions.create(
                            ["background-color", "border-color"],
                            { duration: theme.transitions.duration.shorter }
                          ),
                          "&:hover": {
                            bgcolor: alpha(resolvedColor, 0.04),
                            borderColor: alpha(resolvedColor, 0.25),
                          },
                        }}
                      >
                        <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 36,
                              height: 36,
                              borderRadius: `${theme.shape.borderRadius}px`,
                              bgcolor: alpha(resolvedColor, 0.1),
                              color: resolvedColor,
                              flexShrink: 0,
                            }}
                          >
                            <config.icon size={16} strokeWidth={1.5} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                              {config.label || item.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                              {item.count} transaksi
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {formatToIdr(item.total)}
                          </Typography>
                          <Chip
                            label={`${percentage}%`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(resolvedColor, 0.3),
                              color: resolvedColor,
                              bgcolor: alpha(resolvedColor, 0.06),
                              height: 24,
                              fontWeight: 500,
                              "& .MuiChip-label": {
                                px: 1,
                                fontSize: "0.6875rem",
                              },
                            }}
                          />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
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

export default ExpenseReport;