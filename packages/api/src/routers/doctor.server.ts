// orpc/router/doctor.ts

import { doctorQueries } from "@clinic-app/db/actions/queries";
import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import type {
  Day,
  DbDoctor,
  doctor,
  Status,
} from "@clinic-app/db/schema/index";
import {
  DoctorCreateSchema,
  DoctorSchema,
  DoctorUpdateSchema,
} from "@clinic-app/db/zod";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

const WorkingDaySchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const DoctorWithScheduleSchema = DoctorSchema.extend({
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
    })
    .nullable(),
  clinic: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  workingDays: z.array(WorkingDaySchema).nullable(),
});

// Procedures
export const doctorProcedures = {
  getDoctorWithSchedule: adminProcedure
    .input(z.object({ doctorId: z.string() }))
    .handler(async ({ input }) => {
      return await doctorQueries.getDoctorWithSchedule(input.doctorId);
    }),

  getDoctorPerformance: adminProcedure
    .input(
      z.object({
        doctorId: z.string(),
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
      if (input.endDate < new Date()) {
        throw new ORPCError("BAD_REQUEST", {
          message: "End date must be in the future",
        });
      }
      return await doctorQueries.getDoctorPerformance(
        input.doctorId,
        input.startDate,
        input.endDate,
      );
    }),

  updateDoctorSchedule: adminProcedure
    .input(
      z.object({
        doctorId: z.string(),
        workingDays: z.array(
          z.object({
            day: z.enum([
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
              "SUNDAY",
            ]),
            startTime: z.string(),
            endTime: z.string(),
            isActive: z.boolean().default(true),
          }),
        ),
      }),
    )
    .handler(async ({ input }) => {
      const formattedWorkingDays = input.workingDays.map((wd) => ({
        id: crypto.randomUUID(),
        doctorId: input.doctorId,
        day: wd.day,
        startTime: wd.startTime,
        endTime: wd.endTime,
        isActive: wd.isActive,
      }));

      return await doctorQueries.updateDoctorSchedule(
        input.doctorId,
        formattedWorkingDays,
      );
    }),
} as const;

// Create doctor
export const createDoctor = protectedProcedure
  .input(DoctorCreateSchema)
  .output(DoctorSchema)
  .handler(async ({ input, context }) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userRecord = await context.db.query.user.findFirst({
      where: { id: userId },
    });

    if (
      !userRecord ||
      (userRecord.role !== "admin" &&
        userRecord.role !== "superadmin" &&
        userRecord.role !== "staff")
    ) {
      throw new Error("Forbidden: Only admin/staff can create doctors");
    }

    let clinicId = input.clinicId;
    if (!clinicId && userRecord.clinicId) {
      clinicId = userRecord.clinicId;
    }

    const newDoctor = await mutations.doctor.create({
      ...input,
      clinicId: clinicId ?? null,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!newDoctor) {
      throw new Error("Failed to create doctor");
    }
    return newDoctor;
  });

// Get doctor by ID
export const getDoctor = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(DoctorWithScheduleSchema)
  .handler(async ({ input, context }) => {
    const result = await queries.doctor.getDoctorWithSchedule(
      input.id,
      context.clinicId ?? "",
    );
    if (!result) {
      throw new Error("Doctor not found");
    }
    return result;
  });

// Update doctor
export const updateDoctor = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      data: DoctorUpdateSchema,
    }),
  )
  .output(DoctorSchema)
  .handler(async ({ context, input }) => {
    const updatedDoctor = await mutations.doctor.update(input.id, {
      ...input.data,
      clinicId: context.clinicId ?? input.data.clinicId,
      updatedAt: new Date(),
    });

    if (!updatedDoctor) {
      throw new Error("Doctor not found");
    }

    return updatedDoctor;
  });

// Delete doctor (soft delete)
export const deleteDoctor = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean(), id: z.string() }))
  .handler(async ({ context, input }) => {
    const deletedDoctor = await mutations.doctor.softDelete(
      input.id,
      context.clinicId ?? "",
    );

    if (!deletedDoctor) {
      throw new Error("Doctor not found");
    }

    return { success: true, id: deletedDoctor.id };
  });

// Permanent delete doctor
export const permanentlyDeleteDoctor = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ context, input }) => {
    await mutations.doctor.delete(input.id, context.clinicId ?? "");
    return { success: true };
  });

// Get available doctors for a specific date
export const getAvailableDoctors = protectedProcedure
  .input(
    z.object({
      date: z.date(),
      specialty: z.string().optional(),
      clinicId: z.string().optional(),
    }),
  )
  .output(
    z.array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        available: z.boolean(),
      }),
    ),
  )
  .handler(async ({ context, input }) => {
    const slots = await queries.doctor.getAvailableTimeSlots(
      input.clinicId ?? context.clinicId ?? "",
      input.date,
    );
    return slots;
  });

// Get doctor schedule (working days)
export const getDoctorSchedule = protectedProcedure
  .input(z.object({ doctorId: z.string(), date: z.date().optional() }))
  .output(z.array(WorkingDaySchema))
  .handler(async ({ context, input }) => {
    const { workingDays } = await queries.doctor.getDoctorAvailability(
      context.user?.id ?? "",
      input.date ?? new Date(),
    );
    return workingDays;
  });

// Add working day to doctor schedule
export const addWorkingDay = protectedProcedure
  .input(
    z.object({
      doctorId: z.string(),
      day: z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
  )
  .output(z.array(WorkingDaySchema))
  .handler(async ({ context, input }) => {
    await queries.doctor.updateDoctorSchedule(input.doctorId, [
      {
        day: input.day as Day,
        startTime: input.startTime,
        endTime: input.endTime,
        id: context.user?.id ?? "",
        doctorId: input.doctorId,
      },
    ]);
    const { workingDays } = await queries.doctor.getDoctorAvailability(
      input.doctorId,
      new Date(),
    );
    return workingDays;
  });

// Remove working day
export const removeWorkingDay = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ context, input }) => {
    await mutations.doctor.deleteWorkingDay(input.id, context.clinicId ?? "");
    return { success: true };
  });

// List doctors with pagination and filters
export const listDoctors = protectedProcedure
  .input(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().optional(),

      search: z.string().optional(),
      status: z
        .enum([
          "ACTIVE",
          "INACTIVE",
          "PENDING",
          "SUSPENDED",
          "COMPLETED",
          "CANCELLED",
          "EXPIRED",
          "ON_HOLD",
        ])
        .optional(),
      isActive: z.boolean().optional(),
      specialty: z.string().optional(),
      clinicId: z.string().optional(),
      sortBy: z
        .enum(["name", "createdAt", "rating", "specialty"])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  )
  .output(
    z.object({
      doctors: z.array(DoctorSchema),
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
      offset: manualOffset,
      search,
      status,
      isActive,
      specialty,
      clinicId: inputClinicId,
      sortBy,
      sortOrder,
    } = input;
    const clinicId = inputClinicId ?? context.clinicId ?? "";

    const doctors = await context.db.query.doctor.findMany({
      where: {
        clinicId,
        isDeleted: false,
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
        ...(specialty && { specialty }),
        ...(search && {
          OR: [
            { name: { ilike: `%${search}%` } },
            { specialty: { ilike: `%${search}%` } },
          ],
        }),
      },
      orderBy: (table, { asc, desc }) => [
        sortOrder === "asc" ? asc(table[sortBy]) : desc(table[sortBy]),
      ],
    });

    const total = doctors.length;
    const start = manualOffset ?? (page - 1) * limit;
    const paginated = doctors.slice(start, start + limit);

    return {
      doctors: paginated.map((d) => ({
        ...d,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        deletedAt: d.deletedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });

// Get doctors by specialty
export const getDoctorsBySpecialty = protectedProcedure
  .input(
    z.object({
      specialty: z.string(),
      clinicId: z.string().optional(),
    }),
  )
  .output(z.array(DoctorSchema))
  .handler(async ({ context, input }): Promise<DbDoctor[]> => {
    const clinicId = input.clinicId ?? context.clinicId ?? "";
    const doctors = await context.db.query.doctor.findMany({
      where: { clinicId, specialty: input.specialty, isDeleted: false },
      orderBy: { name: "asc" },
    });

    return doctors;
  });

// Get doctor statistics
// Get doctor statistics
export const getDoctorStatistics = protectedProcedure
  .input(
    z.object({
      doctorId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .output(
    z.object({
      totalAppointments: z.number(),
      completedAppointments: z.number(),
      cancelledAppointments: z.number(),
      averageRating: z.number().nullable(),
      totalPatients: z.number(),
      totalRevenue: z.number(),
      upcomingAppointments: z.number(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { doctorId, startDate, endDate } = input;
    const performance = await queries.doctor.getDoctorPerformance(
      doctorId,
      startDate ?? new Date(0),
      endDate ?? new Date(),
      context.clinicId ?? "",
    );

    // Map the performance query results to match the expected output schema
    return {
      totalAppointments: performance.totalAppointments,
      completedAppointments: performance.completedAppointments,
      cancelledAppointments: performance.cancelledAppointments,
      averageRating: performance.averageRating,
      totalRevenue: performance.totalRevenue,
      totalPatients: 0, // Fallback as query doesn't provide this
      upcomingAppointments: 0, // Fallback as query doesn't provide this
    };
  });

// Bulk update doctor status
export const bulkUpdateDoctorStatus = protectedProcedure
  .input(
    z.object({
      doctorIds: z.array(z.string()),
      isActive: z.boolean(),
      status: z
        .enum([
          "ACTIVE",
          "INACTIVE",
          "PENDING",
          "SUSPENDED",
          "COMPLETED",
          "CANCELLED",
          "EXPIRED",
          "ON_HOLD",
        ])
        .optional(),
    }),
  )
  .output(z.object({ updatedCount: z.number() }))
  .handler(async ({ context, input }) => {
    const updateData: Partial<typeof doctor.$inferInsert> = {
      isActive: input.isActive,
      clinicId: context.clinicId,
      updatedAt: new Date(),
    };

    if (input.status) {
      updateData.status = input.status as Status;
    }
    const result = await mutations.doctor.updateMany(
      input.doctorIds,
      updateData,
    );
    return { updatedCount: result.length };
  });

// Get unique specialties
export const getSpecialties = protectedProcedure
  .input(
    z.object({
      clinicId: z.string().optional(),
    }),
  )
  .output(z.array(z.string()))
  .handler(async ({ context }): Promise<string[]> => {
    const categories = await queries.service.getServiceCategories(
      context.clinicId ?? "",
    );
    return categories.filter((c): c is string => c !== null);
  });

export const doctorRouter = {
  create: createDoctor,
  get: getDoctor,
  update: updateDoctor,
  delete: deleteDoctor,
  permanentlyDelete: permanentlyDeleteDoctor,
  getAvailable: getAvailableDoctors,
  getSchedule: getDoctorSchedule,
  addWorkingDay,
  removeWorkingDay,
  list: listDoctors,
  getStats: getDoctorStatistics,
  bulkUpdateDoctorStatus,
  getSpecialties,
};
