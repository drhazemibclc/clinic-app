import { calculatePercentileFromZ, toNumber } from "@clinic-app/utils";
import { Store } from "@tanstack/store";
import type { DbGrowthRecord, GrowthChartData } from "./types";

export interface GrowthState {
  growthRecords: DbGrowthRecord[];
  chartData: GrowthChartData[];
  selectedGrowthRecord: DbGrowthRecord | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GrowthState = {
  growthRecords: [],
  chartData: [],
  selectedGrowthRecord: null,
  isLoading: false,
  error: null,
};

export const growthStore = new Store<GrowthState>(initialState);

export const growthActions = {
  setGrowthRecords: (records: DbGrowthRecord[]) => {
    growthStore.setState((state) => ({ ...state, growthRecords: records }));
  },

  addGrowthRecord: (record: DbGrowthRecord) => {
    growthStore.setState((state) => ({
      ...state,
      growthRecords: [...state.growthRecords, record],
    }));
  },

  updateGrowthRecord: (id: string, updates: Partial<DbGrowthRecord>) => {
    growthStore.setState((state) => ({
      ...state,
      growthRecords: state.growthRecords.map((g) =>
        g.id === id ? { ...g, ...updates } : g,
      ),
    }));
  },

  deleteGrowthRecord: (id: string) => {
    growthStore.setState((state) => ({
      ...state,
      growthRecords: state.growthRecords.filter((g) => g.id !== id),
    }));
  },

  setSelectedGrowthRecord: (record: DbGrowthRecord | null) => {
    growthStore.setState((state) => ({
      ...state,
      selectedGrowthRecord: record,
    }));
  },

  generateChartData: (patientId: string) => {
    const records = growthStore.state.growthRecords
      .filter((g) => g.patientId === patientId)
      .sort((a, b) => (a.ageMonths || 0) - (b.ageMonths || 0));

    const chartData: GrowthChartData[] = records.map((record) => ({
      ageMonths: record.ageMonths || 0,
      weight: record.weight || 0,
      height: record.height || 0,
      headCircumference: Number(record.headCircumference) || 0,
      weightPercentile: calculatePercentileFromZ(
        toNumber(record.weightForAgeZ),
      ),
      heightPercentile: calculatePercentileFromZ(
        toNumber(record.heightForAgeZ),
      ),
      hcPercentile: calculatePercentileFromZ(toNumber(record.hcForAgeZ)),
    }));

    growthStore.setState((state) => ({ ...state, chartData }));
    return chartData;
  },

  setLoading: (isLoading: boolean) => {
    growthStore.setState((state) => ({ ...state, isLoading }));
  },

  setError: (error: string | null) => {
    growthStore.setState((state) => ({ ...state, error }));
  },

  reset: () => {
    growthStore.setState(() => initialState);
  },
};
