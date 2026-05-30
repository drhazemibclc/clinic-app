// src/components/growth/percentile-calculator.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@clinic-app/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { orpc } from "@/utils/orpc";

interface PercentileCalculatorProps {
  patientId: string;
  data?: {
    ageMonths: number;
    ageDays: number;
    lastMeasurement?: {
      weight?: number;
      height?: number;
      headCircumference?: number;
      bmi?: number;
      date: string | Date;
    };
    classifications: Record<string, unknown>;
    growthVelocity?: Record<string, unknown>;
  };
}

export function PercentileCalculator({ patientId }: PercentileCalculatorProps) {
  const { data: percentileData, isLoading } = useQuery(
    orpc.growth.getGrowthPercentile.queryOptions({ input: { patientId } }),
  );

  const { data: patient } = useQuery(
    orpc.patient.get.queryOptions({ input: { id: patientId } }),
  );

  const getPercentileColor = (percentile: number | null) => {
    if (!percentile) return "bg-gray-500";
    if (percentile < 5) return "bg-red-500";
    if (percentile < 15) return "bg-orange-500";
    if (percentile < 85) return "bg-green-500";
    if (percentile < 95) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "SEVERELY_UNDERWEIGHT":
      case "SEVERELY_STUNTED":
        return <Badge variant="destructive">Severe</Badge>;
      case "UNDERWEIGHT":
      case "STUNTED":
        return <Badge variant="destructive">Below Normal</Badge>;
      case "NORMAL":
        return <Badge variant="default">Normal</Badge>;
      case "OVERWEIGHT":
      case "TALL":
        return <Badge variant="outline">Above Normal</Badge>;
      case "OBESE":
      case "VERY_TALL":
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge variant="secondary">No Data</Badge>;
    }
  };

  const getTrendIcon = (trend?: "up" | "down") => {
    if (trend === "up") return <TrendingUp className="size-4 text-green-600" />;
    if (trend === "down")
      return <TrendingDown className="size-4 text-red-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground">
            Calculating percentiles...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!percentileData || !("classifications" in percentileData)) {
    return (
      <Card>
        <CardContent className="flex h-[400px] flex-col items-center justify-center gap-4">
          <AlertCircle className="size-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            No growth measurements found for this patient.
            <br />
            Please record growth measurements to see percentile calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const velocity = percentileData.growthVelocity;

  const metrics = [
    {
      name: "Weight",
      value: percentileData.lastMeasurement?.weight,
      unit: "kg",
      percentile: percentileData.classifications?.weight?.percentile,
      zScore: percentileData.classifications?.weight?.zScore,
      classification: percentileData.classifications?.weight?.classification,
      trend: "up" as const,
    },
    {
      name: "Height",
      value: percentileData.lastMeasurement?.height,
      unit: "cm",
      zScore: percentileData.classifications?.height?.zScore,
      classification: percentileData.classifications?.height?.classification,
      trend: "up" as const,
    },
    {
      name: "Head Circumference",
      value: percentileData.lastMeasurement?.headCircumference,
      unit: "cm",
      zScore: percentileData.classifications?.headCircumference?.zScore,
      classification:
        percentileData.classifications?.headCircumference?.classification,
      trend: "down" as const,
    },
    {
      name: "BMI",
      value: percentileData.lastMeasurement?.bmi,
      unit: "kg/m²",
      zScore: percentileData.classifications?.bmi?.zScore,
      classification: percentileData.classifications?.bmi?.classification,
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Age Info */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Age: {percentileData.ageMonths} months ({percentileData.ageDays}{" "}
            days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Date of Birth</p>
              <p className="font-medium">
                {patient?.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Measurement</p>
              <p className="font-medium">
                {percentileData.lastMeasurement?.date
                  ? new Date(
                      percentileData.lastMeasurement.date,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WHO Growth Standards */}
      <Card>
        <CardHeader>
          <CardTitle>WHO Growth Standards</CardTitle>
          <CardDescription>
            Percentile rankings based on WHO Child Growth Standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Percentile</TableHead>
                <TableHead>Z-Score</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.name}>
                  <TableCell className="font-medium">{metric.name}</TableCell>
                  <TableCell>
                    {metric.value ? `${metric.value} ${metric.unit}` : "—"}
                  </TableCell>
                  <TableCell>
                    {metric.percentile !== undefined &&
                    metric.percentile !== null ? (
                      <div className="space-y-1">
                        <span className="font-medium">
                          {metric.percentile}th
                        </span>
                        <Progress
                          value={metric.percentile}
                          className={`h-1 ${getPercentileColor(metric.percentile)}`}
                        />
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {metric.zScore !== undefined && metric.zScore !== null
                      ? metric.zScore.toFixed(2)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {getClassificationBadge(metric.classification || "NO_DATA")}
                  </TableCell>
                  <TableCell>{getTrendIcon(metric.trend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Growth Velocity */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Velocity</CardTitle>
          <CardDescription>Rate of change between measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Weight Gain
                </span>
                <TrendingUp className="size-4 text-green-600" />
              </div>
              <div className="font-bold text-2xl">
                {velocity?.weightPerMonth?.toFixed(2) || "—"} kg/month
              </div>
              <p className="text-muted-foreground text-xs">
                Expected: 0.2-0.5 kg/month for age
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Height Growth
                </span>
                <TrendingUp className="size-4 text-green-600" />
              </div>
              <div className="font-bold text-2xl">
                {velocity?.heightPerMonth?.toFixed(2) || "—"} cm/month
              </div>
              <p className="text-muted-foreground text-xs">
                Expected: 0.5-1.0 cm/month for age
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Recommendations */}
      {(percentileData.classifications.weight?.classification !== "NORMAL" ||
        percentileData.classifications.height?.classification !== "NORMAL") && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="size-5" />
              Clinical Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-yellow-800">
              {percentileData.classifications.weight?.classification !==
                "NORMAL" && (
                <li>• Schedule follow-up for weight monitoring in 1-2 weeks</li>
              )}
              {percentileData.classifications.height?.classification !==
                "NORMAL" && (
                <li>
                  • Evaluate nutritional status and consider dietary
                  consultation
                </li>
              )}
              {percentileData.classifications.headCircumference
                ?.classification !== "NORMAL" && (
                <li>• Monitor head circumference growth closely</li>
              )}
              <li>• Review growth chart at next well-child visit</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
