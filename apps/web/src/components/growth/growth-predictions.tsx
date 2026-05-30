// src/components/growth/growth-predictions.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import { useQuery } from "@tanstack/react-query";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { orpc } from "../../utils/orpc";

interface GrowthPredictionsProps {
  patientId: string;
}

type PercentileRecord = {
  date: Date;
  weight?: number | null;
  height?: number | null;
  headCircumference?: number | null;
  bmi?: number | null;
  weightForAgeZ?: number | null;
  heightForAgeZ?: number | null;
  bmiForAgeZ?: number | null;
  ageDays?: number | null;
  ageMonths?: number | null;
  percentile?: number | null;
};

function classifyZScore(z: number | null | undefined): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  if (z == null) return { label: "No data", variant: "secondary" };
  if (z < -3) return { label: "Severely low", variant: "destructive" };
  if (z < -2) return { label: "Low", variant: "destructive" };
  if (z <= 1) return { label: "Normal", variant: "default" };
  if (z <= 2) return { label: "High", variant: "outline" };
  return { label: "Very high", variant: "destructive" };
}

function ZScoreRow({
  label,
  z,
}: {
  label: string;
  z: number | null | undefined;
}) {
  const { label: statusLabel, variant } = classifyZScore(z);
  const pct = z != null ? Math.min(100, Math.max(0, ((z + 3) / 6) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {z != null && (
            <span className="font-mono text-xs">
              Z = {z > 0 ? "+" : ""}
              {z.toFixed(2)}
            </span>
          )}
          <Badge variant={variant}>{statusLabel}</Badge>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

export function GrowthPredictions({ patientId }: GrowthPredictionsProps) {
  const { data, isLoading } = useQuery(
    orpc.growth.getAnalytics.queryOptions({ input: { patientId } }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Activity className="size-8 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Loading growth analytics…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const records = data?.analytics as PercentileRecord[] | null | undefined;

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 flex-col items-center justify-center gap-3">
          <Activity className="size-10 text-muted-foreground" />
          <p className="text-center text-muted-foreground text-sm">
            No growth records found.
            <br />
            Record at least one measurement to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort ascending for chart
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const latest = sorted[sorted.length - 1] ?? "";
  const first = sorted[0] ?? "";

  // Compute simple velocity (kg/month, cm/month) between first and last
  const daysDiff = Math.max(
    1,
    (new Date(latest.date).getTime() - new Date(first.date).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const monthsDiff = daysDiff / 30.44;

  const weightVelocity =
    first.weight != null && latest.weight != null
      ? ((latest.weight - first.weight) / monthsDiff).toFixed(2)
      : null;

  const heightVelocity =
    first.height != null && latest.height != null
      ? ((latest.height - first.height) / monthsDiff).toFixed(2)
      : null;

  // Chart data
  const chartData = sorted.map((r) => ({
    date: new Date(r.date).toLocaleDateString(),
    weight: r.weight ?? null,
    height: r.height ?? null,
    headCircumference: r.headCircumference ?? null,
    bmi: r.bmi != null ? Number(Number(r.bmi).toFixed(1)) : null,
    percentile: r.percentile ?? null,
  }));

  // Percentile distribution
  const withPercentile = records.filter((r) => r.percentile != null);
  const avgPercentile =
    withPercentile.length > 0
      ? withPercentile.reduce((s, r) => s + (r.percentile ?? 0), 0) /
        withPercentile.length
      : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{records.length}</p>
            <p className="text-muted-foreground text-xs">total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Weight velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightVelocity != null ? (
              <div className="flex items-center gap-1">
                {Number(weightVelocity) >= 0 ? (
                  <TrendingUp className="size-4 text-green-500" />
                ) : (
                  <TrendingDown className="size-4 text-red-500" />
                )}
                <p className="font-bold text-2xl">{weightVelocity}</p>
                <p className="self-end pb-0.5 text-muted-foreground text-xs">
                  kg/mo
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Height velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heightVelocity != null ? (
              <div className="flex items-center gap-1">
                {Number(heightVelocity) >= 0 ? (
                  <TrendingUp className="size-4 text-green-500" />
                ) : (
                  <TrendingDown className="size-4 text-red-500" />
                )}
                <p className="font-bold text-2xl">{heightVelocity}</p>
                <p className="self-end pb-0.5 text-muted-foreground text-xs">
                  cm/mo
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Avg. percentile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {avgPercentile != null ? (
              <>
                <p className="font-bold text-2xl">
                  {avgPercentile.toFixed(0)}
                  <span className="font-normal text-base">th</span>
                </p>
                <Progress value={avgPercentile} className="mt-1 h-1.5" />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trend</CardTitle>
          <CardDescription>
            Weight and height over {records.length} measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="weight"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Weight (kg)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <YAxis
                yAxisId="height"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Height (cm)",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                formatter={(
                  value: ValueType | undefined,
                  name: NameType | undefined,
                ): [string, string] => [
                  typeof value === "number"
                    ? value.toFixed(1)
                    : String(value ?? "—"),
                  String(name ?? ""),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                fill="#3b82f6"
                fillOpacity={0.15}
                stroke="#3b82f6"
                strokeWidth={2}
                name="Weight (kg)"
                dot={{ r: 3 }}
                connectNulls
              />
              <Area
                yAxisId="height"
                type="monotone"
                dataKey="height"
                fill="#10b981"
                fillOpacity={0.15}
                stroke="#10b981"
                strokeWidth={2}
                name="Height (cm)"
                dot={{ r: 3 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Latest Z-scores */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Z-Score Classification</CardTitle>
          <CardDescription>
            Based on most recent measurement —{" "}
            {new Date(latest.date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ZScoreRow label="Weight-for-age" z={latest.weightForAgeZ} />
          <ZScoreRow label="Height-for-age" z={latest.heightForAgeZ} />
          <ZScoreRow label="BMI-for-age" z={latest.bmiForAgeZ} />
        </CardContent>
      </Card>

      {/* Percentile history */}
      {withPercentile.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Percentile History</CardTitle>
            <CardDescription>
              BMI percentile at each recorded measurement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={chartData}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="pct"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Percentile",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                  }}
                />
                <Tooltip
                  formatter={(
                    value: ValueType | undefined,
                  ): [string, string] => [
                    `${typeof value === "number" ? value.toFixed(0) : "—"}th`,
                    "Percentile",
                  ]}
                />
                <Area
                  yAxisId="pct"
                  type="monotone"
                  dataKey="percentile"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Percentile"
                  dot={{ r: 3 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-center text-muted-foreground text-xs">
        Growth analytics are based on recorded measurements and WHO reference
        standards. Always combine with clinical assessment.
      </p>
    </div>
  );
}
