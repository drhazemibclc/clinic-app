// src/components/forms/medical-record-form.tsx

import { MedicalRecordCreateSchema } from "@clinic-app/db/schema/zod";
import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Input } from "@clinic-app/ui/components/input";
import { Label } from "@clinic-app/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { generateId } from "@clinic-app/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import type { z } from "zod";
import { useAppForm } from "@/components/forms/tanstack-form";
import { orpc } from "@/utils/orpc";

type MedicalRecordFormValues = z.infer<typeof MedicalRecordCreateSchema>;

type MedicalRecordFormProps = {
  appointmentId?: string;
  initialData?: Partial<MedicalRecordFormValues>;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId?: string;
};

export function MedicalRecordForm({
  initialData,
  patientId,
  appointmentId,
  onSuccess,
  onCancel,
}: MedicalRecordFormProps) {
  const queryClient = useQueryClient();

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "", page: 1, pageSize: 100 },
    }),
  );

  // Create medical record mutation
  const { mutate: createRecord, isPending } = useMutation(
    orpc.record.create.mutationOptions({
      onSuccess: () => {
        toast.success("Medical record created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.record.key() });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error("Error creating medical record:", error);
        toast.error(error.message || "Failed to create medical record");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      id: generateId(),
      clinicId: initialData?.clinicId ?? "",
      patientId: patientId ?? initialData?.patientId ?? "",
      appointmentId: appointmentId ?? initialData?.appointmentId ?? "",
      doctorId: initialData?.doctorId ?? "",
      diagnosis: initialData?.diagnosis ?? "",
      notes: initialData?.notes ?? null,
      symptoms: initialData?.symptoms ?? null,
      diagnosisDate: initialData?.diagnosisDate ?? new Date(),
      treatmentPlan: initialData?.treatmentPlan ?? "",
      labRequest: initialData?.labRequest ?? null,
      medications: initialData?.medications ?? null,
      attachments: initialData?.attachments ?? null,
      createdAt: initialData?.createdAt ?? new Date(),
      updatedAt: initialData?.updatedAt ?? new Date(),
      followUpDate: initialData?.followUpDate ?? null,
      status: initialData?.status ?? "ACTIVE",
      deletedAt: initialData?.deletedAt ?? null,
      isDeleted: false,
    } as MedicalRecordFormValues,
    validators: {
      onSubmit: MedicalRecordCreateSchema,
    },
    onSubmit: async ({ value }) => {
      const record = {
        patientId: value.patientId,
        appointmentId: value.appointmentId,
        doctorId: value.doctorId,
        clinicId: value.clinicId,
        diagnosis: value.diagnosis ?? undefined,
        symptoms: value.symptoms ?? null,
        treatmentPlan: value.treatmentPlan ?? null,
        notes: value.notes ?? null,
        diagnosisDate: value.diagnosisDate,
        labRequest: value.labRequest ?? null,
        medications: value.medications ?? null,
        attachments: value.attachments ?? null,
        followUpDate: value.followUpDate ?? null,
        status: value.status,
        createdAt: value.createdAt ?? new Date(),
        updatedAt: value.updatedAt ?? new Date(),
      };
      createRecord({
        record: record as z.infer<typeof MedicalRecordCreateSchema>,
      });
    },
  });

  const patients = patientsData?.patients ?? [];

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          Create Medical Record
        </CardTitle>
        <p className="text-muted-foreground">
          Record clinical findings, diagnosis, and treatment plans.
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Patient & Appointment */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Patient Selection */}
              <form.AppField name="patientId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Patient <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      disabled={!!patientId || patientsLoading}
                      onValueChange={field.handleChange}
                      value={field.state.value ?? ""}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} (
                            {patient.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                  </div>
                )}
              </form.AppField>

              {/* Appointment ID (optional) */}
              <form.AppField name="appointmentId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Appointment (Optional)</Label>
                    <Input
                      disabled={!!appointmentId}
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Appointment ID"
                      value={field.state.value ?? ""}
                    />
                  </div>
                )}
              </form.AppField>
            </div>

            {/* Diagnosis */}
            <form.AppField name="diagnosis">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Diagnosis <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter primary diagnosis..."
                    rows={3}
                    value={field.state.value ?? ""}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {String(field.state.meta.errors[0])}
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.AppField>

            {/* Treatment Plan */}
            <form.AppField name="treatmentPlan">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Treatment Plan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe the treatment provided..."
                    rows={3}
                    value={field.state.value ?? ""}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.AppField>

            {/* Symptoms */}
            <form.AppField name="symptoms">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Symptoms</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe patient symptoms..."
                    rows={2}
                    value={field.state.value ?? ""}
                  />
                </div>
              )}
            </form.AppField>

            {/* Additional Notes */}
            <form.AppField name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Additional Notes</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Any extra observations or follow-up instructions..."
                    rows={2}
                    value={field.state.value ?? ""}
                  />
                </div>
              )}
            </form.AppField>

            {/* Follow-up Date */}
            <form.AppField name="followUpDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Follow-up Date (Optional)</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    type="date"
                    value={
                      field.state.value
                        ? format(new Date(field.state.value), "yyyy-MM-dd")
                        : ""
                    }
                  />
                </div>
              )}
            </form.AppField>

            {/* Status */}
            <form.AppField name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(
                        value as MedicalRecordFormValues["status"],
                      )
                    }
                    value={field.state.value ?? "ACTIVE"}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FOLLOW_UP">
                        Follow-up Required
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.AppField>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
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
                {isPending ? "Saving..." : "Save Record"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
