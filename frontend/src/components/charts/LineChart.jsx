/**
 * LineChart - Reusable line chart component with theme integration, area fill, and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.area=false] - Enable area fill below lines
 * @param {Object[]} [props.datasets=[]] - Chart datasets
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {string[]} [props.labels=[]] - Chart labels
 * @param {boolean} [props.legend=true] - Show legend
 * @param {boolean} [props.stepped=false] - Enable stepped lines
 * @param {string} [props.title=""] - Chart title
 * @param {boolean} [props.isCurrency=false] - Format Y axis and tooltip as IDR currency
 *
 * @returns {JSX.Element} Rendered line chart
 */
import { memo, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Line as LineChartJs } from "react-chartjs-2";
import { Box, useTheme } from "@mui/material";
import { formatToIdr } from "@shared/utils";
import { baseOptions, datasetShape, defaultColorsAlpha, enrichDatasets } from "./ChartConfig";

const MOBILE_HEIGHT_RATIO = 0.85;

const LineChart = memo(
  ({ area = false, datasets = [], height = 300, labels = [], legend = true, stepped = false, title = "", isCurrency = false }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    useEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, []);

    const enriched = enrichDatasets(datasets, theme).map((ds, i) => ({
      ...ds,
      fill: area
        ? {
            above: defaultColorsAlpha(theme, 0.08)[i % 6],
            below: defaultColorsAlpha(theme, 0.02)[i % 6],
            target: "origin",
          }
        : false,
      stepped,
      ...(area && { pointRadius: 0, pointBorderWidth: 0 }),
    }));

    const options = useMemo(() => {
      const base = baseOptions(theme, title, legend);

      if (isCurrency) {
        base.scales.y.ticks.callback = (value) => formatToIdr(value);
        base.plugins.tooltip.callbacks = {
          label: (context) => ` ${context.dataset.label || ""}: ${formatToIdr(context.parsed.y)}`,
        };
      }

      return base;
    }, [theme, title, legend, isCurrency]);

    return (
      <Box sx={{ height: { xs: typeof height === "number" ? height * MOBILE_HEIGHT_RATIO : height, sm: height }, position: "relative", width: "100%" }}>
        <LineChartJs ref={chartRef} data={{ datasets: enriched, labels }} options={options} redraw={true} />
      </Box>
    );
  }
);

LineChart.propTypes = {
  /** Enable area fill below lines */
  area: PropTypes.bool,
  /** Chart datasets */
  datasets: PropTypes.arrayOf(datasetShape),
  /** Chart height in pixels */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Chart labels */
  labels: PropTypes.arrayOf(PropTypes.string),
  /** Show legend */
  legend: PropTypes.bool,
  /** Enable stepped lines */
  stepped: PropTypes.bool,
  /** Chart title */
  title: PropTypes.string,
  /** Format Y axis and tooltip as IDR currency */
  isCurrency: PropTypes.bool,
};

export default LineChart;