/**
 * ReportHeader - Header komponen untuk halaman report dengan judul, chip periode, refresh, dan tombol filter.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} props.title - Judul laporan
 * @param {string} props.subtitle - Subjudul laporan
 * @param {string} props.periodText - Teks periode yang sedang aktif
 * @param {boolean} props.isFilterActive - Status apakah filter sedang aktif
 * @param {Function} props.onRefresh - Handler refresh data
 * @param {Function} [props.onOpenFilter] - Handler buka dialog filter. Jika tidak dikirim, tombol filter tidak muncul.
 *
 * @returns {JSX.Element} Header laporan
 */
import {
    Box,
    Card,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    useTheme,
  } from "@mui/material";
  import { alpha } from "@mui/material/styles";
  import { CalendarDays, Filter, RotateCcw } from "lucide-react";
  
  const ReportHeader = ({
    title,
    subtitle,
    periodText,
    isFilterActive,
    onRefresh,
    onOpenFilter,
  }) => {
    const theme = useTheme();
  
    return (
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
          <Stack sx={{ gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                {subtitle}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
              <Chip
                icon={<CalendarDays size={14} />}
                label={periodText}
                variant="outlined"
                size="medium"
                sx={{
                  borderColor: alpha(theme.palette.divider, 0.8),
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  height: 32,
                  fontWeight: 400,
                  "& .MuiChip-label": { px: 1.5, fontSize: "0.8125rem" },
                  "& .MuiChip-icon": { ml: 1.5, mr: -0.5 },
                }}
              />
              {isFilterActive && onOpenFilter && (
                <Chip
                  label="Filter aktif"
                  color="secondary"
                  size="medium"
                  variant="outlined"
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    height: 31,
                    fontWeight: 400,
                    "& .MuiChip-label": { px: 1.5, fontSize: "0.8125rem" },
                  }}
                />
              )}
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ gap: 0.5 }}>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={onRefresh}
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
            {onOpenFilter && (
              <Tooltip title="Filter periode">
                <IconButton
                  onClick={onOpenFilter}
                  sx={{
                    border: "1px solid",
                    borderColor: isFilterActive
                      ? alpha(theme.palette.secondary.main, 0.4)
                      : alpha(theme.palette.divider, 0.8),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    color: isFilterActive
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                    bgcolor: isFilterActive
                      ? alpha(theme.palette.secondary.main, 0.06)
                      : alpha(theme.palette.background.paper, 0.6),
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      { duration: theme.transitions.duration.shorter }
                    ),
                    "&:hover": {
                      bgcolor: isFilterActive
                        ? alpha(theme.palette.secondary.main, 0.12)
                        : alpha(theme.palette.secondary.main, 0.06),
                      borderColor: isFilterActive
                        ? theme.palette.secondary.main
                        : alpha(theme.palette.secondary.main, 0.4),
                      color: isFilterActive
                        ? theme.palette.secondary.main
                        : theme.palette.secondary.main,
                    },
                  }}
                >
                  <Filter size={18} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Card>
    );
  };
  
  export default ReportHeader;