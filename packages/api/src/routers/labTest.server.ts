// src/orpc/router/lab-test.ts

import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { generateId } from "@clinic-app/utils/id";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const LabTestSchema = z.object({
  id: z.string(),
  patientId: z.string().nullable(),
  recordId: z.string(),
  serviceId: z.string(),
  testDate: z.date(),
  result: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const labTestRouter = {
  create: protectedProcedure
    .input(LabTestSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .output(LabTestSchema)
    .handler(async ({ input }) => {
      const id = generateId();
      const newTest = await mutations.labTest.create({
        ...input,
        id,
      });
      if (!newTest) throw new Error("Failed to create lab test order");
      return newTest;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(LabTestSchema.nullable())
    .handler(async ({ input }) => {
      const result = await queries.labTest.getById(input.id);
      return result ?? null;
    }),

  listByPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .output(z.array(LabTestSchema))
    .handler(async ({ input }) => {
      return await queries.labTest.getByPatientId(input.patientId);
    }),

  updateResults: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        result: z.string(),
        status: z.enum(["COMPLETED", "IN_PROGRESS"]).default("COMPLETED"),
        notes: z.string().optional(),
      }),
    )
    .output(LabTestSchema)
    .handler(async ({ input }) => {
      const updated = await mutations.labTest.update(input.id, {
        ...input,
        updatedAt: new Date(),
      });
      if (!updated) throw new Error("Lab test not found");
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.boolean())
    .handler(async ({ input }) => {
      await mutations.labTest.delete(input.id);
      return true;
    }),

  getPendingTests: protectedProcedure
    .input(z.object({ clinicId: z.string().optional() }))
    .output(z.array(LabTestSchema))
    .handler(async ({ input, context }) => {
      const clinicId = input.clinicId ?? context.clinicId ?? "";
      return await queries.labTest.getPendingByClinicId(clinicId);
    }),
};
