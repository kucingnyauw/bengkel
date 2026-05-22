/**
 * PaymentReport - Payment report page with charts, summary cards, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered payment report page
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
  Banknote,
  DollarSign,
  QrCode,
  TrendingUp,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { BarChart, DoughnutChart, SummaryCard } from "@components";
import { usePaymentReport } from "@views/reports/hooks";
import { ReportHeader, ReportFilterDialog } from "@views/reports/components";

const methodConfig = {
  CASH: { icon: Banknote, label: "Tunai" },
  QRIS: { icon: QrCode, label: "QRIS" },
};

const PaymentReport = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = usePaymentReport(params);

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
      alpha(theme.palette.secondary.main, 0.5),
    ];
  }, [theme]);

  const methodChartData = useMemo(() => {
    if (!data?.payment?.byMethod?.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: data.payment.byMethod.map((item) => item.amount),
          label: "Total Pembayaran",
          backgroundColor: data.payment.byMethod.map(
            (_, i) => colors[i % colors.length]
          ),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: data.payment.byMethod.map(
        (item) => methodConfig[item.method]?.label || item.method
      ),
    };
  }, [data, theme, colors]);

  const methodDoughnutData = useMemo(() => {
    if (!data?.payment?.byMethod?.length)
      return { datasets: [{ data: [1] }], labels: ["Tidak ada data"] };
    return {
      datasets: [
        {
          data: data.payment.byMethod.map((item) => item.amount),
          backgroundColor: data.payment.byMethod.map(
            (_, i) => colors[i % colors.length]
          ),
        },
      ],
      labels: data.payment.byMethod.map(
        (item) => methodConfig[item.method]?.label || item.method
      ),
    };
  }, [data, colors]);

  const averagePayment = useMemo(() => {
    if (!data?.payment?.totalAmount || !data?.payment?.totalCount) return 0;
    return data.payment.totalAmount / data.payment.totalCount;
  }, [data]);

  const topMethod = useMemo(() => {
    if (!data?.payment?.byMethod?.length) return null;
    return data.payment.byMethod.reduce((prev, current) =>
      prev.amount > current.amount ? prev : current
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
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={240} height={28} />
            <Skeleton width={320} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 3,
      }}
    >
      <Box sx={{ gridColumn: "span 12" }}>
        <ReportHeader
          title="Laporan Pembayaran"
          subtitle="Pantau transaksi & metode pembayaran"
          periodText={periodText}
          isFilterActive={isFilterActive}
          onRefresh={() => refetch()}
          onOpenFilter={handleOpenFilter}
        />
      </Box>

      {!data?.payment?.byMethod?.length ? (
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
                  Belum Ada Data Pembayaran
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada transaksi pembayaran untuk periode ini.
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
              icon={DollarSign}
              subtitle={`${data.payment.totalCount} transaksi`}
              title="Total Pembayaran"
              value={formatToIdr(data.payment.totalAmount)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={TrendingUp}
              subtitle="Rata-rata per transaksi"
              title="Rata-rata"
              value={formatToIdr(averagePayment)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={topMethod?.method === "QRIS" ? QrCode : Banknote}
              subtitle={
                topMethod
                  ? `${methodConfig[topMethod.method]?.label} — ${topMethod.count}x`
                  : "Tidak ada data"
              }
              title="Metode Utama"
              value={topMethod ? formatToIdr(topMethod.amount) : "—"}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={Banknote}
              subtitle={`${data.payment.totalCount} berhasil`}
              title="Status"
              value="Semua Lunas"
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Metode Pembayaran
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Perbandingan total transaksi per metode
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={methodChartData.datasets}
                  height={320}
                  labels={methodChartData.labels}
                  legend={false}
                  isCurrency
                />
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
                  Proporsi Metode
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Distribusi pembayaran per metode
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <DoughnutChart
                    datasets={methodDoughnutData.datasets}
                    height={220}
                    labels={methodDoughnutData.labels}
                    isCurrency
                  />
                </Box>
                <Stack sx={{ gap: 1.5 }}>
                  {data.payment.byMethod.map((item, index) => {
                    const config = methodConfig[item.method] || {
                      icon: Banknote,
                      label: item.method,
                    };
                    const resolvedColor = colors[index % colors.length];
                    const percentage =
                      data.payment.totalAmount > 0
                        ? ((item.amount / data.payment.totalAmount) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <Stack
                        key={item.method}
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
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {config.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                              {item.count} transaksi
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                            {formatToIdr(item.amount)}
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
                              fontWeight: 400,
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

export default PaymentReport;