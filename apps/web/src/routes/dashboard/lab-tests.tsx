// src/routes/dashboard/lab-tests.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { DataTable } from "@clinic-app/ui/components/data-table/DataTable";
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
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FlaskConical,
  Plus,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { columns, type LabTest } from "@/components/labs/columns";
import { LabOrderForm } from "@/components/labs/lab-order-form";
import { LabResultUpload } from "@/components/labs/lab-result-upload";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/lab-tests")({
  component: LabTestsPage,
});

function LabTestsPage() {
  const queryClient = useQueryClient();
  // Fix 1.5 — guard the query with a selected patient; empty patientId would
  // return all records or error depending on the backend.
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { data: rawLabTests, isLoading } = useQuery({
    ...orpc.labTests.listByPatient.queryOptions({
      input: { patientId: selectedPatient ?? "" },
    }),
    enabled: !!selectedPatient,
  });

  const orderLabTest = useMutation(
    orpc.labTests.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["labs"] });
      },
    }),
  );

  const uploadResult = useMutation(
    orpc.labTests.updateResults.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["labs"] });
      },
    }),
  );

  // Cast once at the boundary between the API type and the UI LabTest type.
  // TODO: align LabTestSchema in labTest.server.ts with the LabTest UI type
  // (lowercase status union, nested result object) so this cast can be removed.
  const labTests = useMemo(
    () => (rawLabTests as unknown as LabTest[]) ?? [],
    [rawLabTests],
  );

  const pendingTests = useMemo(
    () => labTests.filter((t) => t.status?.toLowerCase() === "pending"),
    [labTests],
  );

  const completedTests = useMemo(
    () => labTests.filter((t) => t.status?.toLowerCase() === "completed"),
    [labTests],
  );

  const stats = useMemo(
    () => ({
      pending: pendingTests.length,
      completed: completedTests.length,
      abnormal: labTests.filter((t) => t.result?.abnormal).length,
      critical: labTests.filter((t) => t.result?.critical).length,
    }),
    [labTests, pendingTests, completedTests],
  );

  return (
    <div className="flex-1 space-y-6 p-6 pt-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Lab Tests</h1>
          <p className="text-muted-foreground">
            Order and track laboratory investigations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Results
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Lab Results</DialogTitle>
              </DialogHeader>
              <LabResultUpload
                onSubmit={(data) =>
                  uploadResult.mutate({
                    id: data.labTestId,
                    result: `${data.resultValue} ${data.unit} (${data.referenceRange}) - ${data.interpretation}`,
                    status: "COMPLETED",
                    notes: data.notes,
                  })
                }
                isLoading={uploadResult.isPending}
                labTests={pendingTests}
              />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Order Lab
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Laboratory Test</DialogTitle>
              </DialogHeader>
              <LabOrderForm
                onSubmit={(data) =>
                  orderLabTest.mutate({
                    patientId: data.patientId,
                    recordId: "",
                    serviceId: "",
                    testDate: data.orderedDate,
                    result: "",
                    status: "PENDING",
                    notes: data.notes,
                  })
                }
                isLoading={orderLabTest.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Patient selector — required before any data loads */}
      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientSelector
            value={selectedPatient}
            onChange={setSelectedPatient}
          />
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Pending Results
                </CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.pending}</div>
                <p className="text-muted-foreground text-xs">
                  Awaiting results
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.completed}</div>
                <p className="text-muted-foreground text-xs">
                  Results available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Abnormal Results
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-yellow-600">
                  {stats.abnormal}
                </div>
                <p className="text-muted-foreground text-xs">
                  Outside reference range
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Critical Values
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-red-600">
                  {stats.critical}
                </div>
                <p className="text-muted-foreground text-xs">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lab Tests Table */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Tests</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Lab Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns}
                    data={labTests}
                    loading={isLoading}
                    searchColumn="testName"
                    searchPlaceholder="Search by test name..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Lab Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns}
                    data={pendingTests}
                    loading={isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Lab Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns}
                    data={completedTests}
                    loading={isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Inline patient selector — fetches a small list to populate the dropdown.
// Replace with a combobox + server-side search when the patient list grows large.
function PatientSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: patients } = useQuery(
    orpc.patient.list.queryOptions({ input: { limit: 100 } }),
  );

  return (
    <select
      className="w-full rounded-md border p-2"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Choose a patient...</option>
      {patients?.patients.map((p) => (
        <option key={p.id} value={p.id}>
          {p.firstName} {p.lastName}
        </option>
      ))}
    </select>
  );
}
