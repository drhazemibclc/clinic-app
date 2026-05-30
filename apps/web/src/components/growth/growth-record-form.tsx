// src/components/growth/growth-record-form.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Input } from "@clinic-app/ui/components/input";
import { Label } from "@clinic-app/ui/components/label";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

interface GrowthRecordFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export function GrowthRecordForm({
  patientId,
  onSuccess,
}: GrowthRecordFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createGrowthMutation = useMutation(
    orpc.growth.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["growth"] });
        toast.success("Growth record added successfully");
        onSuccess?.();
        navigate({ to: "/dashboard/growth-analytic" });
      },
      onError: (error) => {
        toast.error("Failed to add growth record", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      date: new Date(),
      weight: undefined as number | undefined,
      height: undefined as number | undefined,
      headCircumference: undefined as number | undefined,
      notes: "",
    },
    onSubmit: async ({ value }) => {
      await createGrowthMutation.mutateAsync({
        patientId,
        ...value,
      });
    },
    validators: {},
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Growth Measurement</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="date">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Measurement Date</Label>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value.toISOString().split("T")[0]}
                  onChange={(e) => field.handleChange(new Date(e.target.value))}
                />
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 md:grid-cols-3">
            <form.Field name="weight">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Weight (kg)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.01"
                    placeholder="e.g., 12.5"
                    value={field.state.value || ""}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value
                          ? Number.parseFloat(e.target.value)
                          : undefined,
                      )
                    }
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="height">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Height (cm)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    placeholder="e.g., 85.5"
                    value={field.state.value || ""}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value
                          ? Number.parseFloat(e.target.value)
                          : undefined,
                      )
                    }
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="headCircumference">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Head Circumference (cm)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    placeholder="e.g., 48.5"
                    value={field.state.value || ""}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value
                          ? Number.parseFloat(e.target.value)
                          : undefined,
                      )
                    }
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  placeholder="Additional observations..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <div className="flex gap-2">
                <Button type="submit" disabled={state.isSubmitting}>
                  {state.isSubmitting ? "Saving..." : "Save Measurement"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard/growth-analytic" })}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
