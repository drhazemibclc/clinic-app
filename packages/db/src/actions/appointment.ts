import type {
  AppointmentStatus,
  DbAppointment,
  DbReminder,
  NewDbAppointment,
} from "../schema";
import { mutations } from "./mutations";
import { appointmentQueries, queries } from "./queries";

// Types
export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus;
  fromDate?: Date;
  toDate?: Date;
  patientId?: string;
  doctorId?: string;
  doctorSpecialty?: string;
  type?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ============================================================================
// Appointment Creation & Updates
// ============================================================================

export async function createNewAppointment(
  data: NewDbAppointment,
  clinicId: string,
) {
  try {
    const appointment = await mutations.appointment.createWithReminder(
      {
        ...data,
        clinicId,
        id: crypto.randomUUID(),
      },
      undefined,
    );
    return appointment;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Time slot already booked"
    ) {
      throw new Error("Doctor is already booked at this time");
    }
    throw error;
  }
}

export async function updateExistingAppointment(
  id: string,
  data: DbAppointment,
) {
  const updated = await mutations.appointment.update(id, data);
  if (!updated) {
    throw new Error("Appointment not found");
  }
  return updated;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  clinicId: string,
) {
  try {
    const updated = await mutations.appointment.update(id, {
      status,
      clinicId,
    });
    if (!updated) {
      throw new Error("Appointment not found");
    }
    return updated;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update appointment status");
  }
}

export async function bulkUpdateAppointmentsStatus(
  appointmentIds: string[],
  status: AppointmentStatus,
  reason?: string,
) {
  const updated = await mutations.appointment.bulkUpdateStatus(
    appointmentIds,
    status,
    reason,
  );
  return updated;
}

// ============================================================================
// Appointment Cancellation & Rescheduling
// ============================================================================

export async function cancelExistingAppointment(
  id: string,
  clinicId: string,
  reason?: string,
) {
  try {
    const cancelled = await queries.appointment.cancelAppointment?.(
      id,
      clinicId,
      reason || "Cancelled by user",
    );

    if (!cancelled) {
      throw new Error("Appointment not found");
    }

    return cancelled;
  } catch (error) {
    console.log(error);
    // Fallback to direct update
    const updated = await mutations.appointment.update(id, {
      status: "CANCELLED",
      note: reason ? `Cancelled: ${reason}` : "Cancelled by user",
    });

    if (!updated) {
      throw new Error("Appointment not found");
    }

    return updated;
  }
}

export async function rescheduleExistingAppointment(
  id: string,
  newDate: Date,
  newTime: string,
  reason?: string,
) {
  try {
    const rescheduled = await mutations.appointment.reschedule(
      id,
      newDate,
      newTime,
      reason,
    );
    return rescheduled;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "New time slot is already booked"
    ) {
      throw new Error("Selected time slot is not available");
    }
    throw error;
  }
}

// ============================================================================
// Appointment Queries
// ============================================================================

export async function getAppointmentsInRange(
  clinicId: string,
  startDate: Date,
  endDate: Date,
  doctorId?: string,
) {
  const appointments =
    (await queries.appointment.getAppointmentsInRange?.(
      clinicId,
      startDate,
      endDate,
      doctorId,
    )) ??
    (await appointmentQueries.getAppointmentsFallback(
      clinicId,
      startDate,
      endDate,
      doctorId,
    ));

  return appointments;
}

export async function getPaginatedAppointments(
  clinicId: string,
  page: number,
  limit: number,
  status?: AppointmentStatus,
  doctorId?: string,
  patientId?: string,
) {
  const result =
    (await queries.search?.advancedSearch?.({
      clinicId: clinicId ?? "",
      status,
      dateFrom: undefined,
      dateTo: undefined,
    })) ??
    (await appointmentQueries.getAppointmentsFallbackPaginated(
      clinicId ?? "",
      page,
      limit,
      status,
      doctorId,
      patientId,
    ));

  const appointments = Array.isArray(result) ? result : [];
  const total = appointments.length;

  return {
    appointments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAppointmentById(id: string, clinicId: string) {
  const appointment = await appointmentQueries.getAppointmentByIdFallback(
    id,
    clinicId ?? "",
  );

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return appointment;
}

// ============================================================================
// Advanced Search & Filtering
// ============================================================================

export async function searchAppointments(
  clinicId: string,
  filters: AppointmentFilters,
  pagination: PaginationParams,
) {
  const { page, limit } = pagination;
  const {
    search,
    status,
    fromDate,
    toDate,
    patientId,
    doctorId,
    doctorSpecialty,
    type,
  } = filters;

  if (!clinicId) {
    throw new Error("Missing clinicId");
  }

  try {
    // Build search filters
    const searchFilters = {
      clinicId,
      patientName: search,
      doctorName: doctorSpecialty ? undefined : search,
      dateFrom: fromDate,
      dateTo: toDate,
      status,
    };

    // Use the advanced search from queries
    const searchResults = await queries.search.advancedSearch(searchFilters);
    let appointments = searchResults;
    let total = searchResults.length;

    // Apply additional filters that advancedSearch might not support
    if (patientId || doctorId || type) {
      appointments = appointments.filter(
        (apt: DbAppointment) =>
          (!patientId || apt.patientId === patientId) &&
          (!doctorId || apt.doctorId === doctorId) &&
          (!type || apt.type === type),
      );
      total = appointments.length;
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedAppointments = appointments.slice(start, start + limit);

    return {
      appointments: paginatedAppointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.log(error);
    // Fallback to basic implementation
    const fallbackResult = await appointmentQueries.getAppointmentsWithFilters(
      clinicId,
      page,
      limit,
      {
        search,
        status,
        fromDate,
        toDate,
        patientId,
        doctorId,
        doctorSpecialty,
        type,
      },
    );
    return fallbackResult;
  }
}

// ============================================================================
// Doctor Availability
// ============================================================================

export async function getDoctorAvailability(doctorId: string, date: Date) {
  return await queries.doctor.getDoctorAvailability?.(doctorId, date);
}

export async function getAvailableTimeSlots(
  doctorId: string,
  date: Date,
  durationMinutes = 30,
) {
  return await queries.doctor.getAvailableTimeSlots?.(
    doctorId,
    date,
    durationMinutes,
  );
}

// ============================================================================
// Appointment with Reminder
// ============================================================================

export async function createAppointmentWithReminder(
  appointmentData: NewDbAppointment,
  reminderData?: DbReminder,
) {
  return await mutations.appointment.createWithReminder(
    appointmentData,
    reminderData,
  );
}
