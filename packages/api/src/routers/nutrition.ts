// src/orpc/routers/nutrition.server.ts

import { mutations } from "@clinic-app/db/actions/mutations";
import {
  feedingLogQueries,
  type NutritionAssessment,
  nutritionAssessmentQueries,
  patientQueries,
} from "@clinic-app/db/queries";
import { feedingTypeEnum } from "@clinic-app/db/schema/clinic";
import { generateId } from "@clinic-app/utils/id";
import { z } from "zod";
import { protectedProcedure } from "../index";

// ============================================
// Schemas
// ============================================

const FeedingLogSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  date: z.date(),
  type: z.enum(feedingTypeEnum.enumValues),
  duration: z.number().optional(),
  amount: z.number().optional(),
  breast: z.enum(["LEFT", "RIGHT", "BOTH"]).optional(),
  notes: z.string().optional(),
});

const CreateFeedingLogSchema = FeedingLogSchema.omit({ id: true });

const UpdateFeedingLogSchema = CreateFeedingLogSchema.partial();

const GetNutritionDataSchema = z.object({
  patientId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const GetFeedingSummarySchema = z.object({
  patientId: z.string(),
  days: z.number().min(1).max(365).default(30),
});

const NutritionAssessmentOutputSchema = z.object({
  patientId: z.string(),
  assessmentDate: z.date(),
  nutritionalStatus: z.enum([
    "NORMAL",
    "UNDERWEIGHT",
    "OVERWEIGHT",
    "OBESE",
    "MALNOURISHED",
  ]),
  dietaryRestrictions: z.array(z.string()).optional(),
  recommendations: z.array(z.string()),
  followUpDate: z.date().optional(),
  notes: z.string().optional(),
});

// ============================================
// Helpers
// ============================================

/** Map a DB feedingLog row to the FeedingLogSchema shape. */
function mapFeedingLog(log: {
  id: string;
  patientId: string;
  date: Date;
  type: (typeof feedingTypeEnum.enumValues)[number];
  duration: number | null;
  amount: number | null;
  breast: "LEFT" | "RIGHT" | "BOTH" | null;
  notes: string | null;
}) {
  return {
    id: log.id,
    patientId: log.patientId,
    date: log.date,
    type: log.type,
    duration: log.duration ?? undefined,
    amount: log.amount ?? undefined,
    breast: log.breast ?? undefined,
    notes: log.notes ?? undefined,
  };
}

/** Map a NutritionAssessment to the output schema shape. */
function mapAssessment(a: NutritionAssessment) {
  return {
    patientId: a.patientId,
    assessmentDate: a.assessmentDate,
    nutritionalStatus: a.nutritionalStatus,
    dietaryRestrictions: a.dietaryRestrictions,
    recommendations: a.recommendations,
    followUpDate: a.followUpDate ?? undefined,
    notes: a.notes ?? undefined,
  };
}

/** ISO date string without the time component, no non-null assertion needed. */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ============================================
// Nutrition Procedures
// ============================================

// Log a feeding record
export const logFeeding = protectedProcedure
  .input(CreateFeedingLogSchema)
  .output(FeedingLogSchema)
  .handler(async ({ input }) => {
    const feedingLog = await mutations.feedingLog.create({
      ...input,
      id: generateId(),
    });

    if (!feedingLog) {
      throw new Error("Failed to create feeding log");
    }

    return mapFeedingLog(feedingLog);
  });

// Update a feeding record
export const updateFeedingLog = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: UpdateFeedingLogSchema,
    }),
  )
  .output(FeedingLogSchema)
  .handler(async ({ input }) => {
    const updated = await mutations.feedingLog.update(input.id, input.data);

    if (!updated) {
      throw new Error("Feeding log not found");
    }

    return mapFeedingLog(updated);
  });

// Delete a feeding record
export const deleteFeedingLog = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    await mutations.feedingLog.delete(input.id);
    return { success: true };
  });

// Get feeding logs for a patient
// feedingLogQueries.list() returns { logs, total, hasMore } — not a plain array.
export const getFeedingLogs = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .output(
    z.object({
      logs: z.array(FeedingLogSchema),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  )
  .handler(async ({ input }) => {
    const { patientId, limit, offset, startDate, endDate } = input;

    const result = await feedingLogQueries.list({
      patientId,
      clinicId: "", // clinicId is unused in the query (prefixed _clinicId)
      limit,
      offset,
      startDate,
      endDate,
    });

    return {
      logs: result.logs.map(mapFeedingLog),
      total: result.total,
      hasMore: result.hasMore,
    };
  });

// Get feeding summary statistics
export const getFeedingSummary = protectedProcedure
  .input(GetFeedingSummarySchema)
  .output(
    z.object({
      totalFeedings: z.number(),
      byType: z.record(z.string(), z.number()),
      averageDuration: z.number(),
      totalAmount: z.number(),
      feedingsByDay: z.array(
        z.object({
          date: z.string(),
          count: z.number(),
          totalDuration: z.number(),
          totalAmount: z.number(),
        }),
      ),
      recentFeedings: z.array(FeedingLogSchema),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId, days } = input;
    const clinicId = context.clinicId ?? "";

    // feedingLogQueries.getStats already computes all of this efficiently
    const stats = await feedingLogQueries.getStats(patientId, clinicId, days);

    // Fetch the 10 most recent logs for the recentFeedings field
    const recent = await feedingLogQueries.list({
      patientId,
      clinicId,
      limit: 10,
      offset: 0,
    });

    return {
      totalFeedings: stats.totalFeedings,
      byType: stats.byType,
      averageDuration: stats.averageDuration,
      totalAmount: stats.totalAmount,
      feedingsByDay: stats.feedingsByDay,
      recentFeedings: recent.logs.map(mapFeedingLog),
    };
  });

// Get breastfeeding statistics
export const getBreastfeedingStats = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
      days: z.number().min(1).max(365).default(30),
    }),
  )
  .output(
    z.object({
      todayTotal: z.number(),
      weeklyAverage: z.number(),
      totalSessions: z.number(),
      averageDuration: z.number(),
      weeklyData: z.array(
        z.object({
          date: z.string(),
          duration: z.number(),
          count: z.number(),
        }),
      ),
      sessionsByTimeOfDay: z.object({
        morning: z.number(),
        afternoon: z.number(),
        evening: z.number(),
        night: z.number(),
      }),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId, days } = input;
    const clinicId = context.clinicId ?? "";

    // Delegate entirely to the existing query helper which already does all
    // the breastfeeding-specific aggregation correctly.
    const stats = await feedingLogQueries.getBreastfeedingStats(
      patientId,
      clinicId,
      days,
    );

    return {
      todayTotal: stats.todayTotal,
      weeklyAverage: stats.weeklyAverage,
      totalSessions: stats.totalSessions,
      averageDuration: stats.averageDuration,
      // weeklyData from the query includes leftDuration/rightDuration which
      // aren't in the output schema — pick only the fields we expose.
      weeklyData: stats.weeklyData.map((d) => ({
        date: d.date,
        duration: d.duration,
        count: d.count,
      })),
      sessionsByTimeOfDay: stats.sessionsByTimeOfDay,
    };
  });

// Get nutrition assessment for a patient
export const getNutritionAssessment = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .output(
    z.object({
      currentAssessment: NutritionAssessmentOutputSchema.nullable(),
      history: z.array(NutritionAssessmentOutputSchema),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId } = input;
    const clinicId = context.clinicId ?? "";

    // nutritionAssessmentQueries is the correct export — queries.nutrition
    // does not exist on the queries barrel object.
    const assessments = await nutritionAssessmentQueries.getAssessments(
      patientId,
      clinicId,
    );

    const currentAssessment =
      assessments.length > 0
        ? mapAssessment(assessments[0] as NutritionAssessment)
        : null;

    return {
      currentAssessment,
      history: assessments.slice(1).map(mapAssessment),
    };
  });

// Save nutrition assessment
// There is no dedicated nutrition_assessment table — assessments are stored
// as JSON inside medicalRecord.notes (see nutritionAssessmentQueries).
// mutations.assessment.create wraps that pattern.
export const saveNutritionAssessment = protectedProcedure
  .input(NutritionAssessmentOutputSchema)
  .output(NutritionAssessmentOutputSchema)
  .handler(async ({ input, context }) => {
    const assessment = await mutations.assessment.create({
      ...input,
      clinicId: context.clinicId ?? "",
    });

    if (!assessment) {
      throw new Error("Failed to save nutrition assessment");
    }

    return mapAssessment(assessment);
  });

// Update nutrition assessment
export const updateNutritionAssessment = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: NutritionAssessmentOutputSchema.partial(),
    }),
  )
  .output(NutritionAssessmentOutputSchema)
  .handler(async ({ input }) => {
    const updated = await mutations.assessment.update(input.id, {
      ...input.data,
      id: "",
    });

    if (!updated) {
      throw new Error("Nutrition assessment not found");
    }

    return mapAssessment(updated as NutritionAssessment);
  });

// Delete nutrition assessment
export const deleteNutritionAssessment = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    await mutations.assessment.delete(input.id);
    return { success: true };
  });

// Get nutrition dashboard data
export const getNutritionDashboard = protectedProcedure
  .input(
    z.object({
      patientId: z.string(),
    }),
  )
  .output(
    z.object({
      feedingSummary: z.object({
        totalFeedings: z.number(),
        byType: z.record(z.string(), z.number()),
        averageDailyFeedings: z.number(),
      }),
      breastfeedingStats: z.object({
        todayTotal: z.number(),
        weeklyAverage: z.number(),
        averageDuration: z.number(),
      }),
      nutritionalStatus: z.object({
        status: z.enum([
          "NORMAL",
          "UNDERWEIGHT",
          "OVERWEIGHT",
          "OBESE",
          "MALNOURISHED",
        ]),
        lastAssessmentDate: z.date().nullable(),
        trend: z.enum(["improving", "stable", "declining"]).nullable(),
      }),
      alerts: z.array(
        z.object({
          type: z.enum(["warning", "info", "success"]),
          message: z.string(),
          suggestion: z.string().optional(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId } = input;
    const clinicId = context.clinicId ?? "";

    // Run all queries in parallel
    const [feedingStats, breastfeedingStats, assessments, patient] =
      await Promise.all([
        feedingLogQueries.getStats(patientId, clinicId, 30),
        feedingLogQueries.getBreastfeedingStats(patientId, clinicId, 30),
        nutritionAssessmentQueries.getAssessments(patientId, clinicId),
        patientQueries.getPatientById(patientId, clinicId),
      ]);

    const currentAssessment =
      assessments.length > 0 ? (assessments[0] as NutritionAssessment) : null;

    // Average daily feedings
    const uniqueDays = feedingStats.feedingsByDay.length;
    const averageDailyFeedings =
      uniqueDays > 0 ? feedingStats.totalFeedings / uniqueDays : 0;

    // Generate alerts
    const alerts: Array<{
      type: "warning" | "info" | "success";
      message: string;
      suggestion?: string;
    }> = [];

    // Check feeding frequency for infants (< 6 months)
    if (patient) {
      const ageInMonths = Math.floor(
        (Date.now() - patient.dateOfBirth.getTime()) /
          (1000 * 60 * 60 * 24 * 30.44),
      );

      if (ageInMonths < 6) {
        if (averageDailyFeedings < 6) {
          alerts.push({
            type: "warning",
            message: "Low feeding frequency detected",
            suggestion:
              "Newborns typically feed 8-12 times per day. Consider more frequent feedings.",
          });
        } else if (averageDailyFeedings >= 8) {
          alerts.push({
            type: "success",
            message: "Good feeding frequency",
            suggestion: "Continue with current feeding schedule.",
          });
        }
      }
    }

    if (
      breastfeedingStats.totalSessions === 0 &&
      feedingStats.totalFeedings > 0
    ) {
      alerts.push({
        type: "info",
        message: "No breastfeeding records found",
        suggestion:
          "Consider tracking breastfeeding sessions for better insights.",
      });
    }

    if (currentAssessment) {
      if (currentAssessment.nutritionalStatus === "UNDERWEIGHT") {
        alerts.push({
          type: "warning",
          message: "Patient is underweight",
          suggestion:
            "Consult with a nutritionist for dietary recommendations.",
        });
      } else if (
        currentAssessment.nutritionalStatus === "OVERWEIGHT" ||
        currentAssessment.nutritionalStatus === "OBESE"
      ) {
        alerts.push({
          type: "warning",
          message: "Weight management concern detected",
          suggestion:
            "Review dietary habits and consider physical activity recommendations.",
        });
      } else if (currentAssessment.nutritionalStatus === "NORMAL") {
        alerts.push({
          type: "success",
          message: "Normal nutritional status",
          suggestion: "Continue with current healthy habits.",
        });
      }
    }

    // Calculate trend from assessment history
    let trend: "improving" | "stable" | "declining" | null = null;
    if (assessments.length >= 2) {
      const statusOrder: Record<string, number> = {
        MALNOURISHED: 0,
        OBESE: 0,
        UNDERWEIGHT: 1,
        OVERWEIGHT: 1,
        NORMAL: 2,
      };
      const currentScore =
        statusOrder[currentAssessment?.nutritionalStatus ?? "NORMAL"] ?? 1;
      const prevScore =
        statusOrder[assessments[1]?.nutritionalStatus ?? "NORMAL"] ?? 1;

      if (currentScore > prevScore) trend = "improving";
      else if (currentScore < prevScore) trend = "declining";
      else trend = "stable";
    }

    return {
      feedingSummary: {
        totalFeedings: feedingStats.totalFeedings,
        byType: feedingStats.byType,
        averageDailyFeedings: Math.round(averageDailyFeedings * 10) / 10,
      },
      breastfeedingStats: {
        todayTotal: breastfeedingStats.todayTotal,
        weeklyAverage: breastfeedingStats.weeklyAverage,
        averageDuration: breastfeedingStats.averageDuration,
      },
      nutritionalStatus: {
        status: currentAssessment?.nutritionalStatus ?? "NORMAL",
        lastAssessmentDate: currentAssessment?.assessmentDate ?? null,
        trend,
      },
      alerts,
    };
  });

// Get nutrition data (combined endpoint for the nutrition dashboard page)
export const getNutritionData = protectedProcedure
  .input(GetNutritionDataSchema)
  .output(
    z.object({
      feedingHistory: z.array(FeedingLogSchema),
      breastfeeding: z
        .object({
          records: z.array(FeedingLogSchema),
          stats: z.object({
            todayTotal: z.number(),
            weeklyAverage: z.number(),
            totalSessions: z.number(),
            averageDuration: z.number(),
          }),
        })
        .optional(),
      assessment: NutritionAssessmentOutputSchema.nullable(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId, startDate, endDate } = input;
    const clinicId = context.clinicId ?? "";

    const actualEndDate = endDate ?? new Date();
    const actualStartDate =
      startDate ??
      (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d;
      })();

    // Run all queries in parallel
    const [feedingResult, assessments] = await Promise.all([
      feedingLogQueries.list({
        patientId,
        clinicId,
        startDate: actualStartDate,
        endDate: actualEndDate,
        limit: 500,
        offset: 0,
      }),
      nutritionAssessmentQueries.getAssessments(patientId, clinicId),
    ]);

    const feedingLogs = feedingResult.logs;
    const breastfeedingLogs = feedingLogs.filter(
      (log) => log.type === "BREAST",
    );

    const today = toDateKey(new Date());
    const todayFeedings = breastfeedingLogs.filter(
      (log) => toDateKey(log.date) === today,
    );

    const totalDuration = breastfeedingLogs.reduce(
      (sum, log) => sum + (log.duration ?? 0),
      0,
    );
    const averageDuration =
      breastfeedingLogs.length > 0
        ? totalDuration / breastfeedingLogs.length
        : 0;

    return {
      feedingHistory: feedingLogs.map(mapFeedingLog),
      breastfeeding: {
        records: breastfeedingLogs.map(mapFeedingLog),
        stats: {
          todayTotal: todayFeedings.length,
          weeklyAverage: Math.round(breastfeedingLogs.length / 4),
          totalSessions: breastfeedingLogs.length,
          averageDuration: Math.round(averageDuration),
        },
      },
      assessment:
        assessments.length > 0
          ? mapAssessment(assessments[0] as NutritionAssessment)
          : null,
    };
  });

// ============================================
// Export Router
// ============================================

export const nutritionRouter = {
  // Feeding log operations
  logFeeding,
  updateFeedingLog,
  deleteFeedingLog,
  getFeedingLogs,
  getFeedingSummary,
  getBreastfeedingStats,

  // Nutrition assessment operations
  getNutritionAssessment,
  saveNutritionAssessment,
  updateNutritionAssessment,
  deleteNutritionAssessment,

  // Dashboard endpoints
  getNutritionDashboard,
  getNutritionData,
};
