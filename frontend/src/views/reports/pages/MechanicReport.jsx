/**
 * MechanicReport - Mechanic performance report page with charts, summary cards, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered mechanic performance report page
 */
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  LinearProgress,
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
  Award,
  DollarSign,
  Star,
  Users,
  Wrench,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";
import { useMechanicPerformanceReport } from "@views/reports/hooks";
import { ReportHeader, ReportFilterDialog } from "@views/reports/components";

const MechanicReport = () => {
  const theme = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const params = { startDate: appliedStartDate, endDate: appliedEndDate };
  const { data, isLoading, refetch } = useMechanicPerformanceReport(params);

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

  const topMechanic = useMemo(() => {
    if (!data?.mechanics?.length) return null;
    return data.mechanics.reduce((prev, current) =>
      prev.totalEarnings > current.totalEarnings ? prev : current
    );
  }, [data]);

  const taskChartData = useMemo(() => {
    if (!data?.mechanics?.length) return { datasets: [], labels: [] };
    const sortedMechanics = [...data.mechanics].sort(
      (a, b) => b.totalTasks - a.totalTasks
    );
    return {
      datasets: [
        {
          data: sortedMechanics.map((m) => m.completedTasks),
          label: "Selesai",
          stack: "stack1",
          backgroundColor: alpha(theme.palette.secondary.main, 0.85),
          borderRadius: theme.shape.borderRadius,
        },
        {
          data: sortedMechanics.map((m) => m.pendingTasks),
          label: "Tertunda",
          stack: "stack1",
          backgroundColor: alpha(theme.palette.secondary.main, 0.2),
          borderRadius: theme.shape.borderRadius,
        },
      ],
      labels: sortedMechanics.map((m) => m.mechanicName.split(" ")[0]),
    };
  }, [data, theme]);

  const earningsChartData = useMemo(() => {
    if (!data?.mechanics?.length) return { datasets: [], labels: [] };
    const sortedMechanics = [...data.mechanics].sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    );
    return {
      datasets: [
        {
          data: sortedMechanics.map((m) => m.totalEarnings),
          label: "Total Pendapatan",
          backgroundColor: alpha(theme.palette.secondary.main, 0.8),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: sortedMechanics.map((m) => m.mechanicName.split(" ")[0]),
    };
  }, [data, theme]);

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
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
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
        <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
          </Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={240} height={28} />
            <Skeleton width={320} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={360} sx={{ mt: 3 }} />
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
          title="Performa Mekanik"
          subtitle="Pantau produktivitas & pendapatan tiap mekanik"
          periodText={periodText}
          isFilterActive={isFilterActive}
          onRefresh={() => refetch()}
          onOpenFilter={handleOpenFilter}
        />
      </Box>

      {!data?.mechanics?.length ? (
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
                  Belum Ada Data Mekanik
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Tidak ada data performa mekanik untuk periode ini.
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
              icon={Users}
              subtitle="Mekanik terdaftar"
              title="Total Mekanik"
              value={data.summary.totalMechanics}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={Wrench}
              subtitle={`${data.summary.totalCompleted} selesai`}
              title="Total Tugas"
              value={data.summary.totalTasks}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={DollarSign}
              subtitle="Akumulasi pendapatan"
              title="Total Pendapatan"
              value={formatToIdr(data.summary.totalEarnings)}
            />
          </Box>
          <Box sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}>
            <SummaryCard
              color="secondary"
              icon={Star}
              subtitle="Rata-rata penyelesaian"
              title="Tingkat Selesai"
              value={`${data.summary.averageCompletionRate.toFixed(1)}%`}
            />
          </Box>

          {topMechanic && (
            <Box sx={{ gridColumn: "span 12" }}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.02),
                  boxShadow: "none",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 3,
                    p: 3,
                  }}
                >
                  <Stack direction="row" sx={{ gap: 2.5, alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.palette.secondary.main,
                      }}
                    >
                      <Award size={22} strokeWidth={1.5} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ fontWeight: 400, letterSpacing: "0.05em" }}
                      >
                        Performa Terbaik
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                        {topMechanic.mechanicName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {topMechanic.completedTasks} tugas selesai •{" "}
                        {formatToIdr(topMechanic.totalEarnings)} pendapatan
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 3, alignItems: "center" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 400 }}>
                        {topMechanic.completionRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Completion
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 400 }}>
                        {formatToIdr(topMechanic.averagePerTask)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Rata-rata/Tugas
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </Box>
          )}

          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Distribusi Tugas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Perbandingan tugas selesai & tertunda
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={taskChartData.datasets}
                  height={320}
                  labels={taskChartData.labels}
                  legend
                  stacked
                />
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Pendapatan Mekanik
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Akumulasi pendapatan dari tugas selesai
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={earningsChartData.datasets}
                  height={320}
                  labels={earningsChartData.labels}
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
                  Rincian Performa
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Tingkat penyelesaian & pendapatan per mekanik
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {["Mekanik", "Penyelesaian", "Tugas", "Pendapatan", "Rata-rata"].map(
                        (header) => (
                          <TableCell
                            key={header}
                            align={
                              header === "Mekanik" || header === "Penyelesaian"
                                ? "left"
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
                    {data.mechanics.map((mechanic, index) => {
                      const hasActivity = mechanic.totalTasks > 0;
                      const isLast = index === data.mechanics.length - 1;
                      return (
                        <TableRow
                          key={mechanic.mechanicId}
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
                            <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: `${theme.shape.borderRadius}px`,
                                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                  color: theme.palette.secondary.main,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.8125rem",
                                  fontWeight: 400,
                                  flexShrink: 0,
                                }}
                              >
                                {mechanic.mechanicName.charAt(0).toUpperCase()}
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                  {mechanic.mechanicName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                  {mechanic.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {hasActivity ? (
                              <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
                                <Box sx={{ flexGrow: 1, maxWidth: 140 }}>
                                  <LinearProgress
                                    value={mechanic.completionRate}
                                    variant="determinate"
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                      "& .MuiLinearProgress-bar": {
                                        bgcolor: theme.palette.secondary.main,
                                        borderRadius: 3,
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 400, minWidth: 48 }}>
                                  {mechanic.completionRate.toFixed(1)}%
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 400 }}>
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {mechanic.completedTasks}
                              <Box component="span" color="text.disabled">
                                {" "}
                                / {mechanic.totalTasks}
                              </Box>
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 400 }}>
                              {formatToIdr(mechanic.totalEarnings)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                              {mechanic.averagePerTask > 0
                                ? formatToIdr(mechanic.averagePerTask)
                                : "—"}
                            </Typography>
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

export default MechanicReport;