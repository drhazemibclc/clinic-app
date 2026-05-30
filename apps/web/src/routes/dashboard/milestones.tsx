// app/routes/dashboard/milestones.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Checkbox } from "@clinic-app/ui/components/checkbox";
import { Progress } from "@clinic-app/ui/components/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, Eye, Footprints, MessageSquare, Smile } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/milestones")({
  component: MilestonesPage,
});

const milestoneCategories = [
  {
    name: "Gross Motor",
    icon: Footprints,
    color: "bg-blue-500",
    milestones: [
      "Rolls over",
      "Sits without support",
      "Crawls",
      "Stands alone",
      "Walks independently",
    ],
  },
  {
    name: "Fine Motor",
    icon: Smile,
    color: "bg-green-500",
    milestones: [
      "Reaches for objects",
      "Transfers objects hand-to-hand",
      "Pincer grasp",
      "Stacks blocks",
      "Draws shapes",
    ],
  },
  {
    name: "Language",
    icon: MessageSquare,
    color: "bg-purple-500",
    milestones: [
      "Coos",
      "Babbling",
      "First words",
      "2-3 word phrases",
      "Follows simple commands",
    ],
  },
  {
    name: "Social/Emotional",
    icon: Eye,
    color: "bg-yellow-500",
    milestones: [
      "Social smile",
      "Stranger anxiety",
      "Plays peek-a-boo",
      "Parallel play",
      "Shows empathy",
    ],
  },
  {
    name: "Cognitive",
    icon: Brain,
    color: "bg-red-500",
    milestones: [
      "Recognizes familiar faces",
      "Object permanence",
      "Pretend play",
      "Matches pictures",
      "Counts to 10",
    ],
  },
];

function MilestonesPage() {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { data: patients } = useQuery(
    orpc.patient.list.queryOptions({ input: { limit: 100 } }),
  );
  const { data: milestones } = useQuery({
    ...orpc.growth.getMilestones.queryOptions({
      input: { patientId: selectedPatient ?? "" },
    }),
    enabled: !!selectedPatient,
  });

  const updateMilestone = useMutation(
    orpc.growth.updateMilestone.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["milestones"] });
      },
    }),
  );

  const calculateProgress = () => {
    if (!milestones) return 0;
    const total = milestones.total || 1;
    const achieved = milestones.achieved || 0;
    return (achieved / total) * 100;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Developmental Milestones
        </h1>
        <p className="text-muted-foreground">
          Track age-appropriate developmental achievements
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
                {p.firstName} {p.lastName} (Age:{" "}
                {calculateAge(p.dateOfBirth.toISOString())})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Overall Development Progress
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Based on age-appropriate milestones
                  </p>
                </div>
                <span className="font-bold text-2xl">
                  {Math.round(calculateProgress())}%
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {milestoneCategories.map((category) => {
              const Icon = category.icon;
              const categoryMilestones =
                milestones?.milestones.map((m) => m.milestone) || [];

              return (
                <Card key={category.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`rounded-lg ${category.color} p-1.5 text-white`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">
                        {category.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.milestones.map((milestone) => (
                      <div
                        key={milestone.toString()}
                        className="flex items-start gap-2"
                      >
                        <Checkbox
                          checked={categoryMilestones.includes(milestone)}
                          onCheckedChange={() =>
                            updateMilestone.mutate({
                              patientId: selectedPatient,
                              milestone,
                              // Fix 3.4 — pass age as a number (months), not a
                              // string like "14 months" which would fail API validation.
                              ageAchieved: getAgeInMonths(
                                patients?.patients
                                  .find((p) => p.id === selectedPatient)
                                  ?.dateOfBirth.toISOString() ||
                                  new Date().toISOString(),
                              ),
                              dateRecorded: new Date(),
                              notes: `Category: ${category.name}`,
                            })
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="milestone"
                          className="text-sm leading-tight"
                        >
                          {milestone}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function calculateAge(dob: string): string {
  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return `${age} months`;
}

// Fix 3.4 — returns age as a plain number (months) for use in API calls.
function getAgeInMonths(dob: string): number {
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (30.44 * 24 * 60 * 60 * 1000),
  );
}
