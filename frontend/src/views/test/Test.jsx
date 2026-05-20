/**
 * Test - Test component for all chart components demonstration.
 *
 * @component
 * @returns {JSX.Element} Rendered test page
 */
import { useMemo } from "react";
import { useTheme, Box, Card, Stack, Typography } from "@mui/material";
import {
  BarChart,
  LineChart,
  DoughnutChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  BubbleChart,
} from "@components";

const Test = () => {
  const theme = useTheme();

  /**
   * Dummy data for bar chart - Monthly revenue
   * @type {Object}
   */
  const barData = useMemo(
    () => ({
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      datasets: [
        {
          label: "Pendapatan",
          data: [12000000, 15000000, 11000000, 18000000, 14000000, 20000000],
        },
        {
          label: "Pengeluaran",
          data: [8000000, 9000000, 7000000, 10000000, 8500000, 12000000],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for line chart - Daily orders
   * @type {Object}
   */
  const lineData = useMemo(
    () => ({
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      datasets: [
        {
          label: "Order Masuk",
          data: [25, 30, 28, 35, 40, 45, 32],
        },
        {
          label: "Order Selesai",
          data: [20, 25, 22, 30, 35, 42, 28],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for line chart with area - Revenue trend
   * @type {Object}
   */
  const lineAreaData = useMemo(
    () => ({
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      datasets: [
        {
          label: "Pendapatan",
          data: [12000000, 15000000, 11000000, 18000000, 14000000, 20000000],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for doughnut chart - Payment method distribution
   * @type {Object}
   */
  const doughnutData = useMemo(
    () => ({
      labels: ["Tunai", "QRIS", "Transfer"],
      datasets: [
        {
          data: [45000000, 35000000, 20000000],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for pie chart - Order status distribution
   * @type {Object}
   */
  const pieData = useMemo(
    () => ({
      labels: ["Selesai", "Proses", "Pending", "Batal"],
      datasets: [
        {
          data: [65, 20, 10, 5],
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            theme.palette.error.main,
          ],
        },
      ],
    }),
    [theme]
  );

  /**
   * Dummy data for polar area chart - Service type distribution
   * @type {Object}
   */
  const polarData = useMemo(
    () => ({
      labels: ["Servis Ringan", "Servis Berat", "Sparepart", "Oli", "Ban", "Aki"],
      datasets: [
        {
          data: [30, 15, 25, 15, 10, 5],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for radar chart - Mechanic performance
   * @type {Object}
   */
  const radarData = useMemo(
    () => ({
      labels: ["Kecepatan", "Kualitas", "Ketepatan", "Kerapihan", "Komunikasi", "Kehadiran"],
      datasets: [
        {
          label: "Mekanik A",
          data: [85, 90, 80, 88, 85, 95],
        },
        {
          label: "Mekanik B",
          data: [78, 85, 90, 82, 80, 90],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for scatter chart - Order value vs completion time
   * @type {Object}
   */
  const scatterData = useMemo(
    () => ({
      datasets: [
        {
          label: "Pesanan",
          data: [
            { x: 50000, y: 30 },
            { x: 150000, y: 45 },
            { x: 250000, y: 60 },
            { x: 350000, y: 90 },
            { x: 450000, y: 120 },
            { x: 550000, y: 150 },
            { x: 100000, y: 40 },
            { x: 200000, y: 55 },
            { x: 300000, y: 75 },
            { x: 400000, y: 100 },
          ],
        },
      ],
    }),
    []
  );

  /**
   * Dummy data for bubble chart - Product analysis
   * @type {Object}
   */
  const bubbleData = useMemo(
    () => ({
      datasets: [
        {
          label: "Sparepart",
          data: [
            { x: 50000, y: 15000, r: 25 },
            { x: 75000, y: 25000, r: 40 },
            { x: 100000, y: 35000, r: 30 },
            { x: 150000, y: 45000, r: 50 },
            { x: 200000, y: 55000, r: 35 },
          ],
        },
      ],
    }),
    []
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack sx={{ gap: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Chart Components Demo
        </Typography>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Bar Chart - Pendapatan Bulanan
          </Typography>
          <BarChart
            key="bar-chart"
            datasets={barData.datasets}
            labels={barData.labels}
            height={300}
            isCurrency
          />
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Line Chart - Order Harian
          </Typography>
          <LineChart
            key="line-chart"
            datasets={lineData.datasets}
            labels={lineData.labels}
            height={300}
          />
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Line Chart with Area - Tren Pendapatan
          </Typography>
          <LineChart
            key="line-area-chart"
            area
            datasets={lineAreaData.datasets}
            labels={lineAreaData.labels}
            height={300}
            isCurrency
          />
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Doughnut Chart - Metode Pembayaran
            </Typography>
            <DoughnutChart
              key="doughnut-chart"
              datasets={doughnutData.datasets}
              labels={doughnutData.labels}
              height={300}
              isCurrency
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Pie Chart - Status Pesanan
            </Typography>
            <PieChart
              key="pie-chart"
              datasets={pieData.datasets}
              labels={pieData.labels}
              height={300}
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Polar Area Chart - Tipe Servis
            </Typography>
            <PolarAreaChart
              key="polar-chart"
              datasets={polarData.datasets}
              labels={polarData.labels}
              height={300}
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Radar Chart - Performa Mekanik
            </Typography>
            <RadarChart
              key="radar-chart"
              datasets={radarData.datasets}
              labels={radarData.labels}
              height={300}
            />
          </Card>
        </Box>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Scatter Chart - Nilai Pesanan vs Waktu Pengerjaan
          </Typography>
          <ScatterChart
            key="scatter-chart"
            datasets={scatterData.datasets}
            height={300}
            isCurrency
          />
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Bubble Chart - Analisis Produk
          </Typography>
          <BubbleChart
            key="bubble-chart"
            datasets={bubbleData.datasets}
            height={300}
            isCurrency
          />
        </Card>
      </Stack>
    </Box>
  );
};

export default Test;