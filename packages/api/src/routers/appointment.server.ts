// ============================================================================
// Input Schemas
// ============================================================================

import * as mutations from "@clinic-app/db/mutations";
import { AppointmentSchema } from "@clinic-app/db/zod/clinic.schema";
import z from "zod";
import { clinicProcedure, protectedProcedure } from "..";
import {
  BulkUpdateStatusSchema,
  CreateAppointmentWithReminderSchema,
  GetAppointmentsInRangeSchema,
  GetAppointmentsSchema,
  GetAvailableTimeSlotsSchema,
  GetDoctorAvailabilitySchema,
  ListAppointmentsSchema,
  RescheduleAppointmentSchema,
  UpdateAppointmentStatusSchema,
} from "../types";
// ============================================================================
// Appointment Procedures
// ============================================================================
export const appointmentProcedures = {
  updateStatus: protectedProcedure
    .input(UpdateAppointmentStatusSchema)
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await mutations.updateAppointment(input.id, {
        status: input.status as AppointmentStatus,
        clinicId,
      });
    }),

  bulkUpdateStatus: protectedProcedure
    .input(BulkUpdateStatusSchema)
    .handler(async ({ input }) => {
      return await mutations.updateManyAppointments(input.appointmentIds, {
        status: input.status as AppointmentStatus,
      });
    }),

  cancel: protectedProcedure
    .input(CancelAppointmentSchema)
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await mutations.updateAppointment(input.id, {
        status: "CANCELLED",
        clinicId,
        // notes: input.reason // if supported by mutation
      });
    }),

  reschedule: protectedProcedure
    .input(RescheduleAppointmentSchema)
    .handler(async ({ input }) => {
      const appointmentDate = new Date(`${input.newDate}T${input.newTime}`);
      return await mutations.updateAppointment(input.id, {
        appointmentDate,
        // reason: input.reason // if supported by mutation
      });
    }),
};

// Create appointment
export const createAppointment = clinicProcedure
  .input(AppointmentSchema)
  .output(z.any())
  .handler(async ({ input, context }) => {
    const clinicId = context.clinicId ?? "";
    return await createNewAppointment(input, clinicId);
  });

// Update appointment
export const updateAppointment = clinicProcedure
  .input(AppointmentSchema.partial())
  .output(z.any())
  .handler(async ({ input, context }) => {
    if (!input.id) {
      throw new Error("Appointment ID is required for update");
    }

    const clinicId = context.clinicId ?? "";

    // 1. Remove undefined values to satisfy the Drizzle/TypeScript strict types
    // This removes any keys that were not provided in the partial input
    const updateData = Object.fromEntries(
      Object.entries(input).filter(([_, value]) => value !== undefined),
    );

    return await updateExistingAppointment(input.id, {
      ...updateData,
      id: input.id,
      clinicId,
      time: null,
      type: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: null,
      deletedAt: null,
      isDeleted: null,
      appointmentPrice: null,
      doctorId: "",
      patientId: "",
      serviceId: null,
      doctorSpecialty: null,
      appointmentDate: new Date(),
      durationMinutes: null,
      note: null,
      reason: null,
    });
  });
// Update appointment status
export const updateAppointmentStatus = protectedProcedure
  .input(UpdateAppointmentStatusSchema)
  .output(z.any())
  .handler(async ({ input }) => {
    // const _clinicId = context.clinicId ?? "";
    return await mutations.updateAppointmentStatus(input.id, input.status);
  });

// Bulk update appointment status
export const bulkUpdateAppointmentStatus = protectedProcedure
  .input(BulkUpdateStatusSchema)
  .output(z.array(z.any()))
  .handler(async ({ input }) => {
    // const _clinicId = .clinicId ?? "";
    return await bulkUpdateAppointmentsStatus(
      input.appointmentIds,
      input.status,
      input.reason,
    );
  });

// Cancel appointment
export const cancelAppointment = protectedProcedure
  .input(CancelAppointmentSchema)
  .output(z.any())
  .handler(async ({ input, context }) => {
    const clinicId = requireClinicId(context.clinicId);
    return await cancelExistingAppointment(input.id, clinicId, input.reason);
  });

// Reschedule appointment
export const rescheduleAppointment = protectedProcedure
  .input(RescheduleAppointmentSchema)
  .output(z.any())
  .handler(async ({ input }) => {
    return await rescheduleExistingAppointment(
      input.id,
      input.newDate,
      input.newTime,
      input.reason,
    );
  });

// Get appointments in range
export const getAppointmentsInRange = protectedProcedure
  .input(GetAppointmentsInRangeSchema)
  .output(z.array(z.any()))
  .handler(async ({ input, context }) => {
    const clinicId = requireClinicId(context.clinicId);
    const { startDate, endDate, doctorId } = input;
    return await appointmentQueries.getAppointmentsInRange(
      clinicId,
      startDate,
      endDate,
      doctorId,
    );
  });

// Get paginated appointments
export const getAppointments = protectedProcedure
  .input(GetAppointmentsSchema)
  .handler(async ({ input, context }) => {
    const clinicId = requireClinicId(context.clinicId);
    const { page, limit, status, doctorId, patientId } = input;
    return await appointmentQueries.getAppointmentsFallbackPaginated(
      clinicId,
      page,
      limit,
      status,
      doctorId,
      patientId,
    );
  });

// Get appointment by ID
export const getAppointmentById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .output(z.any())
  .handler(async ({ input, context }) => {
    const clinicId = requireClinicId(context.clinicId);
    return await appointmentQueries.getAppointmentById(input.id, clinicId);
  });

// List appointments with advanced filters
export const listAppointments = protectedProcedure
  .input(ListAppointmentsSchema)
  .output(
    z.object({
      appointments: z.array(z.any()),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const clinicId = requireClinicId(context.clinicId);
    const { page, limit, ...filters } = input;
    return await searchAppointments(clinicId, filters, { page, limit });
  });

// Get doctor availability
export const getDoctorAvailability = protectedProcedure
  .input(GetDoctorAvailabilitySchema)
  .handler(async ({ input }) => {
    return await doctorQueries.getDoctorAvailability(
      input.doctorId,
      input.date,
    );
  });

// Get available time slots
export const getAvailableTimeSlots = protectedProcedure
  .input(GetAvailableTimeSlotsSchema)
  .handler(async ({ input }) => {
    return await doctorQueries.getAvailableTimeSlots(
      input.doctorId,
      input.date,
      input.durationMinutes,
    );
  });

// Create appointment with reminder
export const createAppointmentWithReminder = protectedProcedure
  .input(CreateAppointmentWithReminderSchema)
  .handler(async ({ input }) => {
    return await mutations.createAppointmentWithReminder(
      input.data,
      input.reminderData,
    );
  });

// ============================================================================
// Main Router Export
// ============================================================================

export const appointmentRouter = {
  // Core CRUD operations
  create: createAppointment,
  update: updateAppointment,
  getById: getAppointmentById,

  // Status management
  updateStatus: updateAppointmentStatus,
  bulkUpdateStatus: bulkUpdateAppointmentStatus,
  cancel: cancelAppointment,
  reschedule: rescheduleAppointment,

  // Query operations
  list: listAppointments,
  get: getAppointments,
  getInRange: getAppointmentsInRange,

  // Doctor availability
  getDoctorAvailability,
  getAvailableTimeSlots,

  // Advanced operations
  createWithReminder: createAppointmentWithReminder,
} as const;

import {
  bulkUpdateAppointmentsStatus,
  cancelExistingAppointment,
  createNewAppointment,
  rescheduleExistingAppointment,
  searchAppointments,
  updateExistingAppointment,
} from "@clinic-app/db/actions/appointment";
import {
  appointmentQueries,
  doctorQueries,
} from "@clinic-app/db/actions/queries";
import type { AppointmentStatus } from "@clinic-app/db/schema";
import { requireClinicId } from "..";
import { CancelAppointmentSchema } from "../types";
