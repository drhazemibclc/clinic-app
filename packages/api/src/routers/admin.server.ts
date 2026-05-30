import {
  createWelcomeNotification,
  getUserRoleById,
} from "@clinic-app/db/actions/admin";
import {
  archiveOldRecords,
  createUser,
  deleteUser,
  updateUser,
} from "@clinic-app/db/actions/mutations";
import {
  appointmentQueries,
  clinicQueries,
  reportingQueries,
  searchQueries,
} from "@clinic-app/db/actions/queries";
import {
  type AppointmentStatus,
  AppointmentStatusSchema,
  type Doctor,
  RoleSchema,
} from "@clinic-app/db/zod";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, requireClinicId } from "..";
import { AdminDashboardStatsSchema, UpdateUserInputSchema } from "../types";
import { UserAuthSchema } from "./auth.server";

// ============================================================================
// Main Admin Dashboard Procedure
// ============================================================================
export const getAdminDashboardStats = adminProcedure
  .output(AdminDashboardStatsSchema)
  .handler(
    async ({ context }): Promise<z.infer<typeof AdminDashboardStatsSchema>> => {
      const clinicId = context.clinicId ?? "";
      // Run queries in parallel for better performance
      const [clinicStats, appointmentCounts, monthlyData] = await Promise.all([
        clinicQueries.getClinicDashboard(clinicId),
        appointmentQueries.getAppointmentCountsByStatus(clinicId),
        appointmentQueries.getMonthlyAppointmentData(
          clinicId,
          new Date().getFullYear(),
        ),
      ]);

      // Transform appointment counts with proper typing
      const appointmentCountsArray = appointmentCounts as unknown as Array<{
        status: AppointmentStatus;
        count: number;
      }>;

      const appointmentCountsMap = appointmentCountsArray.reduce(
        (acc: Record<string, number>, { status, count }) => {
          if (status && status in acc) {
            acc[status] = count;
          }
          return acc;
        },
        {
          SCHEDULED: 0,
          COMPLETED: 0,
          CANCELLED: 0,
          PENDING: 0,
          NO_SHOW: 0,
          CONFIRMED: 0,
        },
      );

      // Format available doctors
      const formattedAvailableDoctors = (
        (clinicStats.topDoctors as Doctor[]) || []
      ).map((doctor: Doctor) => ({
        id: doctor.id ?? "",
        name: doctor.name,
        specialty: doctor.specialty ?? null,
        available: doctor.isActive ?? false,
        nextAvailableTime: null as string | null,
      }));

      // Format recent records
      const formattedLast5Records = (
        (clinicStats.recentAppointments as unknown as typeof clinicStats.recentAppointments) ||
        []
      ).map((record) => ({
        id: record.id,
        patientName: record.patient
          ? `${record.patient.firstName} ${record.patient.lastName}`
          : "Unknown Patient",
        doctorName: record.doctor?.name ?? "Unknown Doctor",
        appointmentDate: record.appointmentDate,
        status: (record.status ?? "PENDING") as AppointmentStatus,
        type: record.type ?? null,
      }));

      return {
        availableDoctors: formattedAvailableDoctors,
        last5Records: formattedLast5Records,
        appointmentCounts: appointmentCountsMap as z.infer<
          typeof AdminDashboardStatsSchema
        >["appointmentCounts"],
        monthlyData: monthlyData.map((d) => ({
          month: d.month.toString(),
          appointments: Number(d.count),
        })),
        totalDoctors: clinicStats.stats.doctors,
        totalPatient: clinicStats.stats.patients,
        totalAppointments: clinicStats.stats.appointments,
      };
    },
  );

export const searchProcedures = {
  searchPatients: adminProcedure
    .input(
      z.object({
        clinicId: z.string(),
        searchTerm: z.string().min(1),
      }),
    )
    .handler(async ({ input }) => {
      return await searchQueries.searchPatients(
        input.clinicId,
        input.searchTerm,
      );
    }),

  advancedSearch: adminProcedure
    .input(
      z.object({
        clinicId: z.string().optional(),
        patientName: z.string().optional(),
        doctorName: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        status: AppointmentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      return await searchQueries.advancedSearch(input);
    }),
} as const;

// ============================================================================
// Notification Procedures
// ============================================================================

// ============================================================================
// Reporting Procedures
// ============================================================================

export const reportingProcedures = {
  getClinicAnalytics: adminProcedure
    .input(
      z.object({
        clinicId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .handler(async ({ input }) => {
      if (input.startDate > input.endDate) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Start date must be before end date",
        });
      }
      return await reportingQueries.getClinicAnalytics(
        input.clinicId,
        input.startDate,
        input.endDate,
      );
    }),

  getPopularServices: adminProcedure
    .input(
      z.object({
        clinicId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .handler(async ({ input }) => {
      return await reportingQueries.getPopularServices(
        input.clinicId,
        input.startDate,
        input.endDate,
      );
    }),

  getDoctorPerformanceReport: adminProcedure
    .input(
      z.object({
        clinicId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .handler(async ({ input }) => {
      return await reportingQueries.getDoctorPerformanceReport(
        input.clinicId,
        input.startDate,
        input.endDate,
      );
    }),
} as const;

// ============================================================================
// User Management Procedures
// ============================================================================

export const userManagementProcedures = {
  createUser: adminProcedure
    .input(UserAuthSchema)
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await createUser({
        email: input.email,
        name: input.name,
        role: input.role,
        phone: input.phone,
        address: input.address,
        clinicId,
        id: context.user?.id ?? "",
      });
    }),

  updateUser: adminProcedure
    .input(UpdateUserInputSchema)
    .handler(async ({ input }) => {
      return await updateUser(input.id, input);
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return await deleteUser(input.id);
    }),
} as const;

// ============================================================================
// Archive Procedures
// ============================================================================

export const archiveProcedures = {
  archiveOldRecords: adminProcedure
    .input(
      z.object({
        daysOld: z.number().min(30).max(1095), // 30 days to 3 years
        appointmentIds: z.array(z.string()).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const clinicId = requireClinicId(context.user?.clinicId);
      return await archiveOldRecords({
        appointmentsIds: input.appointmentIds ?? [],
        daysOld: input.daysOld,
        clinicId,
      });
    }),
} as const;

// ============================================================================
// Auth Procedures
// ============================================================================

export const userAuthProcedures = {
  listUsers: adminProcedure.handler(async ({ context }) => {
    const result = await context.auth?.api.listUsers();
    if (!result?.users) {
      throw new ORPCError("NOT_FOUND", { message: "No users found" });
    }
    return result.users;
  }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: RoleSchema,
      }),
    )
    .handler(async ({ input, context }) => {
      return await context.auth.api.setRole({
        body: {
          userId: input.userId,
          role: input.role,
        },
        headers: context.headers,
      });
    }),

  createUser: publicProcedure
    .input(UserAuthSchema)
    .handler(async ({ input, context }) => {
      // Validate required fields for signup
      if (!input.email || !input.name || !input.role) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Email, name, and role are required",
        });
      }

      const user = await createUser({
        email: input.email,
        name: input.name,
        role: input.role,
        phone: input.phone,
        id: context.user?.id ?? "",
        address: input.address,
        clinicId: input.clinicId ?? context.user?.clinicId,
      });

      if (!user) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user",
        });
      }

      // Create welcome notification using extracted service
      await createWelcomeNotification(
        user.id,
        input.clinicId ?? context.user?.clinicId ?? "",
        new Date(),
      );

      return user;
    }),

  getCurrentUser: adminProcedure.handler(async ({ context }) => {
    const user = await context.auth.api.getUser();
    if (!user) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }
    return user;
  }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        email: z.email().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        clinicId: z.string().optional(),
        address: z.string().optional(),
        role: RoleSchema.optional(),
        password: z.string().min(6).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const updatedUser = await updateUser(input.userId, {
        email: input.email,
        name: input.name,
        role: input.role,
        phone: input.phone,
        clinicId: context.clinicId,
        address: input.address,
      });

      if (!updatedUser) {
        throw new ORPCError("NOT_FOUND", {
          message: "User update failed: User not found",
        });
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      await context.auth.api.banUser({
        body: { userId: input.userId },
        headers: context.headers,
      });
      return { success: true, message: `User ${input.userId} has been banned` };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      await context.auth.api.unbanUser({
        body: { userId: input.userId },
        headers: context.headers,
      });
      return {
        success: true,
        message: `User ${input.userId} has been unbanned`,
      };
    }),

  removeUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      await deleteUser(input.userId);
      await context.auth.api.removeUser({
        body: { userId: input.userId },
        headers: context.headers,
      });
      return {
        success: true,
        message: `User ${input.userId} has been removed`,
      };
    }),

  revokeAllUserSessions: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      await context.auth.api.revokeUserSessions({
        body: { userId: input.userId },
        headers: context.headers,
      });
      return {
        success: true,
        message: `All sessions revoked for user ${input.userId}`,
      };
    }),

  getUserRole: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input }) => {
      const result = await getUserRoleById(input.userId);

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "User not found" });
      }

      return result.role;
    }),
} as const;

// ============================================================================
// Main Router Export
// ============================================================================

export const adminRouter = {
  search: searchProcedures,
  reporting: reportingProcedures,
  archive: archiveProcedures,
  manage: userManagementProcedures,
  userAuth: userAuthProcedures,
} as const;
