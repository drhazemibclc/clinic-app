import type { DbAppointment } from "@clinic-app/db/schema/types";
import { Store } from "@tanstack/store";
import type { FilterState, PaginationState } from "./types";

export interface AppointmentState {
  appointments: DbAppointment[];
  selectedAppointment: DbAppointment | null;
  filters: FilterState;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;
  todaysCount: number;
  upcomingCount: number;
}

const initialPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const initialFilters: FilterState = {
  search: "",
  status: "CONFIRMED",
  dateRange: undefined,
};

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  filters: initialFilters,
  pagination: initialPagination,
  isLoading: false,
  error: null,
  todaysCount: 0,
  upcomingCount: 0,
};

export const appointmentStore = new Store<AppointmentState>(initialState);

function updateCounts(appointments: DbAppointment[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysCount = appointments.filter((a) => {
    const aptDate = new Date(a.appointmentDate);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === today.getTime();
  }).length;

  const upcomingCount = appointments.filter((a) => {
    const aptDate = new Date(a.appointmentDate);
    return (
      aptDate > new Date() &&
      (a.status === "CONFIRMED" || a.status === "PENDING")
    );
  }).length;

  appointmentStore.setState((state) => ({
    ...state,
    todaysCount,
    upcomingCount,
  }));
}

export const appointmentActions = {
  setAppointments: (appointments: DbAppointment[]) => {
    appointmentStore.setState((state) => ({ ...state, appointments }));
    updateCounts(appointments);
  },

  addAppointment: (appointment: DbAppointment) => {
    appointmentStore.setState((state) => {
      const newAppointments = [appointment, ...state.appointments];
      updateCounts(newAppointments);
      return { ...state, appointments: newAppointments };
    });
  },

  updateAppointment: (id: string, updates: Partial<DbAppointment>) => {
    appointmentStore.setState((state) => {
      const newAppointments = state.appointments.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      );
      updateCounts(newAppointments);
      return {
        ...state,
        appointments: newAppointments,
        selectedAppointment:
          state.selectedAppointment?.id === id
            ? { ...state.selectedAppointment, ...updates }
            : state.selectedAppointment,
      };
    });
  },

  deleteAppointment: (id: string) => {
    appointmentStore.setState((state) => {
      const newAppointments = state.appointments.filter((a) => a.id !== id);
      updateCounts(newAppointments);
      return {
        ...state,
        appointments: newAppointments,
        selectedAppointment:
          state.selectedAppointment?.id === id
            ? null
            : state.selectedAppointment,
      };
    });
  },

  setSelectedAppointment: (appointment: DbAppointment | null) => {
    appointmentStore.setState((state) => ({
      ...state,
      selectedAppointment: appointment,
    }));
  },

  setFilters: (filters: Partial<FilterState>) => {
    appointmentStore.setState((state) => ({
      ...state,
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  setPagination: (pagination: Partial<PaginationState>) => {
    appointmentStore.setState((state) => ({
      ...state,
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  setLoading: (isLoading: boolean) => {
    appointmentStore.setState((state) => ({ ...state, isLoading }));
  },

  setError: (error: string | null) => {
    appointmentStore.setState((state) => ({ ...state, error }));
  },

  reset: () => {
    appointmentStore.setState(() => initialState);
  },
};
