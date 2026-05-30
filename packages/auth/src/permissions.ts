import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  patient: ["create", "update", "read", "delete"],
  doctor: ["create", "update", "read", "delete"],
  record: ["create", "update", "read", "delete"],
  appointment: ["create", "update", "read", "delete"], // Fixed typo
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements,
  patient: ["create", "update", "read", "delete"],
  doctor: ["create", "update", "read", "delete"],
  record: ["create", "update", "read", "delete"],
  appointment: ["create", "update", "read", "delete"],
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
});

export const doctor = ac.newRole({
  patient: ["create", "update", "read", "delete"],
  doctor: ["create", "update", "read", "delete"],
  record: ["create", "update", "read", "delete"],
  appointment: ["create", "update", "read"],
  user: ["list", "impersonate", "delete", "set-password"],
  session: ["list", "revoke", "delete"],
  folder: ["read", "delete"],
  file: ["read", "delete", "download"],
});

export const staff = ac.newRole({
  patient: ["create", "update", "read"],
  doctor: ["read"], // Doctors shouldn't create other doctors
  record: ["create", "update", "read"],
  appointment: ["create", "update", "read"],
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
});

// export const user = ac.newRole({
// 	patient: ["read"],
// 	doctor: ["read"],
// 	record: ["read"],
// 	appointment: ["read"],
// 	folder: ["create", "read", "update", "delete", "share", "move"],
// 	file: ["create", "read", "update", "delete", "share", "move", "download"]
// });

export const patient = ac.newRole({
  patient: ["read"], // Patients can only read their own data
  doctor: ["read"],
  record: ["read"], // Patients can only read their own records
  appointment: ["create", "read"], // Patients can create appointments
  folder: ["create", "read", "update", "delete"],
  file: ["create", "read", "update", "delete", "download"],
});

export const roles = {
  admin,
  doctor,
  staff,
  patient,
};

// Export UserRole type for React components
export type UserRole = keyof typeof roles;

// Export role names as constants for easier use in components
export const ROLE_NAMES = {
  ADMIN: "admin" as const,
  DOCTOR: "doctor" as const,
  STAFF: "staff" as const,
  PATIENT: "patient" as const,
} as const;
