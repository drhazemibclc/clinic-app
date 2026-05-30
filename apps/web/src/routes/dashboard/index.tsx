import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Baby,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Pill,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  // Fix 2.1 — prefetch all three dashboard queries during navigation so the
  // component mounts with data already in cache, eliminating the skeleton flash.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        orpc.dashboard.getDashboardStats.queryOptions(),
      ),
      context.queryClient.prefetchQuery(
        orpc.dashboard.getRecentAppointments.queryOptions({
          input: { limit: 5 },
        }),
      ),
      context.queryClient.prefetchQuery(
        orpc.dashboard.getPatientDemographics.queryOptions(),
      ),
    ]);
  },
});

function DashboardHome() {
  // Fetch dashboard stats from your API
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    orpc.dashboard.getDashboardStats.queryOptions(),
  );

  // Fetch recent appointments
  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery(
    orpc.dashboard.getRecentAppointments.queryOptions({ input: { limit: 5 } }),
  );

  // Fetch patient demographics
  const { data: demographics, isLoading: demographicsLoading } = useQuery(
    orpc.dashboard.getPatientDemographics.queryOptions(),
  );

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const stats = dashboardStats?.overview;
  const todayStats = dashboardStats?.today;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">
          Welcome back, Dr.{" "}
          {dashboardStats?.today.appointmentsList[0]?.doctorName || "User"}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at your pediatric clinic today.
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Patients"
          value={stats?.totalPatients || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Today's Appointments"
          value={todayStats?.appointments || 0}
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          subtext={`${todayStats?.completedAppointments || 0} completed`}
        />
        <MetricCard
          title="Immunizations Due"
          value={stats?.immunizationsDue || 0}
          icon={<Syringe className="h-4 w-4 text-muted-foreground" />}
          trend={stats?.immunizationsTrend || "0%"}
          trendUp={stats?.immunizationsTrend?.startsWith("+")}
        />
        <MetricCard
          title="Active Doctors"
          value={stats?.activeDoctors || 0}
          icon={<Stethoscope className="h-4 w-4 text-muted-foreground" />}
          subtext="On duty today"
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Pending Prescriptions"
          value={stats?.pendingPrescriptionsCount || 0}
          icon={<Pill className="h-4 w-4 text-muted-foreground" />}
          variant="warning"
        />
        <MetricCard
          title="Growth Measurements"
          value={stats?.growthMeasurements || 0}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          trend={stats?.growthTrend || "0%"}
          trendUp={stats?.growthTrend?.startsWith("+")}
        />
        <MetricCard
          title="Low Stock Items"
          value={stats?.lowStockItemsCount || 0}
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          variant="danger"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Today's Appointments - Left Column */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/appointments">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((id) => (
                  <Skeleton key={id} className="h-16 w-full" />
                ))}
              </div>
            ) : recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {apt.time} • Dr. {apt.doctor?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(apt.status ?? "")}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No appointments scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Reminders - Right Column */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Alerts & Reminders</CardTitle>
            <CardDescription>
              Important notifications requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats?.alerts && dashboardStats.alerts.length > 0 ? (
                dashboardStats.alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                  <p>No pending alerts</p>
                  <p className="text-sm">All systems are running smoothly</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics & Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
            <CardDescription>
              Age distribution of active patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demographicsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((id) => (
                  <Skeleton key={id} className="h-8 w-full" />
                ))}
              </div>
            ) : demographics?.ageGroups ? (
              <div className="space-y-4">
                {demographics.ageGroups.map((group) => (
                  <div
                    key={group.age_group}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-sm">
                      {group.age_group} years
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-48 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(group.count / Math.max(...demographics.ageGroups.map((g) => g.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {group.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No demographic data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest clinic activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats?.recentActivity &&
              dashboardStats.recentActivity.length > 0 ? (
                dashboardStats.recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 border-b pb-3 last:border-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {activity.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {activity.user}
                        </span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "warning" | "danger";
}

function MetricCard({
  title,
  value,
  icon,
  subtext,
  trend,
  trendUp,
  variant = "default",
}: MetricCardProps) {
  const variantClasses = {
    default: "border-border",
    warning: "border-yellow-500/50 bg-yellow-500/5",
    danger: "border-red-500/50 bg-red-500/5",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${trendUp ? "text-green-600" : "text-red-600"}`}
            >
              {trendUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="font-bold text-2xl">{value}</p>
          <p className="text-muted-foreground text-sm">{title}</p>
          {subtext && (
            <p className="mt-1 text-muted-foreground text-xs">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: {
    id: string;
    type: "warning" | "error" | "info";
    title: string;
    message: string;
    timestamp: string;
    action?: { label: string; href: string };
  };
}

function AlertItem({ alert }: AlertItemProps) {
  const typeStyles = {
    warning: "border-yellow-500/50 bg-yellow-500/5",
    error: "border-red-500/50 bg-red-500/5",
    info: "border-blue-500/50 bg-blue-500/5",
  };

  const icons = {
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <CheckCircle className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className={`rounded-lg border p-4 ${typeStyles[alert.type]}`}>
      <div className="flex items-start gap-3">
        {icons[alert.type]}
        <div className="flex-1">
          <p className="font-medium">{alert.title}</p>
          <p className="text-muted-foreground text-sm">{alert.message}</p>
          {alert.action && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto px-0"
              asChild
            >
              <Link to={alert.action.href}>{alert.action.label} →</Link>
            </Button>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {formatRelativeTime(alert.timestamp)}
        </span>
      </div>
    </div>
  );
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "SCHEDULED":
    case "CONFIRMED":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive";
    default:
      return "outline";
  }
}

function getActivityIcon(type: string): React.ReactNode {
  switch (type) {
    case "appointment":
      return <CalendarDays className="h-4 w-4 text-primary" />;
    case "patient":
      return <Baby className="h-4 w-4 text-primary" />;
    case "payment":
      return <FileText className="h-4 w-4 text-primary" />;
    case "prescription":
      return <Pill className="h-4 w-4 text-primary" />;
    default:
      return <Activity className="h-4 w-4 text-primary" />;
  }
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffHours < 1) return "Just now";
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
          <Skeleton key={id} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-7">
        <Skeleton className="h-96 lg:col-span-3" />
        <Skeleton className="h-96 lg:col-span-4" />
      </div>
    </div>
  );
}
