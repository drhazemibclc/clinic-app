import type {
  AppointmentStatus,
  DbAppointment,
  DbDevelopmentalCheck,
  DbDiagnosis,
  DbDoctor,
  DbFeedingLog,
  DbGrowthRecord,
  DbGuardian,
  DbImmunization,
  DbMedicalRecord,
  DbPatient,
  DbPayment,
  DbPrescription,
  DbService,
  DbStaff,
  DbVitalSign,
  Status,
} from "@clinic-app/db/schema";

export type {
  DbAppointment as Appointment,
  DbDevelopmentalCheck,
  DbDiagnosis,
  DbDoctor,
  DbFeedingLog,
  DbGrowthRecord,
  DbGuardian,
  DbImmunization,
  DbMedicalRecord,
  DbPatient,
  DbPayment,
  DbPrescription,
  DbService,
  DbStaff,
  DbVitalSign,
};

export interface FilterState {
  search: string;
  status?: AppointmentStatus | Status;
  dateRange?: { from: Date; to: Date };
  clinicId?: string;
  doctorId?: string;
  patientId?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface VitalStats {
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  bmi: number | null;
  weightForAgeZ: number | null;
  heightForAgeZ: number | null;
  bmiForAgeZ: number | null;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  bloodPressure: { systolic: number; diastolic: number } | null;
}

export interface GrowthChartData {
  ageMonths: number;
  weight: number;
  height: number;
  headCircumference: number;
  weightPercentile: number;
  heightPercentile: number;
  hcPercentile: number;
}

export interface ImmunizationRecord {
  id: string;
  vaccine: string;
  doseNumber: string;
  dateGiven: Date;
  nextDueDate: Date;
  administeredBy: string;
  notes?: string;
  isOverdue: boolean;
}
