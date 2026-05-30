import type { GrowthMeasurement } from "@clinic-app/utils";
import { createStore } from "@tanstack/store";

interface GrowthStore {
  data: Record<string, GrowthMeasurement[]>;
  selectedMetrics: Record<
    string,
    "WEIGHT" | "HEIGHT" | "HEAD_CIRCUMFERENCE" | "BMI"
  >;
  alerts: Array<{
    patientId: string;
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    message: string;
    timestamp: Date;
  }>;
}

export const growthStore = createStore<GrowthStore>({
  data: {},
  selectedMetrics: {},
  alerts: [],
});

// Actions
export function addGrowthDataPoint(
  patientId: string,
  measurement: GrowthMeasurement,
) {
  growthStore.setState((state) => ({
    ...state,
    data: {
      ...state.data,
      [patientId]: [...(state.data[patientId] || []), measurement],
    },
  }));
}

export function updateGrowthData(
  patientId: string,
  measurements: GrowthMeasurement[],
) {
  growthStore.setState((state) => ({
    ...state,
    data: {
      ...state.data,
      [patientId]: measurements,
    },
  }));
}

export function setSelectedMetric(
  patientId: string,
  metric: "WEIGHT" | "HEIGHT" | "HEAD_CIRCUMFERENCE" | "BMI",
) {
  growthStore.setState((state) => ({
    ...state,
    selectedMetrics: {
      ...state.selectedMetrics,
      [patientId]: metric,
    },
  }));
}

export function addGrowthAlert(alert: GrowthStore["alerts"][0]) {
  growthStore.setState((state) => ({
    ...state,
    alerts: [...state.alerts, alert],
  }));
}

export function clearAlerts(patientId: string) {
  growthStore.setState((state) => ({
    ...state,
    alerts: state.alerts.filter((a) => a.patientId !== patientId),
  }));
}
