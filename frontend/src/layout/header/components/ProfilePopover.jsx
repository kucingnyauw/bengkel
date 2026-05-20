/**
 * ProfilePopover - User profile popover with avatar, role, and logout functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Popover open state
 * @param {HTMLElement} props.anchorEl - Anchor element
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.user - User data
 * @param {string} [props.user.fullName] - User full name
 * @param {string} [props.user.email] - User email
 * @param {string} [props.user.role] - User role
 *
 * @returns {JSX.Element} Rendered profile popover
 */
import { useSelector, useDispatch } from "react-redux";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Popover,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LogOut } from "lucide-react";
import { roleColorMap } from "@shared/constant";
import { getAvatarUrl } from "@shared/utils";
import { logout } from "@store/auth/authThunk.js";
import { selectAuthLoading } from "@store/auth/authSelector.js";
import { AppLoading } from "@components";

const ProfilePopover = ({ open, anchorEl, onClose, user }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            minWidth: 280,
            borderRadius: `${theme.shape.borderRadius}px`,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
            overflow: "hidden",
          },
        },
      }}
    >
      {/* User Info */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.text.primary, 0.02)} 0%, ${alpha(theme.palette.text.primary, 0.01)} 100%)`,
        }}
      >
        <Stack direction="row" sx={{ gap: 2.5, alignItems: "center" }}>
          <Avatar
            src={getAvatarUrl(user?.fullName)}
            sx={{
              width: 52,
              height: 52,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          />
          <Stack sx={{ minWidth: 0, gap: 0.25 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Stack>
        </Stack>

        <Chip
          label={
            user?.role === "CASHIER"
              ? "Kasir"
              : user?.role === "MECHANIC"
                ? "Mekanik"
                : user?.role || "—"
          }
          size="small"
          variant="outlined"
          color={roleColorMap[user?.role] || "default"}
          sx={{
            mt: 2.5,
            height: 24,
            "& .MuiChip-label": { px: 1, fontSize: "0.6875rem", fontWeight: 500 },
          }}
        />
      </Box>

      <Divider />

      {/* Logout Button */}
      <Box sx={{ p: 4 }}>
        <Button
          fullWidth
          onClick={handleLogout}
          size="medium"
          disabled={isLoading}
          sx={{
            justifyContent: "flex-start",
            borderRadius: `${theme.shape.borderRadius}px`,
            border: "1px solid",
            borderColor: alpha(theme.palette.error.main, 0.3),
            color: theme.palette.error.main,
            bgcolor: alpha(theme.palette.error.main, 0.04),
            py: 1,
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              borderColor: theme.palette.error.main,
            },
          }}
          startIcon={
            isLoading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <LogOut size={16} />
            )
          }
        >
          {isLoading ? "Keluar..." : "Keluar"}
        </Button>
      </Box>
    </Popover>
  );
};

export default ProfilePopover;