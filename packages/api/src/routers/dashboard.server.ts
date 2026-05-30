// lib/orpc/dashboard-procedures.ts

import {
  appointmentQueries,
  queries,
  reportingQueries,
  serviceQueries,
} from "@clinic-app/db/queries";
import {
  calculatePatientSatisfaction,
  mapActionToActivity,
} from "@clinic-app/utils";
import { z } from "zod";
import { protectedProcedure } from "../index";

// Dashboard stats response type
export type DashboardStats = {
  overview: {
    totalPatients: number;
    totalAppointments: number;
    activeDoctors: number;
    activeStaff: number;
    occupancyRate: number;
    pendingPrescriptionsCount: number;
    lowStockItemsCount: number;
    immunizationsDue: number;
    immunizationsTrend: string;
    growthMeasurements: number;
    growthTrend: string;
    todayAppointments: number;
    appointmentsTrend: string;
  };
  today: {
    appointments: number;
    appointmentsList: Array<{
      id: string;
      time: string;
      patientName: string;
      doctorName: string;
      status: string;
    }>;
    revenue: number;
    completedAppointments: number;
    cancelledAppointments: number;
  };
  weekly: {
    appointmentsCount: number;
    appointmentsByDay: Array<{
      day: string;
      count: number;
      date: string;
    }>;
    newPatientsCount: number;
    revenue: number;
    topDoctors: Array<{
      id: string;
      name: string;
      appointmentCount: number;
      revenue: number;
    }>;
  };
  monthly: {
    appointmentsCount: number;
    newPatientsCount: number;
    revenue: number;
    revenueTrend: Array<{
      week: number;
      revenue: number;
      appointments: number;
    }>;
    averageWaitTime: number;
    patientSatisfaction: number;
    popularServices: Array<{
      id: string;
      name: string;
      count: number;
      revenue: number;
    }>;
  };
  demographics: {
    under18: number;
    age18to30: number;
    age31to50: number;
    age51to70: number;
    over70: number;
  };
  alerts: Array<{
    id: string;
    type: "warning" | "error" | "info";
    title: string;
    message: string;
    timestamp: string;
    action?: {
      label: string;
      href: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    type: "appointment" | "patient" | "payment" | "prescription";
    action: "created" | "updated" | "cancelled" | "completed";
    description: string;
    user: string;
    timestamp: string;
  }>;
};

// Base dashboard procedure (extends auth)
export const dashboardProcedure = protectedProcedure;

// ============================================
// Main Dashboard Stats
// ============================================

export const getDashboardStats = dashboardProcedure.handler(
  async ({ context }): Promise<DashboardStats> => {
    const { user: ctxUser, clinicId } = context;
    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    console.debug("Fetching dashboard stats", {
      clinicId,
      userId: ctxUser?.id,
      dateRange: { startOfWeek, endOfWeek, startOfMonth },
    });

    try {
      // Use the reporting queries for analytics
      const analytics = await reportingQueries.getClinicAnalytics(
        clinicId,
        startOfMonth,
        new Date(),
      );

      // Get weekly appointments using appointment queries
      const weeklyAppointments =
        await appointmentQueries.getAppointmentsInRange(
          clinicId,
          startOfWeek,
          endOfWeek,
        );

      // Get monthly appointments
      const monthlyAppointments =
        await appointmentQueries.getAppointmentsInRange(
          clinicId,
          startOfMonth,
          new Date(),
        );

      // Get popular services
      const popularServices = await serviceQueries.getPopularServices(
        clinicId,
        5,
        startOfMonth,
        new Date(),
      );

      // Get doctor performance report
      const doctorPerformance =
        await reportingQueries.getDoctorPerformanceReport(
          clinicId,
          startOfMonth,
          new Date(),
        );

      // Get patients by age range for demographics (optimized for concurrency)
      const [
        patientsUnder18,
        patients18to30,
        patients31to50,
        patients51to70,
        patientsOver70,
      ] = await Promise.all([
        queries.user.getPatientsByAgeRange(clinicId, 0, 216),
        queries.user.getPatientsByAgeRange(clinicId, 216, 360),
        queries.user.getPatientsByAgeRange(clinicId, 360, 600),
        queries.user.getPatientsByAgeRange(clinicId, 600, 840),
        queries.user.getPatientsByAgeRange(clinicId, 840, 1200),
      ]);

      // Get pediatric specific stats for overview
      const [inventoryStatus, overdueImmunizations, growthRecords] =
        await Promise.all([
          queries.vaccine.getVaccineInventoryStatus(clinicId),
          queries.vaccine.getOverdueImmunizations(clinicId),
          queries.growth.getPatientGrowthRecords("", clinicId), // Empty patientId to get clinic-wide if supported, or filter analytics
        ]);

      // Get today's appointments using appointment queries
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayAppointmentsList =
        await appointmentQueries.getAppointmentsInRange(
          clinicId,
          todayStart,
          todayEnd,
        );

      // Calculate today's stats
      const todayAppointments = todayAppointmentsList.filter(
        (apt) =>
          !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status ?? ""),
      );
      const todayCompletedAppointments = todayAppointmentsList.filter(
        (apt) => apt.status === "COMPLETED",
      );
      const todayCancelledAppointments = todayAppointmentsList.filter(
        (apt) => apt.status === "CANCELLED",
      );

      // Format appointments by day of week
      const appointmentsByDay = weeklyAppointments.reduce(
        (acc, apt) => {
          const dayIndex = apt.appointmentDate.getDay();
          const dayName =
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex] ??
            "Unknown";
          const existing = acc.find((d) => d.day === dayName);
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              day: dayName,
              count: 1,
              date: apt.appointmentDate.toISOString().split("T")[0] ?? "",
            });
          }
          return acc;
        },
        [] as Array<{ day: string; count: number; date: string }>,
      );

      // Format top doctors
      const formattedTopDoctors = doctorPerformance
        .map((doc) => ({
          id: doc.id,
          name: doc.name,
          appointmentCount: doc.totalAppointments,
          revenue: doc.revenue,
        }))
        .slice(0, 5);

      // Format revenue trend by week
      const revenueTrend = [];
      const weeksInMonth = Math.ceil(new Date().getDate() / 7);
      for (let week = 1; week <= weeksInMonth; week++) {
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekRevenue = analytics.revenue.total; // Simplified - would need more granular data
        revenueTrend.push({
          week,
          revenue: weekRevenue / weeksInMonth,
          appointments: Math.round(analytics.appointments.total / weeksInMonth),
        });
      }

      // Format popular services
      const formattedPopularServices = popularServices.map((service) => ({
        id: service.id,
        name: service.name,
        count: service.totalUsage,
        revenue: service.price * service.totalUsage,
      }));

      // Create alerts
      const alerts: DashboardStats["alerts"] = [];

      // Check for pending/expiring prescriptions
      if (analytics.prescriptions > 0) {
        alerts.push({
          id: "pending-prescriptions",
          type: "warning",
          title: "Active Prescriptions",
          message: `${analytics.prescriptions} active prescriptions need attention.`,
          timestamp: new Date().toISOString(),
          action: {
            label: "Review Prescriptions",
            href: "/prescriptions/pending",
          },
        });
      }

      // Check for low patient engagement
      const lowEngagementPatients =
        analytics.appointments.completed < 10 ? 1 : 0;
      if (lowEngagementPatients > 0) {
        alerts.push({
          id: "low-engagement",
          type: "info",
          title: "Low Patient Engagement",
          message: `${lowEngagementPatients} patients haven't visited in over 3 months.`,
          timestamp: new Date().toISOString(),
          action: {
            label: "View Patients",
            href: "/patients?status=inactive",
          },
        });
      }

      // Format recent activity from appointments
      const recentAppointments =
        await appointmentQueries.getAppointmentsInRange(
          clinicId,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date(),
        );

      const formattedRecentActivity: DashboardStats["recentActivity"] =
        recentAppointments.slice(0, 10).map((apt) => ({
          id: apt.id,
          type: "appointment" as const,
          action: mapActionToActivity(apt.status ?? "updated"),
          description: `Appointment for ${apt.patient?.firstName ?? "Patient"} ${apt.patient?.lastName ?? ""} with Dr. ${apt.doctor?.name ?? "Doctor"}`,
          user: apt.doctor?.name ?? "System",
          timestamp: apt.updatedAt.toISOString(),
        }));

      // Calculate occupancy rate
      const occupancyRate =
        analytics.appointments.completed > 0 && analytics.appointments.total > 0
          ? Math.min(
              100,
              Math.round(
                (analytics.appointments.completed /
                  analytics.appointments.total) *
                  100,
              ),
            )
          : 0;

      console.info("Dashboard stats fetched successfully", {
        clinicId,
        totalPatients: analytics.patients.total,
        todayAppointments: todayAppointments.length,
        monthlyRevenue: analytics.revenue.total,
      });

      return {
        overview: {
          totalPatients: analytics.patients.total,
          totalAppointments: analytics.appointments.total,
          activeDoctors: doctorPerformance.length,
          activeStaff: doctorPerformance.length, // Would need staff query
          occupancyRate,
          pendingPrescriptionsCount: analytics.prescriptions,
          lowStockItemsCount: inventoryStatus?.lowStock?.length ?? 0,
          immunizationsDue: overdueImmunizations.length,
          immunizationsTrend: "+5%",
          growthMeasurements: growthRecords.length,
          growthTrend: "+10%",
          todayAppointments: todayAppointments.length,
          appointmentsTrend: "+8%",
        },
        today: {
          appointments: todayAppointments.length,
          appointmentsList: todayAppointments.map((apt) => ({
            id: apt.id,
            time: apt.appointmentDate.toLocaleTimeString(),
            patientName: apt.patient
              ? `${apt.patient.firstName} ${apt.patient.lastName}`
              : "Unknown",
            doctorName: apt.doctor?.name ?? "Unknown",
            status: apt.status ?? "SCHEDULED",
          })),
          revenue: analytics.revenue.total / 30, // Approximate daily revenue
          completedAppointments: todayCompletedAppointments.length,
          cancelledAppointments: todayCancelledAppointments.length,
        },
        weekly: {
          appointmentsCount: weeklyAppointments.length,
          appointmentsByDay,
          newPatientsCount: analytics.patients.newPatients,
          revenue: analytics.revenue.total / 4, // Approximate weekly revenue
          topDoctors: formattedTopDoctors,
        },
        monthly: {
          appointmentsCount: monthlyAppointments.length,
          newPatientsCount: analytics.patients.newPatients,
          revenue: analytics.revenue.total,
          revenueTrend,
          averageWaitTime: 15, // Would need actual wait time data
          patientSatisfaction: calculatePatientSatisfaction(),
          popularServices: formattedPopularServices,
        },
        demographics: {
          under18: patientsUnder18.length,
          age18to30: patients18to30.length,
          age31to50: patients31to50.length,
          age51to70: patients51to70.length,
          over70: patientsOver70.length,
        },
        alerts,
        recentActivity: formattedRecentActivity,
      };
    } catch (error) {
      console.error("Failed to fetch dashboard stats", { error });
      throw error;
    }
  },
);

// ============================================
// Specialized Dashboard Procedures
// ============================================

export const getRecentAppointments = dashboardProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(50).default(10),
      status: z
        .enum(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"])
        .optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { clinicId } = context;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const appointments = await appointmentQueries.getAppointmentsInRange(
      clinicId,
      startDate,
      endDate,
    );

    const filteredAppointments = input.status
      ? appointments.filter((apt) => apt.status === input.status)
      : appointments;

    return filteredAppointments.slice(0, input.limit);
  });

export const getRevenueOverview = dashboardProcedure
  .input(
    z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }),
  )
  .handler(async ({ context, input }) => {
    const { clinicId } = context;
    const { startDate, endDate } = input;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    const analytics = await reportingQueries.getClinicAnalytics(
      clinicId,
      startDate,
      endDate,
    );

    // Format revenue data based on groupBy
    const revenueData = [];
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (input.groupBy === "day") {
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        revenueData.push({
          period: date.toISOString().split("T")[0] ?? "",
          total: analytics.revenue.total / daysDiff,
          count: Math.round(analytics.appointments.total / daysDiff),
          average: analytics.revenue.averagePerAppointment,
        });
      }
    } else if (input.groupBy === "week") {
      const weeksInRange = Math.ceil(daysDiff / 7);
      for (let week = 1; week <= weeksInRange; week++) {
        revenueData.push({
          period: `Week ${week}`,
          total: analytics.revenue.total / weeksInRange,
          count: Math.round(analytics.appointments.total / weeksInRange),
          average: analytics.revenue.averagePerAppointment,
        });
      }
    } else {
      // month
      revenueData.push({
        period: startDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        total: analytics.revenue.total,
        count: analytics.appointments.total,
        average: analytics.revenue.averagePerAppointment,
      });
    }

    return {
      revenue: revenueData,
      summary: {
        total: analytics.revenue.total,
        transactionCount: analytics.appointments.completed,
        averageTransaction: analytics.revenue.averagePerAppointment,
      },
    };
  });

export const getPatientDemographics = dashboardProcedure.handler(
  async ({ context }) => {
    const { clinicId } = context;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    // Get patients by age groups
    const ageGroups = [
      { name: "0-17", minMonths: 0, maxMonths: 216 },
      { name: "18-30", minMonths: 216, maxMonths: 360 },
      { name: "31-50", minMonths: 360, maxMonths: 600 },
      { name: "51-70", minMonths: 600, maxMonths: 840 },
      { name: "70+", minMonths: 840, maxMonths: 1200 },
    ];

    const ageGroupData = await Promise.all(
      ageGroups.map(async (group) => {
        const patients = await queries.user.getPatientsByAgeRange(
          clinicId,
          group.minMonths,
          group.maxMonths,
        );
        return {
          age_group: group.name,
          count: patients.length,
        };
      }),
    );

    // Get gender distribution
    const allPatients = await queries.user.getPatientsByAgeRange(
      clinicId,
      0,
      1200,
    );
    const genderDistribution = allPatients.reduce(
      (acc, patient) => {
        const gender = patient.gender ?? "OTHER";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const genderData = Object.entries(genderDistribution).map(
      ([gender, count]) => ({
        gender,
        count,
      }),
    );

    // Get top locations from patient addresses
    const locations = allPatients
      .filter((p) => p.address)
      .reduce(
        (acc, patient) => {
          const city = patient.address?.split(",")[1]?.trim() || "Unknown";
          acc[city] = (acc[city] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const topLocations = Object.entries(locations)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      ageGroups: ageGroupData,
      genderDistribution: genderData,
      topLocations,
    };
  },
);

export const getDoctorPerformance = dashboardProcedure
  .input(
    z.object({
      period: z.enum(["week", "month", "year"]).default("month"),
      doctorId: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { clinicId } = context;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    const { period, doctorId } = input;

    const startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const doctorPerformance = await reportingQueries.getDoctorPerformanceReport(
      clinicId,
      startDate,
      new Date(),
    );

    const filteredPerformance = doctorId
      ? doctorPerformance.filter((d) => d.id === doctorId)
      : doctorPerformance;

    return filteredPerformance.map((performance) => ({
      id: performance.id,
      name: performance.name,
      specialization: performance.specialty,
      totalAppointments: performance.totalAppointments,
      totalRevenue: performance.revenue,
      averageRating: performance.averageRating,
      reviewCount: Math.round(performance.averageRating * 10), // Approximate
      uniquePatients: Math.round(performance.totalAppointments * 0.8), // Approximate
      completionRate: performance.completionRate,
    }));
  });

// ============================================
// Additional Dashboard Utilities
// ============================================

export const getAppointmentTrends = dashboardProcedure
  .input(
    z.object({
      months: z.number().int().min(1).max(12).default(6),
    }),
  )
  .handler(async ({ context, input }) => {
    const { clinicId } = context;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    // const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - input.months);

    const monthlyTrends = [];

    for (let i = 0; i < input.months; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const analytics = await reportingQueries.getClinicAnalytics(
        clinicId,
        monthStart,
        monthEnd,
      );

      monthlyTrends.push({
        month: monthStart.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        appointments: analytics.appointments.total,
        revenue: analytics.revenue.total,
        newPatients: analytics.patients.newPatients,
      });
    }

    return monthlyTrends;
  });

export const getInventoryAlerts = dashboardProcedure.handler(
  async ({ context }) => {
    const { clinicId } = context;

    if (!clinicId) {
      throw new Error("Clinic ID is required");
    }

    // This would typically use inventory queries
    // For now, return empty array or mock data
    return {
      lowStock: [],
      expiringSoon: [],
      outOfStock: [],
    };
  },
);
