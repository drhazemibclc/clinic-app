// src/components/prescriptions/columns.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  CheckCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";

export type PrescriptionItem = {
  id?: string;
  drugId?: string;
  drugName?: string;
  refillsRemaining?: number;
  lastRefillDate?: string | Date | null;
  isDueForRefill?: boolean;
  daysSupply?: number;
};

export type Prescription = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: "active" | "completed" | "cancelled" | "expired" | "on_hold";
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  refillsRemaining: number;
  createdAt: Date;
  updatedAt: Date;
  items?: PrescriptionItem[];
};

const statusColors = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  expired: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  on_hold: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
};

const statusLabels = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  on_hold: "On Hold",
};

export const columns: ColumnDef<Prescription>[] = [
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
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original.patientName;
      return (
        <div>
          <div className="font-medium">{patient}</div>
          <div className="text-muted-foreground text-xs">
            ID: {row.original.patientId.slice(0, 8)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "medicationName",
    header: "Medication",
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.original.medicationName}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.dosage} • {row.original.frequency}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "doctorName",
    header: "Prescribed By",
    cell: ({ row }) => {
      return (
        <div>
          <div className="text-sm">{row.original.doctorName}</div>
          <div className="text-muted-foreground text-xs">
            ID: {row.original.doctorId.slice(0, 8)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const date = row.original.startDate;
      return (
        <div className="text-sm">{format(new Date(date), "MMM d, yyyy")}</div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const date = row.original.endDate;
      if (!date)
        return <div className="text-muted-foreground text-sm">No end date</div>;
      const isExpired = new Date(date) < new Date();
      return (
        <div className={`text-sm ${isExpired ? "text-red-600" : ""}`}>
          {format(new Date(date), "MMM d, yyyy")}
          {isExpired && (
            <Badge variant="destructive" className="ml-2">
              Expired
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "refillsRemaining",
    header: "Refills",
    cell: ({ row }) => {
      const refills = row.original.refillsRemaining;
      return (
        <Badge variant={refills > 0 ? "default" : "secondary"}>
          {refills} refill{refills !== 1 ? "s" : ""} remaining
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const prescription = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => console.log("View", prescription.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Edit", prescription.id)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Prescription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {prescription.status === "active" && (
              <DropdownMenuItem
                onClick={() => console.log("Complete", prescription.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Mark as Completed
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => console.log("Cancel", prescription.id)}
              className="text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Prescription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log("Delete", prescription.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
