// lib/session-refresh.ts
import { authClient } from "./client";

let refreshInterval: NodeJS.Timeout | null = null;

export function startSessionRefresh(intervalMinutes = 25) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(
    async () => {
      try {
        await authClient.getSession();
      } catch (error) {
        console.error("Session refresh failed:", error);
      }
    },
    intervalMinutes * 60 * 1000,
  );
}

export function stopSessionRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
