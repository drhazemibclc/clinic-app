import {
  AccountSchema,
  AppointmentSchema,
  ClinicMemberSchema,
  ClinicSchema,
  ClinicSettingSchema,
  ConfigStoreSchema,
  DevelopmentalCheckSchema,
  DevelopmentalMilestonesSchema,
  DiagnosisSchema,
  DoctorSchema,
  DoseGuidelineSchema,
  DrugSchema,
  FeedingLogSchema,
  FileSchema,
  FolderSchema,
  GrowthRecordSchema,
  GuardianSchema,
  ImmunizationSchema,
  LabTestSchema,
  MedicalRecordSchema,
  NotificationSchema,
  PatientBillSchema,
  PatientSchema,
  PaymentSchema,
  PrescribedItemSchema,
  PrescriptionSchema,
  RatingSchema,
  ReminderSchema,
  ServiceSchema,
  SessionSchema,
  StaffSchema,
  TwoFactorSchema,
  UserQuotaSchema,
  UserSchema,
  VaccineScheduleSchema,
  VerificationSchema,
  VitalSignSchema,
  WhoGrowthStandardSchema,
  WorkingDaySchema,
} from "@clinic-app/db/zod";
import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";
import z from "zod";
export const TodoSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
});
const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  user: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const messagesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (message) => message.id,
    schema: MessageSchema,
  }),
);

// Create all collections
export const accountsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (account) => account.id,
    schema: AccountSchema,
  }),
);

export const appointmentsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (appointment) => appointment.id,
    schema: AppointmentSchema,
  }),
);

export const clinicMembersCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (member) => member.userId,
    schema: ClinicMemberSchema,
  }),
);

export const clinicsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (clinic) => clinic.id,
    schema: ClinicSchema,
  }),
);

export const clinicSettingsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (setting) => setting.id,
    schema: ClinicSettingSchema,
  }),
);

export const configStoreCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (config) => config.key,
    schema: ConfigStoreSchema,
  }),
);

export const developmentalChecksCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (check) => check.id,
    schema: DevelopmentalCheckSchema,
  }),
);

export const developmentalMilestonesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (milestone) => milestone.id,
    schema: DevelopmentalMilestonesSchema,
  }),
);

export const diagnosesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (diagnosis) => diagnosis.id,
    schema: DiagnosisSchema,
  }),
);

export const doctorsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (doctor) => doctor.id,
    schema: DoctorSchema,
  }),
);

export const doseGuidelinesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (guideline) => guideline.id,
    schema: DoseGuidelineSchema,
  }),
);

export const drugsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (drug) => drug.id,
    schema: DrugSchema,
  }),
);

export const feedingLogsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (log) => log.id,
    schema: FeedingLogSchema,
  }),
);

export const filesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (file) => file.id,
    schema: FileSchema,
  }),
);

export const foldersCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (folder) => folder.id,
    schema: FolderSchema,
  }),
);

export const growthRecordsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (record) => record.id,
    schema: GrowthRecordSchema,
  }),
);

export const guardiansCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (guardian) => guardian.id,
    schema: GuardianSchema,
  }),
);

export const immunizationsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (immunization) => immunization.id,
    schema: ImmunizationSchema,
  }),
);

export const labTestsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (test) => test.id,
    schema: LabTestSchema,
  }),
);

export const medicalRecordsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (record) => record.id,
    schema: MedicalRecordSchema,
  }),
);

export const notificationsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (notification) => notification.id,
    schema: NotificationSchema,
  }),
);

export const patientBillsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (bill) => bill.id,
    schema: PatientBillSchema,
  }),
);

export const paymentsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (payment) => payment.id,
    schema: PaymentSchema,
  }),
);

export const prescribedItemsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item) => item.id,
    schema: PrescribedItemSchema,
  }),
);

export const prescriptionsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (prescription) => prescription.id,
    schema: PrescriptionSchema,
  }),
);

export const ratingsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (rating) => rating.id,
    schema: RatingSchema,
  }),
);

export const remindersCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (reminder) => reminder.id,
    schema: ReminderSchema,
  }),
);

export const servicesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (service) => service.id,
    schema: ServiceSchema,
  }),
);

export const sessionsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (session) => session.id,
    schema: SessionSchema,
  }),
);

export const staffCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (staff) => staff.id,
    schema: StaffSchema,
  }),
);

export const twoFactorCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (factor) => factor.id,
    schema: TwoFactorSchema,
  }),
);

export const userQuotasCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (quota) => quota.userId,
    schema: UserQuotaSchema,
  }),
);

export const usersCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (user) => user.id,
    schema: UserSchema,
  }),
);

export const vaccineSchedulesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (schedule) => schedule.id,
    schema: VaccineScheduleSchema,
  }),
);

export const verificationsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (verification) => verification.id,
    schema: VerificationSchema,
  }),
);

export const vitalSignsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (signs) => signs.id,
    schema: VitalSignSchema,
  }),
);

export const whoGrowthStandardsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (standard) => standard.id,
    schema: WhoGrowthStandardSchema,
  }),
);

export const workingDaysCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (day) => day.id,
    schema: WorkingDaySchema,
  }),
);

// Enhanced Patient Schema with relations
export const PatientWithRelationsSchema = PatientSchema.extend({
  guardians: z.array(GuardianSchema).optional(),
  appointments: z.array(AppointmentSchema).optional(),
  growthRecords: z.array(GrowthRecordSchema).optional(),
  immunizations: z.array(ImmunizationSchema).optional(),
  prescriptions: z.array(PrescriptionSchema).optional(),
});

export type PatientWithRelations = z.infer<typeof PatientWithRelationsSchema>;

export {
  AccountSchema,
  AppointmentSchema,
  ClinicMemberSchema,
  ClinicSchema,
  ClinicSettingSchema,
  ConfigStoreSchema,
  DevelopmentalCheckSchema,
  DiagnosisSchema,
  DoctorSchema,
  DoseGuidelineSchema,
  DrugSchema,
  FeedingLogSchema,
  FolderSchema,
  GrowthRecordSchema,
  GuardianSchema,
  ImmunizationSchema,
  LabTestSchema,
  MedicalRecordSchema,
  NotificationSchema,
  PatientBillSchema,
  PatientSchema,
  PaymentSchema,
  PrescribedItemSchema,
  PrescriptionSchema,
  RatingSchema,
  ReminderSchema,
  ServiceSchema,
  SessionSchema,
  StaffSchema,
  TwoFactorSchema,
  UserQuotaSchema,
  UserSchema,
  VaccineScheduleSchema,
  VerificationSchema,
  VitalSignSchema,
  WhoGrowthStandardSchema,
  WorkingDaySchema,
};
