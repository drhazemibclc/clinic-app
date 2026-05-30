// src/components/forms/DoctorForm.tsx

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
import { generateId } from "@clinic-app/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import { CalendarIcon, Mail, Phone, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "#/lib/utils";
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form";
import { orpc } from "@/utils/orpc";

// Doctor specialties for dropdown
const doctorSpecialties = [
  { value: "Pediatrician", label: "Pediatrician" },
  { value: "Cardiologist", label: "Cardiologist" },
  { value: "Neurologist", label: "Neurologist" },
  { value: "Dermatologist", label: "Dermatologist" },
  { value: "Orthopedic", label: "Orthopedic Surgeon" },
  { value: "ENT", label: "ENT Specialist" },
  { value: "Ophthalmologist", label: "Ophthalmologist" },
  { value: "Psychiatrist", label: "Child Psychiatrist" },
  { value: "Allergist", label: "Allergist" },
  { value: "Gastroenterologist", label: "Gastroenterologist" },
  { value: "Endocrinologist", label: "Endocrinologist" },
  { value: "Nephrologist", label: "Nephrologist" },
];

// Doctor status options
const doctorStatuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
];

// Doctor Form Schema
const doctorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Doctor name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().optional(),
  specialty: z.string().min(1, "Please select a specialty"),
  status: z
    .enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"])
    .default("PENDING"),
  isActive: z.boolean().default(true),
  bio: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  licenseNumber: z.string().optional(),
  npiNumber: z.string().optional(),
  joiningDate: z.date().optional(),
  colorCode: z.string().optional(),
  image: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

type DoctorFormProps = {
  initialData?: Partial<DoctorFormValues> & { id?: string };
  onCancel?: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
};

export function DoctorForm({
  initialData,
  onSuccess,
  onCancel,
  readOnly = false,
}: DoctorFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  // Create doctor mutation
  const { mutate: createDoctor, isPending: isCreatePending } = useMutation(
    orpc.doctors.create.mutationOptions({
      onSuccess: () => {
        toast.success("Doctor added successfully");
        queryClient.invalidateQueries({ queryKey: orpc.doctors.key() });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error(error);
        toast.error(error.message || "Failed to add doctor");
      },
    }),
  );

  // Update doctor mutation
  const { mutate: updateDoctor, isPending: isUpdatePending } = useMutation(
    orpc.doctors.update.mutationOptions({
      onSuccess: () => {
        toast.success("Doctor updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.doctors.key() });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error(error);
        toast.error(error.message || "Failed to update doctor");
      },
    }),
  );

  const isPending = isCreatePending || isUpdatePending;

  const form = useAppForm({
    defaultValues: {
      id: initialData?.id ?? generateId(),
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      specialty: initialData?.specialty ?? "",
      status:
        (initialData?.status as
          | "ACTIVE"
          | "INACTIVE"
          | "PENDING"
          | "SUSPENDED") ?? "PENDING",
      isActive: initialData?.isActive ?? true,
      bio: initialData?.bio ?? "",
      education: initialData?.education ?? "",
      experience: initialData?.experience ?? "",
      licenseNumber: initialData?.licenseNumber ?? "",
      npiNumber: initialData?.npiNumber ?? "",
      joiningDate: initialData?.joiningDate
        ? new Date(initialData.joiningDate)
        : undefined,
      colorCode: initialData?.colorCode ?? "#3b82f6",
      image: initialData?.image ?? "",
      address: initialData?.address ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      zipCode: initialData?.zipCode ?? "",
    } satisfies DoctorFormValues,
    validators: {},
    onSubmit: async ({ value }) => {
      const doctorData = {
        ...value,
        id: value.id ?? generateId(),
        isActive: value.status === "ACTIVE",
      };

      if (isEditing && initialData?.id) {
        updateDoctor({
          id: initialData.id,
          data: doctorData,
        });
      } else {
        createDoctor(doctorData);
      }
    },
  });

  const formValues = useSelector(form.store, (s) => s.values);
  const { FormSelectField, FormTextField, FormTextareaField } =
    useFormFields<DoctorFormValues>();

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl">
          <Stethoscope className="h-6 w-6" />
          {isEditing ? "Edit Doctor" : "Add New Doctor"}
        </CardTitle>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update physician or specialist information"
            : "Register a new physician or specialist to the clinic"}
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Basic Information
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  disabled={readOnly}
                  label="Full Name"
                  name="name"
                  placeholder="e.g., Dr. Sarah Johnson"
                  required
                  validators={{
                    onBlur: z.string().min(1, "Doctor name is required"),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Email Address"
                  name="email"
                  placeholder="doctor@clinic.com"
                  type="email"
                  required
                  validators={{
                    onBlur: z.string().email("Invalid email address"),
                  }}
                />

                <FormTextField
                  disabled={readOnly}
                  label="Phone Number"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                />

                <FormSelectField
                  label="Specialty"
                  name="specialty"
                  options={doctorSpecialties}
                  placeholder="Select specialty"
                  required
                  validators={{
                    onBlur: z.string().min(1, "Please select a specialty"),
                  }}
                />

                <FormSelectField
                  label="Status"
                  name="status"
                  options={doctorStatuses}
                  placeholder="Select status"
                  required
                />

                {/* Color Picker for Calendar */}
                <div className="space-y-2">
                  <Label>Calendar Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-9 w-12 cursor-pointer rounded-md border p-1"
                      value={formValues.colorCode || "#3b82f6"}
                      onChange={(e) =>
                        form.setFieldValue("colorCode", e.target.value)
                      }
                      disabled={readOnly}
                    />
                    <Input
                      className="w-28 font-mono"
                      placeholder="#3b82f6"
                      value={formValues.colorCode || ""}
                      onChange={(e) =>
                        form.setFieldValue("colorCode", e.target.value)
                      }
                      disabled={readOnly}
                    />
                    <span className="text-muted-foreground text-xs">
                      Used for calendar events
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Mail className="h-5 w-5" />
                Professional Details
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  disabled={readOnly}
                  label="License Number"
                  name="licenseNumber"
                  placeholder="Medical license number"
                />

                <FormTextField
                  disabled={readOnly}
                  label="NPI Number"
                  name="npiNumber"
                  placeholder="National Provider Identifier"
                />

                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  <form.AppField name="joiningDate">
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
                            {field.state.value ? (
                              format(field.state.value, "PPP")
                            ) : (
                              <span>Select joining date</span>
                            )}
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
                  label="Years of Experience"
                  name="experience"
                  placeholder="e.g., 10+ years in pediatrics"
                />
              </div>
            </div>

            {/* Education & Bio */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Phone className="h-5 w-5" />
                Education & Background
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4">
                <FormTextareaField
                  disabled={readOnly}
                  label="Education"
                  name="education"
                  placeholder="Medical school, residency, fellowships..."
                  rows={2}
                />

                <FormTextareaField
                  disabled={readOnly}
                  label="Professional Bio"
                  name="bio"
                  placeholder="Brief biography for patient portal and directory..."
                  rows={3}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5" />
                Address Information
              </h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  disabled={readOnly}
                  label="Address"
                  name="address"
                  placeholder="Street address"
                />

                <FormTextField
                  disabled={readOnly}
                  label="City"
                  name="city"
                  placeholder="City"
                />

                <FormTextField
                  disabled={readOnly}
                  label="State"
                  name="state"
                  placeholder="State"
                />

                <FormTextField
                  disabled={readOnly}
                  label="ZIP Code"
                  name="zipCode"
                  placeholder="ZIP code"
                />
              </div>
            </div>

            {/* Status Display for existing doctors */}
            {isEditing && initialData?.status && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <span className="font-medium text-sm">Current Status:</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium text-xs",
                    initialData.status === "ACTIVE" &&
                      "bg-green-100 text-green-700",
                    initialData.status === "INACTIVE" &&
                      "bg-gray-100 text-gray-700",
                    initialData.status === "PENDING" &&
                      "bg-yellow-100 text-yellow-700",
                    initialData.status === "SUSPENDED" &&
                      "bg-red-100 text-red-700",
                  )}
                >
                  {initialData.status.charAt(0) +
                    initialData.status.slice(1).toLowerCase()}
                </span>
              </div>
            )}

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
                      ? isEditing
                        ? "Updating..."
                        : "Adding..."
                      : isEditing
                        ? "Update Doctor"
                        : "Add Doctor"}
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

// Quick doctor registration form for onboarding
type QuickDoctorFormProps = {
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function QuickDoctorForm({ onSuccess, onCancel }: QuickDoctorFormProps) {
  return <DoctorForm onCancel={onCancel} onSuccess={onSuccess} />;
}
