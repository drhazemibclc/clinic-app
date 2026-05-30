import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    clinic: r.one.clinic({
      from: r.user.clinicId,
      to: r.clinic.id,
    }),
    files: r.many.file({
      from: r.user.id,
      to: r.file.userId,
    }),
    folders: r.many.folder({
      from: r.user.id,
      to: r.folder.userId,
    }),
    twoFactors: r.many.twoFactor({
      from: r.user.id,
      to: r.twoFactor.userId,
    }),
    quota: r.one.userQuota({
      from: r.user.id,
      to: r.userQuota.userId,
    }),
    clinics: r.many.clinicMember({
      from: r.user.id,
      to: r.clinicMember.userId,
    }),
    doctors: r.many.doctor({
      from: r.user.id,
      to: r.doctor.userId,
    }),
    staffs: r.many.staff({
      from: r.user.id,
      to: r.staff.userId,
    }),
    patients: r.many.patient({
      from: r.user.id,
      to: r.patient.userId,
      alias: "PatientUser",
    }),
    createdPatients: r.many.patient({
      from: r.user.id,
      to: r.patient.createdById,
      alias: "PatientCreatedBy",
    }),
    guardians: r.many.guardian({
      from: r.user.id,
      to: r.guardian.userId,
    }),
    createdMedicalRecord: r.many.medicalRecord({
      from: r.user.id,
      to: r.medicalRecord.doctorId,
      alias: "createdBy",
    }),
    notifications: r.many.notification({
      from: r.user.id,
      to: r.notification.userId,
    }),
    invitesCreated: r.many.invite({
      from: r.user.id,
      to: r.invite.createdBy,
      alias: "createdBy",
    }),
    invitesUsed: r.many.invite({
      from: r.user.id,
      to: r.invite.usedBy,
      alias: "usedBy",
    }),
    twoFactor: r.one.twoFactor({
      from: r.user.id,
      to: r.twoFactor.userId,
    }),
    clinicMemberships: r.many.clinicMember({
      from: r.user.id,
      to: r.clinicMember.userId,
    }),
    doctorProfile: r.one.doctor({
      from: r.user.id,
      to: r.doctor.userId,
    }),
    staffProfile: r.one.staff({
      from: r.user.id,
      to: r.staff.userId,
    }),
    patientProfile: r.one.patient({
      from: r.user.id,
      to: r.patient.userId,
      alias: "PatientUser",
    }),
    patientsCreated: r.many.patient({
      from: r.user.id,
      to: r.patient.createdById,
      alias: "PatientCreatedBy",
    }),
    guardianRelations: r.many.guardian({
      from: r.user.id,
      to: r.guardian.userId,
    }),
  },

  // Account relations
  accounts: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },

  // Session relations
  sessions: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },

  // Notification relations
  notifications: {
    user: r.one.user({
      from: r.notification.userId,
      to: r.user.id,
    }),
    clinic: r.one.clinic({
      from: r.notification.clinicId,
      to: r.clinic.id,
    }),
  },

  // Folder relations (self-referential)
  folders: {
    user: r.one.user({
      from: r.folder.userId,
      to: r.user.id,
    }),
    parent: r.one.folder({
      from: r.folder.parentId,
      to: r.folder.id,
      alias: "subfolders",
    }),
    subfolders: r.many.folder({
      from: r.folder.id,
      to: r.folder.parentId,
      alias: "subfolders",
    }),
    files: r.many.file({
      from: r.folder.id,
      to: r.file.folderId,
    }),
  },

  // File relations
  files: {
    user: r.one.user({
      from: r.file.userId,
      to: r.user.id,
    }),
    folder: r.one.folder({
      from: r.file.folderId,
      to: r.folder.id,
    }),
  },

  // Invite relations
  invites: {
    user: r.one.user({
      from: r.invite.usedBy,
      to: r.user.id,
      alias: "usedBy",
    }),
    creator: r.one.user({
      from: r.invite.createdBy,
      to: r.user.id,
      alias: "createdBy",
    }),
  },

  // Two-factor relations
  twoFactor: {
    user: r.one.user({
      from: r.twoFactor.userId,
      to: r.user.id,
    }),
  },

  // Clinic relations
  clinics: {
    doctors: r.many.doctor({
      from: r.clinic.id,
      to: r.doctor.clinicId,
    }),
    patients: r.many.patient({
      from: r.clinic.id,
      to: r.patient.clinicId,
    }),
    appointments: r.many.appointment({
      from: r.clinic.id,
      to: r.appointment.clinicId,
    }),
    userToClinics: r.many.clinicMember({
      from: r.clinic.id,
      to: r.clinicMember.clinicId,
      alias: "clinic",
    }),
    medicalRecords: r.many.medicalRecord({
      from: r.clinic.id,
      to: r.medicalRecord.clinicId,
    }),
    clinicSettings: r.many.clinicSetting({
      from: r.clinic.id,
      to: r.clinicSetting.clinicId,
    }),
    prescriptions: r.many.prescription({
      from: r.clinic.id,
      to: r.prescription.clinicId,
    }),
    payments: r.many.payment({
      from: r.clinic.id,
      to: r.payment.clinicId,
    }),
    encounters: r.many.diagnosis({
      from: r.clinic.id,
      to: r.diagnosis.clinicId,
    }),
    services: r.many.service({
      from: r.clinic.id,
      to: r.service.clinicId,
    }),
    staffs: r.many.staff({
      from: r.clinic.id,
      to: r.staff.clinicId,
    }),
    clinicNotifications: r.many.notification({
      from: r.clinic.id,
      to: r.notification.clinicId,
    }),
    prescribedItems: r.many.prescribedItem({
      from: r.clinic.id,
      to: r.prescribedItem.clinicId,
    }),
    drugs: r.many.drug({
      from: r.clinic.id,
      to: r.drug.clinicId,
    }),
    aiReports: r.many.aiReport({
      from: r.clinic.id,
      to: r.aiReport.clinicId,
    }),
  },

  // Clinic member relations
  clinicMembers: {
    user: r.one.user({
      from: r.clinicMember.userId,
      to: r.user.id,
    }),
    clinic: r.one.clinic({
      from: r.clinicMember.clinicId,
      to: r.clinic.id,
      alias: "clinic",
    }),
  },

  // Doctor relations
  doctor: {
    user: r.one.user({
      from: r.doctor.userId,
      to: r.user.id,
    }),
    clinic: r.one.clinic({
      from: r.doctor.clinicId,
      to: r.clinic.id,
    }),
    workingDays: r.many.workingDay({
      from: r.doctor.id,
      to: r.workingDay.doctorId,
    }),
    appointments: r.many.appointment({
      from: r.doctor.id,
      to: r.appointment.doctorId,
    }),
    encounters: r.many.diagnosis({
      from: r.doctor.id,
      to: r.diagnosis.doctorId,
    }),
    prescriptions: r.many.prescription({
      from: r.doctor.id,
      to: r.prescription.doctorId,
    }),
    medicalRecords: r.many.medicalRecord({
      from: r.doctor.id,
      to: r.medicalRecord.doctorId,
    }),
    ratings: r.many.rating({
      from: r.doctor.id,
      to: r.rating.staffId,
    }),
  },

  // Working days relations
  workingDays: {
    doctor: r.one.doctor({
      from: r.workingDay.doctorId,
      to: r.doctor.id,
    }),
  },

  // Staff relations
  staff: {
    user: r.one.user({
      from: r.staff.userId,
      to: r.user.id,
    }),
    clinic: r.one.clinic({
      from: r.staff.clinicId,
      to: r.clinic.id,
    }),
    administeredImmunizations: r.many.immunization({
      from: r.staff.id,
      to: r.immunization.administeredByStaffId,
      alias: "AdministeredByStaff",
    }),
  },

  // Patient relations
  patient: {
    clinic: r.one.clinic({
      from: r.patient.clinicId,
      to: r.clinic.id,
    }),
    user: r.one.user({
      from: r.patient.userId,
      to: r.user.id,
      alias: "PatientUser",
    }),
    createdBy: r.one.user({
      from: r.patient.createdById,
      to: r.user.id,
      alias: "PatientCreatedBy",
    }),
    appointments: r.many.appointment({
      from: r.patient.id,
      to: r.appointment.patientId,
    }),
    medicalRecords: r.many.medicalRecord({
      from: r.patient.id,
      to: r.medicalRecord.patientId,
    }),
    encounters: r.many.diagnosis({
      from: r.patient.id,
      to: r.diagnosis.patientId,
    }),
    immunizations: r.many.immunization({
      from: r.patient.id,
      to: r.immunization.patientId,
    }),
    vitalSigns: r.many.vitalSign({
      from: r.patient.id,
      to: r.vitalSign.patientId,
    }),
    feedingLogs: r.many.feedingLog({
      from: r.patient.id,
      to: r.feedingLog.patientId,
    }),
    prescriptions: r.many.prescription({
      from: r.patient.id,
      to: r.prescription.patientId,
    }),
    ratings: r.many.rating({
      from: r.patient.id,
      to: r.rating.patientId,
    }),
    developmentalChecks: r.many.developmentalCheck({
      from: r.patient.id,
      to: r.developmentalCheck.patientId,
    }),
    developmentalMilestones: r.many.developmentalMilestones({
      from: r.patient.id,
      to: r.developmentalMilestones.patientId,
    }),
    growthRecords: r.many.growthRecord({
      from: r.patient.id,
      to: r.growthRecord.patientId,
    }),
    payments: r.many.payment({
      from: r.patient.id,
      to: r.payment.patientId,
    }),
    guardians: r.many.guardian({
      from: r.patient.id,
      to: r.guardian.patientId,
    }),
    labTests: r.many.labTest({
      from: r.patient.id,
      to: r.labTest.patientId,
    }),
    aiReports: r.many.aiReport({
      from: r.patient.id,
      to: r.aiReport.patientId,
    }),
  },

  // Appointment relations
  appointment: {
    patient: r.one.patient({
      from: r.appointment.patientId,
      to: r.patient.id,
    }),
    doctor: r.one.doctor({
      from: r.appointment.doctorId,
      to: r.doctor.id,
    }),
    clinic: r.one.clinic({
      from: r.appointment.clinicId,
      to: r.clinic.id,
    }),
    service: r.one.service({
      from: r.appointment.serviceId,
      to: r.service.id,
    }),
    bills: r.many.payment({
      from: r.appointment.id,
      to: r.payment.appointmentId,
    }),
    medicalRecords: r.many.medicalRecord({
      from: r.appointment.id,
      to: r.medicalRecord.appointmentId,
    }),
    reminders: r.many.reminder({
      from: r.appointment.id,
      to: r.reminder.appointmentId,
    }),
    encounters: r.many.diagnosis({
      from: r.appointment.id,
      to: r.diagnosis.appointmentId,
    }),
  },

  // Medical record relations
  medicalRecord: {
    patient: r.one.patient({
      from: r.medicalRecord.patientId,
      to: r.patient.id,
    }),
    appointment: r.one.appointment({
      from: r.medicalRecord.appointmentId,
      to: r.appointment.id,
    }),
    doctor: r.one.doctor({
      from: r.medicalRecord.doctorId,
      to: r.doctor.id,
    }),
    clinic: r.one.clinic({
      from: r.medicalRecord.clinicId,
      to: r.clinic.id,
    }),
    labTests: r.many.labTest({
      from: r.medicalRecord.id,
      to: r.labTest.recordId,
    }),
    immunizations: r.many.immunization({
      from: r.medicalRecord.id,
      to: r.immunization.recordId,
    }),
    prescriptions: r.many.prescription({
      from: r.medicalRecord.id,
      to: r.prescription.medicalRecordId,
    }),
    vitalSigns: r.many.vitalSign({
      from: r.medicalRecord.id,
      to: r.vitalSign.medicalId,
    }),
    encounters: r.many.diagnosis({
      from: r.medicalRecord.id,
      to: r.diagnosis.medicalId,
    }),
  },

  // Diagnosis (encounter) relations
  diagnosis: {
    patient: r.one.patient({
      from: r.diagnosis.patientId,
      to: r.patient.id,
    }),
    doctor: r.one.doctor({
      from: r.diagnosis.doctorId,
      to: r.doctor.id,
    }),
    clinic: r.one.clinic({
      from: r.diagnosis.clinicId,
      to: r.clinic.id,
    }),
    appointment: r.one.appointment({
      from: r.diagnosis.appointmentId,
      to: r.appointment.id,
    }),
    medical: r.one.medicalRecord({
      from: r.diagnosis.medicalId,
      to: r.medicalRecord.id,
    }),
    vitalSigns: r.many.vitalSign({
      from: r.diagnosis.id,
      to: r.vitalSign.encounterId,
    }),
    prescriptions: r.many.prescription({
      from: r.diagnosis.id,
      to: r.prescription.encounterId,
    }),
  },

  // Vital signs relations
  vitalSign: {
    patient: r.one.patient({
      from: r.vitalSign.patientId,
      to: r.patient.id,
    }),
    medical: r.one.medicalRecord({
      from: r.vitalSign.medicalId,
      to: r.medicalRecord.id,
    }),
    encounter: r.one.diagnosis({
      from: r.vitalSign.encounterId,
      to: r.diagnosis.id,
    }),
    growthRecord: r.one.growthRecord({
      from: r.vitalSign.growthRecordId,
      to: r.growthRecord.id,
    }),
  },

  // Growth record relations
  growthRecord: {
    patient: r.one.patient({
      from: r.growthRecord.patientId,
      to: r.patient.id,
    }),
    vitalSigns: r.many.vitalSign({
      from: r.growthRecord.id,
      to: r.vitalSign.growthRecordId,
    }),
  },

  // Immunization relations
  immunization: {
    patient: r.one.patient({
      from: r.immunization.patientId,
      to: r.patient.id,
    }),
    administeredBy: r.one.staff({
      from: r.immunization.administeredByStaffId,
      to: r.staff.id,
      alias: "AdministeredByStaff",
    }),
    medicalRecord: r.one.medicalRecord({
      from: r.immunization.recordId,
      to: r.medicalRecord.id,
    }),
  },

  // Service relations
  service: {
    clinic: r.one.clinic({
      from: r.service.clinicId,
      to: r.clinic.id,
    }),
    labTests: r.many.labTest({
      from: r.service.id,
      to: r.labTest.serviceId,
    }),
    bills: r.many.patientBill({
      from: r.service.id,
      to: r.patientBill.serviceId,
    }),
    appointments: r.many.appointment({
      from: r.service.id,
      to: r.appointment.serviceId,
    }),
  },

  // Lab test relations
  labTest: {
    patient: r.one.patient({
      from: r.labTest.patientId,
      to: r.patient.id,
    }),
    medicalRecord: r.one.medicalRecord({
      from: r.labTest.recordId,
      to: r.medicalRecord.id,
    }),
    service: r.one.service({
      from: r.labTest.serviceId,
      to: r.service.id,
    }),
  },

  // Payment relations
  payment: {
    clinic: r.one.clinic({
      from: r.payment.clinicId,
      to: r.clinic.id,
    }),
    patient: r.one.patient({
      from: r.payment.patientId,
      to: r.patient.id,
    }),
    appointment: r.one.appointment({
      from: r.payment.appointmentId,
      to: r.appointment.id,
    }),
    bills: r.many.patientBill({
      from: r.payment.id,
      to: r.patientBill.billId,
    }),
  },

  // Patient bill relations
  patientBill: {
    service: r.one.service({
      from: r.patientBill.serviceId,
      to: r.service.id,
    }),
    payment: r.one.payment({
      from: r.patientBill.billId,
      to: r.payment.id,
    }),
  },

  // Reminder relations
  reminder: {
    appointment: r.one.appointment({
      from: r.reminder.appointmentId,
      to: r.appointment.id,
    }),
  },

  // Clinic setting relations
  clinicSetting: {
    clinic: r.one.clinic({
      from: r.clinicSetting.clinicId,
      to: r.clinic.id,
    }),
  },

  // Prescription relations
  prescription: {
    medicalRecord: r.one.medicalRecord({
      from: r.prescription.medicalRecordId,
      to: r.medicalRecord.id,
    }),
    doctor: r.one.doctor({
      from: r.prescription.doctorId,
      to: r.doctor.id,
    }),
    patient: r.one.patient({
      from: r.prescription.patientId,
      to: r.patient.id,
    }),
    encounter: r.one.diagnosis({
      from: r.prescription.encounterId,
      to: r.diagnosis.id,
    }),
    clinic: r.one.clinic({
      from: r.prescription.clinicId,
      to: r.clinic.id,
    }),
    prescribedItems: r.many.prescribedItem({
      from: r.prescription.id,
      to: r.prescribedItem.prescriptionId,
    }),
    medicationDispenses: r.many.medicationDispense({
      from: r.prescription.id,
      to: r.medicationDispense.prescriptionId,
    }),
  },

  // Rating relations
  rating: {
    doctor: r.one.doctor({
      from: r.rating.staffId,
      to: r.doctor.id,
    }),
    patient: r.one.patient({
      from: r.rating.patientId,
      to: r.patient.id,
    }),
  },

  // Drug relations
  drug: {
    guidelines: r.many.doseGuideline({
      from: r.drug.id,
      to: r.doseGuideline.drugId,
    }),
    prescribedItems: r.many.prescribedItem({
      from: r.drug.id,
      to: r.prescribedItem.drugId,
    }),
  },

  // Dose guideline relations
  doseGuideline: {
    drug: r.one.drug({
      from: r.doseGuideline.drugId,
      to: r.drug.id,
    }),
  },

  // Prescribed item relations
  prescribedItem: {
    prescription: r.one.prescription({
      from: r.prescribedItem.prescriptionId,
      to: r.prescription.id,
    }),
    drug: r.one.drug({
      from: r.prescribedItem.drugId,
      to: r.drug.id,
    }),
    clinic: r.one.clinic({
      from: r.prescribedItem.clinicId,
      to: r.clinic.id,
    }),
    dispenses: r.many.medicationDispense({
      from: r.prescribedItem.id,
      to: r.medicationDispense.prescribedItemId,
    }),
  },

  // Guardian relations
  guardian: {
    patient: r.one.patient({
      from: r.guardian.patientId,
      to: r.patient.id,
    }),
    user: r.one.user({
      from: r.guardian.userId,
      to: r.user.id,
    }),
  },

  // Feeding log relations
  feedingLog: {
    patient: r.one.patient({
      from: r.feedingLog.patientId,
      to: r.patient.id,
    }),
  },

  // Medication dispense relations
  medicationDispense: {
    prescribedItem: r.one.prescribedItem({
      from: r.medicationDispense.prescribedItemId,
      to: r.prescribedItem.id,
    }),
    prescription: r.one.prescription({
      from: r.medicationDispense.prescriptionId,
      to: r.prescription.id,
    }),
  },

  // Developmental milestone relations
  developmentalMilestones: {
    patient: r.one.patient({
      from: r.developmentalMilestones.patientId,
      to: r.patient.id,
    }),
  },

  // Developmental check relations
  developmentalChecks: {
    patient: r.one.patient({
      from: r.developmentalCheck.patientId,
      to: r.patient.id,
    }),
  },
  userQuota: {
    user: r.one.user({
      from: r.userQuota.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },

  vaccineInventory: {
    clinic: r.one.clinic({
      from: r.vaccineInventory.clinicId,
      to: r.clinic.id,
    }),
    immunizations: r.many.immunization({
      from: r.vaccineInventory.id,
      to: r.immunization.id,
    }),
  },

  aiReport: {
    patient: r.one.patient({
      from: r.aiReport.patientId,
      to: r.patient.id,
    }),
    doctor: r.one.doctor({
      from: r.aiReport.doctorId,
      to: r.doctor.id,
    }),
    clinic: r.one.clinic({
      from: r.aiReport.clinicId,
      to: r.clinic.id,
    }),
    generator: r.one.user({
      from: r.aiReport.generatedBy,
      to: r.user.id,
    }),
  },
}));
