// src/components/forms/payment-form.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Label } from "@clinic-app/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@clinic-app/ui/components/popover";
import { Separator } from "@clinic-app/ui/components/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import {
  Banknote,
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  FileText,
  Landmark,
  Printer,
  Receipt,
  Smartphone,
  User,
  Wallet,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form";
import { orpc } from "@/utils/orpc";

// Payment Form Schema
const paymentFormSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  appointmentId: z.string().optional(),
  amount: z
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(100000, "Amount too large"),
  paymentMethod: z.enum([
    "CASH",
    "CARD",
    "INSURANCE",
    "BANK_TRANSFER",
    "MOBILE_MONEY",
  ]),
  status: z
    .enum(["PAID", "UNPAID", "PENDING", "REFUNDED", "PARTIAL"])
    .default("PAID"),
  paymentDate: z.date(),
  discount: z.number().min(0).max(100).default(0),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  sendReceipt: z.boolean().default(true),
  receiptMethod: z.enum(["EMAIL", "SMS", "BOTH"]).default("EMAIL"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Payment methods with icons
const paymentMethods = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "INSURANCE", label: "Insurance", icon: Wallet },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
];

// Receipt methods
const receiptMethods = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "BOTH", label: "Both" },
];

type PaymentFormProps = {
  initialData?: Partial<PaymentFormValues>;
  appointmentId?: string;
  patientId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
};

export function PaymentForm({
  initialData,
  appointmentId,
  patientId: presetPatientId,
  onSuccess,
  onCancel,
  readOnly = false,
}: PaymentFormProps) {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = React.useState<{
    id: string;
    patientId: string;
    appointmentDate: Date;
    amount: number;
  } | null>(null);

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "", page: 1, limit: 50 },
      enabled: !presetPatientId,
    }),
  );

  // Fetch appointments for a patient
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    ...orpc.appointments.list.queryOptions({
      input: {
        page: 1,
        limit: 50,
        patientId: presetPatientId,
        status: "COMPLETED",
      },
    }),
    enabled: !!presetPatientId,
  });

  // Create payment mutation
  const { mutate: createPayment, isPending: isCreatePending } = useMutation(
    orpc.payment.recordPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment recorded successfully");
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        queryClient.invalidateQueries({ queryKey: orpc.appointments.key() });
        queryClient.invalidateQueries({ queryKey: orpc.patient.key() });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error(error);
        toast.error(error.message || "Failed to process payment");
      },
    }),
  );

  // Generate receipt mutation
  const { mutate: _generateReceipt, isPending: isReceiptPending } = useMutation(
    {
      mutationFn: async (paymentId: string) => {
        const response = await fetch(`/api/payments/${paymentId}/receipt`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to generate receipt");
        return response.json();
      },
      onSuccess: (data) => {
        toast.success("Receipt generated");
        if (data.url) {
          window.open(data.url, "_blank");
        }
      },
      onError: () => {
        toast.error("Failed to generate receipt");
      },
    },
  );

  const [activePatientId, setActivePatientId] = React.useState<string>(
    initialData?.patientId ?? presetPatientId ?? "",
  );

  // Stable default receipt number
  const defaultReceiptNumber = React.useMemo(() => `INV-${Date.now()}`, []);

  const form = useAppForm({
    defaultValues: {
      patientId: initialData?.patientId ?? presetPatientId ?? "",
      appointmentId: initialData?.appointmentId ?? appointmentId ?? "",
      amount: initialData?.amount ?? 0,
      paymentMethod: initialData?.paymentMethod ?? "CASH",
      status: initialData?.status ?? "PAID",
      paymentDate: initialData?.paymentDate ?? new Date(),
      discount: initialData?.discount ?? 0,
      insuranceProvider: initialData?.insuranceProvider ?? "",
      insuranceId: initialData?.insuranceId ?? "",
      notes: initialData?.notes ?? "",
      receiptNumber: initialData?.receiptNumber ?? defaultReceiptNumber,
      sendReceipt: initialData?.sendReceipt ?? true,
      receiptMethod: initialData?.receiptMethod ?? "EMAIL",
    } satisfies PaymentFormValues,
    validators: {},
    onSubmit: async ({ value }) => {
      // Calculate final amount after discount
      const finalAmount = value.amount * (1 - value.discount / 100);
      if (value.patientId !== activePatientId) {
        setActivePatientId(value.patientId);
      }

      createPayment({
        ...value,
        amount: finalAmount,
        receiptNumber: Number(value.receiptNumber) || 0,
        paymentDate: value.paymentDate,
      });
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);

  // Sync local state for queries when form value changes
  React.useEffect(() => {
    if (formValues.patientId !== activePatientId) {
      setActivePatientId(formValues.patientId);
    }
  }, [formValues.patientId, activePatientId]);

  // Auto-fill amount when appointment is selected
  React.useEffect(() => {
    if (formValues.appointmentId && appointmentsData?.appointments) {
      const appointment = appointmentsData.appointments.find(
        (a) => a.id === formValues.appointmentId,
      );
      if (appointment && appointment.appointmentPrice !== formValues.amount) {
        form.setFieldValue("amount", appointment.appointmentPrice ?? 0);
        setSelectedAppointment({
          id: appointment.id,
          patientId: appointment.patientId,
          appointmentDate: appointment.appointmentDate,
          amount: appointment.appointmentPrice ?? 0,
        });
      }
    }
  }, [formValues.appointmentId, appointmentsData, form, formValues.amount]);

  const { FormSelectField, FormTextField, FormTextareaField, FormSwitchField } =
    useFormFields<PaymentFormValues>();

  const patients = patientsData?.patients ?? [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const finalAmount =
    formValues.amount * (1 - (formValues.discount || 0) / 100);

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <Receipt className="h-6 w-6" />
          {initialData?.receiptNumber ? "Edit Payment" : "Process Payment"}
        </CardTitle>
        <p className="text-muted-foreground">
          Record payment and generate receipt for patient
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Patient & Appointment Selection */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Payment Information
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {presetPatientId ? (
                  <FormTextField
                    label="Patient ID"
                    name="patientId"
                    type="text"
                  />
                ) : (
                  <FormSelectField
                    label="Patient"
                    name="patientId"
                    options={patients.map((p) => ({
                      value: p.id,
                      label: `${p.firstName} ${p.lastName}`,
                    }))}
                    placeholder={
                      patientsLoading ? "Loading..." : "Select patient"
                    }
                    required
                    validators={{
                      onBlur: z.string().min(1, "Please select a patient"),
                    }}
                  />
                )}

                <FormSelectField
                  disabled={readOnly || !formValues.patientId}
                  label="Appointment (Optional)"
                  name="appointmentId"
                  options={
                    appointmentsData?.appointments?.map((a) => ({
                      value: a.id,
                      label: `${format(new Date(a.appointmentDate), "MMM dd, yyyy")} - ${formatCurrency(a.appointmentPrice ?? 0)}`,
                    })) ?? []
                  }
                  placeholder={
                    appointmentsLoading
                      ? "Loading appointments..."
                      : !formValues.patientId
                        ? "Select patient first"
                        : "Select appointment (optional)"
                  }
                />
              </div>

              {selectedAppointment && (
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="font-medium text-sm">
                        Selected Appointment:
                      </span>
                      <p className="text-muted-foreground text-sm">
                        {format(selectedAppointment.appointmentDate, "PPP")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">
                        Appointment Amount:
                      </span>
                      <p className="font-semibold">
                        {formatCurrency(selectedAppointment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <DollarSign className="h-5 w-5" />
                Payment Details
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  disabled={readOnly}
                  label="Amount"
                  min={0.01}
                  name="amount"
                  placeholder="0.00"
                  required
                  step={0.01}
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(0.01, "Amount must be greater than 0"),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Discount (%)"
                  max={100}
                  min={0}
                  name="discount"
                  placeholder="0"
                  step={1}
                  type="number"
                />

                <FormSelectField
                  disabled={readOnly}
                  label="Payment Method"
                  name="paymentMethod"
                  options={paymentMethods.map((m) => ({
                    value: m.value,
                    label: m.label,
                  }))}
                  placeholder="Select payment method"
                  required
                />

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <form.AppField name="paymentDate">
                    {(field) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.state.value && "text-muted-foreground",
                            )}
                            disabled={readOnly}
                            variant="outline"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.state.value
                              ? format(field.state.value, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={(date) =>
                              date && field.handleChange(date)
                            }
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </form.AppField>
                </div>

                <FormTextField
                  disabled={readOnly}
                  label="Receipt Number"
                  name="receiptNumber"
                  placeholder="INV-0001"
                />

                <FormSelectField
                  disabled={readOnly}
                  label="Payment Status"
                  name="status"
                  options={[
                    { value: "PAID", label: "Paid" },
                    { value: "PARTIAL", label: "Partial" },
                    { value: "PENDING", label: "Pending" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                />
              </div>

              {/* Amount Summary */}
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(formValues.amount)}</span>
                  </div>
                  {formValues.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formValues.discount}%):</span>
                      <span>
                        -
                        {formatCurrency(
                          formValues.amount * (formValues.discount / 100),
                        )}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insurance Information (conditional) */}
            {formValues.paymentMethod === "INSURANCE" && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-lg">
                  <Wallet className="h-5 w-5" />
                  Insurance Information
                </h3>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField
                    disabled={readOnly}
                    label="Insurance Provider"
                    name="insuranceProvider"
                    placeholder="e.g., Blue Cross, Medicare"
                  />
                  <FormTextField
                    disabled={readOnly}
                    label="Insurance ID / Policy Number"
                    name="insuranceId"
                    placeholder="Policy number"
                  />
                </div>
              </div>
            )}

            {/* Receipt Settings */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Printer className="h-5 w-5" />
                Receipt Settings
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSwitchField
                  disabled={readOnly}
                  description="Send receipt to patient"
                  label="Send Receipt"
                  name="sendReceipt"
                />

                {formValues.sendReceipt && (
                  <FormSelectField
                    disabled={readOnly}
                    label="Receipt Delivery Method"
                    name="receiptMethod"
                    options={receiptMethods}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <FileText className="h-5 w-5" />
                Additional Notes
              </h3>
              <Separator />
              <FormTextareaField
                disabled={readOnly}
                label="Notes"
                name="notes"
                placeholder="Any additional notes about this payment..."
                rows={3}
              />
            </div>

            {/* Status Display */}
            {initialData?.status && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <span className="font-medium text-sm">Payment Status:</span>
                <Badge
                  className={cn(
                    initialData.status === "PAID" && "bg-green-500",
                    initialData.status === "PARTIAL" && "bg-yellow-500",
                    initialData.status === "PENDING" && "bg-blue-500",
                    initialData.status === "REFUNDED" && "bg-red-500",
                  )}
                >
                  {initialData.status}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button
                  disabled={isCreatePending || isReceiptPending}
                  onClick={onCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
              {!readOnly && (
                <form.SubmitButton
                  className="min-w-30"
                  disabled={isCreatePending}
                >
                  {isCreatePending ? "Processing..." : "Process Payment"}
                </form.SubmitButton>
              )}
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Quick payment form for checkout
type QuickPaymentFormProps = {
  amount: number;
  patientId: string;
  appointmentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function QuickPaymentForm({
  amount,
  patientId,
  appointmentId,
  onSuccess,
  onCancel,
}: QuickPaymentFormProps) {
  return (
    <PaymentForm
      initialData={{ amount, patientId, appointmentId }}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
}

// Invoice Form
const invoiceFormSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  appointmentIds: z.array(z.string()).min(1, "Select at least one appointment"),
  invoiceDate: z.date(),
  dueDate: z.date(),
  notes: z.string().optional(),
  applyDiscount: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  sendToPatient: z.boolean().default(true),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type InvoiceFormProps = {
  patientId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function InvoiceForm({
  patientId: presetPatientId,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const queryClient = useQueryClient();

  // Fetch patient
  const { data: patientData, isLoading: patientLoading } = useQuery({
    ...orpc.patient.get.queryOptions({
      input: { id: presetPatientId ?? "" },
    }),
    enabled: !!presetPatientId,
  });

  // Fetch unpaid appointments for patient
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    ...orpc.appointments.list.queryOptions({
      input: {
        page: 1,
        limit: 100,
        patientId: patientData?.id,
        status: "COMPLETED",
      },
    }),
    enabled: !!patientData?.id,
  });

  // Create invoice mutation
  const { mutate: createInvoice, isPending } = useMutation(
    orpc.payment.createInvoice.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice created successfully");
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        onSuccess?.();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to create invoice");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      patientId: presetPatientId ?? "",
      appointmentIds: [] as string[],
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "",
      applyDiscount: false,
      discountPercentage: 0,
      discountAmount: 0,
      taxRate: 0,
      sendToPatient: true,
    } satisfies InvoiceFormValues,
    validators: {},
    onSubmit: async ({ value }) => {
      createInvoice(value);
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);

  // Calculate totals
  const selectedAppointments =
    appointmentsData?.appointments?.filter((a) =>
      formValues.appointmentIds.includes(a.id),
    ) ?? [];

  const subtotal = selectedAppointments.reduce(
    (sum: number, a) => sum + (a.appointmentPrice ?? 0),
    0,
  );

  const discountValue = formValues.applyDiscount
    ? formValues.discountAmount > 0
      ? formValues.discountAmount
      : subtotal * (formValues.discountPercentage / 100)
    : 0;

  const taxAmount = (subtotal - discountValue) * (formValues.taxRate / 100);
  const total = subtotal - discountValue + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const { FormSelectField, FormTextareaField, FormSwitchField, FormTextField } =
    useFormFields<InvoiceFormValues>();

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <FileText className="h-6 w-6" />
          Create Invoice
        </CardTitle>
        <p className="text-muted-foreground">
          Generate an invoice for patient appointments
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Patient Information
              </h3>
              <Separator />
              {patientLoading ? (
                <div>Loading patient information...</div>
              ) : patientData ? (
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-sm">Patient Name</div>
                      <div>
                        {patientData.firstName} {patientData.lastName}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Email</div>
                      <div>{patientData.email || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Phone</div>
                      <div>{patientData.phone || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="font-medium text-sm">MRN</div>
                      <div>{patientData.mrn || "Not assigned"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <FormSelectField
                  label="Patient"
                  name="patientId"
                  options={[]}
                  placeholder="Select patient"
                  required
                />
              )}
            </div>

            {/* Invoice Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <CalendarIcon className="h-5 w-5" />
                Invoice Details
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Invoice Date *</Label>
                  <form.AppField name="invoiceDate">
                    {(field) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.state.value && "text-muted-foreground",
                            )}
                            variant="outline"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.state.value
                              ? format(field.state.value, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={(date) =>
                              date && field.handleChange(date)
                            }
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </form.AppField>
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <form.AppField name="dueDate">
                    {(field) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.state.value && "text-muted-foreground",
                            )}
                            variant="outline"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.state.value
                              ? format(field.state.value, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            disabled={(date) => date < new Date()}
                            mode="single"
                            onSelect={(date) =>
                              date && field.handleChange(date)
                            }
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </form.AppField>
                </div>
              </div>
            </div>

            {/* Appointments Selection */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Receipt className="h-5 w-5" />
                Appointments to Invoice
              </h3>
              <Separator />

              {appointmentsLoading ? (
                <div>Loading appointments...</div>
              ) : (
                <form.AppField name="appointmentIds">
                  {(field) => {
                    const selectedIds = field.state.value || [];
                    const appointments = appointmentsData?.appointments ?? [];

                    if (appointments.length === 0) {
                      return (
                        <div className="py-8 text-center text-muted-foreground">
                          <Receipt className="mx-auto mb-2 h-12 w-12 opacity-50" />
                          <p>No unpaid appointments found for this patient</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {appointments.map((appointment) => (
                          <button
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                              selectedIds.includes(appointment.id)
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50",
                            )}
                            key={appointment.id}
                            type="button"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (selectedIds.includes(appointment.id)) {
                                  field.handleChange(
                                    selectedIds.filter(
                                      (id: string) => id !== appointment.id,
                                    ),
                                  );
                                } else {
                                  field.handleChange([
                                    ...selectedIds,
                                    appointment.id,
                                  ]);
                                }
                              }
                            }}
                            onClick={() => {
                              if (selectedIds.includes(appointment.id)) {
                                field.handleChange(
                                  selectedIds.filter(
                                    (id: string) => id !== appointment.id,
                                  ),
                                );
                              } else {
                                field.handleChange([
                                  ...selectedIds,
                                  appointment.id,
                                ]);
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium">
                                {format(
                                  new Date(appointment.appointmentDate),
                                  "PPP",
                                )}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                Dr. {appointment.doctor?.name} -{" "}
                                {appointment.type}
                              </div>
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(
                                appointment.appointmentPrice ?? 0,
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  }}
                </form.AppField>
              )}
            </div>

            {/* Discount & Tax */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <DollarSign className="h-5 w-5" />
                Discount & Tax
              </h3>
              <Separator />

              <FormSwitchField label="Apply Discount" name="applyDiscount" />

              {formValues.applyDiscount && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField
                    label="Discount Percentage (%)"
                    max={100}
                    min={0}
                    name="discountPercentage"
                    step={1}
                    type="number"
                  />
                  <FormTextField
                    label="Discount Amount"
                    min={0}
                    name="discountAmount"
                    step={0.01}
                    type="number"
                  />
                </div>
              )}

              <FormTextField
                label="Tax Rate (%)"
                max={100}
                min={0}
                name="taxRate"
                step={0.1}
                type="number"
              />
            </div>

            {/* Invoice Summary */}
            {formValues.appointmentIds.length > 0 && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-lg">
                  <DollarSign className="h-5 w-5" />
                  Invoice Summary
                </h3>
                <Separator />
                <div className="rounded-lg bg-muted p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountValue > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(discountValue)}</span>
                      </div>
                    )}
                    {formValues.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tax ({formValues.taxRate}%):
                        </span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <FormTextareaField
              label="Invoice Notes"
              name="notes"
              placeholder="Any additional notes or payment instructions..."
              rows={3}
            />

            {/* Delivery Options */}
            <FormSwitchField
              description="Send invoice to patient via email/SMS"
              label="Send Invoice to Patient"
              name="sendToPatient"
            />

            {/* Actions */}
            <Separator />
            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button
                  disabled={isPending}
                  onClick={onCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
              <form.SubmitButton disabled={isPending}>
                {isPending ? "Creating..." : "Create Invoice"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Receipt Viewer Component
type ReceiptViewerProps = {
  paymentId: string;
  onClose?: () => void;
};

export function ReceiptViewer({
  paymentId,
  onClose: _onClose,
}: ReceiptViewerProps) {
  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const response = await fetch(`/api/payments/${paymentId}`);
      if (!response.ok) throw new Error("Failed to fetch payment");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Loading receipt...
        </CardContent>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          Payment not found
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-2xl">Payment Receipt</CardTitle>
        <p className="text-muted-foreground">
          Receipt #{payment.receiptNumber}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between border-b pb-4">
          <div>
            <p className="font-medium">Patient:</p>
            <p>
              {payment.patient?.firstName} {payment.patient?.lastName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">Date:</p>
            <p>{format(new Date(payment.paymentDate), "PPP")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span className="font-bold">
              {formatCurrency(payment.amountPaid ?? payment.amount)}
            </span>
          </div>
          {payment.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(payment.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">
              {payment.paymentMethod?.toLowerCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <Badge
              className={cn(
                payment.status === "PAID" && "bg-green-500",
                payment.status === "PARTIAL" && "bg-yellow-500",
              )}
            >
              {payment.status}
            </Badge>
          </div>
        </div>

        {payment.notes && (
          <>
            <Separator />
            <div>
              <p className="font-medium">Notes:</p>
              <p className="text-muted-foreground text-sm">{payment.notes}</p>
            </div>
          </>
        )}

        <Separator />
        <div className="text-center text-muted-foreground text-sm">
          <p>Thank you for your payment!</p>
          <p>For questions, please contact the clinic.</p>
        </div>
      </CardContent>
    </Card>
  );
}
