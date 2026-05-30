// src/components/forms/vital-signs-form.tsx

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
import { Separator } from "@clinic-app/ui/components/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import {
  Activity,
  Calendar as CalendarIcon,
  Clock,
  Droplets,
  Heart,
  Ruler,
  Thermometer,
  User,
  Wind,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form";
import { orpc } from "@/utils/orpc";

// Vital Signs Form Schema
const vitalSignsFormSchema = z.object({
  id: z.string(),
  patientId: z.string().min(1, "Please select a patient"),
  medicalId: z.string().min(1, "Medical record ID is required"),
  encounterId: z.string(),
  recordedAt: z.date(),

  // Vital signs measurements
  bodyTemperature: z
    .number()
    .min(30, "Temperature too low")
    .max(45, "Temperature too high")
    .optional(),
  systolic: z
    .number()
    .min(50, "Systolic pressure too low")
    .max(250, "Systolic pressure too high")
    .optional(),
  diastolic: z
    .number()
    .min(30, "Diastolic pressure too low")
    .max(150, "Diastolic pressure too high")
    .optional(),
  heartRate: z
    .number()
    .min(30, "Heart rate too low")
    .max(250, "Heart rate too high")
    .optional(),
  respiratoryRate: z
    .number()
    .min(5, "Respiratory rate too low")
    .max(60, "Respiratory rate too high")
    .optional(),
  oxygenSaturation: z
    .number()
    .min(50, "Oxygen saturation too low")
    .max(100, "Oxygen saturation too high")
    .optional(),

  // Growth measurements (pediatric)
  weight: z
    .number()
    .min(0.2, "Weight too low")
    .max(200, "Weight too high")
    .optional(),
  height: z
    .number()
    .min(30, "Height too low")
    .max(250, "Height too high")
    .optional(),
  headCircumference: z
    .number()
    .min(20, "Head circumference too low")
    .max(80, "Head circumference too high")
    .optional(),
  bmi: z.number().optional(),

  // Age tracking for pediatric percentiles
  ageDays: z.number().optional(),
  ageMonths: z.number().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  notes: z.string().optional(),
});

type VitalSignsFormValues = z.infer<typeof vitalSignsFormSchema>;

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): { days: number; months: number } {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - dateOfBirth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths =
    (today.getFullYear() - dateOfBirth.getFullYear()) * 12 +
    (today.getMonth() - dateOfBirth.getMonth());

  return { days: diffDays, months: Math.max(0, diffMonths) };
}

// Helper to calculate BMI
function calculateBMI(
  weight: number | undefined,
  height: number | undefined,
): number | undefined {
  if (weight && height && height > 0) {
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  return undefined;
}

// Helper to interpret vital signs
function getVitalStatus(
  value: number | undefined,
  ranges: {
    min: number;
    max: number;
    criticalMin?: number;
    criticalMax?: number;
  },
  unit: string,
): { status: "normal" | "warning" | "critical"; display: string } {
  if (value === undefined) return { status: "normal", display: "Not recorded" };

  if (ranges.criticalMin && value < ranges.criticalMin) {
    return { status: "critical", display: `⚠️ Critical Low: ${value} ${unit}` };
  }
  if (ranges.criticalMax && value > ranges.criticalMax) {
    return { status: "critical", display: `⚠️ Critical High: ${value} ${unit}` };
  }
  if (value < ranges.min) {
    return { status: "warning", display: `Low: ${value} ${unit}` };
  }
  if (value > ranges.max) {
    return { status: "warning", display: `High: ${value} ${unit}` };
  }
  return { status: "normal", display: `${value} ${unit}` };
}

// Reference ranges for vital signs
const vitalRanges = {
  bodyTemperature: {
    min: 36.1,
    max: 37.2,
    criticalMin: 35.0,
    criticalMax: 40.0,
    unit: "°C",
  },
  systolic: {
    min: 90,
    max: 120,
    criticalMin: 70,
    criticalMax: 180,
    unit: "mmHg",
  },
  diastolic: {
    min: 60,
    max: 80,
    criticalMin: 40,
    criticalMax: 120,
    unit: "mmHg",
  },
  heartRate: {
    min: 60,
    max: 100,
    criticalMin: 40,
    criticalMax: 150,
    unit: "bpm",
  },
  respiratoryRate: {
    min: 12,
    max: 20,
    criticalMin: 8,
    criticalMax: 30,
    unit: "breaths/min",
  },
  oxygenSaturation: {
    min: 95,
    max: 100,
    criticalMin: 85,
    criticalMax: 100,
    unit: "%",
  },
};

// Pediatric reference ranges by age group
const pediatricRanges = {
  infant: {
    heartRate: { min: 80, max: 160 },
    respiratoryRate: { min: 20, max: 40 },
  },
  toddler: {
    heartRate: { min: 70, max: 120 },
    respiratoryRate: { min: 18, max: 30 },
  },
  child: {
    heartRate: { min: 60, max: 110 },
    respiratoryRate: { min: 15, max: 25 },
  },
  adolescent: {
    heartRate: { min: 55, max: 100 },
    respiratoryRate: { min: 12, max: 20 },
  },
};

function getPediatricRange(ageMonths: number | undefined) {
  if (!ageMonths) return pediatricRanges.adolescent;
  if (ageMonths < 12) return pediatricRanges.infant;
  if (ageMonths < 36) return pediatricRanges.toddler;
  if (ageMonths < 144) return pediatricRanges.child;
  return pediatricRanges.adolescent;
}

// Helper to get vital sign display component
const VitalSignDisplay = ({
  value,
  ranges,
  label,
  icon: Icon,
}: {
  value: number | undefined;
  ranges: typeof vitalRanges.bodyTemperature;
  label: string;
  icon: React.ElementType;
}) => {
  const status = getVitalStatus(value, ranges, ranges.unit);
  const statusColors = {
    normal: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    critical: "border-red-200 bg-red-50",
  };

  return (
    <div className={cn("rounded-lg border p-3", statusColors[status.status])}>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            status.status === "normal"
              ? "text-green-600"
              : status.status === "warning"
                ? "text-yellow-600"
                : "text-red-600",
          )}
        />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <p
        className={cn(
          "mt-1 font-semibold text-lg",
          status.status === "normal"
            ? "text-green-700"
            : status.status === "warning"
              ? "text-yellow-700"
              : "text-red-700",
        )}
      >
        {status.display}
      </p>
    </div>
  );
};

type VitalSignsFormProps = {
  encounterId?: string;
  initialData?: Partial<VitalSignsFormValues> & { id?: string };
  medicalId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId?: string;
  readOnly?: boolean;
};

export function VitalSignsForm({
  initialData,
  patientId: propPatientId,
  encounterId: propEncounterId,
  medicalId: propMedicalId,
  onSuccess,
  onCancel,
  readOnly = false,
}: VitalSignsFormProps) {
  const queryClient = useQueryClient();
  const [selectedPatientId, _setSelectedPatientId] = React.useState(
    propPatientId ?? initialData?.patientId ?? "",
  );

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Fetch patient details to calculate age and gender
  const { data: patientData } = useQuery({
    ...orpc.patient.get.queryOptions({
      input: { id: selectedPatientId },
    }),
    enabled: !!selectedPatientId,
  });

  // Create vital signs mutation
  const { mutate: createVitalSigns, isPending: isCreatePending } = useMutation(
    orpc.vitalSigns.create.mutationOptions({
      onSuccess: () => {
        toast.success("Vital signs recorded successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.vitalSigns.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.patient.get.queryKey({
            input: { id: selectedPatientId },
          }),
        });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error(error);
        toast.error(error.message || "Failed to record vital signs");
      },
    }),
  );

  // Update vital signs mutation
  const { mutate: updateVitalSigns, isPending: isUpdatePending } = useMutation(
    orpc.vitalSigns.update.mutationOptions({
      onSuccess: () => {
        toast.success("Vital signs updated successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.vitalSigns.key(),
        });
        onSuccess?.();
      },
      onError(error) {
        console.error(error);
        toast.error(error.message || "Failed to update vital signs");
      },
    }),
  );

  const isPending = isCreatePending || isUpdatePending;

  // Calculate age based on patient's date of birth
  const ageInfo = React.useMemo(() => {
    if (patientData?.dateOfBirth) {
      return calculateAge(new Date(patientData.dateOfBirth));
    }
    return { days: undefined, months: undefined };
  }, [patientData]);

  const pediatricRange = getPediatricRange(ageInfo.months);

  const form = useAppForm({
    defaultValues: {
      id: initialData?.id ?? "",
      patientId: initialData?.patientId ?? propPatientId ?? "",
      medicalId: initialData?.medicalId ?? propMedicalId ?? "",
      encounterId: initialData?.encounterId ?? propEncounterId ?? "",
      recordedAt: initialData?.recordedAt ?? new Date(),
      bodyTemperature: initialData?.bodyTemperature ?? undefined,
      systolic: initialData?.systolic ?? undefined,
      diastolic: initialData?.diastolic ?? undefined,
      heartRate: initialData?.heartRate ?? undefined,
      respiratoryRate: initialData?.respiratoryRate ?? undefined,
      oxygenSaturation: initialData?.oxygenSaturation ?? undefined,
      weight: initialData?.weight ?? undefined,
      height: initialData?.height ?? undefined,
      headCircumference: initialData?.headCircumference ?? undefined,
      bmi: initialData?.bmi ?? undefined,
      ageDays: ageInfo.days,
      ageMonths: ageInfo.months,
      gender: (patientData?.gender as "MALE" | "FEMALE" | "OTHER") ?? undefined,
      notes: initialData?.notes ?? undefined,
    } satisfies VitalSignsFormValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = vitalSignsFormSchema.safeParse(value);
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(", ");
        }
      },
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        recordedAt: value.recordedAt,
        ageDays: ageInfo.days,
        ageMonths: ageInfo.months,
        gender: patientData?.gender as "MALE" | "FEMALE" | "OTHER" | undefined,
        bmi: calculateBMI(value.weight, value.height),
      };

      if (initialData?.id) {
        updateVitalSigns({ ...payload, id: initialData.id ?? "" });
      } else {
        createVitalSigns({
          ...payload,
        });
      }
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);

  // Auto-calculate BMI when weight or height changes
  React.useEffect(() => {
    const bmi = calculateBMI(formValues.weight, formValues.height);
    if (bmi !== formValues.bmi) {
      form.setFieldValue("bmi", bmi);
    }
  }, [formValues.weight, formValues.height, formValues.bmi, form]);

  // Update age when patient changes
  React.useEffect(() => {
    if (ageInfo.days !== undefined && ageInfo.months !== undefined) {
      form.setFieldValue("ageDays", ageInfo.days);
      form.setFieldValue("ageMonths", ageInfo.months);
    }
    if (patientData?.gender) {
      form.setFieldValue(
        "gender",
        patientData.gender as "MALE" | "FEMALE" | "OTHER",
      );
    }
  }, [ageInfo.days, ageInfo.months, patientData?.gender, form]);

  const { FormSelectField, FormTextField, FormTextareaField } =
    useFormFields<VitalSignsFormValues>();

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <Activity className="h-6 w-6" />
          {initialData?.id ? "Edit Vital Signs" : "Record Vital Signs"}
        </CardTitle>
        <p className="text-muted-foreground">
          Record patient vital signs and growth measurements
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Patient Information
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {propPatientId ? (
                  <FormTextField
                    disabled
                    label="Patient ID"
                    name="patientId"
                    type="text"
                  />
                ) : (
                  <FormSelectField
                    label="Patient"
                    name="patientId"
                    options={
                      patientsData?.patients?.map((p) => {
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
                )}

                {patientData && (
                  <>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="font-medium text-sm">Patient Name</div>
                      <div>
                        {patientData.firstName} {patientData.lastName}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="font-medium text-sm">Age</div>
                      <div>
                        {ageInfo.months !== undefined &&
                          (ageInfo.months < 24
                            ? `${ageInfo.months} months (${ageInfo.days} days)`
                            : `${Math.floor(ageInfo.months / 12)} years ${ageInfo.months % 12} months`)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="font-medium text-sm">Gender</div>
                      <div>{patientData.gender ?? "Not specified"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recording Date & Time */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Clock className="h-5 w-5" />
                Recording Date & Time
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4">
                <form.AppField name="recordedAt">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Date & Time Recorded *</Label>
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
                            {field.state.value ? (
                              format(field.state.value, "PPP p")
                            ) : (
                              <span>Pick date and time</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={(date) => {
                              if (date) {
                                const current = field.state.value || new Date();
                                date.setHours(
                                  current.getHours(),
                                  current.getMinutes(),
                                );
                                field.handleChange(date);
                              }
                            }}
                            selected={field.state.value}
                          />
                          <div className="border-t p-3">
                            <Input
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value
                                  .split(":")
                                  .map(Number);
                                const newDate = field.state.value || new Date();
                                newDate.setHours(hours ?? 0, minutes);
                                field.handleChange(newDate);
                              }}
                              type="time"
                              value={
                                field.state.value
                                  ? format(field.state.value, "HH:mm")
                                  : ""
                              }
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </form.AppField>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Heart className="h-5 w-5" />
                Vital Signs
              </h3>
              <Separator />

              {/* Summary cards for existing values */}
              {readOnly && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <VitalSignDisplay
                    icon={Thermometer}
                    label="Temperature"
                    ranges={vitalRanges.bodyTemperature}
                    value={formValues.bodyTemperature}
                  />
                  <VitalSignDisplay
                    icon={Droplets}
                    label="Systolic"
                    ranges={vitalRanges.systolic}
                    value={formValues.systolic}
                  />
                  <VitalSignDisplay
                    icon={Droplets}
                    label="Diastolic"
                    ranges={vitalRanges.diastolic}
                    value={formValues.diastolic}
                  />
                  <VitalSignDisplay
                    icon={Heart}
                    label="Heart Rate"
                    ranges={vitalRanges.heartRate}
                    value={formValues.heartRate}
                  />
                  <VitalSignDisplay
                    icon={Wind}
                    label="Respiratory Rate"
                    ranges={vitalRanges.respiratoryRate}
                    value={formValues.respiratoryRate}
                  />
                  <VitalSignDisplay
                    icon={Activity}
                    label="O₂ Saturation"
                    ranges={vitalRanges.oxygenSaturation}
                    value={formValues.oxygenSaturation}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormTextField
                  disabled={readOnly}
                  label="Body Temperature (°C)"
                  name="bodyTemperature"
                  placeholder="36.5"
                  step={0.1}
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(30, "Temperature too low")
                      .max(45, "Temperature too high")
                      .optional(),
                  }}
                />

                <div className="space-y-2">
                  <Label>Blood Pressure</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FormTextField
                      disabled={readOnly}
                      label="Systolic"
                      name="systolic"
                      placeholder="120"
                      type="number"
                    />
                    <FormTextField
                      disabled={readOnly}
                      label=""
                      name="diastolic"
                      placeholder="80"
                      type="number"
                    />
                  </div>
                </div>

                <FormTextField
                  disabled={readOnly}
                  label="Heart Rate (bpm)"
                  name="heartRate"
                  placeholder="72"
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(30, "Heart rate too low")
                      .max(250, "Heart rate too high")
                      .optional(),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Respiratory Rate (breaths/min)"
                  name="respiratoryRate"
                  placeholder="16"
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(5, "Respiratory rate too low")
                      .max(60, "Respiratory rate too high")
                      .optional(),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Oxygen Saturation (%)"
                  max={100}
                  min={0}
                  name="oxygenSaturation"
                  placeholder="98"
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(50, "Oxygen saturation too low")
                      .max(100, "Oxygen saturation too high")
                      .optional(),
                  }}
                />
              </div>

              {/* Age-specific reference info */}
              {ageInfo.months !== undefined && ageInfo.months < 18 && (
                <div className="rounded-lg bg-blue-50 p-3 text-blue-700 text-sm">
                  <strong>Pediatric Reference Ranges:</strong> Heart rate:{" "}
                  {pediatricRange.heartRate.min}-{pediatricRange.heartRate.max}{" "}
                  bpm, Respiratory rate: {pediatricRange.respiratoryRate.min}-
                  {pediatricRange.respiratoryRate.max} breaths/min
                </div>
              )}
            </div>

            {/* Growth Measurements (Pediatric) */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Ruler className="h-5 w-5" />
                Growth Measurements
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormTextField
                  disabled={readOnly}
                  label="Weight (kg)"
                  name="weight"
                  placeholder="70.5"
                  step={0.1}
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(0.2, "Weight too low")
                      .max(200, "Weight too high")
                      .optional(),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Height / Length (cm)"
                  name="height"
                  placeholder="170"
                  step={0.1}
                  type="number"
                  validators={{
                    onBlur: z
                      .number()
                      .min(30, "Height too low")
                      .max(250, "Height too high")
                      .optional(),
                  }}
                />

                {ageInfo.months !== undefined && ageInfo.months < 36 && (
                  <FormTextField
                    disabled={readOnly}
                    label="Head Circumference (cm)"
                    name="headCircumference"
                    placeholder="45"
                    step={0.1}
                    type="number"
                    validators={{
                      onBlur: z
                        .number()
                        .min(20, "Head circumference too low")
                        .max(80, "Head circumference too high")
                        .optional(),
                    }}
                  />
                )}

                <FormTextField
                  disabled
                  label="BMI"
                  name="bmi"
                  placeholder="24.2"
                  step={0.1}
                  type="number"
                />

                {formValues.bmi && (
                  <div className="col-span-full rounded-lg bg-muted p-3">
                    <div className="font-medium text-sm">
                      BMI Classification
                    </div>
                    <div>
                      {formValues.bmi < 18.5 && "Underweight"}
                      {formValues.bmi >= 18.5 &&
                        formValues.bmi < 25 &&
                        "Normal weight"}
                      {formValues.bmi >= 25 &&
                        formValues.bmi < 30 &&
                        "Overweight"}
                      {formValues.bmi >= 30 && "Obese"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Activity className="h-5 w-5" />
                Additional Notes
              </h3>
              <Separator />
              <FormTextareaField
                disabled={readOnly}
                label="Notes"
                name="notes"
                placeholder="Any additional observations or concerns..."
                rows={3}
              />
            </div>

            {/* Actions */}
            {!readOnly && (
              <>
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
                  <form.SubmitButton className="min-w-30" disabled={isPending}>
                    {isPending
                      ? "Saving..."
                      : initialData?.id
                        ? "Update Vital Signs"
                        : "Save Vital Signs"}
                  </form.SubmitButton>
                </div>
              </>
            )}
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Quick vital signs form for use within patient encounter
type QuickVitalSignsFormProps = {
  encounterId?: string;
  medicalId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId: string;
};

export function QuickVitalSignsForm({
  patientId,
  encounterId,
  medicalId,
  onSuccess,
  onCancel,
}: QuickVitalSignsFormProps) {
  return (
    <VitalSignsForm
      encounterId={encounterId}
      medicalId={medicalId}
      onCancel={onCancel}
      onSuccess={onSuccess}
      patientId={patientId}
    />
  );
}

// Vital signs history / view-only component
type VitalSignsHistoryProps = {
  onSelectRecord?: (recordId: string) => void;
  patientId: string;
};

export function VitalSignsHistory({
  patientId,
  onSelectRecord,
}: VitalSignsHistoryProps) {
  const { data, isLoading } = useQuery(
    orpc.vitalSigns.list.queryOptions({
      input: { patientId, limit: 50 },
    }),
  );

  if (isLoading) {
    return (
      <div className="py-8 text-center">Loading vital signs history...</div>
    );
  }

  if (!data?.vitalSigns?.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No vital signs records found for this patient.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Vital Signs History</h3>
      <div className="space-y-3">
        {data.vitalSigns.map((record) => (
          <button
            className="w-full cursor-pointer text-left"
            key={record.id}
            onClick={() => onSelectRecord?.(record.id)}
            type="button"
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">
                    {format(new Date(record.recordedAt), "PPP p")}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {record.bodyTemperature && (
                      <Badge variant="outline">
                        🌡️ {record.bodyTemperature}°C
                      </Badge>
                    )}
                    {record.heartRate && (
                      <Badge variant="outline">❤️ {record.heartRate} bpm</Badge>
                    )}
                    {record.systolic && record.diastolic && (
                      <Badge variant="outline">
                        💓 {record.systolic}/{record.diastolic}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
