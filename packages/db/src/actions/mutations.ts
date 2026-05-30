// lib/api/mutations.ts
/**
 * Auto-generated mutations with Drizzle model inference
 */

import { generateId } from "@clinic-app/utils";
import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "..";
import type {
  AppointmentStatus,
  Frequency,
  PaymentMethod,
  Status,
} from "../schema/index";

import * as schema from "../schema/index";
import { feedingLogQueries } from "./queries";
// ============ User Mutations ============

export type User = InferSelectModel<typeof schema.user>;
export type CreateUserInput = InferInsertModel<typeof schema.user>;
export type UpdateUserInput = Partial<CreateUserInput>;

export async function createUser(data: CreateUserInput) {
  const [result] = await db.insert(schema.user).values(data).returning();
  return result;
}

export async function createManyUsers(data: CreateUserInput[]) {
  return await db.insert(schema.user).values(data).returning();
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.user)
    .set(updateData)
    .where(eq(schema.user.id, id))
    .returning();
  return result;
}

export async function updateManyUsers(ids: string[], data: UpdateUserInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.user)
    .set(updateData)
    .where(inArray(schema.user.id, ids))
    .returning();
}

export async function deleteUser(id: string) {
  const [result] = await db
    .delete(schema.user)
    .where(eq(schema.user.id, id))
    .returning();
  return result;
}

// ============ Session Mutations ============

export type Session = InferSelectModel<typeof schema.session>;
export type CreateSessionInput = InferInsertModel<typeof schema.session>;
export type UpdateSessionInput = Partial<CreateSessionInput>;

export async function createSession(data: CreateSessionInput) {
  const [result] = await db.insert(schema.session).values(data).returning();
  return result;
}

export async function createManySessions(data: CreateSessionInput[]) {
  return await db.insert(schema.session).values(data).returning();
}

export async function updateSession(id: string, data: UpdateSessionInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.session)
    .set(updateData)
    .where(eq(schema.session.id, id))
    .returning();
  return result;
}

export async function updateManySessions(
  ids: string[],
  data: UpdateSessionInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.session)
    .set(updateData)
    .where(inArray(schema.session.id, ids))
    .returning();
}

export async function deleteSession(id: string) {
  const [result] = await db
    .delete(schema.session)
    .where(eq(schema.session.id, id))
    .returning();
  return result;
}

// ============ Account Mutations ============

export type Account = InferSelectModel<typeof schema.account>;
export type CreateAccountInput = InferInsertModel<typeof schema.account>;
export type UpdateAccountInput = Partial<CreateAccountInput>;

export async function createAccount(data: CreateAccountInput) {
  const [result] = await db.insert(schema.account).values(data).returning();
  return result;
}

export async function createManyAccounts(data: CreateAccountInput[]) {
  return await db.insert(schema.account).values(data).returning();
}

export async function updateAccount(id: string, data: UpdateAccountInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.account)
    .set(updateData)
    .where(eq(schema.account.id, id))
    .returning();
  return result;
}

export async function updateManyAccounts(
  ids: string[],
  data: UpdateAccountInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.account)
    .set(updateData)
    .where(inArray(schema.account.id, ids))
    .returning();
}

export async function deleteAccount(id: string) {
  const [result] = await db
    .delete(schema.account)
    .where(eq(schema.account.id, id))
    .returning();
  return result;
}

// ============ Verification Mutations ============

export type Verification = InferSelectModel<typeof schema.verification>;
export type CreateVerificationInput = InferInsertModel<
  typeof schema.verification
>;
export type UpdateVerificationInput = Partial<CreateVerificationInput>;

export async function createVerification(data: CreateVerificationInput) {
  const [result] = await db
    .insert(schema.verification)
    .values(data)
    .returning();
  return result;
}

export async function createManyVerifications(data: CreateVerificationInput[]) {
  return await db.insert(schema.verification).values(data).returning();
}

export async function updateVerification(
  id: string,
  data: UpdateVerificationInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.verification)
    .set(updateData)
    .where(eq(schema.verification.id, id))
    .returning();
  return result;
}

export async function updateManyVerifications(
  ids: string[],
  data: UpdateVerificationInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.verification)
    .set(updateData)
    .where(inArray(schema.verification.id, ids))
    .returning();
}

export async function deleteVerification(id: string) {
  const [result] = await db
    .delete(schema.verification)
    .where(eq(schema.verification.id, id))
    .returning();
  return result;
}

// ============ TwoFactor Mutations ============

export type TwoFactor = InferSelectModel<typeof schema.twoFactor>;
export type CreateTwoFactorInput = InferInsertModel<typeof schema.twoFactor>;
export type UpdateTwoFactorInput = Partial<CreateTwoFactorInput>;

export async function createTwoFactor(data: CreateTwoFactorInput) {
  const [result] = await db.insert(schema.twoFactor).values(data).returning();
  return result;
}

export async function createManyTwoFactors(data: CreateTwoFactorInput[]) {
  return await db.insert(schema.twoFactor).values(data).returning();
}

export async function updateTwoFactor(id: string, data: UpdateTwoFactorInput) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.twoFactor)
    .set(updateData)
    .where(eq(schema.twoFactor.id, id))
    .returning();
  return result;
}

export async function updateManyTwoFactors(
  ids: string[],
  data: UpdateTwoFactorInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.twoFactor)
    .set(updateData)
    .where(inArray(schema.twoFactor.id, ids))
    .returning();
}

export async function deleteTwoFactor(id: string) {
  const [result] = await db
    .delete(schema.twoFactor)
    .where(eq(schema.twoFactor.id, id))
    .returning();
  return result;
}

// ============ UserQuota Mutations ============

export type UserQuota = InferSelectModel<typeof schema.userQuota>;
export type CreateUserQuotaInput = InferInsertModel<typeof schema.userQuota>;
export type UpdateUserQuotaInput = Partial<CreateUserQuotaInput>;

export async function createUserQuotaFromInput(data: CreateUserQuotaInput) {
  const [result] = await db.insert(schema.userQuota).values(data).returning();
  return result;
}

export async function createManyUserQuotas(data: CreateUserQuotaInput[]) {
  return await db.insert(schema.userQuota).values(data).returning();
}

export async function updateUserQuota(id: string, data: UpdateUserQuotaInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.userQuota)
    .set(updateData)
    .where(eq(schema.userQuota.userId, id))
    .returning();
  return result;
}

export async function updateManyUserQuotas(
  ids: string[],
  data: UpdateUserQuotaInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.userQuota)
    .set(updateData)
    .where(inArray(schema.userQuota.userId, ids))
    .returning();
}

export async function deleteUserQuota(id: string) {
  const [result] = await db
    .delete(schema.userQuota)
    .where(eq(schema.userQuota.userId, id))
    .returning();
  return result;
}

// ============ Folders Mutations ============

export type Folders = InferSelectModel<typeof schema.folder>;
export type CreateFoldersInput = InferInsertModel<typeof schema.folder>;
export type UpdateFoldersInput = Partial<CreateFoldersInput>;

export async function createFolders(data: CreateFoldersInput) {
  const [result] = await db.insert(schema.folder).values(data).returning();
  return result;
}

export async function createManyFolderss(data: CreateFoldersInput[]) {
  return await db.insert(schema.folder).values(data).returning();
}

export async function updateFolders(id: string, data: UpdateFoldersInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.folder)
    .set(updateData)
    .where(eq(schema.folder.id, id))
    .returning();
  return result;
}

export async function updateManyFolderss(
  ids: string[],
  data: UpdateFoldersInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.folder)
    .set(updateData)
    .where(inArray(schema.folder.id, ids))
    .returning();
}

export async function deleteFolders(id: string) {
  const [result] = await db
    .delete(schema.folder)
    .where(eq(schema.folder.id, id))
    .returning();
  return result;
}

// ============ Files Mutations ============

export type Files = InferSelectModel<typeof schema.file>;
export type CreateFilesInput = InferInsertModel<typeof schema.file>;
export type UpdateFilesInput = Partial<CreateFilesInput>;

export async function createFiles(data: CreateFilesInput) {
  const [result] = await db.insert(schema.file).values(data).returning();
  return result;
}

export async function createManyFiless(data: CreateFilesInput[]) {
  return await db.insert(schema.file).values(data).returning();
}

export async function updateFiles(id: string, data: UpdateFilesInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.file)
    .set(updateData)
    .where(eq(schema.file.id, id))
    .returning();
  return result;
}

export async function updateManyFiless(ids: string[], data: UpdateFilesInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.file)
    .set(updateData)
    .where(inArray(schema.file.id, ids))
    .returning();
}

export async function deleteFiles(id: string) {
  const [result] = await db
    .delete(schema.file)
    .where(eq(schema.file.id, id))
    .returning();
  return result;
}

// ============ ConfigStore Mutations ============

export type ConfigStore = InferSelectModel<typeof schema.configStore>;
export type CreateConfigStoreInput = InferInsertModel<
  typeof schema.configStore
>;
export type UpdateConfigStoreInput = Partial<CreateConfigStoreInput>;

export async function createConfigStore(data: CreateConfigStoreInput) {
  const [result] = await db.insert(schema.configStore).values(data).returning();
  return result;
}

export async function createManyConfigStores(data: CreateConfigStoreInput[]) {
  return await db.insert(schema.configStore).values(data).returning();
}

export async function updateConfigStore(
  id: string,
  data: UpdateConfigStoreInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.configStore)
    .set(updateData)
    .where(eq(schema.configStore.key, id))
    .returning();
  return result;
}

export async function updateManyConfigStores(
  ids: string[],
  data: UpdateConfigStoreInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.configStore)
    .set(updateData)
    .where(inArray(schema.configStore.key, ids))
    .returning();
}

export async function deleteConfigStore(id: string) {
  const [result] = await db
    .delete(schema.configStore)
    .where(eq(schema.configStore.key, id))
    .returning();
  return result;
}

// ============ Invites Mutations ============

export type Invites = InferSelectModel<typeof schema.invite>;
export type CreateInvitesInput = InferInsertModel<typeof schema.invite>;
export type UpdateInvitesInput = Partial<CreateInvitesInput>;

export async function createInvites(data: CreateInvitesInput) {
  const [result] = await db.insert(schema.invite).values(data).returning();
  return result;
}

export async function createManyInvitess(data: CreateInvitesInput[]) {
  return await db.insert(schema.invite).values(data).returning();
}

export async function updateInvites(id: string, data: UpdateInvitesInput) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.invite)
    .set(updateData)
    .where(eq(schema.invite.code, id))
    .returning();
  return result;
}

export async function updateManyInvitess(
  ids: string[],
  data: UpdateInvitesInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.invite)
    .set(updateData)
    .where(inArray(schema.invite.code, ids))
    .returning();
}

export async function deleteInvites(id: string) {
  const [result] = await db
    .delete(schema.invite)
    .where(eq(schema.invite.code, id))
    .returning();
  return result;
}

// ============ Clinics Mutations ============

export type Clinics = InferSelectModel<typeof schema.clinic>;
export type CreateClinicsInput = InferInsertModel<typeof schema.clinic>;
export type UpdateClinicsInput = Partial<CreateClinicsInput>;

export async function createClinics(data: CreateClinicsInput) {
  const [result] = await db.insert(schema.clinic).values(data).returning();
  return result;
}

export async function createManyClinicss(data: CreateClinicsInput[]) {
  return await db.insert(schema.clinic).values(data).returning();
}

export async function updateClinics(id: string, data: UpdateClinicsInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.clinic)
    .set(updateData)
    .where(eq(schema.clinic.id, id))
    .returning();
  return result;
}

export async function updateManyClinicss(
  ids: string[],
  data: UpdateClinicsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.clinic)
    .set(updateData)
    .where(inArray(schema.clinic.id, ids))
    .returning();
}

export async function deleteClinics(id: string) {
  const [result] = await db
    .delete(schema.clinic)
    .where(eq(schema.clinic.id, id))
    .returning();
  return result;
}

export async function softDeleteClinics(id: string) {
  const [result] = await db
    .update(schema.clinic)
    .set({ deletedAt: new Date() })
    .where(eq(schema.clinic.id, id))
    .returning();
  return result;
}

export async function restoreClinics(id: string) {
  const [result] = await db
    .update(schema.clinic)
    .set({ deletedAt: null })
    .where(eq(schema.clinic.id, id))
    .returning();
  return result;
}

// ============ ClinicMembers Mutations ============

export type ClinicMembers = InferSelectModel<typeof schema.clinicMember>;
export type CreateClinicMembersInput = InferInsertModel<
  typeof schema.clinicMember
>;
export type UpdateClinicMembersInput = Partial<CreateClinicMembersInput>;

export async function createClinicMembers(data: CreateClinicMembersInput) {
  const [result] = await db
    .insert(schema.clinicMember)
    .values(data)
    .returning();
  return result;
}

export async function createManyClinicMemberss(
  data: CreateClinicMembersInput[],
) {
  return await db.insert(schema.clinicMember).values(data).returning();
}

export async function updateClinicMembers(
  id: string,
  data: UpdateClinicMembersInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.clinicMember)
    .set(updateData)
    .where(eq(schema.clinicMember.userId, id))
    .returning();
  return result;
}

export async function updateManyClinicMemberss(
  ids: string[],
  data: UpdateClinicMembersInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.clinicMember)
    .set(updateData)
    .where(inArray(schema.clinicMember.userId, ids))
    .returning();
}

export async function deleteClinicMembers(id: string) {
  const [result] = await db
    .delete(schema.clinicMember)
    .where(eq(schema.clinicMember.userId, id))
    .returning();
  return result;
}

// ============ Doctor Mutations ============

export type Doctor = InferSelectModel<typeof schema.doctor>;
export type CreateDoctorInput = InferInsertModel<typeof schema.doctor>;
export type UpdateDoctorInput = Partial<CreateDoctorInput>;

export async function createDoctor(data: CreateDoctorInput) {
  const [result] = await db.insert(schema.doctor).values(data).returning();
  return result;
}

export async function createManyDoctors(data: CreateDoctorInput[]) {
  return await db.insert(schema.doctor).values(data).returning();
}

export async function updateDoctor(id: string, data: UpdateDoctorInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.doctor)
    .set(updateData)
    .where(eq(schema.doctor.id, id))
    .returning();
  return result;
}

export async function updateManyDoctors(
  ids: string[],
  data: UpdateDoctorInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.doctor)
    .set(updateData)
    .where(inArray(schema.doctor.id, ids))
    .returning();
}

export async function deleteDoctor(id: string, clinicId?: string) {
  const conditions = [eq(schema.doctor.id, id)];
  if (clinicId) conditions.push(eq(schema.doctor.clinicId, clinicId));

  const [result] = await db
    .delete(schema.doctor)
    .where(and(...conditions))
    .returning();
  return result;
}

export async function softDeleteDoctor(id: string, clinicId?: string) {
  const [result] = await db
    .update(schema.doctor)
    .set({ deletedAt: new Date(), ...(clinicId ? { clinicId } : {}) })
    .where(eq(schema.doctor.id, id))
    .returning();
  return result;
}

export async function restoreDoctor(id: string) {
  const [result] = await db
    .update(schema.doctor)
    .set({ deletedAt: null })
    .where(eq(schema.doctor.id, id))
    .returning();
  return result;
}

// ============ WorkingDay Mutations ============

export type WorkingDay = InferSelectModel<typeof schema.workingDay>;
export type CreateWorkingDayInput = InferInsertModel<typeof schema.workingDay>;
export type UpdateWorkingDayInput = Partial<CreateWorkingDayInput>;

export async function createWorkingDay(data: CreateWorkingDayInput) {
  const [result] = await db.insert(schema.workingDay).values(data).returning();
  return result;
}

export async function createManyWorkingDays(data: CreateWorkingDayInput[]) {
  return await db.insert(schema.workingDay).values(data).returning();
}

export async function updateWorkingDay(
  id: string,
  data: UpdateWorkingDayInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.workingDay)
    .set(updateData)
    .where(eq(schema.workingDay.id, id))
    .returning();
  return result;
}

export async function updateManyWorkingDays(
  ids: string[],
  data: UpdateWorkingDayInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.workingDay)
    .set(updateData)
    .where(inArray(schema.workingDay.id, ids))
    .returning();
}

export async function deleteWorkingDay(id: string, clinicId?: string) {
  const conditions = [eq(schema.workingDay.id, id)];
  if (clinicId) conditions.push(eq(schema.doctor.clinicId, clinicId));

  const [result] = await db
    .delete(schema.workingDay)
    .where(and(...conditions))
    .returning();
  return result;
}

// ============ Staff Mutations ============

export type Staff = InferSelectModel<typeof schema.staff>;
export type CreateStaffInput = InferInsertModel<typeof schema.staff>;
export type UpdateStaffInput = Partial<CreateStaffInput>;

export async function createStaff(data: CreateStaffInput) {
  const [result] = await db.insert(schema.staff).values(data).returning();
  return result;
}

export async function createManyStaffs(data: CreateStaffInput[]) {
  return await db.insert(schema.staff).values(data).returning();
}

export async function updateStaff(id: string, data: UpdateStaffInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.staff)
    .set(updateData)
    .where(eq(schema.staff.id, id))
    .returning();
  return result;
}

export async function updateManyStaffs(ids: string[], data: UpdateStaffInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.staff)
    .set(updateData)
    .where(inArray(schema.staff.id, ids))
    .returning();
}

export async function deleteStaff(id: string) {
  const [result] = await db
    .delete(schema.staff)
    .where(eq(schema.staff.id, id))
    .returning();
  return result;
}

export async function softDeleteStaff(id: string) {
  const [result] = await db
    .update(schema.staff)
    .set({ deletedAt: new Date() })
    .where(eq(schema.staff.id, id))
    .returning();
  return result;
}

export async function restoreStaff(id: string) {
  const [result] = await db
    .update(schema.staff)
    .set({ deletedAt: null })
    .where(eq(schema.staff.id, id))
    .returning();
  return result;
}

// ============ Patient Mutations ============

export type Patient = InferSelectModel<typeof schema.patient>;
export type CreatePatientInput = InferInsertModel<typeof schema.patient>;
export type UpdatePatientInput = Partial<CreatePatientInput>;

export async function createPatient(data: CreatePatientInput) {
  const [result] = await db.insert(schema.patient).values(data).returning();
  return result;
}

export async function createManyPatients(data: CreatePatientInput[]) {
  return await db.insert(schema.patient).values(data).returning();
}

export async function updatePatient(id: string, data: UpdatePatientInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.patient)
    .set(updateData)
    .where(eq(schema.patient.id, id))
    .returning();
  return result;
}

export async function updateManyPatients(
  ids: string[],
  data: UpdatePatientInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.patient)
    .set(updateData)
    .where(inArray(schema.patient.id, ids))
    .returning();
}

export async function deletePatient(id: string, clinicId: string) {
  const [result] = await db
    .delete(schema.patient)
    .where(
      and(eq(schema.patient.id, id), eq(schema.patient.clinicId, clinicId)),
    )
    .returning();
  return result;
}

export async function softDeletePatient(id: string, clinicId: string) {
  const [result] = await db
    .update(schema.patient)
    .set({ deletedAt: new Date(), clinicId })
    .where(eq(schema.patient.id, id))
    .returning();
  return result;
}

export async function restorePatient(id: string) {
  const [result] = await db
    .update(schema.patient)
    .set({ deletedAt: null })
    .where(eq(schema.patient.id, id))
    .returning();
  return result;
}
export async function createPatientWithGuardian(
  patientData: CreatePatientInput,
  guardianData?: Omit<CreateGuardiansInput, "patientId">,
) {
  return await db.transaction(async (tx) => {
    // Create patient
    const [patient] = await tx
      .insert(schema.patient)
      .values({
        ...patientData,
        id: patientData.id ?? crypto.randomUUID(),
      })
      .returning();

    // Create guardian if provided
    if (guardianData && patient) {
      await tx.insert(schema.guardian).values({
        ...guardianData,
        id: crypto.randomUUID(),
        patientId: patient.id,
      });
    }

    // Create initial growth record if age appropriate
    if (patient?.dateOfBirth) {
      const ageInDays = Math.floor(
        (Date.now() - patient?.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (ageInDays <= 730) {
        // First 2 years
        await tx.insert(schema.growthRecord).values({
          id: crypto.randomUUID(),
          patientId: patient?.id,
          clinicId: patient?.clinicId,
          date: new Date(),
          ageDays: ageInDays,
          ageMonths: Math.floor(ageInDays / 30),
          gender: patient?.gender as schema.Gender,
        });
      }
    }

    return patient;
  });
}

export async function bulkUpdatePatientStatus(
  patientIds: string[],
  status: Status,
) {
  return await db
    .update(schema.patient)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "INACTIVE" ? { isActive: false } : {}),
    })
    .where(inArray(schema.patient.id, patientIds))
    .returning();
}
// ============ Appointment Mutations ============
export type CreateCompleteEncounterInput = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medicalRecord: Omit<
    CreateMedicalRecordInput,
    "id" | "clinicId" | "patientId" | "appointmentId" | "doctorId"
  >;
  diagnosis: Omit<
    CreateDiagnosisInput,
    "id" | "medicalId" | "patientId" | "doctorId" | "appointmentId"
  >;
  vitals?: Omit<CreateVitalSignInput, "id" | "medicalId" | "encounterId">;
  growth?: Omit<CreateGrowthRecordInput, "id" | "patientId">;
};

export const EncounterMutations = {
  async createDiagnosis(data: Omit<CreateDiagnosisInput, "id">) {
    const [result] = await db
      .insert(schema.diagnosis)
      .values({
        ...data,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  },
  async createCompleteEncounter(data: CreateCompleteEncounterInput) {
    return await db.transaction(async (tx) => {
      // 1. Fetch appointment & clinic
      const appointment = await tx.query.appointment.findFirst({
        where: { id: data.appointmentId },
        columns: { clinicId: true },
      });

      if (!appointment?.clinicId) throw new Error("Clinic not assigned");

      // 2. Complete appointment
      await tx
        .update(schema.appointment)
        .set({ status: "COMPLETED" })
        .where(eq(schema.appointment.id, data.appointmentId));

      const recordId = crypto.randomUUID();

      // 3. Insert Records
      const [record]: (typeof schema.medicalRecord.$inferSelect)[] = await tx
        .insert(schema.medicalRecord)
        .values({
          id: recordId,
          clinicId: appointment.clinicId,
          ...data.medicalRecord,
          patientId: data.patientId,
          appointmentId: data.appointmentId,
          doctorId: data.doctorId,
        })
        .returning();

      const [diagnosis]: (typeof schema.diagnosis.$inferSelect)[] = await tx
        .insert(schema.diagnosis)
        .values({
          id: crypto.randomUUID(),
          medicalId: recordId,
          ...data.diagnosis,
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId,
        })
        .returning();

      // 4. Conditional Inserts
      let vitalSigns: typeof schema.vitalSign.$inferSelect | undefined;
      if (data.vitals) {
        const [vitalsResult] = await tx
          .insert(schema.vitalSign)
          .values({
            id: crypto.randomUUID(),
            medicalId: recordId,
            ...data.vitals,
          })
          .returning();
        vitalSigns = vitalsResult;
      }

      let growthRecord: typeof schema.growthRecord.$inferSelect | undefined;
      if (data.growth) {
        const [growthResult] = await tx
          .insert(schema.growthRecord)
          .values({
            id: crypto.randomUUID(),
            patientId: data.patientId,
            ...data.growth,
          })
          .returning();
        growthRecord = growthResult;
      }

      return { medicalRecord: record, diagnosis, vitalSigns, growthRecord };
    });
  },
};
export type Appointment = InferSelectModel<typeof schema.appointment>;
export type CreateAppointmentInput = InferInsertModel<
  typeof schema.appointment
>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
) {
  const [result] = await db
    .update(schema.appointment)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.appointment.id, id))
    .returning();
  return result;
}
export async function createAppointment(data: CreateAppointmentInput) {
  const [result] = await db.insert(schema.appointment).values(data).returning();
  return result;
}

export async function createManyAppointments(data: CreateAppointmentInput[]) {
  return await db.insert(schema.appointment).values(data).returning();
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.appointment)
    .set(updateData)
    .where(eq(schema.appointment.id, id))
    .returning();
  return result;
}

export async function updateManyAppointments(
  ids: string[],
  data: UpdateAppointmentInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.appointment)
    .set(updateData)
    .where(inArray(schema.appointment.id, ids))
    .returning();
}

export async function deleteAppointment(id: string) {
  const [result] = await db
    .delete(schema.appointment)
    .where(eq(schema.appointment.id, id))
    .returning();
  return result;
}

export async function softDeleteAppointment(id: string) {
  const [result] = await db
    .update(schema.appointment)
    .set({ deletedAt: new Date() })
    .where(eq(schema.appointment.id, id))
    .returning();
  return result;
}
export async function createAppointmentWithReminder(
  data: CreateAppointmentInput,
  reminderData?: Omit<CreateReminderInput, "appointmentId">,
) {
  return await db.transaction(async (tx) => {
    // Check for conflicts
    const existingAppointment = await tx.query.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        time: data.time ?? "",
        isDeleted: false,
        appointmentDate: { gte: data.appointmentDate },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    });

    if (existingAppointment) {
      throw new Error("Time slot already booked");
    }

    // Create appointment
    const [appointment] = await tx
      .insert(schema.appointment)
      .values({
        ...data,
        id: data.id ?? crypto.randomUUID(),
      })
      .returning();

    // Create reminder if requested
    if (reminderData && appointment) {
      await tx.insert(schema.reminder).values({
        ...reminderData,
        id: crypto.randomUUID(),
        appointmentId: appointment.id,
        status: "PENDING",
      });
    }

    // Create notification for patient
    const patient = await tx.query.patient.findFirst({
      where: { id: data.patientId },
      with: { user: true },
    });

    if (patient?.userId) {
      await tx.insert(schema.notification).values({
        id: crypto.randomUUID(),
        userId: patient.userId,
        clinicId: data.clinicId,
        title: "Appointment Scheduled",
        body: `Your appointment has been scheduled for ${new Date(data.appointmentDate).toLocaleDateString()} at ${data.time}`,
        type: "appointment_scheduled",
        priority: "high",
      });
    }

    return appointment;
  });
}
export async function createMedicalRecordWithEncounter(data: {
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatmentPlan: string;
  vitalSigns?: typeof schema.vitalSign.$inferInsert;
  prescriptions?: Array<{
    medicationName: string;
    dosageValue: number;
    dosageUnit: string;
    frequency: string;
    duration: string;
  }>;
}) {
  return await db.transaction(async (tx) => {
    // Create medical record
    const [medicalRecord] = await tx
      .insert(schema.medicalRecord)
      .values({
        id: crypto.randomUUID(),
        patientId: data.patientId,

        doctorId: data.doctorId,
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatmentPlan: data.treatmentPlan,
        status: "ACTIVE",
      })
      .returning();

    // Create diagnosis record
    const [diagnosis] = await tx
      .insert(schema.diagnosis)
      .values({
        id: crypto.randomUUID(),
        patientId: data.patientId,
        doctorId: data.doctorId,
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        medicalId: medicalRecord?.id ?? "",
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        status: "CONFIRMED" as Status,
      })
      .returning();

    // Create vital signs if provided
    if (data.vitalSigns) {
      await tx.insert(schema.vitalSign).values({
        ...data.vitalSigns,
        id: crypto.randomUUID(),
        medicalId: medicalRecord?.id ?? "",
        clinicId: data.clinicId,
      });
    }

    // Create prescriptions if provided
    if (data.prescriptions && data.prescriptions.length > 0) {
      const [prescription] = await tx
        .insert(schema.prescription)
        .values({
          id: crypto.randomUUID(),
          medicalRecordId: medicalRecord?.id ?? "",
          patientId: data.patientId,
          doctorId: data.doctorId,
          clinicId: data.clinicId,
          encounterId: data.appointmentId,
          status: "active",
          issuedDate: new Date(),
        })
        .returning();

      for (const med of data.prescriptions) {
        // Find or create drug
        let drug = await tx.query.drug.findFirst({
          where: { name: med.medicationName },
        });

        if (!drug) {
          [drug] = await tx
            .insert(schema.drug)
            .values({
              id: crypto.randomUUID(),
              name: med.medicationName,
            })
            .returning();
        }

        await tx.insert(schema.prescribedItem).values({
          id: crypto.randomUUID(),
          prescriptionId: prescription?.id ?? "",
          clinicId: data.clinicId,
          drugId: drug?.id ?? "",
          dosageValue: med.dosageValue,
          dosageUnit: med.dosageUnit,
          frequency: med.frequency as Frequency,
          duration: med.duration,
        });
      }
    }

    // Update appointment status
    await tx
      .update(schema.appointment)
      .set({ status: "COMPLETED" })
      .where(eq(schema.appointment.id, data.appointmentId));

    return { medicalRecord, diagnosis };
  });
}
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: Date,
  newTime: string,
  reason?: string,
) {
  return await db.transaction(async (tx) => {
    const appointment = await tx.query.appointment.findFirst({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check new time slot availability
    const conflict = await tx.query.appointment.findFirst({
      // FIX: Use the relational operators callback configuration

      where: {
        doctorId: appointment.doctorId,
        time: appointment.time ?? "",
        isDeleted: false,
        appointmentDate: { gte: appointment.appointmentDate },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    });

    if (conflict) {
      throw new Error("New time slot is already booked");
    }

    // Update appointment
    const [updated] = await tx
      .update(schema.appointment)
      .set({
        appointmentDate: newDate,
        time: newTime,
        note: reason
          ? `${appointment.note || ""}\nRescheduled: ${reason}`
          : appointment.note,
        updatedAt: new Date(),
      })
      // Core API update blocks DO use global operators like `eq()`
      .where(eq(schema.appointment.id, appointmentId))
      .returning();

    // Notify patient
    const patient = await tx.query.patient.findFirst({
      where: { id: appointment.patientId },
      with: { user: true },
    });

    if (patient?.userId) {
      await tx.insert(schema.notification).values({
        id: crypto.randomUUID(),
        userId: patient.userId,
        clinicId: appointment.clinicId,
        title: "Appointment Rescheduled",
        body: `Your appointment has been rescheduled to ${newDate.toLocaleDateString()} at ${newTime}`,
        type: "appointment_rescheduled",
        priority: "high",
      });
    }

    return updated;
  });
}
export async function restoreAppointment(id: string) {
  const [result] = await db
    .update(schema.appointment)
    .set({ deletedAt: null })
    .where(eq(schema.appointment.id, id))
    .returning();
  return result;
}
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  clinicId: string,
) {
  return await db.transaction(async (tx) => {
    const [appointment] = await tx
      .update(schema.appointment)
      .set({
        status: "CANCELLED",
        note: reason,
        updatedAt: new Date(),
        clinicId,
      })
      .where(eq(schema.appointment.id, appointmentId))
      .returning();

    // Create cancellation notification
    if (appointment) {
      await tx.insert(schema.notification).values({
        id: crypto.randomUUID(),
        userId: appointment.patientId,
        clinicId: appointment.clinicId,
        title: "Appointment Cancelled",
        body: `Your appointment has been cancelled. Reason: ${reason}`,
        type: "appointment_cancelled",
        priority: "high",
      });
    }

    return appointment;
  });
}

// ============ MedicalRecord Mutations ============

export type MedicalRecord = InferSelectModel<typeof schema.medicalRecord>;
export type CreateMedicalRecordInput = InferInsertModel<
  typeof schema.medicalRecord
>;
export type UpdateMedicalRecordInput = Partial<CreateMedicalRecordInput>;

export async function createMedicalRecord(data: CreateMedicalRecordInput) {
  // Use a transaction if you plan to add more operations later
  return await db.transaction(async (tx) => {
    const [result] = await tx
      .insert(schema.medicalRecord)
      .values(data)
      .returning();

    if (!result) {
      throw new Error("Failed to create medical record");
    }

    return result;
  });
}

export async function createManyMedicalRecords(
  data: CreateMedicalRecordInput[],
) {
  return await db.insert(schema.medicalRecord).values(data).returning();
}

export async function updateMedicalRecord(
  id: string,
  data: UpdateMedicalRecordInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.medicalRecord)
    .set(updateData)
    .where(eq(schema.medicalRecord.id, id))
    .returning();
  return result;
}

export async function updateManyMedicalRecords(
  ids: string[],
  data: UpdateMedicalRecordInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.medicalRecord)
    .set(updateData)
    .where(inArray(schema.medicalRecord.id, ids))
    .returning();
}

export async function deleteMedicalRecord(id: string) {
  const [result] = await db
    .delete(schema.medicalRecord)
    .where(eq(schema.medicalRecord.id, id))
    .returning();
  return result;
}

export async function softDeleteMedicalRecord(id: string) {
  const [result] = await db
    .update(schema.medicalRecord)
    .set({ deletedAt: new Date() })
    .where(eq(schema.medicalRecord.id, id))
    .returning();
  return result;
}
export async function addVitalSignsToMedicalRecord(
  medicalRecordId: string,
  vitalSigns: Omit<CreateVitalSignInput, "medicalId" | "id">,
) {
  const [vitalSign] = await db
    .insert(schema.vitalSign)
    .values({
      ...vitalSigns,
      id: crypto.randomUUID(),
      medicalId: medicalRecordId,
    })
    .returning();

  if (vitalSigns.growthRecordId) {
    const growthRec = await db.query.growthRecord.findFirst({
      where: {
        id: vitalSigns.growthRecordId,
      },
    });

    // 3. Extract the weight and height properties directly from the growthRecord entity
    if (growthRec?.weight && growthRec.height) {
      const heightNum = Number(growthRec.height);
      const weightNum = Number(growthRec.weight);

      const bmi = weightNum / (heightNum / 100) ** 2;
      const bmiValue = Number.parseFloat(bmi.toFixed(1));

      // 4. Update the vitalSign record notes securely
      await db
        .update(schema.vitalSign)
        .set({ notes: `Calculated BMI: ${bmiValue}` })
        .where(eq(schema.vitalSign.id, vitalSign?.id ?? ""));

      // 5. Sync to growth tracking using correct Drizzle Relational Queries v2 syntax
      const mr = await db.query.medicalRecord.findFirst({
        where: {
          id: medicalRecordId,
        },
      });

      if (mr) {
        await recordGrowthWithPercentiles({
          patientId: mr.patientId,
          clinicId: mr.clinicId,
          date: new Date(),
          weight: weightNum,
          height: heightNum,
          bmi: bmiValue,
        });
      }
    }
  }

  return vitalSign;
}
// ============ Diagnosis Mutations ============

export type Diagnosis = InferSelectModel<typeof schema.diagnosis>;
export type CreateDiagnosisInput = InferInsertModel<typeof schema.diagnosis>;
export type UpdateDiagnosisInput = Partial<CreateDiagnosisInput>;

export async function createDiagnosis(data: CreateDiagnosisInput) {
  const [result] = await db.insert(schema.diagnosis).values(data).returning();
  return result;
}
export async function restoreMedicalRecord(id: string) {
  const [result] = await db
    .update(schema.medicalRecord)
    .set({ deletedAt: null })
    .where(eq(schema.medicalRecord.id, id))
    .returning();
  return result;
}
export async function completeEncounter(encounterData: {
  medicalRecordId: string;
  diagnosisId?: string;
  notes?: string;
  followUpDate?: Date;
  prescribedMedications?: Array<{
    drugId: string;
    dosageValue: number;
    dosageUnit: string;
    frequency: Frequency;
    duration: string;
    instructions?: string;
  }>;
}) {
  return await db.transaction(async (tx) => {
    // Update medical record
    const [medicalRecord] = await tx
      .update(schema.medicalRecord)
      .set({
        status: "COMPLETED",
        notes: encounterData.notes,
        followUpDate: encounterData.followUpDate,
        updatedAt: new Date(),
      })
      .where(eq(schema.medicalRecord.id, encounterData.medicalRecordId))
      .returning();

    if (!medicalRecord) {
      throw new Error("Medical record not found");
    }

    // Create prescriptions if provided
    const prescriptions = [];
    if (encounterData.prescribedMedications?.length) {
      const [prescription] = await tx
        .insert(schema.prescription)
        .values({
          id: crypto.randomUUID(),
          medicalRecordId: medicalRecord.id,
          patientId: medicalRecord.patientId,
          doctorId: medicalRecord.doctorId,
          clinicId: medicalRecord.clinicId,
          encounterId: encounterData.diagnosisId || "",
          status: "active",
          issuedDate: new Date(),
        })
        .returning();

      for (const med of encounterData.prescribedMedications) {
        const [prescribedItem] = await tx
          .insert(schema.prescribedItem)
          .values({
            id: crypto.randomUUID(),
            prescriptionId: prescription?.id ?? "",
            clinicId: medicalRecord.clinicId,
            drugId: med.drugId,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
          })
          .returning();
        prescriptions.push(prescribedItem);
      }
    }

    // Update appointment status
    await tx
      .update(schema.appointment)
      .set({ status: "COMPLETED" })
      .where(eq(schema.appointment.id, medicalRecord.appointmentId));

    return { medicalRecord, prescriptions };
  });
}

export async function createManyDiagnosiss(data: CreateDiagnosisInput[]) {
  return await db.insert(schema.diagnosis).values(data).returning();
}

export async function updateDiagnosis(id: string, data: UpdateDiagnosisInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.diagnosis)
    .set(updateData)
    .where(eq(schema.diagnosis.id, id))
    .returning();
  return result;
}

export async function updateManyDiagnosiss(
  ids: string[],
  data: UpdateDiagnosisInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.diagnosis)
    .set(updateData)
    .where(inArray(schema.diagnosis.id, ids))
    .returning();
}

export async function deleteDiagnosis(id: string) {
  const [result] = await db
    .delete(schema.diagnosis)
    .where(eq(schema.diagnosis.id, id))
    .returning();
  return result;
}

export async function softDeleteDiagnosis(id: string, clinicId: string) {
  const [result] = await db
    .update(schema.diagnosis)
    .set({ deletedAt: new Date(), clinicId })
    .where(eq(schema.diagnosis.id, id))
    .returning();
  return result;
}

export async function restoreDiagnosis(id: string) {
  const [result] = await db
    .update(schema.diagnosis)
    .set({ deletedAt: null })
    .where(eq(schema.diagnosis.id, id))
    .returning();
  return result;
}

// ============ VitalSign Mutations ============

export type VitalSign = InferSelectModel<typeof schema.vitalSign>;
export type CreateVitalSignInput = InferInsertModel<typeof schema.vitalSign>;
export type UpdateVitalSignInput = Partial<CreateVitalSignInput>;

export async function createVitalSign(data: CreateVitalSignInput) {
  const [result] = await db.insert(schema.vitalSign).values(data).returning();
  return result;
}

export async function createManyVitalSigns(data: CreateVitalSignInput[]) {
  return await db.insert(schema.vitalSign).values(data).returning();
}

export async function updateVitalSign(id: string, data: UpdateVitalSignInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.vitalSign)
    .set(updateData)
    .where(eq(schema.vitalSign.id, id))
    .returning();
  return result;
}

export async function updateManyVitalSigns(
  ids: string[],
  data: UpdateVitalSignInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.vitalSign)
    .set(updateData)
    .where(inArray(schema.vitalSign.id, ids))
    .returning();
}

export async function deleteVitalSign(id: string) {
  const [result] = await db
    .delete(schema.vitalSign)
    .where(eq(schema.vitalSign.id, id))
    .returning();
  return result;
}

// ============ GrowthRecord Mutations ============

export type GrowthRecord = InferSelectModel<typeof schema.growthRecord>;
export type CreateGrowthRecordInput = InferInsertModel<
  typeof schema.growthRecord
>;
export type UpdateGrowthRecordInput = Partial<CreateGrowthRecordInput>;

export async function createGrowthRecord(data: CreateGrowthRecordInput) {
  const [result] = await db
    .insert(schema.growthRecord)
    .values(data)
    .returning();
  return result;
}

export async function recordGrowthWithPercentiles(
  data: Omit<CreateGrowthRecordInput, "id">,
) {
  return await db.transaction(async (tx) => {
    // Calculate age in days/months
    const patient = await tx.query.patient.findFirst({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    const ageDays = Math.floor(
      (data.date.getTime() - patient.dateOfBirth.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const ageMonths = Math.floor(ageDays / 30);

    // Find WHO standards for comparison
    const whoStandards = await tx.query.whoGrowthStandard.findMany({
      where: {
        gender: patient.gender as schema.Gender,
        ageDays: {
          lte: ageDays + 30,
          gte: ageDays - 30,
        },
      },
    });

    // Calculate Z-scores
    let weightForAgeZ: number | undefined;
    let heightForAgeZ: number | undefined;
    let bmiForAgeZ: number | undefined;

    const weightStandard = whoStandards.find(
      (s) => s.measurementType === "WEIGHT",
    );
    if (weightStandard && data.weight) {
      weightForAgeZ =
        (data.weight - weightStandard.mValue) / weightStandard.sValue;
    }

    const heightStandard = whoStandards.find(
      (s) => s.measurementType === "HEIGHT",
    );
    if (heightStandard && data.height) {
      heightForAgeZ =
        (data.height - heightStandard.mValue) / heightStandard.sValue;
    }

    if (data.bmi) {
      const bmiStandard = whoStandards.find((s) => s.measurementType === "BMI");
      if (bmiStandard) {
        bmiForAgeZ = (data.bmi - bmiStandard.mValue) / bmiStandard.sValue;
      }
    }

    // Create growth record
    const [growthRecord] = await tx
      .insert(schema.growthRecord)
      .values({
        ...data,
        id: crypto.randomUUID(),
        ageDays,
        ageMonths,
        weightForAgeZ,
        heightForAgeZ,
        bmiForAgeZ,
      })
      .returning();

    // Create alert for abnormal growth
    if (weightForAgeZ && (weightForAgeZ < -2 || weightForAgeZ > 2)) {
      await tx.insert(schema.alert).values({
        id: crypto.randomUUID(),
        title: "Abnormal Growth Pattern",
        message: `Patient ${patient.firstName} ${patient.lastName} has abnormal weight-for-age Z-score: ${weightForAgeZ.toFixed(2)}`,
        type: "growth_alert",
        action: { label: "View Patient", href: `/patients/${patient.id}` },
      });
    }

    return growthRecord;
  });
}
export async function createManyGrowthRecords(data: CreateGrowthRecordInput[]) {
  return await db.insert(schema.growthRecord).values(data).returning();
}

export async function updateGrowthRecord(
  id: string,
  data: UpdateGrowthRecordInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.growthRecord)
    .set(updateData)
    .where(eq(schema.growthRecord.id, id))
    .returning();
  return result;
}

export async function updateManyGrowthRecords(
  ids: string[],
  data: UpdateGrowthRecordInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.growthRecord)
    .set(updateData)
    .where(inArray(schema.growthRecord.id, ids))
    .returning();
}

export async function deleteGrowthRecord(id: string) {
  const [result] = await db
    .delete(schema.growthRecord)
    .where(eq(schema.growthRecord.id, id))
    .returning();
  return result;
}

// ============ Immunization Mutations ============

export type Immunization = InferSelectModel<typeof schema.immunization>;
export type CreateImmunizationInput = InferInsertModel<
  typeof schema.immunization
>;
export type UpdateImmunizationInput = Partial<CreateImmunizationInput>;

export async function createImmunization(data: CreateImmunizationInput) {
  const [result] = await db
    .insert(schema.immunization)
    .values(data)
    .returning();
  return result;
}
export async function recordImmunizationWithInventory(
  data: CreateImmunizationInput & { vaccineInventoryId?: string },
) {
  return await db.transaction(async (tx) => {
    // Check vaccine inventory
    if (data.vaccineInventoryId) {
      const inventory = await tx.query.vaccineInventory.findFirst({
        where: { id: data.vaccineInventoryId },
      });

      if (!inventory || inventory.quantity < 1) {
        throw new Error("Insufficient vaccine stock");
      }

      // Update inventory
      await tx
        .update(schema.vaccineInventory)
        .set({
          quantity: inventory.quantity - 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.vaccineInventory.id, data.vaccineInventoryId));
    }

    // Record immunization
    const [immunization] = await tx
      .insert(schema.immunization)
      .values({
        ...data,
        id: data.id ?? crypto.randomUUID(),
        recordId: data.recordId ?? crypto.randomUUID(),
        status: "COMPLETED",
      })
      .returning();

    // Check for overdue status
    const vaccineSchedule = await tx.query.vaccineSchedule.findFirst({
      where: { vaccineName: data.vaccine },
    });

    if (vaccineSchedule?.ageInDaysMax) {
      const patient = await tx.query.patient.findFirst({
        where: { id: data.patientId },
      });

      if (patient) {
        const ageAtVaccination = Math.floor(
          (data.date.getTime() - patient.dateOfBirth.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (ageAtVaccination > vaccineSchedule.ageInDaysMax) {
          await tx
            .update(schema.immunization)
            .set({ isOverDue: true })
            .where(eq(schema.immunization.id, immunization?.id ?? ""));
        }
      }
    }

    return immunization;
  });
}

export async function bulkUpdateVaccineInventory(
  clinicId: string,
  updates: Array<{
    vaccineName: string;
    quantity: number;
    lotNumber?: string;
    expirationDate?: Date;
  }>,
) {
  return await db.transaction(async (tx) => {
    const results = [];
    for (const update of updates) {
      const existing = await tx.query.vaccineInventory.findFirst({
        where: {
          clinicId,
          vaccineName: update.vaccineName,
        },
      });

      if (existing) {
        const [updated] = await tx
          .update(schema.vaccineInventory)
          .set({
            quantity: existing.quantity + update.quantity,
            lotNumber: update.lotNumber || existing.lotNumber,
            expirationDate: update.expirationDate || existing.expirationDate,
            updatedAt: new Date(),
          })
          .where(eq(schema.vaccineInventory.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await tx
          .insert(schema.vaccineInventory)
          .values({
            id: crypto.randomUUID(),
            clinicId,
            vaccineName: update.vaccineName,
            quantity: update.quantity,
            lotNumber: update.lotNumber,
            expirationDate: update.expirationDate,
          })
          .returning();
        results.push(created);
      }
    }
    return results;
  });
}
export async function createManyImmunizations(data: CreateImmunizationInput[]) {
  return await db.insert(schema.immunization).values(data).returning();
}

export async function updateImmunization(
  id: string,
  data: UpdateImmunizationInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.immunization)
    .set(updateData)
    .where(eq(schema.immunization.id, id))
    .returning();
  return result;
}

export async function updateManyImmunizations(
  ids: string[],
  data: UpdateImmunizationInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.immunization)
    .set(updateData)
    .where(inArray(schema.immunization.id, ids))
    .returning();
}

export async function deleteImmunization(id: string) {
  const [result] = await db
    .delete(schema.immunization)
    .where(eq(schema.immunization.id, id))
    .returning();
  return result;
}

export async function softDeleteImmunization(id: string) {
  const [result] = await db
    .update(schema.immunization)
    .set({ deletedAt: new Date() })
    .where(eq(schema.immunization.id, id))
    .returning();
  return result;
}

export async function restoreImmunization(id: string) {
  const [result] = await db
    .update(schema.immunization)
    .set({ deletedAt: null })
    .where(eq(schema.immunization.id, id))
    .returning();
  return result;
}

// ============ Prescription Mutations ============

export type Prescription = InferSelectModel<typeof schema.prescription>;
export type CreatePrescriptionInput = InferInsertModel<
  typeof schema.prescription
>;
export type UpdatePrescriptionInput = Partial<CreatePrescriptionInput>;

export async function createDispense(
  data: InferInsertModel<typeof schema.medicationDispense>,
) {
  const [result] = await db
    .insert(schema.medicationDispense)
    .values({
      ...data,
      id: data.id ?? crypto.randomUUID(),
    })
    .returning();
  return result;
}

export async function createPrescription(data: CreatePrescriptionInput) {
  const [result] = await db
    .insert(schema.prescription)
    .values(data)
    .returning();
  return result;
}

export async function createManyPrescriptions(data: CreatePrescriptionInput[]) {
  return await db.insert(schema.prescription).values(data).returning();
}

export async function updatePrescription(
  id: string,
  data: UpdatePrescriptionInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.prescription)
    .set(updateData)
    .where(eq(schema.prescription.id, id))
    .returning();
  return result;
}

export async function updateManyPrescriptions(
  ids: string[],
  data: UpdatePrescriptionInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.prescription)
    .set(updateData)
    .where(inArray(schema.prescription.id, ids))
    .returning();
}

export async function deletePrescription(id: string) {
  const [result] = await db
    .delete(schema.prescription)
    .where(eq(schema.prescription.id, id))
    .returning();
  return result;
}
export async function createPrescritbedItems(data: schema.DbPrescribedItem[]) {
  return await db.insert(schema.prescribedItem).values(data).returning();
}
// ============ Service Mutations ============

export type Service = InferSelectModel<typeof schema.service>;
export type CreateServiceInput = InferInsertModel<typeof schema.service>;
export type UpdateServiceInput = Partial<CreateServiceInput>;

export async function createService(data: CreateServiceInput) {
  const [result] = await db.insert(schema.service).values(data).returning();
  return result;
}

export async function createManyServices(data: CreateServiceInput[]) {
  return await db.insert(schema.service).values(data).returning();
}

export async function updateService(id: string, data: UpdateServiceInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.service)
    .set(updateData)
    .where(eq(schema.service.id, id))
    .returning();
  return result;
}

export async function updateManyServices(
  ids: string[],
  data: UpdateServiceInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.service)
    .set(updateData)
    .where(inArray(schema.service.id, ids))
    .returning();
}

export async function deleteService(id: string) {
  const [result] = await db
    .delete(schema.service)
    .where(eq(schema.service.id, id))
    .returning();
  return result;
}

export async function softDeleteService(id: string) {
  const [result] = await db
    .update(schema.service)
    .set({ deletedAt: new Date() })
    .where(eq(schema.service.id, id))
    .returning();
  return result;
}

export async function restoreService(id: string) {
  const [result] = await db
    .update(schema.service)
    .set({ deletedAt: null })
    .where(eq(schema.service.id, id))
    .returning();
  return result;
}

// ============ LabTest Mutations ============

export type LabTest = InferSelectModel<typeof schema.labTest>;
export type CreateLabTestInput = InferInsertModel<typeof schema.labTest>;
export type UpdateLabTestInput = Partial<CreateLabTestInput>;

export async function createLabTest(data: CreateLabTestInput) {
  const [result] = await db.insert(schema.labTest).values(data).returning();
  return result;
}

export async function createManyLabTests(data: CreateLabTestInput[]) {
  return await db.insert(schema.labTest).values(data).returning();
}

export async function updateLabTest(id: string, data: UpdateLabTestInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.labTest)
    .set(updateData)
    .where(eq(schema.labTest.id, id))
    .returning();
  return result;
}

export async function updateManyLabTests(
  ids: string[],
  data: UpdateLabTestInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.labTest)
    .set(updateData)
    .where(inArray(schema.labTest.id, ids))
    .returning();
}

export async function deleteLabTest(id: string) {
  const [result] = await db
    .delete(schema.labTest)
    .where(eq(schema.labTest.id, id))
    .returning();
  return result;
}

// ============ Payment Mutations ============

export type Payment = InferSelectModel<typeof schema.payment>;
export type CreatePaymentInput = InferInsertModel<typeof schema.payment>;
export type UpdatePaymentInput = Partial<CreatePaymentInput>;

export async function createPayment(data: CreatePaymentInput) {
  const [result] = await db.insert(schema.payment).values(data).returning();
  return result;
}

export async function recordPayment(data: CreatePaymentInput) {
  return await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(schema.payment)
      .values({
        ...data,
        id: data.id ?? crypto.randomUUID(),
        billDate: data.billDate ?? new Date(),
        totalAmount: data.totalAmount ?? data.amount,
        amountPaid: data.status === "PAID" ? data.amount : 0,
        paidDate: data.status === "PAID" ? new Date() : null,
        receiptNumber: data.receiptNumber
          ? data.receiptNumber
          : Math.floor(Math.random() * 1_000_000),
      })
      .returning();

    return payment;
  });
}

export async function createManyPayments(data: CreatePaymentInput[]) {
  return await db.insert(schema.payment).values(data).returning();
}
export async function createInvoice(data: {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  items: Array<{ description: string; amount: number }>;
  dueDate?: Date;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    const [payment] = await tx
      .insert(schema.payment)
      .values({
        id: crypto.randomUUID(),
        patientId: data.patientId,
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        amount: totalAmount,
        totalAmount: totalAmount,
        status: "PENDING",
        billDate: new Date(),
        notes: data.notes,
        receiptNumber: Math.floor(Math.random() * 1_000_000),
      })
      .returning();

    // Note: If there was an invoice_items table, we would insert items here.

    return payment;
  });
}

export async function updatePayment(id: string, data: UpdatePaymentInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.payment)
    .set(updateData)
    .where(eq(schema.payment.id, id))
    .returning();
  return result;
}

export async function updateManyPayments(
  ids: string[],
  data: UpdatePaymentInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.payment)
    .set(updateData)
    .where(inArray(schema.payment.id, ids))
    .returning();
}

export async function deletePayment(id: string) {
  const [result] = await db
    .delete(schema.payment)
    .where(eq(schema.payment.id, id))
    .returning();
  return result;
}

export async function softDeletePayment(id: string) {
  const [result] = await db
    .update(schema.payment)
    .set({ deletedAt: new Date() })
    .where(eq(schema.payment.id, id))
    .returning();
  return result;
}

export async function restorePayment(id: string) {
  const [result] = await db
    .update(schema.payment)
    .set({ deletedAt: null })
    .where(eq(schema.payment.id, id))
    .returning();
  return result;
}
export async function processPaymentWithReceipt(
  paymentId: string,
  amountPaid: number,
  paymentMethod: PaymentMethod,
  notes?: string,
) {
  return await db.transaction(async (tx) => {
    const payment = await tx.query.payment.findFirst({
      where: { id: paymentId },
      with: {
        patient: true,
        appointment: true,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const isFullyPaid = amountPaid >= (payment.totalAmount ?? 0);
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [updatedPayment] = await tx
      .update(schema.payment)
      .set({
        amountPaid,
        paymentMethod,
        paymentDate: new Date(),
        paidDate: new Date(),
        status: isFullyPaid ? "PAID" : "PARTIAL",
        notes: notes ? `${payment.notes || ""}\n${notes}` : payment.notes,
        receiptNumber: Number.parseInt(
          receiptNumber.split("-").pop() || "0",
          10,
        ),
        updatedAt: new Date(),
      })
      .where(eq(schema.payment.id, paymentId))
      .returning();

    // Create receipt notification
    if (payment.patient?.userId) {
      await tx.insert(schema.notification).values({
        id: crypto.randomUUID(),
        userId: payment.patient.userId,
        clinicId: payment.clinicId ?? "",
        title: "Payment Receipt",
        body: `Payment of ${amountPaid} received. Receipt #: ${receiptNumber}`,
        type: "payment_receipt",
        priority: "medium",
        metadata: {
          receiptNumber,
          amountPaid,
          paymentMethod,
        },
      });
    }

    return updatedPayment;
  });
}

export async function generateReceipt(paymentId: string) {
  return await db.query.payment.findFirst({
    where: { id: paymentId },
    with: { patient: true, appointment: true, clinic: true },
  });
}

// ============ PatientBill Mutations ============

export type PatientBill = InferSelectModel<typeof schema.patientBill>;
export type CreatePatientBillInput = InferInsertModel<
  typeof schema.patientBill
>;
export type UpdatePatientBillInput = Partial<CreatePatientBillInput>;

export async function createPatientBill(data: CreatePatientBillInput) {
  const [result] = await db.insert(schema.patientBill).values(data).returning();
  return result;
}

export async function createManyPatientBills(data: CreatePatientBillInput[]) {
  return await db.insert(schema.patientBill).values(data).returning();
}

export async function updatePatientBill(
  id: string,
  data: UpdatePatientBillInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.patientBill)
    .set(updateData)
    .where(eq(schema.patientBill.id, id))
    .returning();
  return result;
}

export async function updateManyPatientBills(
  ids: string[],
  data: UpdatePatientBillInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.patientBill)
    .set(updateData)
    .where(inArray(schema.patientBill.id, ids))
    .returning();
}

export async function deletePatientBill(id: string) {
  const [result] = await db
    .delete(schema.patientBill)
    .where(eq(schema.patientBill.id, id))
    .returning();
  return result;
}

// ============ Reminder Mutations ============

export type Reminder = InferSelectModel<typeof schema.reminder>;
export type CreateReminderInput = InferInsertModel<typeof schema.reminder>;
export type UpdateReminderInput = Partial<CreateReminderInput>;

export async function createReminder(data: CreateReminderInput) {
  const [result] = await db.insert(schema.reminder).values(data).returning();
  return result;
}

export async function createManyReminders(data: CreateReminderInput[]) {
  return await db.insert(schema.reminder).values(data).returning();
}

export async function updateReminder(id: string, data: UpdateReminderInput) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.reminder)
    .set(updateData)
    .where(eq(schema.reminder.id, id))
    .returning();
  return result;
}

export async function updateManyReminders(
  ids: string[],
  data: UpdateReminderInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.reminder)
    .set(updateData)
    .where(inArray(schema.reminder.id, ids))
    .returning();
}

export async function deleteReminder(id: string) {
  const [result] = await db
    .delete(schema.reminder)
    .where(eq(schema.reminder.id, id))
    .returning();
  return result;
}

// ============ ClinicSetting Mutations ============

export type ClinicSetting = InferSelectModel<typeof schema.clinicSetting>;
export type CreateClinicSettingInput = InferInsertModel<
  typeof schema.clinicSetting
>;
export type UpdateClinicSettingInput = Partial<CreateClinicSettingInput>;

export async function createClinicSetting(data: CreateClinicSettingInput) {
  const [result] = await db
    .insert(schema.clinicSetting)
    .values(data)
    .returning();
  return result;
}

export async function createManyClinicSettings(
  data: CreateClinicSettingInput[],
) {
  return await db.insert(schema.clinicSetting).values(data).returning();
}

export async function updateClinicSetting(
  id: string,
  data: UpdateClinicSettingInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.clinicSetting)
    .set(updateData)
    .where(eq(schema.clinicSetting.id, id))
    .returning();
  return result;
}

export async function updateManyClinicSettings(
  ids: string[],
  data: UpdateClinicSettingInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.clinicSetting)
    .set(updateData)
    .where(inArray(schema.clinicSetting.id, ids))
    .returning();
}

export async function deleteClinicSetting(id: string) {
  const [result] = await db
    .delete(schema.clinicSetting)
    .where(eq(schema.clinicSetting.id, id))
    .returning();
  return result;
}

// ============ Prescriptions Mutations ============

export type Prescriptions = InferSelectModel<typeof schema.prescription>;
export type CreatePrescriptionsInput = InferInsertModel<
  typeof schema.prescription
>;
export type UpdatePrescriptionsInput = Partial<CreatePrescriptionsInput>;

export async function createPrescriptions(data: CreatePrescriptionsInput) {
  const [result] = await db
    .insert(schema.prescription)
    .values(data)
    .returning();
  return result;
}

export async function createManyPrescriptionss(
  data: CreatePrescriptionsInput[],
) {
  return await db.insert(schema.prescription).values(data).returning();
}

export async function updatePrescriptions(
  id: string,
  data: UpdatePrescriptionsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.prescription)
    .set(updateData)
    .where(eq(schema.prescription.id, id))
    .returning();
  return result;
}

export async function updateManyPrescriptionss(
  ids: string[],
  data: UpdatePrescriptionsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.prescription)
    .set(updateData)
    .where(inArray(schema.prescription.id, ids))
    .returning();
}

export async function deletePrescriptions(id: string) {
  const [result] = await db
    .delete(schema.prescription)
    .where(eq(schema.prescription.id, id))
    .returning();
  return result;
}

// ============ WhoGrowthStandards Mutations ============

export type WhoGrowthStandards = InferSelectModel<
  typeof schema.whoGrowthStandard
>;
export type CreateWhoGrowthStandardsInput = InferInsertModel<
  typeof schema.whoGrowthStandard
>;
export type UpdateWhoGrowthStandardsInput =
  Partial<CreateWhoGrowthStandardsInput>;

export async function createWhoGrowthStandards(
  data: CreateWhoGrowthStandardsInput,
) {
  const [result] = await db
    .insert(schema.whoGrowthStandard)
    .values(data)
    .returning();
  return result;
}

export async function createManyWhoGrowthStandardss(
  data: CreateWhoGrowthStandardsInput[],
) {
  return await db.insert(schema.whoGrowthStandard).values(data).returning();
}

export async function updateWhoGrowthStandards(
  id: string,
  data: UpdateWhoGrowthStandardsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.whoGrowthStandard)
    .set(updateData)
    .where(eq(schema.whoGrowthStandard.id, id))
    .returning();
  return result;
}

export async function updateManyWhoGrowthStandardss(
  ids: string[],
  data: UpdateWhoGrowthStandardsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.whoGrowthStandard)
    .set(updateData)
    .where(inArray(schema.whoGrowthStandard.id, ids))
    .returning();
}

export async function deleteWhoGrowthStandards(id: string) {
  const [result] = await db
    .delete(schema.whoGrowthStandard)
    .where(eq(schema.whoGrowthStandard.id, id))
    .returning();
  return result;
}

// ============ Rating Mutations ============

export type Rating = InferSelectModel<typeof schema.rating>;
export type CreateRatingInput = InferInsertModel<typeof schema.rating>;
export type UpdateRatingInput = Partial<CreateRatingInput>;

export async function createRating(data: CreateRatingInput) {
  const [result] = await db.insert(schema.rating).values(data).returning();
  return result;
}

export async function createManyRatings(data: CreateRatingInput[]) {
  return await db.insert(schema.rating).values(data).returning();
}

export async function updateRating(id: string, data: UpdateRatingInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.rating)
    .set(updateData)
    .where(eq(schema.rating.id, Number(id)))
    .returning();
  return result;
}

export async function updateManyRatings(
  ids: string[],
  data: UpdateRatingInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.rating)
    .set(updateData)
    .where(inArray(schema.rating.id, ids.map(Number)))
    .returning();
}

export async function deleteRating(id: string) {
  const [result] = await db
    .delete(schema.rating)
    .where(eq(schema.rating.id, Number(id)))
    .returning();
  return result;
}

// ============ Drugs Mutations ============

export type Drugs = InferSelectModel<typeof schema.drug>;
export type CreateDrugsInput = InferInsertModel<typeof schema.drug>;
export type UpdateDrugsInput = Partial<CreateDrugsInput>;

export async function createDrugs(data: CreateDrugsInput) {
  const [result] = await db.insert(schema.drug).values(data).returning();
  return result;
}

export async function createManyDrugss(data: CreateDrugsInput[]) {
  return await db.insert(schema.drug).values(data).returning();
}

export async function updateDrugs(id: string, data: UpdateDrugsInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.drug)
    .set(updateData)
    .where(eq(schema.drug.id, id))
    .returning();
  return result;
}

export async function updateManyDrugss(ids: string[], data: UpdateDrugsInput) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.drug)
    .set(updateData)
    .where(inArray(schema.drug.id, ids))
    .returning();
}

export async function deleteDrugs(id: string) {
  const [result] = await db
    .delete(schema.drug)
    .where(eq(schema.drug.id, id))
    .returning();
  return result;
}

// ============ DoseGuidelines Mutations ============

export type DoseGuidelines = InferSelectModel<typeof schema.doseGuideline>;
export type CreateDoseGuidelinesInput = InferInsertModel<
  typeof schema.doseGuideline
>;
export type UpdateDoseGuidelinesInput = Partial<CreateDoseGuidelinesInput>;

export async function createDoseGuidelines(data: CreateDoseGuidelinesInput) {
  const [result] = await db
    .insert(schema.doseGuideline)
    .values(data)
    .returning();
  return result;
}

export async function createManyDoseGuideliness(
  data: CreateDoseGuidelinesInput[],
) {
  return await db.insert(schema.doseGuideline).values(data).returning();
}

export async function updateDoseGuidelines(
  id: string,
  data: UpdateDoseGuidelinesInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.doseGuideline)
    .set(updateData)
    .where(eq(schema.doseGuideline.id, id))
    .returning();
  return result;
}

export async function updateManyDoseGuideliness(
  ids: string[],
  data: UpdateDoseGuidelinesInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.doseGuideline)
    .set(updateData)
    .where(inArray(schema.doseGuideline.id, ids))
    .returning();
}

export async function deleteDoseGuidelines(id: string) {
  const [result] = await db
    .delete(schema.doseGuideline)
    .where(eq(schema.doseGuideline.id, id))
    .returning();
  return result;
}

// ============ PrescribedItems Mutations ============

export type PrescribedItems = InferSelectModel<typeof schema.prescribedItem>;
export type CreatePrescribedItemsInput = InferInsertModel<
  typeof schema.prescribedItem
>;
export type UpdatePrescribedItemsInput = Partial<CreatePrescribedItemsInput>;

export async function createPrescribedItems(data: CreatePrescribedItemsInput) {
  const [result] = await db
    .insert(schema.prescribedItem)
    .values(data)
    .returning();
  return result;
}
export async function createPrescriptionLog(
  data: InferInsertModel<typeof schema.prescriptionLog>,
) {
  const [result] = await db
    .insert(schema.prescriptionLog)
    .values({
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: new Date(),
    })
    .returning();
  return result;
}
export async function createManyPrescribedItemss(
  data: CreatePrescribedItemsInput[],
) {
  return await db.insert(schema.prescribedItem).values(data).returning();
}

export async function updatePrescribedItems(
  id: string,
  data: UpdatePrescribedItemsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.prescribedItem)
    .set(updateData)
    .where(eq(schema.prescribedItem.id, id))
    .returning();
  return result;
}

export async function updateManyPrescribedItemss(
  ids: string[],
  data: UpdatePrescribedItemsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.prescribedItem)
    .set(updateData)
    .where(inArray(schema.prescribedItem.id, ids))
    .returning();
}

export async function deletePrescribedItems(id: string) {
  const [result] = await db
    .delete(schema.prescribedItem)
    .where(eq(schema.prescribedItem.id, id))
    .returning();
  return result;
}

export async function createMedicationDispense(
  data: InferInsertModel<typeof schema.medicationDispense>,
) {
  const [result] = await db
    .insert(schema.medicationDispense)
    .values(data)
    .returning();
  return result;
}

// ============ FilesUpload Mutations ============

export type FilesUpload = InferSelectModel<typeof schema.fileUpload>;
export type CreateFilesUploadInput = InferInsertModel<typeof schema.fileUpload>;
export type UpdateFilesUploadInput = Partial<CreateFilesUploadInput>;

export async function createFilesUpload(data: CreateFilesUploadInput) {
  const [result] = await db.insert(schema.fileUpload).values(data).returning();
  return result;
}

export async function createManyFilesUploads(data: CreateFilesUploadInput[]) {
  return await db.insert(schema.fileUpload).values(data).returning();
}

export async function updateFilesUpload(
  id: string,
  data: UpdateFilesUploadInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.fileUpload)
    .set(updateData)
    .where(eq(schema.fileUpload.id, id))
    .returning();
  return result;
}

export async function updateManyFilesUploads(
  ids: string[],
  data: UpdateFilesUploadInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.fileUpload)
    .set(updateData)
    .where(inArray(schema.fileUpload.id, ids))
    .returning();
}

export async function deleteFilesUpload(id: string) {
  const [result] = await db
    .delete(schema.fileUpload)
    .where(eq(schema.fileUpload.id, id))
    .returning();
  return result;
}

// ============ Guardians Mutations ============

export type Guardians = InferSelectModel<typeof schema.guardian>;
export type CreateGuardiansInput = InferInsertModel<typeof schema.guardian>;
export type UpdateGuardiansInput = Partial<CreateGuardiansInput>;

export async function createGuardians(data: CreateGuardiansInput) {
  const [result] = await db.insert(schema.guardian).values(data).returning();
  return result;
}

export async function createManyGuardianss(data: CreateGuardiansInput[]) {
  return await db.insert(schema.guardian).values(data).returning();
}

export async function updateGuardians(id: string, data: UpdateGuardiansInput) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.guardian)
    .set(updateData)
    .where(eq(schema.guardian.id, id))
    .returning();
  return result;
}

export async function updateManyGuardianss(
  ids: string[],
  data: UpdateGuardiansInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.guardian)
    .set(updateData)
    .where(inArray(schema.guardian.id, ids))
    .returning();
}

export async function deleteGuardians(id: string) {
  const [result] = await db
    .delete(schema.guardian)
    .where(eq(schema.guardian.id, id))
    .returning();
  return result;
}

// ============ FeedingLogs Mutations ============

export type FeedingLogs = InferSelectModel<typeof schema.feedingLog>;
export type CreateFeedingLogsInput = InferInsertModel<typeof schema.feedingLog>;
export type UpdateFeedingLogsInput = Partial<CreateFeedingLogsInput>;

export async function createFeedingLogs(data: CreateFeedingLogsInput) {
  const [result] = await db.insert(schema.feedingLog).values(data).returning();
  return result;
}

export async function createManyFeedingLogss(data: CreateFeedingLogsInput[]) {
  return await db.insert(schema.feedingLog).values(data).returning();
}

export async function updateFeedingLogs(
  id: string,
  data: UpdateFeedingLogsInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.feedingLog)
    .set(updateData)
    .where(eq(schema.feedingLog.id, id))
    .returning();
  return result;
}

export async function updateManyFeedingLogss(
  ids: string[],
  data: UpdateFeedingLogsInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.feedingLog)
    .set(updateData)
    .where(inArray(schema.feedingLog.id, ids))
    .returning();
}

export async function deleteFeedingLogs(id: string) {
  const [result] = await db
    .delete(schema.feedingLog)
    .where(eq(schema.feedingLog.id, id))
    .returning();
  return result;
}

// ============ Notifications Mutations ============

export type Notifications = InferSelectModel<typeof schema.notification>;
export type CreateNotificationsInput = InferInsertModel<
  typeof schema.notification
>;
export type UpdateNotificationsInput = Partial<CreateNotificationsInput>;

export async function createNotifications(data: CreateNotificationsInput) {
  const [result] = await db
    .insert(schema.notification)
    .values(data)
    .returning();
  return result;
}

export async function createManyNotificationss(
  data: CreateNotificationsInput[],
) {
  return await db.insert(schema.notification).values(data).returning();
}

export async function updateNotifications(
  id: string,
  data: UpdateNotificationsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.notification)
    .set(updateData)
    .where(eq(schema.notification.id, id))
    .returning();
  return result;
}

export async function updateManyNotificationss(
  ids: string[],
  data: UpdateNotificationsInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.notification)
    .set(updateData)
    .where(inArray(schema.notification.id, ids))
    .returning();
}

export async function deleteNotifications(id: string) {
  const [result] = await db
    .delete(schema.notification)
    .where(eq(schema.notification.id, id))
    .returning();
  return result;
}

// ============ DevelopmentalMilestones Mutations ============

export type DevelopmentalMilestones = InferSelectModel<
  typeof schema.developmentalMilestones
>;
export type CreateDevelopmentalMilestonesInput = InferInsertModel<
  typeof schema.developmentalMilestones
>;
export type UpdateDevelopmentalMilestonesInput =
  Partial<CreateDevelopmentalMilestonesInput>;

export async function createDevelopmentalMilestones(
  data: CreateDevelopmentalMilestonesInput,
) {
  const [result] = await db
    .insert(schema.developmentalMilestones)
    .values(data)
    .returning();
  return result;
}

export async function createManyDevelopmentalMilestoness(
  data: CreateDevelopmentalMilestonesInput[],
) {
  return await db
    .insert(schema.developmentalMilestones)
    .values(data)
    .returning();
}

export async function updateDevelopmentalMilestones(
  id: string,
  data: UpdateDevelopmentalMilestonesInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.developmentalMilestones)
    .set(updateData)
    .where(eq(schema.developmentalMilestones.id, Number(id)))
    .returning();
  return result;
}

export async function updateManyDevelopmentalMilestoness(
  ids: string[],
  data: UpdateDevelopmentalMilestonesInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.developmentalMilestones)
    .set(updateData)
    .where(inArray(schema.developmentalMilestones.id, ids.map(Number)))
    .returning();
}

export async function deleteDevelopmentalMilestones(id: string) {
  const [result] = await db
    .delete(schema.developmentalMilestones)
    .where(eq(schema.developmentalMilestones.id, Number(id)))
    .returning();
  return result;
}

// ============ DevelopmentalCheck Mutations ============

export type DevelopmentalCheck = InferSelectModel<
  typeof schema.developmentalCheck
>;
export type CreateDevelopmentalCheckInput = InferInsertModel<
  typeof schema.developmentalCheck
>;
export type UpdateDevelopmentalCheckInput =
  Partial<CreateDevelopmentalCheckInput>;

export async function createDevelopmentalCheck(
  data: CreateDevelopmentalCheckInput,
) {
  const [result] = await db
    .insert(schema.developmentalCheck)
    .values(data)
    .returning();
  return result;
}

export async function createManyDevelopmentalChecks(
  data: CreateDevelopmentalCheckInput[],
) {
  return await db.insert(schema.developmentalCheck).values(data).returning();
}

export async function updateDevelopmentalCheck(
  id: string,
  data: UpdateDevelopmentalCheckInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.developmentalCheck)
    .set(updateData)
    .where(eq(schema.developmentalCheck.id, id))
    .returning();
  return result;
}

export async function updateManyDevelopmentalChecks(
  ids: string[],
  data: UpdateDevelopmentalCheckInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.developmentalCheck)
    .set(updateData)
    .where(inArray(schema.developmentalCheck.id, ids))
    .returning();
}

export async function deleteDevelopmentalCheck(id: string) {
  const [result] = await db
    .delete(schema.developmentalCheck)
    .where(eq(schema.developmentalCheck.id, id))
    .returning();
  return result;
}

// ============ MedicationDispenses Mutations ============

export type MedicationDispenses = InferSelectModel<
  typeof schema.medicationDispense
>;
export type CreateMedicationDispensesInput = InferInsertModel<
  typeof schema.medicationDispense
>;
export type UpdateMedicationDispensesInput =
  Partial<CreateMedicationDispensesInput>;

export async function createMedicationDispenses(
  data: CreateMedicationDispensesInput,
) {
  const [result] = await db
    .insert(schema.medicationDispense)
    .values(data)
    .returning();
  return result;
}

export async function createManyMedicationDispensess(
  data: CreateMedicationDispensesInput[],
) {
  return await db.insert(schema.medicationDispense).values(data).returning();
}

export async function updateMedicationDispenses(
  id: string,
  data: UpdateMedicationDispensesInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.medicationDispense)
    .set(updateData)
    .where(eq(schema.medicationDispense.id, id))
    .returning();
  return result;
}

export async function updateManyMedicationDispensess(
  ids: string[],
  data: UpdateMedicationDispensesInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.medicationDispense)
    .set(updateData)
    .where(inArray(schema.medicationDispense.id, ids))
    .returning();
}

export async function deleteMedicationDispenses(id: string) {
  const [result] = await db
    .delete(schema.medicationDispense)
    .where(eq(schema.medicationDispense.id, id))
    .returning();
  return result;
}

// ============ PrescriptionLogs Mutations ============

export type PrescriptionLogs = InferSelectModel<typeof schema.prescriptionLog>;
export type CreatePrescriptionLogsInput = InferInsertModel<
  typeof schema.prescriptionLog
>;
export type UpdatePrescriptionLogsInput = Partial<CreatePrescriptionLogsInput>;

export async function createPrescriptionLogs(
  data: CreatePrescriptionLogsInput,
) {
  const [result] = await db
    .insert(schema.prescriptionLog)
    .values(data)
    .returning();
  return result;
}

export async function createManyPrescriptionLogss(
  data: CreatePrescriptionLogsInput[],
) {
  return await db.insert(schema.prescriptionLog).values(data).returning();
}

export async function updatePrescriptionLogs(
  id: string,
  data: UpdatePrescriptionLogsInput,
) {
  const updateData = { ...data };

  const [result] = await db
    .update(schema.prescriptionLog)
    .set(updateData)
    .where(eq(schema.prescriptionLog.id, id))
    .returning();
  return result;
}

export async function updateManyPrescriptionLogss(
  ids: string[],
  data: UpdatePrescriptionLogsInput,
) {
  const updateData = { ...data };

  return await db
    .update(schema.prescriptionLog)
    .set(updateData)
    .where(inArray(schema.prescriptionLog.id, ids))
    .returning();
}

export async function deletePrescriptionLogs(id: string) {
  const [result] = await db
    .delete(schema.prescriptionLog)
    .where(eq(schema.prescriptionLog.id, id))
    .returning();
  return result;
}

// ============ VaccineSchedule Mutations ============

export type VaccineSchedule = InferSelectModel<typeof schema.vaccineSchedule>;
export type CreateVaccineScheduleInput = InferInsertModel<
  typeof schema.vaccineSchedule
>;
export type UpdateVaccineScheduleInput = Partial<CreateVaccineScheduleInput>;

export async function createVaccineSchedule(data: CreateVaccineScheduleInput) {
  const [result] = await db
    .insert(schema.vaccineSchedule)
    .values(data)
    .returning();
  return result;
}

export async function updateInventory(
  id: string,
  data: UpdateVaccineInventoryInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.vaccineInventory)
    .set(updateData)
    .where(eq(schema.vaccineInventory.id, id))
    .returning();
  return result;
}
export async function recordAdverseEvent(data: CreateAdverseEventInput) {
  const [result] = await db
    .insert(schema.adverseEvent)
    .values(data)
    .returning();
  return result;
}
export async function createManyVaccineSchedules(
  data: CreateVaccineScheduleInput[],
) {
  return await db.insert(schema.vaccineSchedule).values(data).returning();
}

export async function updateVaccineSchedule(
  id: string,
  data: UpdateVaccineScheduleInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.vaccineSchedule)
    .set(updateData)
    .where(eq(schema.vaccineSchedule.id, id))
    .returning();
  return result;
}

export async function updateManyVaccineSchedules(
  ids: string[],
  data: UpdateVaccineScheduleInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.vaccineSchedule)
    .set(updateData)
    .where(inArray(schema.vaccineSchedule.id, ids))
    .returning();
}

export async function deleteVaccineSchedule(id: string) {
  const [result] = await db
    .delete(schema.vaccineSchedule)
    .where(eq(schema.vaccineSchedule.id, id))
    .returning();
  return result;
}

export async function softDeleteVaccineSchedule(id: string) {
  const [result] = await db
    .update(schema.vaccineSchedule)
    .set({ isDeleted: true })
    .where(eq(schema.vaccineSchedule.id, id))
    .returning();
  return result;
}

export async function restoreVaccineSchedule(id: string) {
  const [result] = await db
    .update(schema.vaccineSchedule)
    .set({ isDeleted: null })
    .where(eq(schema.vaccineSchedule.id, id))
    .returning();
  return result;
}

// ============ AdverseEvent Mutations ============

export type AdverseEvent = InferSelectModel<typeof schema.adverseEvent>;
export type CreateAdverseEventInput = InferInsertModel<
  typeof schema.adverseEvent
>;
export type UpdateAdverseEventInput = Partial<CreateAdverseEventInput>;

export async function createAdverseEvent(data: CreateAdverseEventInput) {
  const [result] = await db
    .insert(schema.adverseEvent)
    .values(data)
    .returning();
  return result;
}

export async function createManyAdverseEvents(data: CreateAdverseEventInput[]) {
  return await db.insert(schema.adverseEvent).values(data).returning();
}

export async function updateAdverseEvent(
  id: string,
  data: UpdateAdverseEventInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.adverseEvent)
    .set(updateData)
    .where(eq(schema.adverseEvent.id, id))
    .returning();
  return result;
}

export async function updateManyAdverseEvents(
  ids: string[],
  data: UpdateAdverseEventInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.adverseEvent)
    .set(updateData)
    .where(inArray(schema.adverseEvent.id, ids))
    .returning();
}

export async function deleteAdverseEvent(id: string) {
  const [result] = await db
    .delete(schema.adverseEvent)
    .where(eq(schema.adverseEvent.id, id))
    .returning();
  return result;
}

// ============ VaccineInventory Mutations ============

export type VaccineInventory = InferSelectModel<typeof schema.vaccineInventory>;
export type CreateVaccineInventoryInput = InferInsertModel<
  typeof schema.vaccineInventory
>;
export type UpdateVaccineInventoryInput = Partial<CreateVaccineInventoryInput>;

export async function createVaccineInventory(
  data: CreateVaccineInventoryInput,
) {
  const [result] = await db
    .insert(schema.vaccineInventory)
    .values(data)
    .returning();
  return result;
}

export async function createManyVaccineInventorys(
  data: CreateVaccineInventoryInput[],
) {
  return await db.insert(schema.vaccineInventory).values(data).returning();
}

export async function updateVaccineInventory(
  id: string,
  data: UpdateVaccineInventoryInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  const [result] = await db
    .update(schema.vaccineInventory)
    .set(updateData)
    .where(eq(schema.vaccineInventory.id, id))
    .returning();
  return result;
}

export async function updateManyVaccineInventorys(
  ids: string[],
  data: UpdateVaccineInventoryInput,
) {
  const updateData = { ...data };
  updateData.updatedAt = new Date();
  return await db
    .update(schema.vaccineInventory)
    .set(updateData)
    .where(inArray(schema.vaccineInventory.id, ids))
    .returning();
}

export async function deleteVaccineInventory(id: string) {
  const [result] = await db
    .delete(schema.vaccineInventory)
    .where(eq(schema.vaccineInventory.id, id))
    .returning();
  return result;
}
// ============ Bulk Operations ============

export async function bulkUpdateAppointmentStatus(
  appointmentIds: string[],
  status: AppointmentStatus,
  reason?: string,
) {
  return await db
    .update(schema.appointment)
    .set({
      status,
      note: reason ? `Bulk update: ${reason}` : undefined,
      updatedAt: new Date(),
    })
    .where(inArray(schema.appointment.id, appointmentIds))
    .returning();
}

export async function archiveOldRecords(data: {
  appointmentsIds: string[];
  daysOld?: number;
  clinicId: string;
}) {
  const daysOld = data.daysOld ?? 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await db.transaction(async (tx) => {
    // Archive completed appointments
    const archivedAppointments = await tx
      .update(schema.appointment)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(
        and(
          eq(schema.appointment.status, "COMPLETED"),
          sql`${schema.appointment.appointmentDate} < ${cutoffDate}`,
          eq(schema.appointment.isDeleted, false),
        ),
      )
      .returning();

    // Archive old medical records
    const archivedRecords = await tx
      .update(schema.medicalRecord)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(
        and(
          eq(schema.medicalRecord.status, "COMPLETED"),
          sql`${schema.medicalRecord.createdAt} < ${cutoffDate}`,
          eq(schema.medicalRecord.isDeleted, false),
        ),
      )
      .returning();

    return {
      archivedAppointments: archivedAppointments.length,
      archivedRecords: archivedRecords.length,
    };
  });
}

export async function generateUniqueId(prefix: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

export async function getOrCreateUserQuota(userId: string) {
  let quota = await db.query.userQuota.findFirst({
    where: { userId },
  });

  if (!quota) {
    const [newQuota] = await db
      .insert(schema.userQuota)
      .values({
        userId,
        quota: 100, // Default quota
        usedQuota: 0,
        fileCount: 0,
        fileCountQuota: 1000,
        inviteCount: 0,
        inviteQuota: 10,
      })
      .returning();
    quota = newQuota;
  }

  return quota;
}

export async function bulkUpdateServiceAvailability(
  serviceIds: string[],
  isAvailable: boolean,
) {
  return await db
    .update(schema.service)
    .set({
      isAvailable,
      updatedAt: new Date(),
    })
    .where(inArray(schema.service.id, serviceIds))
    .returning();
}

export async function createServiceWithCategory(
  data: CreateServiceInput,
  categoryId?: string,
) {
  return await db.transaction(async (tx) => {
    // Check if service with same name exists in clinic
    const existing = await tx.query.service.findFirst({
      where: {
        clinicId: data.clinicId ?? "",
        serviceName: data.serviceName,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new Error("Service with this name already exists in the clinic");
    }

    // Create service
    const [service] = await tx
      .insert(schema.service)
      .values({
        ...data,
        id: data.id ?? crypto.randomUUID(),
        isAvailable: data.isAvailable ?? true,
      })
      .returning();

    // If category is provided, you could link it to a category table
    // This assumes you have a service_categories table
    if (categoryId && service) {
      // await tx.insert(schema.serviceCategory).values({
      // 	serviceId: service.id,
      // 	categoryId
      // });
    }

    return service;
  });
}

export async function cloneService(serviceId: string, newClinicId?: string) {
  return await db.transaction(async (tx) => {
    const originalService = await tx.query.service.findFirst({
      where: { id: serviceId, isDeleted: false },
    });

    if (!originalService) {
      throw new Error("Original service not found");
    }

    // Clone service with new ID
    const [clonedService] = await tx
      .insert(schema.service)
      .values({
        ...originalService,
        id: crypto.randomUUID(),
        clinicId: newClinicId ?? originalService.clinicId,
        serviceName: `${originalService.serviceName} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
      })
      .returning();

    return clonedService;
  });
}

export async function batchUpdateServicePrices(
  updates: Array<{ id: string; price: number }>,
) {
  return await db.transaction(async (tx) => {
    const results = [];
    for (const update of updates) {
      const [updated] = await tx
        .update(schema.service)
        .set({
          price: update.price,
          updatedAt: new Date(),
        })
        .where(eq(schema.service.id, update.id))
        .returning();
      results.push(updated);
    }
    return results;
  });
}

export type CreateFeedingLogInput = typeof schema.feedingLog.$inferInsert;
export type UpdateFeedingLogInput = Partial<CreateFeedingLogInput>;

/**
 * Create a new feeding log
 */
export async function createFeedingLog(data: CreateFeedingLogInput) {
  const [result] = await db
    .insert(schema.feedingLog)
    .values({
      ...data,
      id: data.id ?? crypto.randomUUID(),
      date: data.date ?? new Date(),
    })
    .returning();
  return result;
}

/**
 * Create multiple feeding logs in batch
 */
export async function createManyFeedingLogs(data: CreateFeedingLogInput[]) {
  const values = data.map((item) => ({
    ...item,
    id: item.id ?? crypto.randomUUID(),
    date: item.date ?? new Date(),
  }));
  return await db.insert(schema.feedingLog).values(values).returning();
}

/**
 * Update a feeding log
 */
export async function updateFeedingLog(
  id: string,
  data: UpdateFeedingLogInput,
) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };
  const [result] = await db
    .update(schema.feedingLog)
    .set(updateData)
    .where(eq(schema.feedingLog.id, id))
    .returning();
  return result;
}

/**
 * Update multiple feeding logs
 */
export async function updateManyFeedingLogs(
  ids: string[],
  data: UpdateFeedingLogInput,
) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };
  return await db
    .update(schema.feedingLog)
    .set(updateData)
    .where(inArray(schema.feedingLog.id, ids))
    .returning();
}

/**
 * Delete a feeding log
 */
export async function deleteFeedingLog(id: string) {
  const [result] = await db
    .delete(schema.feedingLog)
    .where(eq(schema.feedingLog.id, id))
    .returning();
  return result;
}

/**
 * Delete feeding logs for a patient
 */
export async function deleteFeedingLogsByPatient(patientId: string) {
  return await db
    .delete(schema.feedingLog)
    .where(eq(schema.feedingLog.patientId, patientId))
    .returning();
}

/**
 * Bulk delete feeding logs
 */
export async function bulkDeleteFeedingLogs(ids: string[]) {
  return await db
    .delete(schema.feedingLog)
    .where(inArray(schema.feedingLog.id, ids))
    .returning();
}

// ============================================
// FEEDING LOG SYNC MUTATIONS
// ============================================

/**
 * Sync feeding logs from external source (e.g., wearable device)
 */
export async function syncFeedingLogs(
  patientId: string,
  _clinicId: string,
  externalLogs: Array<{
    timestamp: Date;
    type: string;
    duration?: number;
    amount?: number;
    source: string;
  }>,
) {
  const results = [];
  const errors = [];

  for (const externalLog of externalLogs) {
    try {
      // Check if log already exists (within 5 minutes)
      const existingLog = await db.query.feedingLog.findFirst({
        where: {
          patientId,
          date: {
            gte: new Date(externalLog.timestamp.getTime() - 5 * 60 * 1000),
            lte: new Date(externalLog.timestamp.getTime() + 5 * 60 * 1000),
          },
        },
      });

      if (!existingLog) {
        const newLog = await createFeedingLog({
          patientId,
          id: generateId(),
          date: externalLog.timestamp,
          type: externalLog.type as schema.FeedingType,
          duration: externalLog.duration,
          amount: externalLog.amount,
          notes: `Synced from ${externalLog.source}`,
        });
        results.push(newLog);
      } else {
        errors.push({
          timestamp: externalLog.timestamp,
          error: "Duplicate log found within 5 minute window",
        });
      }
    } catch (error) {
      errors.push({
        timestamp: externalLog.timestamp,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { synced: results.length, failed: errors.length, results, errors };
}

// ============================================
// NUTRITION ASSESSMENT MUTATIONS
// ============================================

export interface CreateNutritionAssessmentInput {
  patientId: string;
  clinicId: string;
  assessmentDate: Date;
  nutritionalStatus:
    | "NORMAL"
    | "UNDERWEIGHT"
    | "OVERWEIGHT"
    | "OBESE"
    | "MALNOURISHED";
  dietaryRestrictions?: string[];
  recommendations: string[];
  followUpDate?: Date | null;
  notes?: string | null;
}

export interface UpdateNutritionAssessmentInput
  extends Partial<CreateNutritionAssessmentInput> {
  id: string;
}

export async function createNutritionAssessment(
  data: CreateNutritionAssessmentInput,
) {
  const assessmentData = {
    type: "nutrition_assessment",
    nutritionalStatus: data.nutritionalStatus,
    dietaryRestrictions: data.dietaryRestrictions ?? [],
    recommendations: data.recommendations,
    notes: data.notes,
  };

  // medicalRecord requires non-null appointmentId and doctorId — use sentinel values
  const [result] = await db
    .insert(schema.medicalRecord)
    .values({
      id: crypto.randomUUID(),
      patientId: data.patientId,
      clinicId: data.clinicId,
      doctorId: "system",
      appointmentId: "nutrition_assessment",
      diagnosisDate: data.assessmentDate,
      notes: JSON.stringify(assessmentData),
      followUpDate: data.followUpDate ?? null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create nutrition assessment record");
  }

  // Create a corresponding diagnosis record
  await db.insert(schema.diagnosis).values({
    id: crypto.randomUUID(),
    medicalId: result.id,
    patientId: data.patientId,
    doctorId: "system",
    clinicId: data.clinicId,
    appointmentId: null,
    diagnosis: `Nutrition Assessment - ${data.nutritionalStatus}`,
    symptoms: "",
    date: data.assessmentDate,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: result.id,
    patientId: result.patientId,
    clinicId: result.clinicId,
    assessmentDate: result.diagnosisDate ?? result.createdAt,
    nutritionalStatus: data.nutritionalStatus,
    dietaryRestrictions: data.dietaryRestrictions ?? [],
    recommendations: data.recommendations,
    followUpDate: result.followUpDate,
    notes: data.notes ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

/**
 * Update a nutrition assessment
 */
export async function updateNutritionAssessment(
  id: string,
  data: UpdateNutritionAssessmentInput,
) {
  const existing = await db.query.medicalRecord.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new Error("Nutrition assessment not found");
  }

  let parsedNotes: Record<string, unknown> = {};
  try {
    if (existing.notes) {
      parsedNotes = JSON.parse(existing.notes) as Record<string, unknown>;
    }
  } catch {
    parsedNotes = {};
  }

  const updatedNotes = {
    ...parsedNotes,
    type: "nutrition_assessment",
    nutritionalStatus: data.nutritionalStatus || parsedNotes.nutritionalStatus,
    dietaryRestrictions:
      data.dietaryRestrictions || parsedNotes.dietaryRestrictions,
    recommendations: data.recommendations || parsedNotes.recommendations,
    notes: data.notes || parsedNotes.notes,
  };

  const [result] = await db
    .update(schema.medicalRecord)
    .set({
      diagnosisDate: data.assessmentDate,
      notes: JSON.stringify(updatedNotes),
      followUpDate:
        data.followUpDate !== undefined
          ? data.followUpDate
          : existing.followUpDate,
      updatedAt: new Date(),
    })
    .where(eq(schema.medicalRecord.id, id))
    .returning();

  if (!result) {
    throw new Error("Failed to update nutrition assessment record");
  }

  return {
    id: result.id,
    patientId: result.patientId,
    clinicId: result.clinicId,
    assessmentDate: result.diagnosisDate ?? result.createdAt,
    nutritionalStatus:
      (updatedNotes.nutritionalStatus as string | undefined) ?? "NORMAL",
    dietaryRestrictions:
      (updatedNotes.dietaryRestrictions as string[] | undefined) ?? [],
    recommendations:
      (updatedNotes.recommendations as string[] | undefined) ?? [],
    followUpDate: result.followUpDate,
    notes: (updatedNotes.notes as string | null | undefined) ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

/**
 * Delete a nutrition assessment
 */
export async function deleteNutritionAssessment(id: string) {
  const [result] = await db
    .update(schema.medicalRecord)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(schema.medicalRecord.id, id))
    .returning();

  return result;
}

// ============================================
// NUTRITION RECOMMENDATION MUTATIONS
// ============================================

export interface NutritionRecommendation {
  id: string;
  patientId: string;
  clinicId: string;
  recommendationType: "dietary" | "supplement" | "lifestyle" | "followup";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate?: Date | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a nutrition recommendation
 * (Stored as a specialized notification or separate table)
 */
export async function createNutritionRecommendation(
  patientId: string,
  clinicId: string,
  data: Omit<
    NutritionRecommendation,
    "id" | "patientId" | "clinicId" | "createdAt" | "updatedAt"
  >,
) {
  // Store as notification for now
  const patient = await db.query.patient.findFirst({
    where: { id: patientId },
    with: { user: true },
  });

  if (patient?.userId) {
    await db.insert(schema.notification).values({
      id: crypto.randomUUID(),
      userId: patient.userId,
      clinicId,
      title: `Nutrition ${data.recommendationType}: ${data.title}`,
      body: data.description,
      type: "nutrition_recommendation",
      priority: data.priority === "high" ? "high" : "medium",
      metadata: {
        recommendationType: data.recommendationType,
        dueDate: data.dueDate,
        priority: data.priority,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return {
    id: crypto.randomUUID(),
    patientId,
    clinicId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Complete a nutrition recommendation
 */
export async function completeNutritionRecommendation(
  recommendationId: string,
) {
  // Update the notification status
  const [result] = await db
    .update(schema.notification)
    .set({ status: "read", updatedAt: new Date() })
    .where(eq(schema.notification.id, recommendationId))
    .returning();

  return { success: !!result, id: recommendationId };
}

// ============================================
// BULK NUTRITION OPERATIONS
// ============================================

/**
 * Bulk import feeding logs from CSV/JSON
 */
export async function bulkImportFeedingLogs(
  clinicId: string,
  logs: Array<Omit<CreateFeedingLogInput, "clinicId">>,
) {
  const results = [];
  const errors = [];

  for (const log of logs) {
    try {
      // Validate patient exists
      const patient = await db.query.patient.findFirst({
        where: { id: log.patientId, clinicId },
      });

      if (!patient) {
        errors.push({ patientId: log.patientId, error: "Patient not found" });
        continue;
      }

      const result = await createFeedingLog({
        ...log,
        id: log.id ?? generateId(),
      });
      results.push(result);
    } catch (error) {
      errors.push({
        patientId: log.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { success: results.length, failed: errors.length, results, errors };
}

/**
 * Generate recurring feeding schedule
 */
export async function generateRecurringFeedings(
  patientId: string,
  clinicId: string,
  schedule: {
    startDate: Date;
    endDate: Date;
    times: string[]; // e.g., ["08:00", "12:00", "16:00", "20:00"]
    type: "BREAST" | "FORMULA" | "MIXED";
    duration?: number;
    amount?: number;
  },
) {
  const feedings = [];
  const currentDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);

  while (currentDate <= endDate) {
    for (const time of schedule.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const feedingTime = new Date(currentDate);
      feedingTime.setHours(hours || 0, minutes || 0, 0, 0);

      feedings.push({
        id: generateId(),
        patientId,
        date: feedingTime,
        type: schedule.type,
        duration: schedule.duration,
        amount: schedule.amount,
        notes: "Auto-generated from recurring schedule",
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Check for duplicates before inserting
  const existingLogs = await feedingLogQueries.list({
    patientId,
    clinicId,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    limit: 1000,
    offset: 0,
  });

  const existingTimes = new Set(
    existingLogs.logs.map((log) => log.date.toISOString()),
  );

  const newFeedings = feedings.filter(
    (feeding) => !existingTimes.has(feeding.date.toISOString()),
  );

  if (newFeedings.length > 0) {
    return await createManyFeedingLogs(newFeedings);
  }

  return [];
}

export const mutations = {
  // User mutations

  user: {
    create: createUser,
    createMany: createManyUsers,
    update: updateUser,
    updateMany: updateManyUsers,
    delete: deleteUser,
  },

  // Clinic mutations
  clinic: {
    create: createClinics,
    createMany: createManyClinicss,
    update: updateClinics,
    updateMany: updateManyClinicss,
    delete: deleteClinics,
    softDelete: softDeleteClinics,
    restore: restoreClinics,
    member: {
      create: createClinicMembers,
      update: updateClinicMembers,
      delete: deleteClinicMembers,
    },
    setting: {
      create: createClinicSetting,
      createMany: createManyClinicSettings,
      update: updateClinicSetting,
      delete: deleteClinicSetting,
    },
  },

  // Doctor mutations
  doctor: {
    create: createDoctor,
    createMany: createManyDoctors,
    update: updateDoctor,
    updateMany: updateManyDoctors,
    delete: deleteDoctor,
    softDelete: softDeleteDoctor,
    restore: restoreDoctor,
    createWorkingDay: createWorkingDay,
    deleteWorkingDay: deleteWorkingDay,
  },

  // Patient mutations
  patient: {
    create: createPatient,
    createWithGuardian: createPatientWithGuardian,
    createMany: createManyPatients,
    update: updatePatient,
    updateMany: updateManyPatients,
    bulkUpdateStatus: bulkUpdatePatientStatus,
    delete: deletePatient,
    softDelete: softDeletePatient,
    restore: restorePatient,
  },

  // Appointment mutations
  appointment: {
    create: createAppointment,
    createWithReminder: createAppointmentWithReminder,
    createMany: createManyAppointments,
    update: updateAppointment,
    updateMany: updateManyAppointments,
    reschedule: rescheduleAppointment,
    bulkUpdateStatus: bulkUpdateAppointmentStatus,
    delete: deleteAppointment,
    cancel: cancelAppointment,
    softDelete: softDeleteAppointment,
    restore: restoreAppointment,
  },

  // Medical mutations
  medicalRecord: {
    create: createMedicalRecord,
    createMany: createManyMedicalRecords,
    createWithEncounter: createMedicalRecordWithEncounter,
    update: updateMedicalRecord,
    updateMany: updateManyMedicalRecords,
    addVitalSigns: addVitalSignsToMedicalRecord,
    completeEncounter: completeEncounter,
    delete: deleteMedicalRecord,
    softDelete: softDeleteMedicalRecord,
    restore: restoreMedicalRecord,
  },

  // Vital Signs mutations
  vitalSign: {
    create: createVitalSign,
    createMany: createManyVitalSigns,
    update: updateVitalSign,
    updateMany: updateManyVitalSigns,
    delete: deleteVitalSign,
  },

  // Prescription mutations
  prescription: {
    create: createPrescription,
    createMany: createManyPrescriptions,
    update: updatePrescription,
    updateMany: updateManyPrescriptions,
    delete: deletePrescription,
    createPrescribedItems,
    updatePrescribedItems,
    createLog: createPrescriptionLog,
    createDispense,
  },

  // Diagnosis mutations
  diagnosis: {
    create: createDiagnosis,
    createMany: createManyDiagnosiss,
    update: updateDiagnosis,
    updateMany: updateManyDiagnosiss,
    delete: deleteDiagnosis,
    softDelete: softDeleteDiagnosis,
    restore: restoreDiagnosis,
  },

  // Lab Test mutations
  labTest: {
    create: createLabTest,
    createMany: createManyLabTests,
    update: updateLabTest,
    updateMany: updateManyLabTests,
    delete: deleteLabTest,
  },

  // Vaccine mutations
  vaccine: {
    create: createVaccineSchedule,
    createMany: createManyVaccineSchedules,
    update: updateVaccineSchedule,
    updateMany: updateManyVaccineSchedules,
    recordImmunization: recordImmunizationWithInventory,
    bulkUpdateInventory: bulkUpdateVaccineInventory,
    delete: deleteVaccineSchedule,
    softDelete: softDeleteVaccineSchedule,
    restore: restoreVaccineSchedule,
    updateInventory,
    recordAdverseEvent,
  },

  // Growth tracking
  growth: {
    create: createGrowthRecord,
    createMany: createManyGrowthRecords,
    recordWithPercentiles: recordGrowthWithPercentiles,
    update: updateGrowthRecord,
    updateMany: updateManyGrowthRecords,
    delete: deleteGrowthRecord,
  },

  // Billing mutations
  billing: {
    createInvoice,
    create: createPayment,
    recordPayment: recordPayment,
    createMany: createManyPayments,
    update: updatePayment,
    updateMany: updateManyPayments,
    processPayment: processPaymentWithReceipt,
    generateReceipt: generateReceipt,
    delete: deletePayment,
    softDelete: softDeletePayment,
    restore: restorePayment,
  },

  // Bulk operations
  bulk: {
    archiveOldRecords,
  },

  encounter: {
    complete: completeEncounter,
    crearte: createDiagnosis,
  },
  // Helpers
  helpers: {
    generateUniqueId,
    getOrCreateUserQuota,
  },
  service: {
    create: createService,
    createWithCategory: createServiceWithCategory,
    createMany: createManyServices,
    update: updateService,
    updateMany: updateManyServices,
    batchUpdatePrices: batchUpdateServicePrices,
    bulkUpdateAvailability: bulkUpdateServiceAvailability,
    delete: deleteService,
    softDelete: softDeleteService,
    restore: restoreService,
    clone: cloneService,
  },
  notification: {
    create: createNotifications,
    createMany: createManyNotificationss,
    update: updateNotifications,
    updateMany: updateManyNotificationss,
    delete: deleteNotifications,
  },
  feedingLog: {
    create: createFeedingLog,
    createMany: createManyFeedingLogs,
    update: updateFeedingLog,
    updateMany: updateManyFeedingLogs,
    delete: deleteFeedingLog,
    deleteByPatient: deleteFeedingLogsByPatient,
    bulkDelete: bulkDeleteFeedingLogs,
    sync: syncFeedingLogs,
    bulkImport: bulkImportFeedingLogs,
    generateRecurring: generateRecurringFeedings,
  },
  assessment: {
    create: createNutritionAssessment,
    update: updateNutritionAssessment,
    delete: deleteNutritionAssessment,
  },
  recommendation: {
    create: createNutritionRecommendation,
    complete: completeNutritionRecommendation,
  },
};

// // Export individual enhanced functions
// export {
//   createPatientWithGuardian,
//   bulkUpdatePatientStatus,
//   createAppointmentWithReminder,
//   rescheduleAppointment,
//   addVitalSignsToMedicalRecord,
//   completeEncounter,
//   recordImmunizationWithInventory,
//   bulkUpdateVaccineInventory,
//   recordGrowthWithPercentiles,
//   processPaymentWithReceipt,
//   bulkUpdateAppointmentStatus,
//   archiveOldRecords,
//   generateUniqueId,
//   getOrCreateUserQuota,
// };
