// src/components/forms/growth-record-form.tsx

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
  Activity,
  Baby,
  CalendarIcon,
  Ruler,
  User,
  Weight,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form";
import { generateId } from "@/lib/id";
import { orpc } from "@/utils/orpc";

// Schema for growth record form
const growthRecordFormSchema = z.object({
  id: z.string(),
  clinicId: z.string(),
  patientId: z.string().min(1, "Please select a patient"),
  gender: z.string(),
  weight: z.number().min(0.1, "Weight must be greater than 0").optional(),
  height: z.number().min(0.1, "Height must be greater than 0").optional(),
  headCircumference: z
    .number()
    .min(0, "Head circumference must be positive")
    .optional(),
  bmi: z.number().optional(),
  weightForAgeZ: z.number().optional(),
  heightForAgeZ: z.number().optional(),
  bmiForAgeZ: z.number().optional(),
  hcForAgeZ: z.number().optional(),
  date: z.date(),
  notes: z.string(),
  ageDays: z.number().optional(),
  ageMonths: z.number().optional(),
});

type GrowthRecordFormValues = z.infer<typeof growthRecordFormSchema>;

// WHO Z-Score interpretation labels
const getZScoreInterpretation = (
  zScore: number | undefined,
  type: "weight" | "height" | "bmi" | "hc",
): string => {
  if (zScore === undefined) return "Not available";

  if (type === "weight") {
    if (zScore < -3) return "Severely Underweight";
    if (zScore < -2) return "Underweight";
    if (zScore <= 1) return "Normal";
    if (zScore <= 2) return "Overweight";
    return "Obese";
  }

  if (type === "height") {
    if (zScore < -3) return "Severely Stunted";
    if (zScore < -2) return "Stunted";
    if (zScore <= 1) return "Normal";
    if (zScore <= 2) return "Tall";
    return "Very Tall";
  }

  if (type === "bmi") {
    if (zScore < -3) return "Severely Thin";
    if (zScore < -2) return "Thin";
    if (zScore <= 1) return "Normal";
    if (zScore <= 2) return "Overweight";
    return "Obese";
  }

  if (type === "hc") {
    if (zScore < -3) return "Severely Microcephalic";
    if (zScore < -2) return "Microcephalic";
    if (zScore <= 2) return "Normal";
    return "Macrocephalic";
  }

  return "Unknown";
};

const getZScoreColor = (zScore: number | undefined): string => {
  if (zScore === undefined) return "bg-gray-100 text-gray-700";
  if (zScore >= -2 && zScore <= 2) return "bg-green-100 text-green-700";
  if (zScore < -2) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

type GrowthRecordFormProps = {
  initialData?: Partial<GrowthRecordFormValues>;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId?: string;
};

export function GrowthRecordForm({
  initialData,
  patientId,
  onSuccess,
  onCancel,
}: GrowthRecordFormProps) {
  const queryClient = useQueryClient();
  const [calculatedZScore, setCalculatedZScore] = React.useState<{
    weightForAgeZ?: number;
    heightForAgeZ?: number;
    bmiForAgeZ?: number;
    hcForAgeZ?: number;
    ageDays?: number;
    ageMonths?: number;
  }>({});

  // Fetch patients for dropdown
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Create growth record mutation
  const { mutate: createGrowthRecord, isPending: isCreatePending } =
    useMutation(
      orpc.growth.create.mutationOptions({
        onSuccess: () => {
          toast.success("Growth record saved successfully");
          queryClient.invalidateQueries({
            queryKey: orpc.growth.key(),
          });
          queryClient.invalidateQueries({
            queryKey: orpc.patient.get.queryKey({
              input: { id: formValues.patientId },
            }),
          });
          onSuccess?.();
        },
        onError(error) {
          console.error(error);
          toast.error(error.message || "Failed to save growth record");
        },
      }),
    );

  const form = useAppForm({
    defaultValues: {
      id: generateId(),
      clinicId: initialData?.clinicId ?? "",
      patientId: initialData?.patientId ?? patientId ?? "",
      gender: initialData?.gender ?? "",
      weight: initialData?.weight ?? undefined,
      height: initialData?.height ?? undefined,
      headCircumference: initialData?.headCircumference ?? undefined,
      bmi: initialData?.bmi ?? undefined,
      weightForAgeZ: initialData?.weightForAgeZ ?? undefined,
      heightForAgeZ: initialData?.heightForAgeZ ?? undefined,
      bmiForAgeZ: initialData?.bmiForAgeZ ?? undefined,
      hcForAgeZ: initialData?.hcForAgeZ ?? undefined,
      date: initialData?.date ?? new Date(),
      notes: initialData?.notes ?? "",
      ageDays: initialData?.ageDays ?? undefined,
      ageMonths: initialData?.ageMonths ?? undefined,
    } as GrowthRecordFormValues,
    validators: {},
    onSubmit: async ({ value }) => {
      createGrowthRecord({
        patientId: value.patientId,
        date: value.date,
        weight: value.weight,
        height: value.height,
        headCircumference: value.headCircumference,
        notes: value.notes || undefined,
      });
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);
  const { FormSelectField, FormTextField, FormTextareaField } =
    useFormFields<GrowthRecordFormValues>();

  // Fetch patient details to get date of birth for age calculation
  const selectedPatientId = formValues.patientId;
  const { data: selectedPatient } = useQuery({
    ...orpc.patient.get.queryOptions({
      input: { id: selectedPatientId },
    }),
    enabled: !!selectedPatientId,
  });

  // Calculate age and Z-scores when measurements change
  React.useEffect(() => {
    if (selectedPatient?.dateOfBirth && formValues.date) {
      const dob = new Date(selectedPatient.dateOfBirth);
      const measureDate = new Date(formValues.date);

      const ageInDays = Math.floor(
        (measureDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24),
      );
      const ageInMonths = ageInDays / 30.44;

      setCalculatedZScore((prev) => {
        return {
          ...prev,
          ageDays: ageInDays,
          ageMonths: Math.round(ageInMonths * 10) / 10,
        };
      });
    }
  }, [selectedPatient?.dateOfBirth, formValues.date]);

  // Calculate BMI
  React.useEffect(() => {
    if (formValues.weight && formValues.height && formValues.height > 0) {
      const heightInMeters = formValues.height / 100;
      const bmi = formValues.weight / (heightInMeters * heightInMeters);
      if (Math.abs(bmi - (formValues.bmi ?? 0)) > 0.01) {
        form.setFieldValue("bmi", Math.round(bmi * 10) / 10);
      }
    }
  }, [formValues.weight, formValues.height, formValues.bmi, form]);

  // Get gender and age info
  const patientGender = selectedPatient?.gender ?? formValues.gender;
  const patientAgeMonths = calculatedZScore.ageMonths;

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <Baby className="h-6 w-6" />
          Growth & Development Record
        </CardTitle>
        <p className="text-muted-foreground">
          Record anthropometric measurements and track growth percentiles
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
                <FormSelectField
                  label="Patient"
                  name="patientId"
                  options={
                    patientsData?.patients?.map((p) => {
                      return {
                        value: p.id,
                        label: `${p.firstName} ${p.lastName} (${format(new Date(p.dateOfBirth), "MMM dd, yyyy")})`,
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
                  label="Gender"
                  name="gender"
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                  ]}
                  placeholder="Select gender"
                />
              </div>

              {selectedPatient && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>
                    <span className="font-medium">Date of Birth:</span>{" "}
                    {format(new Date(selectedPatient.dateOfBirth), "PPP")}
                  </p>
                  <p>
                    <span className="font-medium">Age:</span>{" "}
                    {calculatedZScore.ageMonths === undefined
                      ? "Calculated from measurement date"
                      : `${Math.floor(calculatedZScore.ageMonths)} months ${Math.floor((calculatedZScore.ageMonths % 1) * 30)} days`}
                  </p>
                </div>
              )}
            </div>

            {/* Measurement Date */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <CalendarIcon className="h-5 w-5" />
                Measurement Date
              </h3>
              <Separator />
              <form.AppField name="date">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Measurement Date *</Label>
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
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={(date) => field.handleChange(date as Date)}
                          selected={field.state.value}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.AppField>
            </div>

            {/* Anthropometric Measurements */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Ruler className="h-5 w-5" />
                Body Measurements
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <FormTextField
                    label="Weight (kg)"
                    name="weight"
                    placeholder="e.g., 12.5"
                    step={0.01}
                    type="number"
                  />
                  <Weight className="absolute top-9 right-3 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <FormTextField
                    label="Height / Length (cm)"
                    name="height"
                    placeholder="e.g., 85.0"
                    step={0.1}
                    type="number"
                  />
                  <Ruler className="absolute top-9 right-3 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <FormTextField
                    label="Head Circumference (cm)"
                    name="headCircumference"
                    placeholder="e.g., 45.0"
                    step={0.1}
                    type="number"
                  />
                  <Activity className="absolute top-9 right-3 h-4 w-4 text-muted-foreground" />
                </div>

                <FormTextField
                  label="BMI (auto-calculated)"
                  name="bmi"
                  placeholder="Auto-calculated"
                  readOnly
                  type="number"
                />
              </div>
            </div>

            {/* Z-Score Results (if calculated) */}
            {patientGender &&
              patientAgeMonths !== undefined &&
              patientAgeMonths <= 240 && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold text-lg">
                    <Activity className="h-5 w-5" />
                    WHO Growth Standards (Z-Scores)
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {formValues.weight && (
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          getZScoreColor(calculatedZScore.weightForAgeZ),
                        )}
                      >
                        <p className="font-medium">Weight-for-Age</p>
                        <p className="font-bold text-2xl">
                          Z-Score:{" "}
                          {calculatedZScore.weightForAgeZ?.toFixed(2) ?? "—"}
                        </p>
                        <p className="text-sm">
                          {getZScoreInterpretation(
                            calculatedZScore.weightForAgeZ,
                            "weight",
                          )}
                        </p>
                      </div>
                    )}

                    {formValues.height && (
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          getZScoreColor(calculatedZScore.heightForAgeZ),
                        )}
                      >
                        <p className="font-medium">Height-for-Age</p>
                        <p className="font-bold text-2xl">
                          Z-Score:{" "}
                          {calculatedZScore.heightForAgeZ?.toFixed(2) ?? "—"}
                        </p>
                        <p className="text-sm">
                          {getZScoreInterpretation(
                            calculatedZScore.heightForAgeZ,
                            "height",
                          )}
                        </p>
                      </div>
                    )}

                    {formValues.bmi &&
                      formValues.weight &&
                      formValues.height && (
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            getZScoreColor(calculatedZScore.bmiForAgeZ),
                          )}
                        >
                          <p className="font-medium">BMI-for-Age</p>
                          <p className="font-bold text-2xl">
                            Z-Score:{" "}
                            {calculatedZScore.bmiForAgeZ?.toFixed(2) ?? "—"}
                          </p>
                          <p className="text-sm">
                            {getZScoreInterpretation(
                              calculatedZScore.bmiForAgeZ,
                              "bmi",
                            )}
                          </p>
                        </div>
                      )}

                    {formValues.headCircumference && (
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          getZScoreColor(calculatedZScore.hcForAgeZ),
                        )}
                      >
                        <p className="font-medium">
                          Head Circumference-for-Age
                        </p>
                        <p className="font-bold text-2xl">
                          Z-Score:{" "}
                          {calculatedZScore.hcForAgeZ?.toFixed(2) ?? "—"}
                        </p>
                        <p className="text-sm">
                          {getZScoreInterpretation(
                            calculatedZScore.hcForAgeZ,
                            "hc",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Additional Notes</h3>
              <Separator />
              <FormTextareaField
                label="Notes"
                name="notes"
                placeholder="Any observations, concerns, or recommendations..."
                rows={3}
              />
            </div>

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
                disabled={
                  isCreatePending ||
                  !(
                    formValues.weight ??
                    formValues.height ??
                    formValues.headCircumference
                  )
                }
              >
                {isCreatePending
                  ? "Saving..."
                  : initialData?.patientId
                    ? "Update Record"
                    : "Save Growth Record"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Quick growth record form for recent patients
type QuickGrowthRecordProps = {
  onSuccess?: () => void;
  patientId: string;
};

export function QuickGrowthRecord({
  patientId,
  onSuccess,
}: QuickGrowthRecordProps) {
  return <GrowthRecordForm onSuccess={onSuccess} patientId={patientId} />;
}
