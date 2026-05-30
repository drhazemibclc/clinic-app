// src/components/forms/encounter-form.tsx

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import {
  useAppForm,
  useFormFields,
} from "@clinic-app/ui/components/tanstack-form";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { generateId } from "@clinic-app/utils/id";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  CalendarIcon,
  ClipboardList,
  Pill,
  TestTube,
  User,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { orpc } from "@/utils/orpc";

// Schema for encounter form — matches CreateEncounterSchema input exactly
const encounterFormSchema = z.object({
  // Patient & Doctor Info
  patientId: z.string().min(1, "Please select a patient"),
  doctorId: z.string().min(1, "Please select a doctor"),
  clinicId: z.string(),
  appointmentId: z.string(),

  // Diagnosis Information
  diagnosisDate: z.date(),
  type: z.string().min(1, "Please select encounter type"),
  diagnosis: z.string().min(1, "Please enter a diagnosis"),
  symptoms: z.string().min(1, "Please describe the symptoms"),
  treatment: z.string(),
  notes: z.string(),

  // Prescribed Medications (as JSON string)
  prescribedMedications: z.string(),
  followUpPlan: z.string(),

  // Vital Signs Section
  vitalSigns: z.object({
    bodyTemperature: z.number().optional(),
    systolic: z.number().optional(),
    diastolic: z.number().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    notes: z.string().optional(),
  }),

  // Lab Tests Section
  labTests: z.array(
    z.object({
      serviceId: z.string(),
      testDate: z.date(),
      notes: z.string().optional(),
    }),
  ),

  // Prescriptions Section
  prescriptions: z.array(
    z.object({
      medicationName: z.string(),
      instructions: z.string(),
      dosageValue: z.number(),
      dosageUnit: z.string(),
      frequency: z.string(),
      duration: z.string(),
    }),
  ),

  status: z.string(),
});

type EncounterFormValues = z.infer<typeof encounterFormSchema>;

const encounterTypes = [
  { value: "INITIAL", label: "Initial Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "ROUTINE", label: "Routine Checkup" },
  { value: "CHRONIC", label: "Chronic Disease Management" },
  { value: "POST_OP", label: "Post-operative" },
];

const dosageUnits = [
  { value: "mg", label: "mg" },
  { value: "g", label: "g" },
  { value: "mcg", label: "mcg" },
  { value: "mL", label: "mL" },
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "drop", label: "Drop" },
  { value: "inhalation", label: "Inhalation" },
];

const frequencies = [
  { value: "ONCE_DAILY", label: "Once daily" },
  { value: "TWICE_DAILY", label: "Twice daily" },
  { value: "THREE_TIMES_DAILY", label: "Three times daily" },
  { value: "FOUR_TIMES_DAILY", label: "Four times daily" },
  { value: "EVERY_4_HOURS", label: "Every 4 hours" },
  { value: "EVERY_6_HOURS", label: "Every 6 hours" },
  { value: "EVERY_8_HOURS", label: "Every 8 hours" },
  { value: "AS_NEEDED", label: "As needed" },
  { value: "BEFORE_MEALS", label: "Before meals" },
  { value: "AFTER_MEALS", label: "After meals" },
  { value: "AT_BEDTIME", label: "At bedtime" },
];

type EncounterFormProps = {
  appointmentId?: string;
  initialData?: Partial<EncounterFormValues>;
  onCancel?: () => void;
  onSuccess?: () => void;
  patientId?: string;
};

export function EncounterForm({
  initialData,
  patientId,
  appointmentId,
  onSuccess,
  onCancel,
}: EncounterFormProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("diagnosis");

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

  // Fetch services for lab tests
  const { data: servicesData, isLoading: servicesLoading } = useQuery(
    orpc.services.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Create encounter mutation
  const { mutate: createEncounter, isPending: isCreatePending } = useMutation(
    orpc.encounters.create.mutationOptions({
      onSuccess: () => {
        toast.success("Encounter recorded successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.encounters.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.record.key(),
        });
        onSuccess?.();
      },
      onError(error: Error) {
        console.error(error);
        toast.error(error.message || "Failed to record encounter");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      patientId: initialData?.patientId ?? patientId ?? "",
      doctorId: initialData?.doctorId ?? "",
      clinicId: initialData?.clinicId ?? "",
      appointmentId: initialData?.appointmentId ?? appointmentId ?? "",
      diagnosisDate: initialData?.diagnosisDate ?? new Date(),
      type: initialData?.type ?? "INITIAL",
      diagnosis: initialData?.diagnosis ?? "",
      symptoms: initialData?.symptoms ?? "",
      treatment: initialData?.treatment ?? "",
      notes: initialData?.notes ?? "",
      prescribedMedications: initialData?.prescribedMedications ?? "",
      followUpPlan: initialData?.followUpPlan ?? "",
      vitalSigns: initialData?.vitalSigns ?? {
        bodyTemperature: undefined,
        systolic: undefined,
        diastolic: undefined,
        heartRate: undefined,
        respiratoryRate: undefined,
        oxygenSaturation: undefined,
        notes: "",
      },
      labTests: initialData?.labTests ?? [],
      prescriptions: initialData?.prescriptions ?? [],
      status: initialData?.status ?? "ACTIVE",
    } as EncounterFormValues,
    validators: {},
    onSubmit: async ({ value }) => {
      createEncounter({
        patientId: value.patientId,
        doctorId: value.doctorId,
        clinicId: value.clinicId,
        appointmentId: value.appointmentId,
        date: value.diagnosisDate,
        type: value.type,
        diagnosis: value.diagnosis,
        treatment: value.treatment,
        notes: value.notes,
        symptoms: value.symptoms,
        prescribedMedications: value.prescribedMedications,
        followUpPlan: value.followUpPlan,
        id: generateId(),
        medicalId: "",
      });
    },
  });

  const formValues = useStore(form.store, (s) => s.values);
  const { FormSelectField, FormTextField, FormTextareaField } =
    useFormFields<EncounterFormValues>();

  // Add lab test handler
  const addLabTest = () => {
    const currentTests = formValues.labTests ?? [];
    form.setFieldValue("labTests", [
      ...currentTests,
      {
        serviceId: "",
        testDate: new Date(),
        notes: "",
      },
    ]);
  };

  const removeLabTest = (index: number) => {
    const currentTests = formValues.labTests ?? [];
    form.setFieldValue(
      "labTests",
      currentTests.filter((_, i) => i !== index),
    );
  };

  // Add prescription handler
  const addPrescription = () => {
    const currentPrescriptions = formValues.prescriptions ?? [];
    form.setFieldValue("prescriptions", [
      ...currentPrescriptions,
      {
        medicationName: "",
        instructions: "",
        dosageValue: 0,
        dosageUnit: "mg",
        frequency: "ONCE_DAILY",
        duration: "",
      },
    ]);
  };

  const removePrescription = (index: number) => {
    const currentPrescriptions = formValues.prescriptions ?? [];
    form.setFieldValue(
      "prescriptions",
      currentPrescriptions.filter((_, i) => i !== index),
    );
  };

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          {initialData?.patientId ? "Edit Encounter" : "New Patient Encounter"}
        </CardTitle>
        <p className="text-muted-foreground">
          Record diagnosis, treatment, vitals, and prescriptions
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
                        label: `Dr. ${d.name} - ${d.specialty || "General"}`,
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

              {appointmentId && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-muted-foreground text-sm">
                    Linked to appointment:{" "}
                    <span className="font-medium">{appointmentId}</span>
                  </p>
                </div>
              )}
            </div>

            <Tabs
              className="w-full"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  className="flex items-center gap-2"
                  value="diagnosis"
                >
                  <ClipboardList className="h-4 w-4" />
                  Diagnosis
                </TabsTrigger>
                <TabsTrigger className="flex items-center gap-2" value="vitals">
                  <Activity className="h-4 w-4" />
                  Vital Signs
                </TabsTrigger>
                <TabsTrigger className="flex items-center gap-2" value="labs">
                  <TestTube className="h-4 w-4" />
                  Lab Tests
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center gap-2"
                  value="prescriptions"
                >
                  <Pill className="h-4 w-4" />
                  Prescriptions
                </TabsTrigger>
              </TabsList>

              {/* Diagnosis Tab */}
              <TabsContent className="mt-6 space-y-6" value="diagnosis">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Diagnosis Date */}
                  <form.AppField name="diagnosisDate">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>Encounter Date *</Label>
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
                              onSelect={(date) =>
                                field.handleChange(date as Date)
                              }
                              selected={field.state.value}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </form.AppField>

                  <FormSelectField
                    label="Encounter Type"
                    name="type"
                    options={encounterTypes}
                    placeholder="Select type"
                    required
                  />
                </div>

                <FormTextField
                  label="Diagnosis"
                  name="diagnosis"
                  placeholder="Enter diagnosis (e.g., Acute Pharyngitis, Hypertension)"
                  required
                />

                <FormTextareaField
                  label="Symptoms"
                  name="symptoms"
                  placeholder="Describe the patient's symptoms..."
                  required
                  rows={3}
                />

                <FormTextareaField
                  label="Treatment Plan"
                  name="treatment"
                  placeholder="Describe the recommended treatment plan..."
                  rows={3}
                />

                <FormTextareaField
                  label="Additional Notes"
                  name="notes"
                  placeholder="Any additional notes or observations..."
                  rows={2}
                />

                <FormTextareaField
                  label="Follow-up Plan"
                  name="followUpPlan"
                  placeholder="Recommended follow-up schedule..."
                  rows={2}
                />
              </TabsContent>

              {/* Vital Signs Tab */}
              <TabsContent className="mt-6 space-y-6" value="vitals">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormTextField
                    label="Body Temperature (°C)"
                    name="vitalSigns.bodyTemperature"
                    placeholder="e.g., 36.5"
                    step={0.1}
                    type="number"
                  />

                  <div className="space-y-2">
                    <Label>Blood Pressure</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <FormTextField
                        label=""
                        name="vitalSigns.systolic"
                        placeholder="Systolic"
                        type="number"
                      />
                      <FormTextField
                        label=""
                        name="vitalSigns.diastolic"
                        placeholder="Diastolic"
                        type="number"
                      />
                    </div>
                  </div>

                  <FormTextField
                    label="Heart Rate (bpm)"
                    name="vitalSigns.heartRate"
                    placeholder="e.g., 72"
                    type="number"
                  />

                  <FormTextField
                    label="Respiratory Rate (breaths/min)"
                    name="vitalSigns.respiratoryRate"
                    placeholder="e.g., 16"
                    type="number"
                  />

                  <FormTextField
                    label="Oxygen Saturation (%)"
                    max={100}
                    min={0}
                    name="vitalSigns.oxygenSaturation"
                    placeholder="e.g., 98"
                    type="number"
                  />

                  <FormTextareaField
                    label="Vital Signs Notes"
                    name="vitalSigns.notes"
                    placeholder="Additional notes about vital signs..."
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Lab Tests Tab */}
              <TabsContent className="mt-6 space-y-6" value="labs">
                <div className="space-y-4">
                  {formValues.labTests?.map((_, index) => (
                    <Card className="relative" key={_.notes?.toString()}>
                      <CardContent className="pt-6">
                        <Button
                          className="absolute top-2 right-2"
                          onClick={() => removeLabTest(index)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          ✕
                        </Button>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Select
                            onValueChange={(value) => {
                              const tests = [...(formValues.labTests ?? [])];
                              tests[index] = {
                                ...tests[index],
                                serviceId: value,
                              };
                              form.setFieldValue("labTests", tests);
                            }}
                            value={
                              formValues.labTests?.[index]?.serviceId ?? ""
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  servicesLoading
                                    ? "Loading..."
                                    : "Select lab test"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {servicesData?.services
                                ?.filter(
                                  (s: { category: string }) =>
                                    s.category === "LAB_TEST",
                                )
                                ?.map(
                                  (service: {
                                    id: string;
                                    serviceName: string;
                                    price: number;
                                  }) => (
                                    <SelectItem
                                      key={service.id}
                                      value={service.id}
                                    >
                                      {service.serviceName} - ${service.price}
                                    </SelectItem>
                                  ),
                                )}
                            </SelectContent>
                          </Select>

                          <div className="space-y-2">
                            <Label>Test Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  className="w-full justify-start text-left font-normal"
                                  variant="outline"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formValues.labTests?.[index]?.testDate
                                    ? format(
                                        formValues.labTests[index].testDate ??
                                          new Date(),
                                        "PPP",
                                      )
                                    : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  onSelect={(date) => {
                                    const tests = [
                                      ...(formValues.labTests ?? []),
                                    ];
                                    tests[index] = {
                                      ...tests[index],
                                      testDate: date as Date,
                                    };
                                    form.setFieldValue("labTests", tests);
                                  }}
                                  selected={
                                    formValues.labTests?.[index]?.testDate
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="md:col-span-2">
                            <Textarea
                              onChange={(e) => {
                                const tests = [...(formValues.labTests ?? [])];
                                tests[index] = {
                                  ...tests[index],
                                  notes: e.target.value,
                                };
                                form.setFieldValue("labTests", tests);
                              }}
                              placeholder="Test notes..."
                              value={formValues.labTests?.[index]?.notes ?? ""}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    className="w-full"
                    onClick={addLabTest}
                    type="button"
                    variant="outline"
                  >
                    + Add Lab Test
                  </Button>
                </div>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent className="mt-6 space-y-6" value="prescriptions">
                <div className="space-y-4">
                  {formValues.prescriptions?.map((_, index) => (
                    <Card
                      className="relative"
                      key={_.medicationName.toString()}
                    >
                      <CardContent className="pt-6">
                        <Button
                          className="absolute top-2 right-2"
                          onClick={() => removePrescription(index)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          ✕
                        </Button>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input
                            onChange={(e) => {
                              const prescriptions = [
                                ...(formValues.prescriptions ?? []),
                              ];
                              prescriptions[index] = {
                                ...prescriptions[index],
                                medicationName: e.target.value,
                              };
                              form.setFieldValue(
                                "prescriptions",
                                prescriptions,
                              );
                            }}
                            placeholder="Medication name"
                            value={
                              formValues.prescriptions?.[index]
                                ?.medicationName ?? ""
                            }
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              onChange={(e) => {
                                const prescriptions = [
                                  ...(formValues.prescriptions ?? []),
                                ];
                                prescriptions[index] = {
                                  ...prescriptions[index],
                                  dosageValue: Number.parseFloat(
                                    e.target.value,
                                  ),
                                };
                                form.setFieldValue(
                                  "prescriptions",
                                  prescriptions,
                                );
                              }}
                              placeholder="Dosage"
                              type="number"
                              value={
                                formValues.prescriptions?.[index]
                                  ?.dosageValue ?? 0
                              }
                            />
                            <Select
                              onValueChange={(value) => {
                                const prescriptions = [
                                  ...(formValues.prescriptions ?? []),
                                ];
                                prescriptions[index] = {
                                  ...prescriptions[index],
                                  dosageUnit: value,
                                };
                                form.setFieldValue(
                                  "prescriptions",
                                  prescriptions,
                                );
                              }}
                              value={
                                formValues.prescriptions?.[index]?.dosageUnit ??
                                "mg"
                              }
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

                          <Select
                            onValueChange={(value) => {
                              const prescriptions = [
                                ...(formValues.prescriptions ?? []),
                              ];
                              prescriptions[index] = {
                                ...prescriptions[index],
                                frequency: value,
                              };
                              form.setFieldValue(
                                "prescriptions",
                                prescriptions,
                              );
                            }}
                            value={
                              formValues.prescriptions?.[index]?.frequency ??
                              "ONCE_DAILY"
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {frequencies.map((freq) => (
                                <SelectItem key={freq.value} value={freq.value}>
                                  {freq.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            onChange={(e) => {
                              const prescriptions = [
                                ...(formValues.prescriptions ?? []),
                              ];
                              prescriptions[index] = {
                                ...prescriptions[index],
                                duration: e.target.value,
                              };
                              form.setFieldValue(
                                "prescriptions",
                                prescriptions,
                              );
                            }}
                            placeholder="Duration (e.g., 7 days)"
                            value={
                              formValues.prescriptions?.[index]?.duration ?? ""
                            }
                          />

                          <div className="md:col-span-2">
                            <Textarea
                              onChange={(e) => {
                                const prescriptions = [
                                  ...(formValues.prescriptions ?? []),
                                ];
                                prescriptions[index] = {
                                  ...prescriptions[index],
                                  instructions: e.target.value,
                                };
                                form.setFieldValue(
                                  "prescriptions",
                                  prescriptions,
                                );
                              }}
                              placeholder="Instructions (e.g., Take with food)"
                              value={
                                formValues.prescriptions?.[index]
                                  ?.instructions ?? ""
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    className="w-full"
                    onClick={addPrescription}
                    type="button"
                    variant="outline"
                  >
                    + Add Prescription
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Status Badge Display */}
            {formValues.status && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <span className="font-medium text-sm">Status:</span>
                <Badge
                  className={cn(
                    formValues.status === "ACTIVE" && "bg-green-500",
                    formValues.status === "COMPLETED" && "bg-blue-500",
                    formValues.status === "FOLLOW_UP" && "bg-yellow-500",
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
                  ? "Saving..."
                  : initialData?.patientId
                    ? "Update Encounter"
                    : "Save Encounter"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
