// src/components/patients/columns.tsx
import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  parentName?: string;
  phone?: string;
  status?: string;
  createdAt: Date;
}

function PatientRowActions({ patient }: { patient: Patient }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          variant="ghost"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() =>
            router.navigate({ to: `/dashboard/patients/${patient.id}` })
          }
        >
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.navigate({ to: `/dashboard/patients/${patient.id}/edit` })
          }
        >
          Edit patient
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            router.navigate({
              to: "/dashboard/immunizations",
              search: { patientId: patient.id },
            })
          }
        >
          View immunizations
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.navigate({
              to: "/dashboard/encounters",
              search: { patientId: patient.id },
            })
          }
        >
          View encounters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function calculateAge(dob: string): string {
  const ms = Date.now() - new Date(dob).getTime();
  const months = Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000));
  if (months < 24) return `${months}mo`;
  return `${Math.floor(months / 12)}yr`;
}

export const patientColumns: ColumnDef<Patient>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        className="translate-y-[2px]"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        className="translate-y-[2px]"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
    filterFn: (row, _id, value) => {
      const name = `${row.original.firstName} ${row.original.lastName}`;
      return name.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "dateOfBirth",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Age" />
    ),
    cell: ({ row }) => <div>{calculateAge(row.getValue("dateOfBirth"))}</div>,
  },
  {
    accessorKey: "gender",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gender" />
    ),
    cell: ({ row }) => (
      <div className="capitalize">
        {(row.getValue("gender") as string)?.toLowerCase()}
      </div>
    ),
  },
  {
    accessorKey: "parentName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parent / Guardian" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("parentName") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => <div>{row.getValue("phone") || "—"}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = (row.getValue("status") as string) || "ACTIVE";
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PatientRowActions patient={row.original} />,
  },
];

export const columns = patientColumns;
