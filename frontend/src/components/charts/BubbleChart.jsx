/**
 * BubbleChart - Reusable bubble chart component with theme integration and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object[]} [props.datasets=[]] - Chart datasets with x, y, r values
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {boolean} [props.legend=true] - Show legend
 * @param {string} [props.title=""] - Chart title
 * @param {boolean} [props.isCurrency=false] - Format axis and tooltip as IDR currency
 *
 * @returns {JSX.Element} Rendered bubble chart
 */
import { memo, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Bubble as BubbleChartJs } from "react-chartjs-2";
import { Box, useTheme } from "@mui/material";
import { formatToIdr } from "@shared/utils";
import { baseOptions, datasetShape, enrichDatasets } from "./ChartConfig";

const MOBILE_HEIGHT_RATIO = 0.85;

const BubbleChart = memo(
  ({ datasets = [], height = 300, legend = true, title = "", isCurrency = false }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    useEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, []);

    const enriched = enrichDatasets(datasets, theme);

    const options = useMemo(() => {
      const base = baseOptions(theme, title, legend);

      if (isCurrency) {
        base.scales.x.ticks.callback = (value) => formatToIdr(value);
        base.scales.y.ticks.callback = (value) => formatToIdr(value);
        base.plugins.tooltip.callbacks = {
          label: (context) => {
            const xVal = formatToIdr(context.parsed.x);
            const yVal = formatToIdr(context.parsed.y);
            const rVal = context.raw.r;
            const labelText = context.dataset.label || "";
            return ` ${labelText}: (${xVal}, ${yVal}, r: ${rVal})`;
          },
        };
      }

      return base;
    }, [theme, title, legend, isCurrency]);

    return (
      <Box sx={{ height: { xs: typeof height === "number" ? height * MOBILE_HEIGHT_RATIO : height, sm: height }, position: "relative", width: "100%" }}>
        <BubbleChartJs ref={chartRef} data={{ datasets: enriched }} options={options} redraw={true} />
      </Box>
    );
  }
);

BubbleChart.propTypes = {
  /** Chart datasets with x, y, r values */
  datasets: PropTypes.arrayOf(datasetShape),
  /** Chart height in pixels */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Show legend */
  legend: PropTypes.bool,
  /** Chart title */
  title: PropTypes.string,
  /** Format axis and tooltip as IDR currency */
  isCurrency: PropTypes.bool,
};

export default BubbleChart;