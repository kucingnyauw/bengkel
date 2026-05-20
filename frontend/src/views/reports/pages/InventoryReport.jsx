/**
 * InventoryReport - Inventory report page with charts, summary cards, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered inventory report page
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
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  DollarSign,
  Filter,
  Package,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { BarChart, DoughnutChart, BubbleChart } from "@components/charts";
import { SummaryCard } from "@components";
import { useInventoryReport } from "@views/reports/hooks";

const CHART_HEIGHT = 320;
const DOUGHNUT_HEIGHT = 260;

const stockStatusConfig = {
  HEALTHY: { icon: CheckCircle, label: "Stok Aman" },
  LOW_STOCK: { icon: AlertTriangle, label: "Stok Menipis" },
  OUT_OF_STOCK: { icon: XCircle, label: "Stok Habis" },
};

const InventoryReport = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = useInventoryReport(params);

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

  const processedItems = useMemo(() => data?.items?.length ? data.items : [], [data]);

  const topAssetItems = useMemo(() => [...processedItems].sort((a, b) => b.assetValue - a.assetValue).slice(0, 10), [processedItems]);

  const topProfitItems = useMemo(() => [...processedItems].sort((a, b) => b.potentialProfit - a.potentialProfit).slice(0, 10), [processedItems]);

  const colors = useMemo(() => {
    return [
      alpha(theme.palette.text.primary, 0.85),
      alpha(theme.palette.text.primary, 0.55),
      alpha(theme.palette.text.primary, 0.25),
    ];
  }, [theme]);

  const assetChartData = useMemo(() => {
    if (!topAssetItems.length) return { datasets: [], labels: [] };
    return {
      datasets: [{ 
        data: topAssetItems.map((item) => item.assetValue), 
        label: "Nilai Aset", 
        backgroundColor: colors[0], 
        borderRadius: theme.shape.borderRadius, 
        borderSkipped: false 
      }],
      labels: topAssetItems.map((item) => item.name),
    };
  }, [topAssetItems, theme, colors]);

  const doughnutData = useMemo(() => {
    if (!processedItems.length) return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    const distribution = {};
    processedItems.forEach((item) => { 
      distribution[item.stockStatus] = (distribution[item.stockStatus] || 0) + 1; 
    });
    return {
      datasets: [{ 
        backgroundColor: colors,
        data: Object.values(distribution) 
      }],
      labels: Object.keys(distribution).map((status) => stockStatusConfig[status]?.label || status),
    };
  }, [processedItems, colors]);

  const bubbleChartData = useMemo(() => {
    if (!processedItems.length) return [];
    return [...processedItems]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 15)
      .map((item) => ({ 
        label: item.name, 
        data: [{ 
          x: item.cost, 
          y: item.potentialProfit, 
          r: Math.max(Math.min(item.stock / 3, 25), 5) 
        }] 
      }));
  }, [processedItems]);

  const totalStock = processedItems.reduce((acc, item) => acc + item.stock, 0);

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
              <Stack direction="row" sx={{ gap: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Stack>
            </Stack>
          </Card>
        </Box>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <Card sx={{ p: 2.5 }}><Stack sx={{ gap: 1.5 }}><Skeleton width="40%" height={16} /><Skeleton width="60%" height={32} /><Skeleton width="50%" height={14} /></Stack></Card>
          </Box>
        ))}
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
          <Card sx={{ p: 3 }}><Skeleton width={240} height={28} /><Skeleton width={320} height={16} sx={{ mt: 1 }} /><Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} /></Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
          <Card sx={{ p: 3 }}><Skeleton width={160} height={28} /><Skeleton width={200} height={16} sx={{ mt: 1 }} /><Skeleton variant="circular" width={220} height={220} sx={{ mx: "auto", mt: 3 }} /></Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}><Skeleton width={240} height={28} /><Skeleton width={320} height={16} sx={{ mt: 1 }} /><Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} /></Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}><Skeleton width={200} height={28} /><Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} /></Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 3 }}>
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
                <Typography variant="h5" fontWeight={700}>Laporan Inventori</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Pantau performa & nilai aset inventori Anda</Typography>
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
                      bgcolor: isFilterActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.06),
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

      {!processedItems.length ? (
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
                <Package size={32} style={{ opacity: 0.3 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Belum Ada Data Inventori</Typography>
                <Typography variant="body2" color="text.secondary">Tidak ada item inventori untuk periode ini.</Typography>
              </Box>
              <Button variant="outlined" onClick={handleOpenFilter}>Atur Filter</Button>
            </Stack>
          </Card>
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={Package} subtitle={`${totalStock} unit tersedia`} title="Total Stok" value={data.items.length} />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={DollarSign} subtitle="Akumulasi harga modal" title="Nilai Aset" value={formatToIdr(data.totalAssetValue)} />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={ShoppingCart} subtitle="Proyeksi harga jual" title="Nilai Retail" value={formatToIdr(data.totalRetailValue)} />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard color="primary" icon={TrendingUp} subtitle={`${data.profitMargin.toFixed(1)}% margin`} title="Potensi Profit" value={formatToIdr(data.potentialProfit)} />
          </Box>

          {/* Bar Chart */}
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Aset Tertinggi</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>10 item dengan nilai aset (modal × stok) terbesar</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={assetChartData.datasets}
                  height={CHART_HEIGHT}
                  horizontal
                  labels={assetChartData.labels}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          {/* Doughnut Chart */}
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Status Stok</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Distribusi kondisi stok saat ini</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <DoughnutChart
                  datasets={doughnutData.datasets}
                  height={DOUGHNUT_HEIGHT}
                  labels={doughnutData.labels}
                />
              </Box>
            </Card>
          </Box>

          {/* Bubble Chart */}
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Peta Profitabilitas</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Visualisasi korelasi modal, profit, dan volume stok</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BubbleChart
                  datasets={bubbleChartData}
                  height={CHART_HEIGHT}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          {/* Table */}
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Rincian Inventori</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>10 item dengan potensi keuntungan tertinggi</Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {["SKU", "Nama Item", "Stok", "Harga Modal", "Nilai Retail", "Potensi Profit", "Status"].map((header) => (
                        <TableCell key={header} align={header === "SKU" || header === "Nama Item" ? "left" : header === "Status" ? "center" : "right"}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {header}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProfitItems.map((item, index) => {
                      const config = stockStatusConfig[item.stockStatus];
                      const margin = item.cost > 0 ? (((item.price - item.cost) / item.cost) * 100).toFixed(1) : "0.0";
                      const statusColor = 
                        item.stockStatus === "HEALTHY" ? theme.palette.text.primary :
                        item.stockStatus === "LOW_STOCK" ? alpha(theme.palette.text.primary, 0.7) :
                        alpha(theme.palette.text.primary, 0.4);
                      const isLast = index === topProfitItems.length - 1;
                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            transition: theme.transitions.create("background-color"),
                            "&:hover": {
                              bgcolor: alpha(statusColor, 0.04),
                            },
                            "& td": {
                              borderBottom: isLast ? 0 : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              py: 2,
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                              {item.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={item.stock === 0 ? "Habis" : item.stock <= 5 ? `⚠ ${item.stock}` : item.stock}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: item.stock === 0
                                  ? alpha(theme.palette.error.main, 0.3)
                                  : item.stock <= 5
                                  ? alpha(theme.palette.warning.main, 0.3)
                                  : alpha(theme.palette.divider, 0.5),
                                color: item.stock === 0
                                  ? theme.palette.error.main
                                  : item.stock <= 5
                                  ? theme.palette.warning.main
                                  : theme.palette.text.primary,
                                bgcolor: item.stock === 0
                                  ? alpha(theme.palette.error.main, 0.06)
                                  : item.stock <= 5
                                  ? alpha(theme.palette.warning.main, 0.06)
                                  : "transparent",
                                height: 24,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                              {formatToIdr(item.cost)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {formatToIdr(item.retailValue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" sx={{ gap: 1, alignItems: "center", justifyContent: "flex-end" }}>
                              <Typography variant="body2" fontWeight={600}>
                                {formatToIdr(item.potentialProfit)}
                              </Typography>
                              <Chip
                                label={`${margin}%`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: alpha(statusColor, 0.3),
                                  color: statusColor,
                                  bgcolor: alpha(statusColor, 0.06),
                                  height: 24,
                                  "& .MuiChip-label": { px: 1, fontSize: "0.6875rem", fontWeight: 600 },
                                }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<config.icon size={14} />}
                              label={config.label}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(statusColor, 0.3),
                                color: statusColor,
                                bgcolor: alpha(statusColor, 0.06),
                                height: 24,
                                "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                                "& .MuiChip-icon": { ml: 1, mr: -0.5, color: statusColor },
                              }}
                            />
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

      {/* Filter Dialog */}
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

export default InventoryReport;