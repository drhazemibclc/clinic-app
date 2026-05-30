// app/routes/dashboard/calendar.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: events } = useQuery(
    orpc.calendar.getEvents.queryOptions({
      start: currentDate.toISOString(),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      ).toISOString(),
    }),
  );

  const calendarEvents = events?.map((event) => ({
    id: event.id,
    title: `${event.patientName} - ${event.type}`,
    start: event.startTime,
    end: event.endTime,
    backgroundColor: event.type === "well-child" ? "#10b981" : "#3b82f6",
    extendedProps: {
      patientId: event.patientId,
      type: event.type,
      notes: event.notes,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Clinic Calendar</h1>
          <p className="text-muted-foreground">View and manage your schedule</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Fix 2.5 — never mutate the existing Date object in place.
              currentDate.setMonth() mutates the object before new Date() wraps it,
              which can cause stale-reference bugs. Always clone first. */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const prev = new Date(currentDate);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentDate(prev);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const next = new Date(currentDate);
              next.setMonth(next.getMonth() + 1);
              setCurrentDate(next);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                initialView="dayGridMonth"
                events={calendarEvents}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="18:00:00"
                allDaySlot={false}
                nowIndicator
                editable
                selectable
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-medium text-sm">
                Upcoming Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  ?.filter(
                    (e) =>
                      new Date(e.startTime).toDateString() ===
                      new Date().toDateString(),
                  )
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full ${event.type === "well-child" ? "bg-green-500" : "bg-blue-500"}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {event.patientName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(event.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {event.type === "well-child"
                            ? "Well-Child Visit"
                            : "Sick Visit"}
                        </p>
                      </div>
                    </div>
                  ))}
                {(!events ||
                  events.filter(
                    (e) =>
                      new Date(e.startTime).toDateString() ===
                      new Date().toDateString(),
                  ).length === 0) && (
                  <p className="text-center text-muted-foreground text-sm">
                    No appointments today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-medium text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Well-Child Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Sick Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Follow-up</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Immunization</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
