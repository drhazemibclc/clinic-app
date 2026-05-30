// admin-service.ts
import { db } from "@clinic-app/db";
import { notification } from "@clinic-app/db/schema/clinic";
import { appointment } from "@clinic-app/db/schema/index";
import { and, eq, sql } from "drizzle-orm";
import { safeDbQuery } from "./auth-service";
// Dashboard queries
export async function getAppointmentCountsByStatus(clinicId: string) {
  return safeDbQuery(() =>
    db
      .select({
        status: appointment.status,
        count: sql<number>`count(*)::int`,
      })
      .from(appointment)
      .where(eq(appointment.clinicId, clinicId))
      .groupBy(appointment.status),
  );
}

export async function getMonthlyAppointmentData(clinicId: string) {
  return safeDbQuery(() =>
    db
      .select({
        month: sql<string>`to_char(${appointment.appointmentDate}, 'Mon')`,
        appointments: sql<number>`count(*)::int`,
        monthOrder: sql<Date>`date_trunc('month', ${appointment.appointmentDate})`,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.clinicId, clinicId),
          sql`${appointment.appointmentDate} >= date_trunc('year', CURRENT_DATE)`,
        ),
      )
      .groupBy(
        sql`date_trunc('month', ${appointment.appointmentDate})`,
        sql`to_char(${appointment.appointmentDate}, 'Mon')`,
      )
      .orderBy(sql`date_trunc('month', ${appointment.appointmentDate})`)
      .then((results) =>
        results.map((r) => ({ month: r.month, appointments: r.appointments })),
      ),
  );
}

// Notification queries
export async function createWelcomeNotification(
  userId: string,
  clinicId: string,
  signupDate: Date,
) {
  return safeDbQuery(() =>
    db.insert(notification).values({
      userId,
      clinicId,
      title: "Welcome! 🎉",
      body: "Welcome to our clinic management system! We're excited to have you on board.",
      status: "unread",
      priority: "medium",
      type: "system",
      metadata: { signupDate: signupDate.toISOString() },
    }),
  );
}

// User role query
export async function getUserRoleById(userId: string) {
  return safeDbQuery(() =>
    db.query.user.findFirst({
      where: { id: userId },
      columns: { role: true },
    }),
  );
}
