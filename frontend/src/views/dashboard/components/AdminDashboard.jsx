/**
 * AdminDashboard - Main admin dashboard with summary cards, low stock alerts, and inventory overview.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Dashboard data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.refetch - Refetch data handler
 *
 * @returns {JSX.Element} Rendered admin dashboard
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
import { Clock, DollarSign, RotateCcw, ShoppingCart, TrendingUp } from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";

const AdminDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  const lowStockData = useMemo(() => {
    if (!data?.inventory?.lowStockProducts?.length)
      return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          backgroundColor: data.inventory.lowStockProducts.map((_, i) =>
            alpha(theme.palette.secondary.main, 0.85 - i * 0.12)
          ),
          data: data.inventory.lowStockProducts.map((p) => p.stock),
          label: "Sisa Stok",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: data.inventory.lowStockProducts.map((p) => p.name),
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Card key={`sum-${i}`} sx={{ p: 2.5 }}>
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
          <Skeleton variant="rounded" width="100%" height={320} sx={{ mt: 3 }} />
        </Card>
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
              Dashboard Utama
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              Ringkasan performa bengkel hari ini
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
          gap: 3,
        }}
      >
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          subtitle={`Rata-rata ${formatToIdr(data?.today?.averageOrderValue || 0)}`}
          title="Pesanan Hari Ini"
          value={data?.today?.orders || 0}
        />
        <SummaryCard
          color="secondary"
          icon={DollarSign}
          subtitle="Total pemasukan kas"
          title="Pendapatan Hari Ini"
          value={formatToIdr(data?.today?.revenue || 0)}
        />
        <SummaryCard
          color="secondary"
          icon={TrendingUp}
          subtitle={`Dari ${data?.thisMonth?.orders || 0} pesanan`}
          title="Pendapatan Bulan Ini"
          value={formatToIdr(data?.thisMonth?.revenue || 0)}
        />
        <SummaryCard
          color="secondary"
          icon={Clock}
          subtitle="Menunggu antrean"
          title="Pesanan Tertunda"
          value={data?.pending?.orders || 0}
        />
      </Box>

      {/* Low Stock Chart */}
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
        }}
      >
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Peringatan Stok Menipis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {data?.inventory?.lowStockCount || 0} item membutuhkan restock segera
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          {lowStockData.labels.length > 0 ? (
            <BarChart
              datasets={lowStockData.datasets}
              height={320}
              labels={lowStockData.labels}
              legend={false}
            />
          ) : (
            <Stack
              sx={{
                alignItems: "center",
                justifyContent: "center",
                height: 320,
                gap: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                Semua Stok Terkendali
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                Tidak ada produk dalam status kritis
              </Typography>
            </Stack>
          )}
        </Box>
      </Card>
    </Stack>
  );
};

AdminDashboard.propTypes = {
  data: PropTypes.shape({
    activeShift: PropTypes.shape({
      cashier: PropTypes.string,
      currentCashSales: PropTypes.number,
      id: PropTypes.string,
      openedAt: PropTypes.string,
      orderCount: PropTypes.number,
      startingCash: PropTypes.number,
    }),
    inventory: PropTypes.shape({
      activeProducts: PropTypes.number,
      lowStockCount: PropTypes.number,
      lowStockProducts: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          sku: PropTypes.string,
          stock: PropTypes.number,
        })
      ),
      totalProducts: PropTypes.number,
      totalStockValue: PropTypes.number,
    }),
    pending: PropTypes.shape({ orders: PropTypes.number }),
    thisMonth: PropTypes.shape({
      orders: PropTypes.number,
      revenue: PropTypes.number,
    }),
    today: PropTypes.shape({
      averageOrderValue: PropTypes.number,
      date: PropTypes.string,
      orders: PropTypes.number,
      revenue: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default AdminDashboard;