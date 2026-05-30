// src/components/well-child/growth-chart.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@clinic-app/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { orpc } from "@/utils/orpc";

interface GrowthChartProps {
  patientId: string;
  data?: {
    date: string | Date;
    value: number;
    zScore?: number;
    percentile?: number;
    ageMonths?: number;
    ageDays?: number;
  }[];
}

type MeasurementType = "WEIGHT" | "HEIGHT" | "BMI" | "HEAD_CIRCUMFERENCE";

export function GrowthChart({ patientId }: GrowthChartProps) {
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("WEIGHT");
  const [timeRange, setTimeRange] = useState<"6m" | "1y" | "2y" | "all">("1y");

  const { data: chartData, isLoading } = useQuery(
    orpc.growth.getGrowthChart.queryOptions({
      input: {
        patientId,
        measurementType,
        fromDate: getDateFromRange(timeRange),
        toDate: new Date(),
      },
    }),
  );

  const { data: patient, isLoading: patientLoading } = useQuery(
    orpc.patient.get.queryOptions({ input: { id: patientId } }),
  );

  const getMeasurementLabel = (type: MeasurementType) => {
    switch (type) {
      case "WEIGHT":
        return "Weight (kg)";
      case "HEIGHT":
        return "Height (cm)";
      case "BMI":
        return "BMI (kg/m²)";
      case "HEAD_CIRCUMFERENCE":
        return "Head Circumference (cm)";
    }
  };

  const getColor = (type: MeasurementType) => {
    switch (type) {
      case "WEIGHT":
        return "#3b82f6";
      case "HEIGHT":
        return "#10b981";
      case "BMI":
        return "#f59e0b";
      case "HEAD_CIRCUMFERENCE":
        return "#8b5cf6";
    }
  };

  const getPercentileReference = () => {
    const percentiles = [
      { value: 97, label: "97th", color: "#ef4444" },
      { value: 85, label: "85th", color: "#f59e0b" },
      { value: 50, label: "50th", color: "#10b981" },
      { value: 15, label: "15th", color: "#f59e0b" },
      { value: 3, label: "3rd", color: "#ef4444" },
    ];
    return percentiles;
  };

  if (isLoading || patientLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-100 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Growth Chart</CardTitle>
            <CardDescription>
              {patient?.firstName} {patient?.lastName} - Growth tracking over
              time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={timeRange}
              onValueChange={(v: "6m" | "1y" | "2y" | "all") => setTimeRange(v)}
            >
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="2y">Last 2 years</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={measurementType}
          onValueChange={(v) =>
            setMeasurementType((v || "WEIGHT") as MeasurementType)
          }
        >
          <TabsList className="mb-4">
            <TabsTrigger value="WEIGHT">Weight</TabsTrigger>
            <TabsTrigger value="HEIGHT">Height</TabsTrigger>
            <TabsTrigger value="BMI">BMI</TabsTrigger>
            <TabsTrigger value="HEAD_CIRCUMFERENCE">
              Head Circumference
            </TabsTrigger>
          </TabsList>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
              />
              <YAxis
                label={{
                  value: getMeasurementLabel(measurementType),
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), "PPP")}
                formatter={(value) => {
                  const numValue =
                    typeof value === "number"
                      ? value
                      : Number.parseFloat(String(value));
                  const formattedValue = !Number.isNaN(numValue)
                    ? numValue.toFixed(1)
                    : value;
                  return [
                    formattedValue as string,
                    getMeasurementLabel(measurementType),
                  ];
                }}
              />
              <Legend />

              {/* Percentile reference lines */}
              {getPercentileReference().map((p) => (
                <Line
                  key={p.value}
                  type="monotone"
                  dataKey={`percentile_${p.value}`}
                  stroke={p.color}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name={`${p.label} Percentile`}
                />
              ))}

              {/* Actual measurements */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={getColor(measurementType)}
                strokeWidth={3}
                dot={{ r: 5, fill: getColor(measurementType) }}
                activeDot={{ r: 7 }}
                name="Actual Measurement"
              />

              {/* Z-Score line (optional) */}
              {chartData?.[0]?.zScore && (
                <Line
                  type="monotone"
                  dataKey="zScore"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Z-Score"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Tabs>

        {/* Growth summary stats */}
        {chartData && chartData.length > 0 && (
          <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">First Measurement</p>
              <p className="font-semibold">
                {chartData[0]?.date
                  ? format(new Date(chartData[0].date), "MMM dd, yyyy")
                  : "—"}
              </p>
              <p className="font-bold text-2xl">
                {chartData[0]?.value?.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Latest Measurement
              </p>
              <p className="font-semibold">
                {chartData[chartData.length - 1]?.date
                  ? format(
                      new Date(chartData[chartData.length - 1].date),
                      "MMM dd, yyyy",
                    )
                  : "—"}
              </p>
              <p className="font-bold text-2xl">
                {chartData[chartData.length - 1]?.value?.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Gain</p>
              <p className="font-bold text-2xl text-green-600">
                +
                {(
                  (chartData[chartData.length - 1]?.value ?? 0) -
                  (chartData[0]?.value ?? 0)
                )?.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Average Growth Rate
              </p>
              <p className="font-bold text-2xl">
                {(
                  ((chartData[chartData.length - 1]?.value ?? 0) -
                    (chartData[0]?.value ?? 0)) /
                  (chartData.length || 1)
                ).toFixed(1)}{" "}
                / month
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getDateFromRange(range: "6m" | "1y" | "2y" | "all"): Date | undefined {
  const date = new Date();
  switch (range) {
    case "6m":
      date.setMonth(date.getMonth() - 6);
      return date;
    case "1y":
      date.setFullYear(date.getFullYear() - 1);
      return date;
    case "2y":
      date.setFullYear(date.getFullYear() - 2);
      return date;
    default:
      return undefined;
  }
}
