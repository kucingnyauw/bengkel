/**
 * InventoryReport - Inventory report page with charts, summary cards.
 *
 * @component
 * @returns {JSX.Element} Rendered inventory report page
 */
import { useMemo } from "react";
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
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { formatToIdr } from "@shared/utils";
import { BarChart, DoughnutChart, BubbleChart } from "@components/charts";
import { SummaryCard } from "@components";
import { useInventoryReport } from "@views/reports/hooks";
import { ReportHeader } from "@views/reports/components";

const stockStatusConfig = {
  HEALTHY: { label: "Stok Aman" },
  LOW_STOCK: { label: "Stok Menipis" },
  OUT_OF_STOCK: { label: "Stok Habis" },
};

const InventoryReport = () => {
  const theme = useTheme();

  const { data, isLoading, refetch } = useInventoryReport();

  const processedItems = useMemo(() => data?.items?.length ? data.items : [], [data]);

  const topAssetItems = useMemo(
    () => [...processedItems].sort((a, b) => b.assetValue - a.assetValue).slice(0, 10),
    [processedItems]
  );

  const topProfitItems = useMemo(
    () => [...processedItems].sort((a, b) => b.potentialProfit - a.potentialProfit).slice(0, 10),
    [processedItems]
  );

  const colors = useMemo(() => {
    return [
      alpha(theme.palette.secondary.main, 0.85),
      alpha(theme.palette.secondary.main, 0.55),
      alpha(theme.palette.secondary.main, 0.25),
    ];
  }, [theme]);

  const assetChartData = useMemo(() => {
    if (!topAssetItems.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: topAssetItems.map((item) => item.assetValue),
          label: "Nilai Aset",
          backgroundColor: colors[0],
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: topAssetItems.map((item) => item.name),
    };
  }, [topAssetItems, theme, colors]);

  const doughnutData = useMemo(() => {
    if (!processedItems.length)
      return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    const distribution = {};
    processedItems.forEach((item) => {
      distribution[item.stockStatus] = (distribution[item.stockStatus] || 0) + 1;
    });
    return {
      datasets: [{ backgroundColor: colors, data: Object.values(distribution) }],
      labels: Object.keys(distribution).map(
        (status) => stockStatusConfig[status]?.label || status
      ),
    };
  }, [processedItems, colors]);

  const bubbleChartData = useMemo(() => {
    if (!processedItems.length) return [];
    return [...processedItems]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 15)
      .map((item) => ({
        label: item.name,
        data: [
          {
            x: item.cost,
            y: item.potentialProfit,
            r: Math.max(Math.min(item.stock / 3, 25), 5),
          },
        ],
      }));
  }, [processedItems]);

  const totalStock = processedItems.reduce((acc, item) => acc + item.stock, 0);

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
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
          </Card>
        </Box>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
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
          </Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={240} height={28} />
            <Skeleton width={320} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={200} height={28} />
            <Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} />
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 3 }}>
      <Box sx={{ gridColumn: "span 12" }}>
        <ReportHeader
          title="Laporan Inventori"
          subtitle="Pantau performa & nilai aset inventori Anda"
          periodText="Semua periode"
          isFilterActive={false}
          onRefresh={() => refetch()}
        />
      </Box>

      {!processedItems.length ? (
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
                  Belum Ada Data Inventori
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada item inventori untuk periode ini.
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
              icon={Package}
              subtitle={`${totalStock} unit tersedia`}
              title="Total Item"
              value={data.items.length}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={DollarSign}
              subtitle="Akumulasi harga modal"
              title="Nilai Aset"
              value={formatToIdr(data.totalAssetValue)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={ShoppingCart}
              subtitle="Proyeksi harga jual"
              title="Nilai Retail"
              value={formatToIdr(data.totalRetailValue)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={TrendingUp}
              subtitle={`${data.profitMargin.toFixed(1)}% margin`}
              title="Potensi Profit"
              value={formatToIdr(data.potentialProfit)}
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
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Aset Tertinggi
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  10 item dengan nilai aset (modal × stok) terbesar
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={assetChartData.datasets}
                  height={320}
                  horizontal
                  labels={assetChartData.labels}
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
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Status Stok
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Distribusi kondisi stok saat ini
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <DoughnutChart
                  datasets={doughnutData.datasets}
                  height={220}
                  labels={doughnutData.labels}
                />
              </Box>
            </Card>
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
                  Peta Profitabilitas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Visualisasi korelasi modal, profit, dan volume stok
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BubbleChart
                  datasets={bubbleChartData}
                  height={320}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
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
                  Rincian Inventori
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  10 item dengan potensi keuntungan tertinggi
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {["SKU", "Nama Item", "Stok", "Harga Modal", "Harga Jual", "Potensi Profit", "Margin", "Status"].map(
                        (header) => (
                          <TableCell
                            key={header}
                            align={
                              header === "SKU" || header === "Nama Item"
                                ? "left"
                                : header === "Status"
                                ? "center"
                                : "right"
                            }
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {header}
                            </Typography>
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProfitItems.map((item, index) => {
                      const config = stockStatusConfig[item.stockStatus];
                      const margin =
                        item.cost > 0
                          ? (((item.price - item.cost) / item.cost) * 100).toFixed(1)
                          : "0.0";
                      const isLast = index === topProfitItems.length - 1;
                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            transition: theme.transitions.create("background-color"),
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem", fontWeight: 400 }}
                            >
                              {item.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={
                                item.stock === 0
                                  ? "Habis"
                                  : item.stock <= 5
                                  ? `⚠ ${item.stock}`
                                  : item.stock
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor:
                                  item.stock === 0
                                    ? alpha(theme.palette.error.main, 0.3)
                                    : item.stock <= 5
                                    ? alpha(theme.palette.warning.main, 0.3)
                                    : alpha(theme.palette.divider, 0.5),
                                color:
                                  item.stock === 0
                                    ? theme.palette.error.main
                                    : item.stock <= 5
                                    ? theme.palette.warning.main
                                    : theme.palette.text.primary,
                                bgcolor:
                                  item.stock === 0
                                    ? alpha(theme.palette.error.main, 0.06)
                                    : item.stock <= 5
                                    ? alpha(theme.palette.warning.main, 0.06)
                                    : "transparent",
                                height: 24,
                                fontWeight: 400,
                                fontSize: "0.75rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.8125rem", fontWeight: 400 }}
                            >
                              {formatToIdr(item.cost)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {formatToIdr(item.price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {formatToIdr(item.potentialProfit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${margin}%`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(theme.palette.secondary.main, 0.3),
                                color: theme.palette.secondary.main,
                                bgcolor: alpha(theme.palette.secondary.main, 0.06),
                                height: 24,
                                fontWeight: 400,
                                "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={config.label}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor:
                                  item.stockStatus === "HEALTHY"
                                    ? alpha(theme.palette.success.main, 0.3)
                                    : item.stockStatus === "LOW_STOCK"
                                    ? alpha(theme.palette.warning.main, 0.3)
                                    : alpha(theme.palette.error.main, 0.3),
                                color:
                                  item.stockStatus === "HEALTHY"
                                    ? theme.palette.success.main
                                    : item.stockStatus === "LOW_STOCK"
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main,
                                bgcolor:
                                  item.stockStatus === "HEALTHY"
                                    ? alpha(theme.palette.success.main, 0.06)
                                    : item.stockStatus === "LOW_STOCK"
                                    ? alpha(theme.palette.warning.main, 0.06)
                                    : alpha(theme.palette.error.main, 0.06),
                                height: 24,
                                fontWeight: 400,
                                "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
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
    </Box>
  );
};

export default InventoryReport;