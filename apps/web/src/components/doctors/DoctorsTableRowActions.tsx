// src/components/doctors/DoctorsTableRowActions.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DoctorsTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const doctor = row.original as { id: string; name: string; email: string };

  const updateDoctorStatus = useMutation(
    orpc.doctors.update.mutationOptions({
      onSuccess: () => {
        toast.success("Doctor status updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.doctors.key() });
        router.invalidate();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to update doctor status");
      },
    }),
  );

  const deleteDoctor = useMutation(
    orpc.doctors.delete.mutationOptions({
      onSuccess: () => {
        toast.success(`Doctor ${doctor.name} has been removed`);
        queryClient.invalidateQueries({ queryKey: orpc.doctors.key() });
        router.invalidate();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to delete doctor");
      },
    }),
  );

  const handleStatusChange = (status: string, isActive: boolean) => {
    updateDoctorStatus.mutate({
      id: doctor.id,
      data: { status, isActive },
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      deleteDoctor.mutate({ id: doctor.id });
    }
  };

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
            router.navigate({ to: `/dashboard/doctors/${doctor.id}` })
          }
        >
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.navigate({ to: `/dashboard/doctors/${doctor.id}/edit` })
          }
        >
          Edit doctor
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE", true)}>
          Set as Active
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("INACTIVE", false)}>
          Set as Inactive
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleStatusChange("SUSPENDED", false)}
        >
          Suspend
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          Delete doctor
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
