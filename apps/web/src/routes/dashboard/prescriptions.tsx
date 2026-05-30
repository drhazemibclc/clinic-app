// src/routes/dashboard/prescriptions.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clinic-app/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarClock, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { columns, type Prescription } from "@/components/prescriptions/columns";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { PrescriptionTable } from "@/components/prescriptions/prescription-table";
import { orpc } from "@/utils/orpc";

// Type for prescription statistics
interface PrescriptionStats {
  active: number;
  expiring: number;
  refillRequests: number;
}

export const Route = createFileRoute("/dashboard/prescriptions")({
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "completed" | "expired"
  >("all");

  const { data: prescriptions, isLoading } = useQuery(
    orpc.prescriptions.list.queryOptions({
      input: { patientId: "", includeExpired: true },
    }),
  );

  const updateStatus = useMutation(
    orpc.prescriptions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.prescriptions.key() });
      },
    }),
  );

  // Fix 3.2 — memoize all derived data so filters only recompute when
  // prescriptions or activeTab actually change, not on every render.
  const typedPrescriptions = useMemo(
    () => (prescriptions ?? []) as Prescription[],
    [prescriptions],
  );

  const stats = useMemo<PrescriptionStats>(
    () => ({
      active: typedPrescriptions.filter((p) => p.status === "active").length,
      expiring: typedPrescriptions.filter((p) => {
        if (!p.endDate || p.status !== "active") return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length,
      refillRequests: typedPrescriptions.filter((p) => {
        const hasRefills = p.items?.some(
          (item) => (item.refillsRemaining ?? 0) > 0,
        );
        return hasRefills && p.status === "active";
      }).length,
    }),
    [typedPrescriptions],
  );

  const filteredData = useMemo<Prescription[]>(() => {
    switch (activeTab) {
      case "active":
        return typedPrescriptions.filter((p) => p.status === "active");
      case "completed":
        return typedPrescriptions.filter((p) => p.status === "completed");
      case "expired":
        return typedPrescriptions.filter((p) => p.status === "expired");
      default:
        return typedPrescriptions;
    }
  }, [typedPrescriptions, activeTab]);

  const handlePrescriptionSuccess = () => {
    setIsDialogOpen(false);
  };

  const handleStatusUpdate = async (
    id: string,
    status: Prescription["status"],
  ) => {
    await updateStatus.mutateAsync({ prescriptionId: id, status });
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Prescriptions</h2>
          <p className="text-muted-foreground">
            Manage and track medication prescriptions for your patients
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
            </DialogHeader>
            <PrescriptionForm onSuccess={handlePrescriptionSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Active Prescriptions
            </CardTitle>
            <Activity className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.active}</div>
            <p className="text-muted-foreground text-xs">
              Currently active prescriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Expiring Soon</CardTitle>
            <CalendarClock className="size-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.expiring}</div>
            <p className="text-muted-foreground text-xs">
              Expiring within 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Refill Requests
            </CardTitle>
            <RefreshCw className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.refillRequests}</div>
            <p className="text-muted-foreground text-xs">
              Prescriptions eligible for refill
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prescription History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <PrescriptionTable
                data={filteredData}
                columns={columns}
                loading={isLoading}
                onStatusUpdate={handleStatusUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
