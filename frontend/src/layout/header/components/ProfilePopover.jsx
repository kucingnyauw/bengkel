/**
 * ProfilePopover - User profile popover with greeting, role, theme toggle, cart access, and logout functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Popover open state
 * @param {HTMLElement} props.anchorEl - Anchor element
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.user - User data
 * @param {string} [props.user.fullName] - User full name
 * @param {string} [props.user.role] - User role
 * @param {string} [props.user.avatar] - User avatar URL
 * @param {boolean} props.isCashier - Whether user is a cashier
 * @param {Function} [props.onOpenCart] - Handler to open the cart drawer/modal
 *
 * @returns {JSX.Element} Rendered profile popover
 */
import { useSelector, useDispatch } from "react-redux";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronRight, LogOut, Moon, ShoppingCart, Sun } from "lucide-react";

import { getGreeting, getAvatarUrl } from "@shared/utils";
import { logout } from "@store/auth/authThunk.js";
import { selectAuthLoading } from "@store/auth/authSelector.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectCartItems } from "@store/cart/cartSelector.js";
import { AppLoading } from "@components";

const ProfilePopover = ({
  open,
  anchorEl,
  onClose,
  user,
  isCashier,
  onOpenCart,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const isLoading = useSelector(selectAuthLoading);
  const mode = useSelector(selectThemeMode);
  const cartItems = useSelector(selectCartItems);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const handleToggleTheme = (event) => {
    event.stopPropagation();
    dispatch(toggleTheme());
  };

  const handleCartClick = () => {
    onClose();
    if (onOpenCart) onOpenCart();
  };

  const menuItemStyles = {
    borderRadius: `${theme.shape.borderRadius}px`,
    px: 1.5,
    py: 1,
    transition: "all 0.2s ease",
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.06),
    },
  };

  const iconContainerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: `${theme.shape.borderRadius}px`,
  };

  return (
    <>
      {isLoading && <AppLoading />}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1.5,
              width: 300,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: `0 16px 48px ${alpha(
                theme.palette.common.black,
                0.12
              )}`,
              overflow: "hidden",
              backgroundColor: theme.palette.background.paper,
              backgroundImage: "none !important",
              p: 2,
              ...(theme.palette.mode === "dark" && {
                backgroundColor: theme.palette.background.paper,
                backgroundImage: "none !important",
              }),
            },
          },
        }}
      >
        {/* User Profile Section */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              src={getAvatarUrl(user?.fullName)}
              alt={user?.fullName}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "text.primary",
                  mb: 0.25,
                }}
              >
                {user?.fullName || "Pengguna"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  textTransform: "capitalize",
                  letterSpacing: "0.02em",
                  color: "text.secondary",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: alpha(theme.palette.divider, 0.3),
                  px: 1,
                  py: 0.25,
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                {user?.role || "—"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Greeting */}
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: `${theme.shape.borderRadius}px`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 400,
              color: "text.secondary",
              lineHeight: 1.5,
            }}
          >
            {getGreeting()}
          </Typography>
        </Box>

        <Divider
          sx={{ borderColor: alpha(theme.palette.divider, 0.3), mb: 1.5 }}
        />

        {/* Menu Items */}
        <List sx={{ p: 0, mb: 0.5 }}>
          {/* Cart Menu - Only visible for Kasir */}
          {isCashier && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={handleCartClick} sx={menuItemStyles}>
                <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
                  <Box
                    sx={{
                      ...iconContainerStyles,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <ShoppingCart size={16} strokeWidth={1.5} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Keranjang Belanja"
                  slotProps={{
                    primary: {
                      variant: "body2",
                      fontWeight: 500,
                      color: "text.primary",
                      fontSize: "0.875rem",
                    },
                  }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  {cartItems.length > 0 && (
                    <Badge
                      badgeContent={cartItems.length}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "static",
                          transform: "none",
                          fontSize: "0.65rem",
                          height: 18,
                          minWidth: 18,
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                      }}
                    />
                  )}
                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    color={theme.palette.text.disabled}
                  />
                </Stack>
              </ListItemButton>
            </ListItem>
          )}

          {/* Theme Toggle */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleToggleTheme} sx={menuItemStyles}>
              <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
                <Box
                  sx={{
                    ...iconContainerStyles,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    color: theme.palette.warning.main,
                  }}
                >
                  {mode === "dark" ? (
                    <Sun size={16} strokeWidth={1.5} />
                  ) : (
                    <Moon size={16} strokeWidth={1.5} />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={mode === "dark" ? "Mode Terang" : "Mode Gelap"}
                slotProps={{
                  primary: {
                    variant: "body2",
                    fontWeight: 500,
                    color: "text.primary",
                    fontSize: "0.875rem",
                  },
                }}
              />
              <Switch
                size="small"
                checked={mode === "dark"}
                onChange={handleToggleTheme}
                onClick={(event) => event.stopPropagation()}
                sx={{
                  ml: 0.5,
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: theme.palette.warning.main,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    bgcolor: alpha(theme.palette.warning.main, 0.5),
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider
          sx={{ borderColor: alpha(theme.palette.divider, 0.3), mb: 0.5 }}
        />

        {/* Logout */}
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              disabled={isLoading}
              sx={{
                ...menuItemStyles,
                color: theme.palette.error.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, mr: 0.5, color: "inherit" }}>
                <Box
                  sx={{
                    ...iconContainerStyles,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: "inherit",
                  }}
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Keluar"
                slotProps={{
                  primary: {
                    variant: "body2",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </>
  );
};

export default ProfilePopover;
