// utils/growth.ts - SHARED (no database imports)

import zscoreWfa from "../../data/zscore-wfa.json"; // ============================================
// PURE CALCULATION FUNCTIONS (safe for client)
// ============================================

export function calculateAgeInMonths(birthDate: Date, date: Date): number {
  const months = (date.getFullYear() - birthDate.getFullYear()) * 12;
  return months + (date.getMonth() - birthDate.getMonth());
}

export function calculateAgeInDays(
  dateOfBirth: Date,
  measurementDate?: Date,
): number {
  const birthDate =
    dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  const targetDate = measurementDate || new Date();
  const diffTime = Math.abs(targetDate.getTime() - birthDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateZScore(
  value: number,
  m: number,
  l: number,
  s: number,
): number {
  if (l === 0) {
    return Math.log(value / m) / s;
  }
  return ((value / m) ** l - 1) / (l * s);
}

export type GrowthRecordMeasurement = {
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  headCircumference?: number | null;
  weightForAgeZ?: number | null;
  heightForAgeZ?: number | null;
  bmiForAgeZ?: number | null;
  hcForAgeZ?: number | null;
};

export function getMeasurementValue(
  record: GrowthRecordMeasurement,
  type: string,
): number | null {
  switch (type) {
    case "WEIGHT":
      return record.weight ?? null;
    case "HEIGHT":
      return record.height ?? null;
    case "BMI":
      return record.bmi ?? null;
    case "HEAD_CIRCUMFERENCE":
      return record.headCircumference ?? null;
    default:
      return null;
  }
}

export function getZScoreValue(
  record: GrowthRecordMeasurement,
  type: string,
): number | null {
  switch (type) {
    case "WEIGHT":
      return record.weightForAgeZ ?? null;
    case "HEIGHT":
      return record.heightForAgeZ ?? null;
    case "BMI":
      return record.bmiForAgeZ ?? null;
    case "HEAD_CIRCUMFERENCE":
      return record.hcForAgeZ ?? null;
    default:
      return null;
  }
}

export function getAge(dateOfBirth: string): string {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
  ageMonths += today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    ageMonths--;
  }

  if (ageMonths < 24) {
    return `${ageMonths} months`;
  }
  const years = Math.floor(ageMonths / 12);
  return `${years} years`;
}

export const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  let status: string;
  let colorCode: string;

  if (bmi < 18.5) {
    status = "Underweight";
    colorCode = "#1E90FF";
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    status = "Normal";
    colorCode = "#1E90FF";
  } else if (bmi >= 25 && bmi <= 29.9) {
    status = "Overweight";
    colorCode = "#FF9800";
  } else {
    status = "Obesity";
    colorCode = "#FF5722";
  }

  return {
    bmi: Number.parseFloat(bmi.toFixed(2)),
    status,
    colorCode,
  };
};

export type AgeDetails = {
  days: number;
  months: number;
  years: number;
};

export type AgeOutputFormat = "number" | "string" | "object";

/**
 * Calculates age from a date of birth with flexible output formats.
 *
 * @param dateOfBirth - The birth date as a Date object or ISO string.
 * @param format - 'number' (default, returns total years), 'string' (e.g., "25y 4m"), or 'object' ({years, months, days}).
 */
export const calculateAge = (
  dateOfBirth: string | Date,
  format: AgeOutputFormat = "number",
): number | string | AgeDetails => {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  // Guard clause for invalid dates
  if (Number.isNaN(birth.getTime())) {
    throw new Error("Invalid date provided to calculateAge");
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  // Handle day overflow
  if (days < 0) {
    months--;
    // Get total days in the previous month
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
  }

  // Handle month overflow
  if (months < 0) {
    years--;
    months += 12;
  }

  // Return based on requested format
  switch (format) {
    case "object":
      return { years, months, days };

    case "string":
      if (years > 0) {
        return `${years}y ${months}m ${days}d`;
      }
      if (months > 0) {
        return `${months}m ${days}d`;
      }
      if (days === 0) {
        return "Newborn";
      }
      return `${days}d`;

    default:
      return years;
  }
};

export function calculatePercentileFromZ(zScore: number | null): number {
  if (zScore === null) return 50;

  // Standard normal CDF approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
  const d = 0.3989423 * Math.exp((-zScore * zScore) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const percentile = zScore > 0 ? 1 - p : p;

  return Math.round(percentile * 100);
}

export function calculatePercentile(
  value: number,
  mean: number,
  sd: number,
): number {
  const zScore = (value - mean) / sd;
  return calculatePercentileFromZ(zScore);
}

export interface GrowthMeasurement {
  ageMonths: number;
  weight?: number;
  height?: number;
  headCircumference?: number;
  gender: "MALE" | "FEMALE";
}

export interface PercentileResult {
  percentile: number;
  zScore: number;
  classification:
    | "SEVERE_UNDERWEIGHT"
    | "UNDERWEIGHT"
    | "NORMAL"
    | "OVERWEIGHT"
    | "OBESE";
}

export function calculateWFAPercentile(
  weight: number,
  ageDays: number,
  gender: "MALE" | "FEMALE",
): PercentileResult {
  // LMS method for WFA calculation
  const genderKey = gender === "MALE" ? "boys" : "girls";
  const data = zscoreWfa.wfa[genderKey];
  const ageIndex =
    data.find((d) => Number.parseInt(d.Day, 10) === ageDays) || data[0];

  if (!ageIndex) {
    return { percentile: 50, zScore: 0, classification: "NORMAL" };
  }

  const l = Number.parseFloat(ageIndex.L);
  const m = Number.parseFloat(ageIndex.M);
  const s = Number.parseFloat(ageIndex.S);

  const zScore = ((weight / m) ** l - 1) / (l * s);
  const percentile = normDist(zScore) * 100;

  return {
    percentile,
    zScore,
    classification: getGrowthClassification(zScore),
  };
}

export function calculateHeightVelocity(
  measurements: GrowthMeasurement[],
): number {
  if (measurements.length < 2) return 0;
  const sorted = measurements.sort((a, b) => a.ageMonths - b.ageMonths);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const heightGain = (last?.height || 0) - (first?.height || 0);
  const monthsDiff = (last?.ageMonths ?? 0) - (first?.ageMonths ?? 0);

  return monthsDiff > 0 ? (heightGain / monthsDiff) * 12 : 0;
}

export function detectGrowthAbnormalities(
  measurements: GrowthMeasurement[],
): Array<{ type: string; severity: string; recommendation: string }> {
  const alerts = [];
  const velocities = [];

  for (let i = 1; i < measurements.length; i++) {
    const prev = measurements[i - 1];
    const curr = measurements[i];
    const monthsDiff = (curr?.ageMonths ?? 0) - (prev?.ageMonths ?? 0);

    if (monthsDiff > 0 && prev?.height && curr?.height) {
      const velocity = ((curr?.height - prev?.height) / monthsDiff) * 12;
      velocities.push(velocity);
    }
  }

  // Check for growth faltering
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  if (avgVelocity < 5 && avgVelocity > 0) {
    alerts.push({
      type: "GROWTH_FALTERING",
      severity: "HIGH",
      recommendation:
        "Evaluate for nutritional deficiency or underlying condition",
    });
  }

  return alerts;
}

function getGrowthClassification(zScore: number) {
  if (zScore < -3) return "SEVERE_UNDERWEIGHT";
  if (zScore < -2) return "UNDERWEIGHT";
  if (zScore <= 1) return "NORMAL";
  if (zScore <= 2) return "OVERWEIGHT";
  return "OBESE";
}

function normDist(z: number): number {
  // Cumulative distribution function for standard normal
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
