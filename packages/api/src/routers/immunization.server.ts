// src/server/routers/immunization.router.ts

import { mutations } from "@clinic-app/db/actions/mutations";
import { vaccineQueries } from "@clinic-app/db/actions/queries";
import { queries } from "@clinic-app/db/queries";
import type { ImmunizationStatus } from "@clinic-app/db/schema/types";
import type { PatientSchema } from "@clinic-app/db/zod/clinic.schema";
import {
  ImmunizationSchema,
  type VaccineScheduleSchema,
} from "@clinic-app/db/zod/clinic.schema";
import { calculateAgeInDays } from "@clinic-app/utils/growth";
import z from "zod";
import { adminProcedure, protectedProcedure } from "..";

type ImmunizationRecord = z.infer<typeof ImmunizationSchema>;
type VaccineScheduleRecord = z.infer<typeof VaccineScheduleSchema>;
type PatientRecord = z.infer<typeof PatientSchema>;

type CatchUpDose = {
  doseNumber: number;
  recommendedDate: Date;
  vaccineName: string;
};

type CatchUpRecommendation = {
  vaccineName: string;
  missingDoses: number;
  catchUpDoses: CatchUpDose[];
  priority: "high" | "medium" | "normal" | "low";
  notes: string;
};

export const vaccineRouter = {
  getPatientVaccineSchedule: adminProcedure
    .input(z.object({ patientId: z.string() }))
    .handler(async ({ input }) => {
      return await vaccineQueries.getPatientVaccineSchedule(input.patientId);
    }),

  getVaccineInventoryStatus: adminProcedure
    .input(z.object({ clinicId: z.string() }))
    .handler(async ({ input }) => {
      return await vaccineQueries.getVaccineInventoryStatus(input.clinicId);
    }),

  getOverdueImmunizations: adminProcedure
    .input(z.object({ clinicId: z.string() }))
    .handler(async ({ input }) => {
      return await vaccineQueries.getOverdueImmunizations(input.clinicId);
    }),

  recordImmunization: adminProcedure
    .input(
      z.object({
        patientId: z.string(),
        clinicId: z.string(),
        vaccine: z.string(),
        date: z.date(),
        dose: z.string(),
        lotNumber: z.string(),
        administeredByStaffId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      return await vaccineQueries.recordImmunization(input);
    }),
};
// Shared logic function for getting immunization schedule (used by reminders)
async function getPatientImmunizationScheduleLogic(params: {
  patientId: string;
  includePastDue?: boolean;
}) {
  const { patientId } = params;

  // Use patient queries to get patient data with immunizations
  const patientData = await queries.patient.getPatientById(patientId, "");

  if (!patientData) {
    throw new Error("Patient not found");
  }

  // Get immunizations using vaccine queries
  const scheduleResult =
    await vaccineQueries.getPatientVaccineSchedule(patientId);
  const patientImmunizations = scheduleResult?.administeredVaccines ?? [];

  const ageInDays = calculateAgeInDays(patientData.dateOfBirth);
  const ageInMonths = Math.floor(ageInDays / 30.44);
  const ageInYears = Math.floor(ageInMonths / 12);

  console.log(
    `Patient age: ${ageInYears} years, ${ageInMonths % 12} months, ${ageInDays % 30} days`,
  );

  // Get all vaccine schedules using vaccine queries
  const allVaccines = (await queries.vaccine?.getAllSchedules?.()) ?? [];

  // Create a map of administered vaccines by name
  const administeredMap = new Map<string, ImmunizationRecord[]>();
  for (const admin of patientImmunizations) {
    if (!administeredMap.has(admin.vaccine)) {
      administeredMap.set(admin.vaccine, []);
    }
    administeredMap.get(admin.vaccine)?.push(admin);
  }

  // Calculate due and upcoming vaccines
  const dueVaccines: (VaccineScheduleRecord & {
    administeredRecords: ImmunizationRecord[];
    completedDoses: number;
    totalRequiredDoses: number;
    nextDoseNumber: number;
    status: string;
  })[] = [];
  const upcomingVaccines: (VaccineScheduleRecord & {
    eligibleDate: Date;
    daysUntilEligible: number;
  })[] = [];
  const completedVaccines: (VaccineScheduleRecord & {
    administeredRecords: ImmunizationRecord[];
    completedDoses: number;
    totalRequiredDoses: number;
    status: string;
  })[] = [];
  const overdueVaccines: (VaccineScheduleRecord & {
    administeredRecords: ImmunizationRecord[];
    completedDoses: number;
    totalRequiredDoses: number;
    status: string;
    nextDoseNumber?: number;
  })[] = [];

  for (const vaccine of allVaccines) {
    const adminRecords = administeredMap.get(vaccine.vaccineName) ?? [];
    const completedDoses = adminRecords.length;
    const totalRequiredDoses =
      (vaccine.totalDoses ?? vaccine.dosesRequired) || 1;
    const isComplete = completedDoses >= totalRequiredDoses;

    // Check if vaccine is age-appropriate
    const minAgeDays = vaccine.ageInDaysMin ?? 0;
    const maxAgeDays = vaccine.ageInDaysMax ?? Number.POSITIVE_INFINITY;
    const isAgeAppropriate = ageInDays >= minAgeDays && ageInDays <= maxAgeDays;

    if (isComplete) {
      completedVaccines.push({
        ...vaccine,
        administeredRecords: adminRecords,
        completedDoses,
        totalRequiredDoses,
        status: "COMPLETED" as const,
      });
    } else if (isAgeAppropriate) {
      const nextDoseNumber = completedDoses + 1;
      const isOverdue = adminRecords.length === 0 && ageInDays > maxAgeDays;

      const vaccineData = {
        ...vaccine,
        administeredRecords: adminRecords,
        completedDoses,
        totalRequiredDoses,
        nextDoseNumber,
        status: isOverdue ? ("OVERDUE" as const) : ("PENDING" as const),
      };

      if (isOverdue) {
        overdueVaccines.push(vaccineData);
      } else {
        dueVaccines.push(vaccineData);
      }
    } else if (ageInDays < minAgeDays) {
      upcomingVaccines.push({
        ...vaccine,
        eligibleDate: new Date(
          Date.now() + (minAgeDays - ageInDays) * 24 * 60 * 60 * 1000,
        ),
        daysUntilEligible: minAgeDays - ageInDays,
      });
    } else if (ageInDays > maxAgeDays && !isComplete) {
      overdueVaccines.push({
        ...vaccine,
        administeredRecords: adminRecords,
        completedDoses,
        totalRequiredDoses,
        status: "OVERDUE" as const,
      });
    }
  }

  return {
    due: dueVaccines,
    upcoming: upcomingVaccines,
    completed: completedVaccines,
    overdue: overdueVaccines,
  };
}

export const listImmunizations = protectedProcedure
  .input(
    z.object({
      patientId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }),
  )
  .output(
    z.object({
      records: z.array(ImmunizationSchema),
      total: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { limit, offset, patientId } = input;
    const clinicId = context.clinicId ?? "";

    const { records, total } = await queries.vaccine.listImmunizations({
      clinicId,
      patientId,
      limit,
      offset,
    });

    return {
      records,
      total,
    };
  });

// Record single immunization with inventory management
export const recordImmunization = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      vaccineName: z.string(),
      date: z.date(),
      dose: z.string(),
      lotNumber: z.string().optional(),
      administeredByStaffId: z.string().optional(),
      notes: z.string().optional(),
      batchId: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    // Check and decrement inventory if batchId provided
    if (input.batchId) {
      const inventoryStatus =
        await queries.vaccine?.getVaccineInventoryStatus?.(
          context.clinicId ?? "",
        );
      const batch = inventoryStatus?.inventoryByVaccine?.find(
        (v) => v.id === input.batchId,
      );

      if (!batch || batch.quantity <= 0) {
        throw new Error("Insufficient vaccine stock");
      }

      // Update inventory using mutation
      await mutations.vaccine.updateInventory?.(input.batchId, {
        quantity: batch.quantity - 1,
      });
    }

    // Record immunization using the immunization mutation
    const record = await mutations.vaccine.recordImmunization?.({
      id: crypto.randomUUID(),
      recordId: crypto.randomUUID(),
      patientId: input.patientId,
      clinicId: context.clinicId ?? "",
      vaccine: input.vaccineName,
      date: input.date,
      dose: input.dose,
      lotNumber: input.lotNumber,
      administeredByStaffId: input.administeredByStaffId,
      notes: input.notes,
    });

    return record;
  });

// Batch immunization recording
export const batchRecordImmunizations = protectedProcedure
  .input(
    z.object({
      immunizations: z.array(
        z.object({
          patientId: z.string(),
          vaccineName: z.string(),
          dose: z.string(),
          lotNumber: z.string().optional(),
          notes: z.string().optional(),
        }),
      ),
      administeredByStaffId: z.string(),
      administrationDate: z.date(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    const results: ImmunizationRecord[] = [];
    const errors: {
      patientId: string;
      vaccineName: string;
      error: string;
    }[] = [];

    for (const imm of input.immunizations) {
      try {
        const record = await mutations.vaccine.recordImmunization?.({
          id: crypto.randomUUID(),
          recordId: crypto.randomUUID(),
          patientId: imm.patientId,
          clinicId: context.clinicId ?? "",
          vaccine: imm.vaccineName,
          date: input.administrationDate,
          dose: imm.dose,
          lotNumber: imm.lotNumber,
          administeredByStaffId: input.administeredByStaffId,
          notes: imm.notes,
        });

        if (record) {
          results.push(record);
        }
      } catch (error) {
        errors.push({
          patientId: imm.patientId,
          vaccineName: imm.vaccineName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalSuccess: results.length,
      totalFailed: errors.length,
    };
  });

// Get immunization schedule for patient with comprehensive age calculation
export const getPatientImmunizationSchedule = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      includePastDue: z.boolean().default(true),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    // Use patient query to get patient data
    const patientData = await queries.patient.getPatientById(
      input.patientId,
      "",
    );

    if (!patientData) {
      throw new Error("Patient not found");
    }

    const ageInDays = calculateAgeInDays(patientData.dateOfBirth);
    const ageInMonths = Math.floor(ageInDays / 30.44);
    const ageInYears = Math.floor(ageInMonths / 12);

    // Get vaccine schedule using vaccine queries
    const scheduleResult = await vaccineQueries.getPatientVaccineSchedule(
      input.patientId,
    );
    const patientImmunizations = scheduleResult?.administeredVaccines ?? [];
    const allVaccines = (await queries.vaccine?.getAllSchedules?.()) ?? [];

    // Create a map of administered vaccines by name
    const administeredMap = new Map<string, ImmunizationRecord[]>();
    for (const admin of patientImmunizations) {
      if (!administeredMap.has(admin.vaccine)) {
        administeredMap.set(admin.vaccine, []);
      }
      administeredMap.get(admin.vaccine)?.push(admin);
    }

    // Calculate due and upcoming vaccines
    const dueVaccines: (VaccineScheduleRecord & {
      administeredRecords: ImmunizationRecord[];
      completedDoses: number;
      totalRequiredDoses: number;
      nextDoseNumber: number;
      status: ImmunizationStatus;
    })[] = [];
    const upcomingVaccines: (VaccineScheduleRecord & {
      eligibleDate: Date;
      daysUntilEligible: number;
    })[] = [];
    const completedVaccines: (VaccineScheduleRecord & {
      administeredRecords: ImmunizationRecord[];
      completedDoses: number;
      totalRequiredDoses: number;
      status: ImmunizationStatus;
    })[] = [];
    const overdueVaccines: (VaccineScheduleRecord & {
      administeredRecords: ImmunizationRecord[];
      completedDoses: number;
      totalRequiredDoses: number;
      status: ImmunizationStatus;
      nextDoseNumber?: number;
    })[] = [];

    for (const vaccine of allVaccines) {
      const adminRecords = administeredMap.get(vaccine.vaccineName) ?? [];
      const completedDoses = adminRecords.length;
      const totalRequiredDoses =
        (vaccine.totalDoses ?? vaccine.dosesRequired) || 1;
      const isComplete = completedDoses >= totalRequiredDoses;

      // Check if vaccine is age-appropriate
      const minAgeDays = vaccine.ageInDaysMin ?? 0;
      const maxAgeDays = vaccine.ageInDaysMax ?? Number.POSITIVE_INFINITY;
      const isAgeAppropriate =
        ageInDays >= minAgeDays && ageInDays <= maxAgeDays;

      if (isComplete) {
        completedVaccines.push({
          ...vaccine,
          dosesRequired: totalRequiredDoses,
          administeredRecords: adminRecords,
          completedDoses,
          totalRequiredDoses,
          status: "COMPLETED",
        });
      } else if (isAgeAppropriate) {
        const nextDoseNumber = completedDoses + 1;
        const isOverdue = adminRecords.length === 0 && ageInDays > maxAgeDays;

        const vaccineData = {
          ...vaccine,
          dosesRequired: totalRequiredDoses,
          administeredRecords: adminRecords,
          completedDoses,
          totalRequiredDoses,
          nextDoseNumber,
          status: (isOverdue ? "OVERDUE" : "PENDING") as ImmunizationStatus,
        };

        if (isOverdue && input.includePastDue) {
          overdueVaccines.push(vaccineData);
        } else if (!isOverdue) {
          dueVaccines.push(vaccineData);
        }
      } else if (ageInDays < minAgeDays) {
        upcomingVaccines.push({
          ...vaccine,
          dosesRequired: totalRequiredDoses,
          eligibleDate: new Date(
            Date.now() + (minAgeDays - ageInDays) * 24 * 60 * 60 * 1000,
          ),
          daysUntilEligible: minAgeDays - ageInDays,
        });
      } else if (
        ageInDays > maxAgeDays &&
        !isComplete &&
        input.includePastDue
      ) {
        overdueVaccines.push({
          ...vaccine,
          dosesRequired: totalRequiredDoses,
          administeredRecords: adminRecords,
          completedDoses,
          totalRequiredDoses,
          status: "OVERDUE",
        });
      }
    }

    // Get catch-up recommendations
    const catchUpRecommendations = generateCatchUpSchedule(
      allVaccines as VaccineScheduleRecord[],
      administeredMap,
    );

    return {
      patient: {
        id: patientData.id,
        name: `${patientData.firstName} ${patientData.lastName}`,
        dateOfBirth: patientData.dateOfBirth,
        age: {
          years: ageInYears,
          months: ageInMonths,
          days: ageInDays,
        },
      },
      schedule: {
        due: dueVaccines,
        upcoming: upcomingVaccines,
        completed: completedVaccines,
        overdue: overdueVaccines,
      },
      catchUpSchedule: catchUpRecommendations,
      summary: {
        totalDue: dueVaccines.length,
        totalCompleted: completedVaccines.length,
        totalOverdue: overdueVaccines.length,
        totalUpcoming: upcomingVaccines.length,
        overallCompliance:
          allVaccines.length > 0
            ? Math.round((completedVaccines.length / allVaccines.length) * 100)
            : 0,
      },
    };
  });

// Generate catch-up immunization schedule
function generateCatchUpSchedule(
  allVaccines: VaccineScheduleRecord[],
  administeredMap: Map<string, ImmunizationRecord[]>,
): CatchUpRecommendation[] {
  const catchUpSchedule: CatchUpRecommendation[] = [];
  const currentDate = new Date();

  for (const vaccine of allVaccines) {
    const adminRecords = administeredMap.get(vaccine.vaccineName) ?? [];
    const completedDoses = adminRecords.length;
    const totalRequiredDoses =
      (vaccine.totalDoses ?? vaccine.dosesRequired) || 1;

    if (completedDoses < totalRequiredDoses) {
      // Calculate accelerated schedule for catch-up
      const missingDoses = totalRequiredDoses - completedDoses;
      const recommendedInterval = vaccine.minimumInterval ?? 28; // Default 4 weeks
      const startDate = new Date(currentDate);

      const catchUpDoses: CatchUpDose[] = [];
      for (let i = 0; i < missingDoses; i++) {
        catchUpDoses.push({
          doseNumber: completedDoses + i + 1,
          recommendedDate: new Date(
            startDate.getTime() + i * recommendedInterval * 24 * 60 * 60 * 1000,
          ),
          vaccineName: vaccine.vaccineName,
        });
      }

      catchUpSchedule.push({
        vaccineName: vaccine.vaccineName,
        missingDoses,
        catchUpDoses,
        priority: "normal" as const,
        notes: vaccine.description ?? "Follow standard catch-up schedule",
      });
    }
  }

  return catchUpSchedule.sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      high: 1,
      medium: 2,
      normal: 3,
      low: 4,
    };
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  });
}

// Record adverse event for immunization
export const recordAdverseEvent = protectedProcedure
  .input(
    z.object({
      immunizationId: z.string(),
      patientId: z.string(),
      vaccineName: z.string(),
      eventType: z.enum([
        "allergic_reaction",
        "fever",
        "pain",
        "swelling",
        "other",
      ]),
      severity: z.enum(["MILD", "MODERATE", "SEVERE", "CRITICAL"]),
      dateReported: z.date(),
      description: z.string(),
      outcome: z.string().optional(),
      treatment: z.string().optional(),
      reportedByStaffId: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    // Use adverse event mutation if available
    const event = await mutations.vaccine.recordAdverseEvent({
      id: crypto.randomUUID(),
      immunizationId: input.immunizationId,
      patientId: input.patientId,
      vaccineName: input.vaccineName,
      eventType: input.eventType,
      severity: input.severity,
      description: input.description,
      outcome: input.outcome,
      treatment: input.treatment,
      dateReported: input.dateReported,
      reportedByStaffId: context.user?.id ?? "",
    });

    return event;
  });

// Get immunization history with adverse events
export const getImmunizationHistory = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    // Use vaccine query to get immunization history
    const scheduleResult = await vaccineQueries.getPatientVaccineSchedule(
      input.patientId,
    );
    const immunizations = scheduleResult?.administeredVaccines ?? [];

    // Get patient data
    const patientData = await queries.patient.getPatientById(
      input.patientId,
      "",
    );

    // Generate immunization certificate data
    if (!patientData) {
      throw new Error("Patient not found");
    }

    const certificate = generateImmunizationCertificate(
      immunizations,
      patientData as PatientRecord,
    );

    return {
      immunizations,
      limit: input.limit,
      offset: input.offset,
      certificate,
      compliance: calculateComplianceMetrics(immunizations),
    };
  });

// Generate immunization certificate
function generateImmunizationCertificate(
  immunizations: ImmunizationRecord[],
  patientData: PatientRecord,
) {
  const isFullyImmunized = immunizations.length >= 10; // Threshold for fully immunized child

  return {
    isFullyImmunized,
    certificateNumber: `IMM-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    generatedDate: new Date(),
    patientName: patientData
      ? `${patientData.firstName} ${patientData.lastName}`
      : "Unknown",
    immunizations: immunizations.map((imm) => {
      return {
        vaccine: imm.vaccine,
        date: imm.date,
        dose: imm.dose,
        administeredBy: imm.administeredByStaffId ?? "Unknown",
        lotNumber: imm.lotNumber ?? "N/A",
      };
    }),
  };
}

// Calculate compliance metrics
function calculateComplianceMetrics(immunizations: ImmunizationRecord[]) {
  const vaccinesByType = new Map<string, ImmunizationRecord[]>();

  for (const imm of immunizations) {
    let list = vaccinesByType.get(imm.vaccine);
    if (!list) {
      list = [];
      vaccinesByType.set(imm.vaccine, list);
    }
    list.push(imm);
  }

  return {
    totalVaccines: immunizations.length,
    uniqueVaccines: vaccinesByType.size,
    completenessScore: Math.min(100, (immunizations.length / 15) * 100),
  };
}

// Generate immunization reminders
export const generateImmunizationReminders = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      reminderDays: z.number().default(7),
    }),
  )
  .output(
    z.array(
      z.object({
        patientId: z.string(),
        patientName: z.string(),
        phone: z.string().nullable(),
        email: z.string().nullable(),
        dueVaccines: z.array(z.any()),
        overdueVaccines: z.array(z.any()),
        reminderDate: z.date(),
      }),
    ),
  )
  .handler(async ({ input }) => {
    // Fetch only active patients in the specific clinic
    const patients =
      (await queries.patient.getPatientsByClinic?.(input.clinicId)) ?? [];

    const reminders: {
      patientId: string;
      patientName: string;
      phone: string | null;
      email: string | null;
      dueVaccines: Record<string, unknown>[];
      overdueVaccines: Record<string, unknown>[];
      reminderDate: Date;
    }[] = [];

    for (const patient of patients) {
      if (!patient.isActive || patient.isDeleted) continue;

      const schedule = await getPatientImmunizationScheduleLogic({
        patientId: patient.id,
      });

      const hasDue = schedule.due.length > 0;
      const hasOverdue = schedule.overdue.length > 0;

      if (hasDue || hasOverdue) {
        reminders.push({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone,
          email: patient.email,
          dueVaccines: schedule.due,
          overdueVaccines: schedule.overdue,
          reminderDate: new Date(),
        });
      }
    }

    return reminders;
  });

// Export bulk immunization data for reporting
export const exportImmunizationData = protectedProcedure
  .input(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
      clinicId: z.string(),
      format: z.enum(["json", "csv"]).default("json"),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    // Get overdue immunizations for the clinic
    const overdueImmunizations = await vaccineQueries.getOverdueImmunizations(
      input.clinicId,
    );

    // Filter by date range
    const filteredImmunizations = overdueImmunizations.filter((imm) => {
      const immDate = new Date(imm.date);
      return immDate >= input.startDate && immDate <= input.endDate;
    });

    // Generate statistics
    const stats = {
      totalImmunizations: filteredImmunizations.length,
      uniquePatients: new Set(filteredImmunizations.map((i) => i.patientId))
        .size,
      vaccinesByType: {} as Record<string, number>,
      adverseEvents: 0,
      coverageRate: 0,
    };

    for (const imm of filteredImmunizations) {
      const vaccineName = imm.vaccine;
      stats.vaccinesByType[vaccineName] =
        (stats.vaccinesByType[vaccineName] ?? 0) + 1;
    }

    if (input.format === "csv") {
      const csvRows = [
        [
          "Date",
          "Patient Name",
          "Vaccine",
          "Dose",
          "Lot Number",
          "Administered By",
          "Adverse Event",
        ],
        ...filteredImmunizations.map((imm) => [
          imm.date.toISOString(),
          `${imm.patient?.firstName} ${imm.patient?.lastName}`,
          imm.vaccine,
          imm.dose,
          imm.lotNumber ?? "",
          imm.administeredByStaffId ?? "",
          "No",
        ]),
      ];
      return { csv: csvRows.map((row) => row.join(",")).join("\n"), stats };
    }

    return { data: filteredImmunizations, stats };
  });

// Get vaccine inventory status
export const getVaccineInventory = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      includeExpired: z.boolean().default(false),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const inventoryStatus = await vaccineQueries.getVaccineInventoryStatus(
      input.clinicId,
    );

    return {
      inventory: inventoryStatus?.inventoryByVaccine ?? [],
      summary: {
        totalItems: inventoryStatus?.totalVaccines ?? 0,
        totalDoses: inventoryStatus?.totalDoses ?? 0,
        lowStockItems: inventoryStatus?.lowStock?.length ?? 0,
        expiredItems: inventoryStatus?.expired?.length ?? 0,
      },
      lowStock: inventoryStatus?.lowStock ?? [],
      expired: inventoryStatus?.expired ?? [],
    };
  });

// Update vaccine inventory
export const updateVaccineInventory = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      quantity: z.number().min(0),
      lotNumber: z.string().optional(),
      expirationDate: z.date().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const updated = await mutations.vaccine.updateInventory?.(input.id, {
      quantity: input.quantity,
      lotNumber: input.lotNumber,
      expirationDate: input.expirationDate,
    });

    return updated;
  });

// Get upcoming immunizations
export const getUpcomingImmunizations = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      daysAhead: z.number().default(30),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const upcoming = await vaccineQueries.getUpcomingImmunizations(
      input.clinicId,
    );
    return upcoming;
  });

export const immunizationRouter = {
  list: listImmunizations,
  record: recordImmunization,
  batchRecord: batchRecordImmunizations,
  getSchedule: getPatientImmunizationSchedule,
  recordAdverseEvent: recordAdverseEvent,
  getHistory: getImmunizationHistory,
  generateReminders: generateImmunizationReminders,
  exportData: exportImmunizationData,
  getInventory: getVaccineInventory,
  updateInventory: updateVaccineInventory,
  getUpcoming: getUpcomingImmunizations,
};
