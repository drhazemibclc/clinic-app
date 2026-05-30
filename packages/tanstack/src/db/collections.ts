// src/db-collections/collections.ts

import { client, queryClient } from "@clinic-app/api/client";
import type {
  Appointment,
  GrowthRecord,
  Immunization,
  MedicalRecord,
  Notification,
  Patient,
  PrescribedItem,
  Prescription,
  User,
  VitalSign,
} from "@clinic-app/db/zod";
import { generateId } from "@clinic-app/utils/id";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  and,
  createCollection,
  createLiveQueryCollection,
  eq,
  gt,
  lt,
} from "@tanstack/react-db";

export type MedicalRecordWithVitals = MedicalRecord & {
  vitalSign: VitalSign[];
};
export type PrescriptionWithItems = Prescription & {
  prescribedItems: PrescribedItem[];
};

export const patientsCollection = createCollection(
  queryCollectionOptions<Patient>({
    id: "patients",
    queryKey: ["patients"],
    queryClient, // Required for synchronization
    getKey: (patient) => patient.id,

    // QueryFn: Fetching logic
    queryFn: async ({ signal }) => {
      const response = await client.patient.list(
        { page: 1, limit: 1000 },
        { signal },
      );
      return response.patients;
    },

    // Persistence Handlers: Using transaction-aware batching
    onInsert: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map((m) => client.patient.create(m.modified)),
      );
    },

    onUpdate: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map((m) =>
          client.patient.update({
            id: m.original.id,
            data: m.changes,
          }),
        ),
      );
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.patient.delete({ id: m.original.id }),
        ),
      );
    },
  }),
);

// ============================================================================
// APPOINTMENTS COLLECTION
// ============================================================================
export const appointmentsCollection = createCollection(
  queryCollectionOptions<Appointment>({
    id: "appointments",
    queryKey: ["appointments"],
    queryClient, // Required for synchronization
    getKey: (appointment) => appointment.id,

    queryFn: async ({ signal }) => {
      const response = await client.appointments.list(
        {
          page: 1,
          limit: 1000,
        },
        { signal },
      );
      return response.appointments;
    },

    onInsert: async ({ transaction }) => {
      const newAppointments = transaction.mutations.map((m) => m.modified);
      const results = await Promise.all(
        newAppointments.map((apt) => client.appointments.create(apt)),
      );
      return results;
    },

    onUpdate: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map(async (m) => {
          const { original, changes } = m;

          // Handle status changes specifically
          if (changes.status && original.status !== changes.status) {
            return client.appointments.updateStatus({
              id: original.id,
              status: changes.status,
            });
          }

          // Generic update for other fields
          return client.appointments.update({
            ...changes,
            id: original.id,
          });
        }),
      );
      return results;
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.appointments.cancel({
            id: m.original.id,
            reason: "Deleted from collection",
          }),
        ),
      );
    },
  }),
);
// ============================================================================
// GROWTH RECORDS COLLECTION
// ============================================================================
export const growthRecordsCollection = createCollection(
  queryCollectionOptions<GrowthRecord>({
    id: "growth-records",
    queryKey: ["growth-records"],
    queryClient,
    getKey: (record) => record.id,
    queryFn: async ({ signal }) => {
      const response = await client.growth.list(
        { limit: 1000, offset: 0 },
        { signal },
      );
      return response.records;
    },
    onInsert: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map((m) =>
          client.growth.create({
            ...m.modified,
            weight: m.modified.weight ?? 0,
            height: m.modified.height ?? 0,
            headCircumference: m.modified.headCircumference ?? 0,
            notes: m.modified.notes ?? "",
            date: m.modified.date || new Date(),
          }),
        ),
      );
    },
    onUpdate: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map((m) => {
          const changes = m.changes as Partial<{
            date?: Date;
            weight?: number | null;
            height?: number | null;
            headCircumference?: number | null;
            notes?: string | null;
          }>;

          return client.growth.update({
            id: m.original.id,
            ...(changes.date !== undefined ? { date: changes.date } : {}),
            ...(changes.weight !== null && changes.weight !== undefined
              ? { weight: changes.weight }
              : {}),
            ...(changes.height !== null && changes.height !== undefined
              ? { height: changes.height }
              : {}),
            ...(changes.headCircumference !== null &&
            changes.headCircumference !== undefined
              ? { headCircumference: changes.headCircumference }
              : {}),
            ...(changes.notes !== undefined
              ? { notes: changes.notes ?? "" }
              : {}),
          });
        }),
      );
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.growth.delete({ id: m.original.id }),
        ),
      );
    },
  }),
);
// ============================================================================
// IMMUNIZATIONS COLLECTION
// ============================================================================
export const immunizationsCollection = createCollection(
  queryCollectionOptions<Immunization>({
    id: "immunizations",
    queryKey: ["immunizations"],
    queryFn: async ({ signal }) => {
      const response = await client.immunizations.list(
        {
          limit: 1000,
          offset: 0,
        },
        { signal },
      );
      return (response.records || []) as Immunization[];
    },
    queryClient,
    getKey: (immunization: Immunization) => immunization.id,

    onInsert: async ({ transaction }) => {
      const newImmunizations = transaction.mutations.map(
        (m) => m.modified as Immunization,
      );
      const results = await Promise.all(
        newImmunizations.map((imm) =>
          client.immunizations.record({
            patientId: imm.patientId,
            vaccineName: imm.vaccine,
            date: imm.date,
            dose: imm.dose || "",
            lotNumber: imm.lotNumber ?? "",
            notes: imm.notes ?? "",
          }),
        ),
      );
      return results;
    },

    onUpdate: async ({ transaction }) => {
      // Immunizations typically don't get updated, return modified objects
      return transaction.mutations.map((m) => m.modified as Immunization);
    },
  }),
);

// ============================================================================
// PRESCRIPTIONS COLLECTION
// ============================================================================
export const prescriptionsCollection = createCollection(
  queryCollectionOptions<Prescription>({
    id: "prescriptions",
    queryKey: ["prescriptions"],
    queryClient, // Required for synchronization
    getKey: (prescription: Prescription) => prescription.id,

    queryFn: async ({ signal }) => {
      const prescriptions =
        (await client.prescriptions.getPatientActivePrescriptions(
          {
            patientId: "",
            includeExpired: true,
          },
          { signal },
        )) as Prescription[];

      return prescriptions.map((rx) => ({
        ...rx,
        items: rx.items || rx.prescribedItems || [],
        prescribedItems: rx.prescribedItems || rx.items || [],
      }));
    },

    onInsert: async ({ transaction }) => {
      // 1. Map and cast the mutations safely
      const results = await Promise.all(
        transaction.mutations.map(async (m) => {
          const rx = m.modified as PrescriptionWithItems;

          // 2. Map local fields to your API's expected structure
          // Use logical fallbacks to ensure no 'undefined' reaches the API
          return await client.prescriptions.create({
            medicalRecordId: rx.medicalRecordId,
            patientId: rx.patientId,
            doctorId: rx.doctorId ?? "",
            encounterId: rx.encounterId ?? null, // Ensure ID handles optional values
            // Use 'items' instead of 'prescribedItems' to match the API schema
            items: Array.isArray(rx.prescribedItems)
              ? rx.prescribedItems
              : (rx.prescribedItems ?? []),
            validUntil:
              rx.endDate instanceof Date
                ? rx.endDate
                : new Date(rx.endDate ?? Date.now()),
            notes: rx.notes ?? "",
          });
        }),
      );

      return results;
    },

    onUpdate: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map((m) => {
          const changes = m.changes as Partial<Prescription>;
          return client.prescriptions.update({
            prescriptionId: (m.original as Prescription).id,
            status: changes.status ?? "active",
            reason: changes.cancellationReason ?? "Cancelled",
          });
        }),
      );
      return results;
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.prescriptions.update({
            prescriptionId: (m.original as Prescription).id,
            status: "cancelled",
            reason: "Deleted from collection",
          }),
        ),
      );
    },
  }),
);

// ============================================================================
// MEDICAL RECORDS COLLECTION
// ============================================================================
export const medicalRecordsCollection = createCollection(
  queryCollectionOptions<MedicalRecord>({
    id: "medical-records",
    queryKey: ["medical-records"],
    queryFn: async ({ signal }) => {
      const response = await client.record.list(
        {
          limit: 1000,
          offset: 0,
        },
        { signal },
      );
      return response.records as MedicalRecord[];
    },
    queryClient,
    getKey: (record: MedicalRecord) => record.id,

    onInsert: async ({ transaction }) => {
      const newRecords = transaction.mutations.map(
        (m) => m.modified as MedicalRecordWithVitals,
      );

      const results = await Promise.all(
        newRecords.map(async (record) => {
          // Create the record, diagnosis, and vitals using your client
          return await client.record.create({
            record: {
              id: generateId(),
              patientId: record.patientId,
              doctorId: record.doctorId,
              appointmentId: record.appointmentId,
              clinicId: record.clinicId,
              diagnosisDate: record.diagnosisDate || new Date(),
            },
            diagnosis: {
              id: generateId(),
              patientId: record.patientId,
              doctorId: record.doctorId,
              diagnosis: record.diagnosis ?? "",
              symptoms: record.symptoms ?? "N/A",
              medicalId: record.id,
              date: new Date(),
            },
            // Fix: Use the correct property name (e.g., record.vitals)
            // and handle the case where it might be undefined or null
            vitals:
              record.vitalSign && record.vitalSign.length > 0
                ? {
                    ...record.vitalSign[0],
                    patientId: record.patientId,
                    clinicId: record.clinicId,
                    medicalId: record.id,
                    notes: record.vitalSign[0]?.notes ?? null,
                    recordedAt: new Date(),
                    createdAt: new Date(),
                  }
                : undefined,
          });
        }),
      );

      return results;
    },
    onUpdate: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map((m) =>
          client.record.update({
            id: (m.original as MedicalRecord).id,
            data: m.changes,
          }),
        ),
      );
      return results;
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.record.delete({ id: (m.original as MedicalRecord).id }),
        ),
      );
    },
  }),
);

// ============================================================================
// VITAL SIGNS COLLECTION
// ============================================================================
export const vitalSignsCollection = createCollection(
  queryCollectionOptions<VitalSign>({
    id: "vital-signs",
    queryKey: ["vital-signs"],
    queryFn: async ({ signal }) => {
      const response = await client.vitalSigns.list(
        {
          patientId: "", // Empty to get all vital signs
          page: 1,
          pageSize: 100,
        },
        { signal },
      );
      return response.vitalSigns as VitalSign[];
    },
    getKey: (vital: VitalSign) => vital.id,
    queryClient,

    onInsert: async ({ transaction }) => {
      const newVitals = transaction.mutations.map(
        (m) => m.modified as VitalSign,
      );
      const results = await Promise.all(
        newVitals.map((vital) => client.vitalSigns.create(vital)),
      );
      return results;
    },

    onUpdate: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map((m) =>
          client.vitalSigns.update({
            id: (m.original as VitalSign).id,
            ...m.changes,
          }),
        ),
      );
      return results;
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.vitalSigns.delete({ id: (m.original as VitalSign).id }),
        ),
      );
    },
  }),
);

// ============================================================================
// USERS COLLECTION
// ============================================================================
export const usersCollection = createCollection(
  queryCollectionOptions<User>({
    id: "users",
    queryKey: ["users"],
    queryFn: async ({ signal }) => {
      const response = await client.users.list(
        {
          page: 1,
          limit: 1000,
        },
        { signal },
      );
      return response as User[];
    },
    getKey: (user: User) => user.id,
    queryClient,

    onInsert: async ({ transaction }) => {
      const newUsers = transaction.mutations.map((m) => m.modified as User);
      const results = await Promise.all(
        newUsers.map((user) => client.users.create(user)),
      );
      return results;
    },

    onUpdate: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map((m) =>
          client.users.update({
            id: (m.original as User).id,
            data: m.changes,
          }),
        ),
      );
      return results;
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.users.delete({ id: (m.original as User).id }),
        ),
      );
    },
  }),
);

// ============================================================================
// NOTIFICATIONS COLLECTION
// ============================================================================
export const notificationsCollection = createCollection(
  queryCollectionOptions<Notification>({
    id: "notifications",
    queryKey: ["notifications"],
    queryFn: async ({ signal }) => {
      const response = await client.notifications.list(
        {
          status: "all",
          limit: 100,
          offset: 0,
        },
        { signal },
      );
      return response.notifications as Notification[];
    },
    getKey: (notification: Notification) => notification.id,
    queryClient,

    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) => {
          const changes = m.changes as Partial<Notification>;
          if (changes.status === "read") {
            return client.notifications.markAsRead({
              id: (m.original as Notification).id,
            });
          }
          return Promise.resolve();
        }),
      );
      return transaction.mutations.map((m) => m.modified as Notification);
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          client.notifications.delete({ id: (m.original as Notification).id }),
        ),
      );
    },
  }),
);

// ============================================================================
// LIVE QUERY COLLECTIONS (Derived Views)
// ============================================================================

// Today's appointments
export const todayAppointmentsCollection = createLiveQueryCollection((q) =>
  q
    .from({ apt: appointmentsCollection })
    .where(({ apt }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return and(
        gt(apt.appointmentDate, today),
        lt(apt.appointmentDate, tomorrow),
      );
    })
    .orderBy(({ apt }) => apt.appointmentDate, "asc"),
);

// Upcoming appointments (next 7 days)
export const upcomingAppointmentsCollection = createLiveQueryCollection((q) =>
  q
    .from({ apt: appointmentsCollection })
    .where(({ apt }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return and(
        gt(apt.appointmentDate, today),
        lt(apt.appointmentDate, nextWeek),
        eq(apt.status, "CONFIRMED"),
      );
    })
    .orderBy(({ apt }) => apt.appointmentDate, "asc"),
);

// Active prescriptions
export const activePrescriptionsCollection = createLiveQueryCollection((q) =>
  q
    .from({ rx: prescriptionsCollection })
    .where(({ rx }) => eq(rx.status, "active"))
    .orderBy(({ rx }) => rx.createdAt, "desc"),
);

// Unread notifications
export const unreadNotificationsCollection = createLiveQueryCollection((q) =>
  q
    .from({ notif: notificationsCollection })
    .where(({ notif }) => eq(notif.status, "unread"))
    .orderBy(({ notif }) => notif.createdAt, "desc"),
);

// Patient dashboard view factory (returns a function that creates a live query collection)
export const createPatientDashboardCollection = (patientId: string) =>
  createLiveQueryCollection((q) =>
    q
      .from({ patient: patientsCollection })
      .where(({ patient }) => eq(patient.id, patientId))
      .select(({ patient }) => ({
        ...patient,
        // Recent appointments for this patient
        recentAppointments: q
          .from({ apt: appointmentsCollection })
          .where(({ apt }) => eq(apt.patientId, patient.id))
          .orderBy(({ apt }) => apt.appointmentDate, "desc")
          .limit(5),
        // Growth chart data
        growthRecords: q
          .from({ growth: growthRecordsCollection })
          .where(({ growth }) => eq(growth.patientId, patient.id))
          .orderBy(({ growth }) => growth.date, "asc"),
        // Active prescriptions
        activePrescriptions: q
          .from({ rx: prescriptionsCollection })
          .where(({ rx }) =>
            and(eq(rx.patientId, patient.id), eq(rx.status, "active")),
          ),
      })),
  );

// Recent patients (last 30 days activity)
export const recentPatientsCollection = createLiveQueryCollection((q) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return q
    .from({ patient: patientsCollection })
    .where(({ patient }) => gt(patient.updatedAt, thirtyDaysAgo))
    .orderBy(({ patient }) => patient.updatedAt, "desc")
    .limit(20);
});

// Doctor's today appointments factory
export const createDoctorTodayAppointmentsCollection = (doctorId: string) =>
  createLiveQueryCollection((q) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return q
      .from({ apt: appointmentsCollection })
      .where(({ apt }) =>
        and(
          eq(apt.doctorId, doctorId),
          gt(apt.appointmentDate, today),
          lt(apt.appointmentDate, tomorrow),
        ),
      )
      .orderBy(({ apt }) => apt.appointmentDate, "asc");
  });
