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
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            flexShrink: 0,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
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
                  fontWeight: 400,
                  fontSize: "0.6875rem",
                  px: 0.5,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Stack>
          <Stack direction="row" sx={{ gap: 0.5 }}>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isAnyDeleting}
                  sx={{
                    "&:hover": {
                      color: "secondary.main",
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    },
                  }}
                >
                  <RotateCcw size={16} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Tandai semua dibaca">
                <IconButton
                  size="small"
                  onClick={onMarkAllRead}
                  disabled={isAnyDeleting}
                  sx={{
                    "&:hover": {
                      color: "secondary.main",
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    },
                  }}
                >
                  <CheckCheck size={16} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              disabled={isAnyDeleting}
            >
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </Stack>
        </Box>

        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            bgcolor: theme.palette.background.paper,
          }}
        >
          {isLoading ? (
            <NotificationSkeleton />
          ) : allNotifications.length === 0 ? (
            <Box sx={{ py: 10, textAlign: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CheckCheck size={24} strokeWidth={1.5} style={{ opacity: 0.3 }} />
              </Box>
              <Typography color="text.secondary" sx={{ fontWeight: 400 }}>
                Belum ada notifikasi
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                Notifikasi akan muncul di sini
              </Typography>
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
                    px: 3,
                    py: 2,
                    cursor: isAnyDeleting ? "default" : "pointer",
                    transition: theme.transitions.create(["background-color", "opacity"]),
                    bgcolor: notif.isRead
                      ? "transparent"
                      : alpha(theme.palette.secondary.main, 0.03),
                    borderBottom:
                      index < allNotifications.length - 1
                        ? `1px solid ${alpha(theme.palette.divider, 0.4)}`
                        : 0,
                    opacity: isDeleting ? 0.4 : 1,
                    animation: newItemIds.includes(notif.id)
                      ? `${fadeInUp} 0.35s ease-out`
                      : "none",
                    "&:hover": {
                      bgcolor: isAnyDeleting
                        ? undefined
                        : alpha(theme.palette.secondary.main, 0.06),
                    },
                  }}
                >
                  <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start" }}>
                    {!notif.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: theme.palette[notifColor]?.main || theme.palette.secondary.main,
                          flexShrink: 0,
                          mt: 0.8,
                        }}
                      />
                    )}

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
                          sx={{
                            fontWeight: !notif.isRead ? 500 : 400,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontWeight: 400, flexShrink: 0, mt: 0.1 }}
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
                          fontWeight: 400,
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
                              fontWeight: 400,
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
                                fontWeight: 400,
                                px: 0.5,
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          )}
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(e, notif.id)}
                          disabled={isAnyDeleting}
                          sx={{
                            p: 0.25,
                            opacity: isDeleting ? 0.3 : 1,
                            "&:hover": {
                              color: "error.main",
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                            },
                          }}
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })
          )}
          {isFetchingNextPage && <NotificationSkeleton />}
        </Box>

        {allNotifications.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              px: 3,
              py: 2,
              flexShrink: 0,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Button
              size="small"
              variant="contained"
              color="error"
              fullWidth
              disabled={isAnyDeleting}
              onClick={handleDeleteAll}
              sx={{ fontWeight: 400 }}
            >
              Hapus Semua
            </Button>
          </Box>
        )}
      </Popover>

      <Dialog
        open={!!selectedNotif}
        onClose={handleCloseDetail}
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
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 400,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
            {selectedNotif?.title}
          </Typography>
          <IconButton onClick={handleCloseDetail} size="small">
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7, fontWeight: 400 }}
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
                sx={{ height: 20, fontSize: "0.625rem", fontWeight: 400 }}
              />
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
                {formatRelativeTime(selectedNotif.createdAt)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleCloseDetail}
            sx={{ fontWeight: 400 }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;