import { ring } from "@clinic-app/ui/lib/utils";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

const iconButtonStyles = tv({
  extend: ring,
  base: [
    "flex size-8 items-center justify-center rounded",
    "disabled:opacity-50",
    "hover:bg-muted",
    "pressed:bg-muted",
  ],
});

export function IconButton(props: AriaButtonProps) {
  return <AriaButton {...props} className={iconButtonStyles()} />;
}
