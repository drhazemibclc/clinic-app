import { Badge } from "@clinic-app/ui/components/badge";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface BillingTransaction {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  date: Date;
  type: "INVOICE" | "PAYMENT";
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  description?: string;
}

const getStatusVariant = (status: BillingTransaction["status"]) => {
  switch (status) {
    case "PAID":
      return "default";
    case "PENDING":
      return "secondary";
    case "OVERDUE":
      return "destructive";
    case "CANCELLED":
      return "outline";
    default:
      return "secondary";
  }
};

export const columns: ColumnDef<BillingTransaction>[] = [
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
      const date = new Date(row.getValue("date"));
      return <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>;
    },
  },
  {
    accessorKey: "patientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("patientName")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className="capitalize">
          {type.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as BillingTransaction["status"];
      return (
        <Badge variant={getStatusVariant(status)}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  },
];
