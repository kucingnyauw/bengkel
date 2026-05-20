/**
 * MechanicReport - Mechanic performance report page with charts, summary cards, and period filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered mechanic performance report page
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
  LinearProgress,
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
  Award,
  CalendarDays,
  DollarSign,
  Filter,
  RotateCcw,
  Star,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { formatToIdr, formatDate } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";
import { useMechanicPerformanceReport } from "@views/reports/hooks";

const CHART_HEIGHT = 320;

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
          backgroundColor: theme.palette.text.primary,
          borderRadius: theme.shape.borderRadius,
        },
        {
          data: sortedMechanics.map((m) => m.pendingTasks),
          label: "Tertunda",
          stack: "stack1",
          backgroundColor: alpha(theme.palette.text.primary, 0.2),
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
          backgroundColor: alpha(theme.palette.text.primary, 0.8),
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
            <Skeleton
              variant="rounded"
              width="100%"
              height={CHART_HEIGHT}
              sx={{ mt: 3 }}
            />
          </Card>
        </Box>
        <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            <Skeleton
              variant="rounded"
              width="100%"
              height={CHART_HEIGHT}
              sx={{ mt: 3 }}
            />
          </Card>
        </Box>
        <Box sx={{ gridColumn: "span 12" }}>
          <Card sx={{ p: 3 }}>
            <Skeleton width={240} height={28} />
            <Skeleton width={320} height={16} sx={{ mt: 1 }} />
            <Skeleton
              variant="rounded"
              width="100%"
              height={360}
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
                  Performa Mekanik
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Pantau produktivitas & pendapatan tiap mekanik
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

      {!data?.mechanics?.length ? (
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
                <Users size={32} style={{ opacity: 0.3 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Belum Ada Data Mekanik
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tidak ada data performa mekanik untuk periode ini.
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
          {/* Summary Cards */}
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={Users}
              subtitle="Mekanik terdaftar"
              title="Total Mekanik"
              value={data.summary.totalMechanics}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={Wrench}
              subtitle={`${data.summary.totalCompleted} selesai`}
              title="Total Tugas"
              value={data.summary.totalTasks}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={DollarSign}
              subtitle="Akumulasi pendapatan"
              title="Total Pendapatan"
              value={formatToIdr(data.summary.totalEarnings)}
            />
          </Box>
          <Box
            sx={{ gridColumn: { lg: "span 3", sm: "span 6", xs: "span 12" } }}
          >
            <SummaryCard
              color="primary"
              icon={Star}
              subtitle="Rata-rata penyelesaian"
              title="Tingkat Selesai"
              value={`${data.summary.averageCompletionRate.toFixed(1)}%`}
            />
          </Box>

          {/* Top Mechanic Card */}
          {topMechanic && (
            <Box sx={{ gridColumn: "span 12" }}>
              <Card>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 3,
                    p: 3,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ gap: 2.5, alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.palette.text.primary,
                      }}
                    >
                      <Award size={24} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ letterSpacing: "0.05em" }}
                      >
                        Performa Terbaik
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {topMechanic.mechanicName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {topMechanic.completedTasks} tugas selesai •{" "}
                        {formatToIdr(topMechanic.totalEarnings)} pendapatan
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 3, alignItems: "center" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" fontWeight={700}>
                        {topMechanic.completionRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completion
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" fontWeight={700}>
                        {formatToIdr(topMechanic.averagePerTask)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rata-rata/Tugas
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </Box>
          )}

          {/* Task Distribution Chart */}
          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Distribusi Tugas
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Perbandingan tugas selesai & tertunda
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={taskChartData.datasets}
                  height={CHART_HEIGHT}
                  labels={taskChartData.labels}
                  legend
                  stacked
                />
              </Box>
            </Card>
          </Box>

          {/* Earnings Chart */}
          <Box sx={{ gridColumn: { lg: "span 6", xs: "span 12" } }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Pendapatan Mekanik
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Akumulasi pendapatan dari tugas selesai
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <BarChart
                  datasets={earningsChartData.datasets}
                  height={CHART_HEIGHT}
                  labels={earningsChartData.labels}
                  legend={false}
                  isCurrency
                />
              </Box>
            </Card>
          </Box>

          {/* Detail Table */}
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>
                  Rincian Performa
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Tingkat penyelesaian & pendapatan per mekanik
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {[
                        "Mekanik",
                        "Penyelesaian",
                        "Tugas",
                        "Pendapatan",
                        "Rata-rata",
                      ].map((header) => (
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
                            fontWeight={600}
                            color="text.secondary"
                            sx={{
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {header}
                          </Typography>
                        </TableCell>
                      ))}
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
                              sx={{ alignItems: "center", gap: 2 }}
                            >
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: `${theme.shape.borderRadius}px`,
                                  bgcolor: alpha(
                                    theme.palette.text.primary,
                                    0.08
                                  ),
                                  color: theme.palette.text.primary,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {mechanic.mechanicName.charAt(0).toUpperCase()}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {mechanic.mechanicName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {mechanic.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {hasActivity ? (
                              <Stack
                                direction="row"
                                sx={{ alignItems: "center", gap: 2 }}
                              >
                                <Box sx={{ flexGrow: 1, maxWidth: 140 }}>
                                  <LinearProgress
                                    value={mechanic.completionRate}
                                    variant="determinate"
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha(
                                        theme.palette.text.primary,
                                        0.08
                                      ),
                                      "& .MuiLinearProgress-bar": {
                                        bgcolor: theme.palette.text.primary,
                                        borderRadius: 3,
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ minWidth: 48 }}
                                >
                                  {mechanic.completionRate.toFixed(1)}%
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {mechanic.completedTasks}
                              <Box component="span" color="text.disabled">
                                {" "}
                                / {mechanic.totalTasks}
                              </Box>
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatToIdr(mechanic.totalEarnings)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
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

      {/* Filter Dialog */}
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

export default MechanicReport;
