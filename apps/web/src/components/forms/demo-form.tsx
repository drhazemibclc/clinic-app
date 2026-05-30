import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@clinic-app/ui/components/command";
import { FieldDescription } from "@clinic-app/ui/components/field";
import { Icons } from "@clinic-app/ui/components/icons";
import { Input } from "@clinic-app/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@clinic-app/ui/components/input-otp";
import { Label } from "@clinic-app/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@clinic-app/ui/components/popover";
import { Separator } from "@clinic-app/ui/components/separator";
import {
  useAppForm,
  useFormFields,
} from "@clinic-app/ui/components/tanstack-form";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@clinic-app/ui/components/toggle-group";
import { cn } from "@clinic-app/ui/lib/utils";
import type { ObjectValue, Updater } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import * as z from "zod";

// Schema (form-level safety net — onSubmit catches anything field-level missed)
const demoFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  age: z.number().min(18, "Must be at least 18 years old"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  website: z.string().url("Invalid URL").or(z.literal("")),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  country: z.string().min(1, "Please select a country"),
  framework: z.string().min(1, "Please select a framework"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  gender: z.string().min(1, "Please select gender"),
  newsletter: z.boolean(),
  rating: z.number().min(0).max(10),
  birthDate: z.date().optional(),
  dateRange: z.any().optional(),
  eventTime: z.string().optional(),
  favoriteColor: z.string().optional(),
  otp: z.string().min(6, "Please enter 6 digits"),
  formatting: z.array(z.string()).optional(),
  tags: z.array(z.string()).min(1, "Add at least one tag"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  avatar: z.array(z.any()).optional(),
});

const countryOptions = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "eg", label: "Egypt" },
  { value: "fr", label: "France" },
];

const frameworkOptions = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
  { value: "svelte", label: "SvelteKit" },
  { value: "angular", label: "Angular" },
];

const interestOptions = [
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
  { value: "travel", label: "Travel" },
  { value: "cooking", label: "Cooking" },
  { value: "reading", label: "Reading" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// ─── Custom field components (no pre-built field component exists) ───

function ComboboxField({
  value,
  onChange,
  onBlur,
  isTouched,
  isValid,
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  isTouched: boolean;
  isValid: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = frameworkOptions.find((o) => o.value === value);
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-controls="framework-listbox"
          aria-expanded={open}
          aria-invalid={isTouched && !isValid}
          className="w-full justify-between font-normal"
          onBlur={onBlur}
          role="combobox"
          variant="outline"
        >
          {selected?.label ?? "Search frameworks..."}
          <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworkOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                  }}
                  value={opt.value}
                >
                  <Icons.check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TagsField({
  values,
  onPush,
  onRemove,
}: {
  values: string[];
  onPush: (val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [tagInput, setTagInput] = React.useState("");

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !values.includes(tag)) {
      onPush(tag);
      setTagInput("");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Input
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter..."
          value={tagInput}
        />
        <Button onClick={addTag} type="button" variant="secondary">
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((tag, idx) => (
            <Badge className="gap-1" key={tag} variant="secondary">
              {tag}
              <button
                className="ml-0.5 hover:text-destructive"
                onClick={() => onRemove(idx)}
                type="button"
              >
                <Icons.close className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Separator />
      <h3 className="pt-2 font-medium text-muted-foreground text-sm uppercase tracking-wide">
        {children}
      </h3>
    </div>
  );
}

// ─── Form ───

type DemoFormValues = {
  name: string;
  email: string;
  age: number;
  password: string;
  phone: string;
  website: string;
  bio: string;
  country: string;
  framework: string;
  interests: string[];
  gender: string;
  newsletter: boolean;
  rating: number;
  birthDate?: Date;
  dateRange?: DateRange;
  eventTime?: string;
  favoriteColor?: string;
  otp: string;
  formatting?: string[];
  tags: string[];
  terms: boolean;
  avatar?: File[];
};

export default function DemoForm() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      age: 18,
      password: "",
      phone: "",
      website: "",
      bio: "",
      country: "",
      framework: "",
      interests: [],
      gender: "",
      newsletter: false,
      rating: 5,
      birthDate: undefined,
      dateRange: undefined,
      eventTime: "",
      favoriteColor: "#6366f1",
      otp: "",
      formatting: [],
      tags: [],
      terms: false,
      avatar: [],
    } as DemoFormValues,
    validators: {
      // Form-level safety net — catches anything field-level validators missed
      onSubmit: demoFormSchema,
    },
    onSubmit: () => {
      alert("Form submitted successfully!");
    },
  });

  const {
    FormTextField,
    FormTextareaField,
    FormSelectField,
    FormSwitchField,
    FormRadioGroupField,
    FormSliderField,
    FormFileUploadField,
  } = useFormFields<DemoFormValues>();

  const formValues = useSelector(form.store, (s) => s.values);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-2xl">
            All Form Inputs Demo
          </CardTitle>
          <p className="text-muted-foreground">
            Every possible form input — built with TanStack Form + shadcn/ui
          </p>
        </CardHeader>
        <CardContent>
          <form.AppForm>
            <form.Form className="space-y-6">
              {/* ─── TEXT INPUTS (flat pattern + field-level onBlur validation) ─── */}
              <SectionTitle>Text Inputs</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                  required
                  validators={{
                    onBlur: z
                      .string()
                      .min(2, "Name must be at least 2 characters"),
                  }}
                />
                {/* Async validation: simulated server-side email check */}
                <FormTextField
                  label="Email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  type="email"
                  validators={{
                    onBlur: z.email("Invalid email address"),
                    onChangeAsync: async ({ value }: { value: string }) => {
                      if (!value || value.length < 3) return undefined;
                      // Simulated server check — replace with real API call
                      await new Promise((r) => setTimeout(r, 500));
                      if (value === "taken@example.com") {
                        return "This email is already registered";
                      }
                      return undefined;
                    },
                    onChangeAsyncDebounceMs: 500,
                  }}
                />
                <FormTextField
                  label="Password"
                  name="password"
                  placeholder="Min 8 characters"
                  required
                  type="password"
                  validators={{
                    onBlur: z
                      .string()
                      .min(8, "Password must be at least 8 characters"),
                  }}
                />
                <FormTextField
                  label="Age"
                  max={100}
                  min={18}
                  name="age"
                  placeholder="18"
                  required
                  type="number"
                  validators={{
                    onBlur: z.number().min(18, "Must be at least 18 years old"),
                  }}
                />
                <FormTextField
                  label="Phone"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  required
                  type="tel"
                  validators={{
                    onBlur: z
                      .string()
                      .min(10, "Phone must be at least 10 digits"),
                  }}
                />
                <FormTextField
                  label="Website"
                  name="website"
                  placeholder="https://example.com"
                  type="url"
                />
              </div>

              {/* ─── TEXTAREA (flat pattern + onBlur validation) ─── */}
              <FormTextareaField
                label="Bio"
                maxLength={500}
                name="bio"
                placeholder="Tell us about yourself..."
                required
                rows={4}
                validators={{
                  onBlur: z
                    .string()
                    .min(10, "Bio must be at least 10 characters"),
                }}
              />

              {/* ─── SELECT & COMBOBOX ─── */}
              <SectionTitle>Select & Combobox</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Listener: logs country changes (replace with dependent field reset) */}
                <FormSelectField
                  label="Country"
                  listeners={{
                    onChange: ({ value }) => {
                      // Side effect example: reset dependent fields when country changes.
                      // In a real form with state/city fields:
                      //   fieldApi.form.setFieldValue('state', '');
                      //   fieldApi.form.setFieldValue('city', '');
                      void value;
                    },
                  }}
                  name="country"
                  options={countryOptions}
                  placeholder="Select your country"
                  required
                  validators={{
                    onBlur: z.string().min(1, "Please select a country"),
                  }}
                />

                {/* Combobox — custom, needs AppField (type-safe name) */}
                <form.AppField name="framework">
                  {(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Framework *</field.FieldLabel>
                        <ComboboxField
                          isTouched={field.state.meta.isTouched}
                          isValid={field.state.meta.isValid}
                          onBlur={field.handleBlur}
                          onChange={field.handleChange}
                          value={field.state.value}
                        />
                        <FieldDescription>Searchable dropdown</FieldDescription>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  )}
                </form.AppField>
              </div>

              {/* ─── CHECKBOX & RADIO ─── */}
              <SectionTitle>Checkbox & Radio</SectionTitle>

              {/* Checkbox Group — array mode, needs AppField */}
              <form.AppField mode="array" name="interests">
                {(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.FieldLabel>Interests *</field.FieldLabel>
                      <FieldDescription>Select all that apply</FieldDescription>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {interestOptions.map((opt) => (
                          <div
                            className="flex items-center space-x-2"
                            key={opt.value}
                          >
                            <Checkbox
                              checked={values.includes(opt.value)}
                              id={`interests-${opt.value}`}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  field.pushValue(opt.value);
                                } else {
                                  const idx = values.indexOf(opt.value);
                                  if (idx > -1) field.removeValue(idx);
                                }
                              }}
                            />
                            <Label htmlFor={`interests-${opt.value}`}>
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {values.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {values.map((v) => (
                            <Badge key={v} variant="secondary">
                              {interestOptions.find((o) => o.value === v)
                                ?.label || v}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              </form.AppField>

              {/* Radio Group (flat pattern + onBlur validation) */}
              <FormRadioGroupField
                label="Gender"
                name="gender"
                options={genderOptions}
                required
                validators={{
                  onBlur: z.string().min(1, "Please select gender"),
                }}
              />

              {/* ─── TOGGLE & SWITCH ─── */}
              <SectionTitle>Toggle & Switch</SectionTitle>

              {/* Switch (flat pattern) */}
              <FormSwitchField
                description="Receive updates about new features and products"
                label="Subscribe to Newsletter"
                name="newsletter"
              />

              {/* Toggle Group — array mode, needs AppField */}
              <form.AppField mode="array" name="formatting">
                {(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Text Formatting</field.FieldLabel>
                        <ToggleGroup
                          onValueChange={(
                            val: Updater<
                              ObjectValue<never, DemoFormValues, "formatting">
                            >,
                          ) => field.form.setFieldValue("formatting", val)}
                          type="multiple"
                          value={values}
                          variant="outline"
                        >
                          <ToggleGroupItem aria-label="Bold" value="bold">
                            <Icons.bold className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem aria-label="Italic" value="italic">
                            <Icons.italic className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            aria-label="Underline"
                            value="underline"
                          >
                            <Icons.underline className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <FieldDescription>
                          Multi-select toggle group
                        </FieldDescription>
                      </field.Field>
                    </field.FieldSet>
                  );
                }}
              </form.AppField>

              {/* Terms checkbox — custom horizontal layout, needs AppField */}
              <form.AppField name="terms">
                {(field) => (
                  <field.FieldSet>
                    <field.Field orientation="horizontal">
                      <Checkbox
                        aria-invalid={
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        }
                        checked={field.state.value}
                        onCheckedChange={(checked: boolean) =>
                          field.handleChange(checked as boolean)
                        }
                      />
                      <field.FieldContent>
                        <field.FieldLabel className="space-y-1 leading-none">
                          I agree to the Terms and Conditions *
                        </field.FieldLabel>
                        <field.FieldError />
                      </field.FieldContent>
                    </field.Field>
                  </field.FieldSet>
                )}
              </form.AppField>

              {/* ─── SLIDER (flat pattern) ─── */}
              <SectionTitle>Slider</SectionTitle>

              <FormSliderField
                description="Rate your experience (0-10)"
                label="Overall Rating"
                max={10}
                min={0}
                name="rating"
                step={0.5}
              />

              {/* ─── DATE & TIME (custom, need AppField) ─── */}
              <SectionTitle>Date & Time</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Date Picker */}
                <form.AppField name="birthDate">
                  {(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Birth Date</field.FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.state.value && "text-muted-foreground",
                              )}
                              variant="outline"
                            >
                              <Icons.calendar className="mr-2 h-4 w-4" />
                              {field.state.value ? (
                                format(field.state.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              disabled={(date) => date > new Date()}
                              mode="single"
                              onSelect={field.handleChange}
                              selected={field.state.value}
                            />
                          </PopoverContent>
                        </Popover>
                      </field.Field>
                    </field.FieldSet>
                  )}
                </form.AppField>

                {/* Time Input */}
                <form.AppField name="eventTime">
                  {(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>
                          Event Time
                        </field.FieldLabel>
                        <Input
                          id={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="time"
                          value={field.state.value}
                        />
                      </field.Field>
                    </field.FieldSet>
                  )}
                </form.AppField>
              </div>

              {/* Date Range Picker */}
              <form.AppField name="dateRange">
                {(field) => {
                  const range = field.state.value as DateRange | undefined;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Date Range</field.FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !range?.from && "text-muted-foreground",
                              )}
                              variant="outline"
                            >
                              <Icons.calendar className="mr-2 h-4 w-4" />
                              {range?.from ? (
                                range.to ? (
                                  <>
                                    {format(range.from, "LLL dd, y")} -{" "}
                                    {format(range.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(range.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              mode="range"
                              numberOfMonths={2}
                              onSelect={field.handleChange}
                              selected={range}
                            />
                          </PopoverContent>
                        </Popover>
                      </field.Field>
                    </field.FieldSet>
                  );
                }}
              </form.AppField>

              {/* ─── SPECIAL INPUTS (custom, need AppField) ─── */}
              <SectionTitle>Special Inputs</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* OTP Input */}
                <form.AppField name="otp">
                  {(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Verification Code *</field.FieldLabel>
                        <InputOTP
                          maxLength={6}
                          onChange={field.handleChange}
                          value={field.state.value}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                        <FieldDescription>6-digit OTP input</FieldDescription>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  )}
                </form.AppField>

                {/* Color Picker */}
                <form.AppField name="favoriteColor">
                  {(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>
                          Favorite Color
                        </field.FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            className="h-9 w-12 cursor-pointer rounded-md border p-1"
                            id={field.name}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="color"
                            value={field.state.value}
                          />
                          <Input
                            className="w-28 font-mono"
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="#000000"
                            value={field.state.value}
                          />
                        </div>
                        <FieldDescription>
                          Native color picker with hex
                        </FieldDescription>
                      </field.Field>
                    </field.FieldSet>
                  )}
                </form.AppField>
              </div>

              {/* Tags Input — array mode, needs AppField */}
              <form.AppField mode="array" name="tags">
                {(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Tags *</field.FieldLabel>
                        <TagsField
                          onPush={(val) => field.pushValue(val)}
                          onRemove={(idx) => field.removeValue(idx)}
                          values={values}
                        />
                        <FieldDescription>
                          Press Enter or click Add to create tags
                        </FieldDescription>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              </form.AppField>

              {/* ─── FILE UPLOAD (flat pattern) ─── */}
              <SectionTitle>File Upload</SectionTitle>

              <FormFileUploadField
                description="Drag & drop or click to upload (max 5MB)"
                label="Profile Picture"
                maxFiles={1}
                maxSize={5000000}
                name="avatar"
              />

              {/* ─── SUBMIT ─── */}
              <Separator />
              <div className="flex gap-4 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => form.reset()}
                  type="button"
                  variant="outline"
                >
                  Reset
                </Button>
                <form.SubmitButton className="flex-1">
                  Submit Form
                </form.SubmitButton>
              </div>
            </form.Form>
          </form.AppForm>
        </CardContent>
      </Card>

      {/* Form Data Preview - sticky sidebar */}
      <div className="xl:sticky xl:top-18 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Form Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[calc(100vh-8rem)] overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(formValues, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
