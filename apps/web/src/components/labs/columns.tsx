// src/components/labs/columns.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { cn } from "@clinic-app/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, Eye, FileText, MoreHorizontal } from "lucide-react";

export type LabTest = {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: string;
  orderedBy: string;
  orderedDate: Date;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  result?: {
    value: string;
    unit: string;
    referenceRange: string;
    abnormal: boolean;
    critical: boolean;
  };
  resultDate?: Date;
  uploadedBy?: string;
  notes?: string;
};

export const columns: ColumnDef<LabTest>[] = [
  {
    accessorKey: "testName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Test Name" />
    ),
    cell: ({ row }) => {
      const test = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{test.testName}</span>
          <span className="text-muted-foreground text-xs">{test.category}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "patientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.patientName}</div>;
    },
  },
  {
    accessorKey: "orderedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ordered By" />
    ),
    cell: ({ row }) => row.original.orderedBy,
  },
  {
    accessorKey: "orderedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ordered Date" />
    ),
    cell: ({ row }) =>
      format(new Date(row.original.orderedDate), "MMM dd, yyyy"),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const variants = {
        pending: { variant: "outline" as const, label: "Pending" },
        "in-progress": { variant: "secondary" as const, label: "In Progress" },
        completed: { variant: "default" as const, label: "Completed" },
        cancelled: { variant: "secondary" as const, label: "Cancelled" },
      };
      const { variant, label } = variants[status];
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: "result",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Result" />
    ),
    cell: ({ row }) => {
      const result = row.original.result;
      if (!result)
        return <span className="text-muted-foreground text-sm">—</span>;

      return (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-medium",
              result.critical && "font-bold text-red-600",
              result.abnormal && !result.critical && "text-yellow-600",
            )}
          >
            {result.value} {result.unit}
          </span>
          <span className="text-muted-foreground text-xs">
            Ref: {result.referenceRange}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const test = row.original;

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
              onClick={() => navigator.clipboard.writeText(test.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {test.status !== "completed" && (
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Enter Results
              </DropdownMenuItem>
            )}
            {test.result && (
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
