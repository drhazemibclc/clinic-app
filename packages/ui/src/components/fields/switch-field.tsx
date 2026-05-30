import { FieldDescription, FieldLabel } from "@clinic-app/ui/components/field";
import {
  createFormField,
  FormField,
  FormFieldSet,
  useFieldContext,
} from "@clinic-app/ui/components/form-context";
import { Switch } from "@clinic-app/ui/components/switch";
import { useStore } from "@tanstack/react-form";

interface SwitchFieldProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SwitchField({
  label,
  description,
  disabled,
}: SwitchFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as boolean;

  return (
    <FormFieldSet>
      <FormField orientation="horizontal">
        <div className="flex flex-1 flex-col gap-1.5 leading-snug">
          <FieldLabel className="text-base">{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
        </div>
        <Switch
          checked={value}
          disabled={disabled}
          onBlur={field.handleBlur}
          onCheckedChange={field.handleChange}
        />
      </FormField>
    </FormFieldSet>
  );
}

export const FormSwitchField = createFormField(SwitchField);
