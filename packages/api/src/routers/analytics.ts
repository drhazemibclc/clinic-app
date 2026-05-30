// packages/api/src/routers/analytics.server.ts

import {
  calculateConfidenceLevel,
  calculateDateRange,
  calculateExpectedGrowth,
  calculatePatientRiskScore,
  calculateTrend,
  createMonitoringSchedule,
  findPeakPeriod,
  generateBenchmarkRecommendations,
  generateInsights,
  generatePatientOutcomes,
  generatePatientRecommendations,
  generatePredictions,
  generateRecommendations,
  getCurrentMetricValue,
  getDemographicData,
  getGrowthMeasurementTrends,
  getGrowthMetrics,
  getHealthIndicators,
  getHistoricalData,
  getImmunizationMetrics,
  getImmunizationTrends,
  getNationalAverage,
  getOverallMetrics,
  getPatientTrends,
  getPrescriptionTrends,
  getPreviousPeriodMetricValue,
  getPreviousPeriodStart,
  getRevenueTrends,
  getSeasonalPatterns,
  getStateAverage,
  getTargetValue,
  getTopConditions,
  getTotalAppointments,
  getTotalGrowthMeasurements,
  getTotalImmunizations,
  getTotalPatients,
  getTotalPrescriptions,
  getTotalRevenue,
  getTreatmentMetrics,
  getWellnessMetrics,
  identifyRiskFactors,
} from "@clinic-app/db/actions/analytics";
import { patientQueries } from "@clinic-app/db/queries";
import { z } from "zod";
import { clinicProcedure } from "../index";

// ============================================================================
// Types & Schemas
// ============================================================================

const TrendPeriodSchema = z.enum([
  "week",
  "month",
  "quarter",
  "year",
  "6months",
  "all",
]);
const MetricTypeSchema = z.enum([
  "appointments",
  "patients",
  "revenue",
  "immunizations",
  "prescriptions",
  "growth",
]);

const GetTrendsSchema = z.object({
  period: TrendPeriodSchema.default("month"),
  metric: MetricTypeSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("month"),
});

const GetAIPredictionsSchema = z.object({
  patientId: z.string().optional(),
  metric: MetricTypeSchema.default("appointments"),
  horizon: z.enum(["week", "month", "quarter"]).default("month"),
});

const GetOutcomeMetricsSchema = z.object({
  clinicId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  patientId: z.string().optional(),
});

// ============================================================================
// Analytics Procedures
// ============================================================================

// Get trends for various metrics
export const getTrends = clinicProcedure
  .input(GetTrendsSchema)
  .output(
    z.object({
      period: z.object({
        start: z.date(),
        end: z.date(),
        label: z.string(),
      }),
      data: z.array(
        z.object({
          date: z.date(),
          value: z.number(),
          label: z.string(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
      ),
      summary: z.object({
        total: z.number(),
        average: z.number(),
        growth: z.number(),
        previousPeriodTotal: z.number(),
        percentageChange: z.number(),
      }),
    }),
  )
  .handler(async ({ input, context }) => {
    const { period, metric, startDate, endDate, groupBy } = input;
    const clinicId = context.clinicId ?? "";

    // Calculate date range based on period
    const { start, end, label } = calculateDateRange(
      period,
      startDate,
      endDate,
    );
    const previousPeriodStart = getPreviousPeriodStart(start, end);

    // Get data based on metric type
    let data: Array<{ date: Date; value: number; label: string }> = [];
    let previousPeriodTotal = 0;

    switch (metric) {
      case "appointments":
        data = await getAppointmentTrendsLogic(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalAppointments(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      case "patients":
        data = await getPatientTrends(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalPatients(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      case "revenue":
        data = await getRevenueTrends(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalRevenue(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      case "immunizations":
        data = await getImmunizationTrends(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalImmunizations(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      case "prescriptions":
        data = await getPrescriptionTrends(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalPrescriptions(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      case "growth":
        data = await getGrowthMeasurementTrends(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalGrowthMeasurements(
          clinicId,
          previousPeriodStart,
          start,
        );
        break;
      default:
        data = await getAppointmentTrendsLogic(clinicId, start, end, groupBy);
        previousPeriodTotal = await getTotalAppointments(
          clinicId,
          previousPeriodStart,
          start,
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const average = data.length > 0 ? total / data.length : 0;
    const growth =
      previousPeriodTotal > 0
        ? ((total - previousPeriodTotal) / previousPeriodTotal) * 100
        : 0;

    return {
      period: { start, end, label },
      data: data.map((d) => ({
        date: d.date,
        value: d.value,
        label: d.label,
      })),
      summary: {
        total,
        average,
        growth,
        previousPeriodTotal,
        percentageChange: growth,
      },
    };
  });

// Get AI-powered predictions
export const getAIPredictions = clinicProcedure
  .input(GetAIPredictionsSchema)
  .output(
    z.object({
      metric: z.string(),
      horizon: z.string(),
      predictions: z.array(
        z.object({
          date: z.date(),
          predictedValue: z.number(),
          lowerBound: z.number(),
          upperBound: z.number(),
          confidence: z.number(),
        }),
      ),
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
      summary: z.object({
        expectedGrowth: z.number(),
        confidenceLevel: z.number(),
        peakPeriod: z.string().optional(),
        riskFactors: z.array(z.string()),
      }),
    }),
  )
  .handler(async ({ input, context }) => {
    const { metric, horizon, patientId } = input;
    const clinicId = context.clinicId ?? "";

    // Get historical data for predictions
    const historicalData = await getHistoricalData(clinicId, metric, patientId);

    // Generate predictions using simple time series forecasting
    const predictions = generatePredictions(historicalData, horizon);

    // Generate insights based on predictions
    const insights = generateInsights(predictions, metric);

    // Generate recommendations
    const recommendations = generateRecommendations(predictions, metric);

    // Calculate summary metrics
    const expectedGrowth = calculateExpectedGrowth(historicalData, predictions);
    const confidenceLevel = calculateConfidenceLevel(historicalData);
    const peakPeriod = findPeakPeriod(predictions);
    const riskFactors = identifyRiskFactors(predictions, metric);

    return {
      metric,
      horizon,
      predictions,
      insights,
      recommendations,
      summary: {
        expectedGrowth,
        confidenceLevel,
        peakPeriod,
        riskFactors,
      },
    };
  });

// Get clinical outcome metrics
export const getOutcomeMetrics = clinicProcedure
  .input(GetOutcomeMetricsSchema)
  .output(
    z.object({
      immunization: z.object({
        coverageRate: z.number(),
        onTimeRate: z.number(),
        overdueCount: z.number(),
        completedSeries: z.array(
          z.object({
            vaccine: z.string(),
            completed: z.number(),
            total: z.number(),
            rate: z.number(),
          }),
        ),
      }),
      growth: z.object({
        patientsTracked: z.number(),
        below5thPercentile: z.number(),
        above95thPercentile: z.number(),
        growthVelocityNormal: z.number(),
        concernsIdentified: z.number(),
      }),
      wellness: z.object({
        completedVisits: z.number(),
        recommendedVisits: z.number(),
        complianceRate: z.number(),
        earlyDetectionRate: z.number(),
      }),
      treatment: z.object({
        prescriptionAdherence: z.number(),
        hospitalizationRate: z.number(),
        erVisitsRate: z.number(),
        followUpCompliance: z.number(),
      }),
      overall: z.object({
        patientSatisfaction: z.number(),
        careQualityScore: z.number(),
        outcomeImprovement: z.number(),
      }),
    }),
  )
  .handler(async ({ input, context }) => {
    const clinicId = input.clinicId ?? context.clinicId ?? "";
    const startDate =
      input.startDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = input.endDate ?? new Date();

    // Get immunization metrics
    const immunizationMetrics = await getImmunizationMetrics(
      clinicId,
      startDate,
      endDate,
    );

    // Get growth metrics
    const growthMetrics = await getGrowthMetrics(clinicId, startDate, endDate);

    // Get wellness metrics
    const wellnessMetrics = await getWellnessMetrics(
      clinicId,
      startDate,
      endDate,
    );

    // Get treatment metrics
    const treatmentMetrics = await getTreatmentMetrics(
      clinicId,
      startDate,
      endDate,
    );

    // Get overall metrics
    const overallMetrics = await getOverallMetrics(
      clinicId,
      startDate,
      endDate,
    );

    return {
      immunization: immunizationMetrics,
      growth: growthMetrics,
      wellness: wellnessMetrics,
      treatment: treatmentMetrics,
      overall: overallMetrics,
    };
  });

// Get patient outcome predictions (AI)
export const getPatientOutcomePredictions = clinicProcedure
  .input(
    z.object({
      patientId: z.string(),
      condition: z.string().optional(),
      horizon: z.enum(["month", "quarter", "year"]).default("month"),
    }),
  )
  .output(
    z.object({
      riskScore: z.number(),
      predictedOutcomes: z.array(
        z.object({
          outcome: z.string(),
          probability: z.number(),
          timeframe: z.string(),
          severity: z.string(),
        }),
      ),
      recommendations: z.array(z.string()),
      monitoringSchedule: z.array(
        z.object({
          metric: z.string(),
          frequency: z.string(),
          target: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    const { patientId, condition, horizon } = input;
    const clinicId = context.clinicId ?? "";

    // Get patient data
    const patientData = await patientQueries.getPatientFullHistory(
      patientId,
      clinicId,
    );

    if (!patientData) {
      throw new Error("Patient not found");
    }

    // Calculate risk score based on historical data
    const riskScore = calculatePatientRiskScore(
      {
        medicalRecords: patientData.medicalRecords,
        prescriptions: patientData.prescriptions,
        allergies: patientData.allergies ? [patientData.allergies] : [],
      },
      condition,
    );

    // Generate predicted outcomes
    const predictedOutcomes = generatePatientOutcomes(
      patientData,
      condition,
      horizon,
    );

    // Generate recommendations
    const recommendations = generatePatientRecommendations(
      patientData,
      riskScore,
      predictedOutcomes,
    );

    // Create monitoring schedule
    const monitoringSchedule = createMonitoringSchedule(patientData, riskScore);

    return {
      riskScore,
      predictedOutcomes,
      recommendations,
      monitoringSchedule,
    };
  });

// Get population health analytics
export const getPopulationHealth = clinicProcedure
  .input(
    z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      ageGroup: z
        .enum(["infant", "toddler", "preschool", "school", "adolescent", "all"])
        .default("all"),
    }),
  )
  .output(
    z.object({
      demographics: z.object({
        totalPatients: z.number(),
        ageDistribution: z.array(
          z.object({
            group: z.string(),
            count: z.number(),
            percentage: z.number(),
          }),
        ),
        genderDistribution: z.array(
          z.object({
            gender: z.string(),
            count: z.number(),
            percentage: z.number(),
          }),
        ),
      }),
      healthIndicators: z.object({
        immunizationCoverage: z.number(),
        wellChildVisitCompliance: z.number(),
        growthMonitoringRate: z.number(),
        developmentalScreeningRate: z.number(),
      }),
      topConditions: z.array(
        z.object({
          condition: z.string(),
          prevalence: z.number(),
          trend: z.string(),
          affectedPatients: z.number(),
        }),
      ),
      seasonalPatterns: z.array(
        z.object({
          season: z.string(),
          condition: z.string(),
          incidence: z.number(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    const clinicId = context.clinicId ?? "";
    const startDate =
      input.startDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = input.endDate ?? new Date();

    // Get demographic data
    const demographics = await getDemographicData(
      clinicId,
      startDate,
      endDate,
      input.ageGroup,
    );

    // Get health indicators
    const healthIndicators = await getHealthIndicators(
      clinicId,
      startDate,
      endDate,
    );

    // Get top conditions
    const topConditions = await getTopConditions(clinicId, startDate, endDate);

    // Get seasonal patterns
    const seasonalPatterns = await getSeasonalPatterns(
      clinicId,
      startDate,
      endDate,
    );

    return {
      demographics,
      healthIndicators,
      topConditions,
      seasonalPatterns,
    };
  });

// Get performance benchmarks
export const getPerformanceBenchmarks = clinicProcedure
  .input(
    z.object({
      metric: MetricTypeSchema.default("appointments"),
      compareTo: z
        .enum([
          "previous_period",
          "national_average",
          "state_average",
          "target",
        ])
        .default("previous_period"),
    }),
  )
  .output(
    z.object({
      current: z.number(),
      benchmark: z.number(),
      variance: z.number(),
      percentageDiff: z.number(),
      status: z.enum(["above", "below", "at"]),
      trend: z.enum(["improving", "declining", "stable"]),
      recommendations: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context }) => {
    const { metric, compareTo } = input;
    const clinicId = context.clinicId ?? "";

    // Get current value
    const currentValue = await getCurrentMetricValue(clinicId, metric);

    // Get benchmark value
    let benchmarkValue = 0;
    switch (compareTo) {
      case "previous_period":
        benchmarkValue = await getPreviousPeriodMetricValue(clinicId, metric);
        break;
      case "national_average":
        benchmarkValue = await getNationalAverage(metric);
        break;
      case "state_average":
        benchmarkValue = await getStateAverage(clinicId, metric);
        break;
      case "target":
        benchmarkValue = await getTargetValue(metric);
        break;
    }

    const variance = currentValue - benchmarkValue;
    const percentageDiff =
      benchmarkValue > 0 ? (variance / benchmarkValue) * 100 : 0;
    const status =
      percentageDiff > 5 ? "above" : percentageDiff < -5 ? "below" : "at";
    const trend = await calculateTrend(clinicId, metric);

    const recommendations = generateBenchmarkRecommendations(
      metric,
      status,
      trend,
    );

    return {
      current: currentValue,
      benchmark: benchmarkValue,
      variance,
      percentageDiff,
      status,
      trend,
      recommendations,
    };
  });

// ============================================================================
// Analytics Router Export
// ============================================================================

export const analyticsRouter = {
  getTrends,
  getAIPredictions,
  getOutcomeMetrics,
  getPatientOutcomePredictions,
  getPopulationHealth,
  getPerformanceBenchmarks,
};

function getAppointmentTrendsLogic(
  _clinicId: string,
  _start: Date,
  _end: Date,
  _groupBy: string,
):
  | { date: Date; value: number; label: string }[]
  | PromiseLike<{ date: Date; value: number; label: string }[]> {
  throw new Error("Function not implemented.");
}
// ============================================================================
// Helper Functions
// ============================================================================

// ============================================================================
// Update main routers/index.ts to include analyticsRouter
// ============================================================================

// Add to routers/index.ts:
// import { analyticsRouter } from "./analytics.server";
//
// export const appRouter = o.router({
//   // ... existing routers
//   analytics: analyticsRouter,
// });
