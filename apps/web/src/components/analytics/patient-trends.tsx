// src/components/analytics/patient-trends.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
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

interface PatientTrendsProps {
  data?: {
    newPatients: Array<{ month: string; count: number }>;
    activePatients: Array<{ month: string; count: number }>;
  };
  loading?: boolean;
}

export function PatientTrends({ data, loading }: PatientTrendsProps) {
  const mockData = [
    { month: "Jan", new: 45, active: 320 },
    { month: "Feb", new: 52, active: 345 },
    { month: "Mar", new: 48, active: 368 },
    { month: "Apr", new: 61, active: 392 },
    { month: "May", new: 58, active: 415 },
    { month: "Jun", new: 72, active: 445 },
  ];

  const chartData =
    data?.newPatients?.map((item, index) => ({
      month: item.month,
      new: item.count,
      active: data.activePatients?.[index]?.count || 0,
    })) || mockData;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Growth Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="new"
              stroke="#3b82f6"
              strokeWidth={2}
              name="New Patients"
            />
            <Line
              type="monotone"
              dataKey="active"
              stroke="#10b981"
              strokeWidth={2}
              name="Active Patients"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
