import { Button } from "@clinic-app/ui/components/button";
import { Icons } from "@clinic-app/ui/components/icons";
import { Input } from "@clinic-app/ui/components/input";
import { Separator } from "@clinic-app/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@clinic-app/ui/components/sheet";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@clinic-app/ui/components/tooltip";
import { useIsMobile } from "@clinic-app/ui/hooks/use-mobile";
import { cn } from "@clinic-app/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { useLocation } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const INFOBAR_WIDTH = "22rem";
const INFOBAR_WIDTH_MOBILE = "22rem";
const INFOBAR_WIDTH_ICON = "3rem";
const INFOBAR_KEYBOARD_SHORTCUT = "i";

export type HelpfulLink = {
  title: string;
  url: string;
};

export type DescriptiveSection = {
  title: string;
  description: string;
  links?: HelpfulLink[];
};

export type InfobarContent = {
  title: string;
  sections: DescriptiveSection[];
};

type InfobarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleInfobar: () => void;
  content: InfobarContent | null;
  setContent: (content: InfobarContent | null) => void;
  isPathnameChanging: boolean;
};

const InfobarContext = React.createContext<InfobarContextProps | null>(null);

function useInfobar() {
  const context = React.useContext(InfobarContext);
  if (!context) {
    throw new Error("useInfobar must be used within a InfobarProvider.");
  }

  return context;
}

function InfobarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [content, setContent] = React.useState<InfobarContent | null>(null);
  const [contentPathname, setContentPathname] = React.useState<string | null>(
    null,
  );
  const [isPathnameChanging, setIsPathnameChanging] = React.useState(false);
  const { pathname } = useLocation();

  // This is the internal state of the infobar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;

      // On mobile, also update the mobile state for the Sheet component
      if (isMobile) {
        setOpenMobile(openState);
      }

      // Handle desktop state
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [setOpenProp, open, isMobile],
  );

  // Helper to toggle the infobar.
  const toggleInfobar = React.useCallback(
    () =>
      isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open),
    [isMobile, setOpen],
  );

  // Close infobar when switching between mobile and desktop to prevent state desync
  React.useEffect(() => {
    setOpenMobile(false);
    _setOpen(false);
  }, []);

  // Adds a keyboard shortcut to toggle the infobar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === INFOBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleInfobar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleInfobar]);

  // Clear content and close infobar when pathname changes
  React.useEffect(() => {
    if (contentPathname !== null && contentPathname !== pathname) {
      setIsPathnameChanging(true);
      setContent(null);
      setContentPathname(null);
      setOpen(false);

      const timer = setTimeout(() => {
        setIsPathnameChanging(false);
      }, 200);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen is a stable React state setter
  }, [pathname, contentPathname, setOpen]);

  // Update setContent to also track pathname
  const handleSetContent = React.useCallback(
    (newContent: InfobarContent | null) => {
      setContent(newContent);
      setContentPathname(newContent ? pathname : null);
    },
    [pathname],
  );

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the infobar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  // Update context to use handleSetContent instead of setContent
  const contextValue = React.useMemo<InfobarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleInfobar,
      content,
      setContent: handleSetContent,
      isPathnameChanging,
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      toggleInfobar,
      content,
      handleSetContent,
      isPathnameChanging,
    ],
  );

  return (
    <InfobarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn("group/infobar-wrapper flex w-full flex-1", className)}
          data-slot="infobar-wrapper"
          style={
            {
              "--infobar-width": INFOBAR_WIDTH,
              "--infobar-width-icon": INFOBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </InfobarContext.Provider>
  );
}

function Infobar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const {
    isMobile,
    state,
    setOpen,
    openMobile,
    setOpenMobile,
    isPathnameChanging,
  } = useInfobar();

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "flex h-full w-(--infobar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        data-slot="infobar"
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet
        onOpenChange={(value) => {
          setOpenMobile(value);
          setOpen(value);
        }}
        open={openMobile}
        {...props}
      >
        <SheetContent
          className="w-(--infobar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          data-infobar="infobar"
          data-mobile="true"
          data-slot="infobar"
          side={side}
          style={
            {
              "--infobar-width": INFOBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Infobar</SheetTitle>
            <SheetDescription>Displays the mobile infobar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-side={side}
      data-slot="infobar"
      data-state={state}
      data-variant={variant}
      style={
        {
          "--infobar-transition-duration": isPathnameChanging ? "0ms" : "300ms",
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "sticky top-0 z-30 hidden h-[calc(100dvh-4.5rem)] w-(--infobar-width) shrink-0 p-2 pl-0 transition-[width,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex",
          "group-data-[collapsible=offcanvas]:w-0 group-data-[collapsible=offcanvas]:overflow-hidden group-data-[collapsible=offcanvas]:p-0",
          className,
        )}
        data-slot="infobar-container"
        {...props}
      >
        <div
          className="flex h-full w-full flex-col overflow-y-auto rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[collapsible=offcanvas]:scale-95 group-data-[collapsible=offcanvas]:opacity-0"
          data-infobar="infobar"
          data-slot="infobar-inner"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function InfobarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleInfobar } = useInfobar();

  return (
    <Button
      aria-label="Close info panel"
      className={cn("size-7", className)}
      data-infobar="trigger"
      data-slot="infobar-trigger"
      onClick={(event) => {
        onClick?.(event);
        toggleInfobar();
      }}
      size="icon"
      variant="ghost"
      {...props}
    >
      <Icons.chevronsRight className="size-4" />
    </Button>
  );
}

function InfobarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleInfobar } = useInfobar();

  return (
    <button
      aria-label="Toggle Infobar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      data-infobar="rail"
      data-slot="infobar-rail"
      onClick={toggleInfobar}
      tabIndex={-1}
      title="Toggle Infobar"
      {...props}
    />
  );
}

function InfobarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      data-slot="infobar-inset"
      {...props}
    />
  );
}

function InfobarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn("h-8 w-full bg-background shadow-none", className)}
      data-infobar="input"
      data-slot="infobar-input"
      {...props}
    />
  );
}

function InfobarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-infobar="header"
      data-slot="infobar-header"
      {...props}
    />
  );
}

function InfobarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-infobar="footer"
      data-slot="infobar-footer"
      {...props}
    />
  );
}

function InfobarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      data-infobar="separator"
      data-slot="infobar-separator"
      {...props}
    />
  );
}

function InfobarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      data-infobar="content"
      data-slot="infobar-content"
      {...props}
    />
  );
}

function InfobarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      data-infobar="group"
      data-slot="infobar-group"
      {...props}
    />
  );
}

function InfobarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-sidebar-foreground/70 text-xs outline-hidden ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      data-infobar="group-label"
      data-slot="infobar-group-label"
      {...props}
    />
  );
}

function InfobarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-infobar="group-action"
      data-slot="infobar-group-action"
      {...props}
    />
  );
}

function InfobarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full text-sm", className)}
      data-infobar="group-content"
      data-slot="infobar-group-content"
      {...props}
    />
  );
}

function InfobarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-infobar="menu"
      data-slot="infobar-menu"
      {...props}
    />
  );
}

function InfobarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      data-infobar="menu-item"
      data-slot="infobar-menu-item"
      {...props}
    />
  );
}

const infobarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[infobar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function InfobarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof infobarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useInfobar();

  const button = (
    <Comp
      className={cn(infobarMenuButtonVariants({ variant, size }), className)}
      data-active={isActive}
      data-infobar="menu-button"
      data-size={size}
      data-slot="infobar-menu-button"
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        align="center"
        hidden={state !== "collapsed" || isMobile}
        side="right"
        {...tooltip}
      />
    </Tooltip>
  );
}

function InfobarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      data-infobar="menu-action"
      data-slot="infobar-menu-action"
      {...props}
    />
  );
}

function InfobarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-sidebar-foreground text-xs tabular-nums",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-infobar="menu-badge"
      data-slot="infobar-menu-badge"
      {...props}
    />
  );
}

function InfobarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(
    () => `${Math.floor(Math.random() * 40) + 50}%`,
    [],
  );

  return (
    <div
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      data-infobar="menu-skeleton"
      data-slot="infobar-menu-skeleton"
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-infobar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-infobar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function InfobarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-infobar="menu-sub"
      data-slot="infobar-menu-sub"
      {...props}
    />
  );
}

function InfobarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-sub-item relative", className)}
      data-infobar="menu-sub-item"
      data-slot="infobar-menu-sub-item"
      {...props}
    />
  );
}

function InfobarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-active={isActive}
      data-infobar="menu-sub-button"
      data-size={size}
      data-slot="infobar-menu-sub-button"
      {...props}
    />
  );
}

export {
  Infobar,
  InfobarContent,
  InfobarFooter,
  InfobarGroup,
  InfobarGroupAction,
  InfobarGroupContent,
  InfobarGroupLabel,
  InfobarHeader,
  InfobarInput,
  InfobarInset,
  InfobarMenu,
  InfobarMenuAction,
  InfobarMenuBadge,
  InfobarMenuButton,
  InfobarMenuItem,
  InfobarMenuSkeleton,
  InfobarMenuSub,
  InfobarMenuSubButton,
  InfobarMenuSubItem,
  InfobarProvider,
  InfobarRail,
  InfobarSeparator,
  InfobarTrigger,
  useInfobar,
};
