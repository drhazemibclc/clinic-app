// app/routes/dashboard/nutrition.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { BreastfeedingTracker } from "@/components/nutrition/breastfeeding-tracker";
import { FeedingLogForm } from "@/components/nutrition/feeding-log-form";
import { NutritionAssessment } from "@/components/nutrition/nutrition-assessment";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/nutrition")({
  component: NutritionPage,
});

function NutritionPage() {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { data: patients } = useQuery(
    orpc.patient.list.queryOptions({ input: { limit: 100 } }),
  );
  const { data: nutritionData } = useQuery(
    orpc.nutrition.getData.queryOptions({
      input: { patientId: selectedPatient ?? "" },
    }),
    { enabled: !!selectedPatient },
  );

  const logFeeding = useMutation(
    orpc.nutrition.logFeeding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["nutrition"] });
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Nutrition Tracking
        </h1>
        <p className="text-muted-foreground">
          Monitor feeding patterns and nutritional status
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
            {patients?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} (Age: {calculateAge(p.dateOfBirth)})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPatient && (
        <Tabs defaultValue="feeding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feeding">Feeding Log</TabsTrigger>
            <TabsTrigger value="breastfeeding">Breastfeeding</TabsTrigger>
            <TabsTrigger value="assessment">Nutrition Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="feeding">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Log Feeding
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <FeedingLogForm
                      patientId={selectedPatient}
                      onSubmit={logFeeding.mutate}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <FeedingHistory data={nutritionData?.feedingHistory} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="breastfeeding">
            <BreastfeedingTracker
              patientId={selectedPatient}
              data={nutritionData?.breastfeeding}
            />
          </TabsContent>

          <TabsContent value="assessment">
            <NutritionAssessment
              patientId={selectedPatient}
              data={nutritionData?.assessment}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function calculateAge(dob: string): string {
  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return `${age} years`;
}
