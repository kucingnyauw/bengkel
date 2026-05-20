// hooks/useNotifications.js
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getTotalCount,
  getUnreadCount,
  deleteAllNotifications,
} from "@api/notificationApi.js";
import { STALE_TIME } from "@shared/constant";

export const useNotifications = (options = {}) => {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) =>
      getMyNotifications({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.metadata || {};
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: STALE_TIME,
    ...options,
  });
};

export const useUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    staleTime: STALE_TIME,
    ...options,
  });
};

export const useTotalCount = (options = {}) => {
  return useQuery({
    queryKey: ["notifications", "total-count"],
    queryFn: getTotalCount,
    staleTime: STALE_TIME,
    ...options,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
