// app/routes/dashboard/vital-signs.tsx

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
import { columns } from "@/components/vitals/columns";
import { GrowthPercentileChart } from "@/components/vitals/growth-percentile-chart";
import { VitalSignsForm } from "@/components/vitals/vital-signs-form";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/vital-signs")({
  component: VitalSignsPage,
});

function VitalSignsPage() {
  const queryClient = useQueryClient();
  const { data: vitals, isLoading } = useQuery(orpc.vitals.list.queryOptions());

  const recordVitals = useMutation(
    orpc.vitals.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vitals"] });
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Vital Signs & Measurements
          </h1>
          <p className="text-muted-foreground">
            Track growth metrics and physiological data
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Vitals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <VitalSignsForm onSubmit={recordVitals.mutate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Height (cm)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {vitals?.latestHeight || "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Weight (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {vitals?.latestWeight || "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Head Circ (cm)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {vitals?.latestHeadCircumference || "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{vitals?.latestBMI || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Percentile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {vitals?.latestPercentile || "-"}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthPercentileChart data={vitals?.growthData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={vitals?.items || []}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
