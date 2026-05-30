// src/components/immunizations/ImmunizationsTableRowActions.tsx

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

export function ImmunizationsTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const immunization = row.original as {
    id: string;
    patientId: string;
    vaccine: string;
    patientName: string;
  };

  const deleteImmunization = useMutation(
    orpc.immunizations.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Immunization record deleted");
        queryClient.invalidateQueries({ queryKey: orpc.immunizations.key() });
        router.invalidate();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to delete immunization record");
      },
    }),
  );

  const handleDelete = () => {
    if (
      confirm(
        `Delete immunization record for ${immunization.patientName} (${immunization.vaccine})?`,
      )
    ) {
      deleteImmunization.mutate({ id: immunization.id });
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
            router.navigate({
              to: `/dashboard/immunizations/${immunization.id}`,
            })
          }
        >
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.navigate({
              to: `/dashboard/immunizations/${immunization.id}/edit`,
            })
          }
        >
          Edit record
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.navigate({
              to: `/dashboard/patients/${immunization.patientId}`,
            })
          }
        >
          View patient
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground"
          onClick={() => window.print()}
        >
          Print certificate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          Delete record
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
