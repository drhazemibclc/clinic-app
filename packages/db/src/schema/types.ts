import type { account, session, user } from "./auth";
import type {
  actionTypeEnum,
  adverseEvent,
  alert,
  appointment,
  appointmentStatusEnum,
  availabilityStatusEnum,
  bloodGroupEnum,
  breastEnum,
  clinic,
  clinicMember,
  clinicSetting,
  developmentalCheck,
  diagnosis,
  doctor,
  doctorTypeEnum,
  doseGuideline,
  drug,
  drugRouteEnum,
  feedingLog,
  feedingTypeEnum,
  frequencyEnum,
  genderEnum,
  growthRecord,
  guardian,
  immunization,
  immunizationStatusEnum,
  labTest,
  labTestStatusEnum,
  maritalStatusEnum,
  measurementTypeEnum,
  medicalRecord,
  notification,
  notificationPriorityEnum,
  notificationStatusEnum,
  nutritionalStatusEnum,
  patient,
  patientBill,
  payment,
  paymentMethodEnum,
  paymentStatusEnum,
  prescribedItem,
  prescription,
  prescriptionStatusEnum,
  rating,
  reminder,
  reminderMethodEnum,
  reminderStatusEnum,
  roleEnum,
  service,
  severityEnum,
  staff,
  statusEnum,
  userQuota,
  vaccineInventory,
  vaccineSchedule,
  vitalSign,
  weekdayEnum,
  whoGrowthStandard,
  workingDay,
} from "./clinic";

export type DatabaseUser = typeof user.$inferSelect;
export type NewDatabaseUser = typeof user.$inferInsert;
export type DatabaseAccount = typeof account.$inferSelect;
export type NewDatabaseAccount = typeof account.$inferInsert;
export type DatabaseSession = typeof session.$inferSelect;
export type NewDatabaseSession = typeof session.$inferInsert;
export type DatabaseUserQuota = typeof userQuota.$inferSelect;
export type NewDatabaseUserQuota = typeof userQuota.$inferInsert;

export type DbClinic = typeof clinic.$inferSelect;
export type NewDbClinic = typeof clinic.$inferInsert;
export type DbDoctor = typeof doctor.$inferSelect;
export type NewDbDoctor = typeof doctor.$inferInsert;
export type DbPatient = typeof patient.$inferSelect;
export type NewDbPatient = typeof patient.$inferInsert;
export type DbAppointment = typeof appointment.$inferSelect;
export type NewDbAppointment = typeof appointment.$inferInsert;
export type DbMedicalRecord = typeof medicalRecord.$inferSelect;
export type NewDbMedicalRecord = typeof medicalRecord.$inferInsert;
export type DbDiagnosis = typeof diagnosis.$inferSelect;
export type NewDbDiagnosis = typeof diagnosis.$inferInsert;
export type DbService = typeof service.$inferSelect;
export type NewDbService = typeof service.$inferInsert;
export type DbPayment = typeof payment.$inferSelect;
export type NewDbPayment = typeof payment.$inferInsert;
export type DbPrescription = typeof prescription.$inferSelect;
export type NewDbPrescription = typeof prescription.$inferInsert;
export type DbWorkingDay = typeof workingDay.$inferSelect;
export type NewDbWorkingDay = typeof workingDay.$inferInsert;
export type DbStaff = typeof staff.$inferSelect;
export type NewDbStaff = typeof staff.$inferInsert;
export type DbVitalSign = typeof vitalSign.$inferSelect;
export type NewDbVitalSign = typeof vitalSign.$inferInsert;
export type DbImmunization = typeof immunization.$inferSelect;
export type NewDbImmunization = typeof immunization.$inferInsert;
export type DbGrowthRecord = typeof growthRecord.$inferSelect;
export type NewDbGrowthRecord = typeof growthRecord.$inferInsert;
export type DbDevelopmentalCheck = typeof developmentalCheck.$inferSelect;
export type NewDbDevelopmentalCheck = typeof developmentalCheck.$inferInsert;
export type DbFeedingLog = typeof feedingLog.$inferSelect;
export type NewDbFeedingLog = typeof feedingLog.$inferInsert;

export type DbGuardian = typeof guardian.$inferSelect;
export type NewDbGuardian = typeof guardian.$inferInsert;

export type DbDoseGuideline = typeof doseGuideline.$inferSelect;
export type NewDbDoseGuideline = typeof doseGuideline.$inferInsert;
export type DbAlert = typeof alert.$inferSelect;
export type NewDbAlert = typeof alert.$inferInsert;
export type DbPrescribedItem = typeof prescribedItem.$inferSelect;
export type NewDbPrescribedItem = typeof prescribedItem.$inferInsert;
export type DbWhoGrowthStandard = typeof whoGrowthStandard.$inferSelect;
export type NewDbWhoGrowthStandard = typeof whoGrowthStandard.$inferInsert;
export type DbVaccineSchedule = typeof vaccineSchedule.$inferSelect;
export type NewDbVaccineSchedule = typeof vaccineSchedule.$inferInsert;
export type DbClinicMember = typeof clinicMember.$inferSelect;
export type NewDbClinicMember = typeof clinicMember.$inferInsert;
export type DbPatientBill = typeof patientBill.$inferSelect;
export type NewDbPatientBill = typeof patientBill.$inferInsert;
export type DbRating = typeof rating.$inferSelect;
export type NewDbRating = typeof rating.$inferInsert;
export type DbReminder = typeof reminder.$inferSelect;
export type NewDbReminder = typeof reminder.$inferInsert;
export type DbClinicSetting = typeof clinicSetting.$inferSelect;
export type NewDbClinicSetting = typeof clinicSetting.$inferInsert;
export type DbDrug = typeof drug.$inferSelect;
export type NewDbDrug = typeof drug.$inferInsert;
export type InsertfeedingLog = typeof feedingLog.$inferInsert;
export type SelectfeedingLog = typeof feedingLog.$inferSelect;
export type UpdatefeedingLog = Partial<SelectfeedingLog> & { id: string };
export type DbLabTest = typeof labTest.$inferSelect;
export type NewDbLabTest = typeof labTest.$inferInsert;
export type AdverseEvent = typeof adverseEvent.$inferSelect;
export type NewAdverseEvent = typeof adverseEvent.$inferInsert;
export type VaccineInventory = typeof vaccineInventory.$inferSelect;
export type NewVaccineInventory = typeof vaccineInventory.$inferInsert;

// Types for Selecting and Inserting
export type NotificationItem = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

// Role & Identity
export type Role = (typeof roleEnum.enumValues)[number];
export type Gender = (typeof genderEnum.enumValues)[number];
export type BloodGroup = (typeof bloodGroupEnum.enumValues)[number];
export type MaritalStatus = (typeof maritalStatusEnum.enumValues)[number];
export type DoctorType = (typeof doctorTypeEnum.enumValues)[number];

// Statuses
export type Status = (typeof statusEnum.enumValues)[number];
export type AppointmentStatus =
  (typeof appointmentStatusEnum.enumValues)[number];
export type AvailabilityStatus =
  (typeof availabilityStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type NotificationStatus =
  (typeof notificationStatusEnum.enumValues)[number];
export type ImmunizationStatus =
  (typeof immunizationStatusEnum.enumValues)[number];
export type PrescriptionStatus =
  (typeof prescriptionStatusEnum.enumValues)[number];
export type LabTestStatus = (typeof labTestStatusEnum.enumValues)[number];
export type ReminderStatus = (typeof reminderStatusEnum.enumValues)[number];

// Clinical & Pediatric Specific
export type NutritionalStatus =
  (typeof nutritionalStatusEnum.enumValues)[number];
export type MeasurementType = (typeof measurementTypeEnum.enumValues)[number];
export type FeedingType = (typeof feedingTypeEnum.enumValues)[number];
export type BreastSide = (typeof breastEnum.enumValues)[number];
export type DrugRoute = (typeof drugRouteEnum.enumValues)[number];
export type Frequency = (typeof frequencyEnum.enumValues)[number];
export type Severity = (typeof severityEnum.enumValues)[number];

// Operational & Infrastructure
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type NotificationPriority =
  (typeof notificationPriorityEnum.enumValues)[number];
export type Weekday = (typeof weekdayEnum.enumValues)[number];
export type ReminderMethod = (typeof reminderMethodEnum.enumValues)[number];
export type ActionType = (typeof actionTypeEnum.enumValues)[number];
export type Day = (typeof weekdayEnum.enumValues)[number];
