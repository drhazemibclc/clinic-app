import type { RouterClient } from "@orpc/server";

import { o, protectedProcedure, publicProcedure } from "../index";
import { adminRouter } from "./admin.server";
import { analyticsRouter } from "./analytics";
import { appointmentRouter } from "./appointment.server";
import { authRouter } from "./auth.server";
import { calendarRouter } from "./calender.server";
import { clinicRouter } from "./clinic.server";
import {
  getDashboardStats,
  getDoctorPerformance,
  getPatientDemographics,
  getRecentAppointments,
  getRevenueOverview,
} from "./dashboard.server";
import { doctorRouter } from "./doctor.server";
import { encounterRouter } from "./encounter.server";
import { growthRouter } from "./growth.server";
import { healthRouter } from "./health.server";
import { immunizationRouter } from "./immunization.server";
import { labTestRouter } from "./labTest.server";
import { medicalRecordRouter } from "./medical-record.server";
import { notificationRouter } from "./notifications.server";
import { patientRouter } from "./patient.server";
import { paymentRouter } from "./payment";
import { prescriptionRouter } from "./prescription.server";
import { privateRouter } from "./private.server";
import { getService, listServices } from "./service.server";
import { usersRouter } from "./users.server";
import {
  createVitalSigns,
  deleteVitalSigns,
  getPatientHistory,
  getVitalSignsById,
  getVitalSignsTrend,
  listVitalSignsByPatient,
  updateVitalSigns,
} from "./vital-sign.server";

export const appRouter = o.router({
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context?.user,
    };
  }),
  health: healthRouter,
  private: privateRouter,
  auth: authRouter,
  admin: adminRouter,
  clinic: clinicRouter,
  users: usersRouter,
  appointments: appointmentRouter,
  patient: patientRouter,
  doctors: doctorRouter,
  encounters: encounterRouter,
  notifications: notificationRouter,
  prescriptions: prescriptionRouter,
  labTests: labTestRouter,
  dashboard: {
    getDashboardStats,
    getDoctorPerformance,
    getPatientDemographics,
    getRecentAppointments,
    getRevenueOverview,
  },
  calender: calendarRouter,
  payment: paymentRouter,
  growth: growthRouter,
  vitalSigns: {
    create: createVitalSigns,
    getPatientHistory,
    update: updateVitalSigns,
    get: getVitalSignsById,
    list: listVitalSignsByPatient,
    getTrend: getVitalSignsTrend,
    delete: deleteVitalSigns,
  },
  record: medicalRecordRouter,
  analytics: analyticsRouter,
  immunizations: immunizationRouter,

  services: {
    list: listServices,
    get: getService,
  },
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
const router = appRouter;
export default router;
