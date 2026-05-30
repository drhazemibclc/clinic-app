// app/routes/dashboard/staff.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { DataTable } from "@clinic-app/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { columns } from "@/components/staff/staff-columns";
import { StaffForm } from "@/components/staff/staff-form";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/staff")({
  component: StaffPage,
  beforeLoad: async ({ context }) => {
    const session = context.session;
    if (session?.user?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function StaffPage() {
  const queryClient = useQueryClient();
  const { data: staff, isLoading } = useQuery(orpc.staff.list.queryOptions());

  const addStaff = useMutation({
    mutationFn: orpc.staff.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Clinic Staff</h1>
          <p className="text-muted-foreground">
            Manage nurses, admin, and support personnel
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <StaffForm onSubmit={addStaff.mutate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{staff?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">On Duty Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{staff?.onDutyToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{staff?.onLeave || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {staff?.departmentCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={staff?.items || []}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
