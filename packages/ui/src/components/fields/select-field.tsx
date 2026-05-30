import { FieldDescription, FieldLabel } from "@clinic-app/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import { useSelector } from "@tanstack/react-store";
import {
  createFormField,
  FormField,
  FormFieldError,
  FormFieldSet,
  useFieldContext,
} from "../form-context";

type Option = { value: string; label: string };

interface SelectFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options: Option[];
  placeholder?: string;
}

export function SelectField({
  label,
  description,
  required,
  disabled,
  options,
  placeholder = "Select an option",
}: SelectFieldProps) {
  const field = useFieldContext();
  const isTouched = useSelector(field.store, (s) => s.meta.isTouched);
  const isValid = useSelector(field.store, (s) => s.meta.isValid);
  const value = useSelector(field.store, (s) => s.value) as string;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <Select
          disabled={disabled}
          onOpenChange={(open) => {
            if (!open) field.handleBlur();
          }}
          onValueChange={field.handleChange}
          value={value}
        >
          <SelectTrigger aria-invalid={isTouched && !isValid} id={field.name}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormSelectField = createFormField(SelectField);
