// src/components/nutrition/breastfeeding-tracker.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import { format } from "date-fns";
import {
  AlertCircle,
  Baby,
  Calendar,
  CheckCircle,
  Clock,
  Milk,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BreastfeedingRecord {
  id: string;
  patientId: string;
  feedingDate: Date;
  leftDuration?: number;
  rightDuration?: number;
  totalDuration: number;
  notes?: string;
}

interface BreastfeedingStats {
  todayTotal: number;
  weeklyAverage: number;
  totalSessions: number;
  averageDuration: number;
}

interface BreastfeedingTrackerProps {
  patientId: string;
  data?: {
    records: BreastfeedingRecord[];
    stats: BreastfeedingStats;
    weeklyData: Array<{ date: string; duration: number }>;
  };
  loading?: boolean;
}

export function BreastfeedingTracker({
  data,
  loading,
}: BreastfeedingTrackerProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Breastfeeding Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading breastfeeding data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const records = data?.records || [];
  const stats = data?.stats || {
    todayTotal: 0,
    weeklyAverage: 0,
    totalSessions: 0,
    averageDuration: 0,
  };
  const weeklyData = data?.weeklyData || [];

  // Calculate goal progress (assuming 8 sessions per day as target for infants)
  const dailyGoal = 8;
  const todayProgress = Math.min((stats.todayTotal / dailyGoal) * 100, 100);

  const getFeedingTimeOfDay = (date: Date) => {
    const hour = new Date(date).getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Milk className="mx-auto mb-2 h-6 w-6 text-pink-500" />
              <div className="font-bold text-2xl">{stats.todayTotal}</div>
              <p className="text-muted-foreground text-sm">Feedings Today</p>
              <Progress value={todayProgress} className="mt-2 h-1" />
              <p className="mt-1 text-muted-foreground text-xs">
                Goal: {dailyGoal} feedings/day
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <div className="font-bold text-2xl">
                {stats.averageDuration || 0} min
              </div>
              <p className="text-muted-foreground text-sm">Avg. Duration</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="font-bold text-2xl">
                {stats.weeklyAverage || 0}
              </div>
              <p className="text-muted-foreground text-sm">
                Daily Avg (7 days)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Baby className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="font-bold text-2xl">
                {stats.totalSessions || 0}
              </div>
              <p className="text-muted-foreground text-sm">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Feeding Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "EEE")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "MMM dd, yyyy")
                  }
                  formatter={(value) => [`${value} min`, "Total Duration"]}
                />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stroke="#ec4899"
                  fill="#fbcfe8"
                  name="Feeding Duration"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Feeding Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Feeding Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center">
              <Milk className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No breastfeeding records yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                      <Milk className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getFeedingTimeOfDay(record.feedingDate)}
                        </Badge>
                        <span className="font-medium">
                          {record.totalDuration} minutes
                        </span>
                      </div>
                      <div className="flex gap-3 text-muted-foreground text-sm">
                        {record.leftDuration !== undefined && (
                          <span>Left: {record.leftDuration} min</span>
                        )}
                        {record.rightDuration !== undefined && (
                          <span>Right: {record.rightDuration} min</span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.feedingDate), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      {format(new Date(record.feedingDate), "h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-pink-200 bg-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-pink-800">
            <AlertCircle className="h-5 w-5" />
            Breastfeeding Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-pink-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Aim for 8-12 feedings per day for newborns</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Watch for hunger cues like rooting or sucking on hands
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Alternate which breast you start with each feeding</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Track wet and dirty diapers - 6+ per day indicates good intake
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
