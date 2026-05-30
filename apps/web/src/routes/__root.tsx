import { Button } from "@clinic-app/ui/components/button";
import { Toaster } from "@clinic-app/ui/components/sonner";
import { TooltipProvider } from "@clinic-app/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import type { orpc } from "@/utils/orpc";
import Header from "../components/header";
import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

function RootErrorComponent({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-bold text-2xl">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground text-sm">{error.message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.invalidate()}>
          Try again
        </Button>
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function RootNotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-bold text-2xl">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you're looking for doesn't exist.
      </p>
      <Button asChild>
        <Link to="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Smart Clinic Pediatrics | Intelligent Care for Every Child",
      },
      {
        name: "description",
        content:
          "Modern pediatric clinic management system with AI-powered insights, growth tracking, and family-centered care.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
  }),

  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
  component: RootDocument,
});

function RootDocument() {
  const isDev = import.meta.env.DEV;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableColorScheme
          enableSystem
        >
          <TooltipProvider>
            <div className="grid h-svh grid-rows-[auto_1fr]">
              <Header />
              <Outlet />
            </div>

            <Toaster richColors />

            {isDev ? (
              <>
                <TanStackRouterDevtools position="bottom-left" />
                <ReactQueryDevtools
                  position="bottom"
                  buttonPosition="bottom-right"
                />
              </>
            ) : null}

            <Scripts />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
