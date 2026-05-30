// routers/clinic.router.ts

import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { roleEnum } from "@clinic-app/db/schema/index";
import { z } from "zod";
import { protectedProcedure } from "../index";

// Create clinic (admin only)
export const createClinic = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      email: z.email().optional(),
      timezone: z.string().default("UTC"),
      address: z.string().optional(),
      phone: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const newClinic = await mutations.clinic.create({
      id: crypto.randomUUID(),
      ...input,
    });

    // Create default clinic settings
    await mutations.clinic.setting.create({
      id: crypto.randomUUID(),
      clinicId: newClinic?.id ?? "",
      openingTime: "09:00",
      closingTime: "17:00",
      workingDays: "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
    });

    return newClinic;
  });

// Add member to clinic
export const addClinicMember = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      userId: z.string(),
      role: z.enum(roleEnum.enumValues),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const member = await mutations.clinic.member.create({
      userId: input.userId,
      clinicId: input.clinicId,
      role: input.role,
    });

    // Update user's clinicId
    await mutations.user.update(input.userId, { clinicId: input.clinicId });

    return member;
  });

// Get clinic dashboard stats
export const getClinicStats = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(
    z.object({
      totalPatients: z.number(),
      totalDoctors: z.number(),
      totalAppointments: z.number(),
      pendingAppointments: z.number(),
      completedAppointments: z.number(),
      cancelledAppointments: z.number(),
      revenue: z.number().optional(),
      appointmentCompletionRate: z.number(),
      averageWaitTimeDays: z.number().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const dashboardData = await queries.clinic.getClinicDashboard(
      input.clinicId,
    );

    // Get appointment stats by status using appointment queries
    const allAppointments = await queries.appointment.getAllAppointments(
      input.clinicId,
    );

    const pendingAppointments = allAppointments.filter(
      (a) => a.status === "PENDING",
    ).length;
    const completedAppointments = allAppointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelledAppointments = allAppointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;

    const completionRate =
      dashboardData.stats.appointments > 0
        ? (completedAppointments / dashboardData.stats.appointments) * 100
        : 0;

    return {
      totalPatients: dashboardData.stats.patients,
      totalDoctors: dashboardData.stats.doctors,
      totalAppointments: dashboardData.stats.appointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      revenue: dashboardData.stats.revenue,
      appointmentCompletionRate: completionRate,
    };
  });

// Get clinic details with full information
export const getClinicDetails = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(z.any())
  .handler(async ({ input }) => {
    const clinic = await queries.clinic.getFullClinic(input.clinicId);

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    return clinic;
  });

// Update clinic information
export const updateClinic = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      name: z.string().optional(),
      email: z.email().optional(),
      timezone: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, ...updateData } = input;

    const updatedClinic = await mutations.clinic.update(clinicId, updateData);

    if (!updatedClinic) {
      throw new Error("Clinic not found");
    }

    return updatedClinic;
  });

// Soft delete clinic
export const deleteClinic = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .handler(async ({ input }) => {
    const deletedClinic = await mutations.clinic.softDelete(input.clinicId);

    if (!deletedClinic) {
      throw new Error("Clinic not found");
    }

    return { success: true, message: "Clinic deleted successfully" };
  });

// Restore soft-deleted clinic
export const restoreClinic = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .handler(async ({ input }) => {
    const restoredClinic = await mutations.clinic.restore(input.clinicId);

    if (!restoredClinic) {
      throw new Error("Clinic not found");
    }

    return { success: true, message: "Clinic restored successfully" };
  });

// Get all clinic members
export const getClinicMembers = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(z.any())
  .handler(async ({ input }) => {
    // Use db.query since there's no direct clinic member query yet
    const members = await queries.user.getUserWithAllRelations(input.clinicId);

    return members?.clinicMemberships || [];
  });

// Remove member from clinic
export const removeClinicMember = protectedProcedure
  .input(z.object({ userId: z.string(), clinicId: z.string() }))
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .handler(async ({ input }) => {
    const deleted = await mutations.clinic.member.delete(input.userId);

    if (deleted) {
      // Clear user's clinicId if they're no longer a member
      await mutations.user.update(input.userId, { clinicId: null });
    }

    return { success: true, message: "Member removed successfully" };
  });

// Get clinic settings
export const getClinicSettings = protectedProcedure
  .input(z.object({ clinicId: z.string() }))
  .output(z.any())
  .handler(async ({ input }) => {
    const settings = await queries.clinic.getFullClinic(input.clinicId);

    return settings || null;
  });

// Update clinic settings
export const updateClinicSettings = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      openingTime: z.string().optional(),
      closingTime: z.string().optional(),
      workingDays: z.string().optional(),
      defaultAppointmentDuration: z.number().optional(),
      requireEmergencyContact: z.boolean().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, ...settingsData } = input;

    // Get existing settings
    const existingSettings = await queries.clinic.getFullClinic(clinicId);

    if (!existingSettings) {
      // Create new settings if none exist
      const newSettings = await mutations.clinic.setting.create({
        id: crypto.randomUUID(),
        clinicId,
        openingTime: settingsData.openingTime || "09:00",
        closingTime: settingsData.closingTime || "17:00",
        workingDays:
          settingsData.workingDays ||
          "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY",
        defaultAppointmentDuration:
          settingsData.defaultAppointmentDuration || 30,
        requireEmergencyContact: settingsData.requireEmergencyContact ?? true,
      });
      return newSettings;
    }

    // Update existing settings
    const updatedSettings = await mutations.clinic.setting.update(
      existingSettings.id,
      settingsData,
    );

    return updatedSettings;
  });

// Get clinic statistics for pediatrics
export const getClinicPediatricStats = protectedProcedure
  .input(z.object({ clinicId: z.string(), patientId: z.string() }))
  .output(
    z.object({
      totalPediatricPatients: z.number(),
      patientsByAgeGroup: z.object({
        infants: z.number(), // 0-12 months
        toddlers: z.number(), // 1-3 years
        preschoolers: z.number(), // 3-5 years
        schoolAge: z.number(), // 5-12 years
        adolescents: z.number(), // 12-18 years
      }),
      vaccinationRate: z.number(),
      completedWellnessVisits: z.number(),
      pendingWellnessVisits: z.number(),
      growthConcerns: z.number(),
      developmentalDelays: z.number(),
      nutritionalIssues: z.number(),
    }),
  )
  .handler(async ({ input }) => {
    const { clinicId, patientId } = input;

    // Get all patients in clinic
    const allPatients = await queries.user.getPatientsByAgeRange(
      clinicId,
      0,
      216,
    ); // 0-18 years

    // Categorize by age
    const now = new Date();
    const patientsByAgeGroup = {
      infants: 0, // 0-12 months
      toddlers: 0, // 1-3 years
      preschoolers: 0, // 3-5 years
      schoolAge: 0, // 5-12 years
      adolescents: 0, // 12-18 years
    };

    for (const patient of allPatients) {
      const ageInMonths =
        (now.getTime() - patient.dateOfBirth.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44);

      if (ageInMonths < 12) patientsByAgeGroup.infants++;
      else if (ageInMonths < 36) patientsByAgeGroup.toddlers++;
      else if (ageInMonths < 60) patientsByAgeGroup.preschoolers++;
      else if (ageInMonths < 144) patientsByAgeGroup.schoolAge++;
      else patientsByAgeGroup.adolescents++;
    }

    // Get vaccination statistics
    const vaccineStatus =
      await queries.vaccine.getVaccineInventoryStatus(clinicId);

    // Get growth and development concerns from medical records
    const medicalRecords =
      (await queries.medicalRecord.getPatientMedicalRecords(
        patientId,
        clinicId,
        100,
        0,
      )) || [];

    const growthConcerns = medicalRecords.filter(
      (r: { notes: string | null }) =>
        r.notes?.toLowerCase().includes("growth concern") ||
        r.notes?.toLowerCase().includes("failure to thrive"),
    ).length;

    const developmentalDelays = medicalRecords.filter(
      (r: { notes: string | null }) =>
        r.notes?.toLowerCase().includes("developmental delay") ||
        r.notes?.toLowerCase().includes("milestone delay"),
    ).length;

    const nutritionalIssues = medicalRecords.filter(
      (r: { notes: string | null }) =>
        r.notes?.toLowerCase().includes("malnutrition") ||
        r.notes?.toLowerCase().includes("nutritional"),
    ).length;

    // Get wellness visit completion rate
    const allAppointments =
      await queries.appointment.getAllAppointments(clinicId);
    const wellnessAppointments = allAppointments.filter(
      (a) => a.type === "WELLNESS" || a.type === "CHECKUP",
    );
    const completedWellnessVisits = wellnessAppointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const pendingWellnessVisits = wellnessAppointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED",
    ).length;

    const vaccinationRate =
      allPatients.length > 0
        ? (vaccineStatus.totalDoses / (allPatients.length * 10)) * 100 // Assuming ~10 vaccines per child
        : 0;

    return {
      totalPediatricPatients: allPatients.length,
      patientsByAgeGroup,
      vaccinationRate: Math.min(vaccinationRate, 100),
      completedWellnessVisits,
      pendingWellnessVisits,
      growthConcerns,
      developmentalDelays,
      nutritionalIssues,
    };
  });

// Get clinic revenue report
export const getClinicRevenueReport = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      groupBy: z.enum(["day", "week", "month", "year"]).default("month"),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, startDate, endDate } = input;

    const analytics = await queries.reporting.getClinicAnalytics(
      clinicId,
      startDate,
      endDate,
    );

    return {
      period: { startDate, endDate },
      totalRevenue: analytics.revenue.total,
      revenueByMethod: analytics.revenue.byMethod,
      averagePerAppointment: analytics.revenue.averagePerAppointment,
      appointmentsCompleted: analytics.appointments.completed,
      newPatients: analytics.patients.newPatients,
      prescriptionsIssued: analytics.prescriptions,
    };
  });

// Get doctor performance in clinic
export const getClinicDoctorPerformance = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      limit: z.number().default(10),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, startDate, endDate, limit } = input;

    const doctors = await queries.reporting.getDoctorPerformanceReport(
      clinicId,
      startDate,
      endDate,
    );

    return doctors.slice(0, limit);
  });

// Get popular services in clinic
export const getClinicPopularServices = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      limit: z.number().default(10),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, startDate, endDate, limit } = input;

    const popularServices = await queries.reporting.getPopularServices(
      clinicId,
      startDate,
      endDate,
    );

    return popularServices.slice(0, limit);
  });

// Get clinic appointments by date range
export const getClinicAppointmentsByDateRange = protectedProcedure
  .input(
    z.object({
      clinicId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      doctorId: z.string().optional(),
      status: z.string().optional(),
    }),
  )
  .output(z.any())
  .handler(async ({ input }) => {
    const { clinicId, startDate, endDate, doctorId, status } = input;

    const appointments = await queries.appointment.getAppointmentsInRange(
      clinicId,
      startDate,
      endDate,
      doctorId,
    );

    if (status) {
      return appointments.filter((a) => a.status === status);
    }

    return appointments;
  });

// Export all procedures
export const clinicRouter = {
  createClinic,
  addClinicMember,
  getClinicStats,
  getClinicDetails,
  updateClinic,
  deleteClinic,
  restoreClinic,
  getClinicMembers,
  removeClinicMember,
  getClinicSettings,
  updateClinicSettings,
  getClinicPediatricStats,
  getClinicRevenueReport,
  getClinicDoctorPerformance,
  getClinicPopularServices,
  getClinicAppointmentsByDateRange,
};
