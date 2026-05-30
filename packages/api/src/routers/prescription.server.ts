// src/server/routers/prescription.router.ts

import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import {
  type DbDrug,
  type Frequency,
  prescriptionStatusEnum,
} from "@clinic-app/db/schema/index";
import {
  calculateDaysSupply,
  calculateRefillInterval,
  generateAdherenceRecommendations,
  getAdherenceStatus,
  groupByDoctor,
  groupByDrug,
  groupByMonth,
} from "@clinic-app/db/utils";
import {
  calculateAdherenceMetrics,
  calculateExpectedDoses,
} from "@clinic-app/db/zod/clinic.schema";
import { generateId } from "@clinic-app/utils/id";
import { z } from "zod";
import { o, protectedProcedure } from "../index";

// type Patient = InferSelectModel<typeof patient>;
// Types for enhanced prescriptions
type PrescriptionWithRelations = NonNullable<
  Awaited<
    ReturnType<typeof queries.prescription.getPatientActivePrescriptions>
  >[number]
>;

type EnhancedPrescribedItem =
  PrescriptionWithRelations["prescribedItems"][number] & {
    refillsRemaining: number;
    daysSupply: number;
    isDueForRefill: boolean;
  };

type EnhancedPrescription = Omit<
  PrescriptionWithRelations,
  "prescribedItems"
> & {
  items: EnhancedPrescribedItem[];
};

// Create prescription with drug interaction checking
export const createPrescription = protectedProcedure
  .input(
    z.object({
      medicalRecordId: z.string(),
      patientId: z.string(),
      doctorId: z.string(),
      encounterId: z.string(),
      items: z.array(PrescribedItemCreateSchema),
      notes: z.string().optional(),
      validUntil: z.date().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      medicalRecordId: z.string(),
      patientId: z.string(),
      doctorId: z.string().nullable(),
      encounterId: z.string(),
      clinicId: z.string().nullable(),
      status: z.enum(prescriptionStatusEnum.enumValues),
      items: z.array(
        z.object({
          id: z.string(),
          drugId: z.string(),
          dosageValue: z.number(),
          dosageUnit: z.string(),
          frequency: z.string(),
        }),
      ),
      interactions: z.array(
        z.object({
          drug1: z.string().optional(),
          drug2: z.string().optional(),
          severity: z.enum(["moderate", "high"]),
          recommendation: z.string(),
        }),
      ),
      doseCalculations: z.array(
        z.object({
          drugId: z.string(),
          drugName: z.string().optional(),
          recommendedDose: z.number(),
          prescribedDose: z.number(),
        }),
      ),
      warnings: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context }) => {
    const prescriptionId = crypto.randomUUID();

    // Get patient details for dose calculation
    const patientData = await queries.patient.getPatientFullHistory(
      input.patientId,
      context.clinicId ?? "",
    );
    const growthRecordData = patientData?.growthRecords?.[0];

    let weight = 0;
    if (growthRecordData) {
      weight = growthRecordData.weight ?? 0;
    }

    if (!patientData) {
      throw new Error("Patient not found");
    }

    // Calculate patient age in days for dosing
    const patientAgeInDays = Math.floor(
      (Date.now() - new Date(patientData.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Check for drug interactions and allergies
    const drugIds = input.items.map((item) => item.drugId);
    const drugsData = await queries.prescription.getDrugsByIds(drugIds);

    const drugMap = new Map(drugsData.map((d) => [d.id, d]));

    // Check for potential interactions
    const interactions: Array<{
      drug1: string | undefined;
      drug2: string | undefined;
      severity: "moderate" | "high";
      recommendation: string;
    }> = [];
    for (let i = 0; i < input.items.length; i++) {
      for (let j = i + 1; j < input.items.length; j++) {
        const drug1 = drugMap.get(input.items[i]?.drugId ?? "");
        const drug2 = drugMap.get(input.items[j]?.drugId ?? "");
        if (
          drug1?.interactions?.includes(drug2?.name ?? "") ||
          drug2?.interactions?.includes(drug1?.name ?? "")
        ) {
          interactions.push({
            drug1: drug1?.name,
            drug2: drug2?.name,
            severity: "moderate",
            recommendation: "Monitor patient closely for adverse effects",
          });
        }
      }
    }

    // Calculate doses based on patient weight and age
    const calculatedDoses: Array<{
      drugId: string;
      drugName: string | undefined;
      prescribedDose: number;
      recommendedDose: number;
      difference: number;
      warning?: string;
    }> = [];
    for (const item of input.items) {
      const guidelines = await context.db.query.doseGuideline.findMany({
        where: {
          drugId: item.drugId,
          AND: [
            { postNatalAgeDaysMin: { lte: patientAgeInDays } },
            { postNatalAgeDaysMax: { gte: patientAgeInDays } },
          ],
        },
      });

      if (guidelines.length > 0 && weight) {
        const guideline = guidelines[0];
        const calculatedDose = (guideline?.minDosePerKg ?? 0) * weight;
        calculatedDoses.push({
          drugId: item.drugId,
          drugName: drugMap.get(item.drugId)?.name,
          prescribedDose: item.dosageValue,
          recommendedDose: calculatedDose,
          difference: item.dosageValue - calculatedDose,
          warning:
            Math.abs(item.dosageValue - calculatedDose) > calculatedDose * 0.2
              ? "Dose deviates significantly from recommended range"
              : undefined,
        });
      }
    }

    // Create prescription
    const newPrescription = await mutations.prescription.create({
      id: prescriptionId,
      medicalRecordId: input.medicalRecordId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      encounterId: input.encounterId,
      clinicId: context.clinicId ?? "",
      instructions: input.notes,
      endDate:
        input.validUntil ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create prescribed items
    const prescribedItems = await Promise.all(
      input.items.map(async (item) => {
        return await mutations.prescription.createPrescribedItems({
          id: crypto.randomUUID(),
          clinicId: context.clinicId ?? "",
          prescriptionId,
          drugId: item.drugId,
          dosageValue: item.dosageValue,
          dosageUnit: item.dosageUnit,
          frequency: item.frequency as Frequency,
          duration: item.duration,
          instructions: item.instructions ?? "",
          drugRoute: item.drugRoute,
        });
      }),
    );

    // Log prescription creation
    await mutations.prescription.createLog({
      id: generateId(),
      createdAt: new Date(),
      prescriptionId,
      action: "created",
      performedBy: context.user?.id ?? "system",
      details: JSON.stringify({ interactions, calculatedDoses }),
    });

    if (!newPrescription) {
      throw new Error("Failed to create prescription");
    }

    return {
      id: newPrescription.id,
      medicalRecordId: newPrescription.medicalRecordId,
      patientId: newPrescription.patientId,
      doctorId: newPrescription.doctorId,
      encounterId: newPrescription.encounterId,
      clinicId: newPrescription.clinicId,
      status: newPrescription.status,
      items: prescribedItems
        .filter((item): item is NonNullable<typeof item> => !!item)
        .map((item) => ({
          id: item.id,
          drugId: item.drugId,
          dosageValue: item.dosageValue,
          dosageUnit: item.dosageUnit,
          frequency: item.frequency,
        })),
      interactions,
      doseCalculations: calculatedDoses,
      warnings: calculatedDoses
        .map((d) => d.warning)
        .filter((w): w is string => !!w),
    };
  });

export const deletePrescription = protectedProcedure
  .input(
    z.object({
      prescriptionId: z.string(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    const prescription = await queries.prescription.getPrescriptionById(
      input.prescriptionId,
    );
    if (!prescription) {
      throw new Error("Prescription not found");
    }
    if (prescription.clinicId !== context.clinicId) {
      throw new Error("Unauthorized");
    }

    await mutations.prescription.delete(input.prescriptionId);
    return { success: true };
  });

// Get prescription by ID with full details
export const getPrescription = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.any())
  .handler(async ({ input, context }) => {
    const result = await queries.prescription.getPrescriptionById(input.id);

    if (!result || result.clinicId !== context.clinicId) {
      throw new Error("Prescription not found");
    }

    // Calculate adherence metrics
    const adherenceMetrics = calculateAdherenceMetrics(result.prescribedItems);

    return {
      ...result,
      adherenceMetrics,
      isExpired: result.endDate && new Date(result.endDate) < new Date(),
      daysRemaining: result.endDate
        ? Math.ceil(
            (new Date(result.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    };
  });

export const listPatientActivePrescriptions = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      includeExpired: z.boolean().default(false),
    }),
  )
  .output(z.array(z.any()))
  .handler(async ({ input, context }) => {
    const prescriptions =
      await queries.prescription.getPatientActivePrescriptions(
        input.patientId,
        context.clinicId ?? undefined,
        input.includeExpired,
      );

    return enhancePrescriptionsWithRefillStatus(prescriptions);
  });
// Helper to enhance prescriptions with refill status

// Helper to enhance prescriptions with refill status
function enhancePrescriptionsWithRefillStatus(
  prescriptions: PrescriptionWithRelations[],
): EnhancedPrescription[] {
  const now = Date.now();

  return prescriptions.map((prescription) => {
    return {
      ...prescription,
      items: prescription.prescribedItems.map((item) => {
        const refillsRemaining = item.refillsRemaining ?? 0;
        const daysSupply = calculateDaysSupply(item);
        const refillInterval = calculateRefillInterval(item);

        let isDueForRefill = false;
        if (refillsRemaining > 0) {
          if (item.lastRefillDate) {
            const lastRefillTime = new Date(item.lastRefillDate).getTime();
            isDueForRefill = lastRefillTime < now - refillInterval;
          } else {
            isDueForRefill = true;
          }
        }

        return {
          ...item,
          refillsRemaining,
          daysSupply,
          isDueForRefill,
        };
      }),
    };
  });
}

// FIXED: Single procedure for getting patient active prescriptions
export const getPatientActivePrescriptions = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      includeExpired: z.boolean().default(false),
    }),
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        medicalRecordId: z.string(),
        patientId: z.string(),
        doctorId: z.string().nullable(),
        encounterId: z.string(),
        clinicId: z.string().nullable(),
        status: z.string(),
        instructions: z.string().nullable(),
        issuedDate: z.date(),
        endDate: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        cancelledAt: z.date().nullable(),
        cancellationReason: z.string().nullable(),
        renewedFromId: z.string().nullable(),
        items: z.array(
          z.object({
            id: z.string(),
            prescriptionId: z.string(),
            drugId: z.string(),
            drug: z.any().optional(),
            dosageValue: z.number(),
            dosageUnit: z.string(),
            frequency: z.string(),
            duration: z.string().nullable(),
            instructions: z.string().nullable(),
            drugRoute: z.string().nullable(),
            refillsRemaining: z.number(),
            totalRefills: z.number().nullable(),
            lastRefillDate: z.date().nullable(),
            dispenses: z.array(z.any()).optional(),
            daysSupply: z.number(),
            isDueForRefill: z.boolean(),
          }),
        ),
      }),
    ),
  )
  .handler(async ({ input, context }) => {
    const prescriptions =
      await queries.prescription.getPatientActivePrescriptions(
        input.patientId,
        context.clinicId ?? undefined,
        input.includeExpired,
      );

    // If no prescriptions found, return empty array
    if (!prescriptions || prescriptions.length === 0) {
      return [];
    }

    return enhancePrescriptionsWithRefillStatus(prescriptions);
  });

// // Rest of your procedures remain the same...
// export const createPrescription = protectedProcedure
//   .input(
//     z.object({
//       medicalRecordId: z.string(),
//       patientId: z.string(),
//       doctorId: z.string(),
//       encounterId: z.string(),
//       items: z.array(PrescribedItemSchema),
//       notes: z.string().optional(),
//       validUntil: z.date().optional(),
//     }),
//   )
//   .output(
//     z.object({
//       id: z.string(),
//       medicalRecordId: z.string(),
//       patientId: z.string(),
//       doctorId: z.string().nullable(),
//       encounterId: z.string(),
//       clinicId: z.string().nullable(),
//       status: z.enum(prescriptionStatusEnum.enumValues),
//       items: z.array(z.any()),
//       interactions: z.array(z.any()),
//       doseCalculations: z.array(z.any()),
//       warnings: z.array(z.string()),
//     }),
//   )
//   .handler(async ({ input, context }) => {
//     // ... existing implementation
//     const prescriptionId = crypto.randomUUID();

//     // Get patient details for dose calculation
//     const patientData = await queries.patient.getPatientFullHistory(
//       input.patientId,
//       context.clinicId ?? "",
//     );
//     const growthRecordData = patientData?.growthRecords?.[0];

//     let weight = 0;
//     if (growthRecordData) {
//       weight = growthRecordData.weight ?? 0;
//     }

//     if (!patientData) {
//       throw new Error("Patient not found");
//     }

//     // Calculate patient age in days for dosing
//     const patientAgeInDays = Math.floor(
//       (Date.now() - new Date(patientData.dateOfBirth).getTime()) /
//         (1000 * 60 * 60 * 24),
//     );

//     // Check for drug interactions and allergies
//     const drugIds = input.items.map((item) => item.drugId);
//     const drugsData = await queries.prescription.getDrugsByIds(drugIds);

//     const drugMap = new Map(drugsData.map((d) => [d.id, d]));

//     // Check for potential interactions
//     const interactions: Array<{
//       drug1: string | undefined;
//       drug2: string | undefined;
//       severity: "moderate" | "high";
//       recommendation: string;
//     }> = [];
//     for (let i = 0; i < input.items.length; i++) {
//       for (let j = i + 1; j < input.items.length; j++) {
//         const drug1 = drugMap.get(input.items[i]?.drugId ?? "");
//         const drug2 = drugMap.get(input.items[j]?.drugId ?? "");
//         if (
//           drug1?.interactions?.includes(drug2?.name ?? "") ||
//           drug2?.interactions?.includes(drug1?.name ?? "")
//         ) {
//           interactions.push({
//             drug1: drug1?.name,
//             drug2: drug2?.name,
//             severity: "moderate",
//             recommendation: "Monitor patient closely for adverse effects",
//           });
//         }
//       }
//     }

//     // Calculate doses based on patient weight and age
//     const calculatedDoses: Array<{
//       drugId: string;
//       drugName: string | undefined;
//       prescribedDose: number;
//       recommendedDose: number;
//       difference: number;
//       warning?: string;
//     }> = [];
//     for (const item of input.items) {
//       const guidelines = await context.db.query.doseGuideline.findMany({
//         where: {
//           drugId: item.drugId,
//           AND: [
//             { postNatalAgeDaysMin: { lte: patientAgeInDays } },
//             { postNatalAgeDaysMax: { gte: patientAgeInDays } },
//           ],
//         },
//       });

//       if (guidelines.length > 0 && weight) {
//         const guideline = guidelines[0];
//         const calculatedDose = (guideline?.minDosePerKg ?? 0) * weight;
//         calculatedDoses.push({
//           drugId: item.drugId,
//           drugName: drugMap.get(item.drugId)?.name,
//           prescribedDose: item.dosageValue,
//           recommendedDose: calculatedDose,
//           difference: item.dosageValue - calculatedDose,
//           warning:
//             Math.abs(item.dosageValue - calculatedDose) > calculatedDose * 0.2
//               ? "Dose deviates significantly from recommended range"
//               : undefined,
//         });
//       }
//     }

//     // Create prescription
//     const newPrescription = await mutations.prescription.create({
//       id: prescriptionId,
//       medicalRecordId: input.medicalRecordId,
//       patientId: input.patientId,
//       doctorId: input.doctorId,
//       encounterId: input.encounterId,
//       clinicId: context.clinicId ?? "",
//       instructions: input.notes,
//       endDate:
//         input.validUntil ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
//       status: "active",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     // Create prescribed items
//     const prescribedItems = await Promise.all(
//       input.items.map(async (item) => {
//         return await mutations.prescription.createPrescribedItems({
//           id: crypto.randomUUID(),
//           clinicId: context.clinicId ?? "",
//           prescriptionId,
//           drugId: item.drugId,
//           dosageValue: item.dosageValue,
//           dosageUnit: item.dosageUnit,
//           frequency: item.frequency as Frequency,
//           duration: item.duration,
//           instructions: item.instructions ?? "",
//           drugRoute: item.drugRoute,
//         });
//       }),
//     );

//     // Log prescription creation
//     await mutations.prescription.createLog({
//       id: generateId(),
//       createdAt: new Date(),
//       prescriptionId,
//       action: "created",
//       performedBy: context.user?.id ?? "system",
//       details: JSON.stringify({ interactions, calculatedDoses }),
//     });

//     if (!newPrescription) {
//       throw new Error("Failed to create prescription");
//     }

//     return {
//       id: newPrescription.id,
//       medicalRecordId: newPrescription.medicalRecordId,
//       patientId: newPrescription.patientId,
//       doctorId: newPrescription.doctorId,
//       encounterId: newPrescription.encounterId,
//       clinicId: newPrescription.clinicId,
//       status: newPrescription.status,
//       items: prescribedItems.filter(Boolean),
//       interactions,
//       doseCalculations: calculatedDoses,
//       warnings: calculatedDoses
//         .map((d) => d.warning)
//         .filter((w): w is string => !!w),
//     };
//   });

// Renew prescription
export const renewPrescription = protectedProcedure
  .input(
    z.object({
      prescriptionId: z.string(),
      renewForDays: z.number().default(30),
      doctorNotes: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    // Get original prescription
    const originalPrescription =
      await queries.prescription.getPrescriptionWithItems(
        input.prescriptionId,
        context.clinicId ?? undefined,
      );

    if (!originalPrescription) {
      throw new Error("Prescription not found");
    }

    // Create renewal prescription
    const newPrescriptionId = crypto.randomUUID();
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + input.renewForDays);

    const newPrescription = await mutations.prescription.create({
      id: newPrescriptionId,
      medicalRecordId: originalPrescription.medicalRecordId,
      patientId: originalPrescription.patientId,
      doctorId: originalPrescription.doctorId,
      encounterId: originalPrescription.encounterId,
      clinicId: context.clinicId,
      instructions: `Renewal of prescription ${originalPrescription.id}. ${input.doctorNotes ?? ""}`,
      endDate: newValidUntil,
      status: "active",
      renewedFromId: originalPrescription.id,
    });

    if (!newPrescription) {
      throw new Error("Failed to create renewal prescription");
    }

    // Copy prescribed items with new refills
    const newItems = await Promise.all(
      originalPrescription.prescribedItems.map(async (item) => {
        const newItem = await mutations.prescription.createPrescribedItems({
          id: generateId(),
          clinicId: context.clinicId ?? "",
          prescriptionId: newPrescriptionId,
          drugId: item.drugId,
          dosageValue: item.dosageValue,
          dosageUnit: item.dosageUnit,
          frequency: item.frequency,
          duration: `${input.renewForDays} days`,
          instructions: item.instructions,
          drugRoute: item.drugRoute,
          refillsRemaining: item.totalRefills,
          totalRefills: item.totalRefills,
        });
        return newItem;
      }),
    );

    return {
      ...newPrescription,
      items: newItems,
      originalPrescriptionId: originalPrescription.id,
    };
  });

// Get medication adherence report
export const getMedicationAdherence = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const prescriptions =
      await queries.prescription.getPrescriptionsByDateRange(
        input.patientId,
        input.startDate,
        input.endDate,
      );

    const adherenceData: Array<{
      drugId: string;
      drugName: string | undefined;
      prescribedDosage: string;
      expectedDoses: number;
      adherenceRate: number;
      status: string;
      lastDispensed: Date | null | undefined;
      refillsRemaining: number | null;
    }> = [];
    for (const prescription of prescriptions) {
      for (const item of prescription.prescribedItems) {
        const expectedDoses = calculateExpectedDoses(
          item,
          prescription.issuedDate,
          prescription.endDate ?? new Date(),
        );

        const dispensedDoses =
          item.dispenses?.reduce(
            (sum, dispense) =>
              sum + dispense.quantityDispensed / (item.dosageValue || 1),
            0,
          ) || 0;

        const adherenceRate =
          expectedDoses > 0 ? (dispensedDoses / expectedDoses) * 100 : 0;

        adherenceData.push({
          drugId: item.drugId,
          drugName: item.drug?.name,
          prescribedDosage: `${item.dosageValue} ${item.dosageUnit} ${item.frequency}`,
          expectedDoses,
          adherenceRate,
          status: getAdherenceStatus(adherenceRate),
          lastDispensed: item.lastRefillDate,
          refillsRemaining: item.refillsRemaining,
        });
      }
    }

    // const overallAdherence =
    // adherenceData.reduce((sum, data) /=> sum + data.adherenceRate, 0) / adherenceData.length;

    return {
      patientId: input.patientId,
      period: { startDate: input.startDate, endDate: input.endDate },
      medications: adherenceData,
      // overallAdherence,
      // status: getAdherenceStatus(overallAdherence),
      recommendations: generateAdherenceRecommendations(adherenceData),
    };
  });

// Drug interaction checker
export const checkDrugInteractions = protectedProcedure
  .input(
    z.object({
      drugIds: z.array(z.string()),
      patientId: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ context, input }) => {
    const drugsData = await queries.prescription.getDrugsByIds(
      input.drugIds,
      context.clinicId ?? "",
    );

    const interactions: Array<{
      severity: "moderate" | "high";
      drugs: (string | null | undefined)[];
      description: string;
      recommendation: string;
    }> = [];
    const drugMap = new Map(drugsData.map((d) => [d.id, d]));

    // Check pairwise interactions
    for (let i = 0; i < input.drugIds.length; i++) {
      for (let j = i + 1; j < input.drugIds.length; j++) {
        const drug1 = drugMap.get(input.drugIds[i] ?? "");
        const drug2 = drugMap.get(input.drugIds[j] ?? "");

        if (
          drug1?.interactions?.includes(drug2?.name ?? "") ||
          drug2?.interactions?.includes(drug1?.name ?? "")
        ) {
          interactions.push({
            severity: "moderate",
            drugs: [drug1?.name, drug2?.name],
            description: `Potential interaction between ${drug1?.name} and ${drug2?.name}`,
            recommendation: "Monitor patient closely",
          });
        }
      }
    }

    // Check patient allergies if patientId provided
    let allergies: string[] = [];
    if (input.patientId) {
      const allergiesStr = await queries.prescription.getPatientAllergies(
        input.patientId,
      );

      if (allergiesStr) {
        allergies = allergiesStr.split(",").map((a) => a.trim());
        for (const drug of drugsData) {
          if (
            allergies.some(
              (allergy) =>
                drug.name?.toLowerCase().includes(allergy.toLowerCase()) ||
                drug.genericName?.toLowerCase().includes(allergy.toLowerCase()),
            )
          ) {
            interactions.push({
              severity: "high",
              drugs: [drug.name],
              description: `Patient has allergy to ${drug.name} or its class`,
              recommendation:
                "Do not prescribe - alternative medication required",
            });
          }
        }
      }
    }

    return {
      drugs: drugsData,
      interactions,
      hasSevereInteractions: interactions.some((i) => i.severity === "high"),
      recommendation:
        interactions.length === 0
          ? "No significant interactions detected"
          : "Consult drug interaction database before prescribing",
    };
  });
type Drug = DbDrug;

type ListDrugsResponse = {
  drugs: Drug[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

// List drugs with pagination and filtering
export const listDrugs = protectedProcedure
  .input(
    z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }),
  )
  .output(
    z.object({
      drugs: z.array(z.any()), // Replace z.any() with your actual Drug schema
      pagination: z.object({
        limit: z.number(),
        offset: z.number(),
        total: z.number(),
        hasMore: z.boolean(),
      }),
    }),
  )
  .handler(async ({ input }): Promise<ListDrugsResponse> => {
    const { search, category, limit, offset } = input;

    return await queries.prescription.listDrugs(
      search,
      category,
      limit,
      offset,
    );
  });

// Update prescription status
export const updatePrescription = protectedProcedure
  .input(
    z.object({
      prescriptionId: z.string(),
      status: z.enum([
        "active",
        "completed",
        "cancelled",
        "expired",
        "on_hold",
      ]),
      reason: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    const { prescriptionId, status, reason } = input;

    const updated = await mutations.prescription.update(prescriptionId, {
      status,
      updatedAt: new Date(),
      ...(status === "cancelled" && {
        cancelledAt: new Date(),
        cancellationReason: reason,
      }),
    });

    // Log status change
    await mutations.prescription.createLog({
      id: crypto.randomUUID(),
      prescriptionId,
      action: `status_changed_to_${status}`,
      performedBy: context.user?.id ?? "system",
      details: reason ?? "",
      createdAt: new Date(),
    });

    return updated ?? undefined;
  });

// Get prescription analytics
export const getPrescriptionAnalytics = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      groupBy: z.enum(["doctor", "drug", "month"]).default("month"),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const prescriptions =
      await queries.prescription.getPrescriptionsForAnalytics(
        input.clinicId,
        input.startDate,
        input.endDate,
      );

    let analytics: unknown = null;

    switch (input.groupBy) {
      case "doctor":
        analytics = groupByDoctor(prescriptions);
        break;
      case "drug":
        analytics = groupByDrug(prescriptions);
        break;
      case "month":
        analytics = groupByMonth(prescriptions);
        break;
      default:
        analytics = {};
        break;
    }

    return {
      period: { startDate: input.startDate, endDate: input.endDate },
      totalPrescriptions: prescriptions.length,
      totalItems: prescriptions.reduce(
        (sum: number, p) => sum + p.prescribedItems.length,
        0,
      ),
      activePrescriptions: prescriptions.filter((p) => p.status === "active")
        .length,
      completionRate:
        (prescriptions.filter((p) => p.status === "completed").length /
          prescriptions.length) *
        100,
      analytics,
    };
  });
export const dispenseMedication = protectedProcedure
  .input(
    z.object({
      prescribedItemId: z.string(),
      quantity: z.number().min(1),
      notes: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input, context }) => {
    const { prescribedItemId, quantity, notes } = input;

    // 1. Get the prescribed item to check refills
    const item = await context.db.query.prescribedItem.findFirst({
      where: { id: prescribedItemId },
      with: {
        prescription: true,
        dispenses: true,
      },
    });

    if (!item) throw new Error("Prescribed item not found");
    if (item.refillsRemaining !== null && item.refillsRemaining <= 0) {
      throw new Error("No refills remaining for this medication");
    }

    // 2. Create the dispense record
    const dispense = await mutations.prescription.createDispense({
      id: generateId(),
      prescriptionId: item.prescriptionId,
      prescribedItemId,
      quantityDispensed: quantity,
      dispensedAt: new Date(),
      dispensedBy: context.user?.id ?? "system",
      notes: notes ?? "",
    });

    // 3. Decrement refills remaining
    await mutations.prescription.updatePrescribedItems(prescribedItemId, {
      refillsRemaining: item.refillsRemaining ? item.refillsRemaining - 1 : 0,
      lastRefillDate: new Date(),
    });

    return { success: true, dispense };
  });

export const prescriptionRouter = o.router({
  list: listPatientActivePrescriptions,
  create: createPrescription,
  get: getPrescription,
  getPatientActivePrescriptions,
  dispenseMedication,
  delete: deletePrescription,
  renew: renewPrescription,
  getMedicationAdherence,
  checkDrugInteractions,
  listDrugs,
  update: updatePrescription,
  getPrescriptionAnalytics,
});
