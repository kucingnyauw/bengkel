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
 * @param {number} props.unreadCount - Total unread count from API
 *
 * @returns {JSX.Element} Rendered notification popover
 */
import { useRef, useCallback, useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import {
  Avatar,
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
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={12} sx={{ mt: 1 }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

const getNotifIcon = (type) => {
  switch (type) {
    case "WARNING":
      return "⚠️";
    case "ERROR":
      return "🔴";
    case "INFO":
      return "ℹ️";
    case "SUCCESS":
      return "✅";
    default:
      return "📢";
  }
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
  unreadCount = 0,
}) => {
  const theme = useTheme();
  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const [prevLength, setPrevLength] = useState(0);
  const [newItemIds, setNewItemIds] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  const allNotifications =
    notifications?.pages?.flatMap((page) => page.data) || [];
  const isAnyDeleting = deletingIds.length > 0 || isDeletingAll;

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
    if (
      !isFetchingNextPage &&
      prevScrollHeight.current > 0 &&
      scrollRef.current
    ) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const diff =
            scrollRef.current.scrollHeight - prevScrollHeight.current;
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
      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
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

  const handleDeleteAll = async () => {
    if (isAnyDeleting) return;
    setIsDeletingAll(true);
    setDeletingIds(allNotifications.map((n) => n.id));
    setTimeout(() => {
      onDeleteAll?.();
      setIsDeletingAll(false);
      setDeletingIds([]);
    }, 600);
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
              width: 400,
              maxHeight: `calc(100vh - ${theme.spacing(12)})`,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
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
            px: 3,
            py: 4,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.text.primary,
              0.02
            )} 0%, ${alpha(theme.palette.text.primary, 0.01)} 100%)`,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Notifikasi
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  height: 22,
                  minWidth: 22,
                  "& .MuiChip-label": {
                    px: 0.75,
                    fontSize: "0.625rem",
                    fontWeight: 600,
                  },
                }}
              />
            )}
          </Stack>
          <IconButton size="small" onClick={onClose} disabled={isAnyDeleting}>
            <X size={16} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
        >
          {isLoading || isDeletingAll ? (
            <NotificationSkeleton />
          ) : allNotifications.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.disabled">
                Belum ada notifikasi
              </Typography>
            </Box>
          ) : (
            allNotifications.map((notif, index) => {
              const isDeleting = deletingIds.includes(notif.id);
              return (
                <Box
                  key={notif.id}
                  sx={{
                    px: 3,
                    py: 2.5,
                    cursor: isAnyDeleting ? "default" : "pointer",
                    transition: theme.transitions.create([
                      "background-color",
                      "opacity",
                    ]),
                    bgcolor: notif.isRead
                      ? "transparent"
                      : alpha(theme.palette.text.primary, 0.03),
                    borderBottom:
                      index < allNotifications.length - 1
                        ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
                        : 0,
                    opacity: isDeleting ? 0.4 : 1,
                    animation: newItemIds.includes(notif.id)
                      ? `${fadeInUp} 0.35s ease-out`
                      : "none",
                    "&:hover": {
                      bgcolor: isAnyDeleting
                        ? undefined
                        : alpha(theme.palette.text.primary, 0.05),
                    },
                  }}
                >
                  <Stack direction="row" sx={{ gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: alpha(theme.palette.text.primary, 0.06),
                        fontSize: "1rem",
                        flexShrink: 0,
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      {getNotifIcon(notif.type)}
                    </Avatar>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      <Box onClick={() => handleNotifClick(notif)}>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Stack sx={{ gap: 0.5, flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={notif.isRead ? 500 : 600}
                              noWrap
                            >
                              {notif.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.5,
                              }}
                            >
                              {notif.message}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ flexShrink: 0, mt: 0.25 }}
                          >
                            {formatRelativeTime(notif.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack direction="row" sx={{ gap: 0.75, mt: 1.5 }}>
                        {!notif.isRead && (
                          <Chip
                            label="Baru"
                            size="small"
                            variant="filled"
                            color="primary"
                            sx={{
                              height: 20,
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        )}
                        <Chip
                          label={notif.type}
                          size="small"
                          variant="outlined"
                          color={
                            notificationTypeColorMap[notif.type] || "default"
                          }
                          sx={{
                            height: 20,
                            fontSize: "0.625rem",
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                      </Stack>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(e, notif.id)}
                      disabled={isAnyDeleting}
                      sx={{
                        flexShrink: 0,
                        mt: 0.5,
                        opacity: isDeleting ? 0.3 : 1,
                        "&:hover": {
                          color: "error.main",
                          bgcolor: alpha(theme.palette.error.main, 0.08),
                        },
                      }}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })
          )}
          {isFetchingNextPage && <NotificationSkeleton />}
        </Box>

        {/* Footer Actions */}
        {allNotifications.length > 0 && !isDeletingAll && (
          <Box
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              px: 3,
              py: 4,
              flexShrink: 0,
              display: "flex",
              gap: 1,
            }}
          >
            {unreadCount > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                fullWidth
                disabled={isAnyDeleting}
                onClick={onMarkAllRead}
              >
                Tandai Dibaca
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
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
            px: 3,
            pt: 2.5,
            pb: 2,
          }}
        >
          <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: alpha(theme.palette.text.primary, 0.06),
                fontSize: "1rem",
              }}
            >
              {selectedNotif ? getNotifIcon(selectedNotif.type) : "📢"}
            </Avatar>
            {selectedNotif?.title}
          </Stack>
          <IconButton onClick={handleCloseDetail}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
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
                color={
                  notificationTypeColorMap[selectedNotif.type] || "default"
                }
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
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleCloseDetail}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;
