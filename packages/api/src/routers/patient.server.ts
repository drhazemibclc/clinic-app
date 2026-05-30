// routes/demo/patient-router.ts

import { patientQueries, userQueries } from "@clinic-app/db/actions/queries";
import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { statusEnum } from "@clinic-app/db/schema/clinic";
import * as schema from "@clinic-app/db/schema/index";
import {
  GuardianSchema,
  PatientCreateSchema,
  PatientSchema,
  PatientUpdateSchema,
} from "@clinic-app/db/zod/clinic.schema";
import { z } from "zod";
import { adminProcedure, clinicProcedure, protectedProcedure } from "../index";
import { NeonatalAssessmentSchema, PatientWithRelationsSchema } from "../types";

// ============================================================================
// Patient Procedures
// ============================================================================
export const patientProcedures = {
  getPatientFullHistory: clinicProcedure
    .input(z.object({ patientId: z.string() }))
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await patientQueries.getPatientFullHistory(
        input.patientId,
        clinicId,
      );
    }),

  getPatientUpcomingAppointments: clinicProcedure
    .input(z.object({ patientId: z.string() }))
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await patientQueries.getPatientUpcomingAppointments(
        input.patientId,
        clinicId,
      );
    }),

  getPatientGrowthData: clinicProcedure
    .input(z.object({ patientId: z.string() }))
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await patientQueries.getPatientGrowthData(
        input.patientId,
        clinicId,
      );
    }),

  getPatientsByAgeRange: adminProcedure
    .input(
      z.object({
        minAgeMonths: z.number().min(0),
        maxAgeMonths: z.number().positive(),
      }),
    )
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await userQueries.getPatientsByAgeRange(
        clinicId,
        input.minAgeMonths,
        input.maxAgeMonths,
      );
    }),

  getPatientsWithAppointmentsThisWeek: adminProcedure.handler(
    async ({ context }) => {
      const clinicId = context.clinicId ?? "";
      return await userQueries.getPatientsWithAppointmentsThisWeek(clinicId);
    },
  ),

  createPatientWithGuardian: adminProcedure
    .input(
      z.object({
        patientData: PatientSchema,
        guardianData: GuardianSchema,
      }),
    )
    .handler(async ({ input }) => {
      return await mutations.patient.createWithGuardian(
        input.patientData,
        input.guardianData,
      );
    }),

  bulkUpdatePatientStatus: adminProcedure
    .input(
      z.object({
        patientIds: z.array(z.string()).min(1),
        status: z.enum(statusEnum.enumValues),
      }),
    )
    .handler(async ({ input }) => {
      return await mutations.patient.bulkUpdateStatus(
        input.patientIds,
        input.status,
      );
    }),
};

// ================ PATIENT PROCEDURES ================

// Create patient
export const createPatient = protectedProcedure
  .input(PatientCreateSchema)
  .output(PatientSchema)
  .handler(async ({ input, context }) => {
    const newPatient = await mutations.patient.create({
      ...input,
      clinicId: context.clinicId ?? "default-clinic-id",
      createdById: context.user?.id ?? "",
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!newPatient) {
      throw new Error("Failed to create patient");
    }
    return newPatient;
  });
// Get patient by ID
export const getPatient = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(PatientSchema.nullable())
  .handler(async ({ input, context }) => {
    const result = await queries.patient.getPatientById(
      input.id,
      context.clinicId ?? "",
    );
    return result ?? null;
  });
// Get patient with full details (appointments, medical records, etc.)
// Get patient with full details (appointments, medical records, etc.)
export const getPatientWithDetails = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(PatientWithRelationsSchema.nullable())
  .handler(async ({ input, context }) => {
    const result = await queries.patient.getPatientFullHistory(
      input.id,
      context.clinicId ?? "",
    );
    return result ?? null;
  });
export const getNeonatalAssessment = protectedProcedure
  .input(z.object({ patientId: z.string() }))
  .output(NeonatalAssessmentSchema.nullable())
  .handler(async ({ input, context }) => {
    const result = await queries.patient.getNeonatalAssessment(
      input.patientId,
      context.clinicId ?? "",
    );
    return result ?? null;
  });

// List patients with pagination and filters
// List patients with pagination and filters
export const listPatients = protectedProcedure
  .input(
    z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      offset: z.number().optional(),
      search: z.string().optional(),
      status: z.enum(schema.statusEnum.enumValues).optional(),
      isActive: z.boolean().optional(),
      gender: z.enum(schema.genderEnum.enumValues).optional(),
      bloodGroup: z.enum(schema.bloodGroupEnum.enumValues).optional(),
    }),
  )
  .output(
    z.object({
      patients: z.array(PatientSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const {
      page,
      limit,
      search,
      status,
      isActive,
      gender,
      bloodGroup,
      offset: manualOffset,
    } = input;
    const clinicId = context.clinicId ?? "";

    const { patients: patientsList, total } =
      await queries.patient.listPatients({
        clinicId,
        page,
        limit,
        offset: manualOffset,
        search,
        status,
        isActive,
        gender,
        bloodGroup,
      });

    return {
      patients: patientsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });

// Update patient
export const updatePatient = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: PatientUpdateSchema,
    }),
  )
  .output(PatientSchema)
  .handler(async ({ input, context }) => {
    const updated = await mutations.patient.update(input.id, {
      ...input.data,
      clinicId: context.clinicId ?? "",
      updatedById: context.user?.id,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new Error("Patient not found");
    }

    return updated;
  });

// Soft delete patient
export const deletePatient = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.boolean())
  .handler(async ({ input, context }) => {
    await mutations.patient.softDelete(input.id, context.clinicId ?? "");
    return true;
  });

// Hard delete patient (permanent)
export const hardDeletePatient = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.boolean())
  .handler(async ({ input, context }) => {
    await mutations.patient.delete(input.id, context.clinicId ?? "");
    return true;
  });

// Get patient statistics
export const getPatientStats = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      totalAppointments: z.number(),
      completedAppointments: z.number(),
      cancelledAppointments: z.number(),
      totalPayments: z.number(),
      paidAmount: z.number(),
      dueAmount: z.number(),
      totalPrescriptions: z.number(),
      activePrescriptions: z.number(),
      totalImmunizations: z.number(),
      lastVisit: z.date().nullable(),
      nextAppointment: z.date().nullable(),
    }),
  )
  .handler(async ({ input }) => {
    return await queries.patient.getPatientStats(input.id);
  });
export const searchPatients = protectedProcedure
  .input(
    z.object({
      query: z.string(),
      limit: z.number().default(20),
      includeDeleted: z.boolean().default(false),
    }),
  )
  .output(z.array(PatientSchema))
  .handler(async ({ input, context }) => {
    return await queries.search.searchPatients(
      context.clinicId ?? "",
      input.query,
    );
  });

// Bulk create patients
export const bulkCreatePatients = protectedProcedure
  .input(z.array(PatientCreateSchema))
  .output(z.array(PatientSchema))
  .handler(async ({ input, context }) => {
    const patientsToInsert = input.map((patientData) => {
      return {
        ...patientData,
        id: crypto.randomUUID(),
        clinicId: context.clinicId ?? "",
        createdById: context.user?.id ?? "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const results = await context.db
      .insert(schema.patient)
      .values(patientsToInsert)
      .returning();
    return results;
  });

// Export all procedures
export const patientRouter = {
  getNeonatalAssessment,
  create: createPatient,
  get: getPatient,
  getWithDetails: getPatientWithDetails,
  list: listPatients,
  update: updatePatient,
  delete: deletePatient,
  hardDelete: hardDeletePatient,
  getStats: getPatientStats,
  search: searchPatients,
  bulkCreatePatients,
};
