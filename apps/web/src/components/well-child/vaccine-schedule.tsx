// src/components/well-child/vaccine-schedule.tsx

import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { Progress } from "@clinic-app/ui/components/progress";
import { Skeleton } from "@clinic-app/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Syringe,
} from "lucide-react";
import { orpc } from "@/utils/orpc";

interface VaccineScheduleProps {
  patientId: string;
}
interface AdministeredRecord {
  date: string | Date;
  provider?: string;
}

interface VaccineInfo {
  vaccineName: string;
  completedDoses?: number;
  dosesRequired?: number;
  nextDoseNumber?: number;
  ageInDaysMin?: number;
  administeredRecords?: AdministeredRecord[];
  eligibleDate?: string | Date;
}

interface CatchUpDose {
  doseNumber: number;
  recommendedDate: string | Date;
}

interface CatchUpInfo {
  vaccineName: string;
  missingDoses: number;
  priority: string;
  catchUpDoses: CatchUpDose[];
  notes?: string;
}

export function VaccineSchedule({ patientId }: VaccineScheduleProps) {
  const { data: schedule, isLoading } = useQuery(
    orpc.immunizations.getSchedule.queryOptions({ input: { patientId } }),
  );

  const { data: patient } = useQuery(
    orpc.patient.get.queryOptions({ input: { id: patientId } }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const calculateAge = () => {
    if (!patient?.dateOfBirth) return 0;
    const ageInMonths = Math.floor(
      (Date.now() - new Date(patient.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44),
    );
    return ageInMonths;
  };

  const ageInMonths = calculateAge();
  const completionRate = schedule?.summary?.overallCompliance || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Immunization Summary</CardTitle>
          <CardDescription>
            Age: {Math.floor(ageInMonths / 12)} years, {ageInMonths % 12} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-muted-foreground text-sm">Total Due</p>
              <p className="font-bold text-2xl">
                {schedule?.summary?.totalDue || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="font-bold text-2xl text-green-600">
                {schedule?.summary?.totalCompleted || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Overdue</p>
              <p className="font-bold text-2xl text-red-600">
                {schedule?.summary?.totalOverdue || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Upcoming</p>
              <p className="font-bold text-2xl text-blue-600">
                {schedule?.summary?.totalUpcoming || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Compliance Rate</p>
              <p className="font-bold text-2xl">{completionRate}%</p>
              <Progress value={completionRate} className="mt-1 h-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Vaccines */}
      {schedule?.schedule?.due?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Due Now
            </CardTitle>
            <CardDescription>
              Vaccines that should be administered soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.schedule.due.map((vaccine: VaccineInfo) => (
                <VaccineCard
                  key={vaccine.vaccineName}
                  vaccine={vaccine}
                  status="PENDING"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Vaccines */}
      {schedule?.schedule?.overdue?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Overdue Vaccines
            </CardTitle>
            <CardDescription className="text-red-700">
              These vaccines are past their recommended date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.schedule.overdue.map((vaccine: VaccineInfo) => (
                <VaccineCard
                  key={vaccine.vaccineName}
                  vaccine={vaccine}
                  status="OVERDUE"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Vaccines */}
      {schedule?.schedule?.upcoming?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Vaccines
            </CardTitle>
            <CardDescription>
              Vaccines scheduled for future dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.schedule.upcoming.map((vaccine: VaccineInfo) => (
                <VaccineCard
                  key={vaccine.vaccineName}
                  vaccine={vaccine}
                  status="SCHEDULED"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Vaccines */}
      {schedule?.schedule?.completed?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed Vaccines
            </CardTitle>
            <CardDescription>
              Immunizations already administered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.schedule.completed.map((vaccine: VaccineInfo) => (
                <VaccineCard
                  key={vaccine.vaccineName}
                  vaccine={vaccine}
                  status="COMPLETED"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catch-up Schedule */}
      {schedule?.catchUpSchedule?.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Syringe className="h-5 w-5" />
              Catch-up Schedule
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Recommended accelerated schedule for missed vaccines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.catchUpSchedule.map((catchUp: CatchUpInfo) => (
                <div
                  key={catchUp.vaccineName}
                  className="rounded-lg border border-yellow-200 bg-white p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{catchUp.vaccineName}</h3>
                      <p className="text-muted-foreground text-sm">
                        Missing doses: {catchUp.missingDoses}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100">
                      Priority: {catchUp.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">
                      Recommended catch-up schedule:
                    </p>
                    {catchUp.catchUpDoses.map((dose: CatchUpDose) => (
                      <div
                        key={dose.doseNumber}
                        className="flex items-center justify-between rounded-lg bg-yellow-50 p-2 text-sm"
                      >
                        <span>Dose {dose.doseNumber}</span>
                        <span className="font-medium">
                          Due:{" "}
                          {format(
                            new Date(dose.recommendedDate),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-yellow-700">
                    {catchUp.notes}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {schedule?.schedule?.due?.length === 0 &&
        schedule?.schedule?.overdue?.length === 0 &&
        schedule?.schedule?.upcoming?.length === 0 &&
        schedule?.schedule?.completed?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Syringe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No immunization records found
              </p>
              <Button className="mt-4" variant="outline">
                Record First Immunization
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function VaccineCard({
  vaccine,
  status,
}: {
  vaccine: VaccineInfo;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {getStatusIcon(status)}
        <div>
          <p className="font-medium">{vaccine.vaccineName}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {vaccine.dosesRequired && (
              <Badge variant="outline" className="text-xs">
                Doses: {vaccine.completedDoses || 0}/{vaccine.dosesRequired}
              </Badge>
            )}
            {vaccine.nextDoseNumber && (
              <Badge variant="outline" className="text-xs">
                Next dose: Dose {vaccine.nextDoseNumber}
              </Badge>
            )}
            {vaccine.ageInDaysMin && (
              <Badge variant="outline" className="text-xs">
                Eligible at: {Math.floor(vaccine.ageInDaysMin / 30)} months
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {getStatusBadge(status)}
        {vaccine.administeredRecords &&
          vaccine.administeredRecords.length > 0 && (
            <p className="mt-1 text-muted-foreground text-xs">
              Last dose:{" "}
              {format(
                new Date(
                  vaccine.administeredRecords[
                    vaccine.administeredRecords.length - 1
                  ]?.date,
                ),
                "MMM dd, yyyy",
              )}
            </p>
          )}
        {status === "SCHEDULED" && vaccine.eligibleDate && (
          <p className="mt-1 text-muted-foreground text-xs">
            Eligible: {format(new Date(vaccine.eligibleDate), "MMM dd, yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "OVERDUE":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "SCHEDULED":
      return <Calendar className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500">Completed</Badge>;
    case "PENDING":
      return <Badge variant="secondary">Pending</Badge>;
    case "OVERDUE":
      return <Badge variant="destructive">Overdue</Badge>;
    case "SCHEDULED":
      return <Badge variant="outline">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
