// src/components/dashboard/recent-activity.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { CalendarCheck, Pill, Syringe, UserPlus } from "lucide-react";

export function RecentActivity() {
  const activities = [
    {
      id: "1",
      type: "patient",
      action: "New patient registered",
      user: "Dr. Sarah Johnson",
      time: "5 minutes ago",
      icon: UserPlus,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      id: "2",
      type: "appointment",
      action: "Appointment completed",
      user: "Emma Thompson",
      time: "1 hour ago",
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      id: "3",
      type: "vaccination",
      action: "Vaccination administered",
      user: "Liam Chen",
      time: "2 hours ago",
      icon: Syringe,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      id: "4",
      type: "prescription",
      action: "Prescription renewed",
      user: "Sophia Rodriguez",
      time: "3 hours ago",
      icon: Pill,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${activity.bg}`}>
                <activity.icon className={`size-4 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.action}</p>
                <p className="text-muted-foreground text-xs">
                  {activity.user} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
