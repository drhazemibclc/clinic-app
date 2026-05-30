export interface PatientContext {
  weight: number; // kg
  ageMonths: number;
  ageYears: number;
  condition?: string;
  renalImpairment?: boolean;
  hepaticImpairment?: boolean;
}

export interface DrugDosage {
  drugName: string;
  indication: string;
  minDoseMg: number;
  maxDoseMg: number;
  unit: string;
  frequency: string;
  maxDailyDose: number;
  route: "PO" | "IV" | "IM" | "SC" | "PR" | "TOPICAL";
  weightBased: boolean;
  mgPerKg: number;
}

export const pediatricDrugs: Record<string, DrugDosage> = {
  paracetamol: {
    drugName: "Paracetamol (Acetaminophen)",
    indication: "Fever, Pain",
    minDoseMg: 10,
    maxDoseMg: 15,
    unit: "mg/kg",
    frequency: "Every 4-6 hours",
    maxDailyDose: 60,
    route: "PO",
    weightBased: true,
    mgPerKg: 15,
  },
  ibuprofen: {
    drugName: "Ibuprofen",
    indication: "Fever, Pain, Inflammation",
    minDoseMg: 5,
    maxDoseMg: 10,
    unit: "mg/kg",
    frequency: "Every 6-8 hours",
    maxDailyDose: 30,
    route: "PO",
    weightBased: true,
    mgPerKg: 10,
  },
  amoxicillin: {
    drugName: "Amoxicillin",
    indication: "Bacterial infections",
    minDoseMg: 25,
    maxDoseMg: 45,
    unit: "mg/kg/day",
    frequency: "Every 12 hours",
    maxDailyDose: 1500,
    route: "PO",
    weightBased: true,
    mgPerKg: 40,
  },
};

export function calculatePediatricDosage(
  drugKey: string,
  patient: PatientContext,
): {
  singleDose: number;
  dailyDose: number;
  concentration?: string;
  volume?: number;
  warning?: string;
} {
  const drug = pediatricDrugs[drugKey];

  if (!drug) {
    throw new Error(`Drug ${drugKey} not found in pediatric formulary`);
  }

  if (!drug.weightBased && !patient.weight) {
    throw new Error("Patient weight required for weight-based dosing");
  }

  let singleDose: number;
  if (drug.weightBased && patient.weight) {
    singleDose = drug.mgPerKg * patient.weight;
  } else {
    singleDose = drug.minDoseMg;
  }

  // Check against min/max bounds
  const singleDoseMin = drug.minDoseMg * (patient.weight || 1);
  const singleDoseMax = drug.maxDoseMg * (patient.weight || 1);

  let warning: string | undefined;
  if (singleDose < singleDoseMin) {
    warning = `Dose (${singleDose}mg) below recommended minimum (${singleDoseMin}mg)`;
  } else if (singleDose > singleDoseMax) {
    warning = `Dose (${singleDose}mg) exceeds recommended maximum (${singleDoseMax}mg)`;
  }

  const dailyDose = singleDose * (drug.frequency.includes("12") ? 2 : 4);

  if (dailyDose > drug.maxDailyDose) {
    warning =
      `${warning || ""} Daily dose exceeds maximum of ${drug.maxDailyDose}mg`.trim();
  }

  return {
    singleDose: Math.round(singleDose),
    dailyDose: Math.round(dailyDose),
    warning,
  };
}

export function calculateFluidRequirements(weight: number): {
  maintenanceRate: number;
  dailyVolume: number;
} {
  let hourlyRate = 0;

  if (weight <= 10) {
    hourlyRate = weight * 4;
  } else if (weight <= 20) {
    hourlyRate = 40 + (weight - 10) * 2;
  } else {
    hourlyRate = 60 + (weight - 20);
  }

  return {
    maintenanceRate: hourlyRate,
    dailyVolume: hourlyRate * 24,
  };
}

export function calculateCalorieRequirements(
  ageMonths: number,
  weight: number,
): { caloriesPerDay: number; proteinGrams: number } {
  let caloriesPerKg = 0;

  if (ageMonths < 12) {
    caloriesPerKg = 100;
  } else if (ageMonths < 36) {
    caloriesPerKg = 95;
  } else if (ageMonths < 144) {
    caloriesPerKg = 85;
  } else {
    caloriesPerKg = 45;
  }

  const caloriesPerDay = weight * caloriesPerKg;
  const proteinGrams = weight * 1.5;

  return {
    caloriesPerDay: Math.round(caloriesPerDay),
    proteinGrams: Math.round(proteinGrams),
  };
}
