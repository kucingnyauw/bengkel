/**
 * NotificationHandler - Global notification handler supporting snackbar and dialog variants.
 *
 * @component
 * @returns {JSX.Element|null} Rendered notification or null
 */
import { RotateCcw, X } from "lucide-react";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { hideNotification } from "@store/notifications/notificationsSlice.js";
import {
  selectNotificationOpen,
  selectNotificationMessage,
  selectNotificationType,
  selectNotificationTitle,
  selectNotificationVariant,
  selectNotificationAutoHide,
} from "@store/notifications/notificationsSelector.js";

const NotificationHandler = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const open = useSelector(selectNotificationOpen);
  const type = useSelector(selectNotificationType);
  const title = useSelector(selectNotificationTitle);
  const message = useSelector(selectNotificationMessage);
  const variant = useSelector(selectNotificationVariant);
  const autoHide = useSelector(selectNotificationAutoHide);

  const handleClose = () => dispatch(hideNotification());

  const handleRefresh = () => {
    handleClose();
    window.location.reload();
  };

  if (!open) return null;

  if (variant === "dialog") {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            },
          },
        }}
      >
        {title && (
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 500,
            }}
          >
            {title}
            <IconButton onClick={handleClose} size="small">
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </DialogTitle>
        )}

        <DialogContent dividers={!!title}>
          <DialogContentText sx={{ fontWeight: 400 }}>
            {message}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Stack direction="row" sx={{ gap: 1, width: "100%", justifyContent: "space-between" }}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RotateCcw size={14} strokeWidth={1.5} />}
              sx={{ fontWeight: 400 }}
            >
              Refresh
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleClose}
              sx={{ fontWeight: 400 }}
            >
              Tutup
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHide}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      slotProps={{
        transition: {
          direction: "up",
        },
      }}
    >
      <Alert
        severity={type}
        variant="outlined"
        sx={{
          borderRadius: `${theme.shape.borderRadius}px`,
          border: `1px solid ${alpha(theme.palette[type]?.main || theme.palette.primary.main, 0.3)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(8px)",
          boxShadow: theme.shadows[3],
          alignItems: "center",
          fontWeight: 400,
          "& .MuiAlert-icon": {
            color: theme.palette[type]?.main || theme.palette.primary.main,
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationHandler;