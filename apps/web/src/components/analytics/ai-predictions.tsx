// src/components/analytics/ai-predictions.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Brain, Calendar, TrendingUp, Users } from "lucide-react";

interface AIPredictionsProps {
  predictions?: {
    patientGrowth: number;
    appointmentDemand: number;
    revenueForecast: number;
    riskAlerts: string[];
  };
}

export function AIPredictions({ predictions }: AIPredictionsProps) {
  const mockPredictions = {
    patientGrowth: 23,
    appointmentDemand: 18,
    revenueForecast: 15,
    riskAlerts: [
      "High no-show probability for tomorrow's appointments",
      "Immunization compliance dropping in 2-5 year olds",
      "Seasonal flu cases expected to increase",
    ],
  };

  const data = predictions || mockPredictions;

  return (
    <Card className="bg-linear-to-r from-blue-600 to-purple-600 text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="size-5" />
          <CardTitle className="text-white">
            AI Predictions & Insights
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
              <Users className="size-4" />
              Patient Growth
            </div>
            <div className="flex items-end gap-2">
              <span className="font-bold text-3xl">+{data.patientGrowth}%</span>
              <span className="mb-1 text-sm opacity-90">next quarter</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="size-4" />
              <span>Above industry average</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
              <Calendar className="size-4" />
              Appointment Demand
            </div>
            <div className="flex items-end gap-2">
              <span className="font-bold text-3xl">
                +{data.appointmentDemand}%
              </span>
              <span className="mb-1 text-sm opacity-90">expected</span>
            </div>
            <div className="mt-2 text-sm">Peak hours: 9-11 AM</div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
              <TrendingUp className="size-4" />
              Revenue Forecast
            </div>
            <div className="flex items-end gap-2">
              <span className="font-bold text-3xl">
                +{data.revenueForecast}%
              </span>
              <span className="mb-1 text-sm opacity-90">this month</span>
            </div>
            <div className="mt-2 text-sm">Based on current trends</div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white/10 p-4">
          <h4 className="mb-2 font-semibold">Risk Alerts & Recommendations</h4>
          <ul className="space-y-1 text-sm">
            {data.riskAlerts.map((alert) => (
              <li key={alert.toString()} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-yellow-400" />
                {alert}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
