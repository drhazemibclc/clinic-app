// src/components/labs/lab-result-upload.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { FileUploader } from "@clinic-app/ui/components/file-uploader";
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
import { z } from "zod";
import { useAppForm } from "@/components/forms/tanstack-form";

const labResultSchema = z.object({
  labTestId: z.string().min(1, "Lab test is required"),
  resultValue: z.string().min(1, "Result value is required"),
  unit: z.string().min(1, "Unit is required"),
  referenceRange: z.string().min(1, "Reference range is required"),
  interpretation: z.enum(["normal", "abnormal", "critical"]),
  notes: z.string().optional(),
  files: z.array(z.instanceof(File)).optional().default([]),
});

type LabResultFormValues = z.infer<typeof labResultSchema>;

interface LabResultUploadProps {
  onSubmit: (data: LabResultFormValues) => void;
  isLoading?: boolean;
  labTests?: Array<{ id: string; testName: string; patientName: string }>;
}

export function LabResultUpload({
  onSubmit,
  isLoading,
  labTests = [],
}: LabResultUploadProps) {
  const form = useAppForm({
    defaultValues: {
      labTestId: "",
      resultValue: "",
      unit: "",
      referenceRange: "",
      interpretation: "normal" as "normal" | "abnormal" | "critical",
      notes: "",
      files: [],
    },
    validators: {
      onSubmit: labResultSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Upload Lab Results</CardTitle>
        <CardDescription>
          Enter test results and upload supporting documents
        </CardDescription>
      </CardHeader>
      <form.AppForm>
        <form.Form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            <form.AppField name="labTestId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Lab Test *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lab test" />
                    </SelectTrigger>
                    <SelectContent>
                      {labTests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.testName} - {test.patientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-destructive text-sm">
                      {String(error)}
                    </p>
                  ))}
                </div>
              )}
            </form.AppField>

            <div className="grid gap-4 md:grid-cols-2">
              <form.AppField name="resultValue">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Result Value *</Label>
                    <Input
                      id={field.name}
                      placeholder="e.g., 12.5"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={String(error)}
                        className="text-destructive text-sm"
                      >
                        {String(error)}
                      </p>
                    ))}
                  </div>
                )}
              </form.AppField>

              <form.AppField name="unit">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Unit *</Label>
                    <Input
                      id={field.name}
                      placeholder="e.g., g/dL, mg/L, IU/mL"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={String(error)}
                        className="text-destructive text-sm"
                      >
                        {String(error)}
                      </p>
                    ))}
                  </div>
                )}
              </form.AppField>
            </div>

            <form.AppField name="referenceRange">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Reference Range *</Label>
                  <Input
                    id={field.name}
                    placeholder="e.g., 10.0-15.0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-destructive text-sm">
                      {String(error)}
                    </p>
                  ))}
                </div>
              )}
            </form.AppField>

            <form.AppField name="interpretation">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Interpretation *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(
                        value as LabResultFormValues["interpretation"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interpretation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="abnormal">Abnormal</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-destructive text-sm">
                      {String(error)}
                    </p>
                  ))}
                </div>
              )}
            </form.AppField>

            <form.AppField name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Clinical Notes</Label>
                  <Textarea
                    id={field.name}
                    placeholder="Add any additional notes or comments..."
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-destructive text-sm">
                      {String(error)}
                    </p>
                  ))}
                </div>
              )}
            </form.AppField>

            <form.AppField name="files">
              {(field) => (
                <div className="space-y-2">
                  <Label>Supporting Documents</Label>
                  <FileUploader
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    accept={{
                      "application/pdf": [".pdf"],
                      "image/jpeg": [".jpg", ".jpeg"],
                      "image/png": [".png"],
                    }}
                    maxSize={5 * 1024 * 1024} // 5MB
                    maxFiles={5}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-destructive text-sm">
                      {String(error)}
                    </p>
                  ))}
                </div>
              )}
            </form.AppField>
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
                    disabled={
                      !state.canSubmit || state.isSubmitting || isLoading
                    }
                  >
                    {state.isSubmitting || isLoading
                      ? "Uploading..."
                      : "Upload Results"}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </CardFooter>
        </form.Form>
      </form.AppForm>
    </Card>
  );
}
