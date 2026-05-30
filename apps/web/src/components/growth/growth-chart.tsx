// src/components/growth/growth-chart.tsx

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
import { Tabs, TabsList, TabsTrigger } from "@clinic-app/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
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
    date: string;
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

  const { data: patient } = useQuery(
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground">Loading growth chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
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
              <SelectTrigger className="w-[100px]">
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
          onValueChange={(v) => setMeasurementType(v as MeasurementType)}
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
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis
                label={{
                  value: getMeasurementLabel(measurementType),
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => [
                  typeof value === "number"
                    ? value.toFixed(1)
                    : String(value ?? ""),
                  getMeasurementLabel(measurementType),
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={getColor(measurementType)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual"
              />
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
