// orpc/router/medical-record.router.ts

import { mutations } from "@clinic-app/db/mutations";
import { encounterQueries, queries } from "@clinic-app/db/queries";
import { appointmentStatusEnum } from "@clinic-app/db/schema/index";
import {
  DiagnosisCreateSchema,
  DiagnosisSchema,
  GrowthRecordSchema,
  MedicalRecordCreateSchema,
  MedicalRecordSchema,
  MedicalRecordUpdateSchema,
  VitalSignSchema,
} from "@clinic-app/db/zod";
import { generateId } from "@clinic-app/utils";
import { z } from "zod";
import { adminProcedure, o, protectedProcedure } from "../index";

const VitalSignsCreateSchema = VitalSignSchema.omit({
  id: true,
});
export const medicalRecordProcedures = {
  completeEncounter: adminProcedure
    .input(
      z.object({
        medicalRecordId: z.string(),
        diagnosisId: z.string().optional(),
        notes: z.string().optional(),
        followUpDate: z.date().optional(),
        prescribedMedications: z
          .array(
            z.object({
              drugId: z.string(),
              dosageValue: z.number(),
              dosageUnit: z.string(),
              frequency: z.enum([
                "ONCE_DAILY",
                "TWICE_DAILY",
                "THREE_TIMES_DAILY",
                "FOUR_TIMES_DAILY",
                "EVERY_OTHER_DAY",
                "WEEKLY",
                "MONTHLY",
                "AS_NEEDED",
              ]),
              duration: z.string(),
              instructions: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .handler(async ({ input }) => {
      return await mutations.medicalRecord.completeEncounter({
        medicalRecordId: input.medicalRecordId,
        diagnosisId: input.diagnosisId,
        notes: input.notes,
        followUpDate: input.followUpDate,
        prescribedMedications: input.prescribedMedications?.map((m) => ({
          ...m,
          frequency: m.frequency,
        })),
      });
    }),

  addVitalSignsToMedicalRecord: adminProcedure
    .input(
      z.object({
        medicalRecordId: z.string(),
        vitalSigns: z.object({
          patientId: z.string(),
          clinicId: z.string().optional(),
          temperature: z.number().optional(),
          bloodPressureSystolic: z.number().optional(),
          bloodPressureDiastolic: z.number().optional(),
          heartRate: z.number().optional(),
          respiratoryRate: z.number().optional(),
          oxygenSaturation: z.number().min(0).max(100).optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
        }),
      }),
    )
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await mutations.medicalRecord.addVitalSigns(
        input.medicalRecordId,
        {
          ...input.vitalSigns,
          clinicId,
        },
      );
    }),
} as const;

// ================ MEDICAL RECORD PROCEDURES ================

// Create complete medical record with diagnosis and vitals
export const createMedicalRecord = protectedProcedure
  .input(
    z.object({
      record: MedicalRecordCreateSchema,
      diagnosis: DiagnosisCreateSchema.optional(),
      vitals: VitalSignsCreateSchema.optional(),
    }),
  )
  .output(MedicalRecordSchema)
  .handler(async ({ input, context }) => {
    const recordId = generateId();

    // Create medical record
    const record = await mutations.medicalRecord.create({
      id: recordId,
      clinicId: context.clinicId ?? "",
      doctorId: input.record.doctorId,
      patientId: input.record.patientId,
      appointmentId: input.record.appointmentId,
      diagnosisDate: input.record.diagnosisDate,
    });

    // Create diagnosis if provided
    if (input.diagnosis) {
      await mutations.diagnosis.create({
        id: generateId(),
        medicalId: recordId,
        patientId: input.record.patientId,
        doctorId: input.diagnosis.doctorId ?? "",
        appointmentId: input.record.appointmentId,
        symptoms: input.diagnosis.symptoms,
        diagnosis: input.diagnosis.diagnosis,
        treatment: input.diagnosis.treatment,
        type: input.diagnosis.type,
        notes: input.diagnosis.notes,
        prescribedMedications: input.diagnosis.prescribedMedications,
        followUpPlan: input.diagnosis.followUpPlan,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create vitals if provided
    if (input.vitals) {
      await mutations.vitalSign.create({
        id: generateId(),
        medicalId: recordId,
        patientId: input.vitals.patientId,
        encounterId: input.vitals.encounterId,
        bodyTemperature: input.vitals.bodyTemperature,
        systolic: input.vitals.systolic,
        diastolic: input.vitals.diastolic,
        heartRate: input.vitals.heartRate,
        respiratoryRate: input.vitals.respiratoryRate,
        oxygenSaturation: input.vitals.oxygenSaturation,
        gender: input.vitals.gender,
        notes: input.vitals.notes,
        ageDays: input.vitals.ageDays,
        ageMonths: input.vitals.ageMonths,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (!record) {
      throw new Error("Failed to create medical record");
    }

    return record as z.infer<typeof MedicalRecordSchema>;
  });

// Get medical record by ID with full relations
export const getMedicalRecordById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(
    MedicalRecordSchema.extend({
      patient: z
        .object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          dateOfBirth: z.date(),
          gender: z.string().nullable(),
          mrn: z.string().nullable(),
        })
        .nullable(),
      doctor: z
        .object({
          id: z.string(),
          name: z.string(),
          specialty: z.string(),
        })
        .nullable(),
      appointment: z
        .object({
          id: z.string(),
          appointmentDate: z.date(),
          status: z.enum(appointmentStatusEnum.enumValues).nullable(),
        })
        .nullable(),
      encounter: z.array(DiagnosisSchema).nullable(),
      vitalSigns: z.array(VitalSignSchema).nullable(),
      prescriptions: z.array(z.any()).nullable(),
    }),
  )
  .handler(async ({ input, context }) => {
    const record = await queries.medicalRecord.getById(
      input.id,
      context.clinicId ?? "",
    );

    if (!record) {
      throw new Error("Medical record not found");
    }

    return {
      ...record,
      encounter: (record.encounters ?? []).map((e) => {
        return {
          ...e,
          type: e.type ?? null,
          diagnosis: e.diagnosis ?? null,
          treatment: e.treatment ?? null,
        };
      }),
    };
  });

// Get patient medical history (using only queries from queries.ts)
export const getPatientMedicalHistory = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      limit: z.number().default(20),
      offset: z.number().default(0),
      includeDeleted: z.boolean().default(false),
    }),
  )
  .output(
    z.object({
      records: z.array(
        MedicalRecordSchema.extend({
          doctor: z
            .object({
              id: z.string(),
              name: z.string(),
              specialty: z.string(),
            })
            .nullable(),
          appointment: z
            .object({
              id: z.string(),
              appointmentDate: z.date(),
            })
            .nullable(),
          diagnosisCount: z.number(),
          vitalSignsCount: z.number(),
        }),
      ),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { patientId, limit, offset, includeDeleted } = input;

    // Use the patient query to get full history
    const patientHistory = await queries.patient.getPatientFullHistory(
      patientId,
      context.clinicId ?? "",
    );

    if (!patientHistory) {
      return { records: [], total: 0, hasMore: false };
    }

    // Filter medical records based on includeDeleted flag
    const filteredRecords = includeDeleted
      ? patientHistory.medicalRecords
      : patientHistory.medicalRecords.filter((record) => !record.isDeleted);

    // Apply pagination
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);

    // Enrich records with counts
    const enrichedRecords = paginatedRecords.map((record) => ({
      ...record,
      diagnosisCount: record.encounters?.length || 0,
      vitalSignsCount: record.vitalSigns?.length || 0,
      doctor: record.doctor
        ? {
            id: record.doctor.id,
            name: record.doctor.name,
            specialty: record.doctor.specialty,
          }
        : null,
      appointment: record.appointment
        ? {
            id: record.appointment.id,
            appointmentDate: record.appointment.appointmentDate,
          }
        : null,
    }));

    const total = filteredRecords.length;
    const hasMore = offset + limit < total;

    return { records: enrichedRecords, total, hasMore };
  });
// Update medical record
export const updateMedicalRecord = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: MedicalRecordUpdateSchema,
    }),
  )
  .output(MedicalRecordSchema)
  .handler(async ({ input }) => {
    const updated = await mutations.medicalRecord.update(input.id, input.data);

    if (!updated) {
      throw new Error("Medical record not found");
    }

    return updated;
  });

// Delete (soft delete) medical record
export const deleteMedicalRecord = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean(), id: z.string() }))
  .handler(async ({ input }) => {
    await mutations.medicalRecord.softDelete(input.id);
    return { success: true, id: input.id };
  });

// ================ DIAGNOSIS PROCEDURES ================

// Get diagnosis by medical record ID
export const getDiagnosesByMedicalRecord = protectedProcedure
  .input(z.object({ medicalId: z.string() }))
  .output(z.array(DiagnosisSchema))
  .handler(async ({ input }) => {
    const diagnoses = await encounterQueries.getDiagnosesByMedicalRecordId({
      medicalId: input.medicalId ?? "",
    });

    return diagnoses;
  });

// Create diagnosis for medical record
export const createDiagnosis = protectedProcedure
  .input(DiagnosisSchema.omit({ id: true }))
  .output(DiagnosisSchema)
  .handler(async ({ input }) => {
    const diagnosisRecord = await mutations.diagnosis.create({
      id: generateId(),
      ...input,
    });

    if (!diagnosisRecord) {
      throw new Error("Failed to create diagnosis");
    }

    return diagnosisRecord as z.infer<typeof DiagnosisSchema>;
  });

// Update diagnosis
export const updateDiagnosis = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: DiagnosisCreateSchema.partial(),
    }),
  )
  .output(DiagnosisSchema)
  .handler(async ({ input }) => {
    const updated = await mutations.diagnosis.update(input.id, input.data);

    if (!updated) {
      throw new Error("Diagnosis not found");
    }

    return updated;
  });

// ================ VITAL SIGNS PROCEDURES ================

// Get vital signs by medical record ID
export const getVitalSignsByMedicalRecord = protectedProcedure
  .input(z.object({ medicalId: z.string() }))
  .output(z.array(VitalSignSchema))
  .handler(async ({ input }) => {
    const vitals = await queries.vitalSign.getByMedicalRecord(input.medicalId);

    return vitals as z.infer<typeof VitalSignSchema>[];
  });

// Create vital sign record
export const createVitalSign = protectedProcedure
  .input(VitalSignsCreateSchema)
  .output(VitalSignSchema)
  .handler(async ({ input }) => {
    const vital = await mutations.vitalSign.create({
      id: generateId(),
      ...input,
      recordedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!vital) {
      throw new Error("Failed to create medical record");
    }

    return vital as z.infer<typeof VitalSignSchema>;
  });

// Get latest vital signs for a patient
export const getLatestVitalSigns = protectedProcedure
  .input(z.object({ patientId: z.string(), limit: z.number().default(5) }))
  .output(z.array(VitalSignSchema))
  .handler(async ({ input, context }) => {
    const vitals = await queries.vitalSign.list({
      patientId: input.patientId,
      clinicId: context.clinicId ?? "",
      pageSize: input.limit,
    });
    return vitals;
  });
export const listMedicalRecords = protectedProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().default(0),
      patientId: z.string().optional(),
      doctorId: z.string().optional(),
      clinicId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      records: z.array(
        MedicalRecordSchema.extend({
          patient: z
            .object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string().nullable(),
            })
            .nullable(),
          doctor: z
            .object({
              id: z.string(),
              name: z.string(),
            })
            .nullable(),
        }),
      ),
      total: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { limit, offset, patientId, doctorId } = input;
    const clinicId = context.clinicId ?? "";

    const records = await queries.medicalRecord.list(
      patientId,
      doctorId,
      clinicId,
      limit,
      offset,
    );

    const total = await queries.medicalRecord.count(
      clinicId,
      patientId,
      doctorId,
    );

    const formattedRecords = records.map((record) => ({
      ...record,
      patient: record.patient
        ? {
            id: record.patient.id,
            firstName: record.patient.firstName,
            lastName: record.patient.lastName ?? null,
          }
        : null,
      doctor: record.doctor
        ? {
            id: record.doctor.id,
            name: record.doctor.name,
          }
        : null,
    }));

    return {
      records: formattedRecords,
      total,
    };
  });
// ================ COMPLETE MEDICAL ENCOUNTER ================

// Create a complete medical encounter (record + diagnosis + vitals)
export const createCompleteEncounter = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      appointmentId: z.string(),
      doctorId: z.string(),
      diagnosis: z.object({
        symptoms: z.string(),
        diagnosis: z.string().optional(),
        treatment: z.string().optional(),
        type: z.string().optional(),
        prescribedMedications: z.string().optional(),
        followUpPlan: z.string().optional(),
      }),
      vitals: z
        .object({
          bodyTemperature: z.number().optional(),
          systolic: z.number().optional(),
          diastolic: z.number().optional(),
          heartRate: z.number().optional(),
          respiratoryRate: z.number().optional(),
          oxygenSaturation: z.number().optional(),
          notes: z.string().optional(),
        })
        .optional(),
      medicalRecord: z
        .object({
          notes: z.string().optional(),
          treatmentPlan: z.string().optional(),
          labRequest: z.string().optional(),
          medications: z.string().optional(),
          followUpDate: z.date().optional(),
        })
        .optional(),
      growth: z
        .object({
          weight: z.number().optional(),
          height: z.number().optional(),
          headCircumference: z.number().optional(),
          notes: z.string().optional(),
        })
        .optional(),
    }),
  )
  .output(
    z.object({
      medicalRecord: MedicalRecordSchema,
      diagnosis: DiagnosisSchema,
      vitalSigns: VitalSignSchema.optional(),
      growthRecord: GrowthRecordSchema.optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const recordId = generateId();
    const clinicId = context.clinicId ?? "";

    if (!clinicId) {
      throw new Error("Clinic ID is required - not authenticated to a clinic");
    }

    // Update appointment status to completed
    await mutations.appointment.update(input.appointmentId, {
      status: "COMPLETED",
    });
    // Create medical record
    const record = await mutations.medicalRecord.create({
      id: recordId,
      clinicId,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      doctorId: input.doctorId,
      notes: input.medicalRecord?.notes,
      treatmentPlan: input.medicalRecord?.treatmentPlan,
      labRequest: input.medicalRecord?.labRequest,
      medications: input.medicalRecord?.medications,
      followUpDate: input.medicalRecord?.followUpDate,
      diagnosisDate: new Date(),
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create diagnosis
    const diagnosisRecord = await mutations.diagnosis.create({
      medicalId: recordId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentId: input.appointmentId,
      symptoms: input.diagnosis.symptoms,
      diagnosis: input.diagnosis.diagnosis,
      treatment: input.diagnosis.treatment,
      type: input.diagnosis.type,
      prescribedMedications: input.diagnosis.prescribedMedications,
      followUpPlan: input.diagnosis.followUpPlan,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      id: "",
    });

    if (!(record && diagnosisRecord)) {
      throw new Error("Failed to create encounter records");
    }

    let vitalRecord: z.infer<typeof VitalSignSchema> | undefined;

    // Create vitals if provided
    if (input.vitals) {
      const vital = await mutations.vitalSign.create({
        id: generateId(),
        medicalId: recordId,
        patientId: input.patientId,
        encounterId: diagnosisRecord.id,
        bodyTemperature: input.vitals.bodyTemperature,
        systolic: input.vitals.systolic,
        diastolic: input.vitals.diastolic,
        heartRate: input.vitals.heartRate,
        respiratoryRate: input.vitals.respiratoryRate,
        oxygenSaturation: input.vitals.oxygenSaturation,
        notes: input.vitals.notes,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vitalRecord = vital;
    }

    let growth: z.infer<typeof GrowthRecordSchema> | undefined;

    // Create growth record if provided
    if (input.growth) {
      const newGrowth = await mutations.growth.recordWithPercentiles({
        patientId: input.patientId,
        weight: input.growth.weight,
        height: input.growth.height,
        headCircumference: input.growth.headCircumference,
        notes: input.growth.notes,
        date: new Date(),
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      growth = newGrowth;
    }

    return {
      medicalRecord: record,
      diagnosis: diagnosisRecord,
      vitalSigns: vitalRecord,
      growthRecord: growth,
    };
  });

export const medicalRecordRouter = o.router({
  list: listMedicalRecords,
  create: createMedicalRecord,
  getById: getMedicalRecordById,
  getPatientHistory: getPatientMedicalHistory,
  update: updateMedicalRecord,
  delete: deleteMedicalRecord,
  getDiagnoses: getDiagnosesByMedicalRecord,
  createDiagnosis,
  updateDiagnosis,
  getVitalSigns: getVitalSignsByMedicalRecord,
  createVitalSign,
  getLatestVitalSigns,
  createCompleteEncounter,
});
