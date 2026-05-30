// src/components/growth/growth-summary-card.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface GrowthSummaryCardProps {
  weight: number;
  height: number;
  weightPercentile: number;
  heightPercentile: number;
  trend?: "up" | "down";
}

export function GrowthSummaryCard({
  weight,
  height,
  weightPercentile,
  heightPercentile,
  trend = "up",
}: GrowthSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-sm">
          Latest Measurements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Weight</span>
              <span className="font-bold text-2xl">{weight} kg</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {weightPercentile}th percentile
              </span>
              {trend === "up" ? (
                <TrendingUp className="size-3 text-green-600" />
              ) : (
                <TrendingDown className="size-3 text-red-600" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Height</span>
              <span className="font-bold text-2xl">{height} cm</span>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {heightPercentile}th percentile
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
