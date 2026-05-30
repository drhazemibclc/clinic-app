// src/components/nutrition/feeding-history.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { format } from "date-fns";
import { Baby, Clock, Droplet, Milk, Utensils, Waves } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FeedingRecord {
  id: string;
  feedingTime: Date;
  feedingType: "breastfeeding" | "formula" | "solid" | "mixed";
  duration?: number;
  amount?: number;
  foodType?: string;
  notes?: string;
}

interface FeedingHistoryProps {
  data?: FeedingRecord[];
  loading?: boolean;
}

function getFeedingIcon(type: string) {
  switch (type) {
    case "breastfeeding":
      return <Milk className="h-4 w-4 text-pink-500" />;
    case "formula":
      return <Droplet className="h-4 w-4 text-blue-500" />;
    case "solid":
      return <Utensils className="h-4 w-4 text-orange-500" />;
    case "mixed":
      return <Waves className="h-4 w-4 text-purple-500" />;
    default:
      return <Baby className="h-4 w-4 text-gray-500" />;
  }
}

function getFeedingLabel(type: string) {
  switch (type) {
    case "breastfeeding":
      return "Breastfeeding";
    case "formula":
      return "Formula";
    case "solid":
      return "Solid Foods";
    case "mixed":
      return "Mixed Feeding";
    default:
      return type;
  }
}

function getFeedingDetails(record: FeedingRecord) {
  switch (record.feedingType) {
    case "breastfeeding":
      return `${record.duration || 0} min`;
    case "formula":
      return `${record.amount || 0} mL`;
    case "solid":
      return record.foodType || "Solid foods";
    case "mixed":
      return `${record.duration || 0} min + ${record.amount || 0} mL`;
    default:
      return "";
  }
}

export function FeedingHistory({ data, loading }: FeedingHistoryProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading feeding history...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center">
        <Baby className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No feeding logs recorded yet</p>
        <p className="text-muted-foreground text-sm">
          Click "Log Feeding" to start tracking
        </p>
      </div>
    );
  }

  // Calculate daily feeding stats for chart
  const dailyStats = data.reduce(
    (acc, record) => {
      const date = format(new Date(record.feedingTime), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = {
          date,
          breastfeedings: 0,
          formulaAmount: 0,
          solidFeedings: 0,
        };
      }

      if (record.feedingType === "breastfeeding") {
        acc[date].breastfeedings++;
      } else if (record.feedingType === "formula") {
        acc[date].formulaAmount += record.amount || 0;
      } else if (record.feedingType === "solid") {
        acc[date].solidFeedings++;
      }

      return acc;
    },
    {} as Record<
      string,
      {
        date: string;
        breastfeedings: number;
        formulaAmount: number;
        solidFeedings: number;
      }
    >,
  );

  const chartData = Object.values(dailyStats).slice(-14); // Last 14 days

  // Calculate today's stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayFeedings = data.filter(
    (record) => format(new Date(record.feedingTime), "yyyy-MM-dd") === today,
  );

  const todayStats = {
    totalFeedings: todayFeedings.length,
    breastfeedings: todayFeedings.filter(
      (r) => r.feedingType === "breastfeeding",
    ).length,
    formulaAmount: todayFeedings
      .filter((r) => r.feedingType === "formula")
      .reduce((sum, r) => sum + (r.amount || 0), 0),
    solidFeedings: todayFeedings.filter((r) => r.feedingType === "solid")
      .length,
  };

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Baby className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <div className="font-bold text-2xl">
                {todayStats.totalFeedings}
              </div>
              <p className="text-muted-foreground text-sm">
                Total Feedings Today
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Milk className="mx-auto mb-2 h-6 w-6 text-pink-500" />
              <div className="font-bold text-2xl">
                {todayStats.breastfeedings}
              </div>
              <p className="text-muted-foreground text-sm">
                Breastfeeding Sessions
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Droplet className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <div className="font-bold text-2xl">
                {todayStats.formulaAmount} mL
              </div>
              <p className="text-muted-foreground text-sm">Formula Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Utensils className="mx-auto mb-2 h-6 w-6 text-orange-500" />
              <div className="font-bold text-2xl">
                {todayStats.solidFeedings}
              </div>
              <p className="text-muted-foreground text-sm">Solid Food Meals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Feeding Trends (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MM/dd")}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "MMM dd, yyyy")
                  }
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="breastfeedings"
                  stroke="#ec4899"
                  fill="#fbcfe8"
                  name="Breastfeedings"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="solidFeedings"
                  stroke="#f97316"
                  fill="#fed7aa"
                  name="Solid Meals"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="formulaAmount"
                  stroke="#3b82f6"
                  fill="#bfdbfe"
                  name="Formula (mL)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Feeding History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feeding History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data
              .sort(
                (a, b) =>
                  new Date(b.feedingTime).getTime() -
                  new Date(a.feedingTime).getTime(),
              )
              .slice(0, 20)
              .map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      {getFeedingIcon(record.feedingType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getFeedingLabel(record.feedingType)}
                        </Badge>
                        <span className="text-muted-foreground text-sm">
                          {getFeedingDetails(record)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {format(new Date(record.feedingTime), "h:mm a")}
                      </p>
                      {record.notes && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground text-xs">
                    {format(new Date(record.feedingTime), "MMM dd, yyyy")}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
