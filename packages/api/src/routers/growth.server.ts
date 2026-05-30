import {
  createDevelopmentalMilestones,
  mutations,
  updateDevelopmentalMilestones,
} from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { calculateAgeInDays, calculateAgeInMonths } from "@clinic-app/utils";
import { z } from "zod";
import { protectedProcedure } from "../index";

// Get patient growth history
export const getPatientGrowthHistory = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    // Use existing patient query to get growth records with percentiles
    const growthWithPercentiles =
      await queries.user.getPatientGrowthPercentiles(
        input.patientId,
        context.clinicId ?? "",
      );

    if (!growthWithPercentiles) {
      return {
        records: [],
        total: 0,
        limit: input.limit,
        offset: input.offset,
      };
    }

    // Apply pagination manually since the existing query doesn't support it
    const paginatedRecords = growthWithPercentiles.slice(
      input.offset,
      input.offset + input.limit,
    );

    return {
      records: paginatedRecords,
      total: growthWithPercentiles.length,
      limit: input.limit,
      offset: input.offset,
    };
  });

// Record growth measurement - Using existing mutation
export const recordGrowth = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      date: z.date(),
      weight: z.number().optional(),
      height: z.number().optional(),
      headCircumference: z.number().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Verify patient exists and belongs to clinic
    const patientData = await queries.growth.getGrowthRecordById(
      input.patientId,
      context.clinicId ?? "",
    );

    if (!patientData) {
      throw new Error("Patient not found");
    }

    if (!patientData.gender) {
      throw new Error("Patient gender is required");
    }

    // Calculate BMI if both weight and height are provided
    let bmi: number | undefined;
    if (input.weight && input.height) {
      const heightInMeters = input.height / 100;
      bmi = Number.parseFloat(
        (input.weight / (heightInMeters * heightInMeters)).toFixed(1),
      );
    }

    // Use the existing recordGrowthWithPercentiles mutation
    const growthRecord = await mutations.growth.recordWithPercentiles({
      patientId: input.patientId,
      clinicId: context.clinicId,
      date: input.date,
      weight: input.weight,
      height: input.height,
      headCircumference: input.headCircumference,
      bmi,
      notes: input.notes,
    });

    return growthRecord;
  });

// Get growth chart data
export const getGrowthChart = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      measurementType: z.enum([
        "WEIGHT",
        "HEIGHT",
        "BMI",
        "HEAD_CIRCUMFERENCE",
      ]),
      fromDate: z.date().optional(),
      toDate: z.date().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Build where conditions using RQB v2 syntax
    const rqbWhere: Record<string, unknown> = {
      patientId: input.patientId,
      clinicId: context.clinicId ?? "",
      isDeleted: false,
    };

    if (input.fromDate) {
      rqbWhere.date = { gte: input.fromDate };
    }
    if (input.toDate) {
      rqbWhere.date = {
        ...((rqbWhere.date as object) || {}),
        lte: input.toDate,
      };
    }

    const records = await queries.growth.getPatientGrowthRecords(
      input.patientId,
      context.clinicId ?? "",
    );

    const chartData = records.map((record) => {
      let value: number | null = null;
      let zScore: number | null = null;

      switch (input.measurementType) {
        case "WEIGHT":
          value = record.weight ?? null;
          zScore = record.weightForAgeZ ?? null;
          break;
        case "HEIGHT":
          value = record.height ?? null;
          zScore = record.heightForAgeZ ?? null;
          break;
        case "HEAD_CIRCUMFERENCE":
          value = record.headCircumference ?? null;
          zScore = record.hcForAgeZ ?? null;
          break;
        case "BMI":
          value = record.bmi ?? null;
          zScore = record.bmiForAgeZ ?? null;
          break;
      }

      return {
        date: record.date,
        id: record.id,
        value,
        zScore,
        ageDays: record.ageDays,
        ageMonths: record.ageMonths,
        // Include all measurements for reference
        weight: record.weight,
        height: record.height,
        headCircumference: record.headCircumference,
      };
    });

    return chartData;
  });

// Update growth measurement - Using existing mutation
export const updateGrowthMeasurement = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      date: z.date().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      headCircumference: z.number().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Verify record exists and belongs to clinic
    const existing = await queries.growth.getGrowthRecordById(
      input.id,
      context.clinicId ?? "",
    );

    if (!existing) {
      throw new Error("Growth record not found");
    }

    // Calculate BMI if both weight and height are provided
    let bmi: number | undefined;
    const weight = input.weight ?? existing.weight;
    const height = input.height ?? existing.height;

    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = Number.parseFloat(
        (weight / (heightInMeters * heightInMeters)).toFixed(1),
      );
    }

    // Use the existing update mutation
    const updated = await mutations.growth.update(existing.id, {
      date: input.date,
      weight: weight,
      height: height,
      headCircumference: input.headCircumference ?? existing.headCircumference,
      bmi,
      notes: input.notes,
    });

    if (!updated) {
      throw new Error("Failed to update growth record");
    }

    return updated;
  });

// Delete growth measurement - Using existing mutation
export const deleteGrowthMeasurement = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Verify record exists and belongs to clinic
    const existing = await queries.growth.getGrowthRecordById(
      input.id,
      context.clinicId ?? "",
    );

    if (!existing) {
      throw new Error("Growth record not found");
    }

    // Use the existing delete mutation
    const deleted = await mutations.growth.delete(input.id);

    if (!deleted) {
      throw new Error("Failed to delete growth record");
    }

    return { success: true, id: deleted.id };
  });

export const getPatientGrowthAnalytics = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Use existing query to get growth records with percentiles
    const growthWithPercentiles =
      await queries.patient.getPatientGrowthPercentiles(
        input.patientId,
        context.clinicId ?? "",
      );

    if (!growthWithPercentiles) {
      return {
        analytics: null,
        message: "No growth records found for this patient",
      };
    }

    // Perform analytics calculations here (e.g., growth rates, classifications)
    // For simplicity, we'll just return the records with percentiles
    return {
      analytics: growthWithPercentiles,
    };
  });

// Get growth velocity (rate of change between measurements)
export const getGrowthVelocity = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const records = await queries.growth.getPatientGrowthRecords(
      input.patientId,
      context.clinicId ?? "",
    );

    if (records.length < 2) {
      return {
        velocity: [],
        message: "Insufficient data for velocity calculation",
      };
    }

    // Sort by date ascending
    const sorted = [...records].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const velocity = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (!prev || !curr) continue;

      const daysDiff = Math.ceil(
        (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff <= 0) continue;

      velocity.push({
        period: { from: prev.date, to: curr.date, days: daysDiff },
        weightVelocity:
          prev.weight && curr.weight
            ? Number(
                ((curr.weight - prev.weight) / (daysDiff / 30.44)).toFixed(2),
              ) // kg/month
            : null,
        heightVelocity:
          prev.height && curr.height
            ? Number(
                ((curr.height - prev.height) / (daysDiff / 30.44)).toFixed(2),
              ) // cm/month
            : null,
        headVelocity:
          prev.headCircumference && curr.headCircumference
            ? Number(
                (
                  (curr.headCircumference - prev.headCircumference) /
                  (daysDiff / 30.44)
                ).toFixed(2),
              ) // cm/month
            : null,
      });
    }

    return {
      patientId: input.patientId,
      velocity,
    };
  });

// Get growth percentile classification
export const getGrowthPercentile = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      date: z.date().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const patientData = await queries.growth.getGrowthRecordById(
      input.patientId,
      context.clinicId ?? "",
    );

    if (!patientData) {
      throw new Error("Patient not found");
    }

    const referenceDate = input.date ?? new Date();
    const ageDays = calculateAgeInDays(
      patientData.patient?.dateOfBirth ?? new Date(),
    );
    const ageMonths = calculateAgeInMonths(
      patientData.patient?.dateOfBirth ?? new Date(),
      referenceDate,
    );

    // Use existing query to get growth records with percentiles
    const growthWithPercentiles =
      await queries.patient.getPatientGrowthPercentiles(
        input.patientId,
        context.clinicId ?? "",
      );

    const latestRecord = growthWithPercentiles?.[0] ?? null;

    if (!latestRecord) {
      return {
        ageDays,
        ageMonths,
        classifications: null,
        message: "No growth records found for this patient",
      };
    }

    const getWeightClassification = (zScore: number | null): string => {
      if (zScore === null) return "NO_DATA";
      if (zScore < -3) return "SEVERELY_UNDERWEIGHT";
      if (zScore < -2) return "UNDERWEIGHT";
      if (zScore <= 1) return "NORMAL";
      if (zScore <= 2) return "OVERWEIGHT";
      return "OBESE";
    };

    const getStuntingClassification = (zScore: number | null): string => {
      if (zScore === null) return "NO_DATA";
      if (zScore < -3) return "SEVERELY_STUNTED";
      if (zScore < -2) return "STUNTED";
      if (zScore <= 1) return "NORMAL";
      if (zScore <= 2) return "TALL";
      return "VERY_TALL";
    };

    return {
      ageDays,
      ageMonths,
      classifications: {
        weight: {
          zScore: latestRecord.weightForAgeZ ?? null,
          classification: getWeightClassification(
            latestRecord.weightForAgeZ ?? null,
          ),
          percentile: latestRecord.percentile,
        },
        height: {
          zScore: latestRecord.heightForAgeZ ?? null,
          classification: getStuntingClassification(
            latestRecord.heightForAgeZ ?? null,
          ),
        },
        headCircumference: {
          zScore: latestRecord.hcForAgeZ ?? null,
          classification: getWeightClassification(
            latestRecord.hcForAgeZ ?? null,
          ),
        },
        bmi: {
          zScore: latestRecord.bmiForAgeZ ?? null,
          classification: getWeightClassification(
            latestRecord.bmiForAgeZ ?? null,
          ),
        },
      },
      lastMeasurement: {
        date: latestRecord.date,
        weight: latestRecord.weight,
        height: latestRecord.height,
        headCircumference: latestRecord.headCircumference,
        bmi: latestRecord.bmi,
      },
    };
  });

// Bulk import growth records
export const bulkImportGrowthRecords = protectedProcedure
  .input(
    z.object({
      records: z.array(
        z.object({
          patientId: z.string(),
          date: z.date(),
          weight: z.number().optional(),
          height: z.number().optional(),
          headCircumference: z.number().optional(),
          notes: z.string().optional(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    const results = [];
    const errors = [];

    for (const record of input.records) {
      try {
        // Verify patient exists and belongs to clinic
        const patientData = await queries.growth.getGrowthRecordById(
          record.patientId,
          context.clinicId ?? "",
        );

        if (!patientData) {
          errors.push({
            patientId: record.patientId,
            error: "Patient not found",
          });
          continue;
        }

        if (!patientData.gender) {
          errors.push({
            patientId: record.patientId,
            error: "Patient gender is required",
          });
          continue;
        }

        // Calculate BMI if both weight and height are provided
        let bmi: number | undefined;
        if (record.weight && record.height) {
          const heightInMeters = record.height / 100;
          bmi = Number.parseFloat(
            (record.weight / (heightInMeters * heightInMeters)).toFixed(1),
          );
        }

        const growthRecord = await mutations.growth.recordWithPercentiles({
          patientId: record.patientId,
          clinicId: context.clinicId,
          date: record.date,
          weight: record.weight,
          height: record.height,
          headCircumference: record.headCircumference,
          bmi,
          notes: record.notes,
        });

        results.push(growthRecord);
      } catch (error) {
        errors.push({
          patientId: record.patientId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  });

// Get growth summary statistics
export const getGrowthSummary = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const rqbWhere: Record<string, unknown> = {
      patientId: input.patientId,
      clinicId: context.clinicId ?? "",
      isDeleted: false,
    };

    if (input.startDate) {
      rqbWhere.date = { gte: input.startDate };
    }
    if (input.endDate) {
      rqbWhere.date = {
        ...((rqbWhere.date as object) || {}),
        lte: input.endDate,
      };
    }

    const records = await queries.growth.getPatientGrowthRecords(
      input.patientId,
      context.clinicId ?? "",
    );

    if (records.length === 0) {
      return {
        count: 0,
        summary: null,
        message: "No growth records found",
      };
    }

    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];

    if (!firstRecord || !lastRecord) return { count: 0, summary: null };

    let weightGrowthRate: number | null = null;
    let heightGrowthRate: number | null = null;
    if (
      firstRecord?.weight &&
      lastRecord?.weight &&
      firstRecord.weight !== lastRecord.weight
    ) {
      const daysDiff = Math.ceil(
        (lastRecord.date.getTime() - firstRecord.date.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysDiff > 0) {
        weightGrowthRate = Number.parseFloat(
          ((lastRecord.weight - firstRecord.weight) / daysDiff).toFixed(2),
        );
      }
    }

    if (
      firstRecord?.height &&
      lastRecord?.height &&
      firstRecord.height !== lastRecord.height
    ) {
      const daysDiff = Math.ceil(
        (lastRecord.date.getTime() - firstRecord.date.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysDiff > 0) {
        heightGrowthRate = Number.parseFloat(
          ((lastRecord.height - firstRecord.height) / daysDiff).toFixed(2),
        );
      }
    }

    return {
      count: records.length,
      summary: {
        firstMeasurement: {
          date: firstRecord.date,
          weight: firstRecord.weight,
          height: firstRecord.height,
          headCircumference: firstRecord.headCircumference,
        },
        lastMeasurement: {
          date: lastRecord.date,
          weight: lastRecord.weight,
          height: lastRecord.height,
          headCircumference: lastRecord.headCircumference,
        },
        growthRates: {
          weightPerDay: weightGrowthRate,
          heightPerDay: heightGrowthRate,
        },
        totalWeightGain:
          lastRecord.weight && firstRecord.weight
            ? lastRecord.weight - firstRecord.weight
            : null,
        totalHeightGain:
          lastRecord.height && firstRecord.height
            ? lastRecord.height - firstRecord.height
            : null,
      },
    };
  });

export const addMeasurementPoint = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      date: z.date(),
      weight: z.number().optional(),
      height: z.number().optional(),
      headCircumference: z.number().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const result = await queries.growth.addMeasurementPoint(
      input,
      context.clinicId ?? "",
    );
    return result;
  });

export const listGrowthRecords = protectedProcedure
  .input(
    z.object({
      patientId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }),
  )
  .output(
    z.object({
      records: z.array(z.any()),
      total: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { limit, offset, patientId } = input;
    const clinicId = context.clinicId ?? "";

    const records = await queries.growth.getPatientGrowthRecords(
      patientId ?? "",
      clinicId,
    );

    const total = records.length;
    const paginatedRecords = records
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(offset, offset + limit);

    return {
      records: paginatedRecords,
      total,
    };
  });

// Get developmental milestones for a patient
export const getMilestones = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    // Use existing getDevelopmentalProgress query to get milestones
    const progressData = await queries.pediatric.getDevelopmentalProgress(
      input.patientId,
    );

    // Flatten the milestones from the grouped structure
    const allMilestones = Object.values(progressData.milestones).flat();

    // Count achieved vs total milestones
    const total = progressData.totalMilestonesAchieved;
    const achieved = allMilestones.filter((m) => m.dateRecorded).length;

    return {
      milestones: allMilestones,
      total,
      achieved,
      progress: total > 0 ? (achieved / total) * 100 : 0,
    };
  });

// Record or update a developmental milestone for a patient
export const updateMilestone = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      milestone: z.string(),
      ageAchieved: z.string(),
      dateRecorded: z.date(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Verify patient exists and belongs to clinic
    const patient = await queries.patient.getPatientById(
      input.patientId,
      context.clinicId ?? "",
    );

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Get existing milestones for this patient
    const progressData = await queries.pediatric.getDevelopmentalProgress(
      input.patientId,
    );

    const allMilestones = Object.values(progressData.milestones).flat();
    const existingMilestone = allMilestones.find(
      (m) => m.milestone === input.milestone,
    );

    if (existingMilestone) {
      // Update existing milestone
      const updated = await updateDevelopmentalMilestones(
        String(existingMilestone.id),
        {
          ageAchieved: input.ageAchieved,
          dateRecorded: input.dateRecorded,
          notes: input.notes,
          updatedBy: context.user?.id ?? "",
        },
      );

      return {
        success: true,
        milestone: updated,
        action: "updated",
      };
    }

    // Create new milestone record
    const newMilestone = await createDevelopmentalMilestones({
      patientId: input.patientId,
      milestone: input.milestone,
      ageAchieved: input.ageAchieved,
      dateRecorded: input.dateRecorded,
      notes: input.notes,
      createdBy: context.user?.id ?? "",
    });

    return {
      success: true,
      milestone: newMilestone,
      action: "created",
    };
  });

// Get growth summary with milestone progress
export const getGrowthUpdateWithMilestones = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Get latest growth data
    const growthData = await queries.growth.getPatientGrowthRecords(
      input.patientId,
      context.clinicId ?? "",
    );

    const latestGrowth = growthData[0] ?? null;

    // Get milestones data
    const progressData = await queries.pediatric.getDevelopmentalProgress(
      input.patientId,
    );

    const allMilestones = Object.values(progressData.milestones).flat();
    const achieved = allMilestones.filter((m) => m.dateRecorded).length;
    const total = progressData.totalMilestonesAchieved;

    return {
      growth: {
        latest: latestGrowth
          ? {
              date: latestGrowth.date,
              weight: latestGrowth.weight,
              height: latestGrowth.height,
              headCircumference: latestGrowth.headCircumference,
              bmi: latestGrowth.bmi,
              weightForAgeZ: latestGrowth.weightForAgeZ,
              heightForAgeZ: latestGrowth.heightForAgeZ,
              bmiForAgeZ: latestGrowth.bmiForAgeZ,
            }
          : null,
        recordCount: growthData.length,
      },
      milestones: {
        achieved,
        total,
        progress: total > 0 ? (achieved / total) * 100 : 0,
        recentAchievements: allMilestones
          .filter((m) => m.dateRecorded)
          .sort(
            (a, b) =>
              new Date(b.dateRecorded).getTime() -
              new Date(a.dateRecorded).getTime(),
          )
          .slice(0, 5),
      },
    };
  });

// Get developmental screenings for a patient
export const getDevelopmentalScreenings = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const screenings = await queries.pediatric.getDevelopmentalScreenings(
      input.patientId,
    );

    return screenings;
  });

// Submit a new developmental screening result
export const submitDevelopmentalScreening = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      checkDate: z.date(),
      ageMonths: z.number(),
      motorSkills: z.string(),
      languageSkills: z.string(),
      socialSkills: z.string(),
      cognitiveSkills: z.string(),
      milestonesMet: z.string().optional(),
      milestonesPending: z.string().optional(),
      concerns: z.string().optional(),
      recommendations: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const screening = await queries.pediatric.createDevelopmentalCheck({
      ...input,
      id: crypto.randomUUID(),
    });
    return screening;
  });

export const growthRouter = {
  list: listGrowthRecords,
  getPatientGrowthHistory,
  create: recordGrowth,
  getGrowthChart,
  getAnalytics: getPatientGrowthAnalytics,
  update: updateGrowthMeasurement,
  getVelocity: getGrowthVelocity,
  delete: deleteGrowthMeasurement,
  getGrowthPercentile,
  getGrowthSummary,
  addMeasurementPoint,
  bulkImportGrowthRecords,
  getMilestones,
  updateMilestone,
  getGrowthUpdateWithMilestones,
  getDevelopmentalScreenings,
  submitScreening: submitDevelopmentalScreening,
};
