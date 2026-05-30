// src/components/dashboard/vital-stats.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Activity,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

interface VitalStatsProps {
  data?: {
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    growthRate: number;
    activeDoctors: number;
    occupancyRate: number;
  };
  loading?: boolean;
}

export function VitalStats({ data, loading }: VitalStatsProps) {
  const stats = [
    {
      title: "Total Patients",
      value: data?.totalPatients?.toLocaleString() || "1,234",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Appointments",
      value: data?.totalAppointments?.toLocaleString() || "856",
      change: "+8%",
      trend: "up",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Revenue",
      value: `$${data?.totalRevenue?.toLocaleString() || "45,231"}`,
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Growth Rate",
      value: `${data?.growthRate || 15.3}%`,
      change: "+5.2%",
      trend: "up",
      icon: Activity,
      color: "text-yellow-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_) => (
          <Card key={_.toString()} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-gray-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
            <stat.icon className={`size-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs">
              {stat.trend === "up" ? (
                <TrendingUp className="size-3 text-green-600" />
              ) : (
                <TrendingDown className="size-3 text-red-600" />
              )}
              <span
                className={
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
