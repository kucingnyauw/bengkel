/**
 * SummaryCard - Dashboard summary card component with icon, value, trend indicator, and hover effects.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.color="primary"] - Theme color for accent (primary, secondary, success, warning, error, info)
 * @param {ElementType} props.icon - Lucide icon component
 * @param {string} [props.subtitle] - Card subtitle text
 * @param {string} props.title - Card title text
 * @param {string} [props.trend] - Trend direction ("up" or "down")
 * @param {string} [props.trendValue] - Trend percentage/value text
 * @param {string|number} props.value - Main value displayed
 *
 * @returns {JSX.Element} Rendered summary card
 *
 * @example
 * <SummaryCard
 *   title="Total Revenue"
 *   value="Rp 12.500.000"
 *   icon={DollarSign}
 *   color="success"
 *   trend="up"
 *   trendValue="12.5%"
 *   subtitle="vs bulan lalu"
 * />
 */
import { memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const SummaryCard = memo(
  ({ color = "primary", icon: Icon, subtitle, title, value, trend, trendValue }) => {
    const theme = useTheme();

    const resolvedColor =
      theme.palette[color]?.main || theme.palette.primary.main;

    const iconSize = 18;

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 120,
          overflow: "hidden",
          position: "relative",
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
          transition: theme.transitions.create(
            ["border-color", "box-shadow", "background-color"],
            {
              duration: theme.transitions.duration.shorter,
            }
          ),
          "&:hover": {
            borderColor: alpha(resolvedColor, 0.25),
            boxShadow: `0 4px 20px -4px ${alpha(resolvedColor, 0.1)}`,
            bgcolor: alpha(resolvedColor, 0.015),
          },
        }}
      >
        {/* Background Decorations */}
        <Box
          sx={{
            position: "absolute",
            right: -24,
            top: -24,
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: alpha(resolvedColor, 0.04),
            zIndex: 0,
            transition: theme.transitions.create(
              ["transform", "background-color"],
              {
                duration: theme.transitions.duration.standard,
              }
            ),
            ".MuiCard-root:hover &": {
              transform: "scale(1.15)",
              backgroundColor: alpha(resolvedColor, 0.07),
            },
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
            backgroundColor: alpha(resolvedColor, 0.06),
            zIndex: 0,
            transition: theme.transitions.create(
              ["transform", "background-color"],
              {
                duration: theme.transitions.duration.standard,
              }
            ),
            ".MuiCard-root:hover &": {
              transform: "scale(1.2)",
              backgroundColor: alpha(resolvedColor, 0.1),
            },
          }}
        />

        {/* Accent Line Top */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${alpha(resolvedColor, 0.5)}, transparent)`,
            zIndex: 1,
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shorter,
            }),
          }}
        />

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            p: 3,
            position: "relative",
            zIndex: 1,
            "&:last-child": {
              paddingBottom: 3,
            },
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              width: "100%",
            }}
          >
            <Stack
              sx={{
                flex: 1,
                minWidth: 0,
                gap: 0.5,
              }}
            >
              <Typography
                color="text.secondary"
                variant="body2"
                noWrap
                sx={{ fontWeight: 400 }}
              >
                {title}
              </Typography>

              <Stack
                direction="row"
                sx={{
                  alignItems: "baseline",
                  gap: 1,
                }}
              >
                <Typography
                  color="text.primary"
                  variant="h5"
                  noWrap
                  sx={{ fontWeight: 400 }}
                >
                  {value}
                </Typography>

                {trendValue && (
                  <Typography
                    color={trend === "up" ? "success.main" : "error.main"}
                    variant="caption"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      fontWeight: 400,
                    }}
                  >
                    {trend === "up" ? "↑" : "↓"} {trendValue}
                  </Typography>
                )}
              </Stack>

              {subtitle && (
                <Typography
                  color="text.secondary"
                  variant="caption"
                  noWrap
                  sx={{ fontWeight: 400 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Stack>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 48,
                height: 48,
                borderRadius: `${theme.shape.borderRadius}px`,
                backgroundColor: alpha(resolvedColor, 0.08),
                color: resolvedColor,
                transition: theme.transitions.create(
                  ["background-color", "box-shadow", "transform"],
                  {
                    duration: theme.transitions.duration.shorter,
                  }
                ),
                ".MuiCard-root:hover &": {
                  backgroundColor: alpha(resolvedColor, 0.12),
                  transform: "scale(1.05)",
                  boxShadow: `0 0 12px -2px ${alpha(resolvedColor, 0.2)}`,
                },
              }}
            >
              <Icon size={iconSize} strokeWidth={1.5} />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }
);

SummaryCard.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(["up", "down"]),
  trendValue: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default SummaryCard;