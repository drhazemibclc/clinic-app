export interface Vaccine {
  id: string;
  name: string;
  abbreviation: string;
  doses: Dose[];
  isMandatory: boolean;
  description?: string;
}

export interface Dose {
  number: number;
  ageMonthsMin: number;
  ageMonthsMax: number;
  preferredAgeMonths: number;
  catchUpMonths?: number;
}

export const immunizationSchedule: Vaccine[] = [
  {
    id: "bcg",
    name: "BCG",
    abbreviation: "BCG",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 0, ageMonthsMax: 0.5, preferredAgeMonths: 0 },
    ],
  },
  {
    id: "hepb",
    name: "Hepatitis B",
    abbreviation: "HepB",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 0, ageMonthsMax: 0.5, preferredAgeMonths: 0 },
      { number: 2, ageMonthsMin: 1, ageMonthsMax: 2, preferredAgeMonths: 1.5 },
      { number: 3, ageMonthsMin: 6, ageMonthsMax: 18, preferredAgeMonths: 6 },
    ],
  },
  {
    id: "dtap",
    name: "DTaP",
    abbreviation: "DTaP",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 2, ageMonthsMax: 3, preferredAgeMonths: 2 },
      { number: 2, ageMonthsMin: 4, ageMonthsMax: 5, preferredAgeMonths: 4 },
      { number: 3, ageMonthsMin: 6, ageMonthsMax: 7, preferredAgeMonths: 6 },
      { number: 4, ageMonthsMin: 15, ageMonthsMax: 18, preferredAgeMonths: 15 },
      { number: 5, ageMonthsMin: 48, ageMonthsMax: 72, preferredAgeMonths: 48 },
    ],
  },
  {
    id: "hib",
    name: "Haemophilus influenzae type b",
    abbreviation: "Hib",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 2, ageMonthsMax: 3, preferredAgeMonths: 2 },
      { number: 2, ageMonthsMin: 4, ageMonthsMax: 5, preferredAgeMonths: 4 },
      { number: 3, ageMonthsMin: 6, ageMonthsMax: 15, preferredAgeMonths: 6 },
      { number: 4, ageMonthsMin: 12, ageMonthsMax: 18, preferredAgeMonths: 12 },
    ],
  },
  {
    id: "pcv",
    name: "Pneumococcal Conjugate",
    abbreviation: "PCV13",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 2, ageMonthsMax: 3, preferredAgeMonths: 2 },
      { number: 2, ageMonthsMin: 4, ageMonthsMax: 5, preferredAgeMonths: 4 },
      { number: 3, ageMonthsMin: 6, ageMonthsMax: 7, preferredAgeMonths: 6 },
      { number: 4, ageMonthsMin: 12, ageMonthsMax: 18, preferredAgeMonths: 12 },
    ],
  },
  {
    id: "ipv",
    name: "Inactivated Poliovirus",
    abbreviation: "IPV",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 2, ageMonthsMax: 3, preferredAgeMonths: 2 },
      { number: 2, ageMonthsMin: 4, ageMonthsMax: 5, preferredAgeMonths: 4 },
      { number: 3, ageMonthsMin: 6, ageMonthsMax: 18, preferredAgeMonths: 6 },
      { number: 4, ageMonthsMin: 48, ageMonthsMax: 72, preferredAgeMonths: 48 },
    ],
  },
  {
    id: "mmr",
    name: "Measles, Mumps, Rubella",
    abbreviation: "MMR",
    isMandatory: true,
    doses: [
      { number: 1, ageMonthsMin: 12, ageMonthsMax: 15, preferredAgeMonths: 12 },
      { number: 2, ageMonthsMin: 48, ageMonthsMax: 72, preferredAgeMonths: 48 },
    ],
  },
  {
    id: "varicella",
    name: "Varicella (Chickenpox)",
    abbreviation: "VAR",
    isMandatory: false,
    doses: [
      { number: 1, ageMonthsMin: 12, ageMonthsMax: 15, preferredAgeMonths: 12 },
      { number: 2, ageMonthsMin: 48, ageMonthsMax: 72, preferredAgeMonths: 48 },
    ],
  },
  {
    id: "hepa",
    name: "Hepatitis A",
    abbreviation: "HepA",
    isMandatory: false,
    doses: [
      { number: 1, ageMonthsMin: 12, ageMonthsMax: 23, preferredAgeMonths: 12 },
      { number: 2, ageMonthsMin: 18, ageMonthsMax: 30, preferredAgeMonths: 18 },
    ],
  },
];

export interface ImmunizationStatus {
  vaccineId: string;
  doseNumber: number;
  status: "DUE" | "OVERDUE" | "COMPLETED" | "UPCOMING";
  dueDate: Date;
}

export function getPatientImmunizationStatus(
  birthDate: Date,
  completedDoses: Array<{
    vaccineId: string;
    doseNumber: number;
    dateAdministered: Date;
  }>,
): ImmunizationStatus[] {
  const today = new Date();
  const ageInMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());
  const schedule: ImmunizationStatus[] = [];

  for (const vaccine of immunizationSchedule) {
    for (const dose of vaccine.doses) {
      const isCompleted = completedDoses.some(
        (c) => c.vaccineId === vaccine.id && c.doseNumber === dose.number,
      );

      const dueDate = new Date(birthDate);
      dueDate.setMonth(dueDate.getMonth() + dose.preferredAgeMonths);

      let status: ImmunizationStatus["status"] = "UPCOMING";

      if (isCompleted) {
        status = "COMPLETED";
      } else if (ageInMonths > dose.ageMonthsMax) {
        status = "OVERDUE";
      } else if (ageInMonths >= dose.ageMonthsMin) {
        status = "DUE";
      }

      schedule.push({
        vaccineId: vaccine.id,
        doseNumber: dose.number,
        status,
        dueDate,
      });
    }
  }

  return schedule;
}

export function getUpcomingImmunizations(
  birthDate: Date,
  completedDoses: Array<{ vaccineId: string; doseNumber: number }>,
  lookaheadMonths = 3,
): ImmunizationStatus[] {
  const allStatus = getPatientImmunizationStatus(
    birthDate,
    completedDoses.map((d) => ({ ...d, dateAdministered: new Date() })),
  );
  const today = new Date();
  const limitDate = new Date();
  limitDate.setMonth(limitDate.getMonth() + lookaheadMonths);

  return allStatus.filter(
    (item) =>
      item.status !== "COMPLETED" &&
      item.dueDate <= limitDate &&
      item.dueDate >= today,
  );
}

export function getOverdueImmunizations(
  birthDate: Date,
  completedDoses: Array<{ vaccineId: string; doseNumber: number }>,
): ImmunizationStatus[] {
  const allStatus = getPatientImmunizationStatus(
    birthDate,
    completedDoses.map((d) => ({ ...d, dateAdministered: new Date() })),
  );
  return allStatus.filter((item) => item.status === "OVERDUE");
}
