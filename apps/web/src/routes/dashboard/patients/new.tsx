// app/routes/dashboard/patients/new.tsx

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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/patients/new")({
  component: NewPatientPage,
});

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  parentName: z.string().min(1, "Parent name is required"),
  parentEmail: z.email("Invalid email address"),
  parentPhone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

function NewPatientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createPatient = useMutation({
    mutationFn: orpc.patients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient registered successfully");
      navigate({ to: "/dashboard/patients" });
    },
    onError: (error) => {
      toast.error("Failed to register patient", { description: error.message });
    },
  });

  const form = useForm<PatientFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male" as const,
      bloodType: "",
      allergies: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      address: "",
      emergencyContact: "",
    },
    validators: {
      onChange: patientSchema,
    },
    onSubmit: async ({ value }) => {
      createPatient.mutate(value);
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Register New Patient
        </h1>
        <p className="text-muted-foreground">
          Enter patient and guardian information
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="firstName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>First Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Last Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="dateOfBirth">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Date of Birth *</Label>
                    <Input
                      type="date"
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Gender *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="bloodType">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Blood Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="allergies">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Allergies</Label>
                    <Input
                      id={field.name}
                      placeholder="e.g., Penicillin, Peanuts"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="parentName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Parent/Guardian Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="parentEmail">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email *</Label>
                    <Input
                      type="email"
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="parentPhone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Phone Number *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors && (
                      <p className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="emergencyContact">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Emergency Contact</Label>
                    <Input
                      id={field.name}
                      placeholder="Alternative contact number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="address">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Address</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/dashboard/patients" })}
          >
            Cancel
          </Button>
          <form.Subscribe>
            {(_state) => (
              <Button type="submit" disabled={createPatient.isPending}>
                {createPatient.isPending
                  ? "Registering..."
                  : "Register Patient"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
