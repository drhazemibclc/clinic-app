// src/components/analytics/revenue-analytics.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueAnalyticsProps {
  data?: {
    monthlyRevenue: Array<{ month: string; amount: number }>;
    revenueByService: Array<{ service: string; amount: number }>;
  };
  loading?: boolean;
}

export function RevenueAnalytics({ data, loading }: RevenueAnalyticsProps) {
  const monthlyData = data?.monthlyRevenue || [
    { month: "Jan", amount: 12500 },
    { month: "Feb", amount: 14200 },
    { month: "Mar", amount: 13800 },
    { month: "Apr", amount: 15100 },
    { month: "May", amount: 16800 },
    { month: "Jun", amount: 18200 },
  ];

  const serviceData = data?.revenueByService || [
    { service: "Consultations", amount: 45000 },
    { service: "Vaccinations", amount: 28000 },
    { service: "Lab Tests", amount: 19000 },
    { service: "Follow-ups", amount: 15000 },
    { service: "Telehealth", amount: 8000 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-100 animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="amount"
              >
                {serviceData.map((_, index) => (
                  <Cell
                    key={`cell-${_.toString()}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
