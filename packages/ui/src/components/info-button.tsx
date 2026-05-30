import { Button } from "@clinic-app/ui/components/button";
import { Icons } from "@clinic-app/ui/components/icons";
import {
  type InfobarContent,
  useInfobar,
} from "@clinic-app/ui/components/infobar";
import { cn } from "@clinic-app/ui/lib/utils";
import * as React from "react";

interface InfoButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "content"> {
  content: InfobarContent;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "ghost"
    | "outline"
    | "secondary"
    | "destructive"
    | "link";
}

export function InfoButton({
  content,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: InfoButtonProps) {
  const { setContent, setOpen } = useInfobar();

  // Set content on mount so the infobar has it ready, but don't force it open
  const contentRef = React.useRef(content);
  contentRef.current = content;

  React.useEffect(() => {
    setContent(contentRef.current);
  }, [setContent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setContent(content);
    setOpen(true);
    props.onClick?.(e);
  };

  return (
    <Button
      aria-label="Show information"
      className={cn("shrink-0", className)}
      onClick={handleClick}
      size={size}
      variant={variant}
      {...props}
    >
      <Icons.info className="h-4 w-4" />
      <span className="sr-only">Show information</span>
    </Button>
  );
}
