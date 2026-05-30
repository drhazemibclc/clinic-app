// src/components/encounters/columns.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EncounterTableRowActions } from "./RowActions";

export interface Encounter {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  type: string | null;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  date: Date;
  followUpPlan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const getStatusVariant = (status: Encounter["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "ACTIVE":
      return "secondary";
    case "PENDING":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
};

export const encounterColumns: ColumnDef<Encounter>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      return <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>;
    },
  },
  {
    accessorKey: "patientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      const patientName = row.getValue("patientName") as string;
      return <div className="font-medium">{patientName || "Unknown"}</div>;
    },
    filterFn: (row, _id, value) => {
      const patientName = row.getValue("patientName") as string;
      return patientName?.toLowerCase().includes(value.toLowerCase()) ?? false;
    },
  },
  {
    accessorKey: "doctorName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Doctor" />
    ),
    cell: ({ row }) => {
      const doctorName = row.getValue("doctorName") as string;
      return <div>{doctorName || "Unassigned"}</div>;
    },
  },
  {
    accessorKey: "diagnosis",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Diagnosis" />
    ),
    cell: ({ row }) => {
      const diagnosis = row.getValue("diagnosis") as string;
      return (
        <div className="max-w-50 truncate" title={diagnosis || undefined}>
          {diagnosis || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline">{type || "General"}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Encounter["status"];
      return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <EncounterTableRowActions row={row} />,
  },
];

// Default export alias for routes that import `columns`
export const columns = encounterColumns;
