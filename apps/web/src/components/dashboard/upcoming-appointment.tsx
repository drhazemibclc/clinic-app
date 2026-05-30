// src/components/dashboard/upcoming-appointments.tsx

import { Avatar, AvatarFallback } from "@clinic-app/ui/components/avatar";
import { Badge } from "@clinic-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Clock, MapPin } from "lucide-react";

interface UpcomingAppointmentsProps {
  appointments?: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    time: string;
    type: string;
    status: string;
  }>;
  loading?: boolean;
}

export function UpcomingAppointments({
  appointments,
  loading,
}: UpcomingAppointmentsProps) {
  const mockAppointments = [
    {
      id: "1",
      patientName: "Emma Thompson",
      doctorName: "Dr. Sarah Johnson",
      appointmentDate: "2024-03-20",
      time: "09:00 AM",
      type: "Wellness Check",
      status: "CONFIRMED",
    },
    {
      id: "2",
      patientName: "Liam Chen",
      doctorName: "Dr. Michael Chen",
      appointmentDate: "2024-03-20",
      time: "10:30 AM",
      type: "Vaccination",
      status: "CONFIRMED",
    },
    {
      id: "3",
      patientName: "Sophia Rodriguez",
      doctorName: "Dr. Emily Rodriguez",
      appointmentDate: "2024-03-20",
      time: "01:00 PM",
      type: "Follow-up",
      status: "PENDING",
    },
  ];

  const displayAppointments = appointments || mockAppointments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_) => (
              <div key={_.toString()} className="flex items-center gap-4">
                <div className="size-10 animate-pulse rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center gap-4 rounded-lg border p-3 transition hover:bg-gray-50"
              >
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {appointment.patientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{appointment.patientName}</p>
                    <Badge
                      variant={
                        appointment.status === "CONFIRMED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    with {appointment.doctorName}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {appointment.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {appointment.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
