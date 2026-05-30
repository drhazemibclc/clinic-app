import { FieldDescription, FieldLabel } from "@clinic-app/ui/components/field";
import { Input } from "@clinic-app/ui/components/input";
import { Spinner } from "@clinic-app/ui/components/spinner";
import { useSelector } from "@tanstack/react-store";
import {
  createFormField,
  FormField,
  FormFieldError,
  FormFieldSet,
  useFieldContext,
} from "../form-context";

interface TextFieldProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "onBlur"> {
  label: string; // Keep this prop
  description?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
}

export function TextField({
  label,
  description,
  required,
  type = "text",
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext();
  const isTouched = useSelector(field.store, (s) => s.meta.isTouched);
  const isValid = useSelector(field.store, (s) => s.meta.isValid);
  const isValidating = useSelector(field.store, (s) => s.meta.isValidating);
  const value = useSelector(field.store, (s) => s.value) as string | number;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <div className="relative">
          <Input
            aria-invalid={isTouched && !isValid}
            className={className}
            id={field.name}
            onBlur={field.handleBlur}
            onChange={(e) => {
              if (type === "number") {
                const v = e.target.value;
                field.handleChange(v === "" ? "" : Number.parseFloat(v));
              } else {
                field.handleChange(e.target.value);
              }
            }}
            type={type}
            value={value ?? ""}
            {...inputProps}
          />
          {isValidating && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormTextField = createFormField(TextField);
