// app/routes/dashboard/well-child.tsx

import type { DbPatient } from "@clinic-app/db/schema/types";
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
import { DevelopmentalScreening } from "@/components/well-child/developmental-screening";
import { GrowthChart } from "@/components/well-child/growth-chart";
import { MilestoneTracker } from "@/components/well-child/milestone-tracker";
import { VaccineSchedule } from "@/components/well-child/vaccine-schedule";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/well-child")({
  component: WellChildPage,
});

function WellChildPage() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { data: patients } = useQuery(
    orpc.patient.list.queryOptions({ input: { limit: 100 } }),
  );
  const { data: growthData } = useQuery({
    ...orpc.growth.getGrowthChart.queryOptions({
      input: {
        patientId: selectedPatient ?? "",
        measurementType: "WEIGHT", // Defaulting to WEIGHT to satisfy the required union type
      },
    }),
    enabled: !!selectedPatient,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Well-Child Tracker
        </h1>
        <p className="text-muted-foreground">
          Monitor growth, development, and preventive care
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
            {patients?.patients.map((p: DbPatient) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} (DOB:{" "}
                {new Date(p.dateOfBirth).toLocaleDateString()})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPatient && (
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="growth">Growth Charts</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="vaccines">Vaccine Schedule</TabsTrigger>
            <TabsTrigger value="screening">Developmental Screening</TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <GrowthChart patientId={selectedPatient} data={growthData} />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneTracker patientId={selectedPatient} />
          </TabsContent>

          <TabsContent value="vaccines">
            <VaccineSchedule patientId={selectedPatient} />
          </TabsContent>

          <TabsContent value="screening">
            <DevelopmentalScreening patientId={selectedPatient} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
