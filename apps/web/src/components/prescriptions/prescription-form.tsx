// src/components/forms/PrescriptionForm.tsx

import type { DbPrescribedItem, Frequency } from "@clinic-app/db/schema/types";
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
import {
  useAppForm,
  useFormFields,
} from "@clinic-app/ui/components/tanstack-form";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { generateId } from "@clinic-app/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import {
  CalendarIcon,
  FileText,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { orpc } from "@/utils/orpc";

// Schema for a single prescribed item (medication)
const prescribedItemSchema = z.object({
  id: z.string().or(z.undefined()),
  drugId: z.string().min(1, "Please select a medication"),
  encounterId: z.string().or(z.undefined()),
  drugName: z.string().or(z.undefined()),
  dosageValue: z.number().min(0.1, "Dosage is required"),
  dosageUnit: z.string().min(1, "Unit is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().or(z.undefined()),
  drugRoute: z.string().or(z.undefined()),
});

const PrescriptionFormSchema = z.object({
  id: z.string().min(1, "Prescription ID is required"),
  patientId: z.string().min(1, "Please select a patient"),
  doctorId: z.string().min(1, "Please select a doctor"),
  medicalRecordId: z.string().min(1, "Medical record is required"),
  encounterId: z.string().min(1, "Encounter is required"),
  clinicId: z.string().or(z.undefined()),
  issuedDate: z.date(),
  endDate: z.date().or(z.undefined()),
  status: z.enum(["active", "completed", "cancelled", "expired"]),
  diagnosis: z.string().or(z.undefined()),
  notes: z.string().or(z.undefined()),
  prescribedItems: z
    .array(prescribedItemSchema)
    .min(1, "At least one medication is required"),
});

// Form values type that matches the component's needs
type PrescriptionFormValues = {
  id: string;
  patientId: string;
  doctorId: string;
  medicalRecordId: string;
  encounterId: string;
  clinicId?: string;
  issuedDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "cancelled" | "expired";
  diagnosis?: string;
  notes?: string;
  prescribedItems: Array<{
    id?: string;
    drugId: string;
    encounterId?: string;
    drugName?: string;
    dosageValue: number;
    dosageUnit: string;
    frequency: string;
    duration: string;
    instructions?: string;
    drugRoute?: string;
  }>;
};

type Drug = {
  id: string;
  name: string;
};

// Common dosage units
const dosageUnits = [
  { value: "mg", label: "mg" },
  { value: "mcg", label: "mcg" },
  { value: "g", label: "g" },
  { value: "mL", label: "mL" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "drop", label: "drop" },
  { value: "puff", label: "puff" },
  { value: "tablet", label: "tablet" },
  { value: "capsule", label: "capsule" },
];

// Common frequencies
const frequencies = [
  { value: "ONCE", label: "Once" },
  { value: "BID", label: "Twice daily (BID)" },
  { value: "TID", label: "Three times daily (TID)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "Q4H", label: "Every 4 hours" },
  { value: "Q6H", label: "Every 6 hours" },
  { value: "Q8H", label: "Every 8 hours" },
  { value: "Q12H", label: "Every 12 hours" },
  { value: "QD", label: "Once daily" },
  { value: "QOD", label: "Every other day" },
  { value: "PRN", label: "As needed (PRN)" },
  { value: "STAT", label: "Immediately (STAT)" },
];

// Common routes of administration
const drugRoutes = [
  { value: "ORAL", label: "Oral" },
  { value: "IV", label: "Intravenous (IV)" },
  { value: "IM", label: "Intramuscular (IM)" },
  { value: "SC", label: "Subcutaneous (SC)" },
  { value: "TOPICAL", label: "Topical" },
  { value: "INHALATION", label: "Inhalation" },
  { value: "RECTAL", label: "Rectal" },
  { value: "OPHTHALMIC", label: "Ophthalmic" },
  { value: "OTIC", label: "Otic" },
  { value: "NASAL", label: "Nasal" },
];

// Duration options
const durations = [
  { value: "1 day", label: "1 day" },
  { value: "3 days", label: "3 days" },
  { value: "5 days", label: "5 days" },
  { value: "7 days", label: "7 days" },
  { value: "10 days", label: "10 days" },
  { value: "14 days", label: "14 days" },
  { value: "21 days", label: "21 days" },
  { value: "30 days", label: "30 days" },
  { value: "60 days", label: "60 days" },
  { value: "90 days", label: "90 days" },
];

type PrescriptionFormProps = {
  doctorId?: string;
  encounterId?: string;
  initialData?: Partial<PrescriptionFormValues>;
  medicalRecordId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId?: string;
  readOnly?: boolean;
};

export function PrescriptionForm({
  initialData,
  patientId: presetPatientId,
  doctorId: presetDoctorId,
  medicalRecordId: presetMedicalRecordId,
  encounterId: presetEncounterId,
  onSuccess,
  onCancel,
  readOnly = false,
}: PrescriptionFormProps) {
  const queryClient = useQueryClient();

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "" },
      enabled: !presetPatientId,
    }),
  );

  // Fetch doctors for dropdown
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery(
    orpc.doctors.list.queryOptions({
      input: { search: "" },
      enabled: !presetDoctorId,
    }),
  );

  // Fetch drugs for the medication dropdown
  const { data: drugsData, isLoading: drugsLoading } = useQuery(
    orpc.prescriptions.listDrugs.queryOptions({
      input: { search: "" },
    }),
  );

  // Create prescription mutation
  const { mutate: createPrescription, isPending: isCreatePending } =
    useMutation(
      orpc.prescriptions.create.mutationOptions({
        onSuccess: () => {
          toast.success("Prescription created successfully");
          queryClient.invalidateQueries({ queryKey: orpc.prescriptions.key() });
          queryClient.invalidateQueries({ queryKey: orpc.patient.key() });
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error(error);
          toast.error(error.message || "Failed to create prescription");
        },
      }),
    );

  // Update prescription mutation
  const { mutate: updatePrescription, isPending: isUpdatePending } =
    useMutation(
      orpc.prescriptions.update.mutationOptions({
        onSuccess: () => {
          toast.success("Prescription updated successfully");
          queryClient.invalidateQueries({ queryKey: orpc.prescriptions.key() });
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error(error);
          toast.error(error.message || "Failed to update prescription");
        },
      }),
    );

  const isPending = isCreatePending || isUpdatePending;

  const form = useAppForm({
    defaultValues: {
      id: initialData?.id ?? generateId(),
      patientId: presetPatientId ?? initialData?.patientId ?? "",
      doctorId: presetDoctorId ?? initialData?.doctorId ?? "",
      encounterId: presetEncounterId ?? initialData?.encounterId ?? "",
      medicalRecordId:
        presetMedicalRecordId ?? initialData?.medicalRecordId ?? "",
      clinicId: initialData?.clinicId ?? undefined,
      issuedDate: initialData?.issuedDate ?? new Date(),
      endDate: initialData?.endDate,
      status:
        (initialData?.status as
          | "active"
          | "completed"
          | "cancelled"
          | "expired") || "active",
      diagnosis: initialData?.diagnosis,
      notes: initialData?.notes,
      prescribedItems: initialData?.prescribedItems ?? [],
    },
    validators: {
      onSubmit: PrescriptionFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (initialData?.id) {
        updatePrescription({
          prescriptionId: initialData.id,
          status: value.status,
        });
      } else {
        createPrescription({
          medicalRecordId: value.medicalRecordId,
          patientId: value.patientId,
          doctorId: value.doctorId || "",
          encounterId: value.encounterId,
          items: value.prescribedItems.map((item) => {
            return {
              drugId: item.drugId,
              dosageValue: item.dosageValue,
              dosageUnit: item.dosageUnit,
              frequency: item.frequency as Frequency,
              duration: item.duration,
              instructions: item.instructions ?? undefined,
            };
          }),
        });
      }
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);

  // Add a new medication item
  const addMedication = () => {
    const newItem = {
      drugId: "",
      dosageValue: 0,
      dosageUnit: "mg",
      frequency: "BID",
      duration: "7 days",
      instructions: "",
      drugRoute: "ORAL",
    };
    form.setFieldValue("prescribedItems", [
      ...formValues.prescribedItems,
      newItem,
    ]);
  };

  // Remove a medication item
  const removeMedication = (index: number) => {
    const newItems = [...formValues.prescribedItems];
    newItems.splice(index, 1);
    form.setFieldValue("prescribedItems", newItems);
  };

  // Update a medication item
  const updateMedication = (
    index: number,
    field: keyof PrescriptionFormValues["prescribedItems"][0],
    value: unknown,
  ) => {
    const newItems = [...formValues.prescribedItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If drugId changed, look up drug name
    if (field === "drugId" && typeof value === "string") {
      const selectedDrug = drugsData?.drugs?.find((d: Drug) => d.id === value);
      if (selectedDrug) {
        newItems[index].drugName = selectedDrug.name;
      }
    }

    form.setFieldValue("prescribedItems", newItems);
  };

  const { FormSelectField, FormTextareaField } =
    useFormFields<PrescriptionFormValues>();

  // Determine if patient/doctor selects should be disabled

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <Pill className="h-6 w-6" />
          {initialData?.id ? "Edit Prescription" : "New Prescription"}
        </CardTitle>
        <p className="text-muted-foreground">
          Create a prescription with medications and instructions
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
                    patientsData?.patients?.map((p) => {
                      return {
                        value: p.id,
                        label: `${p.firstName} ${p.lastName}${p.dateOfBirth ? ` (${format(p.dateOfBirth, "MM/dd/yyyy")})` : ""}`,
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

            {/* Prescription Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <FileText className="h-5 w-5" />
                Prescription Details
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Issued Date */}
                <div className="space-y-2">
                  <Label>Issue Date *</Label>
                  <form.AppField name="issuedDate">
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

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <form.AppField name="endDate">
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
                              field.handleChange(date ?? undefined)
                            }
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </form.AppField>
                </div>

                {/* Status */}
                <FormSelectField
                  label="Status"
                  name="status"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "expired", label: "Expired" },
                  ]}
                />
              </div>

              {/* Diagnosis */}
              <FormTextareaField
                disabled={readOnly}
                label="Diagnosis / Clinical Notes"
                name="diagnosis"
                placeholder="Enter diagnosis or clinical notes..."
                rows={3}
              />

              {/* General Notes */}
              <FormTextareaField
                disabled={readOnly}
                label="Additional Notes"
                name="notes"
                placeholder="Any additional instructions or notes for the patient..."
                rows={2}
              />
            </div>

            {/* Medications Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-lg">
                  <Stethoscope className="h-5 w-5" />
                  Medications
                </h3>
                {!readOnly && (
                  <Button
                    onClick={addMedication}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Medication
                  </Button>
                )}
              </div>
              <Separator />

              {formValues.prescribedItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Pill className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No medications added yet</p>
                  {!readOnly && (
                    <Button
                      className="mt-2"
                      onClick={addMedication}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Add Medication
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {formValues.prescribedItems.map((item, index) => (
                    <Card className="relative" key={item.id ?? index}>
                      <CardContent className="pt-6">
                        {!readOnly && (
                          <Button
                            className="absolute top-2 right-2"
                            onClick={() => removeMedication(index)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {/* Medication (Drug) */}
                          <div className="space-y-2 md:col-span-2">
                            <Label>Medication *</Label>
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateMedication(index, "drugId", value)
                              }
                              value={item.drugId}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    drugsLoading
                                      ? "Loading..."
                                      : "Select medication"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {drugsData?.drugs?.map((drug: Drug) => (
                                  <SelectItem key={drug.id} value={drug.id}>
                                    {drug.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Dosage Value */}
                          <div className="space-y-2">
                            <Label>Dosage *</Label>
                            <Input
                              disabled={readOnly}
                              onChange={(e) =>
                                updateMedication(
                                  index,
                                  "dosageValue",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="e.g., 500"
                              step="any"
                              type="number"
                              value={item.dosageValue ?? ""}
                            />
                          </div>

                          {/* Dosage Unit */}
                          <div className="space-y-2">
                            <Label>Unit *</Label>
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateMedication(index, "dosageUnit", value)
                              }
                              value={item.dosageUnit}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dosageUnits.map((unit) => (
                                  <SelectItem
                                    key={unit.value}
                                    value={unit.value}
                                  >
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Frequency */}
                          <div className="space-y-2">
                            <Label>Frequency *</Label>
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateMedication(index, "frequency", value)
                              }
                              value={item.frequency}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {frequencies.map((freq) => (
                                  <SelectItem
                                    key={freq.value}
                                    value={freq.value}
                                  >
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Duration */}
                          <div className="space-y-2">
                            <Label>Duration *</Label>
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateMedication(index, "duration", value)
                              }
                              value={item.duration}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {durations.map((dur) => (
                                  <SelectItem key={dur.value} value={dur.value}>
                                    {dur.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Route */}
                          <div className="space-y-2">
                            <Label>Route</Label>
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateMedication(index, "drugRoute", value)
                              }
                              value={item.drugRoute ?? "ORAL"}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {drugRoutes.map((route) => (
                                  <SelectItem
                                    key={route.value}
                                    value={route.value}
                                  >
                                    {route.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Instructions - full width */}
                          <div className="space-y-2 md:col-span-4">
                            <Label>Special Instructions</Label>
                            <Textarea
                              disabled={readOnly}
                              onChange={(e) =>
                                updateMedication(
                                  index,
                                  "instructions",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Take with food, avoid alcohol..."
                              rows={2}
                              value={item.instructions ?? ""}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Status Display for existing prescriptions */}
            {initialData?.status && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <span className="font-medium text-sm">
                  Prescription Status:
                </span>
                <Badge
                  className={cn(
                    initialData.status === "active" && "bg-green-500",
                    initialData.status === "completed" && "bg-blue-500",
                    initialData.status === "cancelled" && "bg-red-500",
                    initialData.status === "expired" && "bg-gray-500",
                  )}
                >
                  {initialData.status.charAt(0).toUpperCase() +
                    initialData.status.slice(1)}
                </Badge>
              </div>
            )}

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
              {!readOnly && (
                <form.SubmitButton className="min-w-30" disabled={isPending}>
                  {isPending
                    ? initialData?.id
                      ? "Updating..."
                      : "Creating..."
                    : initialData?.id
                      ? "Update Prescription"
                      : "Create Prescription"}
                </form.SubmitButton>
              )}
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Simplified version for quick prescription entry
type QuickPrescriptionFormProps = {
  doctorId: string;
  encounterId?: string;
  medicalRecordId?: string;
  onSuccess?: () => void;
  patientId: string;
};

export function QuickPrescriptionForm({
  patientId,
  doctorId,
  medicalRecordId,
  encounterId,
  onSuccess,
}: QuickPrescriptionFormProps) {
  return (
    <PrescriptionForm
      doctorId={doctorId}
      encounterId={encounterId}
      medicalRecordId={medicalRecordId}
      onSuccess={onSuccess}
      patientId={patientId}
    />
  );
}

// Prescription view component (read-only)
type PrescriptionViewProps = {
  onClose?: () => void;
  prescriptionId: string;
};

export function PrescriptionView({
  prescriptionId,
  onClose,
}: PrescriptionViewProps) {
  const { data: prescription, isLoading } = useQuery(
    orpc.prescriptions.get.queryOptions({
      input: { id: prescriptionId },
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Loading prescription...
        </CardContent>
      </Card>
    );
  }

  if (!prescription) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          Prescription not found
        </CardContent>
      </Card>
    );
  }

  // Get prescribed items from the response
  const prescribedItems = prescription.prescribedItems ?? [];

  return (
    <PrescriptionForm
      initialData={{
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        medicalRecordId: prescription.medicalRecordId,
        encounterId: prescription.encounterId,
        clinicId: prescription.clinicId,
        issuedDate: new Date(prescription.issuedDate),
        endDate: prescription.endDate
          ? new Date(prescription.endDate)
          : undefined,
        status: prescription.status as
          | "active"
          | "completed"
          | "cancelled"
          | "expired",
        diagnosis: prescription.diagnosis ?? undefined,
        notes: prescription.notes ?? undefined,
        prescribedItems: prescribedItems.map((item: DbPrescribedItem) => {
          return {
            id: item.id,
            drugId: item.drugId, // Direct access, not item.drug?.id
            dosageValue: item.dosageValue,
            dosageUnit: item.dosageUnit,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions ?? undefined,
            drugRoute: item.drugRoute ?? undefined,
          };
        }),
      }}
      onCancel={onClose}
      readOnly
    />
  );
}
