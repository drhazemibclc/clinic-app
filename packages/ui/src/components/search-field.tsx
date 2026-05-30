import { Search, X } from "lucide-react";
import {
  Button as AriaButton,
  FieldError as AriaFieldError,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
  type ValidationResult as AriaValidationResult,
  Text,
} from "react-aria-components";

import { FieldGroup } from "./field";
import { Input } from "./input";
import { Label } from "./label";

export type SearchFieldProps = {
  description?: string;
  errorMessage?: string | ((validation: AriaValidationResult) => string);
  label?: string;
} & AriaSearchFieldProps;

export function SearchField({
  description,
  errorMessage,
  label,
  ...props
}: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className="group flex min-w-10 flex-col gap-1">
      {label ? <Label>{label}</Label> : null}
      <FieldGroup>
        <Search
          aria-hidden
          className="ml-2 size-4 text-muted-foreground group-disabled:opacity-50"
        />
        <Input
          className="w-full outline-none [&::-webkit-search-cancel-button]:hidden"
          placeholder="Search..."
        />
        <AriaButton className="mr-1 flex size-6 items-center justify-center group-empty:invisible">
          <X aria-hidden className="size-4" />
        </AriaButton>
      </FieldGroup>
      {description ? (
        <Text className="text-muted-foreground text-sm" slot="description">
          {description}
        </Text>
      ) : null}
      <AriaFieldError className="text-destructive text-sm">
        {typeof errorMessage === "function"
          ? (validation: AriaValidationResult) => errorMessage(validation)
          : errorMessage}
      </AriaFieldError>
    </AriaSearchField>
  );
}
