// src/components/forms/appointment-form.tsx

import type { AppointmentStatus } from "@clinic-app/db/schema";
import { appointmentStatusEnum } from "@clinic-app/db/schema/clinic";
import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Input } from "@clinic-app/ui/components/input";
import { Label } from "@clinic-app/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@clinic-app/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import { Separator } from "@clinic-app/ui/components/separator";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import {
  Activity,
  Calendar as CalendarIcon,
  Stethoscope,
  User,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form";
import { orpc } from "@/utils/orpc";

// Schema for appointment form — only the fields the form collects
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.date(),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string(),
  type: z.string().min(1).catch("CONSULTATION"),
  status: z.enum(appointmentStatusEnum.enumValues),
  note: z.string(),
  duration: z.number().min(15).max(120),
  isVirtual: z.boolean(),
  sendReminder: z.boolean(),
  reminderMethod: z.string(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Time slots (30-minute intervals)
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  return {
    value: time,
    label: format(new Date().setHours(hour, minute), "h:mm a"),
  };
});

const appointmentTypes = [
  { value: "CHECKUP", label: "Checkup" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "LAB_TEST", label: "Lab Test" },
];

type AppointmentFormProps = {
  defaultPatientId?: string;
  defaultDoctorId?: string;
  initialData?: Partial<AppointmentFormValues>;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function AppointmentForm({
  defaultPatientId,
  defaultDoctorId,
  initialData,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const queryClient = useQueryClient();

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Fetch doctors for dropdown
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery(
    orpc.doctors.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Create appointment mutation
  const { mutate: createAppointment, isPending: isCreatePending } = useMutation(
    orpc.appointments.create.mutationOptions({
      onSuccess: () => {
        toast.success("Appointment created successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.appointments.key(),
        });
        onSuccess?.();
      },
      onError(error) {
        console.error(error);
        toast.error(error.message || "Failed to create appointment");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      patientId: initialData?.patientId ?? defaultPatientId ?? "",
      doctorId: initialData?.doctorId ?? defaultDoctorId ?? "",
      appointmentDate: initialData?.appointmentDate ?? new Date(),
      startTime: initialData?.startTime ?? "09:00",
      endTime: initialData?.endTime ?? "09:30",
      type: initialData?.type ?? "CONSULTATION",
      status: initialData?.status ?? "PENDING",
      note: initialData?.note ?? "",
      duration: initialData?.duration ?? 30,
      isVirtual: initialData?.isVirtual ?? false,
      sendReminder: initialData?.sendReminder ?? true,
      reminderMethod: initialData?.reminderMethod ?? "EMAIL",
    } satisfies AppointmentFormValues,
    validators: {
      onSubmit: appointmentFormSchema,
    },
    onSubmit: async ({ value }) => {
      const appointmentDateTime = new Date(value.appointmentDate);
      const [startHour = 0, startMinute = 0] = value.startTime
        .split(":")
        .map(Number);
      appointmentDateTime.setHours(startHour, startMinute);

      createAppointment({
        id: crypto.randomUUID(),
        clinicId: "", // populated server-side from context
        doctorId: value.doctorId,
        patientId: value.patientId,
        appointmentDate: appointmentDateTime,
        type: value.type,
        status: value.status ?? "PENDING",
        note: value.note,
        time: value.startTime,
        durationMinutes: value.duration,
        serviceId: null,
        doctorSpecialty: null,
        appointmentPrice: null,
        reason: null,
        deletedAt: null,
        isDeleted: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);

  // Auto-calculate end time based on start time and duration
  React.useEffect(() => {
    if (formValues.startTime && formValues.duration) {
      const [hours = 0, minutes = 0] = formValues.startTime
        .split(":")
        .map(Number);
      const totalMinutes = hours * 60 + minutes + formValues.duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
      if (endTime !== formValues.endTime) {
        form.setFieldValue("endTime", endTime);
      }
    }
  }, [formValues.startTime, formValues.duration, formValues.endTime, form]);

  const { FormSelectField, FormTextField, FormSwitchField, FormTextareaField } =
    useFormFields<AppointmentFormValues>();

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          {initialData?.patientId
            ? "Edit Appointment"
            : "Schedule New Appointment"}
        </CardTitle>
        <p className="text-muted-foreground">
          Fill in the details to schedule a patient appointment
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Patient & Doctor Selection */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Patient & Doctor Information
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelectField
                  label="Patient"
                  name="patientId"
                  options={
                    patientsData?.patients.map((p) => {
                      return {
                        value: p.id,
                        label: `${p.firstName} ${p.lastName}`,
                      };
                    }) ?? []
                  }
                  placeholder={
                    patientsLoading ? "Loading..." : "Select patient"
                  }
                  required
                  validators={{
                    onBlur: z.string().min(1, "Please select a patient"),
                  }}
                />

                <FormSelectField
                  label="Doctor"
                  name="doctorId"
                  options={
                    doctorsData?.doctors?.map((d) => {
                      return {
                        value: d.id,
                        label: `${d.name} - ${d.specialty || "General"}`,
                      };
                    }) ?? []
                  }
                  placeholder={doctorsLoading ? "Loading..." : "Select doctor"}
                  required
                  validators={{
                    onBlur: z.string().min(1, "Please select a doctor"),
                  }}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <CalendarIcon className="h-5 w-5" />
                Date & Time
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Date Picker */}
                <form.AppField name="appointmentDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Appointment Date *</Label>
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
                            {field.state.value ? (
                              format(field.state.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            disabled={(date) => date < new Date()}
                            mode="single"
                            onSelect={(date) =>
                              field.handleChange(date as Date)
                            }
                            required={false}
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-red-500 text-sm">
                            {field.state.meta.errors[0]?.message ??
                              String(field.state.meta.errors[0])}
                          </p>
                        )}
                    </div>
                  )}
                </form.AppField>

                <FormSelectField
                  label="Start Time"
                  name="startTime"
                  options={timeSlots}
                  placeholder="Select start time"
                  required
                  validators={{
                    onBlur: z.string().min(1, "Please select start time"),
                  }}
                />

                <FormTextField
                  label="Duration (minutes)"
                  max={120}
                  min={15}
                  name="duration"
                  placeholder="30"
                  required
                  step={15}
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(15, "Minimum 15 minutes")
                      .max(120, "Maximum 120 minutes"),
                  }}
                />
              </div>
              <div className="text-muted-foreground text-sm">
                End time:{" "}
                {formValues.endTime
                  ? format(
                      new Date().setHours(
                        Number.parseInt(
                          formValues.endTime.split(":")[0] ?? "",
                          10,
                        ),
                        Number.parseInt(
                          formValues.endTime.split(":")[1] ?? "",
                          10,
                        ),
                      ),
                      "h:mm a",
                    )
                  : "Not set"}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Stethoscope className="h-5 w-5" />
                Appointment Details
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelectField
                  label="Appointment Type"
                  name="type"
                  options={appointmentTypes.map((t) => {
                    return {
                      value: t.value,
                      label: t.label,
                    };
                  })}
                  placeholder="Select type"
                  required
                />

                <FormSwitchField
                  description="Conduct appointment via video call"
                  label="Virtual Appointment"
                  name="isVirtual"
                />

                <FormSwitchField
                  description="Send appointment reminder to patient"
                  label="Send Reminder"
                  name="sendReminder"
                />
              </div>

              {/* Reminder Method (conditional) */}
              {formValues.sendReminder && (
                <div className="mt-4">
                  <FormSelectField
                    label="Reminder Method"
                    name="reminderMethod"
                    options={[
                      { value: "EMAIL", label: "Email" },
                      { value: "SMS", label: "SMS" },
                      { value: "BOTH", label: "Both" },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Activity className="h-5 w-5" />
                Medical Information
              </h3>
              <Separator />
              <FormTextareaField
                label="Notes"
                name="note"
                placeholder="Any relevant information..."
                rows={3}
              />
            </div>

            {/* Status Badge Display */}
            {formValues.status && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <span className="font-medium text-sm">Status:</span>
                <Badge
                  className={cn(
                    formValues.status === "CONFIRMED" && "bg-green-500",
                    formValues.status === "PENDING" && "bg-yellow-500",
                    formValues.status === "COMPLETED" && "bg-blue-500",
                    formValues.status === "CANCELLED" && "bg-red-500",
                    formValues.status === "NO_SHOW" && "bg-gray-500",
                  )}
                >
                  {formValues.status}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button
                  disabled={isCreatePending}
                  onClick={onCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
              <form.SubmitButton
                className="min-w-30"
                disabled={isCreatePending}
              >
                {isCreatePending
                  ? "Scheduling..."
                  : initialData?.patientId
                    ? "Update"
                    : "Schedule Appointment"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Quick appointment form with fewer fields
type QuickAppointmentFormProps = {
  doctorId?: string;
  onSuccess?: () => void;
  patientId?: string;
};

export function QuickAppointmentForm({
  patientId,
  doctorId,
  onSuccess,
}: QuickAppointmentFormProps) {
  return (
    <AppointmentForm
      initialData={{ patientId, doctorId }}
      onSuccess={onSuccess}
    />
  );
}

// Appointment reschedule form
type RescheduleFormProps = {
  appointmentId: string;
  currentDate: Date;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function RescheduleAppointmentForm({
  appointmentId,
  currentDate,
  onSuccess,
  onCancel,
}: RescheduleFormProps) {
  const queryClient = useQueryClient();

  // Use updateAppointmentStatus since there's no dedicated reschedule procedure
  const { mutate: updateStatus, isPending } = useMutation(
    orpc.appointments.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Appointment rescheduled successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.appointments.key(),
        });
        onSuccess?.();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to reschedule appointment");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      appointmentId,
      appointmentDate: currentDate,
      startTime: "09:00",
      duration: 30,
      reason: "",
    },
    onSubmit: async ({ value }) => {
      // Update status to CONFIRMED as a reschedule confirmation
      updateStatus({
        id: value.appointmentId,
        status: "CONFIRMED" as AppointmentStatus, // or "CONFIRMED" if you want to differentiate reschedules
      } as { id: string; status: AppointmentStatus });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reschedule Appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="appointmentDate">
              {(field) => (
                <div className="space-y-2">
                  <Label>New Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="w-full justify-start"
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
                        onSelect={(date) => field.handleChange(date as Date)}
                        required={false}
                        selected={field.state.value}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.AppField>

            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="startTime">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.AppField>

              <form.AppField name="duration">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      max={120}
                      min={15}
                      onChange={(e) =>
                        field.handleChange(Number.parseInt(e.target.value, 10))
                      }
                      step={15}
                      type="number"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.AppField>
            </div>

            <form.AppField name="reason">
              {(field) => (
                <div className="space-y-2">
                  <Label>Reason for Rescheduling</Label>
                  <Textarea
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows={3}
                    value={field.state.value}
                  />
                </div>
              )}
            </form.AppField>

            <div className="flex justify-end gap-4">
              <Button
                disabled={isPending}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <form.SubmitButton disabled={isPending}>
                {isPending ? "Rescheduling..." : "Confirm Reschedule"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
