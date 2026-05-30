import { Store } from "@tanstack/store";

export interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  toast: { message: string; type: string; visible: boolean } | null;
  isLoading: Record<string, boolean>;
}

// 1. Safe Server Fallback: Initialize to false since localStorage isn't available on SSR
export const initialUIState: UIState = {
  sidebarOpen: true,
  darkMode: false,
  activeModal: null,
  modalData: null,
  toast: null,
  isLoading: {},
};

export const initialAppState: AppState = {
  isInitialized: false,
  version: "1.0.0",
  lastSync: null,
  onlineStatus:
    typeof window !== "undefined" && navigator.onLine ? "online" : "offline",
  notificationsEnabled: false,
  activeClinicId: null,
  userPreferences: {},
  activeModal: null,
  darkMode: false,
  sidebarOpen: false,
  isLoading: true,
  isAuthenticated: true,
};

export const appStore = new Store<AppState>(initialAppState);

export const uiStore = new Store<UIState>(initialUIState);

export const uiActions = {
  // 2. Client Hydration Action: Safely runs *only* after mounting in the browser
  initClientState: () => {
    if (typeof window === "undefined") return;

    const isDark = localStorage.getItem("darkMode") === "true";
    uiStore.setState((state) => ({ ...state, darkMode: isDark }));

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  toggleSidebar: () => {
    uiStore.setState((state) => ({
      ...state,
      sidebarOpen: !state.sidebarOpen,
    }));
  },

  setSidebarOpen: (open: boolean) => {
    uiStore.setState((state) => ({ ...state, sidebarOpen: open }));
  },

  toggleDarkMode: () => {
    uiStore.setState((state) => {
      const newDarkMode = !state.darkMode;
      // Handle browser updates directly on invocation to prevent loose side-effects
      if (typeof window !== "undefined") {
        localStorage.setItem("darkMode", String(newDarkMode));
        document.documentElement.classList.toggle("dark", newDarkMode);
      }
      return { ...state, darkMode: newDarkMode };
    });
  },

  setDarkMode: (darkMode: boolean) => {
    uiStore.setState((state) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("darkMode", String(darkMode));
        document.documentElement.classList.toggle("dark", darkMode);
      }
      return { ...state, darkMode };
    });
  },

  openModal: (modalName: string, data?: Record<string, unknown>) => {
    uiStore.setState((state) => ({
      ...state,
      activeModal: modalName,
      modalData: data || null,
    }));
  },

  closeModal: () => {
    uiStore.setState((state) => ({
      ...state,
      activeModal: null,
      modalData: null,
    }));
  },

  showToast: (message: string, type = "info") => {
    uiStore.setState((state) => ({
      ...state,
      toast: { message, type, visible: true },
    }));
    setTimeout(() => {
      uiStore.setState((state) => ({ ...state, toast: null }));
    }, 3000);
  },

  hideToast: () => {
    uiStore.setState((state) => ({ ...state, toast: null }));
  },

  setLoading: (key: string, isLoading: boolean) => {
    uiStore.setState((state) => ({
      ...state,
      isLoading: { ...state.isLoading, [key]: isLoading },
    }));
  },

  isLoading: (key: string): boolean => {
    return uiStore.state.isLoading[key] || false;
  },
};

export const appActions = {
  setInitialized: (initialized: boolean) => {
    appStore.setState((state) => ({ ...state, isInitialized: initialized }));
  },

  setOnlineStatus: (status: "online" | "offline") => {
    appStore.setState((state) => ({ ...state, onlineStatus: status }));
  },

  setLastSync: (date: Date) => {
    appStore.setState((state) => ({ ...state, lastSync: date }));
  },

  setActiveClinic: (clinicId: string | null) => {
    appStore.setState((state) => ({ ...state, activeClinicId: clinicId }));
  },

  setNotificationsEnabled: (enabled: boolean) => {
    appStore.setState((state) => ({ ...state, notificationsEnabled: enabled }));
  },

  updateUserPreference: (key: string, value: unknown) => {
    appStore.setState((state) => ({
      ...state,
      userPreferences: { ...state.userPreferences, [key]: value },
    }));
  },
};

// 3. Server-Guarded Subscription
uiStore.subscribe(() => {
  if (typeof window === "undefined") return;
  const { darkMode } = uiStore.state;
  localStorage.setItem("darkMode", String(darkMode));
});
export interface AppState {
  activeModal: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  version: string;
  lastSync: Date | null;
  onlineStatus: "online" | "offline";
  notificationsEnabled: boolean;
  activeClinicId: string | null;
  userPreferences: Record<string, unknown>;
}
