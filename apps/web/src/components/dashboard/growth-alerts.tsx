// src/components/dashboard/growth-alerts.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export function GrowthAlerts() {
  const alerts = [
    {
      id: "1",
      patient: "Emma Thompson",
      metric: "Weight",
      value: "15th percentile",
      trend: "down",
      severity: "warning",
      recommendation: "Monitor nutrition intake",
    },
    {
      id: "2",
      patient: "Liam Chen",
      metric: "Height",
      value: "90th percentile",
      trend: "up",
      severity: "info",
      recommendation: "Continue current growth pattern",
    },
    {
      id: "3",
      patient: "Sophia Rodriguez",
      metric: "Head Circumference",
      value: "5th percentile",
      trend: "down",
      severity: "critical",
      recommendation: "Schedule follow-up assessment",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${
                alert.severity === "critical"
                  ? "border-red-200 bg-red-50"
                  : alert.severity === "warning"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`mt-0.5 size-4 ${
                    alert.severity === "critical"
                      ? "text-red-600"
                      : alert.severity === "warning"
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{alert.patient}</p>
                    <div className="flex items-center gap-1">
                      {alert.trend === "up" ? (
                        <TrendingUp className="size-3 text-green-600" />
                      ) : (
                        <TrendingDown className="size-3 text-red-600" />
                      )}
                      <span className="text-xs">{alert.value}</span>
                    </div>
                  </div>
                  <p className="text-xs">
                    <span className="font-medium">{alert.metric}:</span>{" "}
                    {alert.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
