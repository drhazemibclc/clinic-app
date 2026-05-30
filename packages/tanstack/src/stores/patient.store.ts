import { createStore, Store } from "@tanstack/store";

import type {
  DbAppointment,
  DbDiagnosis,
  DbPatient,
  Status,
} from "#/db/schema";
import { client } from "#/orpc/client";

import type {
  FilterState,
  GrowthChartData,
  ImmunizationRecord,
  PaginationState,
} from "../types/store";

export interface PatientState {
  patients: DbPatient[];
  selectedPatient: DbPatient | null;
  upcomingAppointments: DbAppointment[];
  recentDiagnoses: DbDiagnosis[];
  immunizationRecords: ImmunizationRecord[];
  growthHistory: GrowthChartData[];
  isLoading: boolean;
  error: string | null;
  totalPatients: number;
  filters: FilterState;
  pagination: PaginationState;
}

const initialPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

const initialFilters: FilterState = {
  search: "",
  status: "ACTIVE",
  clinicId: undefined,
};

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  upcomingAppointments: [],
  recentDiagnoses: [],
  immunizationRecords: [],
  growthHistory: [],
  isLoading: false,
  error: null,
  totalPatients: 0,
  filters: initialFilters,
  pagination: initialPagination,
};

export const patientsStore = createStore<PatientState>(initialState);
export const selectedPatientStore = new Store<DbPatient | null>(null);

// Keep selectedPatientStore in sync with patientsStore
patientsStore.subscribe(() => {
  const current = patientsStore.state.selectedPatient;
  if (selectedPatientStore.state?.id !== current?.id) {
    selectedPatientStore.setState(() => current);
  }
});

export const patientActions = {
  setSelectedPatient: (patient: DbPatient | null) => {
    patientsStore.setState((prev) => ({
      ...prev,
      selectedPatient: patient,
      upcomingAppointments: [],
      recentDiagnoses: [],
      immunizationRecords: [],
      growthHistory: [],
    }));
  },

  setFilters: (filters: Partial<FilterState>) => {
    patientsStore.setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 },
    }));
  },

  clearFilters: () => {
    patientsStore.setState((prev) => ({
      ...prev,
      filters: initialFilters,
      pagination: { ...prev.pagination, page: 1 },
    }));
  },

  setPagination: (pagination: Partial<PaginationState>) => {
    patientsStore.setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, ...pagination },
    }));
  },

  fetchPatients: async () => {
    const { filters, pagination } = patientsStore.state;

    patientsStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await client.patient.list({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status as Status,
      });

      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        patients: result.patients as DbPatient[],
        totalPatients: result.total,
        pagination: {
          ...prev.pagination,
          total: result.total,
          totalPages: Math.ceil(result.total / prev.pagination.limit),
        },
      }));
    } catch (err) {
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch patients",
      }));
    }
  },

  createPatient: async (data: Omit<DbPatient, "createdAt" | "updatedAt">) => {
    patientsStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    try {
      const newPatient = await client.patient.create(data);
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        patients: [newPatient as DbPatient, ...prev.patients],
        totalPatients: prev.totalPatients + 1,
      }));
      return newPatient;
    } catch (err) {
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to create patient",
      }));
    }
  },

  updatePatient: async (id: string, data: Partial<DbPatient>) => {
    patientsStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    try {
      const updated = await client.patient.update({ id, data });
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        patients: prev.patients.map((p) =>
          p.id === id ? { ...p, ...updated } : p,
        ),
        selectedPatient:
          prev.selectedPatient?.id === id
            ? { ...prev.selectedPatient, ...updated }
            : prev.selectedPatient,
      }));
    } catch (err) {
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to update patient",
      }));
    }
  },

  deletePatient: async (id: string) => {
    if (!confirm("Are you sure you want to delete this patient record?"))
      return;

    patientsStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    try {
      await client.patient.delete({ id });
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        patients: prev.patients.filter((p) => p.id !== id),
        totalPatients: prev.totalPatients - 1,
        selectedPatient:
          prev.selectedPatient?.id === id ? null : prev.selectedPatient,
      }));
    } catch (err) {
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to delete patient",
      }));
    }
  },

  fetchPatientDetails: async (patientId: string) => {
    patientsStore.setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    try {
      const details = await client.patient.getWithDetails({ id: patientId });
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        upcomingAppointments: details?.appointments as DbAppointment[],
        recentDiagnoses: details?.encounters as DbDiagnosis[],
        immunizationRecords: details?.immunizations as ImmunizationRecord[],
        growthHistory: details?.growthRecords as GrowthChartData[],
      }));
    } catch (err) {
      patientsStore.setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load patient details",
      }));
    }
  },

  reset: () => {
    patientsStore.setState(() => initialState);
    selectedPatientStore.setState(() => null);
  },
};
