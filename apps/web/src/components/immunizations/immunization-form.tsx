// src/components/immunizations/ImmunizationForm.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@clinic-app/ui/components/textarea";
import { cn } from "@clinic-app/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { orpc } from "@/utils/orpc";

const immunizationSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  date: z.date({ error: "Date is required" }),
  dose: z.string().min(1, "Dose number is required"),
  lotNumber: z.string().optional(),
  administeredByStaffId: z.string().optional(),
  notes: z.string().optional(),
  batchId: z.string().optional(),
});

type ImmunizationFormValues = z.infer<typeof immunizationSchema>;

interface ImmunizationFormProps {
  patientId?: string;
  onSuccess?: () => void;
  clinicId: string;
  onCancel?: () => void;
}

export function ImmunizationForm({
  patientId: initialPatientId,
  onSuccess,
  onCancel,
  clinicId,
}: ImmunizationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery(
    orpc.patient.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Fetch doctors/staff for dropdown
  const { data: doctorsData } = useQuery(
    orpc.doctors.list.queryOptions({
      input: { search: "" },
    }),
  );

  // Fetch vaccine inventory
  const { data: inventoryData } = useQuery(
    orpc.immunizations.getInventory.queryOptions({ input: { clinicId } }),
  );

  const { mutateAsync: recordImmunization, isPending } = useMutation(
    orpc.immunizations.record.mutationOptions({
      onSuccess: () => {
        toast.success("Immunization recorded successfully");
        queryClient.invalidateQueries({ queryKey: orpc.immunizations.key() });
        router.invalidate();
        onSuccess?.();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to record immunization");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      patientId: initialPatientId || "",
      vaccineName: "",
      date: new Date(),
      dose: "",
      lotNumber: "",
      administeredByStaffId: "",
      notes: "",
      batchId: "",
    } as ImmunizationFormValues,
    onSubmit: async ({ value }) => {
      await recordImmunization(value);
    },
    validators: {
      onSubmit: immunizationSchema,
    },
  });

  const patients = patientsData?.patients || [];
  const staff = doctorsData?.doctors || [];
  const inventory = inventoryData?.inventory || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Immunization</CardTitle>
        <CardDescription>
          Document vaccine administration for pediatric patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Patient Selection */}
          <form.Field name="patientId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Patient *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={!!initialPatientId}
                >
                  <SelectTrigger
                    id={field.name}
                    className={cn(
                      field.state.meta.errors.length > 0 &&
                        "border-destructive",
                    )}
                  >
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Vaccine Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="vaccineName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Vaccine *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className={cn(
                        field.state.meta.errors.length > 0 &&
                          "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      {vaccineOptions.map((vaccine) => (
                        <SelectItem key={vaccine.value} value={vaccine.value}>
                          {vaccine.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            {/* Dose Number */}
            <form.Field name="dose">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Dose Number *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className={cn(
                        field.state.meta.errors.length > 0 &&
                          "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select dose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Dose</SelectItem>
                      <SelectItem value="2">2nd Dose</SelectItem>
                      <SelectItem value="3">3rd Dose</SelectItem>
                      <SelectItem value="4">4th Dose</SelectItem>
                      <SelectItem value="5">5th Dose</SelectItem>
                      <SelectItem value="Booster">Booster</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          {/* Date and Lot Number */}
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="date">
              {(field) => (
                <div className="space-y-2">
                  <Label>Administration Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.state.value && "text-muted-foreground",
                          field.state.meta.errors.length > 0 &&
                            "border-destructive",
                        )}
                      >
                        {field.state.value ? (
                          field.state.value.toLocaleDateString()
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.state.value}
                        onSelect={(date) =>
                          field.handleChange(date || new Date())
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="lotNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Lot Number</Label>
                  <Input
                    id={field.name}
                    placeholder="e.g., VAC-2024-001"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          {/* Batch ID (Inventory) */}
          <form.Field name="batchId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Inventory Batch (Optional)</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select from inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.vaccineName} - Lot: {item.lotNumber} (Qty:{" "}
                        {item.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Administered By */}
          <form.Field name="administeredByStaffId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Administered By</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.name || `${staffMember.name ?? ""}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Notes */}
          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  placeholder="Any additional notes about the immunization..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  disabled={!state.canSubmit || state.isSubmitting || isPending}
                >
                  {state.isSubmitting || isPending
                    ? "Recording..."
                    : "Record Immunization"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Vaccine options for the form
const vaccineOptions = [
  { value: "BCG", label: "BCG" },
  { value: "Hepatitis B", label: "Hepatitis B" },
  { value: "DPT", label: "DPT" },
  { value: "Polio", label: "Polio (OPV/IPV)" },
  { value: "MMR", label: "MMR" },
  { value: "Hib", label: "Hib" },
  { value: "PCV", label: "Pneumococcal (PCV)" },
  { value: "Rotavirus", label: "Rotavirus" },
  { value: "Influenza", label: "Influenza" },
  { value: "Varicella", label: "Varicella (Chickenpox)" },
  { value: "HPV", label: "HPV" },
  { value: "Tdap", label: "Tdap" },
  { value: "Meningococcal", label: "Meningococcal" },
  { value: "COVID-19", label: "COVID-19" },
];
