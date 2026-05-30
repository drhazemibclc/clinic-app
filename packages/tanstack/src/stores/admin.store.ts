import { Store } from "@tanstack/store";

export interface AdminState {
  systemStatus: "healthy" | "degraded" | "down";
  activeUsersCount: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  selectedClinicId: string | null;
  isConfiguringSystem: boolean;
  auditLogFilters: {
    userId?: string;
    action?: string;
    dateRange: { from: Date | null; to: Date | null };
  };
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

export const initialAdminState: AdminState = {
  systemStatus: "healthy",
  activeUsersCount: 0,
  errorRate: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  selectedClinicId: null,
  isConfiguringSystem: false,
  auditLogFilters: {
    dateRange: { from: null, to: null },
  },
  maintenanceMode: false,
  registrationEnabled: true,
};

export const adminStore = new Store<AdminState>(initialAdminState);

export const adminActions = {
  updateSystemMetrics: (
    metrics: Partial<
      Pick<
        AdminState,
        "cpuUsage" | "memoryUsage" | "errorRate" | "activeUsersCount"
      >
    >,
  ) => {
    adminStore.setState((state) => ({ ...state, ...metrics }));
  },

  setSystemStatus: (status: AdminState["systemStatus"]) => {
    adminStore.setState((state) => ({ ...state, systemStatus: status }));
  },

  setSelectedClinic: (clinicId: string | null) => {
    adminStore.setState((state) => ({ ...state, selectedClinicId: clinicId }));
  },

  setMaintenanceMode: (enabled: boolean) => {
    adminStore.setState((state) => ({ ...state, maintenanceMode: enabled }));
  },

  setRegistrationEnabled: (enabled: boolean) => {
    adminStore.setState((state) => ({
      ...state,
      registrationEnabled: enabled,
    }));
  },

  updateAuditFilters: (filters: Partial<AdminState["auditLogFilters"]>) => {
    adminStore.setState((state) => ({
      ...state,
      auditLogFilters: { ...state.auditLogFilters, ...filters },
    }));
  },

  resetAuditFilters: () => {
    adminStore.setState((state) => ({
      ...state,
      auditLogFilters: initialAdminState.auditLogFilters,
    }));
  },

  setConfigurationMode: (isConfiguring: boolean) => {
    adminStore.setState((state) => ({
      ...state,
      isConfiguringSystem: isConfiguring,
    }));
  },

  reset: () => {
    adminStore.setState(() => ({ ...initialAdminState }));
  },
};

// Maintenance mode warning subscription
adminStore.subscribe(() => {
  const state = adminStore.state;
  if (state.maintenanceMode) {
    console.warn("System is now in Maintenance Mode");
  }
});
