// orpc/router/encounter.ts

import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { statusEnum } from "@clinic-app/db/schema/clinic";
import {
  DiagnosisCreateSchema,
  DiagnosisSchema,
  DiagnosisUpdateSchema,
} from "@clinic-app/db/zod";
import { z } from "zod";
import { o, protectedProcedure } from "../index";

const CompleteEncounterSchema = z.object({
  encounterId: z.string(),
  diagnosis: z.string(),
  treatment: z.string(),
  medications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
      }),
    )
    .optional(),
  followUpDate: z.date().optional(),
  notes: z.string().optional(),
});

const AddPrescriptionSchema = z.object({
  encounterId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  medicationName: z.string(),
  instructions: z.string(),
  issuedDate: z.date(),
  endDate: z.date().optional(),
  status: z.string().default("active"),
});

const AddVitalSignsSchema = z.object({
  encounterId: z.string(),
  patientId: z.string(),
  medicalId: z.string(),
  bodyTemperature: z.number().optional(),
  systolic: z.number().optional(),
  diastolic: z.number().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  notes: z.string().optional(),
  ageDays: z.number().optional(),
  ageMonths: z.number().optional(),
});

const ListEncountersSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  status: z.enum(statusEnum.enumValues).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  searchTerm: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Create a new encounter
export const createEncounter = protectedProcedure
  .input(DiagnosisCreateSchema)
  .output(DiagnosisSchema)
  .handler(async ({ input, context }) => {
    const clinicId = input.clinicId ?? context.clinicId ?? "";

    const result = await mutations.medicalRecord.create({
      id: crypto.randomUUID(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      clinicId,
      appointmentId: input.appointmentId ?? "",
      diagnosis: input.diagnosis ?? "",
      symptoms: input.symptoms ?? "",
      treatmentPlan: input.treatment ?? "",
    });

    const record = await queries.encounter.getEncounterById(
      typeof result?.diagnosis === "object" &&
        result.diagnosis !== null &&
        "id" in result.diagnosis
        ? (result.diagnosis as { id: string }).id
        : typeof result?.diagnosis === "string"
          ? result.diagnosis
          : "",
      clinicId,
    );
    if (!record) {
      throw new Error("Failed to create encounter");
    }
    return record;
  });

// Update an encounter
export const updateEncounter = protectedProcedure
  .input(DiagnosisUpdateSchema)
  .output(DiagnosisSchema)
  .handler(async ({ input, context }) => {
    if (!input.id) {
      throw new Error("Encounter ID is required for update");
    }

    const updated = await mutations.diagnosis.update(input.id, {
      ...input,
      clinicId: context.clinicId,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new Error("Encounter not found");
    }

    return updated;
  });

// Complete an encounter with full medical details
export const completeEncounter = protectedProcedure
  .input(CompleteEncounterSchema)
  .output(z.object({ success: z.boolean(), encounter: DiagnosisSchema }))
  .handler(async ({ input, context }) => {
    const encounter = await mutations.diagnosis.update(input.encounterId, {
      diagnosis: input.diagnosis,
      clinicId: context.clinicId,
      treatment: input.treatment,
      notes: input.notes,
      followUpPlan: input.followUpDate
        ? `Follow up on ${input.followUpDate.toISOString()}`
        : null,
      prescribedMedications: input.medications
        ? JSON.stringify(input.medications)
        : null,
      status: "COMPLETED",
      updatedAt: new Date(),
    });

    if (!encounter) {
      throw new Error("Encounter not found");
    }

    // Update related medical record
    if (encounter.medicalId) {
      await mutations.medicalRecord.update(encounter.medicalId, {
        diagnosis: input.diagnosis,
        treatmentPlan: input.treatment,
        status: "COMPLETED",
      });
    }

    return { success: true, encounter };
  });

// Add prescription to encounter
export const addPrescription = protectedProcedure
  .input(AddPrescriptionSchema)
  .output(z.object({ id: z.string(), success: z.boolean() }))
  .handler(async ({ input, context }) => {
    const prescriptionRecord = await mutations.prescription.create({
      medicalRecordId: input.encounterId,
      doctorId: input.doctorId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      medicationName: input.medicationName,
      instructions: input.instructions,
      issuedDate: input.issuedDate,
      endDate: input.endDate ?? undefined,
      status: input.status as
        | "active"
        | "completed"
        | "cancelled"
        | "expired"
        | "on_hold",
      clinicId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      id: crypto.randomUUID(),
    });

    // Update encounter with prescribed medications
    const encounter = await queries.encounter.getEncounterById(
      input.encounterId,
      context.clinicId ?? "",
    );

    if (encounter) {
      const existingMeds = encounter.prescribedMedications
        ? JSON.parse(encounter.prescribedMedications)
        : [];
      const newMeds = [
        ...existingMeds,
        { name: input.medicationName, instructions: input.instructions },
      ];
      await mutations.diagnosis.update(input.encounterId, {
        prescribedMedications: JSON.stringify(newMeds),
      });
    }

    return { id: prescriptionRecord?.id ?? "", success: true };
  });

// Add vital signs to encounter
export const addVitalSigns = protectedProcedure
  .input(AddVitalSignsSchema)
  .output(z.object({ id: z.string(), success: z.boolean() }))
  .handler(async ({ input, context }) => {
    const vital = await mutations.vitalSign.create({
      id: crypto.randomUUID(),
      clinicId: context.clinicId ?? "",
      patientId: input.patientId,
      medicalId: input.medicalId,
      encounterId: input.encounterId,
      recordedAt: new Date(),
      bodyTemperature: input.bodyTemperature ?? null,
      systolic: input.systolic ?? null,
      diastolic: input.diastolic ?? null,
      heartRate: input.heartRate ?? null,
      respiratoryRate: input.respiratoryRate ?? null,
      oxygenSaturation: input.oxygenSaturation ?? null,
      notes: input.notes ?? null,
      ageDays: input.ageDays ?? null,
      ageMonths: input.ageMonths ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: vital?.id ?? "", success: true };
  });

// Get encounter by ID with full details
export const getEncounter = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(
    DiagnosisSchema.extend({
      patient: z
        .object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          dateOfBirth: z.date(),
          gender: z.string().nullable(),
          phone: z.string().nullable().optional(),
          email: z.string().nullable().optional(),
        })
        .optional(),
      doctor: z
        .object({
          id: z.string(),
          name: z.string(),
          specialty: z.string(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable(),
        })
        .optional(),
      appointment: z
        .object({
          id: z.string(),
          appointmentDate: z.date(),
          type: z.string(),
          status: z.string(),
        })
        .optional(),
      prescriptions: z
        .array(
          z.object({
            id: z.string(),
            medicationName: z.string().nullable(),
            instructions: z.string().nullable(),
            issuedDate: z.date(),
            status: z.string(),
          }),
        )
        .optional(),
      vitalSigns: z
        .array(
          z.object({
            id: z.string(),
            bodyTemperature: z.number().nullable(),
            systolic: z.number().nullable(),
            diastolic: z.number().nullable(),
            heartRate: z.number().nullable(),
            respiratoryRate: z.number().nullable(),
            oxygenSaturation: z.number().nullable(),
            recordedAt: z.date(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const encounter = await queries.encounter.getEncounterById(
      input.id,
      context.clinicId ?? "",
    );

    if (!encounter) {
      throw new Error("Encounter not found");
    }

    return {
      ...encounter,
      appointment: encounter.appointment
        ? {
            ...encounter.appointment,
            status: encounter.appointment.status ?? "PENDING",
          }
        : undefined,
      patient: encounter.patient ?? undefined,
      doctor: encounter.doctor ?? undefined,
      prescriptions: encounter.prescriptions.map((p) => {
        return {
          ...p,
          status: p.status ?? "active",
        };
      }),
      vitalSigns: encounter.medical?.vitalSigns ?? [],
      type: encounter.type ?? null,
    };
  });

// List encounters with filtering and pagination
export const listEncounters = protectedProcedure
  .input(ListEncountersSchema)
  .output(
    z.object({
      encounters: z.array(
        DiagnosisSchema.extend({
          patientName: z.string().optional(),
          doctorName: z.string().optional(),
        }),
      ),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const encounters = await queries.encounter.getPatientEncounters(
      input.patientId ?? "",
      context.clinicId ?? "",
    );
    const total = encounters.length;

    const encountersWithNames = encounters.map((encounter) => {
      return {
        ...encounter,
        patientName: encounter.patient
          ? `${encounter.patient.firstName} ${encounter.patient.lastName}`
          : undefined,
        doctorName: encounter.doctor?.name,
      };
    });

    return {
      encounters: encountersWithNames,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize),
    };
  });

// Delete encounter (soft delete)
export const deleteEncounter = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }) => {
    await mutations.diagnosis.softDelete(input.id, context.clinicId ?? "");

    return { success: true };
  });

// Get encounters by date range
export const getEncountersByDateRange = protectedProcedure
  .input(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
      doctorId: z.string().optional(),
      clinicId: z.string().optional(),
    }),
  )
  .output(z.array(DiagnosisSchema))
  .handler(async ({ input, context }) => {
    const appointments = await queries.search.advancedSearch({
      clinicId: context.clinicId ?? "",
      dateFrom: input.startDate,
      dateTo: input.endDate,
      doctorName: input.doctorId, // advancedSearch uses doctorName, but we filter by ID if needed
    });

    // Fetch the actual diagnosis/encounter records for these appointments
    const encounterIds = appointments.map((a) => a.id);
    if (encounterIds.length === 0) return [];

    const encounters = await context.db.query.diagnosis.findMany({
      where: {
        clinicId: context.clinicId ?? "",
        isDeleted: false,
        appointmentId: { in: encounterIds },
        ...(input.doctorId && { doctorId: input.doctorId }),
      },
      orderBy: {
        date: "desc",
      },
    });

    return encounters;
  });

// Get encounter statistics
export const getEncounterStats = protectedProcedure
  .input(
    z.object({
      clinicId: z.string().optional(),
      doctorId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .output(
    z.object({
      totalEncounters: z.number(),
      activeEncounters: z.number(),
      completedEncounters: z.number(),
      avgPerDay: z.number(),
      topDiagnosis: z.array(
        z.object({
          diagnosis: z.string(),
          count: z.number(),
        }),
      ),
      encountersByType: z.array(
        z.object({
          type: z.string(),
          count: z.number(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    const allEncounters = await context.db.query.diagnosis.findMany({
      where: {
        clinicId: input.clinicId ?? context.clinicId ?? "",
        isDeleted: false,
        ...(input.doctorId && { doctorId: input.doctorId }),
      },
    });

    const totalEncounters = allEncounters.length;
    const activeEncounters = allEncounters.filter(
      (e) => e.status === "ACTIVE",
    ).length;
    const completedEncounters = allEncounters.filter(
      (e) => e.status === "COMPLETED",
    ).length;

    // Calculate average per day
    const dates = allEncounters.map((e) => e.date.toDateString());
    const uniqueDates = new Set(dates);
    const avgPerDay =
      uniqueDates.size > 0 ? totalEncounters / uniqueDates.size : 0;

    // Get top diagnoses
    const diagnosisCounts = new Map<string, number>();
    for (const encounter of allEncounters) {
      if (encounter.diagnosis) {
        diagnosisCounts.set(
          encounter.diagnosis,
          (diagnosisCounts.get(encounter.diagnosis) ?? 0) + 1,
        );
      }
    }
    const topDiagnosis = Array.from(diagnosisCounts.entries())
      .map(([diagnosis, count]) => {
        return { diagnosis, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get encounters by type
    const typeCounts = new Map<string, number>();
    for (const diagnosis of allEncounters) {
      typeCounts.set(
        diagnosis.type ?? "",
        (typeCounts.get(diagnosis.type ?? "") ?? 0) + 1,
      );
    }
    const encountersByType = Array.from(typeCounts.entries()).map(
      ([type, count]) => {
        return {
          type,
          count,
        };
      },
    );

    return {
      totalEncounters,
      activeEncounters,
      completedEncounters,
      avgPerDay,
      topDiagnosis,
      encountersByType,
    };
  });

export const encounterRouter = o.router({
  create: createEncounter,
  update: updateEncounter,
  complete: completeEncounter,
  addPrescription,
  addVitalSigns,
  get: getEncounter,
  list: listEncounters,
  delete: deleteEncounter,
  getEncountersByDateRange,
  getEncounterStats,
});
