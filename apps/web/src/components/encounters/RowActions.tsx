// src/components/encounters/EncounterTableRowActions.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@clinic-app/ui/components/alert-dialog";
import { Button } from "@clinic-app/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@clinic-app/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import type { Encounter } from "./column";

interface EncounterTableRowActionsProps {
  row: Row<Encounter>;
}

export function EncounterTableRowActions({
  row,
}: EncounterTableRowActionsProps) {
  const encounter = row.original;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatusMutation = useMutation(
    orpc.encounters.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["encounters"] });
        toast.success("Encounter status updated successfully");
      },
      onError: (error: Error) => {
        toast.error("Failed to update encounter status", {
          description: error.message,
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    orpc.encounters.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["encounters"] });
        toast.success("Encounter deleted successfully");
        setShowDeleteDialog(false);
      },
      onError: (error: Error) => {
        toast.error("Failed to delete encounter", {
          description: error.message,
        });
      },
      onSettled: () => {
        setIsDeleting(false);
      },
    }),
  );

  const handleStatusChange = async (status: Encounter["status"]) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: encounter.id,
        status,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteMutation.mutateAsync({ id: encounter.id });
  };

  const handleViewDetails = () => {
    navigate({
      to: "/dashboard/encounters/$id",
      params: { id: encounter.id },
    });
  };

  const handleEdit = () => {
    navigate({
      to: "/dashboard/encounters/$id/edit",
      params: { id: encounter.id },
    });
  };

  const handleViewPatient = () => {
    navigate({
      to: "/dashboard/patients/$id",
      params: { id: encounter.patientId },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            Edit encounter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewPatient}>
            View patient
          </DropdownMenuItem>

          {encounter.status !== "COMPLETED" && (
            <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
              Mark as completed
              <DropdownMenuShortcut>✓</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleStatusChange("PENDING")}
                disabled={encounter.status === "PENDING" || isUpdating}
              >
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={encounter.status === "ACTIVE" || isUpdating}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={encounter.status === "COMPLETED" || isUpdating}
              >
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={encounter.status === "CANCELLED" || isUpdating}
                className="text-destructive"
              >
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            Delete encounter
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Complete Encounter Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Encounter</DialogTitle>
            <DialogDescription>
              Mark this encounter as completed. This will also update the
              associated medical record status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleStatusChange("COMPLETED");
                setShowCompleteDialog(false);
              }}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              encounter for patient {encounter.patientName} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
