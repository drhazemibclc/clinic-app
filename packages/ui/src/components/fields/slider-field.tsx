import { FieldDescription, FieldLabel } from "@clinic-app/ui/components/field";
import {
  createFormField,
  FormField,
  FormFieldSet,
  useFieldContext,
} from "@clinic-app/ui/components/form-context";
import { Slider } from "@clinic-app/ui/components/slider";
import { useSelector } from "@tanstack/react-store";

interface SliderFieldProps {
  label: string; // Keep this prop
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderField({
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
}: SliderFieldProps) {
  const field = useFieldContext();
  const value = (useSelector(field.store, (s) => s.value) as number) ?? min;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>{label}</FieldLabel>
        <div className="px-1">
          <Slider
            max={max}
            min={min}
            onBlur={field.handleBlur}
            onValueChange={(v) => field.handleChange(v[0])}
            step={step}
            value={[value]}
          />
          <div className="mt-1 flex justify-between text-muted-foreground text-xs tabular-nums">
            <span>{min}</span>
            <span className="font-medium">
              {value}/{max}
            </span>
            <span>{max}</span>
          </div>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
    </FormFieldSet>
  );
}

export const FormSliderField = createFormField(SliderField);
