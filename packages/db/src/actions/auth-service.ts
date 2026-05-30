import { count, eq } from "drizzle-orm";
import { db } from "..";
import type { UserRole } from "../schema";
import * as schema from "../schema";
// Helper function to safely execute queries
export async function safeDbQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Config store queries
export async function getAdminOnboardedStatus() {
  const result = await safeDbQuery(() =>
    db
      .select()
      .from(schema.configStore)
      .where(eq(schema.configStore.key, "admin_onboarded"))
      .then((res) => res[0]),
  );
  return result?.value === "true";
}

// Invite queries
export async function getInviteByCode(inviteCode: string) {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.invite)
      .where(eq(schema.invite.code, inviteCode))
      .then((res) => res[0]),
  );
}

export async function markInviteAsUsed(inviteCode: string, userId: string) {
  return safeDbQuery(() =>
    db
      .update(schema.invite)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(schema.invite.code, inviteCode)),
  );
}

// Clinic queries
export async function createClinic(
  name: string,
  address: string,
  email: string,
) {
  const newClinic = await safeDbQuery(() =>
    db
      .insert(schema.clinic)
      .values({
        id: crypto.randomUUID(),
        name,
        address,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: schema.clinic.id }),
  );
  return newClinic[0]?.id ?? "";
}

export async function getDefaultClinic() {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.clinic)
      .where(eq(schema.clinic.name, "Default Clinic"))
      .limit(1)
      .then((res) => res[0]),
  );
}

export async function getClinicById(clinicId: string) {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.clinic)
      .where(eq(schema.clinic.id, clinicId))
      .limit(1)
      .then((res) => res[0]),
  );
}

// Clinic member queries
export async function addUserToClinic(
  userId: string,
  role: UserRole,
  clinicId: string,
) {
  return safeDbQuery(() =>
    db.insert(schema.clinicMember).values({
      userId,
      role: role as "admin" | "doctor" | "staff" | "patient",
      clinicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
}

export async function getUserClinics(userId: string) {
  return safeDbQuery(() =>
    db
      .select({
        id: schema.clinic.id,
        name: schema.clinic.name,
        email: schema.clinic.email,
        role: schema.clinicMember.role,
        createdAt: schema.clinicMember.createdAt,
      })
      .from(schema.clinicMember)
      .innerJoin(
        schema.clinic,
        eq(schema.clinicMember.clinicId, schema.clinic.id),
      )
      .where(eq(schema.clinicMember.userId, userId)),
  );
}

// User queries
export async function getUserById(userId: string) {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1)
      .then((res) => res[0]),
  );
}

export async function updateUserClinicId(userId: string, clinicId: string) {
  return safeDbQuery(() =>
    db
      .update(schema.user)
      .set({ clinicId, updatedAt: new Date() })
      .where(eq(schema.user.id, userId)),
  );
}

export async function getAdminCount() {
  return safeDbQuery(() =>
    db
      .select({ count: count() })
      .from(schema.user)
      .where(eq(schema.user.role, "admin"))
      .then((res) => res[0]?.count ?? 0),
  );
}

export async function getUserFiles(userId: string) {
  return safeDbQuery(() =>
    db
      .select({ id: schema.file.id })
      .from(schema.file)
      .where(eq(schema.file.userId, userId)),
  );
}

// Role-specific record queries
export async function createDoctorRecord(data: {
  id: string;
  userId: string;
  email: string;
  clinicId: string;
  role: UserRole;
  name: string;
}) {
  return safeDbQuery(() =>
    db.insert(schema.doctor).values({
      id: data.id,
      userId: data.userId,
      email: data.email,
      clinicId: data.clinicId,
      role: data.role as "admin" | "doctor" | "staff" | "patient",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: data.name,
      specialty: "General",
    }),
  );
}

export async function createStaffRecord(data: {
  id: string;
  userId: string;
  email: string;
  clinicId: string;
  role: UserRole;
  name: string;
}) {
  return safeDbQuery(() =>
    db.insert(schema.staff).values({
      id: data.id,
      userId: data.userId,
      email: data.email,
      clinicId: data.clinicId,
      role: data.role as "admin" | "doctor" | "staff" | "patient",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: data.name,
      address: "",
    }),
  );
}

export async function createPatientRecord(data: {
  id: string;
  userId: string;
  email: string;
  clinicId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}) {
  return safeDbQuery(() =>
    db.insert(schema.patient).values({
      id: data.id,
      userId: data.userId,
      email: data.email,
      clinicId: data.clinicId,
      role: data.role as "admin" | "doctor" | "staff" | "patient",
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(0),
    }),
  );
}

// User quota queries
export async function getUserQuota(userId: string) {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.userQuota)
      .where(eq(schema.userQuota.userId, userId))
      .limit(1)
      .then((res) => res[0]),
  );
}

export async function createUserQuota(
  userId: string,
  quota: number,
  fileCountQuota: number,
  inviteQuota: number,
) {
  return safeDbQuery(() =>
    db.insert(schema.userQuota).values({
      userId,
      quota,
      fileCountQuota,
      inviteQuota,
      updatedAt: new Date(),
    }),
  );
}

// Config store queries
export async function setAdminOnboarded() {
  return safeDbQuery(() =>
    db
      .insert(schema.configStore)
      .values({ key: "admin_onboarded", value: "true" })
      .onConflictDoNothing(),
  );
}
// Additional clinic queries for admin seeding
export async function getClinicByName(name: string) {
  return safeDbQuery(() =>
    db
      .select()
      .from(schema.clinic)
      .where(eq(schema.clinic.name, name))
      .limit(1)
      .then((res) => res[0]),
  );
}

export async function createClinicWithDetails(data: {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  timezone?: string;
  isDeleted?: boolean;
}) {
  const [newClinic] = await safeDbQuery(() =>
    db
      .insert(schema.clinic)
      .values({
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        timezone: data.timezone || "Africa/Cairo",
        isDeleted: data.isDeleted || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning(),
  );
  return newClinic;
}

// Upsert clinic member with conflict handling
export async function upsertClinicMember(
  userId: string,
  clinicId: string,
  role: UserRole,
) {
  return safeDbQuery(() =>
    db
      .insert(schema.clinicMember)
      .values({
        userId,
        clinicId,
        role: role as "admin" | "doctor" | "staff" | "patient",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.clinicMember.userId,
        set: {
          clinicId,
          role: role as "admin" | "doctor" | "staff" | "patient",
          updatedAt: new Date(),
        },
      }),
  );
}

// Update user role and verification status
export async function updateUserToAdmin(
  userId: string,
  clinicId: string,
  name?: string,
) {
  return safeDbQuery(() =>
    db
      .update(schema.user)
      .set({
        role: "admin",
        emailVerified: true,
        clinicId,
        ...(name && { name }),
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId)),
  );
}

// Upsert doctor record with full details
export async function upsertDoctorRecord(data: schema.NewDbDoctor) {
  return safeDbQuery(() =>
    db
      .insert(schema.doctor)
      .values({
        id: data.id,
        userId: data.userId,
        email: data.email,
        name: data.name,
        clinicId: data.clinicId,
        specialty: data.specialty || "General",
        licenseNumber: data.licenseNumber,
        phone: data.phone,
        address: data.address,
        department: data.department,
        img: data.img,
        colorCode: data.colorCode,
        availabilityStatus: data.availabilityStatus || "AVAILABLE",
        type: data.type || "FULL",
        role: data.role as "admin" | "doctor" | "staff" | "patient",
        availableFromWeekDay: data.availableFromWeekDay || "MONDAY",
        availableToWeekDay: data.availableToWeekDay || "FRIDAY",
        availableFromTime: data.availableFromTime || "09:00",
        availableToTime: data.availableToTime || "17:00",
        appointmentPrice: data.appointmentPrice || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.doctor.userId,
        set: {
          name: data.name,
          email: data.email,
          specialty: data.specialty || "General",
          licenseNumber: data.licenseNumber,
          phone: data.phone,
          address: data.address,
          department: data.department,
          img: data.img,
          colorCode: data.colorCode,
          availabilityStatus: data.availabilityStatus || "AVAILABLE",
          type: data.type || "FULL",
          role: data.role as "admin" | "doctor" | "staff" | "patient",
          availableFromWeekDay: data.availableFromWeekDay || "MONDAY",
          availableToWeekDay: data.availableToWeekDay || "FRIDAY",
          availableFromTime: data.availableFromTime || "09:00",
          availableToTime: data.availableToTime || "17:00",
          appointmentPrice: data.appointmentPrice || 0,
          clinicId: data.clinicId,
          updatedAt: new Date(),
        },
      }),
  );
}

// Upsert config store value
export async function upsertConfigStore(key: string, value: string) {
  return safeDbQuery(() =>
    db.insert(schema.configStore).values({ key, value }).onConflictDoUpdate({
      target: schema.configStore.key,
      set: { value },
    }),
  );
}
