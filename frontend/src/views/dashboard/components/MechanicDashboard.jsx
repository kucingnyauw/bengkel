/**
 * MechanicDashboard - Mechanic dashboard with task progress, pending tasks, and daily earnings.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Dashboard data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.refetch - Refetch data handler
 *
 * @returns {JSX.Element} Rendered mechanic dashboard
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Clock, DollarSign, RotateCcw, Wrench } from "lucide-react";

import { formatDate, formatToIdr, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { BarChart, SummaryCard } from "@components";

const CHART_HEIGHT = 200;

const MechanicDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  const taskChartData = useMemo(() => {
    if (!data?.overallStats) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          data: [data.overallStats.completedTasks || 0],
          label: "Selesai",
          backgroundColor: alpha(theme.palette.text.primary, 0.8),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
          stack: "stack1",
        },
        {
          data: [data.overallStats.pendingTasks || 0],
          label: "Pending",
          backgroundColor: alpha(theme.palette.text.primary, 0.2),
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
          stack: "stack1",
        },
      ],
      labels: ["Tugas"],
    };
  }, [data, theme]);

  if (isLoading) {
    return (
      <Stack sx={{ gap: 3 }}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Skeleton width={280} height={36} />
              <Skeleton width={180} height={20} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={40} height={40} />
          </Stack>
        </Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 3 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ p: 2.5 }}>
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={32} />
                <Skeleton width="50%" height={14} />
              </Stack>
            </Card>
          ))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" }, gap: 3 }}>
          <Card sx={{ p: 3, minHeight: 420 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={CHART_HEIGHT} sx={{ mt: 3 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mt: 3 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width="100%" height={80} />
              ))}
            </Box>
          </Card>
          <Card sx={{ p: 3, minHeight: 420 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width="100%" height={80} sx={{ mt: 2 }} />
            ))}
          </Card>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Header */}
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
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Dashboard Mekanik
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pantau tugas dan performa Anda hari ini
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Chip
              label={formatDate(new Date(), { dateStyle: "full" })}
              variant="outlined"
              size="small"
              sx={{
                borderColor: alpha(theme.palette.divider, 0.8),
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                px: 0.5,
                py: 0.5,
                height: 28,
                "& .MuiChip-label": { px: 1, fontSize: "0.75rem" },
              }}
            />
            <Tooltip title="Refresh data">
              <IconButton
                onClick={() => refetch?.()}
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
          </Stack>
        </Stack>
      </Card>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 3 }}>
        <SummaryCard
          color="primary"
          icon={Clock}
          subtitle={`${data?.todayTasks?.completed || 0} selesai hari ini`}
          title="Tugas Menunggu"
          value={data?.todayTasks?.pending || 0}
        />
        <SummaryCard
          color="primary"
          icon={Wrench}
          subtitle="Keseluruhan tugas"
          title="Total Tugas"
          value={data?.overallStats?.totalTasks || 0}
        />
        <SummaryCard
          color="primary"
          icon={DollarSign}
          subtitle="Pendapatan hari ini"
          title="Pendapatan"
          value={formatToIdr(data?.todayTasks?.earnings || 0)}
        />
      </Box>

      {/* Task Progress & Pending Tasks */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" }, gap: 3 }}>
        {/* Task Progress */}
        <Card sx={{ height: "100%" }}>
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Progress Tugas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Perbandingan tugas selesai & pending
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {data?.overallStats && (data.overallStats.totalTasks > 0) ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <BarChart
                    datasets={taskChartData.datasets}
                    height={CHART_HEIGHT}
                    labels={taskChartData.labels}
                    legend={false}
                    stacked
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                  {[
                    { value: data.overallStats.completedTasks || 0, label: "Selesai" },
                    { value: data.overallStats.pendingTasks || 0, label: "Pending" },
                    { value: data.overallStats.totalTasks || 0, label: "Total" },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.4),
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h4" fontWeight={700}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 300, gap: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wrench size={28} style={{ opacity: 0.3 }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Belum Ada Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data tugas akan muncul di sini
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        </Card>

        {/* Pending Tasks */}
        <Card sx={{ height: "100%" }}>
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Tugas Menunggu
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {data?.pendingTasks?.length || 0} tugas perlu diselesaikan
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
            {data?.pendingTasks?.length > 0 ? (
              <Stack sx={{ gap: 2, flex: 1 }}>
                {data.pendingTasks.map((task) => (
                  <Stack
                    key={task.assignmentId}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      bgcolor: alpha(theme.palette.background.paper, 0.4),
                      transition: theme.transitions.create("background-color"),
                      "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.03) },
                    }}
                  >
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {task.serviceName}
                      </Typography>
                      <Stack direction="row" sx={{ gap: 1, alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary">
                          {task.orderNumber}
                        </Typography>
                        {task.plateNumber && (
                          <Typography variant="caption" color="text.disabled">
                            • {task.plateNumber}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                    <Chip
                      label={normalizeEnumText(OrderStatus[task.status] || task.status)}
                      color={statusColorMap[task.status] || "default"}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Stack sx={{ alignItems: "center", justifyContent: "center", flex: 1, gap: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wrench size={28} style={{ opacity: 0.3 }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Semua Tugas Selesai
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada tugas yang menunggu
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        </Card>
      </Box>
    </Stack>
  );
};

MechanicDashboard.propTypes = {
  /** Dashboard data */
  data: PropTypes.shape({
    overallStats: PropTypes.shape({
      completedTasks: PropTypes.number,
      pendingTasks: PropTypes.number,
      totalTasks: PropTypes.number,
    }),
    pendingTasks: PropTypes.arrayOf(
      PropTypes.shape({
        assignmentId: PropTypes.string,
        orderItemId: PropTypes.string,
        orderId: PropTypes.string,
        orderNumber: PropTypes.string,
        plateNumber: PropTypes.string,
        serviceName: PropTypes.string,
        status: PropTypes.string,
      })
    ),
    todayTasks: PropTypes.shape({
      completed: PropTypes.number,
      earnings: PropTypes.number,
      pending: PropTypes.number,
    }),
  }),
  /** Loading state */
  isLoading: PropTypes.bool,
  /** Refetch data handler */
  refetch: PropTypes.func,
};

export default MechanicDashboard;