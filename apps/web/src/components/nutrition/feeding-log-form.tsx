// src/components/nutrition/feeding-log-form.tsx

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
import { Textarea } from "@clinic-app/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { CalendarIcon, Clock, Droplet, Milk } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const feedingLogSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  feedingTime: z.date(),
  feedingType: z.enum(["breastfeeding", "formula", "solid", "mixed"]),
  duration: z.number().optional(), // minutes for breastfeeding
  amount: z.number().optional(), // oz/ml for formula
  foodType: z.string().optional(), // for solids
  notes: z.string().optional(),
});

type FeedingLogFormValues = z.infer<typeof feedingLogSchema>;

interface FeedingLogFormProps {
  patientId: string;
  onSubmit: (data: FeedingLogFormValues) => void;
  initialData?: Partial<FeedingLogFormValues>;
  onCancel?: () => void;
}

const feedingTypes = [
  { value: "breastfeeding", label: "Breastfeeding", icon: Milk },
  { value: "formula", label: "Formula", icon: Droplet },
  { value: "solid", label: "Solid Foods", icon: Clock },
  { value: "mixed", label: "Mixed Feeding", icon: Droplet },
];

export function FeedingLogForm({
  patientId,
  onSubmit,
  initialData,
  onCancel,
}: FeedingLogFormProps) {
  const form = useForm({
    defaultValues: {
      patientId: initialData?.patientId ?? patientId,
      feedingTime: initialData?.feedingTime ?? new Date(),
      feedingType: initialData?.feedingType ?? "breastfeeding",
      duration: initialData?.duration,
      amount: initialData?.amount,
      foodType: initialData?.foodType ?? "",
      notes: initialData?.notes ?? "",
    } as FeedingLogFormValues,
    validators: {
      onSubmit: feedingLogSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
      toast.success("Feeding log saved successfully");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Feeding</CardTitle>
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
          {/* Feeding Time */}
          <form.Field name="feedingTime">
            {(field) => (
              <div className="space-y-2">
                <Label>Feeding Time *</Label>
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
                      {field.state.value
                        ? format(field.state.value, "PPP p")
                        : "Select date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.state.value}
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
                    />
                    <div className="border-t p-3">
                      <Input
                        type="time"
                        value={
                          field.state.value
                            ? format(field.state.value, "HH:mm")
                            : ""
                        }
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDate = field.state.value || new Date();
                          newDate.setHours(hours || 0, minutes || 0);
                          field.handleChange(newDate);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.map((error) => (
                  <p key={String(error)} className="text-destructive text-sm">
                    {String(error)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Feeding Type */}
          <form.Field name="feedingType">
            {(field) => (
              <div className="space-y-2">
                <Label>Feeding Type *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(
                      value as FeedingLogFormValues["feedingType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select feeding type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
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
          </form.Field>

          {/* Conditional Fields based on feeding type */}
          <form.Field name="feedingType">
            {(typeField) => {
              const feedingType = typeField.state.value;

              return (
                <>
                  {feedingType === "breastfeeding" && (
                    <form.Field name="duration">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 15"
                            value={field.state.value || ""}
                            onChange={(e) =>
                              field.handleChange(
                                Number.parseInt(e.target.value, 10) ||
                                  undefined,
                              )
                            }
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
                    </form.Field>
                  )}

                  {feedingType === "formula" && (
                    <form.Field name="amount">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Amount (oz/mL)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="e.g., 4"
                            value={field.state.value || ""}
                            onChange={(e) =>
                              field.handleChange(
                                Number.parseFloat(e.target.value) || undefined,
                              )
                            }
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
                    </form.Field>
                  )}

                  {feedingType === "solid" && (
                    <form.Field name="foodType">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Food Type</Label>
                          <Input
                            placeholder="e.g., Applesauce, Rice cereal"
                            value={field.state.value}
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
                    </form.Field>
                  )}

                  {feedingType === "mixed" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <form.Field name="duration">
                        {(field) => (
                          <div className="space-y-2">
                            <Label>Breastfeeding Duration (min)</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 10"
                              value={field.state.value || ""}
                              onChange={(e) =>
                                field.handleChange(
                                  Number.parseInt(e.target.value, 10) ||
                                    undefined,
                                )
                              }
                            />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="amount">
                        {(field) => (
                          <div className="space-y-2">
                            <Label>Formula Amount (oz/mL)</Label>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="e.g., 2"
                              value={field.state.value || ""}
                              onChange={(e) =>
                                field.handleChange(
                                  Number.parseFloat(e.target.value) ||
                                    undefined,
                                )
                              }
                            />
                          </div>
                        )}
                      </form.Field>
                    </div>
                  )}
                </>
              );
            }}
          </form.Field>

          {/* Notes */}
          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any observations or additional notes..."
                  value={field.state.value}
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
          </form.Field>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <form.Subscribe>
              {(state) => (
                <Button type="submit" disabled={state.isSubmitting}>
                  {state.isSubmitting ? "Saving..." : "Save Feeding Log"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
