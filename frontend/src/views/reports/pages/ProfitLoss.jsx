/**
 * ProfitLoss - Profit & Loss report page with breakdown stages, charts, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered profit & loss report page
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
  ArrowDown,
  ArrowUp,
  CalendarDays,
  DollarSign,
  Filter,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { DoughnutChart, SummaryCard } from "@components";
import { useProfitLossReport } from "@views/reports/hooks";

const DOUGHNUT_HEIGHT = 260;

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
      alpha(theme.palette.text.primary, 0.85),
      alpha(theme.palette.text.primary, 0.55),
      alpha(theme.palette.text.primary, 0.25),
    ];
  }, [theme]);

  const costDistributionData = useMemo(() => {
    if (!data?.profitLoss) return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    const cogsPct = ((data.profitLoss.totalCogs / data.profitLoss.grossRevenue) * 100).toFixed(1);
    const opexPct = ((data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) * 100).toFixed(1);
    const profitPct = Math.abs(data.profitLoss.netMargin).toFixed(1);

    return {
      datasets: [{
        backgroundColor: colors,
        data: [data.profitLoss.totalCogs, data.profitLoss.totalOperatingExpenses, Math.abs(data.profitLoss.netProfit)],
      }],
      labels: [`HPP (${cogsPct}%)`, `Operasional (${opexPct}%)`, `${isProfit ? "Laba" : "Rugi"} (${profitPct}%)`],
    };
  }, [data, theme, colors, isProfit]);

  const profitStages = useMemo(() => {
    if (!data?.profitLoss) return [];
    return [
      { label: "Pendapatan Kotor", value: data.profitLoss.grossRevenue, icon: ShoppingCart, percentage: 100, type: "revenue" },
      { label: "HPP", value: data.profitLoss.totalCogs, icon: TrendingDown, percentage: ((data.profitLoss.totalCogs / data.profitLoss.grossRevenue) * 100).toFixed(1), type: "deduction" },
      { label: "Laba Kotor", value: data.profitLoss.grossProfit, icon: TrendingUp, percentage: data.profitLoss.grossMargin.toFixed(1), type: "highlight" },
      { label: "Biaya Operasional", value: data.profitLoss.totalOperatingExpenses, icon: Wrench, percentage: ((data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) * 100).toFixed(1), type: "deduction" },
      { label: isProfit ? "Laba Bersih" : "Rugi Bersih", value: Math.abs(data.profitLoss.netProfit), icon: isProfit ? TrendingUp : TrendingDown, percentage: Math.abs(data.profitLoss.netMargin).toFixed(1), type: "final", isLoss: !isProfit },
    ];
  }, [data, isProfit]);

  const periodText = useMemo(() => {
    if (appliedStartDate && appliedEndDate) return `${formatDate(appliedStartDate)} - ${formatDate(appliedEndDate)}`;
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
              <Box><Skeleton width={280} height={36} /><Skeleton width={180} height={20} sx={{ mt: 1 }} /></Box>
              <Stack direction="row" sx={{ gap: 1 }}><Skeleton variant="circular" width={40} height={40} /><Skeleton variant="circular" width={40} height={40} /></Stack>
            </Stack>
          </Card>
        </Box>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <Card sx={{ p: 2.5 }}><Stack sx={{ gap: 1.5 }}><Skeleton width="40%" height={16} /><Skeleton width="60%" height={32} /><Skeleton width="50%" height={14} /></Stack></Card>
          </Box>
        ))}
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
          <Card sx={{ p: 3 }}><Skeleton width={200} height={28} /><Skeleton width={280} height={16} sx={{ mt: 1 }} /><Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} /></Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" } }}>
          <Card sx={{ p: 3 }}><Skeleton width={160} height={28} /><Skeleton width={200} height={16} sx={{ mt: 1 }} /><Skeleton variant="circular" width={220} height={220} sx={{ mx: "auto", mt: 3 }} /><Skeleton variant="rounded" width="100%" height={80} sx={{ mt: 3 }} /></Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 3 }}>
      {/* Header */}
      <Box sx={{ gridColumn: "span 12" }}>
        <Card sx={{ overflow: "hidden", position: "relative" }}>
          <Box sx={{ position: "absolute", right: theme.spacing(-6), top: theme.spacing(-6), width: theme.spacing(20), height: theme.spacing(20), borderRadius: "50%", backgroundColor: alpha(theme.palette.text.primary, 0.03), zIndex: 0 }} />
          <Box sx={{ position: "absolute", right: theme.spacing(-3), bottom: theme.spacing(-3), width: theme.spacing(14), height: theme.spacing(14), borderRadius: "50%", backgroundColor: alpha(theme.palette.text.primary, 0.04), zIndex: 0 }} />
          <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2.5, p: 3, position: "relative", zIndex: 1 }}>
            <Stack sx={{ gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>Laba Rugi</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Analitik performa keuangan bisnis</Typography>
              </Box>
              <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
                <Chip icon={<CalendarDays size={14} />} label={periodText} variant="outlined" size="small" sx={{ borderColor: alpha(theme.palette.divider, 0.8), bgcolor: alpha(theme.palette.background.paper, 0.5), px: 0.5, py: 0.5, height: 28, "& .MuiChip-label": { px: 1, fontSize: "0.75rem" }, "& .MuiChip-icon": { ml: 1, mr: -0.5 } }} />
                {isFilterActive && <Chip label="Filter aktif" color="primary" size="small" variant="outlined" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06), borderColor: alpha(theme.palette.primary.main, 0.3), px: 0.5, py: 0.5, height: 28, "& .MuiChip-label": { px: 1, fontSize: "0.75rem", fontWeight: 500 } }} />}
              </Stack>
            </Stack>
            <Stack direction="row" sx={{ gap: 0.5 }}>
              <Tooltip title="Refresh data">
                <IconButton onClick={() => refetch()} sx={{ border: "1px solid", borderColor: alpha(theme.palette.divider, 0.8), color: theme.palette.text.secondary, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: "blur(4px)", "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.06), borderColor: theme.palette.text.primary, color: theme.palette.text.primary } }}>
                  <RotateCcw size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter periode">
                <IconButton onClick={handleOpenFilter} sx={{ border: "1px solid", borderColor: isFilterActive ? alpha(theme.palette.primary.main, 0.4) : alpha(theme.palette.divider, 0.8), color: isFilterActive ? theme.palette.primary.main : theme.palette.text.secondary, bgcolor: isFilterActive ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.background.paper, 0.6), backdropFilter: "blur(4px)", "&:hover": { bgcolor: isFilterActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.06), borderColor: isFilterActive ? theme.palette.primary.main : theme.palette.text.primary, color: isFilterActive ? theme.palette.primary.main : theme.palette.text.primary } }}>
                  <Filter size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {!data?.profitLoss ? (
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", p: 6 }}>
            <Stack sx={{ gap: 3, alignItems: "center", textAlign: "center" }}>
              <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: alpha(theme.palette.text.primary, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={32} style={{ opacity: 0.3 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Belum Ada Data</Typography>
                <Typography variant="body2" color="text.secondary">Tidak ada data keuangan untuk periode ini.</Typography>
              </Box>
              <Button variant="outlined" onClick={handleOpenFilter}>Atur Filter</Button>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={ShoppingCart} subtitle="Pendapatan kotor" title="Pendapatan" value={formatToIdr(data.profitLoss.grossRevenue)} />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={TrendingUp} subtitle={`${data.profitLoss.grossMargin.toFixed(1)}% margin`} title="Laba Kotor" value={formatToIdr(data.profitLoss.grossProfit)} />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 4", sm: "span 12", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={isProfit ? TrendingUp : TrendingDown} subtitle={`${Math.abs(data.profitLoss.netMargin).toFixed(1)}% ${isProfit ? "margin" : "rugi"}`} title={isProfit ? "Laba Bersih" : "Rugi Bersih"} value={formatToIdr(Math.abs(data.profitLoss.netProfit))} />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Tahapan Laba Rugi</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Breakdown pendapatan, biaya, dan profit</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Stack sx={{ gap: 0.5 }}>
                  {profitStages.map((stage, index) => {
                    const isHighlight = stage.type === "highlight" || stage.type === "final";
                    const resolvedColor = stage.isLoss ? alpha(theme.palette.text.primary, 0.7) : theme.palette.text.primary;
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
                            border: isHighlight ? `1px solid ${alpha(resolvedColor, 0.15)}` : "1px solid transparent",
                            transition: theme.transitions.create("background-color"),
                            "&:hover": { bgcolor: isHighlight ? alpha(resolvedColor, bgAlpha + 0.04) : alpha(theme.palette.text.primary, 0.03) },
                          }}
                        >
                          <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: `${theme.shape.borderRadius}px`, bgcolor: alpha(resolvedColor, 0.1), color: resolvedColor, flexShrink: 0 }}>
                              <stage.icon size={16} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={500} noWrap>{stage.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stage.type === "deduction" ? "Pengurangan" : stage.type === "final" ? "Hasil Akhir" : "Pemasukan"}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                            <Typography variant="body2" fontWeight={stage.type === "final" ? 700 : 500} sx={{ whiteSpace: "nowrap", color: stage.isLoss ? alpha(theme.palette.text.primary, 0.7) : "inherit" }}>
                              {stage.type === "deduction" ? "− " : "+ "}{formatToIdr(stage.value)}
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
                                fontWeight: 600,
                                fontSize: "0.6875rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </Stack>
                        </Stack>
                        {index < profitStages.length - 1 && (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 0.25 }}>
                            {stage.type === "deduction" ? (
                              <ArrowUp size={14} style={{ opacity: 0.3 }} />
                            ) : (
                              <ArrowDown size={14} style={{ opacity: 0.3 }} />
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
            <Card sx={{ height: "100%" }}>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Distribusi Biaya</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Proporsi biaya dari pendapatan kotor</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <DoughnutChart datasets={costDistributionData.datasets} height={DOUGHNUT_HEIGHT} labels={costDistributionData.labels} isCurrency />
                </Box>
                <Stack sx={{ gap: 1.5 }}>
                  {[
                    { label: "Margin Kotor", value: `${data.profitLoss.grossMargin.toFixed(1)}%` },
                    { label: "Margin Bersih", value: `${data.profitLoss.netMargin.toFixed(1)}%` },
                    { label: "Rasio Operasional", value: `${((data.profitLoss.totalOperatingExpenses / data.profitLoss.grossRevenue) * 100).toFixed(1)}%` },
                  ].map((item, idx) => (
                    <Stack key={idx} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", p: 2, border: "1px solid", borderColor: alpha(theme.palette.divider, 0.6), borderRadius: `${theme.shape.borderRadius}px`, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Chip label={item.value} size="small" variant="outlined" sx={{ height: 24, "& .MuiChip-label": { px: 1, fontSize: "0.6875rem", fontWeight: 600 } }} />
                    </Stack>
                  ))}
                </Stack>
                <Box sx={{ mt: 3, p: 2.5, borderRadius: `${theme.shape.borderRadius}px`, textAlign: "center", bgcolor: alpha(theme.palette.text.primary, 0.04), border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>
                    {isProfit ? "Profit" : "Loss"}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>
                    {formatToIdr(Math.abs(data.profitLoss.netProfit))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isProfit ? "Laba bersih setelah semua biaya" : "Rugi bersih setelah semua biaya"}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </>
      )}

      <Dialog maxWidth="xs" fullWidth open={filterOpen} onClose={handleCloseFilter}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 2 }}>
          Filter Periode
          <IconButton onClick={handleCloseFilter}><X size={18} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Stack sx={{ gap: 2.5 }}>
            <MobileDatePicker label="Dari Tanggal" value={startDate} onChange={(val) => setStartDate(val)} slotProps={{ textField: { fullWidth: true } }} />
            <MobileDatePicker label="Sampai Tanggal" value={endDate} onChange={(val) => setEndDate(val)} slotProps={{ textField: { fullWidth: true } }} />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button color="inherit" variant="outlined" onClick={handleResetFilter}>Reset</Button>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button color="inherit" variant="outlined" onClick={handleCloseFilter}>Batal</Button>
            <Button variant="contained" onClick={handleApplyFilter}>Terapkan</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfitLoss;