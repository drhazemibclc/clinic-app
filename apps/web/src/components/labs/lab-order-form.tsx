// src/components/labs/lab-order-form.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Input } from "@clinic-app/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@clinic-app/ui/components/popover";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { cn } from "@clinic-app/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";

const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  testName: z.string().min(1, "Test name is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["routine", "urgent", "stat"]),
  orderedDate: z.date(),
  notes: z.string().optional(),
});

type LabOrderFormValues = z.infer<typeof labOrderSchema>;

interface LabOrderFormProps {
  onSubmit: (data: LabOrderFormValues) => void;
  isLoading?: boolean;
}

const testCategories = [
  { value: "hematology", label: "Hematology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "microbiology", label: "Microbiology" },
  { value: "immunology", label: "Immunology" },
  { value: "urinalysis", label: "Urinalysis" },
  { value: "pathology", label: "Pathology" },
  { value: "genetics", label: "Genetics" },
];

const commonTests = {
  hematology: [
    "CBC",
    "Hemoglobin",
    "WBC Count",
    "Platelet Count",
    "Blood Smear",
  ],
  chemistry: [
    "Basic Metabolic Panel",
    "Comprehensive Metabolic Panel",
    "Liver Function Tests",
    "Renal Function Panel",
    "Lipid Panel",
    "Thyroid Function Tests",
  ],
  microbiology: [
    "Blood Culture",
    "Urine Culture",
    "Throat Swab",
    "Stool Culture",
    "CSF Analysis",
  ],
  immunology: [
    "IgG/IgM/IgA Levels",
    "Allergy Panel",
    "Autoimmune Panel",
    "C3/C4 Complement",
  ],
  urinalysis: ["Urinalysis Complete", "Microscopic Analysis", "Urine Culture"],
  pathology: ["Biopsy", "Cytology", "Histopathology"],
  genetics: ["Karyotype", "Genetic Screening", "Newborn Screening"],
};

export function LabOrderForm({ onSubmit, isLoading }: LabOrderFormProps) {
  const form = useForm({
    defaultValues: {
      patientId: "",
      testName: "",
      category: "",
      priority: "routine" as LabOrderFormValues["priority"],
      orderedDate: new Date(),
      notes: "",
    },

    validators: {},
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Laboratory Test</CardTitle>
        <CardDescription>
          Enter test details and patient information to place a lab order
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-4">
          <form.Field name="patientId">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="font-medium text-sm">
                  Patient *
                </label>
                <Input
                  id={field.name}
                  placeholder="Search patient by name or ID"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error} className="text-destructive text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="category">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="font-medium text-sm">
                    Test Category *
                  </label>
                  <select
                    id={field.name}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      form.getFieldValue("testName") &&
                        form.setFieldValue("testName", "");
                    }}
                  >
                    <option value="">Select category</option>
                    {testCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.errors.map((error) => (
                    <p key={error} className="text-destructive text-sm">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="testName">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="font-medium text-sm">
                    Test Name *
                  </label>
                  <select
                    id={field.name}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={!form.getFieldValue("category")}
                  >
                    <option value="">Select test</option>
                    {form.getFieldValue("category") &&
                      commonTests[
                        form.getFieldValue(
                          "category",
                        ) as keyof typeof commonTests
                      ]?.map((test) => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                  </select>
                  {field.state.meta.errors.map((error) => (
                    <p key={error} className="text-destructive text-sm">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="priority">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="font-medium text-sm">
                  Priority *
                </label>
                <select
                  id={field.name}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value as LabOrderFormValues["priority"],
                    )
                  }
                >
                  <option value="routine">Routine (24-48 hours)</option>
                  <option value="urgent">Urgent (4-8 hours)</option>
                  <option value="stat">STAT (1-2 hours)</option>
                </select>
                {field.state.meta.errors.map((error) => (
                  <p key={error} className="text-destructive text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="orderedDate">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="font-medium text-sm">
                  Order Date *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.state.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.state.value ? (
                        format(field.state.value, "PPP")
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
                  <p key={error} className="text-destructive text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="font-medium text-sm">
                  Clinical Notes
                </label>
                <Textarea
                  id={field.name}
                  placeholder="Add relevant clinical information for the lab..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error} className="text-destructive text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <form.Subscribe>
            {(state) => (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!state.canSubmit || state.isSubmitting || isLoading}
                >
                  {state.isSubmitting || isLoading
                    ? "Ordering..."
                    : "Order Test"}
                </Button>
              </>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
