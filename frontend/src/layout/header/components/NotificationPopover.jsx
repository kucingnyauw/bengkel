/**
 * NotificationPopover - Notification popover with infinite scroll, mark read, and delete functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Popover open state
 * @param {HTMLElement} props.anchorEl - Anchor element
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.notifications - Notifications data from infinite query
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isFetchingNextPage - Fetching next page state
 * @param {boolean} props.hasNextPage - Has next page state
 * @param {Function} props.onFetchNextPage - Fetch next page handler
 * @param {Function} props.onMarkRead - Mark single as read handler
 * @param {Function} props.onMarkAllRead - Mark all as read handler
 * @param {Function} props.onDeleteAll - Delete all handler
 * @param {Function} props.onDelete - Delete single handler
 * @param {Function} props.onRefresh - Refresh handler
 * @param {number} props.unreadCount - Total unread count from API
 * @returns {JSX.Element} Rendered notification popover
 */
import { useRef, useCallback, useState, useEffect } from "react";
import { CheckCheck, RotateCcw, Trash2, X, BellDot } from "lucide-react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  keyframes,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatRelativeTime } from "@shared/utils";
import { notificationTypeColorMap } from "@shared/constant";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * Empty state SVG icon component
 * @param {Object} props
 * @param {number} [props.opacity=0.2]
 * @returns {JSX.Element}
 */
const EmptyNotificationSvg = ({ opacity = 0.2 }) => (
  <Box
    sx={(theme) => ({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 64,
      height: 64,
      borderRadius: "50%",
      bgcolor: alpha(theme.palette.secondary.main, 0.08),
      color: "text.secondary",
      opacity,
      mb: 1,
    })}
  >
    <BellDot size={32} strokeWidth={1.5} />
  </Box>
);

/**
 * Loading skeleton untuk notifikasi
 * @returns {JSX.Element}
 */
const NotificationSkeleton = () => (
  <Stack spacing={0.5} sx={{ px: 1, py: 1 }}>
    {[1, 2, 3, 4].map((i) => (
      <Box
        key={i}
        sx={(theme) => ({
          p: 2,
          borderRadius: `${theme.shape.borderRadius}px`,
          display: "flex",
          gap: 2,
          bgcolor: alpha(theme.palette.secondary.main, 0.02),
        })}
      >
        <Skeleton variant="circular" width={8} height={8} sx={{ mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="85%" height={16} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    ))}
  </Stack>
);

/**
 * Mendapatkan warna berdasarkan tipe notifikasi
 * @param {string} type
 * @returns {string}
 */
const getNotifColor = (type) => {
  return notificationTypeColorMap[type] || "default";
};

const NotificationPopover = ({
  open,
  anchorEl,
  onClose,
  notifications,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  onMarkRead,
  onMarkAllRead,
  onDeleteAll,
  onDelete,
  onRefresh,
  unreadCount = 0,
}) => {
  const theme = useTheme();
  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const [prevLength, setPrevLength] = useState(0);
  const [newItemIds, setNewItemIds] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  const allNotifications = notifications?.pages?.flatMap((page) => page.data) || [];
  const isAnyDeleting = deletingIds.length > 0;

  useEffect(() => {
    if (allNotifications.length > prevLength) {
      const newIds = allNotifications.slice(prevLength).map((n) => n.id);
      setNewItemIds(newIds);
      const timer = setTimeout(() => setNewItemIds([]), 400);
      return () => clearTimeout(timer);
    }
    setPrevLength(allNotifications.length);
  }, [allNotifications.length]);

  useEffect(() => {
    if (deletingIds.length > 0) {
      const currentIds = allNotifications.map((n) => n.id);
      const stillDeleting = deletingIds.some((id) => currentIds.includes(id));
      if (!stillDeleting) {
        setDeletingIds([]);
      }
    }
  }, [allNotifications, deletingIds]);

  useEffect(() => {
    let timer;
    if (deletingIds.length > 0) {
      timer = setTimeout(() => {
        setDeletingIds([]);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [deletingIds]);

  useEffect(() => {
    if (!isFetchingNextPage && prevScrollHeight.current > 0 && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const diff = scrollRef.current.scrollHeight - prevScrollHeight.current;
          scrollRef.current.scrollTop += diff;
          prevScrollHeight.current = 0;
        }
      });
    }
  }, [isFetchingNextPage]);

  const handleScroll = useCallback(
    (e) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
        prevScrollHeight.current = scrollHeight;
        onFetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage]
  );

  const handleNotifClick = (notif) => {
    if (isAnyDeleting) return;
    if (!notif.isRead) onMarkRead(notif.id);
    setSelectedNotif(notif);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (isAnyDeleting) return;
    setDeletingIds((prev) => [...prev, id]);
    onDelete?.(id);
  };

  const handleDeleteAll = () => {
    if (isAnyDeleting) return;
    const allIds = allNotifications.map((n) => n.id);
    setDeletingIds(allIds);
    onDeleteAll?.();
  };

  const handleCloseDetail = () => setSelectedNotif(null);

  const actionBtnStyle = {
    color: "text.secondary",
    padding: "6px",
    borderRadius: `${theme.shape.borderRadius}px`,
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.08),
      color: theme.palette.secondary.main,
    },
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={isAnyDeleting ? undefined : onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: 380,
              maxWidth: "100%",
              maxHeight: `calc(100vh - ${theme.spacing(12)})`,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
              backgroundImage: "none",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: theme.spacing(2.5),
            py: theme.spacing(2),
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifikasi
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} Baru`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  height: 20,
                  fontSize: "0.6875rem",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Stack>

          <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
            {onRefresh && (
              <Tooltip title="Segarkan" placement="bottom">
                <IconButton size="small" onClick={onRefresh} disabled={isAnyDeleting} sx={actionBtnStyle}>
                  <RotateCcw size={16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Tandai semua dibaca" placement="bottom">
                <IconButton size="small" onClick={onMarkAllRead} disabled={isAnyDeleting} sx={actionBtnStyle}>
                  <CheckCheck size={16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16, alignSelf: "center" }} />
            <Tooltip title="Tutup" placement="bottom">
              <IconButton size="small" onClick={onClose} disabled={isAnyDeleting} sx={actionBtnStyle}>
                <X size={16} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Content */}
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 1,
          }}
        >
          {isLoading ? (
            <NotificationSkeleton />
          ) : allNotifications.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                px: 3,
                textAlign: "center",
              }}
            >
              <EmptyNotificationSvg opacity={0.4} />
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mt: 1 }}>
                Belum Ada Notifikasi
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Saat ini Anda sudah membaca semua pemberitahuan.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.5}>
              {allNotifications.map((notif) => {
                const isDeleting = deletingIds.includes(notif.id);
                const notifColor = getNotifColor(notif.type);
                const isUnread = !notif.isRead;

                return (
                  <Box
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    sx={{
                      position: "relative",
                      p: 1.5,
                      pl: isUnread ? 2 : 1.5,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: isAnyDeleting ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      bgcolor: isUnread ? alpha(theme.palette.secondary.main, 0.04) : "transparent",
                      opacity: isDeleting ? 0.4 : 1,
                      animation: newItemIds.includes(notif.id) ? `${fadeInUp} 0.35s ease-out` : "none",
                      border: "1px solid transparent",
                      "&:hover": {
                        bgcolor: isAnyDeleting ? undefined : alpha(theme.palette.secondary.main, 0.08),
                        borderColor: isAnyDeleting ? "transparent" : alpha(theme.palette.secondary.main, 0.1),
                        "& .delete-btn-container": {
                          opacity: 1,
                          visibility: "visible",
                        },
                      },
                      ...(isUnread && {
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "15%",
                          height: "70%",
                          width: 3,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          bgcolor: theme.palette[notifColor]?.main || theme.palette.primary.main,
                        },
                      }),
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: isUnread ? 600 : 500,
                              color: isUnread ? "text.primary" : "text.secondary",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {notif.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isUnread ? theme.palette.primary.main : "text.disabled",
                              fontWeight: isUnread ? 500 : 400,
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {formatRelativeTime(notif.createdAt)}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4,
                            mt: 0.5,
                          }}
                        >
                          {notif.message}
                        </Typography>

                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                          <Chip
                            label={notif.type}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette[notifColor]?.main || theme.palette.secondary.main, 0.1),
                              color: theme.palette[notifColor]?.main || theme.palette.secondary.main,
                              fontWeight: 500,
                              height: 20,
                              fontSize: "0.625rem",
                            }}
                          />

                          <Box
                            className="delete-btn-container"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              opacity: 0,
                              visibility: "hidden",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <Box
                              component="span"
                              sx={(theme) => ({
                                display: "inline-flex",
                                borderRadius: `${theme.shape.borderRadius}px`,
                                border: "1px solid",
                                borderColor: alpha(theme.palette.divider, 0.8),
                                transition: theme.transitions.create(
                                  ["background-color", "border-color", "color"],
                                  { duration: theme.transitions.duration.shorter }
                                ),
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.error.main, 0.08),
                                  borderColor: alpha(theme.palette.error.main, 0.4),
                                  color: theme.palette.error.main,
                                },
                              })}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => handleDelete(e, notif.id)}
                                disabled={isAnyDeleting}
                                sx={{
                                  borderRadius: "inherit",
                                  color: "inherit",
                                  p: 0.5,
                                }}
                              >
                                <Trash2 size={14} strokeWidth={2} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
          {isFetchingNextPage && (
            <Box sx={{ pt: 1 }}>
              <NotificationSkeleton />
            </Box>
          )}
        </Box>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              p: 1.5,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              disabled={isAnyDeleting}
              onClick={handleDeleteAll}
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                textTransform: "none",
                fontWeight: 500,
                px: 2,
                "&:hover": {
                  bgcolor: "transparent",
                  color: theme.palette.error.main,
                  textDecoration: "underline",
                },
              }}
            >
              Bersihkan Semua Notifikasi
            </Button>
          </Box>
        )}
      </Popover>

      {/* Detail Dialog */}
      <Dialog open={!!selectedNotif} onClose={handleCloseDetail} maxWidth="xs" fullWidth>
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {selectedNotif?.title}
          <IconButton onClick={handleCloseDetail} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={2} />
          </IconButton>
        </DialogTitle>

        <Divider />

        {/* Content */}
        <DialogContent>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
            {selectedNotif?.message}
          </Typography>
        </DialogContent>

        <Divider />

        {/* Actions */}
        <DialogActions>
          <Button variant="outlined" onClick={handleCloseDetail}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;