/**
 * BarChart - Reusable bar chart component with theme integration and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string[]} [props.labels=[]] - Chart labels
 * @param {Object[]} [props.datasets=[]] - Chart datasets
 * @param {string} [props.title=""] - Chart title
 * @param {boolean} [props.legend=true] - Show legend
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {boolean} [props.stacked=false] - Enable stacked bars
 * @param {boolean} [props.horizontal=false] - Enable horizontal bars
 * @param {boolean} [props.isCurrency=false] - Format Y axis and tooltip as IDR currency
 *
 * @returns {JSX.Element} Rendered bar chart
 */
import { memo, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Bar as BarChartJs } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";
import { formatToIdr } from "@shared/utils";
import { datasetShape, enrichDatasets, baseOptions } from "./ChartConfig";

const MOBILE_HEIGHT_RATIO = 0.85;

const BarChart = memo(
  ({
    labels = [],
    datasets = [],
    title = "",
    legend = true,
    height = 300,
    stacked = false,
    horizontal = false,
    isCurrency = false,
  }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    useEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, []);

    const enriched = enrichDatasets(datasets, theme).map((ds) => ({
      ...ds,
      borderRadius: horizontal ? 0 : ds.borderRadius,
    }));

    const options = useMemo(() => {
      const base = baseOptions(theme, title, legend);

      base.scales.x.stacked = stacked;
      base.scales.y.stacked = stacked;
      base.interaction = stacked
        ? { mode: "index" }
        : { mode: "nearest", intersect: true };
      base.indexAxis = horizontal ? "y" : "x";

      if (isCurrency) {
        const axis = horizontal ? "x" : "y";
        base.scales[axis].ticks.callback = (value) => formatToIdr(value);
        base.plugins.tooltip.callbacks = {
          label: (context) => {
            const formattedValue = formatToIdr(context.raw);
            const labelText = context.dataset.label || "";
            return ` ${labelText}: ${formattedValue}`;
          },
        };
      }

      return base;
    }, [theme, title, legend, stacked, horizontal, isCurrency]);

    return (
      <Box
        sx={{
          height: {
            xs:
              typeof height === "number"
                ? height * MOBILE_HEIGHT_RATIO
                : height,
            sm: height,
          },
          position: "relative",
          width: "100%",
        }}
      >
        <BarChartJs
          ref={chartRef}
          data={{ labels, datasets: enriched }}
          options={options}
          redraw={true}
        />
      </Box>
    );
  }
);

BarChart.propTypes = {
  /** Chart labels */
  labels: PropTypes.arrayOf(PropTypes.string),
  /** Chart datasets */
  datasets: PropTypes.arrayOf(datasetShape),
  /** Chart title */
  title: PropTypes.string,
  /** Show legend */
  legend: PropTypes.bool,
  /** Chart height in pixels */
  height: PropTypes.number,
  /** Enable stacked bars */
  stacked: PropTypes.bool,
  /** Enable horizontal bars */
  horizontal: PropTypes.bool,
  /** Format Y axis and tooltip as IDR currency */
  isCurrency: PropTypes.bool,
};

export default BarChart;
