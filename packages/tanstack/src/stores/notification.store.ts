import { client, queryClient } from "@clinic-app/api/client";
import type { NotificationItem } from "@clinic-app/db/schema/types";
import { useSelector } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

export interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  unreadCount: number;
  totalCount: number;
  filters: {
    status: "all" | "unread" | "read";
    type: string | null;
    search: string;
  };
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  unreadCount: 0,
  totalCount: 0,
  filters: {
    status: "all",
    type: null,
    search: "",
  },
  pagination: {
    offset: 0,
    limit: 20,
    hasMore: false,
  },
};

export const notificationStore = new Store<NotificationState>(initialState);

export const notificationActions = {
  fetchNotifications: async () => {
    const state = notificationStore.state;
    notificationStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await client.notifications.list({
        status:
          state.filters.status === "all" ? undefined : state.filters.status,
        type: state.filters.type || undefined,
        search: state.filters.search || undefined,
        limit: state.pagination.limit,
        offset: state.pagination.offset,
      });

      notificationStore.setState((prev) => ({
        ...prev,
        notifications:
          state.pagination.offset === 0
            ? result.notifications
            : [...prev.notifications, ...result.notifications],
        totalCount: result.total,
        unreadCount: result.unreadCount,
        pagination: {
          ...prev.pagination,
          hasMore: result.hasMore || false,
        },
        isLoading: false,
        lastFetched: new Date(),
      }));
    } catch (error) {
      notificationStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch notifications",
      }));
    }
  },

  markAsRead: async (id: string) => {
    try {
      await client.notifications.markAsRead({ id });
      notificationStore.setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, status: "read" as const } : n,
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await client.notifications.markAllAsRead();
      notificationStore.setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({
          ...n,
          status: "read" as const,
        })),
        unreadCount: 0,
      }));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await client.notifications.delete({ id });
      notificationStore.setState((prev) => {
        const deleted = prev.notifications.find((n) => n.id === id);
        const newUnreadCount =
          deleted?.status === "unread"
            ? prev.unreadCount - 1
            : prev.unreadCount;
        return {
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== id),
          totalCount: prev.totalCount - 1,
          unreadCount: Math.max(0, newUnreadCount),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },

  addNotification: (notification: NotificationItem) => {
    notificationStore.setState((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
      totalCount: prev.totalCount + 1,
      unreadCount:
        notification.status === "unread"
          ? prev.unreadCount + 1
          : prev.unreadCount,
    }));
  },

  setFilters: (filters: Partial<NotificationState["filters"]>) => {
    notificationStore.setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, offset: 0 },
    }));
    notificationActions.fetchNotifications();
  },

  loadMore: () => {
    const state = notificationStore.state;
    if (!state.pagination.hasMore || state.isLoading) return;

    notificationStore.setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        offset: prev.pagination.offset + prev.pagination.limit,
      },
    }));
    notificationActions.fetchNotifications();
  },

  clearAll: async () => {
    try {
      await client.notifications.clearAll();
      notificationStore.setState((prev) => ({
        ...prev,
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
      }));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  },

  reset: () => {
    notificationStore.setState(() => initialState);
  },
};

// React hook for using the notification store
export function useNotificationStore() {
  const state = useSelector(notificationStore);
  return {
    notifications: state.notifications,
    isLoading: state.isLoading,
    error: state.error,
    unreadCount: state.unreadCount,
    totalCount: state.totalCount,
    filters: state.filters,
    pagination: state.pagination,
    fetchNotifications: notificationActions.fetchNotifications,
    markAsRead: notificationActions.markAsRead,
    markAllAsRead: notificationActions.markAllAsRead,
    deleteNotification: notificationActions.deleteNotification,
    addNotification: notificationActions.addNotification,
    setFilters: notificationActions.setFilters,
    loadMore: notificationActions.loadMore,
    clearAll: notificationActions.clearAll,
    reset: notificationActions.reset,
  };
}
export function initializeNotificationStore() {
  notificationActions.fetchNotifications();

  // Use globalThis to avoid 'window' scope issues
  // Check if EventSource is defined in the global scope
  if (typeof globalThis.EventSource !== "undefined") {
    const eventSource = new globalThis.EventSource("/api/rpc/sse");

    eventSource.addEventListener("notification", (event: Event) => {
      try {
        // Assert the event type correctly
        const messageEvent = event as MessageEvent;
        const notification = JSON.parse(messageEvent.data);

        notificationActions.addNotification({
          ...notification,
          createdAt: new Date(notification.createdAt),
        });
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    });

    eventSource.onerror = () => {
      console.error("SSE connection error");
      // Use a closure or refer to the eventSource instance directly
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          initializeNotificationStore();
        }
      }, 5000);
    };

    // Use globalThis for the listener
    globalThis.addEventListener("beforeunload", () => {
      eventSource.close();
    });
  }
}
