/**
 * RadarChart - Reusable radar chart component with theme integration and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object[]} [props.datasets=[]] - Chart datasets
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {string[]} [props.labels=[]] - Chart labels
 * @param {boolean} [props.legend=true] - Show legend
 * @param {string} [props.title=""] - Chart title
 *
 * @returns {JSX.Element} Rendered radar chart
 */
import { memo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Radar as RadarChartJs } from "react-chartjs-2";
import { Box, useTheme } from "@mui/material";
import { datasetShape, defaultColors, defaultColorsAlpha, radarBaseOptions } from "./ChartConfig";

const MOBILE_HEIGHT_RATIO = 0.85;

const RadarChart = memo(
  ({ datasets = [], height = 300, labels = [], legend = true, title = "" }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    useEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, []);

    const enriched = datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || defaultColorsAlpha(theme, 0.2)[i % 6],
      borderColor: ds.borderColor || defaultColors(theme)[i % 6],
      pointBackgroundColor: defaultColors(theme)[i % 6],
      pointBorderColor: theme.palette.background.paper,
    }));

    return (
      <Box sx={{ height: { xs: typeof height === "number" ? height * MOBILE_HEIGHT_RATIO : height, sm: height }, position: "relative", width: "100%" }}>
        <RadarChartJs
          ref={chartRef}
          data={{ datasets: enriched, labels }}
          options={radarBaseOptions(theme, title, legend)}
          redraw={true}
        />
      </Box>
    );
  }
);

RadarChart.propTypes = {
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
};

export default RadarChart;