// app/routes/dashboard/immunizations.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { DataTable } from "@clinic-app/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { columns } from "@/components/immunizations/columns";
import { ImmunizationForm } from "@/components/immunizations/immunization-form";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/immunizations")({
  component: ImmunizationsPage,
});

function ImmunizationsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: immunizations, isLoading } = useQuery(
    orpc.immunizations.list.queryOptions(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Immunization Records
          </h1>
          <p className="text-muted-foreground">
            Track and manage vaccine administration
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Immunization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ImmunizationForm
              clinicId=""
              onSuccess={() => {
                setDialogOpen(false);
                queryClient.invalidateQueries({
                  queryKey: orpc.immunizations.key(),
                });
              }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Upcoming Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {immunizations?.upcomingCount || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Vaccines due in next 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {immunizations?.completedCount || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Total vaccines administered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {immunizations?.complianceRate || 0}%
            </div>
            <p className="text-muted-foreground text-xs">
              Age-appropriate coverage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {immunizations?.onTrackCount || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Patients following schedule
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Immunization History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={immunizations?.items || []}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
