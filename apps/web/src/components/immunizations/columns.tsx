// src/components/immunizations/columns.tsx
import { Badge } from "@clinic-app/ui/components/badge";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { ImmunizationsTableRowActions } from "./ImmunizationsTableRowActions";

interface Immunization {
  id: string;
  patientId: string;
  patientName: string;
  vaccine: string;
  date: Date;
  dose: string;
  lotNumber: string;
  administeredByStaffId: string;
  administeredByName: string;
  notes?: string;
  status: "COMPLETED" | "PENDING" | "OVERDUE" | "SCHEDULED";
  createdAt: Date;
}

export const immunizationColumns: ColumnDef<Immunization>[] = [
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
    accessorKey: "patientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      const patientName = row.getValue("patientName") as string;
      return <div className="font-medium">{patientName}</div>;
    },
    filterFn: (row, id, value) => {
      return (row.getValue(id) as string)
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "vaccine",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vaccine" />
    ),
    cell: ({ row }) => {
      const vaccine = row.getValue("vaccine") as string;
      return <div className="font-medium">{vaccine}</div>;
    },
  },
  {
    accessorKey: "dose",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dose" />
    ),
    cell: ({ row }) => {
      const dose = row.getValue("dose") as string;
      return <Badge variant="outline">{dose}</Badge>;
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Administered" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      const today = new Date();
      const isUpcoming = date > today;

      return (
        <div className={isUpcoming ? "text-amber-600" : ""}>
          {date.toLocaleDateString()}
          {isUpcoming && (
            <span className="ml-2 text-amber-600 text-xs">(Scheduled)</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      let label = status;

      switch (status) {
        case "COMPLETED":
          variant = "default";
          label = "Completed";
          break;
        case "PENDING":
          variant = "outline";
          label = "Pending";
          break;
        case "OVERDUE":
          variant = "destructive";
          label = "Overdue";
          break;
        case "SCHEDULED":
          variant = "secondary";
          label = "Scheduled";
          break;
      }

      return <Badge variant={variant}>{label}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "administeredByName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Administered By" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("administeredByName") as string;
      return <div className="text-muted-foreground text-sm">{name || "—"}</div>;
    },
  },
  {
    accessorKey: "lotNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lot #" />
    ),
    cell: ({ row }) => {
      const lotNumber = row.getValue("lotNumber") as string;
      return <div className="font-mono text-sm">{lotNumber || "—"}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ImmunizationsTableRowActions row={row} />,
  },
];

// Vaccine options for filtering
export const vaccineOptions = [
  { label: "BCG", value: "BCG" },
  { label: "Hepatitis B", value: "Hepatitis B" },
  { label: "DPT", value: "DPT" },
  { label: "Polio", value: "Polio" },
  { label: "MMR", value: "MMR" },
  { label: "Hib", value: "Hib" },
  { label: "PCV", value: "PCV" },
  { label: "Rotavirus", value: "Rotavirus" },
  { label: "Influenza", value: "Influenza" },
  { label: "Varicella", value: "Varicella" },
  { label: "HPV", value: "HPV" },
  { label: "Tdap", value: "Tdap" },
  { label: "Meningococcal", value: "Meningococcal" },
];

export const immunizationStatuses = [
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Scheduled", value: "SCHEDULED" },
];

// Default export alias for routes that import `columns`
export const columns = immunizationColumns;
