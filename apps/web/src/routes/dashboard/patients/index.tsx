// app/routes/dashboard/patients/index.tsx

import { Button } from "@clinic-app/ui/components/button";
import { DataTable } from "@clinic-app/ui/components/data-table";
import { Input } from "@clinic-app/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { columns } from "@/components/patient/columns";
import { PatientFilters } from "@/components/patient/patient-filters";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/patients/")({
  component: PatientsListPage,
});

function PatientsListPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const { data: patients, isLoading } = useQuery(
    orpc.patients.list.queryOptions({ search, ...filters }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Patient Registry
          </h1>
          <p className="text-muted-foreground">
            Manage and view all pediatric patients
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/dashboard/patients/new">
            <Plus className="h-4 w-4" />
            New Patient
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, MRN, or parent contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <PatientFilters filters={filters} setFilters={setFilters} />
      </div>

      <DataTable
        columns={columns}
        data={patients?.items || []}
        loading={isLoading}
        pagination={{
          page: patients?.page || 1,
          pageCount: patients?.pageCount || 0,
          total: patients?.total || 0,
        }}
      />
    </div>
  );
}
