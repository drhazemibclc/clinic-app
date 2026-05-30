// packages/api/src/routers/calendar.server.ts
import {
  calculateAvailableSlots,
  checkSlotAvailability,
  createAppointmentReminders,
  formatEventType,
  getDoctorWorkingHours,
  getEventColor,
  mapAppointmentTypeToEventType,
  mapEventTypeToAppointmentType,
} from "@clinic-app/db/actions/calendar";
import {
  appointmentQueries,
  doctorQueries,
} from "@clinic-app/db/actions/queries";
import { mutations } from "@clinic-app/db/mutations";
import type { AppointmentStatus } from "@clinic-app/db/schema";
import { z } from "zod";
import { clinicProcedure } from "../index";
import { CreateAppointmentWithReminderSchema } from "../types";

// ============================================================================
// Types & Schemas
// ============================================================================

const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.date(),
  end: z.date(),
  allDay: z.boolean().default(false),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  extendedProps: z.object({
    patientId: z.string(),
    patientName: z.string(),
    doctorId: z.string(),
    doctorName: z.string(),
    type: z.string(),
    status: z.string(),
    notes: z.string().nullable(),
    appointmentId: z.string(),
  }),
});

const GetCalendarEventsSchema = z.object({
  start: z.date(),
  end: z.date(),
  doctorId: z.string().optional(),
  status: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
});

const UpdateCalendarEventSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  notes: z.string().optional(),
});

const BulkUpdateSchema = z.object({
  eventIds: z.array(z.string()),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED"]),
  reason: z.string().optional(),
});

const GetAvailabilitySchema = z.object({
  doctorId: z.string(),
  date: z.date(),
  duration: z.number().default(30),
});

const GetAvailableSlotsSchema = z.object({
  doctorId: z.string(),
  date: z.date(),
  duration: z.number().default(30),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// ============================================================================
// Calendar Procedures
// ============================================================================

// Get calendar events for date range
export const getCalendarEvents = clinicProcedure
  .input(GetCalendarEventsSchema)
  .output(z.array(CalendarEventSchema))
  .handler(async ({ input, context }) => {
    const { start, end, doctorId } = input;
    const clinicId = context.clinicId ?? "";

    const appointments = await appointmentQueries.getAppointmentsInRange(
      clinicId,
      start,
      end,
      doctorId,
    );

    // Transform to calendar events
    return appointments.map((apt) => {
      const duration = apt.durationMinutes || 30;
      const endTime = new Date(apt.appointmentDate);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const typeColor = getEventColor(apt.type || "sick-visit");

      return {
        id: apt.id,
        title: `${apt.patient?.firstName || "Unknown"} ${apt.patient?.lastName || ""} - ${formatEventType(apt.type)}`,
        start: apt.appointmentDate,
        end: endTime,
        allDay: false,
        backgroundColor: typeColor,
        borderColor: typeColor,
        textColor: "#ffffff",
        extendedProps: {
          patientId: apt.patientId,
          patientName: `${apt.patient?.firstName || "Unknown"} ${apt.patient?.lastName || ""}`,
          doctorId: apt.doctorId,
          doctorName: apt.doctor?.name || "Unassigned",
          type: apt.type || "sick-visit",
          status: apt.status || "SCHEDULED",
          notes: apt.note,
          appointmentId: apt.id,
        },
      };
    });
  });

// Create calendar event (appointment) - Using mutations
export const createCalendarEvent = clinicProcedure
  .input(CreateAppointmentWithReminderSchema)
  .output(CalendarEventSchema)
  .handler(async ({ input, context }) => {
    const { data, reminderData } = input;
    const {
      appointmentDate: start,
      patientId,
      doctorId,
      type,
      note: notes,
      durationMinutes: duration,
    } = data;
    const clinicId = context.clinicId ?? "";
    const appointmentDuration = duration || 30;
    const end = new Date(
      new Date(start).getTime() + appointmentDuration * 60000,
    );

    // Check if slot is available using queries
    const availableSlots = await doctorQueries.getAvailableTimeSlots(
      doctorId,
      new Date(start),
      appointmentDuration,
    );

    const isSlotAvailable = availableSlots.some(
      (slot) =>
        new Date(slot.startTime).getTime() === new Date(start).getTime(),
    );

    if (!isSlotAvailable) {
      throw new Error("Selected time slot is not available");
    }

    // Get patient and doctor info using queries
    const patientData = await context.db.query.patient.findFirst({
      where: { id: patientId },
      columns: { firstName: true, lastName: true },
    });

    const doctorData = await context.db.query.doctor.findFirst({
      where: { id: doctorId },
      columns: { name: true },
    });

    const patientName = patientData
      ? `${patientData.firstName} ${patientData.lastName}`
      : "Unknown";

    // Create appointment using mutation
    const newAppointment = await mutations.appointment.create({
      id: crypto.randomUUID(),
      clinicId,
      patientId,
      doctorId,
      appointmentDate: new Date(start),
      durationMinutes: appointmentDuration,
      type: mapEventTypeToAppointmentType(type || "sick-visit"),
      status: "PENDING",
      note: notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      time: new Date(start).toLocaleTimeString(),
    });

    if (!newAppointment) {
      throw new Error("Failed to create appointment");
    }

    // Create reminders if requested using calendar helper
    if (reminderData) {
      await createAppointmentReminders(newAppointment.id, new Date(start));
    }

    const eventType = type || "sick-visit";

    // Return calendar event
    return {
      id: newAppointment.id,
      title: `${patientName} - ${formatEventType(eventType)}`,
      start: new Date(start),
      end,
      allDay: false,
      backgroundColor: getEventColor(eventType),
      borderColor: getEventColor(eventType),
      textColor: "#ffffff",
      extendedProps: {
        patientId,
        patientName,
        doctorId,
        doctorName: doctorData?.name || "Unassigned",
        type: eventType,
        status: "SCHEDULED",
        notes: notes || null,
        appointmentId: newAppointment.id,
      },
    };
  });

// Update calendar event - Using mutations
export const updateCalendarEvent = clinicProcedure
  .input(UpdateCalendarEventSchema)
  .output(CalendarEventSchema)
  .handler(async ({ input, context }) => {
    const { id, start, end, status, notes } = input;
    const clinicId = context.clinicId ?? "";

    // Get existing appointment using queries
    const existingAppointment = await appointmentQueries.getAppointmentById(
      id,
      clinicId,
    );

    if (!existingAppointment) {
      throw new Error("Appointment not found");
    }

    // If rescheduling, check availability
    if (
      start &&
      start.getTime() !== existingAppointment.appointmentDate.getTime()
    ) {
      const isAvailable = await checkSlotAvailability(
        existingAppointment.doctorId,
        start,
        end ||
          new Date(
            start.getTime() +
              (existingAppointment.durationMinutes || 30) * 60000,
          ),
        clinicId,
        id,
      );

      if (!isAvailable) {
        throw new Error("Selected time slot is not available");
      }
    }

    // Update appointment using mutation
    const updatedAppointment = await mutations.appointment.update(id, {
      appointmentDate: start || existingAppointment.appointmentDate,
      durationMinutes:
        start && end
          ? Math.round((end.getTime() - start.getTime()) / (1000 * 60))
          : existingAppointment.durationMinutes,
      status: (status as AppointmentStatus) || existingAppointment.status,
      note: notes !== undefined ? notes : existingAppointment.note,
      updatedAt: new Date(),
    });

    if (!updatedAppointment) {
      throw new Error("Failed to update appointment");
    }

    const eventStart = start || existingAppointment.appointmentDate;
    const eventEnd =
      end ||
      new Date(
        eventStart.getTime() +
          (existingAppointment.durationMinutes || 30) * 60000,
      );
    const eventType = mapAppointmentTypeToEventType(existingAppointment.type);
    const patientName = existingAppointment.patient
      ? `${existingAppointment.patient.firstName} ${existingAppointment.patient.lastName}`
      : "Unknown";

    return {
      id: updatedAppointment.id,
      title: `${patientName} - ${formatEventType(eventType)}`,
      start: eventStart,
      end: eventEnd,
      allDay: false,
      backgroundColor: getEventColor(eventType),
      borderColor: getEventColor(eventType),
      textColor: "#ffffff",
      extendedProps: {
        patientId: existingAppointment.patientId,
        patientName,
        doctorId: existingAppointment.doctorId,
        doctorName: existingAppointment.doctor?.name || "Unassigned",
        type: eventType,
        status: updatedAppointment.status || "SCHEDULED",
        notes: updatedAppointment.note,
        appointmentId: updatedAppointment.id,
      },
    };
  });

// Delete calendar event - Using mutations (soft delete)
export const deleteCalendarEvent = clinicProcedure
  .input(z.object({ id: z.string(), reason: z.string().optional() }))
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .handler(async ({ input, context }) => {
    const { id, reason } = input;
    const clinicId = context.clinicId ?? "";

    // Use cancelAppointment mutation
    const cancelledAppointment = await mutations.appointment.cancel(
      id,
      reason || "Cancelled via calendar",
      clinicId,
    );

    if (!cancelledAppointment) {
      throw new Error("Appointment not found or could not be cancelled");
    }

    return {
      success: true,
      message: "Event deleted successfully",
    };
  });

// Bulk update events - Using mutations
export const bulkUpdateEvents = clinicProcedure
  .input(BulkUpdateSchema)
  .output(
    z.object({ updatedCount: z.number(), failedIds: z.array(z.string()) }),
  )
  .handler(async ({ input }) => {
    const { eventIds, status, reason } = input;
    // const clinicId = context.clinicId ?? "";
    const failedIds: string[] = [];

    // Use bulk update mutation
    const updated = await mutations.appointment.bulkUpdateStatus(
      eventIds,
      status as AppointmentStatus,
      reason,
    );

    const updatedCount = updated.length;
    const updatedIds = new Set(updated.map((a) => a.id));
    const failed = eventIds.filter((id) => !updatedIds.has(id));
    failedIds.push(...failed);

    return {
      updatedCount,
      failedIds,
    };
  });

// Get doctor availability for a specific date - Using queries
export const getDoctorAvailability = clinicProcedure
  .input(GetAvailabilitySchema)
  .output(
    z.object({
      isAvailable: z.boolean(),
      availableSlots: z.array(
        z.object({
          start: z.date(),
          end: z.date(),
        }),
      ),
      bookedSlots: z.array(
        z.object({
          start: z.date(),
          end: z.date(),
        }),
      ),
      workingHours: z.object({
        start: z.string(),
        end: z.string(),
      }),
    }),
  )
  .handler(async ({ input, context }) => {
    const { doctorId, date, duration } = input;
    const clinicId = context.clinicId ?? "";

    // Get doctor's working hours for the day using queries
    const workingHours = await getDoctorWorkingHours(doctorId, date);

    if (!workingHours) {
      return {
        isAvailable: false,
        availableSlots: [],
        bookedSlots: [],
        workingHours: { start: "09:00", end: "17:00" },
      };
    }

    // Get existing appointments for the doctor on this date using queries
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments =
      await appointmentQueries.getAppointmentsInRange(
        clinicId,
        startOfDay,
        endOfDay,
        doctorId,
      );

    // Calculate available time slots using calendar helper
    const availableSlots = calculateAvailableSlots(
      workingHours.start,
      workingHours.end,
      duration,
      existingAppointments.map((apt) => ({
        start: apt.appointmentDate,
        duration: apt.durationMinutes ?? 30,
      })),
    );

    const bookedSlots = existingAppointments.map((apt) => ({
      start: apt.appointmentDate,
      end: new Date(
        apt.appointmentDate.getTime() + (apt.durationMinutes || 30) * 60000,
      ),
    }));

    return {
      isAvailable: availableSlots.length > 0,
      availableSlots,
      bookedSlots,
      workingHours,
    };
  });

// Get available time slots for a doctor - Using queries
export const getAvailableTimeSlots = clinicProcedure
  .input(GetAvailableSlotsSchema)
  .output(
    z.array(
      z.object({
        start: z.date(),
        end: z.date(),
        formattedStart: z.string(),
        formattedEnd: z.string(),
      }),
    ),
  )
  .handler(async ({ input, context }) => {
    const { doctorId, date, duration, startTime, endTime } = input;
    const clinicId = context.clinicId ?? "";

    // Get doctor's working hours
    const workingHours = await getDoctorWorkingHours(doctorId, date);

    const workingStart = startTime || workingHours?.start || "09:00";
    const workingEnd = endTime || workingHours?.end || "17:00";

    // Get existing appointments using queries
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments =
      await appointmentQueries.getAppointmentsInRange(
        clinicId,
        startOfDay,
        endOfDay,
        doctorId,
      );

    // Calculate slots using calendar helper
    const slots = calculateAvailableSlots(
      workingStart,
      workingEnd,
      duration,
      existingAppointments.map((apt) => ({
        start: apt.appointmentDate,
        duration: apt.durationMinutes ?? 30,
      })),
    );

    // Format slots for display
    return slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      formattedStart: slot.start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      formattedEnd: slot.end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  });

// Get event details by ID - Using queries
export const getEventDetails = clinicProcedure
  .input(z.object({ id: z.string() }))
  .output(CalendarEventSchema.nullable())
  .handler(async ({ input, context }) => {
    const { id } = input;
    const clinicId = context.clinicId ?? "";

    const appointmentData = await appointmentQueries.getAppointmentById(
      id,
      clinicId,
    );

    if (!appointmentData) {
      return null;
    }

    const duration = appointmentData.durationMinutes || 30;
    const endTime = new Date(appointmentData.appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const patientName = appointmentData.patient
      ? `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`
      : "Unknown";
    const eventType = mapAppointmentTypeToEventType(appointmentData.type);

    return {
      id: appointmentData.id,
      title: `${patientName} - ${formatEventType(eventType)}`,
      start: appointmentData.appointmentDate,
      end: endTime,
      allDay: false,
      backgroundColor: getEventColor(eventType),
      borderColor: getEventColor(eventType),
      textColor: "#ffffff",
      extendedProps: {
        patientId: appointmentData.patientId,
        patientName,
        doctorId: appointmentData.doctorId,
        doctorName: appointmentData.doctor?.name || "Unassigned",
        type: eventType,
        status: appointmentData.status || "SCHEDULED",
        notes: appointmentData.note,
        appointmentId: appointmentData.id,
      },
    };
  });

// Get calendar statistics - Using queries
export const getCalendarStats = clinicProcedure
  .input(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
      doctorId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      totalAppointments: z.number(),
      completedAppointments: z.number(),
      cancelledAppointments: z.number(),
      noShowAppointments: z.number(),
      averageDuration: z.number(),
      busiestDay: z.string(),
      appointmentsByType: z.record(z.string(), z.number()),
      appointmentsByStatus: z.record(z.string(), z.number()),
      dailyAverage: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { startDate, endDate, doctorId } = input;
    const clinicId = context.clinicId ?? "";

    const appointments = await appointmentQueries.getAppointmentsInRange(
      clinicId,
      startDate,
      endDate,
      doctorId,
    );

    const total = appointments.length;
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;
    const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;

    const totalDuration = appointments.reduce(
      (sum, a) => sum + (a.durationMinutes || 30),
      0,
    );
    const avgDuration = total > 0 ? totalDuration / total : 0;

    // Find busiest day
    const dayCount = new Map<string, number>();
    appointments.forEach((apt) => {
      const day = apt.appointmentDate.toLocaleDateString();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    let busiestDay = "";
    let maxCount = 0;
    dayCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        busiestDay = day;
      }
    });

    // Group by type and status
    const appointmentsByType: Record<string, number> = {};
    const appointmentsByStatus: Record<string, number> = {};

    appointments.forEach((apt) => {
      const type = apt.type || "GENERAL";
      const status = apt.status || "SCHEDULED";
      appointmentsByType[type] = (appointmentsByType[type] || 0) + 1;
      appointmentsByStatus[status] = (appointmentsByStatus[status] || 0) + 1;
    });

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dailyAverage = daysDiff > 0 ? total / daysDiff : 0;

    return {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      averageDuration: avgDuration,
      busiestDay,
      appointmentsByType,
      appointmentsByStatus,
      dailyAverage,
    };
  });

// ============================================================================
// Calendar Router Export
// ============================================================================

export const calendarRouter = {
  getEvents: getCalendarEvents,
  createEvent: createCalendarEvent,
  updateEvent: updateCalendarEvent,
  deleteEvent: deleteCalendarEvent,
  bulkUpdate: bulkUpdateEvents,
  getDoctorAvailability,
  getAvailableTimeSlots,
  getEventDetails,
  getStats: getCalendarStats,
};
