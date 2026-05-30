// src/components/dashboard/immunization-due.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import { Syringe } from "lucide-react";

export function ImmunizationDue() {
  const dueVaccines = [
    {
      id: "1",
      vaccine: "MMR",
      patient: "Emma Thompson",
      dueDate: "Mar 25, 2024",
      status: "due",
      priority: "high",
    },
    {
      id: "2",
      vaccine: "DTaP",
      patient: "Liam Chen",
      dueDate: "Mar 28, 2024",
      status: "upcoming",
      priority: "medium",
    },
    {
      id: "3",
      vaccine: "Hepatitis B",
      patient: "Sophia Rodriguez",
      dueDate: "Apr 5, 2024",
      status: "upcoming",
      priority: "low",
    },
  ];

  const completionRate = 78;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Immunizations Due</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Clinic Completion Rate</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        <div className="space-y-3">
          {dueVaccines.map((vaccine) => (
            <div
              key={vaccine.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Syringe className="size-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{vaccine.vaccine}</p>
                  <p className="text-muted-foreground text-xs">
                    {vaccine.patient}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    vaccine.status === "due" ? "destructive" : "secondary"
                  }
                  className="mb-1"
                >
                  {vaccine.status === "due" ? "Due Soon" : "Upcoming"}
                </Badge>
                <p className="text-muted-foreground text-xs">
                  {vaccine.dueDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
