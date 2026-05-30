import { Store } from "@tanstack/store";

export interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  toast: { message: string; type: string; visible: boolean } | null;
  isLoading: Record<string, boolean>;
}

export const initialUIState: UIState = {
  sidebarOpen: true,
  darkMode:
    typeof localStorage !== "undefined"
      ? localStorage.getItem("darkMode") === "true"
      : false,
  activeModal: null,
  modalData: null,
  toast: null,
  isLoading: {},
};

export const uiStore = new Store<UIState>(initialUIState);

export const uiActions = {
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
    uiStore.setState((state) => ({ ...state, darkMode: !state.darkMode }));
  },

  setDarkMode: (darkMode: boolean) => {
    uiStore.setState((state) => ({ ...state, darkMode }));
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

// Dark mode subscription
uiStore.subscribe(() => {
  const { darkMode } = uiStore.state;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("darkMode", String(darkMode));
  }
  if (typeof document !== "undefined") {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
});
