// Additional stores not yet refactored
import { Store } from "@tanstack/store";

import type {
  DbAppointment,
  DbDoctor,
  DbGuardian,
  DbPayment,
  DbPrescription,
  DbService,
  DbStaff,
} from "#/db/schema";

import type { FilterState, PaginationState } from "../types/store";
import { toNumber } from "../utils";
import { adminStore, initialAdminState } from "./admin.store";
import { appointmentStore } from "./appointment.store";
import { authStore, initialAuthState } from "./auth.store";
import { growthStore } from "./growth.store";
// Import from index for derived stores
import { notificationStore } from "./notification.store";
import { patientsStore, selectedPatientStore } from "./patient.store";
import { medicalRecordStore } from "./record.store";
import { initialUIState, uiStore } from "./ui.store";

export const doctorsStore = new Store<DbDoctor[]>([]);
export const selectedDoctorStore = new Store<DbDoctor | null>(null);
export const doctorsPaginationStore = new Store<PaginationState>({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
export const doctorsFiltersStore = new Store<FilterState>({
  search: "",
  status: "ACTIVE",
  clinicId: undefined,
});

export const staffStore = new Store<DbStaff[]>([]);
export const selectedStaffStore = new Store<DbStaff | null>(null);

export const servicesStore = new Store<DbService[]>([]);
export const selectedServiceStore = new Store<DbService | null>(null);

export const guardiansStore = new Store<DbGuardian[]>([]);

export const paymentsStore = new Store<DbPayment[]>([]);
export const selectedPaymentStore = new Store<DbPayment | null>(null);

export const prescriptionsStore = new Store<DbPrescription[]>([]);
export const selectedPrescriptionStore = new Store<DbPrescription | null>(null);

export const selectedPatientUpcomingAppointmentsStore = new Store<
  DbAppointment[]
>([]);

// Monthly revenue calculation

function updateMonthlyRevenue() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = paymentsStore.state
    .filter((p) => {
      const paymentDate = p.paymentDate ? new Date(p.paymentDate) : null;
      return (
        paymentDate &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        p.status === "PAID"
      );
    })
    .reduce((sum, p) => sum + (toNumber(p.totalAmount) || 0), 0);

  monthlyRevenueStore.setState(() => monthlyTotal);
}

// Subscribe to payment changes
paymentsStore.subscribe(() => updateMonthlyRevenue());

export const dashboardActions = {
  updateDashboardStats: () => {
    const patients = patientsStore.state.patients;
    const activeCount = patients.filter(
      (p) => p.isActive && !p.isDeleted,
    ).length;
    const totalCount = patients.filter((p) => !p.isDeleted).length;

    activePatientsCountStore.setState(() => activeCount);
    totalPatientsCountStore.setState(() => totalCount);
  },
};

// Derived stores for dashboard
export const activePatientsCountStore = new Store<number>(0);
export const totalPatientsCountStore = new Store<number>(0);
export const monthlyRevenueStore = new Store<number>(0);

// Reset all stores (for logout)
export const resetAllStores = () => {
  authStore.setState(() => initialAuthState);
  uiStore.setState(() => initialUIState);
  adminStore.setState(() => initialAdminState);
  patientsStore.setState(() => ({
    ...patientsStore.state,
    patients: [],
    selectedPatient: null,
  }));
  selectedPatientStore.setState(() => null);
  appointmentStore.setState(() => appointmentStore.state);
  medicalRecordStore.setState(() => medicalRecordStore.state);
  growthStore.setState(() => growthStore.state);
  notificationStore.setState(() => notificationStore.state);
  doctorsStore.setState(() => []);
  selectedDoctorStore.setState(() => null);
  staffStore.setState(() => []);
  selectedStaffStore.setState(() => null);
  servicesStore.setState(() => []);
  selectedServiceStore.setState(() => null);
  guardiansStore.setState(() => []);
  paymentsStore.setState(() => []);
  selectedPaymentStore.setState(() => null);
  prescriptionsStore.setState(() => []);
  selectedPrescriptionStore.setState(() => null);
};

// Initialize all stores
export const initializeAllStores = () => {
  if (typeof window === "undefined") return;

  // Load dark mode preference
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    uiStore.setState((state) => ({ ...state, darkMode: true }));
    document.documentElement.classList.add("dark");
  }

  // Load auth token
  const token = localStorage.getItem("token");
  if (token) {
    authStore.setState((state) => ({ ...state, token }));
  }

  // Initialize notification SSE
  import("./notification.store").then(({ initializeNotificationStore }) => {
    initializeNotificationStore();
  });
};

// Auto-initialize on import (only on client)
if (typeof window !== "undefined") {
  initializeAllStores();
}

// Subscribe to patient changes to update dashboard
patientsStore.subscribe(() => {
  dashboardActions.updateDashboardStats();
});

// Subscribe to selected patient to update their upcoming appointments
selectedPatientStore.subscribe(() => {
  const patient = selectedPatientStore.state;
  if (!patient) return;

  const upcomingAppointments = appointmentStore.state.appointments
    .filter(
      (a) =>
        a.patientId === patient.id &&
        new Date(a.appointmentDate) > new Date() &&
        (a.status === "CONFIRMED" || a.status === "PENDING"),
    )
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
    )
    .slice(0, 5);

  selectedPatientUpcomingAppointmentsStore.setState(() => upcomingAppointments);
});

// Subscribe to appointments to update patient-specific lists
appointmentStore.subscribe(() => {
  const patient = selectedPatientStore.state;
  if (!patient) return;

  const upcomingAppointments = appointmentStore.state.appointments
    .filter(
      (a) =>
        a.patientId === patient.id &&
        new Date(a.appointmentDate) > new Date() &&
        (a.status === "CONFIRMED" || a.status === "PENDING"),
    )
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
    )
    .slice(0, 5);

  selectedPatientUpcomingAppointmentsStore.setState(() => upcomingAppointments);
});
