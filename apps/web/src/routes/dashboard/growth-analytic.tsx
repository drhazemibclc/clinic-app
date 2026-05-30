// app/routes/dashboard/growth-analytics.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GrowthChart } from "@/components/growth/growth-chart";
import { GrowthPredictions } from "@/components/growth/growth-predictions";
import { PercentileCalculator } from "@/components/growth/percentile-calculator";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/growth-analytic")({
  component: GrowthAnalyticsPage,
});

function GrowthAnalyticsPage() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { data: patients } = useQuery(
    orpc.patient.list.queryOptions({ input: { limit: 100 } }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Growth Analytics</h1>
        <p className="text-muted-foreground">
          AI-powered growth tracking and predictions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full rounded-md border p-2"
            value={selectedPatient || ""}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">Choose a patient...</option>
            {patients?.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPatient && (
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="charts">Growth Charts</TabsTrigger>
            <TabsTrigger value="percentiles">Percentiles</TabsTrigger>
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <GrowthChart patientId={selectedPatient} />
          </TabsContent>

          <TabsContent value="percentiles">
            <PercentileCalculator patientId={selectedPatient} />
          </TabsContent>

          <TabsContent value="predictions">
            <GrowthPredictions patientId={selectedPatient} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
