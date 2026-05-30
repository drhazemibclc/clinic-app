/** biome-ignore-all lint/suspicious/noExplicitAny: <ok> */

import {
  Field as DefaultField,
  FieldError as DefaultFieldError,
  FieldSet as DefaultFieldSet,
  type fieldVariants,
} from "@clinic-app/ui/components/field";
import { Label } from "@clinic-app/ui/components/label";
import { Textarea as ShadcnTextarea } from "@clinic-app/ui/components/textarea";
import { cn } from "@clinic-app/ui/lib/utils";
import type { AnyFieldApi, DeepKeys } from "@tanstack/form-core";
import { createFormHookContexts } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

// ---------------------------------------------------------------------------
// 1. Contextso
// ---------------------------------------------------------------------------

const {
  fieldContext,
  formContext,
  useFieldContext: _useFieldContext,
  useFormContext,
} = createFormHookContexts();

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

// ---------------------------------------------------------------------------
// 2. Enhanced useFieldContext
// ---------------------------------------------------------------------------

const useFieldContext = () => {
  const { id } = React.useContext(FormItemContext);
  const fieldCtx = _useFieldContext();

  if (!fieldCtx) {
    throw new Error("useFieldContext should be used within <AppField>");
  }

  const { name, store, ...rest } = fieldCtx;
  const errors = useSelector(store, (state) => state.meta.errors);

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    errors,
    store,
    ...rest,
  };
};
function SelectField({
  label,
  children,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const field = useFieldContext();

  return (
    <div className="space-y-1">
      <label
        className="block font-medium text-gray-700 text-sm"
        htmlFor={field.formItemId}
      >
        {label}
      </label>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={disabled}
        id={field.formItemId}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={useSelector(field.store, (state) => state.value) as string}
      >
        {children}
      </select>
      {field.errors.length > 0 && (
        <p className="text-red-600 text-sm">{field.errors.join(", ")}</p>
      )}
    </div>
  );
}
// ---------------------------------------------------------------------------
// 3. Structural field components
// ---------------------------------------------------------------------------

function FieldSet({
  className,
  children,
  ...props
}: React.ComponentProps<"fieldset">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <DefaultFieldSet className={cn("grid gap-1", className)} {...props}>
        {children}
      </DefaultFieldSet>
    </FormItemContext.Provider>
  );
}

function Field({
  children,
  ...props
}: React.ComponentProps<typeof DefaultField> &
  VariantProps<typeof fieldVariants>) {
  const { errors, formItemId, formDescriptionId, formMessageId, store } =
    useFieldContext();
  const form = useFormContext();
  const isTouched = useSelector(store, (state) => state.meta.isTouched);
  // Show errors after user interaction OR after first submit attempt
  const hasSubmitted = useSelector(form.store, (s) => s.submissionAttempts > 0);
  const hasVisibleErrors = errors.length > 0 && (isTouched || hasSubmitted);

  return (
    <DefaultField
      aria-describedby={
        hasVisibleErrors
          ? `${formDescriptionId} ${formMessageId}`
          : `${formDescriptionId}`
      }
      aria-invalid={hasVisibleErrors}
      data-invalid={hasVisibleErrors}
      id={formItemId}
      {...props}
    >
      {children}
    </DefaultField>
  );
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  const { errors, formMessageId, store } = useFieldContext();
  const form = useFormContext();
  const isTouched = useSelector(store, (state) => state.meta.isTouched);
  const hasSubmitted = useSelector(form.store, (s) => s.submissionAttempts > 0);
  if (!(errors.length > 0 && (isTouched || hasSubmitted))) return null;
  return (
    <DefaultFieldError
      className={cn("text-destructive text-sm", className)}
      data-slot="form-message"
      id={formMessageId}
      {...props}
      errors={errors}
    />
  );
}

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>;
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          className="mt-1 font-bold text-red-500"
          key={typeof error === "string" ? error : error.message}
        >
          {typeof error === "string" ? error : error.message}
        </div>
      ))}
    </>
  );
}

function TextArea({ label, rows = 3 }: { label: string; rows?: number }) {
  const field = useFieldContext();
  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label className="mb-2 font-bold text-xl" htmlFor={label}>
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        rows={rows}
        value={useSelector(field.store, (state) => state.value) as string}
      />
      {useSelector(field.store, (state) => state.meta.isTouched) && (
        <ErrorMessages errors={errors} />
      )}
    </div>
  );
}

/**
 * Renders form-level validation errors (cross-field errors).
 * Place inside form.AppForm to show errors from form-level validators.
 *
 * @example
 * ```tsx
 * <form.AppForm>
 *   <form.Form>
 *     <FormErrors />
 *     ...fields...
 *   </form.Form>
 * </form.AppForm>
 * ```
 */
function FormErrors({ className, ...props }: React.ComponentProps<"div">) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (errors.length === 0) return null;
        return (
          <div
            className={cn(
              "rounded-md border bg-destructive/10 p-3 text-destructive text-sm",
              className,
            )}
            role="alert"
            {...props}
          >
            <ul className="list-disc space-y-1 pl-4">
              {errors.map((error, i) => (
                <li key={error.message || i}>{String(error)}</li>
              ))}
            </ul>
          </div>
        );
      }}
    </form.Subscribe>
  );
}

/**
 * Scrolls to the first field with a validation error.
 * Call after a failed form.handleSubmit() to guide the user to the problem.
 *
 * @example
 * ```tsx
 * onSubmit: ({ value }) => { ... },
 * onSubmitInvalid: () => scrollToFirstError(),
 * ```
 */
function scrollToFirstError() {
  // Fields with errors have data-invalid="true" set by the FormField component
  requestAnimationFrame(() => {
    const firstError = document.querySelector('[data-invalid="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the first focusable element within the error field
      const focusable = firstError.querySelector<HTMLElement>(
        "input, textarea, select, button, [tabindex]",
      );
      focusable?.focus({ preventScroll: true });
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Field-level configuration types
//
//    These mirror TanStack Form's field options that get forwarded to
//    form.Field when using the flat FormXxxField pattern via createFormField.
//    Validator values accept Zod schemas (StandardSchemaV1) or plain functions.
// ---------------------------------------------------------------------------

/** Field-level validators forwarded to form.Field */
type FieldValidatorConfig = {
  /** Sync validator — runs when the field loses focus. Accepts a function or Zod schema. */
  onBlur?: unknown;
  /** Async validator — runs on blur. */
  onBlurAsync?: unknown;
  /** Debounce (ms) for onBlurAsync. */
  onBlurAsyncDebounceMs?: number;
  /** Re-run onBlur/onBlurAsync when these other fields blur. */
  onBlurListenTo?: string[];
  /** Sync validator — runs on every value change. Accepts a function or Zod schema. */
  onChange?: unknown;
  /** Async validator — runs on value change (debounced). */
  onChangeAsync?: unknown;
  /** Debounce (ms) for onChangeAsync. */
  onChangeAsyncDebounceMs?: number;
  /** Re-run onChange/onChangeAsync when these other fields change (linked validation). */
  onChangeListenTo?: string[];
  /** Sync validator — runs on field mount. */
  onMount?: unknown;
  /** Sync validator — runs on form submission. */
  onSubmit?: unknown;
  /** Async validator — runs on form submission. */
  onSubmitAsync?: unknown;
};

/** Field-level side-effect listeners forwarded to form.Field */
type FieldListenerConfig = {
  /** Fires when the field loses focus. */
  onBlur?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Debounce (ms) for the onBlur listener. */
  onBlurDebounceMs?: number;
  /** Fires after the field value changes. Use for side effects (e.g., resetting dependent fields). */
  onChange?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Debounce (ms) for the onChange listener. */
  onChangeDebounceMs?: number;
  /** Fires when the field mounts. */
  onMount?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Fires on form submission. */
  onSubmit?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
};

/**
 * Configuration forwarded to TanStack Form's form.Field component.
 * Use with createFormField composed components (FormTextField, etc.)
 * to enable field-level validation, async validation, and side-effect listeners.
 *
 * For type-safe field names, use form.AppField render-prop pattern instead.
 */
type FieldConfig = {
  /** Default debounce (ms) for all async validators on this field. */
  asyncDebounceMs?: number;
  /** Default value for this field (useful for dynamically added fields). */
  defaultValue?: unknown;
  /** Side-effect listeners (onChange, onBlur, onMount, onSubmit). */
  listeners?: FieldListenerConfig;
  /** Set to 'array' for array fields (enables pushValue, removeValue, etc.). */
  mode?: "value" | "array";
  /** Field-level validators (onBlur, onChange, onSubmit + async variants). */
  validators?: FieldValidatorConfig;
};

// ---------------------------------------------------------------------------
// 5. createFormField — lifts a field component into a flat form-level component
//
//    Forwards TanStack Form's field-level config (validators, listeners)
//    to form.Field while keeping the ergonomic flat API.
//
//    For type-safe field names, use form.AppField render-prop pattern.
//    The flat FormXxxField pattern trades name type-safety for ergonomics.
// ---------------------------------------------------------------------------

type FormFieldSlot = React.ComponentType<{
  name: string;
  validators?: FieldValidatorConfig;
  asyncDebounceMs?: number;
  listeners?: FieldListenerConfig;
  mode?: "value" | "array";
  defaultValue?: unknown;
  children: (fieldApi: AnyFieldApi) => React.ReactNode;
}>;

function createFormField<P extends object>(
  FieldComponent: React.ComponentType<P>,
) {
  function ComposedFormField({
    name,
    validators,
    asyncDebounceMs,
    listeners,
    mode,
    defaultValue,
    ...props
  }: { name: string } & FieldConfig &
    Omit<
      P,
      | "name"
      | "validators"
      | "asyncDebounceMs"
      | "listeners"
      | "mode"
      | "defaultValue"
    >) {
    const form = useFormContext();
    const FieldSlot = form.Field as unknown as FormFieldSlot;
    return (
      <FieldSlot
        asyncDebounceMs={asyncDebounceMs}
        defaultValue={defaultValue}
        listeners={listeners}
        mode={mode}
        name={name}
        validators={validators}
      >
        {(fieldApi) => (
          <fieldContext.Provider value={fieldApi as AnyFieldApi}>
            <FieldComponent {...(props as unknown as P)} />
          </fieldContext.Provider>
        )}
      </FieldSlot>
    );
  }
  ComposedFormField.displayName = `FormField(${FieldComponent.displayName ?? FieldComponent.name})`;
  return ComposedFormField;
}

function DateField({ label, min }: { label: string; min?: string }) {
  const field = useFieldContext();
  const value = useSelector(field.store, (state) => state.value);

  return (
    <div className="space-y-1">
      <Label htmlFor={field.formItemId}>{label}</Label>
      <input
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        id={field.formItemId}
        min={min}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        type="date"
        value={
          value instanceof Date
            ? value.toISOString().split("T")[0]
            : (value as string | number | readonly string[]) || ""
        }
      />
      {field.errors.length > 0 && (
        <p className="text-red-600 text-sm">{field.errors.join(", ")}</p>
      )}
    </div>
  );
}

function TimeField({ label }: { label: string }) {
  const field = useFieldContext();
  const value = useSelector(field.store, (state) => state.value);

  return (
    <div className="space-y-1">
      <Label htmlFor={field.formItemId}>{label}</Label>
      <input
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        id={field.formItemId}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        type="time"
        value={(value as string | number | readonly string[]) || ""}
      />
      {field.errors.length > 0 && (
        <p className="text-red-600 text-sm">{field.errors.join(", ")}</p>
      )}
    </div>
  );
}

function NumberField({
  label,
  min,
  max,
  step,
}: {
  label: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const field = useFieldContext();
  const value = useSelector(field.store, (state) => state.value);

  return (
    <div className="space-y-1">
      <Label htmlFor={field.formItemId}>{label}</Label>
      <input
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        id={field.formItemId}
        max={max}
        min={min}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
        step={step}
        type="number"
        value={(value as string | number | readonly string[]) ?? ""}
      />
      {field.errors.length > 0 && (
        <p className="text-red-600 text-sm">{field.errors.join(", ")}</p>
      )}
    </div>
  );
}
// ---------------------------------------------------------------------------
// 6. Type-safe field name utilities
//
//    Standalone FormXxxField components have `name: string` by default because
//    they don't know which form they'll be used in at definition time.
//
//    These utilities narrow `name` to the form's actual field paths using
//    TanStack Form's DeepKeys<TValues>, giving full autocomplete + type errors.
// ---------------------------------------------------------------------------

/**
 * Narrows a composed field component's `name` prop to `DeepKeys<TValues>`.
 * Used internally by useFormFields and typedField.
 */
type WithTypedName<C, TValues> =
  C extends React.ComponentType<infer P>
    ? P extends { name: string }
      ? React.ComponentType<
          Omit<P, "name"> & { name: DeepKeys<TValues> & string }
        >
      : C
    : C;

/**
 * Narrows any single composed field component's `name` prop to type-safe field paths.
 * Use for custom fields not included in useFormFields.
 *
 * @example
 * ```tsx
 * const narrow = typedField<MyFormValues>();
 * const TypedDatePicker = narrow(FormDatePickerField);
 * <TypedDatePicker name="birthDate" />  // ✅ type-safe
 * ```
 */
function typedField<TValues extends Record<string, unknown>>() {
  return <C extends React.ComponentType<{ name: string }>>(
    Component: C,
  ): WithTypedName<C, TValues> => Component as WithTypedName<C, TValues>;
}

// ---------------------------------------------------------------------------
// 7. Exports
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 7. Exports
// ---------------------------------------------------------------------------

export type {
  FieldConfig,
  FieldListenerConfig,
  FieldValidatorConfig,
  WithTypedName,
};
export {
  createFormField,
  DateField,
  Field,
  Field as FormField,
  FieldError,
  FieldError as FormFieldError,
  FieldSet,
  FieldSet as FormFieldSet,
  FormErrors,
  fieldContext,
  formContext,
  NumberField,
  SelectField,
  scrollToFirstError,
  TextArea,
  TimeField,
  typedField,
  useFieldContext,
  useFormContext,
};
