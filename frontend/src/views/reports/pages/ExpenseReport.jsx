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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import {
  Banknote,
  CalendarDays,
  Filter,
  Home,
  MoreHorizontal,
  Package,
  Receipt,
  RotateCcw,
  TrendingDown,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { useExpenseReport } from "@views/reports/hooks/useExpenseReport.js";
import { SummaryCard, BarChart, DoughnutChart } from "@components";
import { ExpenseCategory } from "@shared/constant";

const CHART_HEIGHT = 320;
const DOUGHNUT_HEIGHT = 260;

const categoryConfig = {
  [ExpenseCategory.RENT]: {
    icon: Home,
    label: "Sewa Tempat",
  },
  [ExpenseCategory.SALARY]: {
    icon: Users,
    label: "Gaji Karyawan",
  },
  [ExpenseCategory.MAINTENANCE]: {
    icon: Wrench,
    label: "Perawatan",
  },
  [ExpenseCategory.SUPPLIES]: {
    icon: Package,
    label: "Perlengkapan",
  },
  [ExpenseCategory.UTILITIES]: {
    icon: Zap,
    label: "Utilitas",
  },
  [ExpenseCategory.OTHER]: {
    icon: MoreHorizontal,
    label: "Lainnya",
  },
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
      alpha(theme.palette.text.primary, 0.9),
      alpha(theme.palette.text.primary, 0.7),
      alpha(theme.palette.text.primary, 0.5),
      alpha(theme.palette.text.primary, 0.3),
      alpha(theme.palette.text.primary, 0.2),
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
            <Skeleton
              variant="rounded"
              width="100%"
              height={CHART_HEIGHT}
              sx={{ mt: 3 }}
            />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={160} height={28} />
            <Skeleton width={200} height={16} sx={{ mt: 1 }} />
            <Skeleton
              variant="circular"
              width={220}
              height={220}
              sx={{ mx: "auto", mt: 3 }}
            />
            <Skeleton
              variant="rounded"
              width="100%"
              height={80}
              sx={{ mt: 3 }}
            />
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
  <Card sx={{ overflow: "hidden", position: "relative" }}>
    {/* Background Decorations - seperti SummaryCard */}
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
            Laporan Pengeluaran
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Analitik pengeluaran & biaya operasional
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
          <Chip
            icon={<CalendarDays size={14} />}
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
              "& .MuiChip-icon": { ml: 1, mr: -0.5 },
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
                "& .MuiChip-label": { px: 1, fontSize: "0.75rem", fontWeight: 500 },
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
              color: isFilterActive ? theme.palette.primary.main : theme.palette.text.secondary,
              bgcolor: isFilterActive
                ? alpha(theme.palette.primary.main, 0.06)
                : alpha(theme.palette.background.paper, 0.6),
              backdropFilter: "blur(4px)",
              "&:hover": {
                bgcolor: isFilterActive
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.text.primary, 0.06),
                borderColor: isFilterActive ? theme.palette.primary.main : theme.palette.text.primary,
                color: isFilterActive ? theme.palette.primary.main : theme.palette.text.primary,
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

      {!data?.expensesByCategory?.length ? (
        <Box sx={{ gridColumn: "span 12" }}>
          <Card
            sx={{
              minHeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 6,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.text.primary,
                0.02
              )} 0%, ${alpha(theme.palette.text.primary, 0.01)} 100%)`,
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
                  Belum Ada Data Pengeluaran
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tidak ada transaksi pengeluaran untuk periode ini.
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
            sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={TrendingDown}
              subtitle={`${totalTransactions} transaksi tercatat`}
              title="Total Pengeluaran"
              value={formatToIdr(data.totalExpense)}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={Banknote}
              subtitle="Rata-rata per transaksi"
              title="Rata-rata Pengeluaran"
              value={formatToIdr(averagePerTransaction)}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 4", sm: "span 12", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={
                topCategory?.category
                  ? categoryConfig[topCategory.category]?.icon || TrendingDown
                  : TrendingDown
              }
              subtitle={
                topCategory
                  ? categoryConfig[topCategory.category]?.label ||
                    topCategory.category
                  : "Tidak ada data"
              }
              title="Pengeluaran Tertinggi"
              value={topCategory ? formatToIdr(topCategory.total) : "—"}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Pengeluaran per Kategori
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Distribusi total pengeluaran berdasarkan kategori
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={barChartData.datasets}
                  height={CHART_HEIGHT}
                  labels={barChartData.labels}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Proporsi Kategori
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Persentase pengeluaran per kategori
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 6 }}>
                  <DoughnutChart
                    datasets={doughnutData.datasets}
                    height={DOUGHNUT_HEIGHT}
                    labels={doughnutData.labels}
                    isCurrency
                  />
                </Box>
                <Stack sx={{ gap: 1.5 }}>
                  {data.expensesByCategory.map((item, index) => {
                    const config =
                      categoryConfig[item.category] ||
                      categoryConfig[ExpenseCategory.OTHER];
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
                          bgcolor: alpha(theme.palette.background.paper, 0.4),
                          transition: theme.transitions.create(
                            ["background-color", "border-color"],
                            { duration: theme.transitions.duration.shorter }
                          ),
                          "&:hover": {
                            bgcolor: alpha(resolvedColor, 0.04),
                            borderColor: alpha(resolvedColor, 0.2),
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          sx={{ gap: 2, alignItems: "center", minWidth: 0 }}
                        >
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
                            <config.icon size={16} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {config.label || item.category}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.count} transaksi
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack
                          direction="row"
                          sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}
                        >
                          <Typography variant="body2" fontWeight={500} noWrap>
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
                              "& .MuiChip-label": {
                                px: 1,
                                fontSize: "0.6875rem",
                                fontWeight: 600,
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

export default ExpenseReport;
