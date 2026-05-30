// app/routes/dashboard/doctors.tsx

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
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { columns } from "@/components/doctors/columns";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/doctors")({
  component: DoctorsPage,
  beforeLoad: async ({ context }) => {
    const session = context.session;
    if (session?.user?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function DoctorsPage() {
  const queryClient = useQueryClient();
  const { data: doctors } = useQuery(
    orpc.doctors.list.queryOptions({ input: { search: "" } }),
  );

  const _addDoctor = useMutation(
    orpc.doctors.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.doctors.key() });
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Medical Team</h1>
          <p className="text-muted-foreground">
            Manage physicians and specialists
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DoctorForm
              onSuccess={() =>
                queryClient.invalidateQueries({ queryKey: orpc.doctors.key() })
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Total Physicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{doctors?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {new Set(doctors?.doctors?.map((d) => d.specialty)).size || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Avg. Rating</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Fix 3.3 — avgRating is not in the API schema; show 0 until the
                backend exposes it. Remove the unsafe cast. */}
            <div className="flex items-center gap-1 font-bold text-2xl">
              0
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={doctors?.doctors ?? []}
            config={{
              searchColumn: "doctor",
              searchPlaceholder: "Search doctors...",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
