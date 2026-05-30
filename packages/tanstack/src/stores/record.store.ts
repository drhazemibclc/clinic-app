import { Store } from "@tanstack/store";

import type { DbDiagnosis, DbMedicalRecord, DbVitalSign } from "#/db/schema";

export interface MedicalRecordFormData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnosis: string;
  symptoms: string[];
  treatmentPlan: string;
  notes: string;
  isConfidential: boolean;
  vitalSigns: {
    bodyTemperature?: number;
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    headCircumference?: number;
  };
}

export interface MedicalRecordState {
  records: DbMedicalRecord[];
  selectedRecord: DbMedicalRecord | null;
  diagnoses: DbDiagnosis[];
  vitalSigns: DbVitalSign[];
  formDirty: Record<string, boolean>;
  formErrors: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  activeTab: "soap" | "vitals" | "diagnosis" | "prescriptions";
  draftRecord: Partial<MedicalRecordFormData>;
  recentRecords: Array<{ id: string; createdAt: Date; diagnosis: string }>;
  filters: {
    dateRange: { start: Date | null; end: Date | null };
    diagnosis: string;
    showConfidential: boolean;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const initialState: MedicalRecordState = {
  records: [],
  selectedRecord: null,
  diagnoses: [],
  vitalSigns: [],
  formDirty: {},
  formErrors: {},
  isLoading: false,
  isSaving: false,
  activeTab: "soap",
  draftRecord: {},
  recentRecords: [],
  filters: {
    dateRange: { start: null, end: null },
    diagnosis: "",
    showConfidential: false,
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

export const medicalRecordStore = new Store<MedicalRecordState>(initialState);

export const medicalRecordActions = {
  setRecords: (records: DbMedicalRecord[]) => {
    medicalRecordStore.setState((state) => ({ ...state, records }));
  },

  addRecord: (record: DbMedicalRecord) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      records: [record, ...state.records],
    }));
  },

  updateRecord: (id: string, updates: Partial<DbMedicalRecord>) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
      selectedRecord:
        state.selectedRecord?.id === id
          ? { ...state.selectedRecord, ...updates }
          : state.selectedRecord,
    }));
  },

  deleteRecord: (id: string) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      records: state.records.filter((r) => r.id !== id),
      selectedRecord:
        state.selectedRecord?.id === id ? null : state.selectedRecord,
    }));
  },

  setSelectedRecord: (record: DbMedicalRecord | null) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      selectedRecord: record,
    }));
  },

  setDiagnoses: (diagnoses: DbDiagnosis[]) => {
    medicalRecordStore.setState((state) => ({ ...state, diagnoses }));
  },

  setVitalSigns: (vitalSigns: DbVitalSign[]) => {
    medicalRecordStore.setState((state) => ({ ...state, vitalSigns }));
  },

  setFormField: (field: keyof MedicalRecordFormData, value: unknown) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      draftRecord: { ...state.draftRecord, [field]: value },
      formDirty: { ...state.formDirty, [field]: true },
    }));
  },

  setNestedFormField: <T extends keyof MedicalRecordFormData>(
    parent: T,
    child: string,
    value: unknown,
  ) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      draftRecord: {
        ...state.draftRecord,
        [parent]: {
          ...((state.draftRecord[parent] as object) || {}),
          [child]: value,
        },
      },
      formDirty: { ...state.formDirty, [`${parent}.${child}`]: true },
    }));
  },

  setFormError: (field: string, error: string) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      formErrors: { ...state.formErrors, [field]: error },
    }));
  },

  clearFormErrors: () => {
    medicalRecordStore.setState((state) => ({ ...state, formErrors: {} }));
  },

  setActiveTab: (tab: MedicalRecordState["activeTab"]) => {
    medicalRecordStore.setState((state) => ({ ...state, activeTab: tab }));
  },

  setLoading: (isLoading: boolean) => {
    medicalRecordStore.setState((state) => ({ ...state, isLoading }));
  },

  setSaving: (isSaving: boolean) => {
    medicalRecordStore.setState((state) => ({ ...state, isSaving }));
  },

  resetForm: () => {
    medicalRecordStore.setState((state) => ({
      ...state,
      draftRecord: {},
      formDirty: {},
      formErrors: {},
      activeTab: "soap",
    }));
  },

  updateFilters: (filters: Partial<MedicalRecordState["filters"]>) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    }));
  },

  setPagination: (pagination: Partial<MedicalRecordState["pagination"]>) => {
    medicalRecordStore.setState((state) => ({
      ...state,
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  reset: () => {
    medicalRecordStore.setState(() => initialState);
  },
};
