/**
 * ProfitLoss - Profit & Loss report page with breakdown stages, charts, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered profit & loss report page
 */
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { DoughnutChart, SummaryCard } from "@components";
import { useProfitLossReport } from "@views/reports/hooks";
import { ReportHeader, ReportFilterDialog } from "@views/reports/components";

const ProfitLoss = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = useProfitLossReport(params);

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
  const isProfit = data?.profitLoss?.netProfit >= 0;

  const colors = useMemo(() => {
    return [
      alpha(theme.palette.secondary.main, 0.85),
      alpha(theme.palette.secondary.main, 0.55),
      alpha(theme.palette.secondary.main, 0.25),
    ];
  }, [theme]);

  const costDistributionData = useMemo(() => {
    if (!data?.profitLoss)
      return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    const cogsPct = ((data.profitLoss.totalCogs / data.profitLoss.grossRevenue) * 100).toFixed(1);
    const opexPct = ((data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) * 100).toFixed(1);
    const profitPct = Math.abs(data.profitLoss.netMargin).toFixed(1);

    return {
      datasets: [
        {
          backgroundColor: colors,
          data: [
            data.profitLoss.totalCogs,
            data.profitLoss.totalOperatingExpenses,
            Math.abs(data.profitLoss.netProfit),
          ],
        },
      ],
      labels: [
        `HPP (${cogsPct}%)`,
        `Operasional (${opexPct}%)`,
        `${isProfit ? "Laba" : "Rugi"} (${profitPct}%)`,
      ],
    };
  }, [data, theme, colors, isProfit]);

  const profitStages = useMemo(() => {
    if (!data?.profitLoss) return [];
    return [
      {
        label: "Pendapatan Kotor",
        value: data.profitLoss.grossRevenue,
        icon: ShoppingCart,
        percentage: 100,
        type: "revenue",
      },
      {
        label: "HPP",
        value: data.profitLoss.totalCogs,
        icon: TrendingDown,
        percentage: ((data.profitLoss.totalCogs / data.profitLoss.grossRevenue) * 100).toFixed(1),
        type: "deduction",
      },
      {
        label: "Laba Kotor",
        value: data.profitLoss.grossProfit,
        icon: TrendingUp,
        percentage: data.profitLoss.grossMargin.toFixed(1),
        type: "highlight",
      },
      {
        label: "Biaya Operasional",
        value: data.profitLoss.totalOperatingExpenses,
        icon: Wrench,
        percentage: (
          (data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) *
          100
        ).toFixed(1),
        type: "deduction",
      },
      {
        label: isProfit ? "Laba Bersih" : "Rugi Bersih",
        value: Math.abs(data.profitLoss.netProfit),
        icon: isProfit ? TrendingUp : TrendingDown,
        percentage: Math.abs(data.profitLoss.netMargin).toFixed(1),
        type: "final",
        isLoss: !isProfit,
      },
    ];
  }, [data, isProfit]);

  const periodText = useMemo(() => {
    if (appliedStartDate && appliedEndDate)
      return `${formatDate(appliedStartDate)} - ${formatDate(appliedEndDate)}`;
    if (appliedStartDate) return `Dari ${formatDate(appliedStartDate)}`;
    if (appliedEndDate) return `Sampai ${formatDate(appliedEndDate)}`;
    return "Semua periode";
  }, [appliedStartDate, appliedEndDate]);

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 3 }}>
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
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <Card sx={{ p: 2.5 }}>
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={32} />
                <Skeleton width="50%" height={14} />
              </Stack>
            </Card>
          </Box>
        ))}
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={200} height={28} />
            <Skeleton width={280} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" } }}>
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
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 3 }}>
      <Box sx={{ gridColumn: "span 12" }}>
        <ReportHeader
          title="Laba Rugi"
          subtitle="Analitik performa keuangan bisnis"
          periodText={periodText}
          isFilterActive={isFilterActive}
          onRefresh={() => refetch()}
          onOpenFilter={handleOpenFilter}
        />
      </Box>

      {!data?.profitLoss ? (
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
                  Belum Ada Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada data keuangan untuk periode ini.
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={ShoppingCart}
              subtitle="Pendapatan kotor"
              title="Pendapatan"
              value={formatToIdr(data.profitLoss.grossRevenue)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={TrendingUp}
              subtitle={`${data.profitLoss.grossMargin.toFixed(1)}% margin`}
              title="Laba Kotor"
              value={formatToIdr(data.profitLoss.grossProfit)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 12", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={isProfit ? TrendingUp : TrendingDown}
              subtitle={`${Math.abs(data.profitLoss.netMargin).toFixed(1)}% ${isProfit ? "margin" : "rugi"}`}
              title={isProfit ? "Laba Bersih" : "Rugi Bersih"}
              value={formatToIdr(Math.abs(data.profitLoss.netProfit))}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
            <Card
              sx={{
                height: "100%",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Tahapan Laba Rugi
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Breakdown pendapatan, biaya, dan profit
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Stack sx={{ gap: 0.5 }}>
                  {profitStages.map((stage, index) => {
                    const isHighlight = stage.type === "highlight" || stage.type === "final";
                    const resolvedColor = stage.isLoss
                      ? theme.palette.error.main
                      : theme.palette.secondary.main;
                    const bgAlpha = stage.isLoss ? 0.04 : 0.06;

                    return (
                      <Box key={index}>
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            p: 2,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            bgcolor: isHighlight ? alpha(resolvedColor, bgAlpha) : "transparent",
                            border: isHighlight
                              ? `1px solid ${alpha(resolvedColor, 0.15)}`
                              : "1px solid transparent",
                            transition: theme.transitions.create("background-color"),
                            "&:hover": {
                              bgcolor: isHighlight
                                ? alpha(resolvedColor, bgAlpha + 0.04)
                                : alpha(theme.palette.secondary.main, 0.03),
                            },
                          }}
                        >
                          <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0, flex: 1 }}>
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
                              <stage.icon size={16} strokeWidth={1.5} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                                {stage.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {stage.type === "deduction"
                                  ? "Pengurangan"
                                  : stage.type === "final"
                                  ? "Hasil Akhir"
                                  : "Pemasukan"}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 400,
                                whiteSpace: "nowrap",
                                color: stage.isLoss ? theme.palette.error.main : "inherit",
                              }}
                            >
                              {stage.type === "deduction" ? "− " : "+ "}
                              {formatToIdr(stage.value)}
                            </Typography>
                            <Chip
                              label={`${stage.percentage}%`}
                              size="small"
                              variant={isHighlight ? "filled" : "outlined"}
                              sx={{
                                bgcolor: isHighlight ? alpha(resolvedColor, 0.12) : "transparent",
                                color: resolvedColor,
                                borderColor: alpha(resolvedColor, 0.3),
                                height: 24,
                                fontWeight: 400,
                                fontSize: "0.6875rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </Stack>
                        </Stack>
                        {index < profitStages.length - 1 && (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 0.25 }}>
                            {stage.type === "deduction" ? (
                              <ArrowUp size={14} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                            ) : (
                              <ArrowDown size={14} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" } }}>
            <Card
              sx={{
                height: "100%",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Distribusi Biaya
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Proporsi biaya dari pendapatan kotor
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <DoughnutChart
                    datasets={costDistributionData.datasets}
                    height={220}
                    labels={costDistributionData.labels}
                    isCurrency
                  />
                </Box>
                <Stack sx={{ gap: 1.5 }}>
                  {[
                    { label: "Margin Kotor", value: `${data.profitLoss.grossMargin.toFixed(1)}%` },
                    { label: "Margin Bersih", value: `${data.profitLoss.netMargin.toFixed(1)}%` },
                    {
                      label: "Rasio Operasional",
                      value: `${(
                        (data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) *
                        100
                      ).toFixed(1)}%`,
                    },
                  ].map((item, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        border: "1px solid",
                        borderColor: alpha(theme.palette.divider, 0.6),
                        borderRadius: `${theme.shape.borderRadius}px`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {item.label}
                      </Typography>
                      <Chip
                        label={item.value}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          fontWeight: 400,
                          "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
                <Box
                  sx={{
                    mt: 3,
                    p: 2.5,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    textAlign: "center",
                    bgcolor: isProfit
                      ? alpha(theme.palette.success.main, 0.04)
                      : alpha(theme.palette.error.main, 0.04),
                    border: `1px solid ${
                      isProfit
                        ? alpha(theme.palette.success.main, 0.15)
                        : alpha(theme.palette.error.main, 0.15)
                    }`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textTransform="uppercase"
                    sx={{ fontWeight: 400 }}
                  >
                    {isProfit ? "Profit" : "Loss"}
                  </Typography>
                  <Typography variant="h5" sx={{ my: 0.5, fontWeight: 400 }}>
                    {formatToIdr(Math.abs(data.profitLoss.netProfit))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                    {isProfit ? "Laba bersih setelah semua biaya" : "Rugi bersih setelah semua biaya"}
                  </Typography>
                </Box>
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

export default ProfitLoss;