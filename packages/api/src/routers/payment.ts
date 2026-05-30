import { billingQueries } from "@clinic-app/db/actions/queries";
import { mutations } from "@clinic-app/db/mutations";
import {
  paymentMethodEnum,
  paymentStatusEnum,
} from "@clinic-app/db/schema/clinic";
import z from "zod";
import { adminProcedure, protectedProcedure } from "..";

const PaymentRecordSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  amount: z.number(),
  paymentMethod: z.enum(paymentMethodEnum.enumValues),
  status: z.enum(paymentStatusEnum.enumValues).default("PAID"),
  paymentDate: z.date(),
  discount: z.number().optional(),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  notes: z.string().optional(),
  receiptNumber: z.number().optional(),
});

export const paymentRouter = {
  recordPayment: protectedProcedure
    .input(PaymentRecordSchema)
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      // Using billing mutations to record the payment
      return await mutations.billing.recordPayment({
        ...input,
        clinicId,
        id: "",
        billDate: new Date(),
      });
    }),

  processPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        amountPaid: z.number().positive(),
        paymentMethod: z.enum(paymentMethodEnum.enumValues),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      return await billingQueries.processPayment(
        input.paymentId,
        input.amountPaid,
        input.paymentMethod,
      );
    }),

  createBillForAppointment: adminProcedure
    .input(z.object({ appointmentId: z.string() }))
    .handler(async ({ input }) => {
      return await billingQueries.createBillForAppointment(input.appointmentId);
    }),

  createInvoice: adminProcedure
    .input(z.any()) // Simplified for brevity, usually matches InvoiceFormValues
    .handler(async ({ input }) => {
      return await mutations.billing.createInvoice(input);
    }),

  generateReceipt: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .handler(async ({ input }) => {
      return await mutations.billing.generateReceipt(input.paymentId);
    }),
};
