import { FieldDescription, FieldLabel } from "@clinic-app/ui/components/field";
import { Textarea } from "@clinic-app/ui/components/textarea";
import { useSelector } from "@tanstack/react-store";
import {
  createFormField,
  FormField,
  FormFieldError,
  FormFieldSet,
  useFieldContext,
} from "../form-context";

interface TextareaFieldProps
  extends Omit<
    React.ComponentProps<"textarea">,
    "value" | "onChange" | "onBlur" // Keep these props
  > {
  label: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export function TextareaField({
  label,
  description,
  required,
  maxLength,
  showCount = !!maxLength,
  className,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext();
  const isTouched = useSelector(field.store, (s) => s.meta.isTouched);
  const isValid = useSelector(field.store, (s) => s.meta.isValid);
  const value = (useSelector(field.store, (s) => s.value) as string) ?? "";

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <Textarea
          aria-invalid={isTouched && !isValid}
          className={className}
          id={field.name}
          maxLength={maxLength}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          value={value}
          {...textareaProps}
        />
        {showCount && (
          <div className="text-right text-muted-foreground text-xs tabular-nums">
            {value.length}
            {maxLength ? ` / ${maxLength}` : ""}
          </div>
        )}
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormTextareaField = createFormField(TextareaField);
