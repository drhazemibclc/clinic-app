import type { AnyColumn } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { pgTableCreator, text, timestamp } from "drizzle-orm/pg-core";
import type { DbPrescribedItem } from "./schema";
import type { AdherenceItem, PrescriptionWithItems } from "./zod";

type AdherenceRecommendation = {
  action: string;
  message: string;
  type: "adherence" | "positive";
};

type AdherenceDataPoint = {
  adherenceRate: number;
  drugId: string;
};

export function parseFrequency(frequency: string): number {
  // Parse frequency string (e.g., "BID" = 2, "TID" = 3, "QD" = 1, "Q4H" = 6)
  const frequencyMap: Record<string, number> = {
    QD: 1,
    BID: 2,
    TID: 3,
    QID: 4,
    Q4H: 6,
    Q6H: 4,
    Q8H: 3,
    Q12H: 2,
    PRN: 2,
  };
  return frequencyMap[frequency.toUpperCase()] ?? 2;
}
export function getAdherenceStatus(rate: number): string {
  if (rate >= 80) return "good";
  if (rate >= 50) return "moderate";
  return "poor";
}

export function generateAdherenceRecommendations(
  adherenceData: AdherenceDataPoint[],
) {
  const recommendations: AdherenceRecommendation[] = [];
  const poorAdherence = adherenceData.filter((d) => d.adherenceRate < 50);

  if (poorAdherence.length > 0) {
    recommendations.push({
      type: "adherence",
      message: `Poor adherence detected for ${poorAdherence.length} medication(s)`,
      action: "Schedule medication counseling session",
    });
  }

  const highAdherence = adherenceData.filter((d) => d.adherenceRate >= 80);
  if (highAdherence.length > 0) {
    recommendations.push({
      type: "positive",
      message: `Good adherence for ${highAdherence.length} medication(s)`,
      action: "Continue current regimen",
    });
  }

  return recommendations;
}

export function groupByMonth(prescriptions: PrescriptionWithItems[]) {
  const monthMap = new Map();

  for (const prescription of prescriptions) {
    const month = prescription.issuedDate.toISOString().slice(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        prescriptionCount: 0,
        totalItems: 0,
      });
    }

    const stats = monthMap.get(month);
    stats.prescriptionCount++;
    stats.totalItems += prescription.prescribedItems.length;
  }

  return Array.from(monthMap.entries())
    .map(([_, stats]) => stats)
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateDaysSupply(item: DbPrescribedItem): number {
  const quantity = item.dosageValue || 0;
  const dosagePerDay = (item.dosageValue || 0) * parseFrequency(item.frequency);
  return dosagePerDay > 0 ? Math.floor(quantity / dosagePerDay) : 0;
}

export function calculateRefillInterval(item: DbPrescribedItem): number {
  // Calculate when next refill is due (typically 80% of days supply)
  const daysSupply = calculateDaysSupply(item);
  return Math.floor(daysSupply * 0.8);
}

type DoctorStats = {
  doctorName: string | undefined;
  prescriptionCount: number;
  uniquePatients: Set<string>;
  totalItems: number;
};

export function groupByDoctor(
  prescriptions: (PrescriptionWithItems & {
    doctor?: { name: string } | null;
  })[],
) {
  const doctorMap = new Map<string, DoctorStats>();

  for (const prescription of prescriptions) {
    const doctorId = prescription.doctorId;
    if (!doctorMap.has(doctorId ?? "")) {
      doctorMap.set(doctorId ?? "", {
        doctorName: prescription.doctor?.name,
        prescriptionCount: 0,
        uniquePatients: new Set(),
        totalItems: 0,
      });
    }

    const stats = doctorMap.get(doctorId ?? "");
    if (!stats) continue;
    stats.prescriptionCount++;
    stats.uniquePatients.add(prescription.patientId);
    stats.totalItems += prescription.prescribedItems.length;
  }

  return Array.from(doctorMap.entries()).map(([id, stats]) => {
    return {
      doctorId: id,
      ...stats,
      uniquePatients: stats.uniquePatients.size,
    };
  });
}

export function groupByDrug(prescriptions: PrescriptionWithItems[]) {
  const drugMap = new Map<
    string,
    {
      drugName: string | undefined;
      prescriptionCount: number;
      totalDoses: number;
      totalQuantity: number;
    }
  >();

  for (const prescription of prescriptions) {
    for (const item of prescription.prescribedItems) {
      const drugId = item.drugId;
      if (!drugMap.has(drugId)) {
        drugMap.set(drugId, {
          drugName: item.drug?.name,
          prescriptionCount: 0,
          totalDoses: 0,
          totalQuantity: 0,
        });
      }

      const stats = drugMap.get(drugId);
      if (!stats) continue;
      stats.prescriptionCount++;
      stats.totalDoses += item.dosageValue || 0;
      // Note: prescribedItem doesn't have a 'quantity' field, using dosageValue as total quantity
      stats.totalQuantity += item.dosageValue || 0;
    }
  }

  return Array.from(drugMap.entries())
    .map(([id, stats]) => {
      return {
        drugId: id,
        ...stats,
      };
    })
    .sort((a, b) => b.prescriptionCount - a.prescriptionCount);
}

export const createTable = pgTableCreator((name) => `${name}`);

export const timestamps = {
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
    mode: "string",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
};

/**
 * Allows a single database instance for multiple projects.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export function takeFirstOrNull<TData>(data: Array<TData>) {
  return data[0] ?? null;
}

export function takeFirstOrThrow<TData>(
  data: Array<TData>,
  errorMessage?: string,
) {
  const first = takeFirstOrNull(data);

  if (!first) {
    throw new Error(errorMessage ?? "Item not found");
  }

  return first;
}

export function isEmpty<TColumn extends AnyColumn>(column: TColumn) {
  return sql<boolean>`
    case
      when ${column} is null then true
      when ${column} = '' then true
      when ${column}::text = '[]' then true
      when ${column}::text = '{}' then true
      else false
    end
  `;
}

/**
 * Converts camelCase to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Creates a key-value for file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only url column
 */
export function createFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}Url`, ReturnType<typeof text>>;
}

/**
 * Creates a key-value for NOT NULL file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only NOT NULL url column
 */
export function createRequiredFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<`${T}Url`, ReturnType<ReturnType<typeof text>["notNull"]>>;
}

/**
 * Creates a pair of columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with fileName and url columns
 */
export function createFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}FileName` | `${T}Url`, ReturnType<typeof text>>;
}

/** * Creates a pair of NOT NULL columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with NOT NULL fileName and url columns
 */
export function createRequiredFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`).notNull(),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<
    `${T}FileName` | `${T}Url`,
    ReturnType<ReturnType<typeof text>["notNull"]>
  >;
}

// Helper functions
export function calculateAdherenceMetrics(prescribedItems: AdherenceItem[]) {
  let totalAdherence = 0;
  let count = 0;

  for (const item of prescribedItems) {
    const expectedDoses = calculateExpectedDoses(
      item,
      item.prescription?.issuedDate ?? new Date(),
      item.prescription?.validUntil ?? new Date(),
    );
    const dispensedDoses =
      item.dispenses?.reduce(
        (sum: number, dispense: { quantityDispensed: number }) =>
          sum + dispense.quantityDispensed / (item.dosageValue || 1),
        0,
      ) ?? 0;

    const adherence =
      expectedDoses > 0 ? (dispensedDoses / expectedDoses) * 100 : 0;
    totalAdherence += adherence;
    count++;
  }

  return {
    overallAdherence: count > 0 ? totalAdherence / count : 0,
    status: getAdherenceStatus(totalAdherence / count),
  };
}

export function calculateExpectedDoses(
  item: AdherenceItem,
  startDate: Date,
  endDate: Date,
) {
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const frequencyPerDay = parseFrequency(item.frequency);
  return days * frequencyPerDay * (item.dosageValue || 1);
}
