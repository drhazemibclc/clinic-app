// app/routes/dashboard/encounters.tsx

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { columns } from "@/components/encounters/column";
import { EncounterForm } from "@/components/encounters/EncounterForm";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/encounters")({
  component: EncountersPage,
});

function EncountersPage() {
  const queryClient = useQueryClient();
  const { data: encounters, isLoading } = useQuery(
    orpc.encounters.list.queryOptions({
      input: {
        page: 1,
        pageSize: 50,
      },
    }),
  );

  const _createEncounter = useMutation(
    orpc.encounters.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.encounters.key() });
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Medical Encounters
          </h1>
          <p className="text-muted-foreground">
            Record and review patient visits
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Encounter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <EncounterForm
              onSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: orpc.encounters.key(),
                })
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{encounters?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {encounters?.monthlyCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Well-Child Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {encounters?.wellChildCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Sick Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {encounters?.sickCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encounter History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={encounters?.items || []}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
