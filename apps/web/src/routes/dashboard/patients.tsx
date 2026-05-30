// routes/dashboard/patients.tsx — layout wrapper for /dashboard/patients/*
// The patient list lives in patients/index.tsx, new patient in patients/new.tsx

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/patients")({
  component: Outlet,
});
