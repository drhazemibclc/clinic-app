// src/components/doctors/columns.tsx
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@clinic-app/ui/components/avatar";
import { Badge } from "@clinic-app/ui/components/badge";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { DataTableColumnHeader } from "@clinic-app/ui/components/data-table/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { DoctorsTableRowActions } from "./DoctorsTableRowActions";

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  isActive: boolean;
  status: string;
  phone: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const doctorColumns: ColumnDef<Doctor>[] = [
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
    id: "doctor",
    accessorFn: (row) => ({
      name: row.name,
      email: row.email,
      image: row.image,
      specialty: row.specialty,
    }),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Doctor" />
    ),
    cell: ({ row }) => {
      const doctor = row.original;
      const initials = doctor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {doctor.image && (
              <AvatarImage alt={doctor.name} src={doctor.image} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{doctor.name}</span>
            <span className="text-muted-foreground text-sm">
              {doctor.specialty}
            </span>
          </div>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      const doctor = row.original;
      return (
        doctor.name.toLowerCase().includes(value.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(value.toLowerCase()) ||
        doctor.email.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <div className="text-muted-foreground">{email}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return <div>{phone || "—"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isActive = row.original.isActive;

      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      let label = status;

      if (isActive && status === "ACTIVE") {
        variant = "default";
        label = "Active";
      } else if (status === "INACTIVE") {
        variant = "secondary";
        label = "Inactive";
      } else if (status === "PENDING") {
        variant = "outline";
        label = "Pending";
      } else if (status === "SUSPENDED") {
        variant = "destructive";
        label = "Suspended";
      }

      return <Badge variant={variant}>{label}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DoctorsTableRowActions row={row} />,
  },
];

// Doctor specialties for filtering
export const doctorSpecialties = [
  { label: "Pediatrician", value: "Pediatrician" },
  { label: "Cardiologist", value: "Cardiologist" },
  { label: "Neurologist", value: "Neurologist" },
  { label: "Dermatologist", value: "Dermatologist" },
  { label: "Orthopedic", value: "Orthopedic" },
  { label: "ENT", value: "ENT" },
  { label: "Ophthalmologist", value: "Ophthalmologist" },
  { label: "Psychiatrist", value: "Psychiatrist" },
];

export const doctorStatuses = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
];

// Default export alias for routes that import `columns`
export const columns = doctorColumns;
