// routers/vital-signs.router.ts

import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import {
  VitalSignCreateSchema,
  VitalSignUpdateSchema,
} from "@clinic-app/db/zod";
import { startOfDay, subDays } from "date-fns";
import { z } from "zod";
import { protectedProcedure } from "../index";

// ============================================
// Schemas
// ============================================

const ListVitalSignsSchema = z.object({
  patientId: z.string(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  encounterId: z.string().optional(),
});

const VitalSignsTrendSchema = z.object({
  patientId: z.string(),
  days: z.number().int().min(1).max(365).default(30),
  metrics: z
    .array(z.enum(["temperature", "bloodPressure", "heartRate", "oxygen"]))
    .default(["temperature", "heartRate", "oxygen"]),
});

// ============================================
// Vital Signs Procedures
// ============================================

export const createVitalSigns = protectedProcedure
  .input(VitalSignCreateSchema)
  .handler(async ({ context, input }) => {
    const { clinicId, db } = context;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    console.info("Recording vital signs", {
      patientId: input.patientId,
      medicalId: input.medicalId,
    });

    // Verify medical record exists using queries
    const medicalRecordExists = await db.query.medicalRecord.findFirst({
      where: {
        id: input.medicalId,
        clinicId,
        isDeleted: false,
      },
    });

    if (!medicalRecordExists) {
      throw new Error("Medical record not found");
    }

    // Verify patient exists using queries
    const patientData = await db.query.patient.findFirst({
      where: { id: input.patientId, clinicId, isDeleted: false },
    });

    if (!patientData) {
      throw new Error("Patient not found");
    }

    // Check if vital signs already exist for this medical record
    const existing = await db.query.vitalSign.findFirst({
      where: { medicalId: input.medicalId, clinicId },
    });

    if (existing) {
      throw new Error("Vital signs already recorded for this medical record");
    }

    // Use mutation to create vital signs
    const vitalSignsRecord = await mutations.vitalSign.create({
      ...input,
      id: crypto.randomUUID(),
      clinicId: clinicId ?? "",
      gender: input.gender ?? patientData.gender,
    });

    // Update medical record using mutation
    if (vitalSignsRecord) {
      await mutations.medicalRecord.update(input.medicalId, {
        updatedAt: new Date(),
      });
    }

    console.info("Vital signs recorded successfully", {
      vitalSignsId: vitalSignsRecord?.id ?? "",
    });

    // Fetch the complete record using queries
    const completeRecord = await queries.vitalSign.getById(
      vitalSignsRecord?.id ?? "",
      clinicId,
    );

    return completeRecord;
  });

export const getPatientHistory = protectedProcedure
  .input(z.object({ patientId: z.string() }))
  .handler(async ({ context, input }) => {
    const { clinicId, db } = context;
    const { patientId } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    // Use queries to get patient history
    const history = await db.query.vitalSign.findMany({
      where: { patientId, clinicId },
      with: {
        medical: {
          columns: {
            id: true,
            createdAt: true,
          },
        },
        encounter: {
          columns: {
            id: true,
            diagnosis: true,
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    const chartData = await db.query.vitalSign.findMany({
      where: { patientId, clinicId },
      orderBy: { recordedAt: "asc" },
      limit: 50,
    });

    return { history, chartData };
  });

export const updateVitalSigns = protectedProcedure
  .input(VitalSignUpdateSchema)
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { id, ...updateData } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    console.info("Updating vital signs", { vitalSignsId: id });

    // Verify existence using queries
    const existing = await queries.vitalSign.getById(id as string, clinicId);

    if (!existing) {
      throw new Error("Vital signs not found");
    }

    // Use mutation to update
    const updated = await mutations.vitalSign.update(id as string, updateData);

    console.info("Vital signs updated", { vitalSignsId: id });
    return updated;
  });

export const getVitalSignsById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { id } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    const vitalSignsRecord = await queries.vitalSign.getById(id, clinicId);

    if (!vitalSignsRecord) {
      throw new Error("Vital signs not found");
    }

    console.debug("Retrieved vital signs", { vitalSignsId: id });
    return vitalSignsRecord;
  });

export const listVitalSignsByPatient = protectedProcedure
  .input(ListVitalSignsSchema)
  .handler(async ({ context, input }) => {
    const { clinicId, user } = context;
    const { patientId, page, pageSize, fromDate, toDate, encounterId } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    console.debug("Listing vital signs", { patientId, page, pageSize });

    // Use the checkVitalSignsAccess from queries
    const hasAccess = await queries.checkVitalSignsAccess(
      user?.id ?? "",
      patientId,
    );
    if (!hasAccess && user?.role !== "admin" && user?.role !== "staff") {
      throw new Error("You don't have access to this patient's vital signs");
    }

    const vitalSignsList = await queries.vitalSign.list({
      patientId,
      clinicId: clinicId ?? "",
      page,
      pageSize,
      fromDate,
      toDate,
      encounterId,
    });

    const total = vitalSignsList.length;

    return {
      vitalSigns: vitalSignsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });

export const getLatestVitalSigns = protectedProcedure
  .input(z.object({ patientId: z.string(), limit: z.number().default(1) }))
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { patientId } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    const latestVitalSigns = await queries.vitalSign.getLatest(
      patientId,
      clinicId,
    );

    return latestVitalSigns ?? null;
  });

export const getVitalSignsTrend = protectedProcedure
  .input(VitalSignsTrendSchema)
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { patientId, days, metrics } = input;

    const startDate = startOfDay(subDays(new Date(), days));

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    console.debug("Getting vital signs trend", { patientId, days, metrics });

    const vitalSignsList = await queries.vitalSign.list({
      patientId: patientId,
      clinicId: context.clinicId ?? "",
      fromDate: startDate,
      toDate: new Date(),
      pageSize: 1000, // High limit for trend data
      page: 1,
    });

    const trend: {
      dates: string[];
      temperature: Array<{ value: number; date: string }>;
      bloodPressure: Array<{
        systolic: number;
        diastolic: number;
        date: string;
      }>;
      heartRate: Array<{ value: number; date: string }>;
      oxygen: Array<{ value: number; date: string }>;
    } = {
      dates: [],
      temperature: [],
      bloodPressure: [],
      heartRate: [],
      oxygen: [],
    };

    for (const vs of vitalSignsList) {
      const date = vs.recordedAt.toISOString();
      trend.dates.push(date);

      if (metrics.includes("temperature") && vs.bodyTemperature) {
        trend.temperature.push({ value: vs.bodyTemperature, date });
      }

      if (metrics.includes("bloodPressure") && vs.systolic && vs.diastolic) {
        trend.bloodPressure.push({
          systolic: vs.systolic,
          diastolic: vs.diastolic,
          date,
        });
      }

      if (metrics.includes("heartRate") && vs.heartRate) {
        trend.heartRate.push({ value: vs.heartRate, date });
      }

      if (metrics.includes("oxygen") && vs.oxygenSaturation) {
        trend.oxygen.push({ value: vs.oxygenSaturation, date });
      }
    }

    // Calculate summary statistics
    const summary = {
      temperature: calculateSummary(trend.temperature.map((t) => t.value)),
      heartRate: calculateSummary(trend.heartRate.map((h) => h.value)),
      oxygenSaturation: calculateSummary(trend.oxygen.map((o) => o.value)),
    };

    return {
      patientId,
      period: { days, startDate, endDate: new Date() },
      trend,
      summary,
      totalReadings: vitalSignsList.length,
    };
  });

export const deleteVitalSigns = protectedProcedure
  .input(z.object({ id: z.string(), reason: z.string().optional() }))
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { id, reason } = input;

    if (!clinicId) {
      throw new Error("Clinic context missing");
    }

    console.warn("Deleting vital signs", { vitalSignsId: id, reason });

    // Verify existence using queries
    const existing = await queries.vitalSign.getById(id, clinicId);

    if (!existing) {
      throw new Error("Vital signs not found");
    }

    // Use mutation to delete
    const result = await mutations.vitalSign.delete(id);

    return {
      success: true,
      message: "Vital signs deleted successfully",
      result,
    };
  });

// ============================================
// Helper Functions
// ============================================

function calculateSummary(values: number[]): {
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
} {
  if (values.length === 0) {
    return { min: null, max: null, avg: null, latest: null };
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    latest: values.at(-1) ?? 0,
  };
}
