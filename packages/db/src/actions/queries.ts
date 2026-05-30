// queries.ts
import {
  and,
  between,
  count,
  eq,
  gte,
  ilike,
  like,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import { db } from ".."; // Your db instance
import * as schema from "../schema";
import {
  type AppointmentStatus,
  appointment,
  type Day,
  doctor,
  immunization,
  type LabTestStatus,
  type PaymentMethod,
  payment,
  prescription,
} from "../schema";

// ============================================
// SER & QUOTA QUERIES
// ============================================

export const userQueries = {
  // Get user with all related data
  async getUserWithAllRelations(userId: string) {
    return await db.query.user.findFirst({
      where: { id: userId },
      with: {
        folders: {
          where: { parentId: undefined }, // Get root folders only
        },
        clinicMemberships: {
          where: {
            userId,
          },
        },
        doctorProfile: true,
        staffProfile: true,
        patientProfile: {
          with: {
            appointments: {
              where: { isDeleted: false },
              orderBy: { appointmentDate: "desc" },
              limit: 5,
            },
          },
        },
        notifications: {
          where: { status: "unread" },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
  async getPatientsByAgeRange(
    clinicId: string,
    minAgeMonths: number,
    maxAgeMonths: number,
  ) {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - maxAgeMonths);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() - minAgeMonths);

    return await db.query.patient.findMany({
      where: {
        clinicId,
        isDeleted: false,
        dateOfBirth: {
          gte: minDate,
          lte: maxDate,
        },
      },
      with: {
        user: true,
        guardians: true,
        appointments: {
          where: { status: "COMPLETED" },
          limit: 1,
        },
      },
      orderBy: { dateOfBirth: "desc" },
    });
  },
  async getPatientsWithAppointmentsThisWeek(clinicId: string) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return await db.query.appointment.findMany({
      where: {
        clinicId,
        isDeleted: false,
        status: "CONFIRMED",
        appointmentDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      with: {
        patient: {
          with: {
            guardians: true,
          },
        },
        doctor: true,
      },
      orderBy: { appointmentDate: "asc" },
    });
  },
  async getPatientGrowthPercentiles(patientId: string, clinicId: string) {
    const patient = await db.query.patient.findFirst({
      where: { id: patientId, clinicId, isDeleted: false },
      with: {
        growthRecords: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!patient?.growthRecords.length) {
      return null;
    }

    const whoStandards = await db.query.whoGrowthStandard.findMany({
      where: {
        gender: patient.gender as "MALE" | "FEMALE",
        measurementType: "BMI",
      },
    });

    // Calculate percentiles for each growth record
    const growthWithPercentiles = patient.growthRecords.map((record) => {
      const standard = whoStandards.find(
        (s) => Math.abs(s.ageDays - (record.ageDays ?? 0)) <= 30,
      );

      let percentile = null;
      if (standard && record.bmi) {
        // Simple percentile calculation (simplified)
        if (record.bmi <= standard.sd3neg) percentile = 1;
        else if (record.bmi <= standard.sd2neg) percentile = 2;
        else if (record.bmi <= standard.sd1neg) percentile = 5;
        else if (record.bmi >= standard.sd3pos) percentile = 99;
        else if (record.bmi >= standard.sd2pos) percentile = 97;
        else if (record.bmi >= standard.sd1pos) percentile = 85;
        else percentile = 50;
      }

      return { ...record, percentile };
    });

    return growthWithPercentiles;
  },
  // Update user quota
  async updateUserQuota(
    userId: string,
    data: Partial<typeof schema.userQuota.$inferInsert>,
  ) {
    return await db
      .update(schema.userQuota)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.userQuota.userId, userId))
      .returning();
  },
};

// ============================================
// CLINIC QUERIES
// ============================================

export const clinicQueries = {
  // Get clinic dashboard data
  async getClinicDashboard(clinicId: string) {
    const [clinic, stats, recentAppointments, topDoctors] = await Promise.all([
      db.query.clinic.findFirst({
        where: { id: clinicId, isDeleted: false },
        // with: {
        // 	setting: true,
        // 	members: {
        // 		with: {
        // 			user: true
        // 		}
        // 	}
        // }
      }),

      // Get clinic statistics
      db.transaction(async (tx) => {
        const [doctorCount, patientCount, appointmentCount, revenue] =
          await Promise.all([
            tx
              .select({ count: sql<number>`count(*)` })
              .from(schema.doctor)
              .where(
                and(
                  eq(schema.doctor.clinicId, clinicId),
                  eq(schema.doctor.isDeleted, false),
                ),
              ),

            tx
              .select({ count: sql<number>`count(*)` })
              .from(schema.patient)
              .where(
                and(
                  eq(schema.patient.clinicId, clinicId),
                  eq(schema.patient.isDeleted, false),
                ),
              ),

            tx
              .select({ count: sql<number>`count(*)` })
              .from(schema.appointment)
              .where(
                and(
                  eq(schema.appointment.clinicId, clinicId),
                  eq(schema.appointment.isDeleted, false),
                ),
              ),

            tx
              .select({ total: sql<number>`sum(${schema.payment.amount})` })
              .from(schema.payment)
              .where(
                and(
                  eq(schema.payment.clinicId, clinicId),
                  eq(schema.payment.status, "PAID"),
                ),
              ),
          ]);

        return {
          doctors: doctorCount[0]?.count ?? 0,
          patients: patientCount[0]?.count ?? 0,
          appointments: appointmentCount[0]?.count ?? 0,
          revenue: revenue[0]?.total ?? 0,
        };
      }),

      // Recent appointments
      db.query.appointment.findMany({
        where: { clinicId, isDeleted: false },
        with: {
          patient: true,
          doctor: true,
        },
        orderBy: { appointmentDate: "desc" },
        limit: 10,
      }),

      // Top doctors by appointment count
      db.query.doctor.findMany({
        where: { clinicId, isDeleted: false },
        with: {
          appointments: {
            where: { isDeleted: false },
          },
        },
        limit: 5,
      }),
    ]);

    return { clinic, stats, recentAppointments, topDoctors };
  },

  // Get clinic with all related data
  async getFullClinic(clinicId: string) {
    return await db.query.clinic.findFirst({
      where: { id: clinicId, isDeleted: false },
      // Relations for 'clinics' are currently commented out in relations.ts
      // with: {
      // 	setting: true
      // }
    });
  },
};

export async function getTimeLeftForAppointment(
  appointmentId: string,
): Promise<string> {
  const record = await db.query.appointment.findFirst({
    with: {
      patient: true,
      doctor: true,
      clinic: true,
      service: true,
    },
    where: { id: appointmentId },
  });

  if (!record?.appointmentDate) {
    return "Appointment not found or date missing";
  }

  const now = new Date();
  const appointmentTime = new Date(record.appointmentDate);

  const diffMs = appointmentTime.getTime() - now.getTime();
  if (diffMs < 0) return "Appointment has already passed";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours} hours and ${mins} minutes remaining`;
  }
  return `${mins} minutes remaining`;
}

// ============================================
// DOCTOR QUERIES
// ============================================

export const doctorQueries = {
  // Get doctor availability
  async getDoctorAvailability(doctorId: string, date: Date) {
    const [workingDays, appointments] = await Promise.all([
      db.query.workingDay.findMany({
        where: { doctorId },
      }),

      db.query.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999)),
          },
          isDeleted: false,
        },
      }),
    ]);

    return { workingDays, appointments };
  },

  // Get doctor with patients and appointments
  async getDoctorWithSchedule(doctorId: string, clinicId?: string) {
    return await db.query.doctor.findFirst({
      where: { id: doctorId, ...(clinicId ? { clinicId } : {}) },
      with: {
        user: true,
        clinic: true,
        workingDays: true,
        appointments: {
          where: { isDeleted: false, appointmentDate: { gte: new Date() } },
          with: {
            patient: true,
            service: true,
          },
          orderBy: { appointmentDate: "asc" },
        },
        medicalRecords: {
          with: {
            patient: true,
            encounters: true,
          },
          orderBy: { createdAt: "desc" },
          limit: 20,
        },
        prescriptions: {
          where: { status: "active" },
          with: {
            patient: true,
            prescribedItems: {
              with: {
                drug: true,
              },
            },
          },
          orderBy: { issuedDate: "desc" },
        },
      },
    });
  },
  async getDoctorPerformance(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    clinicId?: string,
  ) {
    const [appointments, ratings, prescriptions] = await Promise.all([
      db.query.appointment.findMany({
        where: {
          doctorId,
          isDeleted: false,
          clinicId,
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      db.query.rating.findMany({
        where: {
          staffId: doctorId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      db.query.prescription.findMany({
        where: {
          doctorId,
          issuedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const completedAppointments = appointments.filter(
      (a) => a.status === "COMPLETED",
    );
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "CANCELLED",
    );
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratings.length
        : 0;

    return {
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      completionRate:
        appointments.length > 0
          ? (completedAppointments.length / appointments.length) * 100
          : 0,
      totalPrescriptions: prescriptions.length,
      averageRating,
      totalRevenue: completedAppointments.reduce(
        (sum, a) => sum + (a.appointmentPrice ?? 0),
        0,
      ),
    };
  },
  async getAvailableTimeSlots(
    doctorId: string,
    date: Date,
    durationMinutes = 30,
  ) {
    const workingDay = await db.query.workingDay.findFirst({
      where: {
        doctorId: doctorId,
        day: date
          .toLocaleDateString("en-US", { weekday: "long" })
          .toUpperCase() as Day,
      },
    });

    if (!workingDay) {
      return [];
    }

    const appointments = await db.query.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        isDeleted: false,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    });

    // Generate time slots
    const startHour = Number.parseInt(
      workingDay.startTime.split(":")[0] ?? "",
      10,
    );
    const startMinute = Number.parseInt(
      workingDay.startTime.split(":")[1] ?? "",
      10,
    );
    const endHour = Number.parseInt(workingDay.endTime.split(":")[0] ?? "", 10);
    const endMinute = Number.parseInt(
      workingDay.endTime.split(":")[1] ?? "",
      10,
    );

    const slots = [];
    const currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check if slot is available
      const isBooked = appointments.some((apt) => {
        const aptTime = new Date(apt.appointmentDate);
        return (
          aptTime.getHours() === currentTime.getHours() &&
          aptTime.getMinutes() === currentTime.getMinutes()
        );
      });

      if (!isBooked) {
        slots.push({
          startTime: currentTime.toLocaleTimeString(),
          endTime: slotEnd.toLocaleTimeString(),
          available: true,
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
    }

    return slots;
  },
  // Update doctor schedule
  async updateDoctorSchedule(
    doctorId: string,
    workingDays: (typeof schema.workingDay.$inferInsert)[],
  ) {
    // Delete existing working days and insert new ones
    await db.transaction(async (tx) => {
      await tx
        .delete(schema.workingDay)
        .where(eq(schema.workingDay.doctorId, doctorId));

      for (const day of workingDays) {
        await tx.insert(schema.workingDay).values({
          ...day,
          doctorId,
          id: crypto.randomUUID(),
        });
      }
    });
  },
};

// ============================================
// PATIENT QUERIES
// ============================================

export const patientQueries = {
  async listPatients(params: {
    clinicId: string;
    page: number;
    limit: number;
    offset?: number;
    search?: string;
    status?: schema.Status;
    isActive?: boolean;
    gender?: schema.Gender;
    bloodGroup?: schema.BloodGroup;
  }) {
    const {
      clinicId,
      page,
      limit,
      search,
      status,
      isActive,
      gender,
      bloodGroup,
      offset: manualOffset,
    } = params;

    const rqbWhere: Record<string, unknown> = {
      clinicId,
      isDeleted: false,
      ...(status && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(gender && { gender }),
      ...(bloodGroup && { bloodGroup }),
      ...(search && {
        OR: [
          { firstName: { ilike: `%${search}%` } },
          { lastName: { ilike: `%${search}%` } },
          { email: { ilike: `%${search}%` } },
          { phone: { ilike: `%${search}%` } },
        ],
      }),
    };

    const [patientsList, total] = await Promise.all([
      db.query.patient.findMany({
        where: rqbWhere,
        with: { user: true },
        limit,
        offset: manualOffset ?? (page - 1) * limit,
        orderBy: { lastName: "asc" },
      }),
      db.$count(
        schema.patient,
        and(
          eq(schema.patient.clinicId, clinicId),
          eq(schema.patient.isDeleted, false),
          status ? eq(schema.patient.status, status) : undefined,
          isActive !== undefined
            ? eq(schema.patient.isActive, isActive)
            : undefined,
          gender ? eq(schema.patient.gender, gender) : undefined,
          bloodGroup ? eq(schema.patient.bloodGroup, bloodGroup) : undefined,
          search
            ? or(
                ilike(schema.patient.firstName, `%${search}%`),
                ilike(schema.patient.lastName, `%${search}%`),
                ilike(schema.patient.email, `%${search}%`),
                ilike(schema.patient.phone, `%${search}%`),
              )
            : undefined,
        ),
      ),
    ]);

    return {
      patients: patientsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
  async getPatientStats(patientId: string) {
    // Get appointment stats
    const [appointmentStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${appointment.status} = 'COMPLETED' then 1 else 0 end)`,
        cancelled: sql<number>`sum(case when ${appointment.status} = 'CANCELLED' then 1 else 0 end)`,
        lastVisit: sql<Date>`max(case when ${appointment.status} = 'COMPLETED' then ${appointment.appointmentDate} else null end)`,
        nextAppointment: sql<Date>`min(case when ${appointment.appointmentDate} > now() and ${appointment.status} not in ('CANCELLED', 'COMPLETED') then ${appointment.appointmentDate} else null end)`,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.patientId, patientId),
          eq(appointment.isDeleted, false),
        ),
      );

    // Get payment stats
    const [paymentStats] = await db
      .select({
        total: sql<number>`count(*)`,
        paidAmount: sql<number>`coalesce(sum(${payment.amountPaid}), 0)`,
        totalAmount: sql<number>`coalesce(sum(${payment.totalAmount}), 0)`,
      })
      .from(payment)
      .where(
        and(eq(payment.patientId, patientId), eq(payment.isDeleted, false)),
      );

    // Get prescription stats
    const [prescriptionStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${prescription.status} = 'active' then 1 else 0 end)`,
      })
      .from(prescription)
      .where(eq(prescription.patientId, patientId));

    // Get immunization count
    const [immunizationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(immunization)
      .where(
        and(
          eq(immunization.patientId, patientId),
          eq(immunization.isDeleted, false),
        ),
      );

    return {
      totalAppointments: Number(appointmentStats?.total ?? 0),
      completedAppointments: Number(appointmentStats?.completed ?? 0),
      cancelledAppointments: Number(appointmentStats?.cancelled ?? 0),
      totalPayments: Number(paymentStats?.total ?? 0),
      paidAmount: Number(paymentStats?.paidAmount ?? 0),
      dueAmount:
        Number(paymentStats?.totalAmount ?? 0) -
        Number(paymentStats?.paidAmount ?? 0),
      totalPrescriptions: Number(prescriptionStats?.total ?? 0),
      activePrescriptions: Number(prescriptionStats?.active ?? 0),
      totalImmunizations: Number(immunizationCount?.count ?? 0),
      lastVisit: appointmentStats?.lastVisit ?? null,
      nextAppointment: appointmentStats?.nextAppointment ?? null,
    };
  },
  async getNeonatalAssessment(patientId: string, clinicId: string) {
    return db.query.neonatalAssessment.findFirst({
      where: { patientId, clinicId },
    });
  },
  async getAppointmentStats(clinicId: string) {
    const appointmentStats = await db.$count(
      schema.appointment,
      and(
        eq(schema.appointment.clinicId, clinicId),
        eq(schema.appointment.isDeleted, false),
      ),
    );

    const [detailedStats] = await db
      .select({
        completed: sql<number>`sum(case when ${appointment.status} = 'COMPLETED' then 1 else 0 end)`,
        cancelled: sql<number>`sum(case when ${appointment.status} = 'CANCELLED' then 1 else 0 end)`,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.clinicId, clinicId),
          eq(appointment.isDeleted, false),
        ),
      );

    return {
      totalAppointments: appointmentStats,
      completedAppointments: detailedStats?.completed ?? 0,
      cancelledAppointments: detailedStats?.cancelled ?? 0,
    };
  },
  async getPrescriptionStats(clinicId: string) {
    const prescriptionStats = await db.$count(
      schema.prescription,
      and(eq(schema.prescription.clinicId, clinicId)),
    );

    const [detailedStats] = await db
      .select({
        active: sql<number>`sum(case when ${schema.prescription.status} = 'ACTIVE' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${schema.prescription.status} = 'COMPLETED' then 1 else 0 end)`,
        cancelled: sql<number>`sum(case when ${schema.prescription.status} = 'CANCELLED' then 1 else 0 end)`,
      })
      .from(schema.prescription)
      .where(eq(schema.prescription.clinicId, clinicId));

    return {
      totalPrescriptions: prescriptionStats,
      activePrescriptions: detailedStats?.active ?? 0,
      completedPrescriptions: detailedStats?.completed ?? 0,
      cancelledPrescriptions: detailedStats?.cancelled ?? 0,
    };
    // Get prescription stats
  },

  async getPatientsByClinic(clinicId: string) {
    return await db.query.patient.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      with: { user: true },
      orderBy: { lastName: "asc" },
    });
  },
  async getPatientById(patientId: string, clinicId: string) {
    return await db.query.patient.findFirst({
      where: { id: patientId, clinicId },
    });
  },
  async getPatientGrowthPercentiles(patientId: string, clinicId: string) {
    const patient = await db.query.patient.findFirst({
      where: { id: patientId, clinicId },
      with: {
        growthRecords: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!patient?.growthRecords.length) {
      return null;
    }

    const whoStandards = await db.query.whoGrowthStandard.findMany({
      where: {
        gender: patient.gender as "MALE" | "FEMALE",
        measurementType: "BMI",
      },
    });

    // Calculate percentiles for each growth record
    const growthWithPercentiles = patient.growthRecords.map((record) => {
      const standard = whoStandards.find(
        (s) => Math.abs(s.ageDays - (record.ageDays ?? 0)) <= 30,
      );

      let percentile = null;
      if (standard && record.bmi) {
        const bmi = Number(record.bmi);
        // Simple percentile calculation based on WHO SD values
        if (bmi <= standard.sd3neg) percentile = 1;
        else if (bmi <= standard.sd2neg) percentile = 2;
        else if (bmi <= standard.sd1neg) percentile = 5;
        else if (bmi >= standard.sd3pos) percentile = 99;
        else if (bmi >= standard.sd2pos) percentile = 97;
        else if (bmi >= standard.sd1pos) percentile = 85;
        else percentile = 50;
      }

      return { ...record, percentile };
    });

    return growthWithPercentiles;
  },

  // Get patient full medical history
  async getPatientFullHistory(patientId: string, clinicId: string) {
    return await db.query.patient.findFirst({
      where: { id: patientId, clinicId, isDeleted: false },
      with: {
        user: true,
        clinic: true,
        guardians: {
          with: {
            user: true,
          },
        },
        appointments: {
          where: { isDeleted: false },
          with: {
            doctor: true,
            service: true,
          },
          orderBy: { appointmentDate: "desc" },
        },
        medicalRecords: {
          with: {
            doctor: true,
            appointment: true,
            encounters: true,
            vitalSigns: true,
            prescriptions: {
              with: {
                prescribedItems: {
                  with: {
                    drug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        encounters: {
          with: {
            doctor: true,
          },
          orderBy: { date: "desc" },
        },
        vitalSigns: {
          orderBy: { recordedAt: "desc" },
          limit: 10,
        },
        growthRecords: {
          orderBy: { date: "desc" },
        },
        immunizations: {
          with: {
            administeredBy: true,
          },
          orderBy: { date: "desc" },
        },
        labTests: {
          with: {
            service: true,
          },
          orderBy: { testDate: "desc" },
        },
        prescriptions: {
          with: {
            doctor: true,
            prescribedItems: {
              with: {
                drug: true,
              },
            },
          },
          orderBy: { issuedDate: "desc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        feedingLogs: {
          orderBy: { date: "desc" },
        },
        developmentalChecks: {
          orderBy: { checkDate: "desc" },
        },
      },
    });
  },

  // Get upcoming appointments for patient
  async getPatientUpcomingAppointments(patientId: string, clinicId: string) {
    return await db.query.appointment.findMany({
      where: {
        patientId,
        clinicId,
        isDeleted: false,
        appointmentDate: { gte: new Date() },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      with: {
        doctor: true,
        service: true,
        clinic: true,
      },
      orderBy: { appointmentDate: "asc" },
    });
  },

  // Get patient growth chart data
  async getPatientGrowthData(patientId: string, clinicId: string) {
    const growthRecords = await db.query.growthRecord.findMany({
      where: { patientId, clinicId },
      orderBy: { date: "asc" },
    });

    // Get WHO standards for comparison
    const whoStandards = await db.query.whoGrowthStandard.findMany();

    return { growthRecords, whoStandards };
  },
};

// ============================================
// APPOINTMENT QUERIES
// ============================================

export const appointmentQueries = {
  async getAppointmentCountsByStatus(clinicId: string) {
    const results = await db
      .select({
        status: schema.appointment.status,
        count: count(),
      })
      .from(schema.appointment)
      .where(
        and(
          eq(schema.appointment.clinicId, clinicId),
          eq(schema.appointment.isDeleted, false),
        ),
      )
      .groupBy(schema.appointment.status);

    return results.reduce(
      (acc, curr) => {
        if (curr.status) acc[curr.status] = Number(curr.count);
        return acc;
      },
      {} as Record<string, number>,
    );
  },

  async getMonthlyAppointmentData(clinicId: string, year: number) {
    return await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${schema.appointment.appointmentDate})`,
        count: count(),
      })
      .from(schema.appointment)
      .where(
        and(
          eq(schema.appointment.clinicId, clinicId),
          eq(schema.appointment.isDeleted, false),
          sql`EXTRACT(YEAR FROM ${schema.appointment.appointmentDate}) = ${year}`,
        ),
      )
      .groupBy(sql`EXTRACT(MONTH FROM ${schema.appointment.appointmentDate})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${schema.appointment.appointmentDate})`);
  },

  async getAppointmentById(appointmentId: string, clinicId: string) {
    return await db.query.appointment.findFirst({
      where: { id: appointmentId, clinicId, isDeleted: false },
      with: {
        patient: true,
        doctor: true,
        service: true,
        clinic: true,
      },
    });
  },

  async getAppointmentsFallback(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    doctorId?: string,
  ) {
    return await db.query.appointment.findMany({
      where: {
        clinicId,
        isDeleted: false,
        appointmentDate: { gte: startDate, lte: endDate },
        ...(doctorId && { doctorId }),
      },
      with: { patient: true, doctor: true },
      orderBy: { appointmentDate: "asc" },
    });
  },
  async validateAppointment(appointmentId: string) {
    return await db.query.appointment.findFirst({
      where: {
        id: appointmentId,
        isDeleted: false,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    });
  },
  async getAppointmentsInRange(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    doctorId?: string,
  ) {
    return await db.query.appointment.findMany({
      where: {
        clinicId,
        isDeleted: false,
        appointmentDate: { gte: startDate, lte: endDate },
        ...(doctorId && { doctorId }),
      },
      with: {
        patient: {
          with: {
            user: true,
          },
        },
        doctor: true,
      },
      orderBy: { appointmentDate: "asc" },
    });
  },

  async cancelAppointment(
    appointmentId: string,
    clinicId: string,
    reason: string,
  ) {
    return await db.transaction(async (tx) => {
      const [appointment] = await tx
        .update(schema.appointment)
        .set({
          status: "CANCELLED",
          note: reason,
          updatedAt: new Date(),
        })
        .where(eq(schema.appointment.id, appointmentId))
        .returning();

      // Create notification
      if (appointment) {
        await tx.insert(schema.notification).values({
          id: crypto.randomUUID(),
          userId: appointment.patientId,
          clinicId,
          title: "Appointment Cancelled",
          body: `Your appointment has been cancelled. Reason: ${reason}`,
          type: "appointment_cancelled",
          priority: "high",
        });
      }

      return appointment;
    });
  },

  async createAppointment(data: typeof schema.appointment.$inferInsert) {
    return await db.transaction(async (tx) => {
      const existingAppointment = await tx.query.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          time: data.time ?? "",
          isDeleted: false,
          // v2 uses operator keys like 'notIn' within the object
          status: {
            notIn: ["CANCELLED", "COMPLETED"],
          },
        },
      });

      if (existingAppointment) {
        throw new Error("Time slot already booked");
      }

      const [appointment] = await tx
        .insert(schema.appointment)
        .values({
          ...data,
          id: data.id ?? crypto.randomUUID(),
        })
        .returning();

      return appointment;
    });
  },
  async getAllAppointments(clinicId: string) {
    return await db.query.appointment.findMany({
      where: { clinicId },
      with: { patient: true, doctor: true },
      orderBy: { appointmentDate: "asc" },
    });
  },
  async getAppointmentsFallbackPaginated(
    clinicId: string,
    page: number,
    limit: number,
    status?: AppointmentStatus,
    doctorId?: string,
    patientId?: string,
  ) {
    const result = await queries.search.advancedSearch({
      clinicId,
      status: status ?? "COMPLETED",
    });

    const appointments = result.filter(
      (apt) =>
        (!doctorId || apt.doctorId === doctorId) &&
        (!patientId || apt.patientId === patientId),
    );

    const paginated = appointments.slice((page - 1) * limit, page * limit);

    return {
      appointments: paginated,
      total: appointments.length,
    };
  },
  async getAppointmentsWithFilters(
    clinicId: string,
    page: number,
    limit: number,
    filters: {
      search?: string;
      status?: AppointmentStatus;
      fromDate?: Date;
      toDate?: Date;
      patientId?: string;
      doctorId?: string;
      doctorSpecialty?: string;
      type?: string;
    },
  ) {
    // ==========================================
    // 1. Drizzle RQB v2 Object-Style Where Clause
    // ==========================================
    const rqbConditions: Record<string, unknown>[] = [
      { clinicId: clinicId },
      { isDeleted: false },
    ];

    if (filters.status) rqbConditions.push({ status: filters.status });
    if (filters.type) rqbConditions.push({ type: filters.type });
    if (filters.patientId) rqbConditions.push({ patientId: filters.patientId });
    if (filters.doctorId) rqbConditions.push({ doctorId: filters.doctorId });
    if (filters.fromDate)
      rqbConditions.push({ appointmentDate: { gte: filters.fromDate } });
    if (filters.toDate)
      rqbConditions.push({ appointmentDate: { lte: filters.toDate } });

    if (filters.search) {
      rqbConditions.push({
        OR: [
          { reason: { ilike: `%${filters.search}%` } },
          { type: { ilike: `%${filters.search}%` } },
        ],
      });
    }

    if (filters.doctorSpecialty) {
      // RQB v2 allows filtering through the relation property name defined in your schema
      rqbConditions.push({
        doctor: {
          specialty: filters.doctorSpecialty,
        },
      });
    }

    // Execute Relational Query using v2 Object Syntax
    const appointments = await db.query.appointment.findMany({
      where: { AND: rqbConditions }, // Passes conditions cleanly as a v2 Object
      limit,
      offset: (page - 1) * limit,
      orderBy: { appointmentDate: "desc" },
      with: { patient: true, doctor: true },
    });

    // ==========================================
    // 2. Standard SQL Core API Where Clause (For Count)
    // ==========================================
    const coreConditions: SQL[] = [
      eq(appointment.clinicId, clinicId),
      eq(appointment.isDeleted, false),
    ];

    if (filters.status)
      coreConditions.push(eq(appointment.status, filters.status));
    if (filters.type) coreConditions.push(eq(appointment.type, filters.type));
    if (filters.patientId)
      coreConditions.push(eq(appointment.patientId, filters.patientId));
    if (filters.doctorId)
      coreConditions.push(eq(appointment.doctorId, filters.doctorId));
    if (filters.fromDate)
      coreConditions.push(gte(appointment.appointmentDate, filters.fromDate));
    if (filters.toDate)
      coreConditions.push(lte(appointment.appointmentDate, filters.toDate));

    if (filters.search) {
      coreConditions.push(
        or(
          ilike(appointment.reason, `%${filters.search}%`),
          ilike(appointment.type, `%${filters.search}%`),
        ) as SQL,
      );
    }

    // Dynamic builder to include join if filtering by doctor attributes in core SQL
    let countQuery = db.select({ value: count() }).from(appointment).$dynamic();

    if (filters.doctorSpecialty) {
      countQuery = countQuery.leftJoin(
        doctor,
        eq(appointment.doctorId, doctor.id),
      );
      coreConditions.push(eq(doctor.specialty, filters.doctorSpecialty));
    }

    const [totalResult] = await countQuery.where(and(...coreConditions));

    return {
      appointments,
      total: totalResult?.value ?? 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult?.value ?? 0) / limit),
    };
  },
  async getAppointmentByIdFallback(id: string, clinicId: string) {
    return await db.query.appointment.findFirst({
      where: {
        id,
        clinicId,
        isDeleted: false,
      },
      with: { patient: true, doctor: true },
    });
  },
};

// ============================================
// MEDICAL RECORD QUERIES
// ============================================

export const medicalRecordQueries = {
  async count(clinicId: string, patientId?: string, doctorId?: string) {
    return await db.$count(
      schema.medicalRecord,
      and(
        eq(schema.medicalRecord.clinicId, clinicId),
        patientId ? eq(schema.medicalRecord.patientId, patientId) : undefined,
        doctorId ? eq(schema.medicalRecord.doctorId, doctorId) : undefined,
        eq(schema.medicalRecord.isDeleted, false),
      ),
    );
  },
  // Create complete medical record with all related data
  async list(
    patientId: string | undefined,
    doctorId: string | undefined,
    clinicId: string,
    limit = 50,
    offset = 0,
  ) {
    const rqbWhere: Record<string, unknown> = {
      clinicId,
      isDeleted: false,
    };

    if (patientId) rqbWhere.patientId = patientId;
    if (doctorId) rqbWhere.doctorId = doctorId;

    return await db.query.medicalRecord.findMany({
      where: rqbWhere,
      with: {
        patient: true,
        doctor: true,
        appointment: true,
        encounters: true,
        vitalSigns: true,
        prescriptions: true,
      },
      orderBy: { createdAt: "desc" },
      limit,
      offset,
    });
  },
  async getById(recordId: string, clinicId: string) {
    return await db.query.medicalRecord.findFirst({
      where: {
        id: recordId,
        clinicId,
        isDeleted: false,
      },
      with: {
        patient: true,
        doctor: true,
        appointment: true,
        encounters: true,
        vitalSigns: true,
        prescriptions: {
          with: {
            prescribedItems: {
              with: {
                drug: true,
              },
            },
          },
        },
      },
    });
  },
  async getPatientMedicalRecords(
    patientId: string,
    clinicId: string,
    limit = 50,
    offset = 0,
  ) {
    return await db.query.medicalRecord.findMany({
      where: {
        patientId,
        clinicId,
        isDeleted: false,
      },
      with: {
        doctor: true,
        appointment: true,
        encounters: true,
        vitalSigns: true,
        prescriptions: {
          with: {
            prescribedItems: {
              with: {
                drug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      limit,
      offset,
    });
  },
};

// ============================================
// INVENTORY & PRESCRIPTION QUERIES
// ============================================

export const inventoryQueries = {
  // Check drug stock and create alert if low
  async checkDrugStock(clinicId: string, threshold = 10) {
    const lowStockDrugs = await db.query.drug.findMany({
      where: {
        quantityInStock: { lt: threshold },
      },
    });

    for (const drug of lowStockDrugs) {
      await db.insert(schema.notification).values({
        id: crypto.randomUUID(),
        userId: "admin", // Should be clinic admin
        clinicId,
        title: "Low Stock Alert",
        body: `${drug.name} is running low. Only ${drug.quantityInStock} units remaining.`,
        type: "low_stock",
        priority: "high",
      });
    }

    return lowStockDrugs;
  },

  // Dispense medication
  async dispenseMedication(data: {
    prescribedItemId: string;
    prescriptionId: string;
    quantityDispensed: number;
    dispensedBy: string;
    notes?: string;
  }) {
    return await db.transaction(async (tx) => {
      // Get prescribed item
      const prescribedItem = await tx.query.prescribedItem.findFirst({
        where: { id: data.prescribedItemId },
        with: { drug: true },
      });

      if (!prescribedItem) {
        throw new Error("Prescribed item not found");
      }

      // Check stock
      if (
        !prescribedItem.drug ||
        (prescribedItem.drug.quantityInStock ?? 0) < data.quantityDispensed
      ) {
        throw new Error("Insufficient stock");
      }

      // Create dispense record
      const [dispense] = await tx
        .insert(schema.medicationDispense)
        .values({
          id: crypto.randomUUID(),
          ...data,
          dispensedAt: new Date(),
        })
        .returning();

      // Update drug stock
      await tx
        .update(schema.drug)
        .set({
          quantityInStock:
            (prescribedItem.drug.quantityInStock ?? 0) - data.quantityDispensed,
          updatedAt: new Date(),
        })
        .where(eq(schema.drug.id, prescribedItem.drugId));

      // Update prescribed item refills
      await tx
        .update(schema.prescribedItem)
        .set({
          refillsRemaining: (prescribedItem.refillsRemaining ?? 0) - 1,
          lastRefillDate: new Date(),
          quantityDispensedTotal:
            (prescribedItem.quantityDispensedTotal ?? 0) +
            data.quantityDispensed,
        })
        .where(eq(schema.prescribedItem.id, data.prescribedItemId));

      // Create prescription log
      await tx.insert(schema.prescriptionLog).values({
        id: crypto.randomUUID(),
        prescriptionId: data.prescriptionId,
        action: "DISPENSED",
        performedBy: data.dispensedBy,
        details: `Dispensed ${data.quantityDispensed} units of ${prescribedItem.drug.name}`,
        createdAt: new Date(),
      });

      return dispense;
    });
  },
};

// ============================================
// BILLING & PAYMENT QUERIES
// ============================================

export const billingQueries = {
  // Create bill for appointment
  async createBillForAppointment(appointmentId: string) {
    return await db.transaction(async (tx) => {
      const appointment = await tx.query.appointment.findFirst({
        where: { id: appointmentId },
        with: {
          patient: true,
          doctor: true,
          service: true,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Calculate total amount
      let totalAmount = appointment.appointmentPrice ?? 0;
      if (appointment.service) {
        totalAmount += appointment.service.price || 0;
      }

      // Create payment record
      const [payment] = await tx
        .insert(schema.payment)
        .values({
          id: crypto.randomUUID(),
          clinicId: appointment.clinicId,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          billDate: new Date(),
          totalAmount,
          amount: totalAmount,
          status: "PENDING",
          receiptNumber: Math.floor(Math.random() * 1_000_000),
        })
        .returning();

      return payment;
    });
  },

  // Process payment
  async processPayment(
    paymentId: string,
    amountPaid: number,
    paymentMethod: string,
    notes?: string,
  ) {
    return await db.transaction(async (tx) => {
      const payment = await tx.query.payment.findFirst({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      const [updatedPayment] = await tx
        .update(schema.payment)
        .set({
          amountPaid,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentDate: new Date(),
          paidDate: new Date(),
          status: amountPaid >= (payment.totalAmount ?? 0) ? "PAID" : "PARTIAL",
          notes,
          updatedAt: new Date(),
        })
        .where(eq(schema.payment.id, paymentId))
        .returning();

      return updatedPayment;
    });
  },
};

// ============================================
// NOTIFICATION QUERIES
// ============================================

export const notificationQueries = {
  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    clinicId?: string,
    limit = 5,
    offset = 0,
  ) {
    return await db.query.notification.findMany({
      where: {
        userId,
        ...(clinicId && { clinicId }),
      },
      orderBy: { createdAt: "desc" },
      limit,
      offset,
    });
  },

  // List notifications with filters and counts
  async listNotifications(params: {
    userId: string;
    clinicId?: string;
    status?: "all" | "read" | "unread";
    type?: string | null;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const { userId, clinicId, status, type, search, limit, offset } = params;
    const rqbWhere = {
      userId,
      ...(clinicId && { clinicId }),
      ...(status === "unread" && { status: "unread" as const }),
      ...(status === "read" && { status: "read" as const }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { body: { ilike: `%${search}%` } },
          { title: { ilike: `%${search}%` } },
        ],
      }),
    };

    const [items, totalResult, unreadResult] = await Promise.all([
      db.query.notification.findMany({
        where: rqbWhere,
        orderBy: { createdAt: "desc" },
        limit,
        offset,
      }),
      db.$count(
        schema.notification,
        and(
          eq(schema.notification.userId, userId),
          clinicId ? eq(schema.notification.clinicId, clinicId) : undefined,
          status === "unread"
            ? eq(schema.notification.status, "unread")
            : undefined,
          status === "read"
            ? eq(schema.notification.status, "read")
            : undefined,
          type ? eq(schema.notification.type, type) : undefined,
          search
            ? or(
                ilike(schema.notification.body, `%${search}%`),
                ilike(schema.notification.title, `%${search}%`),
              )
            : undefined,
        ),
      ),
      db.$count(
        schema.notification,
        and(
          eq(schema.notification.userId, userId),
          clinicId ? eq(schema.notification.clinicId, clinicId) : undefined,
          eq(schema.notification.status, "unread"),
        ),
      ),
    ]);

    return {
      items,
      total: totalResult,
      unreadCount: unreadResult,
    };
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId?: string) {
    const condition = userId
      ? and(
          eq(schema.notification.id, notificationId),
          eq(schema.notification.userId, userId),
        )
      : eq(schema.notification.id, notificationId);

    return await db
      .update(schema.notification)
      .set({ status: "read", updatedAt: new Date() })
      .where(condition)
      .returning();
  },

  // Mark all as read
  async markAllAsRead(userId: string, clinicId?: string) {
    return await db
      .update(schema.notification)
      .set({ status: "read", updatedAt: new Date() })
      .where(
        and(
          eq(schema.notification.userId, userId),
          clinicId ? eq(schema.notification.clinicId, clinicId) : undefined,
          eq(schema.notification.status, "unread"),
        ),
      )
      .returning();
  },

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string) {
    return await db
      .delete(schema.notification)
      .where(
        and(
          eq(schema.notification.id, notificationId),
          eq(schema.notification.userId, userId),
        ),
      )
      .returning();
  },

  // Clear all notifications for user
  async clearAll(userId: string, clinicId?: string) {
    return await db
      .delete(schema.notification)
      .where(
        and(
          eq(schema.notification.userId, userId),
          clinicId ? eq(schema.notification.clinicId, clinicId) : undefined,
        ),
      )
      .returning();
  },
};

// ============================================
// SEARCH QUERIES
// ============================================

export const searchQueries = {
  // Search patients
  async searchPatients(clinicId: string, searchTerm: string) {
    return await db.query.patient.findMany({
      // In v2, where is an object. Use OR/AND keys for complex logic
      where: {
        clinicId,
        isDeleted: false,
        OR: [
          { firstName: { ilike: `%${searchTerm}%` } },
          { lastName: { ilike: `%${searchTerm}%` } },
          { email: { ilike: `%${searchTerm}%` } },
          { phone: { ilike: `%${searchTerm}%` } },
        ],
      },
      with: {
        user: true,
      },
      limit: 20,
    });
  },

  // Search files
  async searchFiles(userId: string, searchTerm: string) {
    return await db.query.file.findMany({
      where: {
        userId,
        // Using object syntax for ilike
        searchText: { ilike: `%${searchTerm}%` },
      },
      // orderBy is now an object
      orderBy: { createdAt: "desc" },
    });
  },

  // Advanced search with filters
  async advancedSearch(filters: {
    clinicId?: string;
    patientName?: string;
    doctorName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: AppointmentStatus;
  }) {
    return await db.query.appointment.findMany({
      where: {
        isDeleted: false,
        // Handling isNull in v2 object syntax usually requires RAW if not natively supported
        AND: [
          { RAW: (table) => sql`${table.deletedAt} IS NULL` },
          ...(filters.clinicId ? [{ clinicId: filters.clinicId }] : []),
          ...(filters.status ? [{ status: filters.status }] : []),
          ...(filters.dateFrom && filters.dateTo
            ? [
                {
                  appointmentDate: {
                    gte: filters.dateFrom,
                    lte: filters.dateTo,
                  },
                },
              ]
            : []),
        ],
      },
      with: {
        // Corrected relation filters for v2
        patient: filters.patientName
          ? {
              where: {
                OR: [
                  { firstName: { ilike: `%${filters.patientName}%` } },
                  { lastName: { ilike: `%${filters.patientName}%` } },
                ],
              },
            }
          : true,
        doctor: filters.doctorName
          ? {
              where: {
                name: { ilike: `%${filters.doctorName}%` },
              },
            }
          : true,
        service: true,
        bills: true,
      },
      orderBy: { appointmentDate: "desc" },
    });
  },
};

export const serviceQueries = {
  // List services with pagination and search
  async listServices(params: {
    clinicId: string;
    search?: string;
    category?: string;
    page: number;
    pageSize: number;
  }) {
    const { clinicId, search, category, page, pageSize } = params;
    const rqbWhere = {
      clinicId,
      isDeleted: false,
      ...(category && { category }),
      ...(search && {
        OR: [
          { serviceName: { ilike: `%${search}%` } },
          { description: { ilike: `%${search}%` } },
        ],
      }),
    };

    const [services, total] = await Promise.all([
      db.query.service.findMany({
        where: rqbWhere,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.$count(
        schema.service,
        and(
          eq(schema.service.isDeleted, false),
          eq(schema.service.clinicId, clinicId),
          category ? eq(schema.service.category, category) : undefined,
          search ? like(schema.service.serviceName, `%${search}%`) : undefined,
        ),
      ),
    ]);

    return {
      services,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Get all services for a clinic
  async getClinicServices(clinicId: string, includeDeleted = false) {
    return await db.query.service.findMany({
      where: {
        clinicId,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      orderBy: { serviceName: "asc" },
    });
  },

  // Get available services only
  async getAvailableServices(clinicId: string) {
    return await db.query.service.findMany({
      where: {
        clinicId,
        isAvailable: true,
        isDeleted: false,
      },
      orderBy: { serviceName: "asc" },
    });
  },

  // Get service by ID with related data
  async getServiceById(serviceId: string, clinicId?: string) {
    const whereClause: Record<string, unknown> = {
      id: serviceId,
      isDeleted: false,
    };
    if (clinicId) {
      whereClause.clinicId = clinicId;
    }

    return await db.query.service.findFirst({
      where: whereClause,
      with: {
        appointments: {
          where: { isDeleted: false },
          limit: 10,
          orderBy: { appointmentDate: "desc" },
        },
        labTests: {
          limit: 10,
          orderBy: { testDate: "desc" },
        },
      },
    });
  },

  // Get services by category
  async getServicesByCategory(clinicId: string, category: string) {
    return await db.query.service.findMany({
      where: {
        clinicId,
        category,
        isDeleted: false,
      },
      orderBy: { price: "asc" },
    });
  },

  // Get service categories (distinct categories)
  async getServiceCategories(clinicId: string) {
    const services = await db.query.service.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      columns: { category: true },
    });

    const categories = [
      ...new Set(services.map((s) => s.category).filter(Boolean)),
    ];
    return categories;
  },

  // Search services
  async searchServices(clinicId: string, searchTerm: string) {
    return await db.query.service.findMany({
      where: {
        clinicId,
        isDeleted: false,
        OR: [
          { serviceName: { ilike: `%${searchTerm}%` } },
          { description: { ilike: `%${searchTerm}%` } },
          { category: { ilike: `%${searchTerm}%` } },
        ],
      },
      orderBy: { serviceName: "asc" },
    });
  },

  // Get service statistics
  async getServiceStatistics(
    clinicId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const services = await db.query.service.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      with: {
        appointments: {
          where: {
            isDeleted: false,
            ...(startDate &&
              endDate && {
                appointmentDate: {
                  gte: startDate,
                  lte: endDate,
                },
              }),
          },
        },
        labTests: {
          where:
            startDate && endDate
              ? {
                  testDate: {
                    gte: startDate,
                    lte: endDate,
                  },
                }
              : undefined,
        },
      },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.serviceName,
      category: service.category,
      price: service.price,
      duration: service.duration,
      isAvailable: service.isAvailable,
      appointmentCount: service.appointments.length,
      labTestCount: service.labTests.length,
      totalUsage: service.appointments.length + service.labTests.length,
      estimatedRevenue: service.appointments.length * (service.price ?? 0),
    }));
  },

  // Get popular services
  async getPopularServices(
    clinicId: string,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const stats = await serviceQueries.getServiceStatistics(
      clinicId,
      startDate,
      endDate,
    );
    return stats.sort((a, b) => b.totalUsage - a.totalUsage).slice(0, limit);
  },

  // Get services with low usage
  async getLowUsageServices(clinicId: string, threshold = 5, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await serviceQueries.getServiceStatistics(
      clinicId,
      startDate,
      endDate,
    );
    return stats.filter((service) => service.totalUsage < threshold);
  },

  // Get service revenue report
  async getServiceRevenueReport(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const services = await db.query.service.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      with: {
        appointments: {
          where: {
            isDeleted: false,
            status: "COMPLETED",
            appointmentDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const report = {
      period: { startDate, endDate },
      totalRevenue: 0,
      services: [] as Array<{
        id: string;
        name: string;
        category: string | null;
        appointmentCount: number;
        revenue: number;
        averagePrice: number;
      }>,
    };

    for (const service of services) {
      const appointmentCount = service.appointments.length;
      const revenue = appointmentCount * (service.price ?? 0);
      report.totalRevenue += revenue;
      report.services.push({
        id: service.id,
        name: service.serviceName,
        category: service.category,
        appointmentCount,
        revenue,
        averagePrice: service.price ?? 0,
      });
    }

    return report;
  },

  // Check if service can be deleted (no dependencies)
  async canDeleteService(serviceId: string) {
    const service = await db.query.service.findFirst({
      where: { id: serviceId },
      with: {
        appointments: {
          where: {
            isDeleted: false,
            status: { notIn: ["CANCELLED", "COMPLETED"] },
          },
          limit: 1,
        },
        labTests: {
          limit: 1,
        },
      },
    });

    if (!service) {
      return { canDelete: false, reason: "Service not found" };
    }

    if (service.appointments.length > 0) {
      return { canDelete: false, reason: "Service has upcoming appointments" };
    }

    if (service.labTests.length > 0) {
      return { canDelete: false, reason: "Service has associated lab tests" };
    }

    return { canDelete: true };
  },

  // Get service usage trends
  async getServiceUsageTrends(clinicId: string, serviceId: string, months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const appointments = await db.query.appointment.findMany({
        where: {
          clinicId,
          serviceId,
          isDeleted: false,
          status: "COMPLETED",
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      trends.push({
        month: startDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        appointmentCount: appointments.length,
        revenue:
          appointments.length *
          ((await serviceQueries.getServiceById(serviceId))?.price ?? 0),
      });
    }

    return trends;
  },
};
// ============================================
// VACCINE & IMMUNIZATION QUERIES
// ============================================
export const labTestQueries = {
  async getPendingByClinicId(clinicId: string) {
    return await db.query.labTest.findMany({
      where: {
        status: "PENDING",
        patient: {
          clinicId,
        },
      },
      with: {
        patient: true,
        service: true,
        medicalRecord: {
          with: {
            doctor: true,
          },
        },
      },
      orderBy: { testDate: "asc" },
    });
  },
  // Get lab tests by patient
  async getByPatientId(patientId: string) {
    return await db.query.labTest.findMany({
      where: { patientId },
      with: {
        service: true,
        medicalRecord: {
          with: {
            doctor: true,
          },
        },
      },
      orderBy: { testDate: "desc" },
    });
  },

  async getPatientLabTests(patientId: string, status?: LabTestStatus) {
    return await db.query.labTest.findMany({
      where: {
        patientId,
        ...(status && { status }),
      },
      with: {
        service: true,
        medicalRecord: {
          with: {
            doctor: true,
          },
        },
      },
      orderBy: { testDate: "desc" },
    });
  },
  async getById(labTestId: string) {
    return await db.query.labTest.findFirst({
      where: { id: labTestId },
      with: {
        patient: true,
        service: true,
        medicalRecord: {
          with: {
            doctor: true,
          },
        },
      },
    });
  },
  // Update lab test results
  async updateLabTestResults(
    labTestId: string,
    result: string,
    status: LabTestStatus,
  ) {
    return await db
      .update(schema.labTest)
      .set({
        result,
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.labTest.id, labTestId))
      .returning();
  },

  // Get pending lab tests
  async getPendingLabTests() {
    return await db.query.labTest.findMany({
      where: {
        status: "PENDING",
      },
      with: {
        patient: true,
        service: true,
        medicalRecord: {
          with: {
            doctor: true,
          },
        },
      },
      orderBy: { testDate: "asc" },
    });
  },
};
export const pediatricQueries = {
  // Get feeding logs summary for a period
  async getFeedingLogsSummary(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const feedingLogs = await db.query.feedingLog.findMany({
      where: {
        patientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    const summary = {
      totalFeedings: feedingLogs.length,
      byType: {} as Record<string, number>,
      averageDuration: 0,
      totalAmount: 0,
    };

    let totalDuration = 0;
    for (const log of feedingLogs) {
      summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;
      totalDuration += log.duration ?? 0;
      summary.totalAmount += log.amount ?? 0;
    }

    summary.averageDuration =
      feedingLogs.length > 0 ? totalDuration / feedingLogs.length : 0;

    return summary;
  },

  // Get developmental milestones progress
  async getDevelopmentalProgress(patientId: string) {
    const [milestones, checks] = await Promise.all([
      db.query.developmentalMilestones.findMany({
        where: { patientId },
        orderBy: { dateRecorded: "asc" },
      }),

      db.query.developmentalCheck.findMany({
        where: { patientId },
        orderBy: { checkDate: "asc" },
      }),
    ]);

    // Group milestones by age range
    const milestonesByAge: Record<string, typeof milestones> = {};
    for (const milestone of milestones) {
      if (!milestonesByAge[milestone.ageAchieved]) {
        milestonesByAge[milestone.ageAchieved] = [];
      }
      milestonesByAge[milestone.ageAchieved]?.push(milestone);
    }

    return {
      milestones: milestonesByAge,
      developmentalChecks: checks,
      totalMilestonesAchieved: milestones.length,
      lastCheckup: checks[checks.length - 1],
    };
  },

  // Get developmental screenings for a patient
  async getDevelopmentalScreenings(patientId: string) {
    return await db.query.developmentalCheck.findMany({
      where: { patientId },
      orderBy: { checkDate: "desc" },
    });
  },

  // Create developmental check
  async createDevelopmentalCheck(
    data: typeof schema.developmentalCheck.$inferInsert,
  ) {
    return await db
      .insert(schema.developmentalCheck)
      .values({
        ...data,
        id: data.id ?? crypto.randomUUID(),
      })
      .returning();
  },
};
export const vaccineQueries = {
  async getAllSchedules() {
    return await db.query.vaccineSchedule.findMany({
      where: { isDeleted: false },
    });
  },
  async listImmunizations(input: {
    limit: number;
    offset: number;
    patientId?: string;
    clinicId?: string;
  }) {
    const { limit, offset, patientId, clinicId } = input;

    const [records, total] = await Promise.all([
      db.query.immunization.findMany({
        where: {
          ...(clinicId && { clinicId }),
          isDeleted: false,
          ...(patientId && { patientId }),
        },
        limit,
        offset,
        orderBy: { date: "desc" },
      }),
      db.$count(
        schema.immunization,
        and(
          clinicId ? eq(schema.immunization.clinicId, clinicId) : undefined,
          eq(schema.immunization.isDeleted, false),
          patientId ? eq(schema.immunization.patientId, patientId) : undefined,
        ),
      ),
    ]);

    return {
      records,
      total,
    };
  },
  // Get vaccine schedule for patient based on age
  async getPatientVaccineSchedule(patientId: string) {
    const patient = await db.query.patient.findFirst({
      where: { id: patientId },
      with: {
        immunizations: true,
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Calculate age in days
    const ageInDays = Math.floor(
      (Date.now() - patient.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24),
    );
    // Get due vaccines

    const dueVaccines = await db.query.vaccineSchedule.findMany({
      where: {
        isDeleted: false, // Simple equality
        ageInDaysMin: { lte: ageInDays }, // LTE operator as object key
        OR: [
          { ageInDaysMax: { gte: ageInDays } }, // GTE operator
        ],
      },
    });
    // Filter out already administered vaccines
    const administeredVaccines = new Set(
      patient.immunizations.map((i) => i.vaccine),
    );

    const pendingVaccines = dueVaccines.filter(
      (v) => !administeredVaccines.has(v.vaccineName),
    );

    return { pendingVaccines, administeredVaccines: patient.immunizations };
  },
  async getVaccineInventoryStatus(clinicId: string) {
    const inventory = await db.query.vaccineInventory.findMany({
      where: { clinicId },
      orderBy: { expirationDate: "asc" },
    });

    const now = new Date();
    const expiringSoon = inventory.filter((v) => {
      const daysUntilExpiry = Math.ceil(
        ((v.expirationDate?.getTime() ?? now.getTime()) - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    const expired = inventory.filter(
      (v) => v.expirationDate && v.expirationDate < now,
    );
    const lowStock = inventory.filter((v) => v.quantity < 10);

    return {
      totalVaccines: inventory.length,
      totalDoses: inventory.reduce((sum, v) => sum + (v.quantity ?? 0), 0),
      expiringSoon,
      expired,
      lowStock,
      inventoryByVaccine: inventory,
    };
  },
  async getOverdueImmunizations(clinicId: string) {
    const overdueImmunizations = await db.query.immunization.findMany({
      where: {
        clinicId,
        isDeleted: false,
        status: "OVERDUE",
      },
      with: {
        patient: {
          with: {
            guardians: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return overdueImmunizations;
  },
  async getUpcomingImmunizations(clinicId: string) {
    // const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const allPatients = await db.query.patient.findMany({
      where: { clinicId, isDeleted: false },
      with: {
        immunizations: true,
      },
    });

    const upcomingImmunizations = [];

    for (const patient of allPatients) {
      const dueVaccines = await vaccineQueries.getPatientVaccineSchedule(
        patient.id,
      );
      upcomingImmunizations.push({
        patient,
        dueVaccines: dueVaccines.pendingVaccines,
      });
    }

    return upcomingImmunizations.filter((u) => u.dueVaccines.length > 0);
  },
  // Record immunization
  async recordImmunization(data: {
    patientId: string;
    clinicId: string;
    vaccine: string;
    date: Date;
    dose: string;
    lotNumber: string;
    administeredByStaffId: string;
    notes?: string;
  }) {
    return await db.transaction(async (tx) => {
      const [immunization] = await tx
        .insert(schema.immunization)
        .values({
          id: crypto.randomUUID(),
          recordId: crypto.randomUUID(),
          ...data,
          status: "COMPLETED",
        })
        .returning();

      // Update vaccine inventory
      await tx
        .update(schema.vaccineInventory)
        .set({
          quantity: sql`${schema.vaccineInventory.quantity} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.vaccineInventory.clinicId, data.clinicId),
            eq(schema.vaccineInventory.vaccineName, data.vaccine),
          ),
        );

      return immunization;
    });
  },
};

export const prescriptionQueries = {
  // Get prescription by ID with all items and relations
  async getPrescriptionById(id: string) {
    return await db.query.prescription.findFirst({
      where: { id },
      with: {
        patient: true,
        doctor: true,
        prescribedItems: {
          with: {
            drug: true,
          },
        },
        medicalRecord: true,
      },
    });
  },

  async getPatientActivePrescriptions(
    patientId: string,
    clinicId?: string,
    includeExpired?: boolean,
  ) {
    const conditions: Record<string, unknown> = { patientId };
    if (clinicId) conditions.clinicId = clinicId;
    if (!includeExpired) {
      conditions.status = "active";
      conditions.OR = [{ endDate: { gt: new Date() } }, { endDA: null }];
    }

    return await db.query.prescription.findMany({
      where: conditions,
      with: {
        prescribedItems: {
          with: {
            drug: true,
            dispenses: {
              orderBy: { dispensedAt: "desc" },
              limit: 10,
            },
          },
        },
        doctor: {
          with: {
            user: true,
          },
        },
      },
      orderBy: { issuedDate: "desc" },
    });
  },

  async getPrescriptionWithItems(id: string, clinicId?: string) {
    return await db.query.prescription.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      with: {
        prescribedItems: {
          with: {
            drug: true,
          },
        },
      },
    });
  },

  async getPrescribedItem(id: string) {
    return await db.query.prescribedItem.findFirst({
      where: { id },
      with: {
        prescription: true,
        dispenses: true,
      },
    });
  },

  async getPrescribedItemsByPrescriptionId(prescriptionId: string) {
    return await db.query.prescribedItem.findMany({
      where: { prescriptionId },
    });
  },

  async getDrugsByIds(ids: string[], clinicId?: string) {
    return await db.query.drug.findMany({
      where: { id: { in: ids }, clinicId },
    });
  },

  async getDoseGuidelines(drugIds: string[]) {
    return await db.query.doseGuideline.findMany({
      where: { drugId: { in: drugIds } },
    });
  },

  async getPrescriptionsByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await db.query.prescription.findMany({
      where: {
        patientId,
        issuedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      with: {
        prescribedItems: {
          with: {
            drug: true,
            dispenses: true,
          },
        },
      },
    });
  },

  async getPrescriptionsForAnalytics(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await db.query.prescription.findMany({
      where: {
        clinicId,
        issuedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      with: {
        prescribedItems: {
          with: {
            drug: true,
          },
        },
        doctor: true,
      },
    });
  },

  async listDrugs(search?: string, category?: string, limit = 50, offset = 0) {
    let where: Record<string, unknown> | undefined;

    if (search || category) {
      where = {};

      if (search) {
        where.RAW = () => sql`
					${schema.drug.name} LIKE ${`%${search}%`} OR
					${schema.drug.genericName} LIKE ${`%${search}%`} OR
					${schema.drug.brandName} LIKE ${`%${search}%`}
				`;
      }

      if (category) {
        if (where.RAW) {
          const searchRaw = where.RAW as () => SQL;
          where = {
            AND: [{ RAW: searchRaw }, { contraindications: category }],
          };
        } else {
          where.contraindications = category;
        }
      }
    }

    const drugsList = await db.query.drug.findMany({
      where,
      limit,
      offset,
      orderBy: { name: "asc" },
    });

    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.drug);
    const total = totalResult?.count ?? 0;

    return {
      drugs: drugsList,
      pagination: { limit, offset, total, hasMore: offset + limit < total },
    };
  },

  async getPatientAllergies(patientId: string) {
    const patient = await db.query.patient.findFirst({
      where: { id: patientId },
      columns: { allergies: true },
    });
    return patient?.allergies;
  },

  async updatePrescriptionStatus(
    id: string,
    status: schema.PrescriptionStatus,
    performedBy: string,
  ) {
    return await db.transaction(async (tx) => {
      await tx
        .update(schema.prescription)
        .set({ status })
        .where(eq(schema.prescription.id, id));
      await tx.insert(schema.prescriptionLog).values({
        id: crypto.randomUUID(),
        prescriptionId: id,
        action: status.toUpperCase(),
        performedBy,
        createdAt: new Date(),
      });
    });
  },
  async checkVitalSignsAccess(
    userId: string,
    patientId: string,
  ): Promise<boolean> {
    const userData = await db.query.user.findFirst({
      where: { id: userId },
      with: {
        patients: true,
        doctors: true,
      },
    });

    if (!userData) {
      return false;
    }

    if (userData.role === "admin" || userData.role === "staff") {
      return true;
    }
    if (userData.role === "doctor" && userData.doctors) {
      return true;
    }
    if (userData.role === "patient" && Array.isArray(userData.patients)) {
      return userData.patients.some((p) => p.id === patientId);
    }

    // Check if user is guardian
    const guardianRecord = await db.query.guardian.findFirst({
      where: {
        userId,
        patientId,
      },
    });

    return !!guardianRecord;
  },

  async getVitalSigns(params: {
    patientId: string;
    clinicId: string;
    limit?: number;
    page?: number;
    pageSize?: number;
    fromDate?: Date;
    toDate?: Date;
    encounterId?: string;
  }) {
    const {
      patientId,
      clinicId,
      page = 1,
      pageSize = 50,
      limit,
      fromDate,
      toDate,
      encounterId,
    } = params;
    const finalLimit = limit ?? pageSize;

    const conditions: Record<string, unknown> = { patientId, clinicId };
    if (fromDate && toDate) {
      conditions.recordedAt = { gte: fromDate, lte: toDate };
    } else if (fromDate) {
      conditions.recordedAt = { gte: fromDate };
    } else if (toDate) {
      conditions.recordedAt = { lte: toDate };
    }

    if (encounterId) {
      conditions.encounterId = encounterId;
    }

    return await db.query.vitalSign.findMany({
      where: conditions,
      orderBy: { recordedAt: "desc" },
      limit: finalLimit,
      offset: (page - 1) * finalLimit,
    });
  },

  async getVitalSignsByMedicalRecord(medicalId: string) {
    return await db.query.vitalSign.findMany({
      where: { medicalId },
      orderBy: { recordedAt: "desc" },
    });
  },

  async getLatestVitalSigns(patientId: string, clinicId: string) {
    return await db.query.vitalSign.findFirst({
      where: {
        patientId,
        clinicId,
      },
      orderBy: { recordedAt: "desc" },
    });
  },

  async getVitalSignById(id: string, clinicId: string) {
    return await db.query.vitalSign.findFirst({
      where: { id, clinicId },
    });
  },

  async checkDoctorAccess(doctorId: string, userId: string, clinicId?: string) {
    const userRecord = await db.query.user.findFirst({
      where: { id: userId },
      with: {
        doctors: true,
        clinics: true,
      },
    });

    if (!userRecord) {
      return false;
    }

    // Admin has full access
    if (userRecord.role === "admin" || userRecord.role === "superadmin") {
      return true;
    }

    // Staff has limited access
    if (userRecord.role === "staff") {
      return true;
    }

    // Doctor access
    if (userRecord.role === "doctor") {
      const doctorRecord = await db.query.doctor.findFirst({
        where: {
          userId,
          id: doctorId,
        },
      });
      return !!doctorRecord;
    }

    // Check clinic membership
    if (clinicId) {
      const clinicMember = await db.query.clinicMember.findFirst({
        where: {
          userId,
          clinicId,
        },
      });
      return !!clinicMember;
    }

    return false;
  },
};

export const reportingQueries = {
  // Get clinic analytics for dashboard
  async getClinicAnalytics(clinicId: string, startDate: Date, endDate: Date) {
    const [appointments, payments, patients, prescriptions] = await Promise.all(
      [
        // Appointments by status
        db.query.appointment.findMany({
          where: {
            clinicId,
            isDeleted: false,
            appointmentDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Payments summary
        db.query.payment.findMany({
          where: {
            clinicId,
            paymentDate: {
              gte: startDate,
              lte: endDate,
            },
            status: "PAID",
          },
        }),

        // New patients count
        db.query.patient.findMany({
          where: {
            clinicId,
            isDeleted: false,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Prescriptions count
        db.query.prescription.findMany({
          where: {
            clinicId,
            issuedDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ],
    );

    const appointmentStats = {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
      pending: appointments.filter((a) => a.status === "PENDING").length,
      noShow: appointments.filter((a) => a.status === "NO_SHOW").length,
    };

    const revenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const revenueByMethod = payments.reduce(
      (acc, p) => {
        const method = p.paymentMethod || "UNKNOWN";
        acc[method] = (acc[method] || 0) + (p.amount ?? 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      period: { startDate, endDate },
      appointments: appointmentStats,
      revenue: {
        total: revenue,
        byMethod: revenueByMethod,
        averagePerAppointment:
          appointmentStats.completed > 0
            ? revenue / appointmentStats.completed
            : 0,
      },
      patients: {
        total: patients.length,
        newPatients: patients.length,
      },
      prescriptions: prescriptions.length,
    };
  },

  // Get popular services
  async getPopularServices(clinicId: string, startDate: Date, endDate: Date) {
    const services = await db.query.service.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      with: {
        appointments: {
          where: {
            appointmentDate: {
              gte: startDate,
              lte: endDate,
            },
            isDeleted: false,
          },
        },
        labTests: {
          where: {
            testDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    return services
      .map((service) => ({
        id: service.id,
        name: service.serviceName,
        price: service.price,
        appointmentCount: service.appointments.length,
        labTestCount: service.labTests.length,
        totalUsage: service.appointments.length + service.labTests.length,
        revenue: service.appointments.length * (service.price ?? 0),
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  },

  // Get doctor performance report
  async getDoctorPerformanceReport(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const doctors = await db.query.doctor.findMany({
      where: {
        clinicId,
        isDeleted: false,
      },
      with: {
        appointments: {
          where: {
            appointmentDate: {
              gte: startDate,
              lte: endDate,
            },
            isDeleted: false,
          },
        },
        ratings: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        prescriptions: {
          where: {
            issuedDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    return doctors.map((doctor) => {
      const completedAppointments = doctor.appointments.filter(
        (a) => a.status === "COMPLETED",
      );
      const cancelledAppointments = doctor.appointments.filter(
        (a) => a.status === "CANCELLED",
      );
      const averageRating =
        doctor.ratings.length > 0
          ? doctor.ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
            doctor.ratings.length
          : 0;

      return {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        totalAppointments: doctor.appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        completionRate:
          doctor.appointments.length > 0
            ? (completedAppointments.length / doctor.appointments.length) * 100
            : 0,
        totalPrescriptions: doctor.prescriptions.length,
        averageRating,
        revenue: completedAppointments.reduce(
          (sum, a) => sum + (a.appointmentPrice ?? 0),
          0,
        ),
      };
    });
  },
};

export async function checkVitalSignsAccess(
  userId: string,
  patientId: string,
): Promise<boolean> {
  const userData = await db.query.user.findFirst({
    where: { id: userId },
    with: {
      patients: true,
      doctors: true,
    },
  });

  if (!userData) return false;

  if (userData.role === "admin" || userData.role === "staff") return true;
  if (userData.role === "doctor" && userData.doctors) return true;
  if (userData.role === "patient" && Array.isArray(userData.patients)) {
    return userData.patients.some((p) => p.id === patientId);
  }

  // Check if user is guardian
  const guardianRecord = await db.query.guardian.findFirst({
    where: {
      userId: userId,
      patientId: patientId,
    },
  });

  return !!guardianRecord;
}

// Helper function to check doctor access
export async function checkDoctorAccess(
  doctorId: string,
  userId: string,
  clinicId?: string,
) {
  const userRecord = await db.query.user.findFirst({
    where: { id: userId },
    with: {
      doctors: true,
      clinics: true,
    },
  });

  if (!userRecord) return false;

  // Admin has full access
  if (userRecord.role === "admin" || userRecord.role === "superadmin")
    return true;

  // Staff has limited access
  if (userRecord.role === "staff") return true;

  // Doctor access
  if (userRecord.role === "doctor") {
    const doctorRecord = await db.query.doctor.findFirst({
      where: {
        userId: userId,
        id: doctorId,
      },
    });
    return !!doctorRecord;
  }

  // Check clinic membership
  if (clinicId) {
    const clinicMember = await db.query.clinicMember.findFirst({
      where: {
        userId: userId,
        clinicId: clinicId,
      },
    });
    return !!clinicMember;
  }

  return false;
}

export const encounterQueries = {
  async getEncounterById(id: string, clinicId: string) {
    return await db.query.diagnosis.findFirst({
      where: { id, clinicId },
      with: {
        patient: true,
        doctor: true,
        appointment: true,
        prescriptions: true,
        medical: {
          with: {
            vitalSigns: true,
            prescriptions: {
              with: {
                prescribedItems: {
                  with: {
                    drug: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  async getPatientEncounters(patientId: string, clinicId: string) {
    const encounters = await db.query.diagnosis.findMany({
      where: { patientId, clinicId },
      orderBy: { createdAt: "desc" },
      with: { doctor: true, appointment: true, patient: true },
    });

    return encounters;
  },

  async getDiagnosesByMedicalRecordId(input: { medicalId: string }) {
    const diagnoses = await db.query.diagnosis.findMany({
      where: { medicalId: input.medicalId },
      orderBy: { date: "desc" },
    });
    return diagnoses;
  },
  async getVitalSignsByMedicalRecordId(medicalId: string) {
    return await db.query.vitalSign.findMany({
      where: { medicalId },
      orderBy: { recordedAt: "desc" },
    });
  },
  async getTrendData(patientId: string, clinicId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [vitals, growth] = await Promise.all([
      db.query.vitalSign.findMany({
        where: {
          patientId,
          clinicId,
          recordedAt: { gte: startDate },
        },
        orderBy: { recordedAt: "asc" },
      }),
      db.query.growthRecord.findMany({
        where: {
          patientId,
          clinicId,
          date: { gte: startDate },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return { vitals, growth };
  },
};

export const growthQueries = {
  async getPatientGrowthRecords(patientId: string, clinicId: string) {
    return await db.query.growthRecord.findMany({
      where: { patientId, clinicId },
      orderBy: { date: "asc" },
    });
  },

  async listGrowthRecords(
    clinicId: string,
    patientId?: string,
    limit = 50,
    offset = 0,
  ) {
    const [records, total] = await Promise.all([
      db.query.growthRecord.findMany({
        where: {
          clinicId,
          ...(patientId && { patientId }),
        },
        limit,
        offset,
        orderBy: { date: "desc" },
      }),
      db.$count(
        schema.growthRecord,
        and(
          eq(schema.growthRecord.clinicId, clinicId),
          patientId ? eq(schema.growthRecord.patientId, patientId) : undefined,
        ),
      ),
    ]);
    return { records, total };
  },
  async getGrowthRecordById(id: string, clinicId: string) {
    return await db.query.growthRecord.findFirst({
      where: { id, clinicId },
      with: {
        patient: true,
      },
    });
  },
  async addMeasurementPoint(
    input: {
      patientId: string;
      date: Date;
      weight?: number;
      height?: number;
      headCircumference?: number;
      notes?: string;
    },
    clinicId: string,
  ) {
    return await db
      .insert(schema.growthRecord)
      .values({
        ...input,
        id: crypto.randomUUID(),
        clinicId,
      })
      .returning();
  },

  async getGrowthAnalytics(patientId: string, clinicId: string) {
    const records = await this.getPatientGrowthRecords(patientId, clinicId);

    if (records.length < 2) return { velocity: null, records };

    const first = records[0];
    const last = records[records.length - 1];
    if (!first || !last) {
      return { velocity: null, records };
    }
    const monthsDiff =
      (last.date.getTime() - first.date.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);

    const weightVelocity =
      monthsDiff > 0
        ? (Number(last.weight ?? 0) - Number(first.weight ?? 0)) / monthsDiff
        : 0;
    const heightVelocity =
      monthsDiff > 0
        ? (Number(last.height ?? 0) - Number(first.height ?? 0)) / monthsDiff
        : 0;

    return {
      records,
      velocity: {
        weightKgPerMonth: weightVelocity.toFixed(2),
        heightCmPerMonth: heightVelocity.toFixed(2),
      },
    };
  },
};

export const vitalSignQueries = {
  async getVitalSigns(params: {
    patientId: string;
    clinicId: string;
    limit?: number;
    page?: number;
    pageSize?: number;
    fromDate?: Date;
    toDate?: Date;
    encounterId?: string;
  }) {
    const {
      patientId,
      clinicId,
      page = 1,
      pageSize = 50,
      limit,
      fromDate,
      toDate,
      encounterId,
    } = params;
    const finalLimit = limit ?? pageSize;

    const rqbWhere: Record<string, unknown> = { patientId, clinicId };

    if (fromDate || toDate) {
      const recordedAt: Record<string, unknown> = {};
      if (fromDate) recordedAt.gte = fromDate;
      if (toDate) recordedAt.lte = toDate;
      rqbWhere.recordedAt = recordedAt;
    }

    if (encounterId) {
      rqbWhere.encounterId = encounterId;
    }

    return await db.query.vitalSign.findMany({
      where: rqbWhere,
      orderBy: { recordedAt: "desc" },
      limit: finalLimit,
      offset: (page - 1) * finalLimit,
    });
  },

  async getVitalSignsByMedicalRecord(medicalId: string) {
    return await db.query.vitalSign.findMany({
      where: { medicalId },
      orderBy: { recordedAt: "desc" },
    });
  },

  async getLatestVitalSigns(patientId: string, clinicId: string) {
    return await db.query.vitalSign.findFirst({
      where: { patientId, clinicId },
      orderBy: { recordedAt: "desc" },
    });
  },

  async getVitalSignById(id: string, clinicId: string) {
    return await db.query.vitalSign.findFirst({
      where: { id, clinicId },
    });
  },
};
// ============================================
// NUTRITION QUERIES (continued in same file)
// ============================================

// ============================================
// FEEDING LOG QUERIES
// ============================================

export interface FeedingLogFilters {
  patientId: string;
  clinicId: string;
  startDate?: Date;
  endDate?: Date;
  type?: (typeof schema.feedingTypeEnum.enumValues)[number];
  limit?: number;
  offset?: number;
}

export interface FeedingStats {
  totalFeedings: number;
  byType: Record<string, number>;
  averageDuration: number;
  totalAmount: number;
  feedingsByDay: Array<{
    date: string;
    count: number;
    totalDuration: number;
    totalAmount: number;
  }>;
}

export const feedingLogQueries = {
  /**
   * List feeding logs with pagination and filters
   */
  async list({
    patientId,
    clinicId: _clinicId,
    startDate,
    endDate,
    type,
    limit = 50,
    offset = 0,
  }: FeedingLogFilters) {
    const logs = await db.query.feedingLog.findMany({
      where: {
        patientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type,
      },
      orderBy: { date: "desc" },
      limit,
      offset,
    });

    const total = await db.$count(
      schema.feedingLog,
      and(
        eq(schema.feedingLog.patientId, patientId),
        startDate && endDate
          ? between(schema.feedingLog.date, startDate, endDate)
          : startDate
            ? gte(schema.feedingLog.date, startDate)
            : endDate
              ? lte(schema.feedingLog.date, endDate)
              : undefined,
        type ? eq(schema.feedingLog.type, type) : undefined,
      ),
    );

    return {
      logs,
      total,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get feeding log by ID
   */
  async getById(id: string, _clinicId?: string) {
    return await db.query.feedingLog.findFirst({
      where: {
        id,
      },
    });
  },

  /**
   * Get feeding statistics for a patient
   */
  async getStats(
    patientId: string,
    _clinicId: string,
    days = 30,
  ): Promise<FeedingStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.query.feedingLog.findMany({
      where: {
        patientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate statistics
    const byType: Record<string, number> = {};
    let totalDuration = 0;
    let totalAmount = 0;
    const feedingsByDayMap: Record<
      string,
      { count: number; totalDuration: number; totalAmount: number }
    > = {};

    for (const log of logs) {
      // Count by type
      byType[log.type] = (byType[log.type] || 0) + 1;

      // Sum duration and amount
      totalDuration += log.duration || 0;
      totalAmount += log.amount || 0;

      // Group by day
      const dateKey = log.date.toISOString().split("T")[0] ?? "";
      if (!feedingsByDayMap[dateKey]) {
        feedingsByDayMap[dateKey] = {
          count: 0,
          totalDuration: 0,
          totalAmount: 0,
        };
      }
      feedingsByDayMap[dateKey].count++;
      feedingsByDayMap[dateKey].totalDuration += log.duration || 0;
      feedingsByDayMap[dateKey].totalAmount += log.amount || 0;
    }

    const averageDuration = logs.length > 0 ? totalDuration / logs.length : 0;

    return {
      totalFeedings: logs.length,
      byType,
      averageDuration,
      totalAmount,
      feedingsByDay: Object.entries(feedingsByDayMap)
        .map(([date, stats]) => ({
          date,
          count: stats.count,
          totalDuration: stats.totalDuration,
          totalAmount: stats.totalAmount,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },

  /**
   * Get breastfeeding-specific statistics
   */
  async getBreastfeedingStats(patientId: string, _clinicId: string, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.query.feedingLog.findMany({
      where: {
        patientId,
        type: "BREAST",
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Today's total
    const today = new Date().toISOString().split("T")[0] ?? "";
    const todayFeedings = logs.filter(
      (log) => log.date.toISOString().split("T")[0] === today,
    );
    const todayTotal = todayFeedings.length;

    // Weekly data (last 7 days)
    const weeklyDataMap: Record<
      string,
      {
        duration: number;
        count: number;
        leftDuration: number;
        rightDuration: number;
      }
    > = {};

    for (const log of logs) {
      const dateKey = log.date.toISOString().split("T")[0] ?? "";
      if (!weeklyDataMap[dateKey]) {
        weeklyDataMap[dateKey] = {
          duration: 0,
          count: 0,
          leftDuration: 0,
          rightDuration: 0,
        };
      }
      weeklyDataMap[dateKey].duration += log.duration || 0;
      weeklyDataMap[dateKey].count++;
      if (log.breast === "LEFT")
        weeklyDataMap[dateKey].leftDuration += log.duration || 0;
      if (log.breast === "RIGHT")
        weeklyDataMap[dateKey].rightDuration += log.duration || 0;
      if (log.breast === "BOTH") {
        weeklyDataMap[dateKey].leftDuration += (log.duration || 0) / 2;
        weeklyDataMap[dateKey].rightDuration += (log.duration || 0) / 2;
      }
    }

    const weeklyData = Object.entries(weeklyDataMap)
      .map(([date, stats]) => ({
        date,
        duration: stats.duration,
        count: stats.count,
        leftDuration: stats.leftDuration,
        rightDuration: stats.rightDuration,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    // Calculate average duration
    const totalDuration = logs.reduce(
      (sum, log) => sum + (log.duration || 0),
      0,
    );
    const averageDuration = logs.length > 0 ? totalDuration / logs.length : 0;

    // Weekly average (last 7 days)
    const last7Days = weeklyData.slice(-7);
    const weeklyAverage =
      last7Days.length > 0
        ? last7Days.reduce((sum, day) => sum + day.count, 0) / last7Days.length
        : 0;

    // Sessions by time of day
    const sessionsByTimeOfDay = {
      morning: 0, // 6am - 12pm
      afternoon: 0, // 12pm - 5pm
      evening: 0, // 5pm - 9pm
      night: 0, // 9pm - 6am
    };

    for (const log of logs) {
      const hour = log.date.getHours();
      if (hour >= 6 && hour < 12) sessionsByTimeOfDay.morning++;
      else if (hour >= 12 && hour < 17) sessionsByTimeOfDay.afternoon++;
      else if (hour >= 17 && hour < 21) sessionsByTimeOfDay.evening++;
      else sessionsByTimeOfDay.night++;
    }

    // Breast preference
    let leftPreference = 0;
    let rightPreference = 0;
    let bothPreference = 0;

    for (const log of logs) {
      if (log.breast === "LEFT") leftPreference++;
      else if (log.breast === "RIGHT") rightPreference++;
      else if (log.breast === "BOTH") bothPreference++;
    }

    const totalFeedings = logs.length;
    const breastPreference = {
      left: totalFeedings > 0 ? (leftPreference / totalFeedings) * 100 : 0,
      right: totalFeedings > 0 ? (rightPreference / totalFeedings) * 100 : 0,
      both: totalFeedings > 0 ? (bothPreference / totalFeedings) * 100 : 0,
    };

    return {
      todayTotal,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
      totalSessions: logs.length,
      averageDuration: Math.round(averageDuration * 10) / 10,
      weeklyData,
      sessionsByTimeOfDay,
      breastPreference,
    };
  },

  /**
   * Get feeding logs by date range
   */
  async getByDateRange(
    patientId: string,
    _clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await db.query.feedingLog.findMany({
      where: {
        patientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });
  },

  /**
   * Get latest feeding log for a patient
   */
  async getLatest(patientId: string) {
    return await db.query.feedingLog.findFirst({
      where: { patientId },
      orderBy: { date: "desc" },
    });
  },
};

// ============================================
// NUTRITION ASSESSMENT QUERIES
// ============================================

export interface NutritionAssessment {
  id: string;
  patientId: string;
  clinicId: string;
  assessmentDate: Date;
  nutritionalStatus:
    | "NORMAL"
    | "UNDERWEIGHT"
    | "OVERWEIGHT"
    | "OBESE"
    | "MALNOURISHED";
  dietaryRestrictions: string[];
  recommendations: string[];
  followUpDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const nutritionAssessmentQueries = {
  /**
   * Get all nutrition assessments for a patient
   */
  async getAssessments(
    patientId: string,
    clinicId: string,
  ): Promise<NutritionAssessment[]> {
    // If you have a dedicated nutrition_assessment table:
    // return await db.query.nutritionAssessment.findMany({
    //   where: { patientId, clinicId },
    //   orderBy: { assessmentDate: "desc" },
    // });

    // Alternative: Store assessments in medicalRecord with a specific type
    const medicalRecords = await db.query.medicalRecord.findMany({
      where: {
        patientId,
        clinicId,
        notes: { ilike: "%nutrition_assessment%" },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse assessments from medical records
    const assessments: NutritionAssessment[] = [];
    for (const record of medicalRecords) {
      try {
        if (record.notes) {
          const parsed = JSON.parse(record.notes);
          if (parsed.type === "nutrition_assessment") {
            assessments.push({
              id: record.id,
              patientId: record.patientId,
              clinicId: record.clinicId,
              assessmentDate: record.diagnosisDate || record.createdAt,
              nutritionalStatus: parsed.nutritionalStatus || "NORMAL",
              dietaryRestrictions: parsed.dietaryRestrictions || [],
              recommendations: parsed.recommendations || [],
              followUpDate: record.followUpDate || null,
              notes: parsed.notes || null,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            });
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    return assessments;
  },

  /**
   * Get latest nutrition assessment
   */
  async getLatestAssessment(
    patientId: string,
    clinicId: string,
  ): Promise<NutritionAssessment | null> {
    const assessments = await this.getAssessments(patientId, clinicId);
    return assessments.length > 0 ? (assessments[0] ?? null) : null;
  },

  /**
   * Get nutrition assessment by ID
   */
  async getAssessmentById(
    id: string,
    clinicId: string,
  ): Promise<NutritionAssessment | null> {
    const record = await db.query.medicalRecord.findFirst({
      where: { id, clinicId },
    });

    if (!record?.notes) return null;

    try {
      const parsed = JSON.parse(record.notes);
      if (parsed.type === "nutrition_assessment") {
        return {
          id: record.id,
          patientId: record.patientId,
          clinicId: record.clinicId,
          assessmentDate: record.diagnosisDate || record.createdAt,
          nutritionalStatus: parsed.nutritionalStatus || "NORMAL",
          dietaryRestrictions: parsed.dietaryRestrictions || [],
          recommendations: parsed.recommendations || [],
          followUpDate: record.followUpDate || null,
          notes: parsed.notes || null,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      }
    } catch {
      return null;
    }

    return null;
  },

  /**
   * Get nutrition assessment history with trends
   */
  async getAssessmentHistory(patientId: string, clinicId: string, limit = 10) {
    const assessments = await this.getAssessments(patientId, clinicId);
    const sorted = assessments.sort(
      (a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime(),
    );
    const recent = sorted.slice(0, limit);

    // Calculate trends
    let trend: "improving" | "stable" | "declining" | null = null;
    if (recent.length >= 2) {
      const statusOrder: Record<string, number> = {
        MALNOURISHED: 0,
        UNDERWEIGHT: 1,
        NORMAL: 2,
        OVERWEIGHT: 2,
        OBESE: 1,
      };
      const currentScore =
        statusOrder[recent[0]?.nutritionalStatus || "NORMAL"] ?? 1;
      const previousScore =
        statusOrder[recent[1]?.nutritionalStatus || "NORMAL"] ?? 1;

      if (currentScore > previousScore) trend = "improving";
      else if (currentScore < previousScore) trend = "declining";
      else trend = "stable";
    }

    return {
      assessments: recent,
      total: assessments.length,
      trend,
    };
  },

  /**
   * Get patients requiring follow-up based on nutrition assessments
   */
  async getPatientsNeedingFollowUp(clinicId: string, daysUntilFollowUp = 30) {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysUntilFollowUp);

    // This query would need a dedicated nutrition_assessment table
    // Placeholder implementation using medicalRecord
    const records = await db.query.medicalRecord.findMany({
      where: {
        clinicId,
        followUpDate: { lte: followUpDate },
        status: "ACTIVE",
      },
      with: {
        patient: true,
      },
    });

    return records.filter((record) => {
      try {
        if (record.notes) {
          const parsed = JSON.parse(record.notes);
          return parsed.type === "nutrition_assessment";
        }
        return false;
      } catch {
        return false;
      }
    });
  },
};

// ============================================
// NUTRITION DASHBOARD QUERIES
// ============================================

export const nutritionDashboardQueries = {
  /**
   * Get comprehensive nutrition dashboard data for a patient
   */
  async getDashboardData(patientId: string, clinicId: string) {
    const [feedingStats, breastfeedingStats, latestAssessment, feedingLogs] =
      await Promise.all([
        feedingLogQueries.getStats(patientId, clinicId, 30),
        feedingLogQueries.getBreastfeedingStats(patientId, clinicId, 30),
        nutritionAssessmentQueries.getLatestAssessment(patientId, clinicId),
        feedingLogQueries.list({ patientId, clinicId, limit: 10, offset: 0 }),
      ]);

    // Generate alerts
    const alerts: Array<{
      type: "warning" | "info" | "success";
      message: string;
      suggestion?: string;
    }> = [];

    // Check feeding frequency
    if (feedingStats.totalFeedings > 0) {
      const avgDaily =
        feedingStats.feedingsByDay.length > 0
          ? feedingStats.totalFeedings / feedingStats.feedingsByDay.length
          : 0;

      if (avgDaily < 4 && feedingStats.totalFeedings > 0) {
        alerts.push({
          type: "warning",
          message: "Low feeding frequency detected",
          suggestion: "Consider more frequent feedings throughout the day.",
        });
      }
    }

    // Check breastfeeding
    if (
      breastfeedingStats.totalSessions === 0 &&
      feedingStats.totalFeedings > 0
    ) {
      alerts.push({
        type: "info",
        message: "No breastfeeding records found",
        suggestion:
          "Consider tracking breastfeeding sessions for better insights.",
      });
    }

    // Check nutritional status
    if (latestAssessment) {
      if (latestAssessment.nutritionalStatus === "UNDERWEIGHT") {
        alerts.push({
          type: "warning",
          message: "Patient is underweight",
          suggestion:
            "Consult with a nutritionist for dietary recommendations.",
        });
      } else if (latestAssessment.nutritionalStatus === "OBESE") {
        alerts.push({
          type: "warning",
          message: "Weight management concern detected",
          suggestion: "Review dietary habits and physical activity.",
        });
      } else if (latestAssessment.nutritionalStatus === "NORMAL") {
        alerts.push({
          type: "success",
          message: "Normal nutritional status maintained",
          suggestion: "Continue with current healthy habits.",
        });
      }
    }

    return {
      feedingStats,
      breastfeedingStats,
      latestAssessment,
      recentFeedings: feedingLogs.logs,
      alerts,
    };
  },

  /**
   * Get clinic-wide nutrition statistics (for admin dashboard)
   */
  async getClinicNutritionStats(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const feedingLogs = await db.query.feedingLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      with: {
        patient: {
          where: { clinicId },
        },
      },
    });

    // Filter by clinic through patient relation
    const clinicLogs = feedingLogs.filter(
      (log) => log.patient?.clinicId === clinicId,
    );

    // Calculate summary statistics
    const byType: Record<string, number> = {};
    let totalDuration = 0;
    let totalAmount = 0;
    const uniquePatients = new Set<string>();

    for (const log of clinicLogs) {
      byType[log.type] = (byType[log.type] || 0) + 1;
      totalDuration += log.duration || 0;
      totalAmount += log.amount || 0;
      uniquePatients.add(log.patientId);
    }

    return {
      totalFeedings: clinicLogs.length,
      uniquePatients: uniquePatients.size,
      byType,
      averageDuration:
        clinicLogs.length > 0 ? totalDuration / clinicLogs.length : 0,
      totalAmount,
    };
  },
};

// ============================================
// NUTRITION REPORTING QUERIES
// ============================================

export const nutritionReportingQueries = {
  /**
   * Generate feeding report for a patient
   */
  async generateFeedingReport(patientId: string, clinicId: string, days = 30) {
    const stats = await feedingLogQueries.getStats(patientId, clinicId, days);
    const breastfeedingStats = await feedingLogQueries.getBreastfeedingStats(
      patientId,
      clinicId,
      days,
    );

    return {
      period: { days },
      generatedAt: new Date(),
      patientId,
      summary: {
        totalFeedings: stats.totalFeedings,
        averageDaily:
          stats.feedingsByDay.length > 0
            ? stats.totalFeedings / stats.feedingsByDay.length
            : 0,
        mostCommonType:
          Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "none",
      },
      breastfeeding: breastfeedingStats,
      dailyBreakdown: stats.feedingsByDay,
    };
  },

  /**
   * Compare nutrition across multiple patients
   */
  async comparePatients(patientIds: string[], clinicId: string, days = 30) {
    const results = await Promise.all(
      patientIds.map(async (patientId) => {
        const stats = await feedingLogQueries.getStats(
          patientId,
          clinicId,
          days,
        );
        const latestAssessment =
          await nutritionAssessmentQueries.getLatestAssessment(
            patientId,
            clinicId,
          );
        return {
          patientId,
          totalFeedings: stats.totalFeedings,
          averageDaily:
            stats.feedingsByDay.length > 0
              ? stats.totalFeedings / stats.feedingsByDay.length
              : 0,
          nutritionalStatus: latestAssessment?.nutritionalStatus || "unknown",
        };
      }),
    );

    return results;
  },
};

export const queries = {
  user: userQueries,
  clinic: clinicQueries,
  doctor: doctorQueries,
  patient: patientQueries,
  appointment: appointmentQueries,
  medicalRecord: medicalRecordQueries,
  inventory: inventoryQueries,
  billing: billingQueries,
  notification: notificationQueries,
  search: searchQueries,
  vaccine: vaccineQueries,
  labTest: labTestQueries,
  pediatric: pediatricQueries,
  reporting: reportingQueries,
  prescription: prescriptionQueries,
  service: serviceQueries,
  growth: growthQueries,
  encounter: encounterQueries,
  vitalSign: {
    ...vitalSignQueries,
    getTrend: encounterQueries.getTrendData,
    list: vitalSignQueries.getVitalSigns,
    getByMedicalRecord: vitalSignQueries.getVitalSignsByMedicalRecord,
    getLatest: vitalSignQueries.getLatestVitalSigns,
    getById: vitalSignQueries.getVitalSignById,
  },
  // Helper functions
  checkVitalSignsAccess,
  checkDoctorAccess,
};
