/**
 * PieChart - Reusable pie chart component with theme integration and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object[]} [props.datasets=[]] - Chart datasets
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {string[]} [props.labels=[]] - Chart labels
 * @param {boolean} [props.legend=true] - Show legend
 * @param {string} [props.title=""] - Chart title
 * @param {boolean} [props.isCurrency=false] - Format tooltip values as IDR currency
 *
 * @returns {JSX.Element} Rendered pie chart
 */
import { memo, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Pie as PieChartJs } from "react-chartjs-2";
import { Box, useTheme } from "@mui/material";
import { formatToIdr } from "@shared/utils";
import { circularBaseOptions, datasetShape, defaultColors } from "./ChartConfig";

const MOBILE_HEIGHT_RATIO = 0.85;

const PieChart = memo(
  ({ datasets = [], height = 300, labels = [], legend = true, title = "", isCurrency = false }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    useEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, []);

    const backgroundColors = datasets[0]?.backgroundColor || defaultColors(theme).slice(0, labels.length);

    const options = useMemo(() => {
      const base = {
        ...circularBaseOptions(theme, title, legend),
        cutout: "0%",
      };

      if (isCurrency) {
        base.plugins.tooltip.callbacks = {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return ` ${context.label || ""}: ${formatToIdr(value)} (${percentage}%)`;
          },
        };
      }

      return base;
    }, [theme, title, legend, isCurrency]);

    return (
      <Box sx={{ height: { xs: typeof height === "number" ? height * MOBILE_HEIGHT_RATIO : height, sm: height }, position: "relative", width: "100%" }}>
        <PieChartJs
          ref={chartRef}
          data={{
            datasets: [
              {
                ...datasets[0],
                backgroundColor: backgroundColors,
              },
            ],
            labels,
          }}
          options={options}
          redraw={true}
        />
      </Box>
    );
  }
);

PieChart.propTypes = {
  /** Chart datasets */
  datasets: PropTypes.arrayOf(datasetShape),
  /** Chart height in pixels */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Chart labels */
  labels: PropTypes.arrayOf(PropTypes.string),
  /** Show legend */
  legend: PropTypes.bool,
  /** Chart title */
  title: PropTypes.string,
  /** Format tooltip values as IDR currency */
  isCurrency: PropTypes.bool,
};

export default PieChart;