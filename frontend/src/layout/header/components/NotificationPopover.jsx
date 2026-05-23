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
 *
 * @returns {JSX.Element} Rendered notification popover
 */
import { useRef, useCallback, useState, useEffect } from "react";
import { CheckCheck, RotateCcw, Trash2, X } from "lucide-react";
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

const EmptyNotificationSvg = ({ opacity = 0.15 }) => (
  <Box
    component="svg"
    viewBox="0 0 120 120"
    sx={{
      width: 80,
      height: 80,
      opacity,
    }}
  >
    {/* Bell Body */}
    <path
      d="M60 10 C60 10 45 15 45 35 L45 50 C45 55 40 60 35 65 L85 65 C80 60 75 55 75 50 L75 35 C75 15 60 10 60 10Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Bell Bottom */}
    <path
      d="M40 70 Q60 85 80 70"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Clapper */}
    <circle cx="60" cy="82" r="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <line x1="60" y1="87" x2="60" y2="97" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Zzz */}
    <text x="75" y="35" fontSize="16" fill="currentColor" fontWeight="600">Z</text>
    <text x="88" y="25" fontSize="12" fill="currentColor" fontWeight="600">Z</text>
    <text x="97" y="18" fontSize="9" fill="currentColor" fontWeight="600">Z</text>
  </Box>
);

const NotificationSkeleton = () => (
  <Stack sx={{ gap: 1 }}>
    {[1, 2, 3, 4].map((i) => (
      <Stack key={i} direction="row" sx={{ px: 3, py: 2.5, gap: 2 }}>
        <Skeleton variant="circular" width={8} height={8} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={12} sx={{ mt: 1 }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

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
              width: 420,
              maxHeight: `calc(100vh - ${theme.spacing(12)})`,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
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
            <Typography variant="subtitle1">
              Notifikasi
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} baru`}
                size="small"
                color="secondary"
                variant="soft"
                sx={{
                  height: 22,
                  fontSize: "0.6875rem",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Stack>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
            {onRefresh && (
              <Tooltip title="Refresh" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isAnyDeleting}
                >
                  <RotateCcw size={16} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Tandai semua dibaca" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onMarkAllRead}
                  disabled={isAnyDeleting}
                >
                  <CheckCheck size={16} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton
              size="small"
              onClick={onClose}
              disabled={isAnyDeleting}
            >
              <X size={18} strokeWidth={1.5} />
            </IconButton>
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
                py: theme.spacing(6),
                gap: theme.spacing(2),
              }}
            >
              <EmptyNotificationSvg />
              <Stack sx={{ gap: theme.spacing(0.5), alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Belum ada notifikasi
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Notifikasi akan muncul di sini
                </Typography>
              </Stack>
            </Box>
          ) : (
            allNotifications.map((notif, index) => {
              const isDeleting = deletingIds.includes(notif.id);
              const notifColor = getNotifColor(notif.type);

              return (
                <Box
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  sx={{
                    px: theme.spacing(2.5),
                    py: theme.spacing(2),
                    cursor: isAnyDeleting ? "default" : "pointer",
                    transition: theme.transitions.create(["background-color", "opacity"]),
                    bgcolor: notif.isRead
                      ? "transparent"
                      : alpha(theme.palette.secondary.main, 0.02),
                    borderBottom:
                      index < allNotifications.length - 1
                        ? `1px solid ${theme.palette.divider}`
                        : 0,
                    opacity: isDeleting ? 0.4 : 1,
                    animation: newItemIds.includes(notif.id)
                      ? `${fadeInUp} 0.35s ease-out`
                      : "none",
                    "&:hover": {
                      bgcolor: isAnyDeleting
                        ? undefined
                        : alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}
                >
                  <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start" }}>
                    {/* Unread Dot */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: notif.isRead
                          ? "transparent"
                          : theme.palette[notifColor]?.main || theme.palette.secondary.main,
                        flexShrink: 0,
                        mt: 0.6,
                        transition: theme.transitions.create("background-color"),
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: !notif.isRead ? 600 : 400,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ flexShrink: 0, mt: 0.1 }}
                        >
                          {formatRelativeTime(notif.createdAt)}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                          mt: 0.5,
                        }}
                      >
                        {notif.message}
                      </Typography>

                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 1,
                        }}
                      >
                        <Stack direction="row" sx={{ gap: 0.75 }}>
                          <Chip
                            label={notif.type}
                            size="small"
                            variant="outlined"
                            color={notifColor}
                            sx={{
                              height: 18,
                              fontSize: "0.625rem",
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                          {!notif.isRead && (
                            <Chip
                              label="Baru"
                              size="small"
                              variant="soft"
                              color="secondary"
                              sx={{
                                height: 18,
                                fontSize: "0.625rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          )}
                        </Stack>

                        {/* Delete Button dengan Background */}
                        <Box
                          component="span"
                          onClick={(e) => e.stopPropagation()}
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
                              bgcolor: alpha(theme.palette.error.main, 0.06),
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
                              opacity: isDeleting ? 0.3 : 1,
                            }}
                          >
                            <Trash2 size={12} strokeWidth={1.5} />
                          </IconButton>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })
          )}
          {isFetchingNextPage && <NotificationSkeleton />}
        </Box>

        {/* Footer - Delete All */}
        {allNotifications.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              px: theme.spacing(2.5),
              py: theme.spacing(2),
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              color="error"
              fullWidth
              disabled={isAnyDeleting}
              onClick={handleDeleteAll}
            >
              Hapus Semua
            </Button>
          </Box>
        )}
      </Popover>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedNotif}
        onClose={handleCloseDetail}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1">
            {selectedNotif?.title}
          </Typography>
          <IconButton onClick={handleCloseDetail} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            {selectedNotif?.message}
          </Typography>
          {selectedNotif?.createdAt && (
            <Stack direction="row" sx={{ gap: 1, mt: 2, alignItems: "center" }}>
              <Chip
                label={selectedNotif.type}
                size="small"
                color={getNotifColor(selectedNotif.type)}
                variant="outlined"
                sx={{ height: 20, fontSize: "0.625rem" }}
              />
              <Typography variant="caption" color="text.disabled">
                {formatRelativeTime(selectedNotif.createdAt)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={handleCloseDetail}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;