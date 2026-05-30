import {
  appointmentStatusEnum,
  feedingTypeEnum,
  roleEnum,
} from "@clinic-app/db/schema/clinic";
import {
  AppointmentCreateSchema,
  PatientSchema,
  ReminderCreateSchema,
  UserSchema,
} from "@clinic-app/db/zod/clinic.schema";
import z from "zod";

// Types for dashboard data
export interface AppointmentCount {
  status: string | null;
  count: number;
}

export interface AppointmentRecord {
  id: string;
  patient?: {
    firstName: string;
    lastName: string;
  } | null;
  doctor?: {
    name: string;
  } | null;
  appointmentDate: Date;
  status?: string | null;
  type?: string | null;
}

// Schema for admin dashboard stats response
export const AdminDashboardStatsSchema = z.object({
  availableDoctors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      specialty: z.string().nullable(),
      available: z.boolean(),
      nextAvailableTime: z.string().nullable(),
    }),
  ),
  last5Records: z.array(
    z.object({
      id: z.string(),
      patientName: z.string(),
      doctorName: z.string(),
      appointmentDate: z.date(),
      status: z.enum([
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
        "PENDING",
        "NO_SHOW",
        "CONFIRMED",
      ]),
      type: z.string().nullable(),
    }),
  ),
  appointmentCounts: z.object({
    SCHEDULED: z.number(),
    COMPLETED: z.number(),
    CANCELLED: z.number(),
    PENDING: z.number(),
    CONFIRMED: z.number(),
    NO_SHOW: z.number(),
  }),
  monthlyData: z.array(
    z.object({
      month: z.string(),
      appointments: z.number(),
    }),
  ),
  totalDoctors: z.number(),
  totalPatient: z.number(),
  totalAppointments: z.number(),
});

export const UserAuthSchema = UserSchema.omit({ role: true }).extend({
  role: z.enum(["admin", "doctor", "patient", "staff"]),
  password: z.string().min(6),
});

export const GetAppointmentsInRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  doctorId: z.string().optional(),
});

export const GetAppointmentsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  status: z.enum(appointmentStatusEnum.enumValues).optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
});

export const UpdateAppointmentStatusSchema = z.object({
  id: z.string(),
  status: z.enum(appointmentStatusEnum.enumValues),
});

export const CancelApstringpointmentSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
});

export const RescheduleAppointmentSchema = z.object({
  id: z.string(),
  newDate: z.date(),
  newTime: z.string(),
  reason: z.string().optional(),
});

export const BulkUpdateStatusSchema = z.object({
  appointmentIds: z.array(z.string()),
  status: z.enum(appointmentStatusEnum.enumValues),
  reason: z.string().optional(),
});

export const ListAppointmentsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  status: z.enum(appointmentStatusEnum.enumValues).optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  doctorSpecialty: z.string().optional(),
  type: z.string().optional(),
});

export const GetDoctorAvailabilitySchema = z.object({
  doctorId: z.string(),
  date: z.date(),
});

export const GetAvailableTimeSlotsSchema = z.object({
  doctorId: z.string(),
  date: z.date(),
  durationMinutes: z.number().min(15).max(120).default(30),
});

export const CreateAppointmentWithReminderSchema = z.object({
  data: AppointmentCreateSchema,
  reminderData: ReminderCreateSchema.optional(),
});
export const UpdateUserInputSchema = z.object({
  id: z.string(),
  email: z.email().optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  clinicId: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(roleEnum.enumValues).optional(),
});

export const CancelAppointmentSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
});

export const PatientWithRelationsSchema = PatientSchema.extend({
  appointments: z.array(z.any()).optional(),
  medicalRecords: z.array(z.any()).optional(),
  encounters: z.array(z.any()).optional(),
  immunizations: z.array(z.any()).optional(),
  vitalSigns: z.array(z.any()).optional(),
  prescriptions: z.array(z.any()).optional(),
  growthRecords: z.array(z.any()).optional(),
  payments: z.array(z.any()).optional(),
  guardians: z.array(z.any()).optional(),
});

export const NeonatalAssessmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  clinicId: z.string(),
  weight: z.number(),
  height: z.number(),
  vitals: z
    .object({
      bodyTemperature: z.number(),
      heartRate: z.number(),
      respiratoryRate: z.number(),
      oxygenSaturation: z.number(),
    })
    .nullable(),
  headCircumference: z.number(),
  apgarScore: z.number(),
  feedingType: z.enum(feedingTypeEnum.enumValues),
  createdAt: z.date(),
  updatedAt: z.date(),
});
