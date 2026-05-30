import {
  boolean,
  index,
  integer,
  jsonb,
  type PgColumn,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// =======================
// ENUM Definitions
// =======================

export const roleEnum = pgEnum("role", ["admin", "doctor", "staff", "patient"]);
export type UserRole = keyof typeof roleEnum;
export const statusEnum = pgEnum("status", [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "SUSPENDED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "ON_HOLD",
]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);
export const bloodGroupEnum = pgEnum("blood_group", [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
]);
export const nutritionalStatusEnum = pgEnum("nutritional_status", [
  "NORMAL",
  "UNDERWEIGHT",
  "OVERWEIGHT",
  "OBESE",
  "MALNOURISHED",
]);
export const doctorTypeEnum = pgEnum("doctor_type", [
  "FULL",
  "PART_TIME",
  "CONSULTANT",
  "VISITING",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PAID",
  "UNPAID",
  "PENDING",
  "REFUNDED",
  "PARTIAL",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CARD",
  "INSURANCE",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
]);
export const availabilityStatusEnum = pgEnum("availability_status", [
  "AVAILABLE",
  "UNAVAILABLE",
  "ON_LEAVE",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "read",
  "unread",
]);
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "high",
  "medium",
  "low",
]);
export const immunizationStatusEnum = pgEnum("immunization_status", [
  "COMPLETED",
  "PENDING",
  "CANCELLED",
  "OVERDUE",
]);
export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "active",
  "completed",
  "cancelled",
  "expired",
  "on_hold",
]);
export const weekdayEnum = pgEnum("weekday", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
export const measurementTypeEnum = pgEnum("measurement_type", [
  "WEIGHT",
  "HEIGHT",
  "BMI",
  "HEAD_CIRCUMFERENCE",
]);
export const feedingTypeEnum = pgEnum("feeding_type", [
  "BREAST",
  "BOTTLE",
  "FORMULA",
  "SOLID",
  "MIXED",
]);
export const breastEnum = pgEnum("breast", ["LEFT", "RIGHT", "BOTH"]);
export const drugRouteEnum = pgEnum("drug_route", [
  "ORAL",
  "INTRAVENOUS",
  "INTRAMUSCULAR",
  "SUBCUTANEOUS",
  "TOPICAL",
  "INHALATION",
  "RECTAL",
]);
export const frequencyEnum = pgEnum("frequency", [
  "ONCE_DAILY",
  "TWICE_DAILY",
  "THREE_TIMES_DAILY",
  "FOUR_TIMES_DAILY",
  "EVERY_OTHER_DAY",
  "WEEKLY",
  "MONTHLY",
  "AS_NEEDED",
]);
export const reminderMethodEnum = pgEnum("reminder_method", [
  "SMS",
  "EMAIL",
  "PUSH",
  "CALL",
]);
export const reminderStatusEnum = pgEnum("reminder_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "CANCELLED",
]);
export const labTestStatusEnum = pgEnum("lab_test_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export const severityEnum = pgEnum("severity", [
  "MILD",
  "MODERATE",
  "SEVERE",
  "CRITICAL",
]);
export const actionTypeEnum = pgEnum("action_type", [
  "redirect",
  "api_call",
  "workflow",
  "modal",
  "none",
]);

export const userQuota = pgTable("user_quota", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  quota: integer("quota").notNull().default(0),
  usedQuota: integer("used_quota").notNull().default(0),
  fileCount: integer("file_count").notNull().default(0),
  fileCountQuota: integer("file_count_quota").notNull().default(0),
  inviteCount: integer("invite_count").notNull().default(0),
  inviteQuota: integer("invite_quota").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const folder = pgTable(
  "folder",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: text("parent_id").references((): PgColumn => folder.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_folders_user_id").on(table.userId),
    index("idx_folders_parent_id").on(table.parentId),
  ],
);

export const file = pgTable(
  "file",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folder.id, {
      onDelete: "cascade",
    }),
    filename: text("filename").notNull(),
    searchText: text("search_text").notNull().default(""),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_files_slug").on(table.slug),
    index("idx_files_search_text").on(table.searchText),
    index("idx_files_folder_id").on(table.folderId),
  ],
);

export const configStore = pgTable("config_store", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const invite = pgTable(
  "invite",
  {
    code: text("code").primaryKey(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
    usedAt: timestamp("used_at", { mode: "date" }),
  },
  (table) => [index("invites_used_by_idx").on(table.usedBy)],
);

// =======================
// New Tables (from your Prisma schema)
// =======================

export const clinic = pgTable(
  "clinic",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    timezone: text("timezone").notNull().default("UTC"),
    address: text("address"),
    phone: text("phone"),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    uniqueIndex("clinics_name_unique").on(t.name),
    index("clinics_is_deleted_idx").on(t.isDeleted),
  ],
);

export const clinicMember = pgTable(
  "users_to_clinic",
  {
    userId: text("user_id").notNull().unique(),
    clinicId: text("clinic_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    role: roleEnum("role"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.clinicId] })],
);

export const doctor = pgTable(
  "doctor",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    name: text("name").notNull(),
    userId: text("user_id").unique(),
    clinicId: text("clinic_id"),
    specialty: text("specialty").notNull(),
    licenseNumber: text("license_number"),
    phone: text("phone"),
    address: text("address"),
    department: text("department"),
    img: text("img"),
    colorCode: text("color_code"),
    availabilityStatus: availabilityStatusEnum("availability_status"),
    availableFromWeekDay: weekdayEnum("available_from_week_day"),
    availableToWeekDay: weekdayEnum("available_to_week_day"),
    isActive: boolean("is_active"),
    status: statusEnum("status"),
    availableFromTime: text("available_from_time"),
    availableToTime: text("available_to_time"),
    type: doctorTypeEnum("type").default("FULL"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    appointmentPrice: integer("appointment_price"),
    role: roleEnum("role"),
    rating: integer("rating"),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
  },
  (table) => [
    index("doctors_clinic_id_is_active_idx").on(table.clinicId, table.isActive),
    index("doctors_specialty_clinic_id_idx").on(
      table.specialty,
      table.clinicId,
    ),
    index("doctors_is_deleted_idx").on(table.isDeleted),
  ],
);

export const workingDay = pgTable(
  "working_day",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id").notNull(),
    day: weekdayEnum("day").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("working_days_doctor_id_day_unique").on(
      table.doctorId,
      table.day,
    ),
  ],
);

export const staff = pgTable(
  "staff",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    name: text("name").notNull(),
    phone: text("phone"),
    userId: text("user_id").unique(),
    clinicId: text("clinic_id"),
    address: text("address").notNull(),
    department: text("department"),
    img: text("img"),
    licenseNumber: text("license_number"),
    colorCode: text("color_code"),
    hireDate: timestamp("hire_date", { mode: "date" }),
    salary: real("salary"),
    role: roleEnum("role").notNull(),
    status: statusEnum("status").default("ACTIVE"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isActive: boolean("is_active"),
  },
  (table) => [index("staffs_deleted_at_idx").on(table.deletedAt)],
);

export const patient = pgTable(
  "patient",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id").notNull(),
    userId: text("user_id").notNull().unique(),
    email: text("email").unique(),
    phone: text("phone"),
    emergencyContactNumber: text("emergency_contact_number"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }).notNull(),
    gender: genderEnum("gender").default("MALE"),
    maritalStatus: maritalStatusEnum("marital_status"),
    nutritionalStatus: nutritionalStatusEnum("nutritional_status"),
    address: text("address"),
    emergencyContactName: text("emergency_contact_name"),
    mrn: text("mrn").unique(),
    relation: text("relation"),
    allergies: text("allergies"),
    medicalConditions: text("medical_conditions"),
    medicalHistory: text("medical_history"),
    image: text("image"),
    colorCode: text("color_code"),
    role: roleEnum("role"),
    status: statusEnum("status").default("ACTIVE"),
    isActive: boolean("is_active").default(true),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
    createdById: text("created_by_id"),
    updatedById: text("updated_by_id"),
    bloodGroup: bloodGroupEnum("blood_group"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("patients_clinic_active_deleted_idx").on(
      table.clinicId,
      table.isActive,
      table.isDeleted,
      table.createdAt,
    ),
    index("patients_mrn_idx").on(table.mrn),
    index("patients_date_of_birth_idx").on(table.dateOfBirth),
    index("patients_clinic_status_idx").on(table.clinicId, table.status),
    index("patients_name_idx").on(table.lastName, table.firstName),
  ],
);

export const appointment = pgTable(
  "appointment",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    doctorId: text("doctor_id").notNull(),
    serviceId: text("service_id"),
    doctorSpecialty: text("doctor_specialty"),
    clinicId: text("clinic_id").notNull(),
    appointmentDate: timestamp("appointment_date", { mode: "date" }).notNull(),
    time: text("time"),
    durationMinutes: integer("duration_minutes"),
    appointmentPrice: integer("appointment_price"),
    status: appointmentStatusEnum("status").default("PENDING"),
    type: text("type").notNull(),
    note: text("note"),
    reason: text("reason"),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appointments_clinic_date_status_idx").on(
      table.clinicId,
      table.appointmentDate,
      table.status,
    ),
    index("appointments_doctor_date_status_idx").on(
      table.doctorId,
      table.appointmentDate,
      table.status,
    ),
    index("appointments_patient_date_idx").on(
      table.patientId,
      table.appointmentDate,
    ),
    index("appointments_is_deleted_idx").on(table.isDeleted),
  ],
);

export const medicalRecord = pgTable(
  "medical_record",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    appointmentId: text("appointment_id").notNull(),
    doctorId: text("doctor_id").notNull(),
    clinicId: text("clinic_id").notNull(),
    diagnosis: text("diagnosis"),
    symptoms: text("symptoms"),
    treatmentPlan: text("treatment_plan"),
    labRequest: text("lab_request"),
    notes: text("notes"),
    attachments: text("attachments"),
    diagnosisDate: timestamp("diagnosis_date", { mode: "date" }),
    status: statusEnum("status").default("ACTIVE"),
    medications: text("medications"),
    followUpDate: timestamp("follow_up_date", { mode: "date" }),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("medical_records_patient_appointment_unique").on(
      table.patientId,
      table.appointmentId,
    ),
    index("medical_records_clinic_followup_idx").on(
      table.clinicId,
      table.followUpDate,
    ),
    index("medical_records_patient_created_idx").on(
      table.patientId,
      table.createdAt,
    ),
    index("medical_records_doctor_idx").on(table.doctorId),
    index("medical_records_is_deleted_idx").on(table.isDeleted),
  ],
);

export const diagnosis = pgTable(
  "diagnosis",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    doctorId: text("doctor_id").notNull(),
    clinicId: text("clinic_id"),
    appointmentId: text("appointment_id"),
    medicalId: text("medical_id").notNull().unique(),
    date: timestamp("date", { mode: "date" }).defaultNow().notNull(),
    type: text("type"),
    diagnosis: text("diagnosis"),
    status: statusEnum("status"),
    treatment: text("treatment"),
    notes: text("notes"),
    symptoms: text("symptoms").notNull(),
    prescribedMedications: text("prescribed_medications"),
    followUpPlan: text("follow_up_plan"),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("diagnoses_clinic_date_idx").on(table.clinicId, table.date),
    index("diagnoses_doctor_date_idx").on(table.doctorId, table.date),
    index("diagnoses_patient_date_idx").on(table.patientId, table.date),
    index("diagnoses_is_deleted_idx").on(table.isDeleted),
  ],
);

export const vitalSign = pgTable(
  "vital_sign",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    patientId: text("patient_id").notNull(),
    medicalId: text("medical_id").notNull().unique(),
    encounterId: text("encounter_id").unique(),
    growthRecordId: text("growth_record_id"),
    recordedAt: timestamp("recorded_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    bodyTemperature: real("body_temperature"),
    systolic: integer("systolic"),
    diastolic: integer("diastolic"),
    heartRate: integer("heart_rate"),
    weight: real("weight"),
    height: real("height"),
    bmi: real("bmi"),
    respiratoryRate: integer("respiratory_rate"),
    oxygenSaturation: integer("oxygen_saturation"),
    gender: genderEnum("gender"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ageDays: integer("age_days"),
    ageMonths: integer("age_months"),
  },
  (table) => [
    index("vital_signs_clinic_recorded_idx").on(
      table.clinicId,
      table.recordedAt,
    ),
    index("vital_signs_patient_recorded_idx").on(
      table.patientId,
      table.recordedAt,
    ),
    index("vital_signs_encounter_idx").on(table.encounterId),
  ],
);

export const growthRecord = pgTable(
  "growth_record",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    patientId: text("patient_id").notNull(),
    gender: genderEnum("gender"),
    ageDays: integer("age_days"),
    ageMonths: integer("age_months"),
    headCircumference: real("head_circumference"),
    bmi: real("bmi"),
    weightForAgeZ: real("weight_for_age_z"),
    heightForAgeZ: real("height_for_age_z"),
    bmiForAgeZ: real("bmi_for_age_z"),
    hcForAgeZ: real("hc_for_age_z"),
    weight: real("weight"),
    height: real("height"),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    recordedAt: timestamp("recorded_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("growth_records_patient_date_idx").on(table.patientId, table.date),
  ],
);

export const immunization = pgTable(
  "immunization",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    patientId: text("patient_id").notNull(),
    vaccine: text("vaccine").notNull(),
    date: timestamp("date", { mode: "date" }).notNull(),
    dose: text("dose"),
    lotNumber: text("lot_number"),
    administeredByStaffId: text("administered_by_staff_id"),
    notes: text("notes"),
    recordId: text("record_id").notNull().unique(),
    isOverDue: boolean("is_overdue").default(false),
    status: immunizationStatusEnum("status").default("COMPLETED"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
  },
  (table) => [
    index("immunizations_clinic_patient_vaccine_date_idx").on(
      table.clinicId,
      table.patientId,
      table.vaccine,
      table.date,
    ),
    index("immunizations_clinic_patient_date_idx").on(
      table.clinicId,
      table.patientId,
      table.date,
    ),
  ],
);

export const service = pgTable(
  "service",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    serviceName: text("service_name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    category: text("category"),
    duration: integer("duration"),
    isAvailable: boolean("is_available").default(true),
    icon: text("icon"),
    color: text("color"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
  },
  (table) => [
    index("services_is_deleted_idx").on(table.isDeleted),
    index("services_service_name_idx").on(table.serviceName),
  ],
);

export const labTest = pgTable(
  "lab_test",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id"),
    recordId: text("record_id").notNull(),
    serviceId: text("service_id").notNull(),
    testDate: timestamp("test_date", { mode: "date" }).notNull(),
    result: text("result").notNull(),
    status: labTestStatusEnum("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("lab_tests_service_id_idx").on(table.serviceId),
    index("lab_tests_record_id_idx").on(table.recordId),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    billId: text("bill_id"),
    patientId: text("patient_id"),
    appointmentId: text("appointment_id").unique(),
    billDate: timestamp("bill_date", { mode: "date" }).notNull(),
    paymentDate: timestamp("payment_date", { mode: "date" }),
    discount: integer("discount"),
    totalAmount: integer("total_amount"),
    amountPaid: integer("amount_paid"),
    amount: integer("amount"),
    status: paymentStatusEnum("status").default("PAID"),
    insurance: text("insurance"),
    insuranceId: text("insurance_id"),
    serviceDate: timestamp("service_date", { mode: "date" }),
    dueDate: timestamp("due_date", { mode: "date" }),
    paidDate: timestamp("paid_date", { mode: "date" }),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    isDeleted: boolean("is_deleted").default(false),
    paymentMethod: paymentMethodEnum("payment_method").default("CASH"),
    receiptNumber: integer("receipt_number"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payments_is_deleted_idx").on(table.isDeleted),
    index("payments_patient_status_idx").on(table.patientId, table.status),
    index("payments_status_due_date_idx").on(table.status, table.dueDate),
    index("payments_patient_payment_date_idx").on(
      table.patientId,
      table.paymentDate,
    ),
  ],
);

export const patientBill = pgTable("patient_bill", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id"),
  billId: text("bill_id").notNull(),
  serviceId: text("service_id").notNull(),
  serviceDate: timestamp("service_date", { mode: "date" }).notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost"),
  totalCost: integer("total_cost"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const reminder = pgTable("reminder", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id").notNull().unique(),
  method: reminderMethodEnum("method").notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }).notNull(),
  status: reminderStatusEnum("status").notNull(),
});

export const clinicSetting = pgTable("clinic_setting", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().unique(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  workingDays: text("working_days").notNull(),
  defaultAppointmentDuration: integer("default_appointment_duration").default(
    30,
  ),
  requireEmergencyContact: boolean("require_emergency_contact").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const prescription = pgTable(
  "prescriptions",
  {
    id: text("id").primaryKey(),
    medicalRecordId: text("medical_record_id").notNull(),
    doctorId: text("doctor_id"),
    patientId: text("patient_id").notNull(),
    encounterId: text("encounter_id").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),
    medicationName: text("medication_name"),
    instructions: text("instructions"),
    issuedDate: timestamp("issued_date", { mode: "date" })
      .defaultNow()
      .notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    status: prescriptionStatusEnum("status").notNull(),
    clinicId: text("clinic_id"),
    validUntil: timestamp("valid_until", { mode: "date" }),
    renewedFromId: text("renewed_from_id"),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("prescriptions_clinic_id_idx").on(table.clinicId)],
);

export const whoGrowthStandard = pgTable("who_growth_standards", {
  id: text("id").primaryKey(),
  ageInMonths: real("age_in_months"),
  ageDays: integer("age_days").notNull(),
  gender: genderEnum("gender").notNull(),
  measurementType: measurementTypeEnum("measurement_type").notNull(),
  lValue: real("l_value").notNull(),
  mValue: real("m_value").notNull(),
  sValue: real("s_value").notNull(),
  sd0: real("sd0").notNull(),
  sd1neg: real("sd1neg").notNull(),
  sd1pos: real("sd1pos").notNull(),
  sd2neg: real("sd2neg").notNull(),
  sd2pos: real("sd2pos").notNull(),
  sd3neg: real("sd3neg").notNull(),
  sd3pos: real("sd3pos").notNull(),
  sd4neg: real("sd4neg"),
  sd4pos: real("sd4pos"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const rating = pgTable("rating", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id"),
  patientId: text("patient_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const drug = pgTable("drugs", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id"),
  name: text("name").notNull().unique(),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  description: text("description"),
  sideEffects: text("side_effects"),
  quantityInStock: integer("quantity_in_stock").default(0),
  interactions: text("interactions"),
  contraindications: text("contraindications"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const doseGuideline = pgTable("dose_guidelines", {
  id: text("id").primaryKey(),
  drugId: text("drug_id").notNull(),
  route: drugRouteEnum("route").notNull(),
  clinicalIndication: text("clinical_indication").notNull(),
  minDosePerKg: real("min_dose_per_kg"),
  maxDosePerKg: real("max_dose_per_kg"),
  doseUnit: text("dose_unit"),
  frequencyDays: text("frequency_days"),
  gestationalAgeWeeksMin: real("gestational_age_weeks_min"),
  gestationalAgeWeeksMax: real("gestational_age_weeks_max"),
  postNatalAgeDaysMin: real("post_natal_age_days_min"),
  postNatalAgeDaysMax: real("post_natal_age_days_max"),
  maxDosePer24h: real("max_dose_per_24h"),
  stockConcentrationMgMl: real("stock_concentration_mg_ml"),
  finalConcentrationMgMl: real("final_concentration_mg_ml"),
  minInfusionTimeMin: integer("min_infusion_time_min"),
  compatibilityDiluent: text("compatibility_diluent"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const prescribedItem = pgTable("prescribed_items", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").notNull(),
  clinicId: text("clinic_id").notNull(),
  drugId: text("drug_id").notNull(),
  dosageValue: real("dosage_value").notNull(),
  dosageUnit: text("dosage_unit").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
  drugRoute: drugRouteEnum("drug_route"),
  refillsRemaining: integer("refills_remaining").default(0),
  totalRefills: integer("total_refills").default(0),
  lastRefillDate: timestamp("last_refill_date", { mode: "date" }),
  quantityDispensedTotal: real("quantity_dispensed_total").default(0),
  notes: text("notes"),
  expiresAt: timestamp("expire_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const fileUpload = pgTable("files_upload", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const guardian = pgTable(
  "guardians",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    userId: text("user_id").notNull(),
    relation: text("relation").notNull(),
    isPrimary: boolean("is_primary").default(false),
    phone: text("phone"),
    email: text("email"),
  },
  (table) => [
    index("guardians_patient_id_idx").on(table.patientId),
    index("guardians_user_id_idx").on(table.userId),
  ],
);

export const feedingLog = pgTable(
  "feeding_logs",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    date: timestamp("date", { mode: "date" }).defaultNow().notNull(),
    type: feedingTypeEnum("type").notNull(),
    duration: integer("duration"),
    amount: real("amount"),
    breast: breastEnum("breast"),
    notes: text("notes"),
  },
  (table) => [
    index("feeding_logs_patient_date_idx").on(table.patientId, table.date),
  ],
);

export type NotificationAction = {
  id: string;
  label: string;
  type?: (typeof actionTypeEnum.enumValues)[number];
  style?: "primary" | "danger" | "default";
  route?: string;
  executed?: boolean;
  payload?: Record<string, unknown>;
};

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  userId: text("user_id").notNull(),
  clinicId: text("clinic_id").notNull(),
  status: notificationStatusEnum("status").default("unread").notNull(),
  priority: notificationPriorityEnum("priority"),
  type: text("type"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  actions: jsonb("actions").$type<NotificationAction[] | null>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const developmentalMilestones = pgTable("developmental_milestones", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  milestone: text("milestone").notNull(),
  ageAchieved: text("age_achieved").notNull(),
  dateRecorded: timestamp("date_recorded", { mode: "date" }).notNull(),
  notes: text("notes"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const developmentalCheck = pgTable(
  "developmental_check",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    checkDate: timestamp("check_date", { mode: "date" }).notNull(),
    ageMonths: integer("age_months").notNull(),
    motorSkills: text("motor_skills").notNull(),
    languageSkills: text("language_skills").notNull(),
    socialSkills: text("social_skills").notNull(),
    cognitiveSkills: text("cognitive_skills").notNull(),
    milestonesMet: text("milestones_met"),
    milestonesPending: text("milestones_pending"),
    concerns: text("concerns"),
    recommendations: text("recommendations"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("developmental_check_patient_date_idx").on(
      table.patientId,
      table.checkDate,
    ),
    index("developmental_check_age_months_idx").on(table.ageMonths),
  ],
);

export const medicationDispense = pgTable("medication_dispenses", {
  id: text("id").primaryKey(),
  prescribedItemId: text("prescribed_item_id").notNull(),
  prescriptionId: text("prescription_id").notNull(),
  quantityDispensed: real("quantity_dispensed").notNull(),
  lotNumber: text("lot_number"),
  expirationDate: timestamp("expiration_date"),
  dispensedBy: text("dispensed_by").notNull(),
  dispensedAt: timestamp("dispensed_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const prescriptionLog = pgTable("prescription_logs", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").notNull(),
  action: text("action").notNull(),
  performedBy: text("performed_by").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const vaccineSchedule = pgTable(
  "vaccine_schedule",
  {
    id: text("id").primaryKey(),
    vaccineName: text("vaccine_name").notNull(),
    recommendedAge: text("recommended_age").notNull(),
    dosesRequired: integer("doses_required").notNull(),
    minimumInterval: integer("minimum_interval"),
    isMandatory: boolean("is_mandatory").default(true),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    dueDate: timestamp("due_date", { mode: "date" }),
    status: immunizationStatusEnum("status").default("PENDING"),
    isOverDue: boolean("is_overdue").default(false),
    clinicId: text("clinic_id"),
    totalDoses: integer("total_doses"),
    isDeleted: boolean("is_deleted").default(false),
    ageInDaysMin: integer("age_in_days_min"),
    ageInDaysMax: integer("age_in_days_max"),
  },
  (table) => [
    uniqueIndex("vaccine_schedule_name_age_unique").on(
      table.vaccineName,
      table.recommendedAge,
    ),
    index("vaccine_schedule_age_range_idx").on(
      table.ageInDaysMin,
      table.ageInDaysMax,
    ),
  ],
);

export const adverseEvent = pgTable(
  "adverse_event",
  {
    id: text("id").primaryKey(),
    immunizationId: text("immunization_id"),
    patientId: text("patient_id").notNull(),
    vaccineName: text("vaccine_name").notNull(),
    eventType: text("event_type").notNull(),
    severity: severityEnum("severity").notNull(),
    description: text("description"),
    outcome: text("outcome"),
    treatment: text("treatment"),
    dateReported: timestamp("date_reported").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    reportedByStaffId: text("reported_by_staff_id"),
  },
  (table) => [
    index("adverse_event_patient_vaccine_idx").on(
      table.patientId,
      table.vaccineName,
    ),
    index("adverse_event_date_reported_idx").on(table.dateReported),
  ],
);

export const vaccineInventory = pgTable(
  "vaccine_inventory",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id"),
    vaccineName: text("vaccine_name").notNull(),
    quantity: integer("quantity").notNull(),
    lotNumber: text("lot_number"),
    expirationDate: timestamp("expiration_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("vaccine_inventory_clinic_vaccine_idx").on(
      table.clinicId,
      table.vaccineName,
    ),
    index("vaccine_inventory_expiration_idx").on(table.expirationDate),
  ],
);

export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
});
export const alert = pgTable("alert", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  action: jsonb("action").$type<{ label: string; href: string } | null>(),
});

export const aiReport = pgTable("ai_report", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").references(() => doctor.id, {
    onDelete: "set null",
  }),
  clinicId: text("clinic_id").references(() => clinic.id, {
    onDelete: "cascade",
  }),
  reportType: text("report_type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  generatedBy: text("generated_by")
    .notNull()
    .references(() => user.id),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const neonatalAssessment = pgTable(
  "neonatal_assessment",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinic.id, { onDelete: "cascade" }),
    weight: real("weight").notNull(),
    height: real("height").notNull(),
    vitals: jsonb("vitals").$type<{
      bodyTemperature: number;
      heartRate: number;
      respiratoryRate: number;
      oxygenSaturation: number;
    }>(),
    headCircumference: real("head_circumference").notNull(),
    apgarScore: integer("apgar_score").notNull(),
    feedingType: feedingTypeEnum("feeding_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("neonatal_assessment_patient_idx").on(table.patientId)],
);
