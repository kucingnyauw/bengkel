/**
 * CashierDashboard - Cashier dashboard with shift info, today's sales, order progress, and recent orders.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Dashboard data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.refetch - Refetch data handler
 *
 * @returns {JSX.Element} Rendered cashier dashboard
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
import {
  Clock,
  DollarSign,
  Receipt,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";

import { formatDate, formatToIdr, formatDateTime } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { DoughnutChart, SummaryCard } from "@components";

const CashierDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  const orderProgress = useMemo(() => {
    const completed = data?.todaySales?.todayOrders || 0;
    const pending = data?.todaySales?.pendingOrders || 0;
    return {
      labels: ["Selesai", "Pending"],
      datasets: [
        {
          data: [completed, pending],
          backgroundColor: [
            alpha(theme.palette.secondary.main, 0.8),
            alpha(theme.palette.secondary.main, 0.2),
          ],
          borderWidth: 0,
        },
      ],
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
        <Card sx={{ p: 3 }}>
          <Skeleton width={240} height={28} />
          <Skeleton width={320} height={16} sx={{ mt: 1 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2, mt: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" width="100%" height={80} />
            ))}
          </Box>
        </Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
          <Card sx={{ p: 3, minHeight: 420 }}>
            <Skeleton width={180} height={28} />
            <Skeleton width={240} height={16} sx={{ mt: 1 }} />
            <Skeleton variant="circular" width={220} height={220} sx={{ mx: "auto", mt: 3 }} />
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
            right: -24,
            top: -24,
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: alpha(theme.palette.secondary.main, 0.04),
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: -12,
            bottom: -12,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: alpha(theme.palette.secondary.main, 0.06),
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
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Dashboard Kasir
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              Ringkasan transaksi dan shift Anda hari ini
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Chip
              label={formatDate(new Date(), { dateStyle: "full" })}
              variant="outlined"
              size="medium"
              sx={{
                borderColor: alpha(theme.palette.divider, 0.8),
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                height: 32,
                fontWeight: 400,
                "& .MuiChip-label": { px: 1.5, fontSize: "0.8125rem" },
              }}
            />
            <Tooltip title="Refresh data">
              <IconButton
                onClick={() => refetch?.()}
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  color: theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "color"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    borderColor: alpha(theme.palette.secondary.main, 0.4),
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <RotateCcw size={18} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 3 }}>
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          subtitle={`${data?.todaySales?.pendingOrders || 0} menunggu`}
          title="Pesanan Hari Ini"
          value={data?.todaySales?.todayOrders || 0}
        />
        <SummaryCard
          color="secondary"
          icon={DollarSign}
          subtitle="Total pemasukan"
          title="Pendapatan Hari Ini"
          value={formatToIdr(data?.todaySales?.todaySales || 0)}
        />
        <SummaryCard
          color="secondary"
          icon={Clock}
          subtitle={data?.activeShift ? `Saldo awal ${formatToIdr(data.activeShift.startingCash)}` : "Buka shift untuk mulai"}
          title="Status Shift"
          value={data?.activeShift ? "Aktif" : "Belum Dibuka"}
        />
      </Box>

      {/* Active Shift Info */}
      {data?.activeShift && (
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
          }}
        >
          <Box sx={{ px: 3, py: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Informasi Shift
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Detail shift yang sedang berjalan
                </Typography>
              </Box>
              <Chip
                label="Aktif"
                size="small"
                variant="soft"
                color="success"
                sx={{
                  height: 24,
                  fontWeight: 400,
                  "& .MuiChip-label": { px: 1, fontSize: "0.6875rem" },
                }}
              />
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              {[
                { label: "Waktu Buka", value: formatDateTime(data.activeShift.openedAt) },
                { label: "Saldo Awal", value: formatToIdr(data.activeShift.startingCash) },
                { label: "Penjualan Tunai", value: formatToIdr(data.activeShift.currentCashSales || 0) },
                { label: "Total Order", value: `${data.activeShift.orderCount || 0} Pesanan` },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, textTransform: "uppercase" }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 400 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* Order Progress & Recent Orders */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
        {/* Order Progress */}
        <Card
          sx={{
            height: "100%",
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
          }}
        >
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 400 }}>
              Progress Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              Perbandingan order selesai & pending
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 220, mx: "auto", mb: 3 }}>
              <DoughnutChart labels={orderProgress.labels} datasets={orderProgress.datasets} height={200} />
            </Box>
            <Stack direction="row" sx={{ gap: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 400 }}>
                  {data?.todaySales?.todayOrders || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Selesai
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 400 }}>
                  {data?.todaySales?.pendingOrders || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  Pending
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Recent Orders */}
        <Card
          sx={{
            height: "100%",
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
          }}
        >
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 400 }}>
              Pesanan Terbaru
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              {data?.recentOrders?.length || 0} pesanan terakhir
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
            {data?.recentOrders?.length > 0 ? (
              <Stack sx={{ gap: 1.5, flex: 1 }}>
                {data.recentOrders.map((order) => (
                  <Stack
                    key={order.id}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      transition: theme.transitions.create("background-color"),
                      "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.04) },
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 2, alignItems: "center", minWidth: 0 }}>
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
                          flexShrink: 0,
                        }}
                      >
                        <Receipt size={16} strokeWidth={1.5} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                          {order.customer?.name || "Pelanggan Umum"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                      <Chip
                        label={OrderStatus[order.status] || order.status}
                        color={statusColorMap[order.status] || "default"}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 400 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                        {formatToIdr(order.total)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Stack sx={{ alignItems: "center", justifyContent: "center", flex: 1, gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                  Belum Ada Pesanan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Pesanan baru akan muncul di sini
                </Typography>
              </Stack>
            )}
          </Box>
        </Card>
      </Box>
    </Stack>
  );
};

CashierDashboard.propTypes = {
  data: PropTypes.shape({
    activeShift: PropTypes.shape({
      currentCashSales: PropTypes.number,
      openedAt: PropTypes.string,
      orderCount: PropTypes.number,
      startingCash: PropTypes.number,
    }),
    recentOrders: PropTypes.arrayOf(
      PropTypes.shape({
        customer: PropTypes.shape({ name: PropTypes.string }),
        id: PropTypes.string,
        orderNumber: PropTypes.string,
        status: PropTypes.string,
        total: PropTypes.number,
      })
    ),
    todaySales: PropTypes.shape({
      pendingOrders: PropTypes.number,
      todayOrders: PropTypes.number,
      todaySales: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default CashierDashboard;