import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "../index";
import { appointment, reminder, type Weekday } from "../schema";

export function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    "well-child": "#10b981", // green
    "sick-visit": "#3b82f6", // blue
    "follow-up": "#8b5cf6", // purple
    immunization: "#f59e0b", // orange
    consultation: "#06b6d4", // cyan
  };
  return colors[type] || "#6b7280";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: "#3b82f6",
    CONFIRMED: "#10b981",
    COMPLETED: "#6b7280",
    CANCELLED: "#ef4444",
    NO_SHOW: "#ef4444",
  };
  return colors[status] || "#6b7280";
}

export function formatEventType(type: string): string {
  const formats: Record<string, string> = {
    "well-child": "Well-Child Visit",
    "sick-visit": "Sick Visit",
    "follow-up": "Follow-up",
    immunization: "Immunization",
    consultation: "Consultation",
  };
  return formats[type] || type;
}

export function mapEventTypeToAppointmentType(type: string): string {
  const mapping: Record<string, string> = {
    "well-child": "WELLNESS",
    "sick-visit": "SICK",
    "follow-up": "FOLLOW_UP",
    immunization: "IMMUNIZATION",
    consultation: "CONSULTATION",
  };
  return mapping[type] || "GENERAL";
}

export function mapAppointmentTypeToEventType(type: string | null): string {
  const mapping: Record<string, string> = {
    WELLNESS: "well-child",
    SICK: "sick-visit",
    FOLLOW_UP: "follow-up",
    IMMUNIZATION: "immunization",
    CONSULTATION: "consultation",
  };
  return mapping[type || "GENERAL"] || "sick-visit";
}

export async function getDoctorWorkingHours(doctorId: string, date: Date) {
  const dayOfWeek = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  const result = await db.query.workingDay.findFirst({
    where: {
      doctorId,
      day: dayOfWeek as Weekday,
      isActive: true,
    },
  });

  if (!result) {
    return null;
  }

  return {
    start: result.startTime,
    end: result.endTime,
  };
}

export async function checkSlotAvailability(
  doctorId: string,
  start: Date,
  end: Date,
  clinicId: string,
  excludeId?: string,
): Promise<boolean> {
  const conditions = [
    eq(appointment.doctorId, doctorId),
    eq(appointment.clinicId, clinicId),
    eq(appointment.isDeleted, false),
    sql`${appointment.appointmentDate} < ${end}`,
    sql`${appointment.appointmentDate} + (${appointment.durationMinutes} || ' minutes')::interval > ${start}`,
  ];

  if (excludeId) {
    conditions.push(ne(appointment.id, excludeId));
  }

  const overlapping = await db
    .select()
    .from(appointment)
    .where(and(...conditions))
    .limit(1);

  return overlapping.length === 0;
}

export function calculateAvailableSlots(
  workingStart: string,
  workingEnd: string,
  duration: number,
  bookedSlots: Array<{ start: Date; duration: number }>,
): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = [];

  // Parse working hours
  const [startHour, startMinute] = workingStart.split(":").map(Number);
  const [endHour, endMinute] = workingEnd.split(":").map(Number);

  const workingStartTime = new Date();
  workingStartTime.setHours(startHour ?? 0, startMinute, 0, 0);

  const workingEndTime = new Date();
  workingEndTime.setHours(endHour ?? 0, endMinute, 0, 0);

  // Sort booked slots
  const sortedBooked = bookedSlots.sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  let currentStart = new Date(workingStartTime);

  for (const booked of sortedBooked) {
    const bookedEnd = new Date(
      booked.start.getTime() + (booked.duration || 30) * 60000,
    );

    // Check slot before booked appointment
    if (currentStart < booked.start) {
      const slotEnd = new Date(currentStart.getTime() + duration * 60000);
      if (slotEnd <= booked.start) {
        slots.push({ start: new Date(currentStart), end: slotEnd });
      }
      currentStart = bookedEnd;
    } else if (currentStart < bookedEnd) {
      currentStart = bookedEnd;
    }
  }

  // Check remaining time after last booked appointment
  while (
    currentStart.getTime() + duration * 60000 <=
    workingEndTime.getTime()
  ) {
    const slotEnd = new Date(currentStart.getTime() + duration * 60000);
    slots.push({ start: new Date(currentStart), end: slotEnd });
    currentStart = slotEnd;
  }

  return slots;
}

export async function createAppointmentReminders(
  appointmentId: string,
  appointmentDate: Date,
) {
  const reminderTimes = [24, 2]; // 24 hours and 2 hours before

  for (const hoursBefore of reminderTimes) {
    const reminderTime = new Date(appointmentDate);
    reminderTime.setHours(reminderTime.getHours() - hoursBefore);

    await db.insert(reminder).values({
      id: crypto.randomUUID(),
      appointmentId,
      method: "EMAIL",
      status: "PENDING",
      sentAt: reminderTime,
    });
  }
}
