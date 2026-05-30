// src/components/dashboard/dashboard-overview.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardOverviewProps {
  data?: {
    monthlyData?: Array<{ month: string; appointments: number }>;
    appointmentCounts?: {
      SCHEDULED: number;
      COMPLETED: number;
      CANCELLED: number;
      PENDING: number;
    };
  };
  loading?: boolean;
}

export function DashboardOverview({ data, loading }: DashboardOverviewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75 animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.monthlyData || [
    { month: "Jan", appointments: 65 },
    { month: "Feb", appointments: 78 },
    { month: "Mar", appointments: 82 },
    { month: "Apr", appointments: 91 },
    { month: "May", appointments: 88 },
    { month: "Jun", appointments: 95 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="colorAppointments"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorAppointments)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
