# 🏥 Smart Clinic — Pediatric App Architecture

> Full-stack pediatric clinic management system built on a Turborepo monorepo.
> Covers patient management, appointments, growth tracking, immunizations, encounters, billing, nutrition, and AI-powered analytics.

---

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Package Overview](#package-overview)
- [Web App Structure](#web-app-structure)
- [Routing Conventions](#routing-conventions)
- [Component Organization](#component-organization)
- [Data Layer](#data-layer)
- [API Layer (oRPC)](#api-layer-orpc)
- [Auth](#auth)
- [Import Aliases & Patterns](#import-aliases--patterns)
- [Naming Conventions](#naming-conventions)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Dev Commands](#dev-commands)

---

## Monorepo Structure

```
clinic-app/
├── apps/
│   └── web/                    # TanStack Start (React 19 + Vite 8)
├── packages/
│   ├── api/                    # oRPC server — all procedures live here
│   ├── auth/                   # better-auth configuration
│   ├── config/                 # Shared tsconfig base
│   ├── data/                   # Static data, seeds, WHO z-score tables
│   ├── db/                     # Drizzle ORM schema + migrations
│   ├── env/                    # @t3-oss/env-core validated env vars
│   ├── tanstack/               # Shared TanStack config/helpers
│   ├── ui/                     # shadcn/ui component library (shared)
│   └── utils/                  # Shared utilities (age calc, IDs, etc.)
├── turbo.json
├── biome.json                  # Linter + formatter (replaces ESLint + Prettier)
├── bun.lock
└── package.json                # Root workspace + catalog versions
```

**Package manager:** `bun@1.3.14`
**Build orchestration:** `turbo@2.9.15`
**Workspace catalog** pins shared dep versions in root `package.json` — always use `catalog:` for shared deps.

---

## Tech Stack

### Frontend (`apps/web`)

| Category | Library | Version |
|---|---|---|
| Framework | TanStack Start (React SSR) | `^1.168.16` |
| Router | TanStack Router | `^1.170.9` |
| UI Components | shadcn/ui + Radix UI | `radix-ui ^1.4.4` |
| Styling | Tailwind CSS v4 | `^4.3.0` |
| Server State | TanStack Query | `^5.100.14` |
| Forms | TanStack Form | `^1.33.0` |
| Tables | TanStack Table | `8.21.3` |
| Charts | Recharts | `3.8.1` |
| Calendar | FullCalendar | `6.1.20` |
| Drag & Drop | @dnd-kit | `core 6.3.1` |
| Icons | Lucide React + Remix Icon | `^1.17.0` / `4.9.0` |
| Toasts | Sonner | `2.0.7` |
| Date utils | date-fns | `4.3.0` |
| Animations | @formkit/auto-animate | `^1.0.0-pre-alpha.3` |
| Theme | next-themes | `0.4.6` |
| Validation | Zod | `4.4.3` |

### Backend (`packages/api`)

| Category | Library | Version |
|---|---|---|
| API layer | oRPC | `^1.14.3` |
| ORM | Drizzle ORM | `^1.0.0-beta.22` |
| Database | PostgreSQL (via `pg` + `postgres`) | `^8.21.0` |
| Auth | better-auth | `^1.6.11` |
| Validation | Zod | `4.4.3` |
| Logging | Pino | `^10.3.1` |
| Error tracking | Sentry | `^10.55.0` |

### Tooling

| Tool | Purpose |
|---|---|
| Biome | Lint + format (replaces ESLint + Prettier) |
| TypeScript | `^6.0.3` |
| Vitest | Unit tests |
| Playwright | E2E tests |
| Husky + lint-staged | Pre-commit hooks |
| Sherif | Workspace dependency consistency |
| Docker Compose | Local PostgreSQL |

---

## Package Overview

### `@clinic-app/api`

All oRPC procedures. Organized by domain router:

```
packages/api/src/
├── index.ts              # Root router — exports `appRouter`
├── routers/
│   ├── appointments.ts
│   ├── analytics.ts
│   ├── billing.ts
│   ├── calendar.ts
│   ├── dashboard.ts
│   ├── doctors.ts
│   ├── encounters.ts
│   ├── growth.ts
│   ├── immunizations.ts
│   ├── labs.ts
│   ├── nutrition.ts
│   ├── patient.ts        # singular — use orpc.patient.*
│   ├── prescriptions.ts
│   ├── services.ts
│   ├── staff.ts
│   └── vitals.ts
└── middleware/
    ├── auth.ts
    └── clinic.ts
```

> ⚠️ The router key is `patient` (singular). Always use `orpc.patient.*`, never `orpc.patients.*`.

### `@clinic-app/db`

Drizzle schema + migrations. Exports:

```ts
import { db } from "@clinic-app/db"                    // db client
import { schema } from "@clinic-app/db/schema"         // all tables
import type { DbPatient } from "@clinic-app/db/schema/types"
import { queries } from "@clinic-app/db/queries"       // read helpers
import { mutations } from "@clinic-app/db/mutations"   // write helpers
```

### `@clinic-app/auth`

better-auth config. Exports:

```ts
import { auth } from "@clinic-app/auth"
import { authClient } from "@clinic-app/auth/client"
```

### `@clinic-app/ui`

Shared shadcn/ui components. Import from sub-paths:

```ts
import { Button } from "@clinic-app/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@clinic-app/ui/components/card"
import { DataTable } from "@clinic-app/ui/components/data-table"
import { cn } from "@clinic-app/ui/lib/utils"
```

### `@clinic-app/utils`

Shared pure utilities:

```ts
import { calculateAge, getAgeString } from "@clinic-app/utils"
import { generateId } from "@clinic-app/utils/id"
import { getInitials } from "@clinic-app/utils"
```

### `@clinic-app/env`

Type-safe env vars via `@t3-oss/env-core`:

```ts
import { env } from "@clinic-app/env"
// env.DATABASE_URL, env.BETTER_AUTH_SECRET, etc.
```

---

## Web App Structure

```
apps/web/src/
├── routes/                     # TanStack Router file-based routes
│   ├── __root.tsx              # Root document (html, head, body, Outlet)
│   ├── index.tsx               # Landing page /
│   ├── login.tsx               # /login
│   ├── about.tsx
│   ├── blog.tsx
│   ├── blog/
│   │   └── $slug.tsx           # /blog/:slug
│   ├── dashboard.tsx           # ← LAYOUT ONLY → renders <Outlet />
│   ├── dashboard/
│   │   ├── index.tsx           # /dashboard home
│   │   ├── appointments.tsx
│   │   ├── billing.tsx
│   │   ├── calendar.tsx
│   │   ├── doctors.tsx
│   │   ├── encounters.tsx
│   │   ├── immunizations.tsx
│   │   ├── lab-tests.tsx
│   │   ├── milestones.tsx
│   │   ├── nutrition.tsx
│   │   ├── prescriptions.tsx
│   │   ├── reports.tsx
│   │   ├── staff.tsx
│   │   ├── vital-signs.tsx
│   │   ├── well-child.tsx
│   │   └── patients/
│   │       ├── index.tsx       # /dashboard/patients
│   │       ├── new.tsx         # /dashboard/patients/new
│   │       ├── $id.tsx         # /dashboard/patients/:id  (TODO)
│   │       └── $id.edit.tsx    # /dashboard/patients/:id/edit  (TODO)
│   └── api/
│       ├── auth/$.ts           # better-auth handler
│       └── rpc/$.ts            # oRPC handler
│
├── components/
│   ├── app-sidebar.tsx         # Main sidebar navigation
│   ├── header.tsx
│   ├── site-header.tsx
│   ├── nav-main.tsx
│   ├── nav-secondary.tsx
│   ├── nav-documents.tsx
│   ├── nav-user.tsx
│   ├── user-menu.tsx
│   ├── loader.tsx
│   ├── date-range-picker.tsx
│   ├── section-cards.tsx
│   │
│   ├── analytics/              # Dashboard analytics widgets
│   │   ├── ai-predictions.tsx
│   │   ├── patient-trends.tsx
│   │   └── revenue-analytics.tsx
│   │
│   ├── dashboard/              # Dashboard-specific widgets
│   │   ├── dashboard-overview.tsx
│   │   ├── growth-alerts.tsx
│   │   ├── immunization-due.tsx
│   │   ├── recent-activity.tsx
│   │   ├── upcoming-appointment.tsx
│   │   └── vital-stats.tsx
│   │
│   ├── patients/               # Patient domain components
│   │   ├── columns.tsx         # TanStack Table column defs
│   │   ├── patient-filters.tsx
│   │   └── patient-table.tsx   # Full patient table with fuzzy search
│   │
│   ├── appointments/           # Appointment domain
│   │   ├── appointment-table.tsx
│   │   └── appointment-form.tsx
│   │
│   ├── encounters/             # Encounter domain
│   │   ├── column.tsx
│   │   ├── encounter-table.tsx
│   │   ├── encounter-form.tsx
│   │   ├── row-actions.tsx
│   │   └── table-with-toolbar.tsx
│   │
│   ├── doctors/
│   │   ├── columns.tsx
│   │   ├── doctor-form.tsx
│   │   └── doctors-table-row-actions.tsx
│   │
│   ├── staff/
│   │   └── staff-columns.tsx
│   │
│   ├── immunizations/
│   │   ├── columns.tsx
│   │   ├── immunization-form.tsx
│   │   └── immunizations-table-row-actions.tsx
│   │
│   ├── labs/
│   │   ├── columns.tsx
│   │   ├── lab-order-form.tsx
│   │   └── lab-result-upload.tsx
│   │
│   ├── billing/
│   │   └── columns.tsx
│   │
│   ├── growth/                 # Growth tracking (standalone)
│   │   ├── growth-chart.tsx    # ← single source of truth for growth charts
│   │   ├── growth-record-form.tsx
│   │   ├── growth-summary-card.tsx
│   │   ├── growth-predictions.tsx
│   │   └── percentile-calculator.tsx
│   │
│   ├── well-child/             # Well-child visit components
│   │   ├── developmental-screening.tsx
│   │   ├── milestone-tracker.tsx
│   │   └── vaccine-schedule.tsx
│   │   # Note: growth-chart.tsx was merged into growth/
│   │
│   ├── nutrition/
│   │   ├── breastfeeding-tracker.tsx
│   │   ├── feeding-history.tsx
│   │   ├── feeding-log-form.tsx
│   │   └── nutrition-assessment.tsx
│   │
│   └── forms/                  # Generic/shared form utilities only
│       ├── tanstack-form.tsx   # useAppForm, useFormFields wrappers
│       ├── form-context.tsx
│       └── patient-form.tsx    # Full patient registration form
│
├── hooks/
│   ├── functions.ts            # getSession, server functions
│   └── use-mobile.ts
│
└── utils/
    └── orpc.ts                 # oRPC client + React Query integration
```

---

## Routing Conventions

This app uses **TanStack Router** with file-based routing.

### Layout vs Page files

```
dashboard.tsx          → LAYOUT — must only render <Outlet />
dashboard/index.tsx    → PAGE   — the actual /dashboard content
dashboard/patients.tsx → LAYOUT — must only render <Outlet />
dashboard/patients/index.tsx → PAGE — /dashboard/patients list
```

```tsx
// ✅ Correct layout file
export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => { /* auth guard */ },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />   // ← always Outlet in layout files
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Dynamic segments

```
patients/$id.tsx        → /dashboard/patients/:id
patients/$id.edit.tsx   → /dashboard/patients/:id/edit
blog/$slug.tsx          → /blog/:slug
```

### Route loaders (prefetch on navigation)

```tsx
export const Route = createFileRoute("/dashboard/appointments")({
  loader: async ({ context }) => {
    // Prefetch with React Query — data is ready before component mounts
    await context.queryClient.prefetchQuery(
      orpc.appointments.list.queryOptions({ input: { page: 1, limit: 50 } })
    )
  },
  component: AppointmentsPage,
})
```

### Auth guard pattern

```tsx
export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: "/login" })
    return { session }
  },
})
```

---

## Component Organization

### Rule: co-locate by domain, not by type

```
✅  components/patients/patient-table.tsx
✅  components/encounters/encounter-form.tsx
❌  components/table/patient-table.tsx      (type-based folder)
❌  components/forms/EncounterForm.tsx      (wrong domain + wrong case)
```

### Column definitions

Each domain owns its own `columns.tsx`:

```tsx
// components/patients/columns.tsx
import type { ColumnDef } from "@tanstack/react-table"
import type { DbPatient } from "@clinic-app/db/schema/types"

export const columns: ColumnDef<DbPatient>[] = [
  { accessorKey: "firstName", header: "First Name" },
  // ...
]
```

### Forms

Domain-specific forms live in their domain folder. Only truly generic form utilities go in `forms/`:

```
✅  components/appointments/appointment-form.tsx
✅  components/doctors/doctor-form.tsx
✅  components/forms/tanstack-form.tsx      (shared form primitives)
❌  components/forms/AppointmentForm.tsx    (wrong place + wrong case)
```

---

## Data Layer

### oRPC client setup

```ts
// utils/orpc.ts
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import type { AppRouter } from "@clinic-app/api"

const client = createORPCClient<AppRouter>(
  new RPCLink({ url: "/api/rpc" })
)

export const orpc = createTanstackQueryUtils(client)
```

### Query pattern

```tsx
// Always use orpc query options — never write queryKey/queryFn manually
const { data, isLoading } = useQuery(
  orpc.patient.list.queryOptions({ input: { page: 1, limit: 50 } })
)

// With enabled flag
const { data } = useQuery({
  ...orpc.growth.getGrowthChart.queryOptions({ input: { patientId, measurementType: "WEIGHT" } }),
  enabled: !!patientId,
})
```

### Mutation pattern

```tsx
const createPatient = useMutation(
  orpc.patient.create.mutationOptions({
    onSuccess: () => {
      toast.success("Patient created")
      queryClient.invalidateQueries({ queryKey: orpc.patient.key() })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create patient")
    },
  })
)
```

### Cache invalidation

```tsx
// Invalidate all queries for a router
queryClient.invalidateQueries({ queryKey: orpc.patient.key() })

// Invalidate a specific query
queryClient.invalidateQueries({ queryKey: orpc.appointments.list.key({}) })
```

---

## API Layer (oRPC)

### Procedure naming

```ts
// packages/api/src/routers/patient.ts
export const patientRouter = router({
  list:   procedure.input(listSchema).query(listPatients),
  get:    procedure.input(getSchema).query(getPatient),
  create: procedure.input(createSchema).mutation(createPatient),
  update: procedure.input(updateSchema).mutation(updatePatient),
  delete: procedure.input(deleteSchema).mutation(deletePatient),
})
```

### Router key is singular

```ts
// ✅ Correct
orpc.patient.list.queryOptions(...)
orpc.patient.create.mutationOptions(...)

// ❌ Wrong — this router doesn't exist
orpc.patients.list.queryOptions(...)
```

---

## Auth

Uses **better-auth** with Drizzle adapter.

```ts
// Server-side session check (in route beforeLoad / server functions)
import { getSession } from "@/hooks/functions"

const session = await getSession()
if (!session) throw redirect({ to: "/login" })

// Client-side
import { authClient } from "@clinic-app/auth/client"
const { data: session } = authClient.useSession()
```

Auth API is handled at `/api/auth/*` via the catch-all route `routes/api/auth/$.ts`.

---

## Import Aliases & Patterns

### Path aliases (configured in `tsconfig.json` + `vite.config.ts`)

```ts
// Web app aliases
import { orpc } from "@/utils/orpc"
import { PatientForm } from "@/components/forms/patient-form"
import { cn } from "#/lib/utils"          // ← # alias for internal lib

// Workspace package imports
import { Button } from "@clinic-app/ui/components/button"
import { db } from "@clinic-app/db"
import { env } from "@clinic-app/env"
import { calculateAge } from "@clinic-app/utils"
import type { DbPatient } from "@clinic-app/db/schema/types"
```

### Common UI imports

```tsx
// Layout primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@clinic-app/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@clinic-app/ui/components/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@clinic-app/ui/components/dialog"
import { Button } from "@clinic-app/ui/components/button"
import { Badge } from "@clinic-app/ui/components/badge"
import { Input } from "@clinic-app/ui/components/input"
import { Label } from "@clinic-app/ui/components/label"
import { Separator } from "@clinic-app/ui/components/separator"
import { Skeleton } from "@clinic-app/ui/components/skeleton"
import { Progress } from "@clinic-app/ui/components/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@clinic-app/ui/components/avatar"

// Sidebar
import { SidebarProvider, SidebarInset } from "@clinic-app/ui/components/sidebar"

// Alerts
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger } from "@clinic-app/ui/components/alert-dialog"

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@clinic-app/ui/components/select"

// Popover + Calendar (date pickers)
import { Popover, PopoverContent, PopoverTrigger } from "@clinic-app/ui/components/popover"
import { Calendar } from "@clinic-app/ui/components/calendar"

// Dropdown
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger } from "@clinic-app/ui/components/dropdown-menu"

// Checkbox / Radio
import { Checkbox } from "@clinic-app/ui/components/checkbox"
import { RadioGroup, RadioGroupItem } from "@clinic-app/ui/components/radio-group"

// Textarea
import { Textarea } from "@clinic-app/ui/components/textarea"

// Utility
import { cn } from "@clinic-app/ui/lib/utils"
```

### TanStack Form pattern

```tsx
import { useAppForm, useFormFields } from "@/components/forms/tanstack-form"
// or from the shared package:
import { useAppForm, useFormFields } from "@clinic-app/ui/components/tanstack-form"

const form = useAppForm({
  defaultValues: { name: "", email: "" },
  validators: { onSubmit: myZodSchema },
  onSubmit: async ({ value }) => { /* ... */ },
})

const { FormTextField, FormSelectField, FormTextareaField, FormSwitchField } =
  useFormFields<MyFormValues>()

return (
  <form.AppForm>
    <form.Form>
      <FormTextField name="name" label="Full Name" required />
      <FormSelectField name="status" label="Status" options={statusOptions} />
      <form.SubmitButton>Save</form.SubmitButton>
    </form.Form>
  </form.AppForm>
)
```

### TanStack Router navigation

```tsx
import { createFileRoute, Link, useNavigate, redirect, Outlet } from "@tanstack/react-router"

// Typed navigation
const navigate = useNavigate()
navigate({ to: "/dashboard/patients/$id", params: { id: patient.id } })

// Link component
<Link to="/dashboard/patients/new">New Patient</Link>

// Redirect in beforeLoad
throw redirect({ to: "/login", search: { redirect: "/dashboard" } })
```

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `patient-form.tsx` |
| Components | `PascalCase` | `PatientForm` |
| Hooks | `camelCase` with `use` prefix | `usePatientData` |
| Route files | `kebab-case` | `lab-tests.tsx` |
| Dynamic segments | `$param` | `$id.tsx` |
| Column files | `columns.tsx` per domain | `patients/columns.tsx` |
| Row action files | `*-row-actions.tsx` | `doctors-table-row-actions.tsx` |
| Table files | `*-table.tsx` | `encounter-table.tsx` |
| Form files | `*-form.tsx` | `appointment-form.tsx` |

### ❌ Avoid these patterns

```
DoctorForm.tsx          → doctor-form.tsx
Appointment-form.tsx    → appointment-form.tsx
Encounter.table.tsx     → encounter-table.tsx
EncounterForm.tsx       → encounter-form.tsx
DoctorsTableRowActions.tsx → doctors-table-row-actions.tsx
```

---

## Best Practices

### 1. Route files are only for routing

Route files (`routes/**/*.tsx`) should only contain:
- `createFileRoute(...)` with `beforeLoad`, `loader`, `component`
- The page component that composes feature components

Never put reusable UI logic directly in route files. Extract to `components/`.

### 2. Layout routes must render `<Outlet />`

```tsx
// ✅ dashboard.tsx — layout
function DashboardLayout() {
  return <SidebarProvider><AppSidebar /><SidebarInset><Outlet /></SidebarInset></SidebarProvider>
}

// ✅ dashboard/index.tsx — actual page content
function DashboardHome() {
  return <div>...</div>
}
```

### 3. Never put route files inside `components/`

```
❌ components/table/appointment-list.tsx  (calls createFileRoute — this is a route!)
✅ routes/dashboard/appointments.tsx
```

### 4. Use `orpc` query options everywhere

```tsx
// ✅ Always
useQuery(orpc.patient.list.queryOptions({ input: { limit: 50 } }))

// ❌ Never write raw queryKey/queryFn
useQuery({ queryKey: ["patients"], queryFn: () => fetch("/api/patients") })
```

### 5. Invalidate by router key, not string arrays

```tsx
// ✅
queryClient.invalidateQueries({ queryKey: orpc.patient.key() })

// ❌
queryClient.invalidateQueries({ queryKey: ["patients"] })
```

### 6. Type your column defs

```tsx
import type { ColumnDef } from "@tanstack/react-table"
import type { DbPatient } from "@clinic-app/db/schema/types"

const columns: ColumnDef<DbPatient>[] = [...]
```

### 7. Remove debug flags before committing

```tsx
// ❌ Never commit these
useReactTable({ debugTable: true, debugHeaders: true })

// ❌ Never commit raw state dumps
<pre>{JSON.stringify(table.getState(), null, 2)}</pre>
```

### 8. Don't cast oRPC to `any`

```tsx
// ❌ Procedure doesn't exist — fix the API, don't cast
(orpc as any).nutrition.getData.queryOptions(...)

// ✅ Add the procedure to the router
orpc.nutrition.getData.queryOptions(...)
```

### 9. Guard patient-scoped queries with `enabled`

```tsx
const { data } = useQuery({
  ...orpc.growth.getMilestones.queryOptions({ input: { patientId: selectedPatient ?? "" } }),
  enabled: !!selectedPatient,   // ← don't fire with empty string
})
```

### 10. Use `calculateAge` from `@clinic-app/utils`

```tsx
import { calculateAge, getAgeString } from "@clinic-app/utils"

// calculateAge(dateOfBirth) → number (years)
// getAgeString(dateOfBirth) → "2 years 3 months"
```

### 11. Pediatric-specific: always show age in months for children < 2

```tsx
function formatPediatricAge(dob: Date): string {
  const months = differenceInMonths(new Date(), dob)
  if (months < 24) return `${months} months`
  return `${Math.floor(months / 12)} years`
}
```

### 12. Growth chart: single source of truth

Use `components/growth/growth-chart.tsx` everywhere. Do not duplicate it in `well-child/`.

```tsx
// ✅ Import from growth/
import { GrowthChart } from "@/components/growth/growth-chart"

// ❌ Don't use the well-child copy
import { GrowthChart } from "@/components/well-child/growth-chart"
```

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| `dashboard.tsx` renders a full page | It's a layout — render `<Outlet />` only |
| `patients.tsx` renders a stub | It's a layout — render `<Outlet />` only |
| `orpc.patients.*` (plural) | Use `orpc.patient.*` (singular) |
| `labTests.listByPatient` called with `patientId: ""` | Guard with `enabled: !!patientId` |
| Route file inside `components/` | Move to `routes/` |
| `calculateAge()` called with 0 args | Pass `dateOfBirth: Date` as first arg |
| Navigating to `/dashboard/growth-analytics` | Route doesn't exist — use `/dashboard/well-child` |
| Navigating to `/dashboard/medical-records/:id` | Route doesn't exist — create it or use encounters |
| Hardcoded `clinicId = "your-clinic-id"` | Read from auth session context |
| Hardcoded user in `app-sidebar.tsx` | Read from `authClient.useSession()` |
| Duplicate `GrowthChart` in `well-child/` | Use `growth/growth-chart.tsx` only |

---

## Dev Commands

```bash
# Start everything (web + api)
bun dev

# Start only the web app
bun dev:web

# Database
bun db:generate     # generate migrations from schema changes
bun db:migrate      # run migrations
bun db:push         # push schema directly (dev only)
bun db:seed         # seed with fake data
bun db:studio       # open Drizzle Studio

# Docker (local PostgreSQL)
bun docker:up

# Type checking
bun check-types

# Lint + format (Biome)
bun lint
bun format

# Tests
bun test:unit       # vitest
bun test:e2e        # playwright
bun test:ui         # vitest UI

# Add shadcn component to shared UI package
bun ui              # bunx shadcn@latest add -c packages/ui

# Workspace dependency consistency check
bun lint:ws         # sherif --fix
```

---

## Environment Variables

Managed by `@clinic-app/env` with `@t3-oss/env-core`. All vars are validated at startup.

```bash
# apps/web/.env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
VITE_APP_URL=http://localhost:3000
```

Never access `process.env` directly — always use:

```ts
import { env } from "@clinic-app/env"
env.DATABASE_URL
```

---

*Last updated: May 2026*
