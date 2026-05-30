// src/components/forms/patient-form.tsx

import {
  maritalStatusEnum,
  nutritionalStatusEnum,
} from "@clinic-app/db/schema/clinic";
import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Calendar as CalendarComponent } from "@clinic-app/ui/components/calendar";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import { cn } from "@clinic-app/ui/lib/utils";
import { calculateAge, generateId } from "@clinic-app/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Heart,
  Phone,
  User,
  Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import * as z from "zod";
import { orpc } from "@/utils/orpc";
import { useAppForm, useFormFields } from "../forms/tanstack-form";

// Schema for patient form - only user-editable fields
const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email().or(z.literal("")),
  phone: z.string(),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  maritalStatus: z.enum(maritalStatusEnum.enumValues).or(z.undefined()),
  address: z.string(),
  emergencyContactName: z.string(),
  emergencyContactNumber: z.string(),
  relation: z.string(),
  bloodGroup: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
    ])
    .or(z.undefined()),
  role: z.literal("patient"),
  allergies: z.string(),
  medicalConditions: z.string(),
  medicalHistory: z.string(),
  nutritionalStatus: z.enum(nutritionalStatusEnum.enumValues),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  colorCode: z.string(),
  image: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string(),
  guardianRelation: z.string(),
  isPrimaryGuardian: z.boolean(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const maritalStatusOptions = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

const bloodGroupOptions = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500" },
  { value: "INACTIVE", label: "Inactive", color: "bg-gray-500" },
];

type PatientFormProps = {
  clinicId?: string;
  initialData?: Partial<PatientFormValues> & {
    id?: string;
    userId?: string;
    createdAt?: Date;
    clinicId?: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
  userId?: string;
};

export function PatientForm({
  initialData,
  onSuccess,
  onCancel,
  userId,
}: PatientFormProps) {
  const queryClient = useQueryClient();

  // Create patient mutation
  const { mutate: createPatient, isPending: isCreatePending } = useMutation(
    orpc.patient.create.mutationOptions({
      onSuccess: () => {
        toast.success("Patient created successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.patient.key(),
        });
        onSuccess?.();
      },
      onError(error: Error) {
        console.error(error);
        toast.error(error.message || "Failed to create patient");
      },
    }),
  );

  // Update patient mutation
  const { mutate: updatePatient, isPending: isUpdatePending } = useMutation(
    orpc.patient.update.mutationOptions({
      onSuccess: () => {
        toast.success("Patient updated successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.patient.key(),
        });
        onSuccess?.();
      },
      onError(error: Error) {
        console.error(error);
        toast.error(error.message || "Failed to update patient");
      },
    }),
  );

  const isEditing = !!initialData?.id;
  const isPending = isCreatePending || isUpdatePending;

  const form = useAppForm({
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      email: initialData?.email ?? "",
      role: "patient",
      phone: initialData?.phone ?? "",
      dateOfBirth: initialData?.dateOfBirth
        ? new Date(initialData.dateOfBirth)
        : new Date(),
      gender: (initialData?.gender as "MALE" | "FEMALE" | "OTHER") ?? "MALE",
      maritalStatus:
        (initialData?.maritalStatus as
          | "SINGLE"
          | "MARRIED"
          | "DIVORCED"
          | "WIDOWED"
          | undefined
          | null) ?? undefined,
      address: initialData?.address ?? "",
      emergencyContactName: initialData?.emergencyContactName ?? "",
      emergencyContactNumber: initialData?.emergencyContactNumber ?? "",
      relation: initialData?.relation ?? "",
      bloodGroup:
        (initialData?.bloodGroup as
          | "A_POSITIVE"
          | "A_NEGATIVE"
          | "B_POSITIVE"
          | "B_NEGATIVE"
          | "O_POSITIVE"
          | "O_NEGATIVE"
          | "AB_POSITIVE"
          | "AB_NEGATIVE"
          | undefined) ?? undefined,
      allergies: initialData?.allergies ?? "",
      medicalConditions: initialData?.medicalConditions ?? "",
      medicalHistory: initialData?.medicalHistory ?? "",
      nutritionalStatus: initialData?.nutritionalStatus ?? "NORMAL",
      status: (initialData?.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
      colorCode: initialData?.colorCode ?? "",
      image: initialData?.image ?? "",
      guardianName: initialData?.guardianName ?? "",
      guardianPhone: initialData?.guardianPhone ?? "",
      guardianEmail: initialData?.guardianEmail ?? "",
      guardianRelation: initialData?.guardianRelation ?? "",
      isPrimaryGuardian: initialData?.isPrimaryGuardian ?? false,
    },
    validators: {
      onSubmit: patientFormSchema,
    },
    onSubmit: async ({ value }: { value: PatientFormValues }) => {
      const patientData = {
        id: initialData?.id ?? crypto.randomUUID(),
        userId: userId ?? initialData?.userId ?? crypto.randomUUID(),
        clinicId: initialData?.clinicId ?? crypto.randomUUID(),
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email || null,
        role: "patient" as const,
        phone: value.phone || null,
        dateOfBirth: value.dateOfBirth,
        gender: value.gender,
        maritalStatus: value.maritalStatus ?? null,
        address: value.address || null,
        emergencyContactName: value.emergencyContactName || null,
        emergencyContactNumber: value.emergencyContactNumber || null,
        relation: value.relation || null,
        bloodGroup: value.bloodGroup ?? null,
        allergies: value.allergies || null,
        medicalConditions: value.medicalConditions || null,
        medicalHistory: value.medicalHistory || null,
        nutritionalStatus: value.nutritionalStatus,
        status: value.status,
        colorCode: value.colorCode || null,
        image: value.image || null,
        isActive: value.status === "ACTIVE",
        isDeleted: false,
        updatedById: null,
        createdAt: initialData?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };

      if (isEditing) {
        updatePatient({ id: initialData?.id ?? "", data: patientData });
      } else {
        createPatient(patientData);
      }
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);
  const {
    FormSelectField,
    FormTextField,
    FormTextareaField,
    FormCheckboxField,
  } = useFormFields<PatientFormValues>();

  // Calculate age from date of birth
  // const calculateAge = (dob: Date | undefined) => {
  // 	if (!dob) return null;
  // 	const today = new Date();
  // 	let age = today.getFullYear() - dob.getFullYear();
  // 	const monthDiff = today.getMonth() - dob.getMonth();
  // 	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
  // 		age--;
  // 	}
  // 	return age;
  // };

  const age = calculateAge(formValues.dateOfBirth);

  const [activeTab, setActiveTab] = React.useState("basic");

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-bold text-2xl">
              {isEditing ? "Edit Patient" : "Register New Patient"}
            </CardTitle>
            <p className="text-muted-foreground">
              Enter patient information and medical history
            </p>
          </div>
          {formValues.status && (
            <Badge
              className={cn(
                "capitalize",
                formValues.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500",
              )}
            >
              {formValues.status.toLowerCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form>
            <Tabs
              className="w-full"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger className="flex items-center gap-2" value="basic">
                  <User className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center gap-2"
                  value="contact"
                >
                  <Phone className="h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center gap-2"
                  value="medical"
                >
                  <Heart className="h-4 w-4" />
                  Medical Info
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center gap-2"
                  value="guardian"
                >
                  <Users className="h-4 w-4" />
                  Guardian
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent className="mt-6 space-y-6" value="basic">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField
                    label="First Name"
                    name="firstName"
                    placeholder="Enter first name"
                    required
                    validators={{
                      onBlur: z.string().min(1, "First name is required"),
                    }}
                  />

                  <FormTextField
                    label="Last Name"
                    name="lastName"
                    placeholder="Enter last name"
                    required
                    validators={{
                      onBlur: z.string().min(1, "Last name is required"),
                    }}
                  />

                  {/* Date of Birth Picker */}
                  <form.AppField name="dateOfBirth">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>
                          Date of Birth <span className="text-red-500">*</span>
                        </Label>
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
                            <CalendarComponent
                              mode="single"
                              onSelect={(date) =>
                                field.handleChange(date as Date)
                              }
                              selected={field.state.value}
                            />
                          </PopoverContent>
                        </Popover>
                        {field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0 && (
                            <p className="text-red-500 text-sm">
                              {String(field.state.meta.errors[0])}
                            </p>
                          )}
                        {typeof age === "number" && age >= 0 && (
                          <p className="text-muted-foreground text-sm">
                            Age: {age} years
                          </p>
                        )}
                      </div>
                    )}
                  </form.AppField>

                  <FormSelectField
                    label="Gender"
                    name="gender"
                    options={genderOptions}
                    placeholder="Select gender"
                    required
                  />

                  <FormSelectField
                    label="Marital Status"
                    name="maritalStatus"
                    options={maritalStatusOptions}
                    placeholder="Select marital status"
                  />

                  <FormSelectField
                    label="Status"
                    name="status"
                    options={statusOptions.map((opt) => {
                      return {
                        value: opt.value,
                        label: opt.label,
                      };
                    })}
                    placeholder="Select status"
                  />

                  <FormTextField
                    label="Color Code (for calendar)"
                    name="colorCode"
                    placeholder="#e.g., #FF5733"
                    type="color"
                  />
                </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent className="mt-6 space-y-6" value="contact">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField
                    label="Email"
                    name="email"
                    placeholder="patient@example.com"
                    type="email"
                  />

                  <FormTextField
                    label="Phone Number"
                    name="phone"
                    placeholder="+1 234 567 8900"
                    type="tel"
                  />

                  <FormTextareaField
                    label="Address"
                    name="address"
                    placeholder="Full address"
                    rows={2}
                  />

                  <div className="space-y-4">
                    <Label className="font-semibold">Emergency Contact</Label>
                    <div className="space-y-3">
                      <FormTextField
                        label="Contact Name"
                        name="emergencyContactName"
                        placeholder="Full name"
                      />
                      <FormTextField
                        label="Contact Number"
                        name="emergencyContactNumber"
                        placeholder="Phone number"
                        type="tel"
                      />
                      <FormTextField
                        label="Relationship"
                        name="relation"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Medical Information Tab */}
              <TabsContent className="mt-6 space-y-6" value="medical">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormSelectField
                    label="Blood Group"
                    name="bloodGroup"
                    options={bloodGroupOptions}
                    placeholder="Select blood group"
                  />

                  <FormTextField
                    label="Nutritional Status"
                    name="nutritionalStatus"
                    placeholder="e.g., Normal, Malnourished, Obese"
                  />

                  <FormTextareaField
                    className="md:col-span-2"
                    label="Allergies"
                    name="allergies"
                    placeholder="List any allergies (medications, food, environmental)"
                    rows={3}
                  />

                  <FormTextareaField
                    className="md:col-span-2"
                    label="Chronic Conditions"
                    name="medicalConditions"
                    placeholder="List any chronic medical conditions"
                    rows={3}
                  />

                  <FormTextareaField
                    className="md:col-span-2"
                    label="Medical History"
                    name="medicalHistory"
                    placeholder="Past surgeries, hospitalizations, significant illnesses"
                    rows={4}
                  />
                </div>
              </TabsContent>

              {/* Guardian Information Tab (Pediatric) */}
              <TabsContent className="mt-6 space-y-6" value="guardian">
                {typeof age === "number" && age < 18 && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="flex items-center gap-2 text-blue-700 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Patient is a minor. Guardian information is recommended.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField
                    label="Guardian Name"
                    name="guardianName"
                    placeholder="Full name of parent/guardian"
                  />

                  <FormTextField
                    label="Guardian Phone"
                    name="guardianPhone"
                    placeholder="Contact number"
                    type="tel"
                  />

                  <FormTextField
                    label="Guardian Email"
                    name="guardianEmail"
                    placeholder="guardian@example.com"
                    type="email"
                  />

                  <FormTextField
                    label="Guardian Relation"
                    name="guardianRelation"
                    placeholder="e.g., Mother, Father, Legal Guardian"
                  />

                  <div className="flex items-center space-x-2 md:col-span-2">
                    <FormCheckboxField
                      label="Is Primary Guardian"
                      name="isPrimaryGuardian"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            {/* Actions */}
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
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Patient"
                    : "Create Patient"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Quick patient registration form (minimal fields)
type QuickPatientFormProps = {
  clinicId?: string;
  onCancel?: () => void;
  onSuccess?: (patientId: string) => void;
  userId?: string;
};

export function QuickPatientForm({
  onSuccess,
  onCancel,
  userId,
}: QuickPatientFormProps) {
  const queryClient = useQueryClient();

  const { mutate: createPatient, isPending } = useMutation(
    orpc.patient.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Patient created successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.patient.key(),
        });
        onSuccess?.(data.id);
      },
      onError(error: Error) {
        console.error(error);
        toast.error(error.message || "Failed to create patient");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: new Date(),
      gender: "MALE" as "MALE" | "FEMALE",
    },
    validators: {
      onSubmit: z.object({
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        phone: z.string(),
        dateOfBirth: z.date(),
        gender: z.enum(["MALE", "FEMALE"]),
      }),
    },
    onSubmit: async ({ value }) => {
      createPatient({
        id: generateId(),
        userId: userId ?? crypto.randomUUID(),
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone || null,
        dateOfBirth: value.dateOfBirth,
        gender: value.gender,
        email: null,
        status: "ACTIVE",
        isActive: true,
        maritalStatus: null,
        address: null,
        emergencyContactName: null,
        emergencyContactNumber: null,
        relation: null,
        bloodGroup: null,
        allergies: null,
        medicalConditions: null,
        medicalHistory: null,
        nutritionalStatus: null,
        colorCode: null,
        image: null,
        role: null,
        clinicId: "",
      });
    },
  });

  const { FormTextField, FormSelectField } = useFormFields();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold text-xl">
          Quick Register Patient
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormTextField
                label="First Name"
                name="firstName"
                placeholder="First name"
                required
              />
              <FormTextField
                label="Last Name"
                name="lastName"
                placeholder="Last name"
                required
              />
            </div>

            <form.AppField name="dateOfBirth">
              {(field) => (
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
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
                      <CalendarComponent
                        mode="single"
                        onSelect={(date) => field.handleChange(date as Date)}
                        selected={field.state.value}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.AppField>

            <FormSelectField
              label="Gender"
              name="gender"
              options={genderOptions}
            />

            <FormTextField
              label="Phone (Optional)"
              name="phone"
              placeholder="Contact number"
              type="tel"
            />

            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button onClick={onCancel} type="button" variant="outline">
                  Cancel
                </Button>
              )}
              <form.SubmitButton disabled={isPending}>
                {isPending ? "Creating..." : "Create Patient"}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

// Export types
export type { PatientFormValues };
